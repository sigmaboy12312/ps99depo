require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const { WebSocketServer, WebSocket } = require('ws');
const http     = require('http');
const crypto   = require('crypto');
const path     = require('path');
const fs       = require('fs');

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocketServer({ server });

const PORT         = process.env.PORT           || 3001;
const SECRET       = process.env.WEBHOOK_SECRET || 'changeme123';
const BOT_USERNAME = process.env.BOT_USERNAME   || 'PS99GemsBOT';
const START_BAL    = 5_000_000_000;
const DB_FILE      = path.join(__dirname, 'db.json');

// ── JSON DATABASE ────────────────────────────────────
// db.users    = { [username]: { balance, createdAt } }
// db.inventory= { [username]: [{ id, name, img, tier, variant, value, depositedAt }] }

function loadDB() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return { users: {}, inventory: {} }; }
}
function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function ensureUser(db, username) {
  if (!db.users[username]) {
    db.users[username] = { balance: START_BAL, createdAt: Date.now() };
  }
  if (!db.inventory[username]) db.inventory[username] = [];
}
function getBalance(username) {
  const db = loadDB();
  ensureUser(db, username);
  return db.users[username].balance;
}
function addBalance(username, amount) {
  const db = loadDB();
  ensureUser(db, username);
  db.users[username].balance += amount;
  saveDB(db);
  return db.users[username].balance;
}
function addInventoryItem(username, item) {
  const db = loadDB();
  ensureUser(db, username);
  const entry = { id: Date.now() + '_' + crypto.randomBytes(4).toString('hex'), ...item, depositedAt: Date.now() };
  db.inventory[username].unshift(entry);
  saveDB(db);
  return entry;
}
function getInventory(username) {
  const db = loadDB();
  return db.inventory[username] || [];
}
function removeInventoryItem(username, id) {
  const db = loadDB();
  if (!db.inventory[username]) return;
  db.inventory[username] = db.inventory[username].filter(i => i.id !== id);
  saveDB(db);
}

// ── MIDDLEWARE ───────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
// Serve site files from the parent folder — THIS is what makes it non-static
app.use(express.static(path.join(__dirname, '..')));

// ── IN-MEMORY SESSION STATE ──────────────────────────
const wsClients      = new Map(); // wsId → { ws, username }
const depositSessions = new Map(); // code → { wsId, createdAt }
const pendingWithdrawals = new Map();

function pushToUser(username, payload) {
  for (const [, client] of wsClients) {
    if (client.username === username && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(payload));
    }
  }
}

// ── WEBSOCKET ────────────────────────────────────────
wss.on('connection', (ws) => {
  const wsId = crypto.randomBytes(8).toString('hex');
  wsClients.set(wsId, { ws, username: null });
  ws.send(JSON.stringify({ type: 'connected', wsId }));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'identify' && msg.username) {
        const u = msg.username.toLowerCase();
        wsClients.get(wsId).username = u;
        const balance = getBalance(u);
        const inventory = getInventory(u);
        ws.send(JSON.stringify({ type: 'session_data', balance, inventory }));
        console.log(`[WS] ${u} identified — balance: ${balance}`);
      }
    } catch {}
  });

  ws.on('close', () => {
    wsClients.delete(wsId);
    for (const [code, s] of depositSessions.entries()) {
      if (s.wsId === wsId) depositSessions.delete(code);
    }
  });
});

// ── DEPOSIT INIT ─────────────────────────────────────
// Browser calls this when user opens deposit modal → returns 6-char code
app.post('/api/deposit/init', (req, res) => {
  const { wsId } = req.body;
  if (!wsId || !wsClients.has(wsId))
    return res.status(400).json({ error: 'invalid wsId' });

  for (const [code, s] of depositSessions.entries()) {
    if (s.wsId === wsId) depositSessions.delete(code);
  }

  const code = crypto.randomBytes(3).toString('hex').toUpperCase();
  depositSessions.set(code, { wsId, createdAt: Date.now() });
  setTimeout(() => depositSessions.delete(code), 15 * 60 * 1000);

  console.log(`[Deposit] Code ${code} generated for wsId=${wsId}`);
  res.json({ code, botUsername: BOT_USERNAME });
});

// ── TRADE WEBHOOK ────────────────────────────────────
// Bot POSTs here after trade completes.
// Body: { sessionCode, items: [{name, img, tier, variant, value}], gems, secret }
app.post('/api/trade-webhook', (req, res) => {
  const { sessionCode, items, gems, secret } = req.body;

  if (secret !== SECRET) return res.status(403).json({ error: 'forbidden' });
  if (!sessionCode)       return res.status(400).json({ error: 'sessionCode required' });

  const code    = sessionCode.toUpperCase();
  const session = depositSessions.get(code);
  if (!session) return res.status(404).json({ error: 'session not found or expired' });

  const client   = wsClients.get(session.wsId);
  const username = client?.username;

  let totalValue = Number(gems) || 0;
  const processedItems = (items || []).map(item => {
    totalValue += Number(item.value) || 0;
    return item;
  });

  let newBalance = null;
  if (username) {
    newBalance = addBalance(username, totalValue);
    processedItems.forEach(item => addInventoryItem(username, item));
    console.log(`[Deposit] ${username} credited ₿${totalValue} | ${processedItems.length} items`);
  }

  if (client?.ws?.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify({
      type: 'deposit_complete',
      items: processedItems,
      gems: Number(gems) || 0,
      totalValue,
      newBalance,
    }));
  }

  depositSessions.delete(code);
  res.json({ ok: true, totalValue, newBalance });
});

