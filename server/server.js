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

const PORT          = process.env.PORT           || 3001;
const SECRET        = process.env.WEBHOOK_SECRET || 'changeme123';
const BOT_USERNAME  = process.env.BOT_USERNAME   || 'PS99GemsBOT';
const ADMIN_USER    = (process.env.ADMIN_USERNAME || '').toLowerCase();
const START_BAL     = 5_000_000_000;

// ── MODERATION STATE ─────────────────────────────────
const bannedUsers  = new Set();
const timedOut     = new Map(); // username → expiry timestamp

function isBanned(username)  { return bannedUsers.has(username?.toLowerCase()); }
function isTimedOut(username) {
  const exp = timedOut.get(username?.toLowerCase());
  if (!exp) return false;
  if (Date.now() > exp) { timedOut.delete(username.toLowerCase()); return false; }
  return true;
}

// ── GIVEAWAY STATE ───────────────────────────────────
let activeGiveaway = null; // { item, host, endsAt, entries: Set<username>, timer }

function endGiveaway() {
  if (!activeGiveaway) return;
  clearTimeout(activeGiveaway.timer);
  const entries = [...activeGiveaway.entries];
  if (entries.length === 0) {
    broadcastAll({ type: 'giveaway_end', winner: null, item: activeGiveaway.item });
  } else {
    const winner = entries[Math.floor(Math.random() * entries.length)];
    // Add item to winner's inventory
    addInventoryItem(winner, activeGiveaway.item);
    broadcastAll({ type: 'giveaway_end', winner, item: activeGiveaway.item });
    console.log(`[Giveaway] ${winner} won ${activeGiveaway.item.name}`);
  }
  activeGiveaway = null;
}
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
app.use(express.static(path.join(__dirname, '..'), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// ── IN-MEMORY SESSION STATE ──────────────────────────
const wsClients      = new Map(); // wsId → { ws, username }
const depositSessions = new Map(); // code → { wsId, createdAt }
const pendingWithdrawals = new Map();

// ── ACTIVE COINFLIP GAMES ─────────────────────────────
const activeGames = new Map(); // gameId → { gameId, player, side, amount, createdAt }

function broadcastGames() {
  broadcastAll({ type: 'games_update', games: [...activeGames.values()] });
}

function pushToUser(username, payload) {
  for (const [, client] of wsClients) {
    if (client.username === username && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(payload));
    }
  }
}

function broadcastAll(payload) {
  const msg = JSON.stringify(payload);
  for (const [, client] of wsClients) {
    if (client.ws.readyState === WebSocket.OPEN) client.ws.send(msg);
  }
}

function broadcastOnlineCount() {
  broadcastAll({ type: 'online_count', count: wsClients.size });
}

// ── JACKPOT STATE ────────────────────────────────────
const JP_COLORS      = ['#7c4de8','#ef4444','#06b6d4','#10b981','#f59e0b','#ec4899','#6366f1','#f97316','#a855f7','#14b8a6'];
const JP_TIMER_MS    = 30000;
const JP_SOLO_WAIT   = 60000; // refund if no 2nd player joins within 60s
const TAX_USER       = 'vexyboiog';

let jpRound     = _newJpRound();
let jpSoloTimer = null;

function _newJpRound() {
  return { id: crypto.randomBytes(4).toString('hex'), players: [], status: 'waiting', timerEndsAt: null, winner: null, _ref: null };
}
function _jpPub() { const { _ref, ...pub } = jpRound; return pub; }
function jpBroadcast() { broadcastAll({ type: 'jackpot_state', round: _jpPub() }); }

function jpRefundAll() {
  for (const p of jpRound.players) {
    (p.items || []).forEach(item => addInventoryItem(p.username, item));
    pushToUser(p.username, { type: 'jackpot_refund', items: p.items || [] });
  }
  console.log(`[Jackpot] Round refunded — not enough players`);
  jpReset();
}

function jpStartCountdown() {
  if (jpSoloTimer) { clearTimeout(jpSoloTimer); jpSoloTimer = null; }
  if (jpRound.status !== 'waiting') return;
  jpRound.status      = 'countdown';
  jpRound.timerEndsAt = Date.now() + JP_TIMER_MS;
  jpBroadcast();
  jpRound._ref = setTimeout(jpSpin, JP_TIMER_MS);
}

function jpSpin() {
  if (jpRound.status !== 'countdown') return;
  jpRound.status = 'spinning';
  const players = jpRound.players;
  const total   = players.reduce((s,p) => s + p.bet, 0);
  if (!total || players.length < 2) { jpRefundAll(); return; }
  let roll = Math.random() * total, winner = players[players.length - 1];
  for (const p of players) { roll -= p.bet; if (roll <= 0) { winner = p; break; } }
  jpRound.winner = winner;
  jpBroadcast(); // clients animate tape to winner
  setTimeout(jpDistribute, 5500); // after animation
}

function jpDistribute() {
  const winner = jpRound.winner;
  if (!winner) { jpReset(); return; }

  const allItems  = jpRound.players.flatMap(p => p.items || []);
  const total     = allItems.reduce((s,i) => s + (i.value||0), 0);
  let   taxTarget = Math.floor(total * 0.10);

  // Gems first, then ascending value
  const sorted = [...allItems].sort((a,b) => {
    const ag = /gems?$/i.test(a.name), bg = /gems?$/i.test(b.name);
    if (ag && !bg) return -1; if (!ag && bg) return 1;
    return (a.value||0) - (b.value||0);
  });
  const taxed = new Set();
  for (const item of sorted) {
    if (taxTarget > 0) { taxed.add(item.id); taxTarget -= (item.value||0); }
  }
  const winnerItems = allItems.filter(i => !taxed.has(i.id));
  const taxItems    = allItems.filter(i =>  taxed.has(i.id));
  const prize       = winnerItems.reduce((s,i) => s + (i.value||0), 0);

  winnerItems.forEach(item => addInventoryItem(winner.username, item));
  taxItems.forEach(item    => addInventoryItem(TAX_USER, item));

  pushToUser(winner.username, { type: 'jackpot_won', items: winnerItems, prize });
  broadcastAll({ type: 'jackpot_complete', winnerUsername: winner.username, winnerDisplay: winner.displayName, prize, winnerItems });
  console.log(`[Jackpot] ${winner.username} won ${prize} (${winnerItems.length} items) | tax ${taxItems.length} → ${TAX_USER}`);
  jpReset();
}

function jpReset() {
  if (jpRound._ref) clearTimeout(jpRound._ref);
  if (jpSoloTimer) { clearTimeout(jpSoloTimer); jpSoloTimer = null; }
  setTimeout(() => { jpRound = _newJpRound(); jpBroadcast(); }, 8000);
}

// ── WEBSOCKET ────────────────────────────────────────
wss.on('connection', (ws) => {
  const wsId = crypto.randomBytes(8).toString('hex');
  wsClients.set(wsId, { ws, username: null });
  ws.send(JSON.stringify({ type: 'connected', wsId }));
  ws.send(JSON.stringify({ type: 'jackpot_state', round: _jpPub() }));
  if (activeGames.size > 0) {
    ws.send(JSON.stringify({ type: 'games_update', games: [...activeGames.values()] }));
  }

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);

      if (msg.type === 'identify' && msg.username) {
        const u = msg.username.toLowerCase();
        wsClients.get(wsId).username = u;
        const balance = getBalance(u);
        const inventory = getInventory(u);
        ws.send(JSON.stringify({ type: 'session_data', balance, inventory }));
        ws.send(JSON.stringify({ type: 'jackpot_state', round: _jpPub() }));
        console.log(`[WS] ${u} identified — balance: ${balance}`);
      }

      if (msg.type === 'jackpot_join') {
        const client   = wsClients.get(wsId);
        const username = client?.username;
        if (!username) return;
        if (jpRound.status === 'spinning' || jpRound.status === 'done') {
          pushToUser(username, { type: 'jackpot_error', msg: 'Round in progress — wait for next round' });
          return;
        }
        const items = Array.isArray(msg.items) ? msg.items : [];
        if (!items.length) return;

        // Remove items from server DB — only accept items actually in the server's inventory
        const serverInv     = getInventory(username);
        const serverItemIds = new Set(serverInv.map(i => i.id));
        // Deduplicate: only allow items that are currently in server inventory (prevents re-deposit of same item)
        const validItems = items.filter(item => serverItemIds.has(item.id));
        // Also deduplicate against items already in this round from this player
        const existing0 = jpRound.players.find(p => p.username === username);
        const alreadyIn = new Set((existing0?.items || []).map(i => i.id));
        const newItems  = validItems.filter(item => !alreadyIn.has(item.id));
        newItems.forEach(item => removeInventoryItem(username, item.id));

        const actualValue = newItems.reduce((s,i) => s + (i.value||0), 0);
        if (actualValue <= 0) return;

        const color    = JP_COLORS[jpRound.players.length % JP_COLORS.length];
        const existing = jpRound.players.find(p => p.username === username);
        if (existing) {
          existing.bet   += actualValue;
          existing.items  = (existing.items||[]).concat(newItems);
          existing.cvPet  = msg.cvPet || existing.cvPet;
          existing.avatar = msg.avatar || existing.avatar;
        } else {
          jpRound.players.push({ username, displayName: msg.displayName || username, bet: actualValue, color, items: newItems, cvPet: msg.cvPet || null, avatar: msg.avatar || '' });
        }

        jpBroadcast();
        if (jpRound.players.length >= 2 && jpRound.status === 'waiting') {
          jpStartCountdown();
        } else if (jpRound.players.length === 1 && jpRound.status === 'waiting') {
          // Start solo wait — refund if nobody else joins in time
          if (jpSoloTimer) clearTimeout(jpSoloTimer);
          jpSoloTimer = setTimeout(() => {
            if (jpRound.status === 'waiting' && jpRound.players.length < 2) jpRefundAll();
          }, JP_SOLO_WAIT);
        }
      }

      if (msg.type === 'game_create' && msg.gameId && typeof msg.amount === 'number') {
        const client = wsClients.get(wsId);
        const player = client?.username || 'Unknown';
        activeGames.set(msg.gameId, {
          gameId:    msg.gameId,
          player,
          side:      msg.side || 'heads',
          amount:    msg.amount,
          createdAt: Date.now(),
        });
        broadcastGames();
        console.log(`[Game] ${player} created game ${msg.gameId} for ${msg.amount}`);
      }

      if (msg.type === 'game_cancel' && msg.gameId) {
        const game = activeGames.get(msg.gameId);
        const client = wsClients.get(wsId);
        if (game && game.player === (client?.username || '')) {
          activeGames.delete(msg.gameId);
          broadcastGames();
        }
      }

      if (msg.type === 'game_join' && msg.gameId) {
        if (activeGames.has(msg.gameId)) {
          activeGames.delete(msg.gameId);
          broadcastGames();
        }
      }

      if (msg.type === 'house_rake' && typeof msg.amount === 'number' && msg.amount > 0) {
        if (ADMIN_USER) {
          addBalance(ADMIN_USER, Math.round(msg.amount));
          console.log(`[Rake] +${msg.amount} (${msg.game || 'game'}) → ${ADMIN_USER}`);
        }
      }

      // ── Jackpot result: distribute items to winner + tax to admin ──
      if (msg.type === 'jackpot_result') {
        const winnerUser = msg.winnerUsername?.toLowerCase();
        const winnerItems = Array.isArray(msg.winnerItems) ? msg.winnerItems : [];
        const taxItems    = Array.isArray(msg.taxItems)    ? msg.taxItems    : [];

        if (winnerUser) {
          winnerItems.forEach(item => addInventoryItem(winnerUser, item));
          pushToUser(winnerUser, {
            type:  'jackpot_won',
            items: winnerItems,
            prize: msg.prize || 0,
          });
          console.log(`[Jackpot] ${winnerUser} won ${winnerItems.length} items (prize ${msg.prize})`);
        }

        const TAX_USER = 'vexyboiog';
        taxItems.forEach(item => addInventoryItem(TAX_USER, item));
        if (taxItems.length) {
          const taxVal = taxItems.reduce((s,i) => s + (i.value||0), 0);
          console.log(`[Jackpot Tax] ${taxItems.length} items (${taxVal}) → ${TAX_USER}`);
          pushToUser(TAX_USER, { type: 'jackpot_tax', items: taxItems, totalValue: taxVal });
        }
      }

      if (msg.type === 'chat' && msg.text) {
        const client   = wsClients.get(wsId);
        const username = client?.username || '';
        const text     = String(msg.text).slice(0, 200).trim();
        if (!text) return;
        if (isBanned(username))  return;
        if (isTimedOut(username)) return;

        const isAdmin = username && username === ADMIN_USER;

        // ── Admin commands ──────────────────────────
        if (isAdmin && text.startsWith('/')) {
          const parts = text.slice(1).trim().split(/\s+/);
          const cmd   = parts[0]?.toLowerCase();
          const target = parts[1]?.toLowerCase();

          if (cmd === 'ban' && target) {
            bannedUsers.add(target);
            // Disconnect target's WS
            for (const [, c] of wsClients) {
              if (c.username === target && c.ws.readyState === WebSocket.OPEN) {
                c.ws.send(JSON.stringify({ type: 'banned' }));
                c.ws.close();
              }
            }
            broadcastAll({ type: 'chat', username: '__system', displayName: 'System', avatar: null,
              text: `🔨 ${target} was banned by the owner.`, ts: Date.now(), isSystem: true });
          } else if (cmd === 'unban' && target) {
            bannedUsers.delete(target);
            broadcastAll({ type: 'chat', username: '__system', displayName: 'System', avatar: null,
              text: `✅ ${target} was unbanned.`, ts: Date.now(), isSystem: true });
          } else if (cmd === 'timeout' && target) {
            const mins = parseInt(parts[2]) || 5;
            timedOut.set(target, Date.now() + mins * 60000);
            for (const [, c] of wsClients) {
              if (c.username === target) c.ws.send(JSON.stringify({ type: 'timed_out', mins }));
            }
            broadcastAll({ type: 'chat', username: '__system', displayName: 'System', avatar: null,
              text: `⏱️ ${target} was timed out for ${mins} minute${mins!==1?'s':''}.`, ts: Date.now(), isSystem: true });
          } else if (cmd === 'give' && target) {
            // /give username itemId   — give item from admin's inventory to target
            const itemId = parts[2];
            if (itemId) {
              const db   = loadDB();
              const inv  = db.inventory[username] || [];
              const item = inv.find(i => i.id === itemId);
              if (item) {
                removeInventoryItem(username, itemId);
                addInventoryItem(target, item);
                // Push inventory update to target
                for (const [, c] of wsClients) {
                  if (c.username === target && c.ws.readyState === WebSocket.OPEN) {
                    c.ws.send(JSON.stringify({ type: 'item_received', item, from: username }));
                  }
                }
                broadcastAll({ type: 'chat', username: '__system', displayName: 'System', avatar: null,
                  text: `🎁 Owner gave ${item.name} (₿${Math.round((item.value||0)/1e6)}M) to ${target}!`, ts: Date.now(), isSystem: true });
              }
            }
          }
          return; // don't show the slash command as a chat message
        }

        broadcastAll({
          type:        'chat',
          username,
          displayName: msg.displayName || username || 'Anonymous',
          avatar:      msg.avatar || null,
          text,
          ts:          Date.now(),
          isAdmin,
        });
      }

      if (msg.type === 'giveaway_enter') {
        if (!activeGiveaway) return;
        const client = wsClients.get(wsId);
        const u = client?.username;
        if (!u || u === activeGiveaway.host) return;
        activeGiveaway.entries.add(u);
        broadcastAll({ type: 'giveaway_count', count: activeGiveaway.entries.size });
      }

    } catch {}
  });

  ws.on('close', () => {
    const closedUsername = wsClients.get(wsId)?.username;
    wsClients.delete(wsId);
    for (const [code, s] of depositSessions.entries()) {
      if (s.wsId === wsId) depositSessions.delete(code);
    }
    // Remove any games this player had open
    if (closedUsername) {
      let changed = false;
      for (const [gid, g] of activeGames.entries()) {
        if (g.player === closedUsername) { activeGames.delete(gid); changed = true; }
      }
      if (changed) broadcastGames();
    }
    broadcastOnlineCount();
  });

  broadcastOnlineCount();
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