// ── BIO VERIFICATION ─────────────────────────────────
// Client calls this to check if the user put the phrase in their Roblox bio.
app.post('/api/verify-bio', async (req, res) => {
  const { username, phrase } = req.body;
  if (!username || !phrase) return res.status(400).json({ ok: false, error: 'username and phrase required' });

  const axios = require('axios');
  try {
    // Step 1: resolve username → userId
    const searchRes = await axios.post(
      'https://users.roblox.com/v1/usernames/users',
      { usernames: [username], excludeBannedUsers: false },
      { headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }
    );
    const userData = searchRes.data?.data?.[0];
    if (!userData) return res.json({ ok: false, error: 'Roblox user not found' });

    // Step 2: get their bio
    const profileRes = await axios.get(
      `https://users.roblox.com/v1/users/${userData.id}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }
    );
    const bio  = profileRes.data?.description || '';
    const found = bio.toLowerCase().includes(phrase.toLowerCase());

    console.log(`[Verify] ${username} | phrase found: ${found}`);
    res.json({ ok: found, userId: userData.id, displayName: userData.displayName,
               error: found ? null : 'Phrase not found in bio — make sure you saved your profile' });
  } catch (err) {
    console.error('[Verify] Error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not reach Roblox API — try again' });
  }
});

// ── USER DATA API ────────────────────────────────────
app.get('/api/user/:username', (req, res) => {
  const u = req.params.username.toLowerCase();
  res.json({ balance: getBalance(u), inventory: getInventory(u) });
});

// ── AUTH SESSION ────────────────────────────────────
// Browser calls this after user enters their username in deposit modal.
// Links username → wsId so the bot can find the right browser tab.
app.post('/api/auth/register-session', (req, res) => {
  const { robloxUsername, wsId } = req.body;
  if (!robloxUsername || !wsId) return res.status(400).json({ error: 'missing fields' });
  const u = robloxUsername.toLowerCase();
  // Update the WS client record
  const client = wsClients.get(wsId);
  if (client) client.username = u;
  console.log(`[Auth] ${u} registered to wsId=${wsId}`);
  res.json({ ok: true });
});

// ── TRADE DEPOSIT ────────────────────────────────────
// Bot POSTs here after trade completes — no chat code needed.
// Bot auto-detects the trader's Roblox username from the trade API.
app.post('/api/trade-deposit', (req, res) => {
  const { robloxUsername, items, gems, secret } = req.body;
  if (secret !== SECRET) return res.status(403).json({ error: 'forbidden' });
  if (!robloxUsername)   return res.status(400).json({ error: 'robloxUsername required' });

  const u = robloxUsername.toLowerCase();
  let totalValue = Number(gems) || 0;
  const processedItems = (items || []).map(item => {
    totalValue += Number(item.value) || 0;
    return item;
  });

  let newBalance = null;
  newBalance = addBalance(u, totalValue);
  processedItems.forEach(item => addInventoryItem(u, item));
  console.log(`[Deposit] ${u} +₿${totalValue} | ${processedItems.length} items`);

  // Find this user's active browser tab and push the update
  let pushed = false;
  for (const [, client] of wsClients) {
    if (client.username === u && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({ type: 'deposit_complete', items: processedItems, gems: Number(gems)||0, totalValue, newBalance }));
      pushed = true;
      break;
    }
  }
  if (!pushed) console.warn(`[Deposit] ${u} not connected to WS — balance saved but no live push`);

  res.json({ ok: true, totalValue, newBalance });
});

// ── WITHDRAWAL ───────────────────────────────────────
app.post('/api/withdraw/request', (req, res) => {
  const { username, itemIds, gems } = req.body;
  if (!username) return res.status(400).json({ error: 'username required' });

  const u = username.toLowerCase();
  const inv = getInventory(u);
  const itemsToSend = (itemIds || []).map(id => inv.find(i => i.id === id)).filter(Boolean);

  const withdrawalId = crypto.randomBytes(8).toString('hex');
  pendingWithdrawals.set(u, { id: withdrawalId, items: itemsToSend, gems: Number(gems) || 0, createdAt: Date.now() });

  // Remove from inventory immediately
  itemsToSend.forEach(item => removeInventoryItem(u, item.id));

  console.log(`[Withdraw] ${u} — ${itemsToSend.length} items, ${gems || 0} gems`);
  res.json({ ok: true, withdrawalId, botUsername: BOT_USERNAME });
});

app.get('/api/withdraw/pending/:username', (req, res) => {
  if (req.headers['x-bot-secret'] !== SECRET) return res.status(403).json({ error: 'forbidden' });
  const pending = pendingWithdrawals.get(req.params.username.toLowerCase());
  res.json(pending ? { pending: true, ...pending } : { pending: false });
});

app.post('/api/withdraw/complete', (req, res) => {
  const { username, withdrawalId, secret } = req.body;
  if (secret !== SECRET) return res.status(403).json({ error: 'forbidden' });

  const u = username?.toLowerCase();
  const pending = pendingWithdrawals.get(u);
  if (!pending || pending.id !== withdrawalId) return res.status(404).json({ error: 'not found' });

  pendingWithdrawals.delete(u);
  pushToUser(u, { type: 'withdrawal_complete', items: pending.items, gems: pending.gems });
  res.json({ ok: true });
});

// ── START ────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n  PS99Gems server running on http://localhost:${PORT}`);
  console.log(`  Serving site from:   ${path.join(__dirname, '..')}`);
  console.log(`  Database file:       ${DB_FILE}\n`);
});