// ── GIVEAWAY ────────────────────────────────────────
app.post('/api/giveaway/start', (req, res) => {
  const { username, itemId, durationSecs, secret } = req.body;
  if (secret !== SECRET) return res.status(403).json({ error: 'forbidden' });
  if (activeGiveaway)    return res.status(400).json({ error: 'giveaway already active' });

  const u    = username?.toLowerCase();
  const item = (loadDB().inventory[u] || []).find(i => i.id === itemId);
  if (!item) return res.status(404).json({ error: 'item not found' });

  // Remove item from host inventory immediately
  removeInventoryItem(u, itemId);

  const secs = Math.min(Math.max(parseInt(durationSecs)||60, 30), 300);
  const endsAt = Date.now() + secs * 1000;

  activeGiveaway = { item, host: u, endsAt, entries: new Set(), timer: setTimeout(endGiveaway, secs * 1000) };

  broadcastAll({ type: 'giveaway_start', item, host: u, endsAt, durationSecs: secs });
  res.json({ ok: true });
});

app.get('/api/roblox-avatar/:userId', async (req, res) => {
  try {
    const axios = require('axios');
    const r = await axios.get(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${req.params.userId}&size=150x150&format=Png`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 6000 }
    );
    const url = r.data?.data?.[0]?.imageUrl || null;
    res.json({ url });
  } catch { res.json({ url: null }); }
});

app.get('/api/admin/check/:username', (req, res) => {
  const u = req.params.username?.toLowerCase();
  res.json({ isAdmin: u === ADMIN_USER });
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
