const PSG_ICON = '<span style="font-weight:900;letter-spacing:-0.02em;margin-right:1px;"></span>';

/* ==================================================
   ACCOUNT SYSTEM  -  Roblox bio verification
================================================== */

// -- Helpers ------------------------------------------
function currentUser() {
  return {
    username:    localStorage.getItem('ps99g_rblx_user')    || '',
    uid:         localStorage.getItem('ps99g_rblx_uid')     || '',
    displayName: localStorage.getItem('ps99g_rblx_display') || '',
    avatar:      localStorage.getItem('ps99g_rblx_avatar')  || '',
    verified:    localStorage.getItem('ps99g_rblx_verified') === '1',
  };
}

function _genVerifyPhrase() {
  const words = ['swift','neon','jade','frost','bolt','moon','peak','tide','gold','crimson',
                 'arc','wave','blaze','echo','iron','oak','sage','vale','zen','rune'];
  const pick = () => words[Math.floor(Math.random() * words.length)];
  return `ps99depo-${pick()}-${pick()}-${1000 + Math.floor(Math.random() * 9000)}`;
}

async function _fetchRobloxAvatar(userId) {
  try {
    const r = await fetch(`${_SERVER_HTTP}/api/roblox-avatar/${userId}`);
    const d = await r.json();
    return d.url || null;
  } catch { return null; }
}

function _applyUserEverywhere() {
  const u = currentUser();
  if (!u.username) return;

  // Nav avatars
  document.querySelectorAll('.nav-avatar img').forEach(img => {
    if (u.avatar) { img.src = u.avatar; img.onerror = null; }
  });

  // Topbar / sidebar balance labels
  document.querySelectorAll('[data-user-name]').forEach(el => {
    el.textContent = u.displayName || u.username;
  });

  // Sidebar username line
  document.querySelectorAll('#sidebar-username').forEach(el => {
    el.innerHTML = u.avatar
      ? `<img src="${u.avatar}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;margin-right:6px;vertical-align:middle;">${u.displayName || u.username}`
      : (u.displayName || u.username);
  });
}


// -- LOGIN SCREEN --------------------------------------
function _showLoginScreen() {
  if (document.getElementById('login-screen')) return;
  const phrase = _genVerifyPhrase();
  localStorage.setItem('ps99g_verify_phrase', phrase);

  const el = document.createElement('div');
  el.id = 'login-screen';
  el.style.cssText = `position:fixed;inset:0;z-index:999999;overflow-y:auto;
    background:radial-gradient(ellipse 80% 60% at 30% 40%,rgba(124,77,232,.18) 0%,transparent 60%),
               radial-gradient(ellipse 60% 50% at 80% 20%,rgba(6,182,212,.1) 0%,transparent 55%),#080615;
    display:flex;align-items:center;justify-content:center;padding:20px;
    font-family:'Segoe UI',system-ui,sans-serif;`;

  el.innerHTML = `
  <div style="width:min(440px,100%);background:linear-gradient(160deg,#130f2e,#09071a);
              border:1px solid rgba(124,77,232,.35);border-radius:24px;
              box-shadow:0 0 80px rgba(124,77,232,.2),0 40px 80px rgba(0,0,0,.7);overflow:hidden;">

    <!-- Header -->
    <div style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,.06);">
      <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:16px;">
        <div style="width:40px;height:40px;background:linear-gradient(135deg,#4c1d95,#7c4de8 50%,#06b6d4);
                    border-radius:11px;display:flex;align-items:center;justify-content:center;
                    box-shadow:0 0 20px rgba(124,77,232,.6);">
          <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
            <polygon points="12,2 20,8 17,20 7,20 4,8" fill="white" opacity=".9"/>
            <polygon points="12,2 20,8 12,6" fill="white" opacity=".5"/>
          </svg>
        </div>
        <span style="font-size:1.4rem;font-weight:900;color:#fff;letter-spacing:-.02em;"><span style="color:#f472b6;font-weight:900;">99</span><span style="background:linear-gradient(90deg,#e879f9,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">DEPO</span></span>
      </div>
      <div style="font-size:1.1rem;font-weight:900;color:#fff;margin-bottom:4px;">Login / Sign Up</div>
      <div style="font-size:.78rem;color:rgba(148,163,184,.6);">Verify your Roblox account to continue</div>
    </div>

    <!-- Steps -->
    <div style="padding:24px 32px 32px;display:flex;flex-direction:column;gap:20px;">

      <!-- Step 1 -->
      <div id="login-step1">
        <div style="font-size:.6rem;font-weight:900;text-transform:uppercase;letter-spacing:.14em;color:rgba(124,77,232,.8);margin-bottom:10px;">Step 1  -  Your Roblox Username</div>
        <input id="login-input" type="text" placeholder="YourRobloxName" autocomplete="off" spellcheck="false"
          style="width:100%;padding:12px 14px;background:rgba(255,255,255,.05);border:1.5px solid rgba(124,77,232,.3);
                 border-radius:11px;color:#fff;font-size:.95rem;font-family:inherit;outline:none;
                 box-sizing:border-box;transition:border .15s;margin-bottom:8px;"
          onfocus="this.style.borderColor='rgba(124,77,232,.7)'"
          onblur="this.style.borderColor='rgba(124,77,232,.3)'"
          oninput="_loginStep1Input()"
          onkeydown="if(event.key==='Enter')_loginContinue()">
        <button onclick="_loginContinue()" id="login-continue-btn"
          style="width:100%;padding:12px;background:linear-gradient(135deg,#7c4de8,#6d28d9);border:none;
                 border-radius:11px;color:#fff;font-size:.9rem;font-weight:900;cursor:pointer;
                 box-shadow:0 0 20px rgba(124,77,232,.4);transition:all .18s;">
          Continue ->
        </button>
      </div>

      <!-- Step 2 (hidden until username entered) -->
      <div id="login-step2" style="display:none;opacity:0;transition:opacity .3s;">
        <div style="font-size:.6rem;font-weight:900;text-transform:uppercase;letter-spacing:.14em;color:rgba(124,77,232,.8);margin-bottom:10px;">Step 2  -  Paste This In Your Roblox Bio</div>
        <div style="background:rgba(0,0,0,.4);border:1.5px solid rgba(124,77,232,.3);border-radius:11px;
                    padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;">
          <span id="login-phrase" style="font-size:.82rem;font-weight:800;color:#a67dff;font-family:monospace;letter-spacing:.04em;word-break:break-all;">${phrase}</span>
          <button onclick="_copyPhrase()" id="copy-btn"
            style="flex-shrink:0;padding:6px 14px;background:rgba(124,77,232,.2);border:1px solid rgba(124,77,232,.4);
                   border-radius:8px;color:#a67dff;font-size:.72rem;font-weight:800;cursor:pointer;transition:all .15s;white-space:nowrap;">
            Copy
          </button>
        </div>
        <div style="font-size:.72rem;color:rgba(148,163,184,.6);margin-bottom:14px;line-height:1.5;">
          Go to <strong style="color:#fff;">roblox.com -> Profile -> Edit -> About</strong> and paste the code. Then come back and hit Verify.
        </div>
        <button onclick="_loginVerify()" id="verify-btn"
          style="width:100%;padding:12px;background:linear-gradient(135deg,#22c55e,#16a34a);border:none;
                 border-radius:11px;color:#fff;font-size:.9rem;font-weight:900;cursor:pointer;
                 box-shadow:0 0 20px rgba(34,197,94,.35);transition:all .18s;">
          Verify ->
        </button>
      </div>

      <!-- Status / Error -->
      <div id="login-status" style="font-size:.75rem;min-height:18px;font-weight:700;text-align:center;"></div>

    </div>

    <div style="padding:0 32px 20px;text-align:center;font-size:.62rem;color:rgba(100,116,139,.45);">
      Entertainment only . No real money . 99DEPO fan site
    </div>
  </div>`;

  document.body.appendChild(el);
  setTimeout(() => document.getElementById('login-input')?.focus(), 150);
}

function _loginStep1Input() {
  const v = (document.getElementById('login-input')?.value || '').trim();
  const s2 = document.getElementById('login-step2');
  if (v.length >= 3 && s2 && s2.style.display !== 'block') {
    // Don't auto-show step 2 yet  -  wait for Continue click
  }
}

function _loginContinue() {
  const username = (document.getElementById('login-input')?.value || '').trim();
  const st = document.getElementById('login-status');
  if (!username || username.length < 3) {
    if (st) { st.style.color = '#f87171'; st.textContent = 'Enter a valid Roblox username'; }
    return;
  }
  if (st) st.textContent = '';
  const s2 = document.getElementById('login-step2');
  if (s2) { s2.style.display = 'block'; requestAnimationFrame(() => s2.style.opacity = '1'); }
  document.getElementById('login-continue-btn').textContent = 'Update username';
}

function _copyPhrase() {
  const phrase = document.getElementById('login-phrase')?.textContent || '';
  navigator.clipboard.writeText(phrase).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = phrase; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
  });
  const btn = document.getElementById('copy-btn');
  if (btn) { btn.textContent = 'Copied!'; btn.style.color = '#4ade80'; setTimeout(() => { btn.textContent = 'Copy'; btn.style.color = '#a67dff'; }, 2000); }
}

async function _loginVerify() {
  const username = (document.getElementById('login-input')?.value || '').trim();
  const phrase   = localStorage.getItem('ps99g_verify_phrase') || '';
  const btn      = document.getElementById('verify-btn');
  const st       = document.getElementById('login-status');

  if (!username || !phrase) return;
  if (btn) { btn.textContent = 'Checking...'; btn.disabled = true; }
  if (st)  { st.style.color = '#94a3b8'; st.textContent = 'Checking your Roblox bio...'; }

  try {
    const r = await fetch(_SERVER_HTTP + '/api/verify-bio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, phrase }),
    });
    const d = await r.json();

    if (d.ok) {
      // Verified  -  save account data
      localStorage.setItem('ps99g_rblx_user',     username.toLowerCase());
      localStorage.setItem('ps99g_rblx_uid',      d.userId || '');
      localStorage.setItem('ps99g_rblx_display',  d.displayName || username);
      localStorage.setItem('ps99g_rblx_verified', '1');

      // Fetch their Roblox avatar
      if (d.userId) {
        if (st) st.textContent = 'Loading your avatar...';
        const avatarUrl = await _fetchRobloxAvatar(d.userId);
        if (avatarUrl) localStorage.setItem('ps99g_rblx_avatar', avatarUrl);
      }

      // Load server balance
      try {
        const br = await fetch(_SERVER_HTTP + '/api/user/' + encodeURIComponent(username.toLowerCase()));
        if (br.ok) {
          const bd = await br.json();
          if (typeof bd.balance === 'number') setBalance(bd.balance);
          if (Array.isArray(bd.inventory) && bd.inventory.length)
            localStorage.setItem('ps99g_inv', JSON.stringify(bd.inventory));
        }
      } catch {}

      _connectWS();
      _applyUserEverywhere();
      refreshBal();

      // Success screen
      if (st) { st.style.color = '#4ade80'; st.textContent = ''; }
      _showVerifySuccess(d.displayName || username, localStorage.getItem('ps99g_rblx_avatar'));

    } else {
      if (st) { st.style.color = '#f87171'; st.textContent = d.error || 'Code not found in your bio. Make sure you pasted it and saved.'; }
      if (btn) { btn.textContent = 'Verify ->'; btn.disabled = false; }
    }
  } catch {
    if (st) { st.style.color = '#f87171'; st.textContent = 'Server offline  -  try again shortly.'; }
    if (btn) { btn.textContent = 'Verify ->'; btn.disabled = false; }
  }
}

function _showVerifySuccess(displayName, avatarUrl) {
  const screen = document.getElementById('login-screen');
  if (!screen) return;
  screen.innerHTML = `
    <div style="width:min(440px,100%);background:linear-gradient(160deg,#0d1f14,#09071a);
                border:1px solid rgba(34,197,94,.35);border-radius:24px;padding:40px 32px;text-align:center;
                box-shadow:0 0 60px rgba(34,197,94,.15),0 40px 80px rgba(0,0,0,.7);">
      ${avatarUrl ? `<img src="${avatarUrl}" style="width:80px;height:80px;border-radius:50%;border:3px solid rgba(34,197,94,.6);box-shadow:0 0 24px rgba(34,197,94,.4);margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;">` : ''}
      <div style="font-size:1.3rem;font-weight:900;color:#fff;margin-bottom:6px;">Welcome, ${displayName}!</div>
      <div style="font-size:.8rem;color:rgba(148,163,184,.6);margin-bottom:24px;">Account verified  -  you're all set</div>
      <button onclick="_enterSiteAfterVerify()"
        style="padding:14px 40px;background:linear-gradient(135deg,#22c55e,#16a34a);border:none;border-radius:12px;
               color:#fff;font-size:1rem;font-weight:900;cursor:pointer;box-shadow:0 0 24px rgba(34,197,94,.45);transition:all .18s;">
        Enter Site ->
      </button>
    </div>`;
}

function _enterSiteAfterVerify() {
  const screen = document.getElementById('login-screen');
  if (screen) {
    screen.style.transition = 'opacity .4s ease';
    screen.style.opacity = '0';
    setTimeout(() => { screen.remove(); _applyUserEverywhere(); }, 400);
  }
}

// -- SILENT AUTO-LOGIN (returning users) ---------------
function _silentLoad() {
  const u = currentUser();
  if (!u.username) return;
  _connectWS();
  _applyUserEverywhere();
  fetch(_SERVER_HTTP + '/api/user/' + encodeURIComponent(u.username))
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      if (d?.balance != null) { setBalance(d.balance); refreshBal(); }
      if (Array.isArray(d?.inventory) && d.inventory.length)
        localStorage.setItem('ps99g_inv', JSON.stringify(d.inventory));
    }).catch(() => {});
}


function _updateSidebarUsername() { _applyUserEverywhere(); }

document.addEventListener('DOMContentLoaded', () => {
  const expiry = localStorage.getItem('ps99g_login_expiry');
  if (expiry && Date.now() > parseInt(expiry, 10)) {
    ['ps99g_rblx_verified','ps99g_rblx_user','ps99g_rblx_display',
     'ps99g_rblx_uid','ps99g_rblx_avatar','ps99g_login_expiry'].forEach(k => localStorage.removeItem(k));
  }
  const u = currentUser();
  if (u.username && u.verified) {
    _silentLoad();
    // Re-fetch avatar if missing (CORS used to block this, now proxied through server)
    if (!u.avatar && u.uid) {
      _fetchRobloxAvatar(u.uid).then(url => {
        if (url) {
          localStorage.setItem('ps99g_rblx_avatar', url);
          _applyUserEverywhere();
        }
      });
    }
  }
  // Unverified users are handled by initVerification() further below
});

function fmtPSG(n) {
  function r(x) { return +(x.toFixed(x >= 100 ? 0 : x >= 10 ? 1 : 2)); }
  if (n >= 1e9) return r(n / 1e9) + 'B';
  if (n >= 1e6) return r(n / 1e6) + 'M';
  if (n >= 1e3) return r(n / 1e3) + 'K';
  return Math.round(n).toLocaleString();
}
function fmtB(n) { return fmtPSG(n); }

/* -- WEBSOCKET  -  real-time link to trade-bot server -- */
// Set SERVER_URL to your deployed server (e.g. 'https://myapp.railway.app')
// Leave as '' to auto-detect (localhost in dev, same host in prod)
const _SERVER_OVERRIDE = 'https://ps99depo.up.railway.app';

const _isLocal = location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname === '';
const _SERVER_HTTP = _SERVER_OVERRIDE || (_isLocal ? 'http://localhost:3001' : 'https://' + location.hostname);
const _WS_URL     = _SERVER_OVERRIDE
  ? _SERVER_OVERRIDE.replace('https://', 'wss://').replace('http://', 'ws://')
  : (_isLocal ? 'ws://localhost:3001' : 'wss://' + location.hostname);

let _wsConn = null;
let _wsId   = null;

function _connectWS() {
  if (_wsConn && (_wsConn.readyState === WebSocket.OPEN || _wsConn.readyState === WebSocket.CONNECTING)) return;
  try {
    _wsConn = new WebSocket(_WS_URL);
    _wsConn.onopen = () => console.log('[WS] Connected to trade server');
    _wsConn.onmessage = e => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }

      if (msg.type === 'connected') {
        _wsId = msg.wsId;
        // Identify ourselves so server can load our real balance
        const savedUser = localStorage.getItem('ps99g_rblx_user');
        if (savedUser) {
          _wsConn.send(JSON.stringify({ type: 'identify', username: savedUser }));
        }

      } else if (msg.type === 'session_data') {
        // Server sent our real balance + inventory  -  use these as truth
        if (typeof msg.balance === 'number') {
          setBalance(msg.balance);
          refreshBal();
        }
        if (Array.isArray(msg.inventory) && msg.inventory.length) {
          try { localStorage.setItem('ps99g_inv', JSON.stringify(msg.inventory)); } catch {}
        }

      } else if (msg.type === 'deposit_complete') {
        // Update balance from server response
        if (typeof msg.newBalance === 'number') {
          setBalance(msg.newBalance);
          refreshBal();
        }
        // Re-sync inventory from server so item IDs match server DB
        const _savedUser = localStorage.getItem('ps99g_rblx_user');
        if (_savedUser && _wsConn && _wsConn.readyState === WebSocket.OPEN) {
          _wsConn.send(JSON.stringify({ type: 'identify', username: _savedUser }));
        }
        _depShowRealSuccess(msg.items, msg.gems);

      } else if (msg.type === 'online_count') {
        _updateOnlineCount(msg.count);

      } else if (msg.type === 'chat') {
        // Skip echo of our own messages (already rendered optimistically)
        const me = currentUser();
        if (!me.username || msg.username !== me.username) _renderChatMsg(msg, false);

      } else if (msg.type === 'banned') {
        alert('You have been banned from 99Depo.');
        localStorage.clear(); location.href = '/home.html';

      } else if (msg.type === 'timed_out') {
        showToast(`You are timed out for ${msg.mins} minute${msg.mins!==1?'s':''}.`, 'info');

      } else if (msg.type === 'item_received') {
        showToast(`You received ${msg.item?.name} from the owner!`, 'win');
        try {
          const inv = JSON.parse(localStorage.getItem('ps99g_inv') || '[]');
          inv.unshift(msg.item);
          localStorage.setItem('ps99g_inv', JSON.stringify(inv));
        } catch {}

      } else if (msg.type === 'giveaway_start') {
        _showGiveawayInChat(msg);

      } else if (msg.type === 'giveaway_count') {
        const el = document.getElementById('giveaway-entry-count');
        if (el) el.textContent = msg.count + ' entered';

      } else if (msg.type === 'giveaway_end') {
        _showGiveawayResult(msg);

      } else if (msg.type === 'tip_sent') {
        showToast(`Tip sent! (${fmtPSG(msg.total || 0)})`, 'win');
        if (Array.isArray(msg.inventory)) try { localStorage.setItem('ps99g_inv', JSON.stringify(msg.inventory)); } catch {}
        if (typeof msg.balance === 'number') { setBalance(msg.balance); refreshBal(); }

      } else if (msg.type === 'tip_received') {
        showToast(`You received a tip worth ${fmtPSG(msg.total || 0)}!`, 'win');
        if (Array.isArray(msg.inventory)) try { localStorage.setItem('ps99g_inv', JSON.stringify(msg.inventory)); } catch {}
        if (typeof msg.balance === 'number') { setBalance(msg.balance); refreshBal(); }

      } else if (msg.type === 'withdrawal_complete') {
        showToast('Withdrawal sent! Check your trade window.', 'info');

      } else if (msg.type === 'games_update') {
        if (typeof _handleServerGames === 'function') _handleServerGames(msg.games || []);
      } else if (typeof window._wsPageHandler === 'function') {
        window._wsPageHandler(msg);
      }
    };
    _wsConn.onclose = () => {
      _wsId = null;
      setTimeout(_connectWS, 5000); // auto-reconnect
    };
    _wsConn.onerror = () => _wsConn.close();
  } catch (err) {
    console.warn('[WS] Could not connect to trade server  -  deposit will use preview mode');
  }
}

function depClearStatus() {
  const el = document.getElementById('dep-reg-status');
  if (el) el.textContent = '';
}

async function _depRegisterUser() {
  const input  = document.getElementById('dep-rblx-user');
  const status = document.getElementById('dep-reg-status');
  const btn    = document.getElementById('dep-reg-btn');
  const username = (input?.value || '').trim();

  if (!username) {
    if (status) { status.textContent = 'Enter your Roblox username first'; status.style.color = '#f87171'; }
    return;
  }
  if (!_wsId) {
    if (status) { status.textContent = 'Connecting to server...'; status.style.color = '#94a3b8'; }
    _connectWS();
    setTimeout(_depRegisterUser, 1500);
    return;
  }

  if (btn) { btn.textContent = '...'; btn.disabled = true; }

  try {
    const r = await fetch(_SERVER_HTTP + '/api/auth/register-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ robloxUsername: username, wsId: _wsId }),
    });
    const d = await r.json();
    if (d.ok) {
      localStorage.setItem('ps99g_rblx_user', username.toLowerCase());
      if (status) { status.textContent = 'OK Ready  -  now send a trade to the bot in-game'; status.style.color = '#4ade80'; }
      if (btn) { btn.textContent = 'Waiting...'; btn.style.background = 'rgba(34,197,94,.2)'; btn.style.color = '#4ade80'; btn.style.boxShadow = 'none'; }
    } else {
      throw new Error(d.error || 'Server error');
    }
  } catch (err) {
    if (status) { status.textContent = 'Server offline  -  try again'; status.style.color = '#f87171'; }
    if (btn) { btn.textContent = 'Ready ->'; btn.disabled = false; }
  }
}

async function _fetchDepositCode() {
  const el = document.getElementById('dep-code-display');
  if (!el || !_wsId) return;
  el.textContent = '...';
  try {
    const r = await fetch(_SERVER_HTTP + '/api/deposit/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wsId: _wsId }),
    });
    const d = await r.json();
    if (d.code) el.textContent = d.code;
    else el.textContent = 'Error  -  retry';
  } catch {
    if (el) el.textContent = 'Server offline';
  }
}

/* -- BALANCE -- */
const BAL_KEY = 'ps99g_bal';
let _bal = parseInt(localStorage.getItem(BAL_KEY)) || 0;

function getBalance()  { return _bal; }
function setBalance(n) { _bal = Math.max(0, Math.round(n)); localStorage.setItem(BAL_KEY, _bal); refreshBal(); }
function addBal(n)     { setBalance(_bal + n); }
function deductBal(n)  { if (n > _bal) return false; setBalance(_bal - n); return true; }

function _invTotal() {
  return getInventory().reduce((s,i) => s + (i.value||0), 0);
}

function refreshBal() {
  const t = _invTotal();
  document.querySelectorAll('[data-bal]').forEach(el => { el.textContent = fmtPSG(t); });
  _updateWalletDisplay();
}

function claimFree() {
  const u = currentUser();
  if (!u.username) { showToast('Login first!', 'info'); return; }
  if (typeof CV === 'undefined' || !CV.length) { showToast('CV not loaded yet', 'info'); return; }
  const pool = CV.filter(p => p.tier === 'Huge' && p.n >= 250e6 && p.n <= 3e9).sort(() => Math.random() - 0.5);
  const picks = [];
  let total = 0;
  for (const p of pool) {
    if (total >= 5e9 || picks.length >= 5) break;
    picks.push(p);
    total += p.n;
  }
  if (!picks.length) { showToast('CV not loaded', 'info'); return; }
  const items = picks.map(p => ({ name: p.name, img: p.img, tier: p.tier, color: p.color, value: p.n, variant: 'Normal' }));
  fetch(_SERVER_HTTP + '/api/claim-free', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: u.username, items }),
  }).then(r => r.ok ? r.json() : null)
    .then(d => {
      if (d?.ok) {
        items.forEach(item => _addToInv({ name: item.name, img: item.img, tier: item.tier, color: item.color }, 'Normal', item.value));
        showToast(`Claimed ${picks.length} pets worth ${fmtPSG(total)}!`, 'win');
      } else { showToast('Claim failed — try again', 'info'); }
    }).catch(() => {
      items.forEach(item => _addToInv({ name: item.name, img: item.img, tier: item.tier, color: item.color }, 'Normal', item.value));
      addBal(total);
      showToast(`Claimed ${picks.length} pets!`, 'win');
    });
}

/* -- TOAST -- */
function showToast(msg, type = 'info') {
  let wrap = document.getElementById('toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toast-wrap';
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  const icons = { win: 'OK', lose: 'X', info: '*' };
  t.innerHTML = `<span>${icons[type] || '*'}</span><span>${msg}</span>`;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3400);
}

/* -- PET VALUE SYSTEM --
   Multipliers: Normal 1x . Golden 1.5x . Rainbow 2x . Shiny 2x . Shiny Golden 3x . Rainbow Shiny 5x
   Scale: 1 PSG ~ 1M in-game diamonds. Huge Rainbow Shiny hard-capped below 1B (38Mx5=190M OK). */
function makePet(name, img, tier, color, n) {
  return { name, img, tier, color,
    n,                          // Normal  1x
    g:  Math.round(n * 1.5),   // Golden  1.5x
    r:  n * 2,                  // Rainbow 2x
    sn: n * 2,                  // Shiny   2x
    sg: n * 3,                  // Shiny Golden 3x
    sr: n * 5,                  // Rainbow Shiny 5x
  };
}

const VARIANTS = [
  { key: 'n',  label: 'Normal',        mult: 1,   color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  { key: 'g',  label: 'Golden',        mult: 1.5, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)'  },
  { key: 'r',  label: 'Rainbow',       mult: 2,   color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
  { key: 'sn', label: 'Shiny',         mult: 2,   color: '#38bdf8', bg: 'rgba(56,189,248,0.1)'  },
  { key: 'sg', label: 'Shiny Golden',  mult: 3,   color: '#fb923c', bg: 'rgba(251,146,60,0.1)'  },
  { key: 'sr', label: 'Rainbow Shiny', mult: 5,   color: '#f472b6', bg: 'rgba(244,114,182,0.1)' },
];

const C = '#ff5c1a', T = '#fbbf24', H = '#ef4444'; // tier colors

/* -- RANK SYSTEM -- */
const RANKS = [
  { name:'Bronze',  min:0,       color:'#cd7f32', bg:'rgba(205,127,50,.15)',
    icon:`<svg viewBox="0 0 18 18" width="14" height="14"><circle cx="9" cy="9" r="8" fill="none" stroke="#cd7f32" stroke-width="1.1" opacity=".7"/><path d="M4.5 12.5L9 6L13.5 12.5" fill="none" stroke="#cd7f32" stroke-width="1.3" stroke-linejoin="round"/><path d="M7 11L9 6L11 11" fill="#cd7f32"/><path d="M9 6L9 4.5" stroke="#cd7f32" stroke-width="1.2"/><circle cx="9" cy="4" r="1" fill="#cd7f32"/></svg>` },
  { name:'Silver',  min:50e6,    color:'#cbd5e1', bg:'rgba(203,213,225,.12)',
    icon:`<svg viewBox="0 0 18 18" width="14" height="14"><circle cx="9" cy="9" r="8" fill="none" stroke="#cbd5e1" stroke-width="1.1" opacity=".7"/><path d="M4.5 12L9 5.5L13.5 12" fill="none" stroke="#cbd5e1" stroke-width="1.3" stroke-linejoin="round"/><path d="M6.8 10.5L9 5.5L11.2 10.5" fill="rgba(203,213,225,.45)"/><path d="M9 10.5L9 13.5" stroke="#cbd5e1" stroke-width="1.2"/><path d="M7 5.5L9 7.5L11 5.5" stroke="#cbd5e1" stroke-width=".8" fill="none"/></svg>` },
  { name:'Gold',    min:500e6,   color:'#fbbf24', bg:'rgba(251,191,36,.15)',
    icon:`<svg viewBox="0 0 18 18" width="14" height="14"><circle cx="9" cy="9" r="8" fill="none" stroke="#fbbf24" stroke-width="1.2" opacity=".8"/><path d="M4 12L9 4.5L14 12" fill="none" stroke="#fbbf24" stroke-width="1.4" stroke-linejoin="round"/><path d="M6.5 10L9 4.5L11.5 10Z" fill="#fbbf24"/><path d="M9 4.5L9 3" stroke="#fbbf24" stroke-width="1.3"/><circle cx="9" cy="2.5" r="1.2" fill="#fbbf24"/><path d="M6.5 10L4 12" stroke="#fbbf24" stroke-width="1.2"/><path d="M11.5 10L14 12" stroke="#fbbf24" stroke-width="1.2"/></svg>` },
  { name:'Platinum',min:5e9,     color:'#2dd4bf', bg:'rgba(45,212,191,.12)',
    icon:`<svg viewBox="0 0 18 18" width="14" height="14"><circle cx="9" cy="9" r="8" fill="none" stroke="#2dd4bf" stroke-width="1.2" opacity=".8"/><path d="M4 12.5L9 4L14 12.5" fill="none" stroke="#2dd4bf" stroke-width="1.3" stroke-linejoin="round"/><path d="M6 11L9 4L12 11L9 14.5Z" fill="rgba(45,212,191,.3)" stroke="#2dd4bf" stroke-width=".8" stroke-linejoin="round"/><path d="M7.2 9.5L9 4L10.8 9.5Z" fill="#2dd4bf"/></svg>` },
  { name:'Diamond', min:50e9,    color:'#818cf8', bg:'rgba(129,140,248,.15)',
    icon:`<svg viewBox="0 0 18 18" width="14" height="14"><circle cx="9" cy="9" r="8" fill="rgba(129,140,248,.06)" stroke="#818cf8" stroke-width="1.3" opacity=".9"/><path d="M9 2.5L14.5 8L9 15.5L3.5 8Z" fill="rgba(129,140,248,.25)" stroke="#818cf8" stroke-width=".9" stroke-linejoin="round"/><path d="M9 2.5L13 7.5L9 6.5L5 7.5Z" fill="#c7d2fe"/><path d="M5 7.5L9 6.5L13 7.5L9 15.5Z" fill="rgba(129,140,248,.6)"/><circle cx="9" cy="2.5" r=".8" fill="#e0e7ff"/></svg>` },
];

function getRank(wagered) {
  let r = RANKS[0];
  for (const rank of RANKS) { if (wagered >= rank.min) r = rank; }
  return r;
}

/* -- PLAYER PROFILE (localStorage) -- */
const _PROF_KEY = 'ps99g_prof';
function _getRawProfile() {
  try { return JSON.parse(localStorage.getItem(_PROF_KEY)) || {}; } catch { return {}; }
}
function _saveRawProfile(p) { try { localStorage.setItem(_PROF_KEY, JSON.stringify(p)); } catch {} }
function myProfile() {
  const p = _getRawProfile();
  if (!p.id) { p.id = '#' + String(Math.floor(Math.random()*9e9+1e9)); _saveRawProfile(p); }
  const xp = p.xp || 0;
  const wc = p.winCount||0, lc = p.lossCount||0, tot = wc+lc;
  return { name: p.name||'You', xp, level: Math.min(100, Math.floor(xp/1000)+1),
    wagered: p.wagered||0, won: p.won||0, lost: p.lost||0, id: p.id,
    winCount: wc, lossCount: lc, winRate: tot>0 ? Math.round(wc/tot*100) : 0,
    bestWin: p.bestWin||0, maxStreak: p.maxStreak||0, streak: p.streak||0 };
}
function recordWager(amount) {
  const p = _getRawProfile();
  p.wagered = (p.wagered||0) + amount;
  p.xp = (p.xp||0) + Math.max(1, Math.floor(amount/1e6)*5);
  if (!p.id) p.id = '#' + String(Math.floor(Math.random()*9e9+1e9));
  _saveRawProfile(p);
}
function recordWin(amount) {
  const p = _getRawProfile();
  p.won = (p.won||0) + amount;
  p.xp = (p.xp||0) + 30;
  p.winCount = (p.winCount||0) + 1;
  p.streak = (p.streak||0) + 1;
  p.maxStreak = Math.max(p.maxStreak||0, p.streak);
  p.bestWin = Math.max(p.bestWin||0, amount);
  _saveRawProfile(p);
}
function recordLoss(amount) {
  const p = _getRawProfile();
  p.lost = (p.lost||0) + amount;
  p.xp = (p.xp||0) + 8;
  p.lossCount = (p.lossCount||0) + 1;
  p.streak = 0;
  _saveRawProfile(p);
}

const CV = [
  /* -- GARGANTUAN -- (49 pets, real RAP from db.biggames.io) */
  makePet('Gargantuan Hippomelon',           '133378666610902', 'Gargantuan', C, 900000000000),
  makePet('Gargantuan Kaiju King',           '122037254674435', 'Gargantuan', C, 421998720000),
  makePet('Gargantuan Starfall Dragon',      '106256354379795', 'Gargantuan', C, 407840960000),
  makePet('Gargantuan Dot Matrix Pegasus',   '133716042717345', 'Gargantuan', C, 335140226560),
  makePet('Gargantuan Hellish Axolotl',      '74041646461593',  'Gargantuan', C, 334625025763),
  makePet('Gargantuan Exquisite Parrot',     '112010823795135', 'Gargantuan', C, 296427988480),
  makePet('Gargantuan Jurassic Dragon',      '135125751282892', 'Gargantuan', C, 291871701513),
  makePet('Gargantuan Patchwork Agony',      '90326669323204',  'Gargantuan', C, 281239487022),
  makePet('Gargantuan Googly Agony',         '99540557591138',  'Gargantuan', C, 264965797375),
  makePet('Gargantuan Yin-Yang Kitsune',     '90918977215657',  'Gargantuan', C, 247378565761),
  makePet('Gargantuan Dark Dragon',          '100327262559787', 'Gargantuan', C, 225119473155),
  makePet('Gargantuan Santa Paws',           '85770840304413',  'Gargantuan', C, 222350108792),
  makePet('Gargantuan Forest Wyvern',        '120552464852825', 'Gargantuan', C, 216853438150),
  makePet('Gargantuan Aura Cat',             '137518632763038', 'Gargantuan', C, 213889552864),
  makePet('Gargantuan Floppa',               '100320985111822', 'Gargantuan', C, 212789262963),
  makePet('Gargantuan Matryoshka Bear',      '96710812218566',  'Gargantuan', C, 205214259029),
  makePet('Gargantuan Lucki Chest Mimic',    '96210965239108',  'Gargantuan', C, 200000000000),
  makePet('Gargantuan Wise Cat',             '83925987845910',  'Gargantuan', C, 197385504170),
  makePet('Gargantuan Frankenpup Dog',       '73716913913195',  'Gargantuan', C, 194371588505),
  makePet('Gargantuan Super Coral Kraken',   '71123467327540',  'Gargantuan', C, 182299046528),
  makePet('Gargantuan Special Ops Moth',     '91565856235548',  'Gargantuan', C, 178094281349),
  makePet('Gargantuan Grim Reaper',          '108242446619492', 'Gargantuan', C, 176809960617),
  makePet('Gargantuan Totem Monkey',         '119822736449264', 'Gargantuan', C, 172417337549),
  makePet('Gargantuan Dawn Phoenix',         '77286983181517',  'Gargantuan', C, 165121647836),
  makePet('Gargantuan Magma Spirit',         '132074129972033', 'Gargantuan', C, 163267212755),
  makePet('Gargantuan Bloom Dominus',        '113165518550651', 'Gargantuan', C, 161949756938),
  makePet('Gargantuan Leafy Deer',           '93500762936904',  'Gargantuan', C, 160231422575),
  makePet('Gargantuan Wicked Kirin',         '97026907883242',  'Gargantuan', C, 158000000000),
  makePet('Gargantuan Doge',                 '91301167582038',  'Gargantuan', C, 153906288029),
  makePet('Gargantuan Glass Squid',          '114884121622306', 'Gargantuan', C, 152703524715),
  makePet('Gargantuan Lucki Angelus',        '126822762417464', 'Gargantuan', C, 136987703903),
  makePet('Gargantuan Skelemelon',           '116658660548384', 'Gargantuan', C, 135094750069),
  makePet('Gargantuan Blurred Agony',        '72042454012987',  'Gargantuan', C, 133231828783),
  makePet('Gargantuan Fluffy Cat',           '122984499289928', 'Gargantuan', C, 127109240287),
  makePet('Gargantuan Evil Scarecrow Pumpkin','114300365192444','Gargantuan', C, 126261411309),
  makePet('Gargantuan Cappuccino Brainrot',  '126301320280051', 'Gargantuan', C, 124205276062),
  makePet('Gargantuan Treasure Angelus',     '100287069484548', 'Gargantuan', C, 123471065681),
  makePet('Gargantuan Elf Golem',            '83433844494349',  'Gargantuan', C, 122251236127),
  makePet('Gargantuan Gingerbread Angelus',  '88769910454037',  'Gargantuan', C, 118721834765),
  makePet('Gargantuan Snowflake Dragon',     '118532711191840', 'Gargantuan', C, 118442858345),
  makePet('Gargantuan Black Balloon Cat',    '70419388027416',  'Gargantuan', C, 115407380879),
  makePet('Gargantuan Leprechaun Fox',       '82088505811077',  'Gargantuan', C, 115000000000),
  makePet('Gargantuan Krampus',              '128217268096438', 'Gargantuan', C, 114608799342),
  makePet('Gargantuan Nightfall Tiger',      '106417356158790', 'Gargantuan', C, 111112366791),
  makePet('Gargantuan Cookie Cut Cat',       '124818572217039', 'Gargantuan', C, 109667550862),
  makePet('Gargantuan Super Cat',            '128024931288917', 'Gargantuan', C, 109432961097),
  makePet('Gargantuan Hypnotic Kitsune',     '130525621588743', 'Gargantuan', C,  50000000000),
  makePet('Gargantuan Royal Beast',          '120268942762821', 'Gargantuan', C,  50000000000),
  makePet('Gargantuan Nyan Cat',             '102598468729073', 'Gargantuan', C,  50000000000),

  /* -- TITANIC -- (real data from db.biggames.io, PSG = RAP/100) */
  makePet('Titanic Hippomelon'                  , '14976631515'     , 'Titanic', T, 662127258800),
  makePet('Titanic Pink Balloon'                , '14976657520'     , 'Titanic', T, 264713004600),
  makePet('Titanic Luxe Axolotl'                , '75796665600934'  , 'Titanic', T, 163564772600),
  makePet('Titanic Blueberry Cow'               , '17269862161'     , 'Titanic', T, 126624256800),
  makePet('Titanic Nightmare Cat'               , '15260478604'     , 'Titanic', T, 117801068500),
  makePet('Titanic Wild Corrupt Agony'          , '103464099228930' , 'Titanic', T, 105723463400),
  makePet('Titanic Dominus Darkwing'            , '76103751008934'  , 'Titanic', T, 104985490400),
  makePet('Titanic Cat'                         , '14976594978'     , 'Titanic', T, 98159649300),
  makePet('Titanic Ghostface Cat'               , '119318487422826' , 'Titanic', T, 97050157900),
  makePet('Titanic Blobfish'                    , '14976589636'     , 'Titanic', T, 92082165800),
  makePet('Titanic Sad Cat'                     , '14976666952'     , 'Titanic', T, 84014744200),
  makePet('Titanic Arcane Pyro Cat'             , '18978058000'     , 'Titanic', T, 66581463800),
  makePet('Titanic Atlantean Jellyfish'         , '14976584980'     , 'Titanic', T, 64000089300),
  makePet('Titanic Black Hole Angelus'          , '17285296068'     , 'Titanic', T, 63163167900),
  makePet('Titanic Neon Agony'                  , '14976647939'     , 'Titanic', T, 62920552600),
  makePet('Titanic SpongeBob SquarePants'       , '18313091924'     , 'Titanic', T, 62188881100),
  makePet('Titanic Poseidon Axolotl'            , '80369065406332'  , 'Titanic', T, 52473981800),
  makePet('Titanic Arcane Cat'                  , '18882936169'     , 'Titanic', T, 51753351700),
  makePet('Titanic Jelly Dragon'                , '16483343520'     , 'Titanic', T, 51113120500),
  makePet('Titanic Jelly Cat'                   , '14976635882'     , 'Titanic', T, 49144404700),
  makePet('Titanic Starry Owl'                  , '90300371601451'  , 'Titanic', T, 47505712400),
  makePet('Titanic Jolly Cat'                   , '17787600314'     , 'Titanic', T, 43454091900),
  makePet('Titanic Cartoon Cat'                 , '96042514794947'  , 'Titanic', T, 42382784000),
  makePet('Titanic Lovemelon'                   , '16306754796'     , 'Titanic', T, 41687357300),
  makePet('Titanic Kawaii Cat'                  , '16393812743'     , 'Titanic', T, 40481579100),
  makePet('Titanic Angel Cow'                   , '92969844303384'  , 'Titanic', T, 40000000000),
  makePet('Titanic Abstract Dominus'            , '111308527700884' , 'Titanic', T, 39989999900),
  makePet('Titanic Silver Dragon'               , '15687351099'     , 'Titanic', T, 39948173800),
  makePet('Titanic Balloon Monkey'              , '14976586764'     , 'Titanic', T, 38087669300),
  makePet('Titanic Bat Cat'                     , '16746763420'     , 'Titanic', T, 37912248200),
  makePet('Titanic Silver Stag'                 , '139456404804245' , 'Titanic', T, 37777017700),
  makePet('Titanic Valkyrie Pegasus'            , '18465212052'     , 'Titanic', T, 37291399300),
  makePet('Titanic Cosmic Pegasus'              , '15201628877'     , 'Titanic', T, 37185200200),
  makePet('Titanic Clover Owl'                  , '94606595966896'  , 'Titanic', T, 36566898400),
  makePet('Titanic Sketch Cat'                  , '17027114400'     , 'Titanic', T, 36333600400),
  makePet('Titanic Hubert'                      , '14976633736'     , 'Titanic', T, 35498659200),
  makePet('Titanic Sun Angelus'                 , '128663320518794' , 'Titanic', T, 33641255800),
  makePet('Titanic Red Balloon Cat'             , '14976586155'     , 'Titanic', T, 32425281600),
  makePet('Titanic Blue Balloon Cat'            , '14976589786'     , 'Titanic', T, 31768362300),
  makePet('Titanic Strawberry Cow'              , '14976827001'     , 'Titanic', T, 30955264800),
  makePet('Titanic Blazing Dragon'              , '17749522423'     , 'Titanic', T, 30372881000),
  makePet('Titanic Mystic Corgi'                , '14976647316'     , 'Titanic', T, 28915186900),
  makePet('Titanic Bread Shiba'                 , '16393819211'     , 'Titanic', T, 27870224800),
  makePet('Titanic Spectral Deer'               , '131625375967545' , 'Titanic', T, 27755351100),
  makePet('Titanic Firegel Dragon'              , '84658799668641'  , 'Titanic', T, 27647101100),
  makePet('Titanic Hologram Cat'                , '14976631845'     , 'Titanic', T, 27356478800),
  makePet('Titanic Stargazing Bull'             , '17602420874'     , 'Titanic', T, 27317373700),
  makePet('Titanic Dominus Astra'               , '14976605624'     , 'Titanic', T, 26155816000),
  makePet('Titanic Fire Dragon'                 , '15163496528'     , 'Titanic', T, 25641187900),
  makePet('Titanic Emoji Corgi'                 , '16047477969'     , 'Titanic', T, 25372455800),
  makePet('Titanic Soul Owl'                    , '125310152380772' , 'Titanic', T, 25088310600),
  makePet('Titanic Midnight Lion'               , '87889546587335'  , 'Titanic', T, 24736472000),
  makePet('Titanic Angry Yeti'                  , '118155614090525' , 'Titanic', T, 23248190600),
  makePet('Titanic Wild Frost Agony'            , '116274982839546' , 'Titanic', T, 23162842700),
  makePet('Titanic Pop Cat'                     , '107955973846092' , 'Titanic', T, 22997531800),
  makePet('Titanic Nightfall Pegasus'           , '18640616333'     , 'Titanic', T, 22956992900),
  makePet('Titanic Pumpkin Cat'                 , '111326774282264' , 'Titanic', T, 22534528400),
  makePet('Titanic Yin-Yang Grim Reaper'        , '136807974742699' , 'Titanic', T, 22244516400),
  makePet('Titanic Pixel M-2 PROTOTYPE'         , '78274935877224'  , 'Titanic', T, 22068275600),
  makePet('Titanic Starfall Dragon'                 , '70374143407469'    , 'Titanic', T, 21755664500),
  makePet('Titanic Capybara'                    , '14976593327'     , 'Titanic', T, 21350236500),
  makePet('Titanic Vampire Agony'               , '120127746226502' , 'Titanic', T, 20965099200),
  makePet('Titanic M-14 PROTOTYPE'              , '99810281877777'  , 'Titanic', T, 20925061800),
  makePet('Titanic Valentines Cat'              , '16234782048'     , 'Titanic', T, 20874132000),
  makePet('Titanic Dot Matrix Kitsune'          , '101711904618223' , 'Titanic', T, 20839912200),
  makePet('Titanic Snow Globe Cat'              , '101380058502586' , 'Titanic', T, 20107489100),
  makePet('Titanic Nightmare Corgi'             , '137580301485992' , 'Titanic', T, 19840514300),
  makePet('Titanic Tiedye Dragon'               , '15547792197'     , 'Titanic', T, 19807285700),
  makePet('Titanic Love Lamb'                   , '16234774596'     , 'Titanic', T, 19615784000),
  makePet('Titanic Lucki'                       , '14976642572'     , 'Titanic', T, 19539395400),
  makePet('Titanic Tiedye Cat'                  , '15547792344'     , 'Titanic', T, 19526586200),
  makePet('Titanic Bejeweled Griffin'           , '17450302814'     , 'Titanic', T, 19083561800),
  makePet('Titanic Nightfall Wolf'              , '16394133066'     , 'Titanic', T, 18647337300),
  makePet('Titanic Signature BIG Maskot'        , '87601095664895'  , 'Titanic', T, 18637818300),
  makePet('Titanic Kaiju Moth'                  , '119404602163936' , 'Titanic', T, 18538594200),
  makePet('Titanic Banana Cat'                  , '15644507059'     , 'Titanic', T, 18509589300),
  makePet('Titanic Flex Cat'                    , '18151232769'     , 'Titanic', T, 18431123200),
  makePet('Titanic Chad Gorilla'                , '101924214050321' , 'Titanic', T, 18224780700),
  makePet('Titanic Samurai Dragon'              , '125481811562940' , 'Titanic', T, 18111660000),
  makePet('Titanic Rich Cat'                    , '17194508969'     , 'Titanic', T, 17988259600),
  makePet('Titanic Shadow Griffin'              , '14976670848'     , 'Titanic', T, 17833205400),
  makePet('Titanic Butterfly'                   , '17821211666'     , 'Titanic', T, 17796899300),
  makePet('Titanic Buff Tiger'                  , '71901668649846'  , 'Titanic', T, 17677820900),
  makePet('Titanic Inferno Dominus'             , '133194662787359' , 'Titanic', T, 17139925900),
  makePet('Titanic Party Tiger'                 , '82287378572114'  , 'Titanic', T, 17000000000),
  makePet('Titanic Luchador Cat'                , '105152814776651' , 'Titanic', T, 16753154900),
  makePet('Titanic Fossil Dragon'               , '107708637818615' , 'Titanic', T, 16734303200),
  makePet('Titanic Ancient Dragon'              , '83209252945464'  , 'Titanic', T, 16610737100),
  makePet('Titanic Kitsune Fox'                 , '18352469980'     , 'Titanic', T, 16527321100),
  makePet('Titanic Wicked Angelus'              , '139550015983813' , 'Titanic', T, 16345346900),
  makePet('Titanic Classic Cat'                 , '18883420114'     , 'Titanic', T, 16058565100),
  makePet('Titanic Super Corgi'                     , '83701890267359'    , 'Titanic', T, 15516356700),
  makePet('Titanic Googly Blobfish'             , '110994339382883' , 'Titanic', T, 15500052200),
  makePet('Titanic Giraffe'                     , '82353035401807'  , 'Titanic', T, 15451502000),
  makePet('Titanic Electric Werewolf'           , '76655518621406'  , 'Titanic', T, 15352573100),
  makePet('Titanic Witch Wolf'                  , '74523750699706'  , 'Titanic', T, 15158972500),
  makePet('Titanic Party Crown Hippomelon'      , '119580032207661' , 'Titanic', T, 14801763600),
  makePet('Titanic Warrior Beast'               , '131949076812775' , 'Titanic', T, 14783206100),
  makePet('Titanic Sock Cat'                    , '16393837325'     , 'Titanic', T, 14678005400),
  makePet('Titanic Diamond Dog'                 , '95245493036006'  , 'Titanic', T, 14556875500),
  makePet('Titanic Hypnotic Monkey'             , '85590653495391'  , 'Titanic', T, 14554440600),
  makePet('Titanic Dragonfruit Dragon'          , '17269789414'     , 'Titanic', T, 14554049800),
  makePet('Titanic Patchwork Capybara'          , '94494477823308'  , 'Titanic', T, 14389005900),
  makePet('Titanic Jelly Kitsune'               , '80481264507529'  , 'Titanic', T, 14333943700),
  makePet('Titanic Dino Cat'                    , '14976604955'     , 'Titanic', T, 14321559600),
  makePet('Titanic Scary Corgi'                 , '14976669980'     , 'Titanic', T, 13853635600),
  makePet('Titanic Stunt Cat'                   , '128964854488748' , 'Titanic', T, 13809262100),
  makePet('Titanic Wild Fire Agony'             , '80761300754593'  , 'Titanic', T, 13654632700),
  makePet('Titanic Empyrean Owl'                , '104879205036593' , 'Titanic', T, 13639041000),
  makePet('Titanic Holiday Owl'                 , '116557921050130' , 'Titanic', T, 13591804000),
  makePet('Titanic Pink Kitsune Fox'            , '81549697873082'  , 'Titanic', T, 13543479400),
  makePet('Titanic Gamer Shiba'                 , '119206417994536' , 'Titanic', T, 13540541700),
  makePet('Titanic Party Cat'                   , '16901676187'     , 'Titanic', T, 13521919600),
  makePet('Titanic Calico Cat'                  , '89706854037994'  , 'Titanic', T, 13506695000),
  makePet('Titanic Aura Kitsune'                , '80758347451953'  , 'Titanic', T, 13436632100),
  makePet('Titanic Sock Monkey'                 , '16393836771'     , 'Titanic', T, 13257994600),
  makePet('Titanic Snowflake Angelus'           , '72623839017294'  , 'Titanic', T, 13188198800),
  makePet('Titanic Party Panda'                 , '74514642411800'  , 'Titanic', T, 13139210500),
  makePet('Titanic Lucky Cat'                   , '74474705951113'  , 'Titanic', T, 12927142700),
  makePet('Titanic Mosaic Cat'                  , '121979531633033' , 'Titanic', T, 12891718600),
  makePet('Titanic Love Corgi'                  , '124293758484647' , 'Titanic', T, 12820090900),
  makePet('Titanic Orange Axolotl'              , '17269848594'     , 'Titanic', T, 12790169000),
  makePet('Titanic DJ Shark'                    , '111270922153333' , 'Titanic', T, 12572264200),
  makePet('Titanic Red Panda'                   , '15842479817'     , 'Titanic', T, 12564678100),
  makePet('Titanic Shiba'                       , '16393850015'     , 'Titanic', T, 12529630100),
  makePet('Titanic Matryoshka Cat'              , '113135543154400' , 'Titanic', T, 12432557500),
  makePet('Titanic Bobcat'                      , '93912731395332'  , 'Titanic', T, 12201935300),
  makePet('Titanic Obsidian Dragon'             , '98113510502520'  , 'Titanic', T, 12152905700),
  makePet('Titanic Strawberry Corgi'            , '17269911360'     , 'Titanic', T, 12152173400),
  makePet('Titanic Nyan Cat'                    , '102693200913432' , 'Titanic', T, 12079431900),
  makePet('Titanic Frontman Jellyfish'          , '91877971354703'  , 'Titanic', T, 11998447300),
  makePet('Titanic Monkey'                      , '15842479997'     , 'Titanic', T, 11872404500),
  makePet('Titanic Koi Fish'                    , '86724162375646'  , 'Titanic', T, 11726580300),
  makePet('Titanic Wood Spirit'                 , '125083583849659' , 'Titanic', T, 11591079000),
  makePet('Titanic Parrot'                      , '81714067299017'  , 'Titanic', T, 11533476500),
  makePet('Titanic Axolotl'                     , '14976585715'     , 'Titanic', T, 11437069100),
  makePet('Titanic Gingerbread Dragon'          , '110203202746890' , 'Titanic', T, 11411748200),
  makePet('Titanic Super Coral Stingray'        , '78134385272600'  , 'Titanic', T, 11185494900),
  makePet('Titanic Black Hole Angelus Ball'     , '113303682260217' , 'Titanic', T, 11134473200),
  makePet('Titanic Snowflake Dominus'           , '71393734598151'  , 'Titanic', T, 11112042400),
  makePet('Titanic Jurassic Feline'             , '129218443079434' , 'Titanic', T, 10744587600),
  makePet('Titanic Guard Dominus'               , '100676807930076' , 'Titanic', T, 10737229100),
  makePet('Titanic Dolphin'                     , '17269957040'     , 'Titanic', T, 10726062500),
  makePet('Titanic Cupcake Pegasus'             , '78403514636510'  , 'Titanic', T, 10589143200),
  makePet('Titanic Arcane Halo Cat'             , '94452581960646'  , 'Titanic', T, 10573056400),
  makePet('Titanic Nightmare Sludge'            , '92769377018385'  , 'Titanic', T, 10559873600),
  makePet('Titanic Grinch Cat'                  , '105600589075929' , 'Titanic', T, 10544843700),
  makePet('Titanic Crocodilo Brainrot'          , '134789752916568' , 'Titanic', T, 10532502100),
  makePet('Titanic Reindeer'                    , '15581758974'     , 'Titanic', T, 10477672300),
  makePet('Titanic Cheerful Yeti'               , '14976595593'     , 'Titanic', T, 10370816400),
  makePet('Titanic Propeller Cat'               , '73254502740127'  , 'Titanic', T, 10273731600),
  makePet('Titanic Fawn'                        , '14976619071'     , 'Titanic', T, 10258490700),
  makePet('Titanic Gingerbread Cat'             , '123881708128597' , 'Titanic', T, 10178239400),
  makePet('Titanic Noob'                        , '101954252153126' , 'Titanic', T, 10168895900),
  makePet('Titanic Pineapple Cat'               , '17269938973'     , 'Titanic', T, 10048741100),
  makePet('Titanic Totem Owl'                   , '113883294151672' , 'Titanic', T, 9732373600),
  makePet('Titanic Arcane Void Cat'             , '77026614501642'  , 'Titanic', T, 9697284200),
  makePet('Titanic Blobenstein'                     , '133816643880772'   , 'Titanic', T, 9577718500),
  makePet('Titanic Valentines Axolotl'          , '123399141850216' , 'Titanic', T, 9344413700),
  makePet('Titanic Glass Blobfish'              , '95794427114818'  , 'Titanic', T, 9314980600),
  makePet('Titanic Wishing Dragon'              , '133278674561506' , 'Titanic', T, 9243066300),
  makePet('Titanic Scroll Dragon'               , '118843935500036' , 'Titanic', T, 8990491100),
  makePet('Titanic Leprechaun Kitsune'          , '119959214731762' , 'Titanic', T, 8801071200),
  makePet('Titanic Leafy Seahorse'                  , '116393400860813'   , 'Titanic', T, 8710747200),
  makePet('Titanic Chest Mimic'                     , '121868378193136'   , 'Titanic', T, 8635657500),
  makePet('Titanic Gingerbread Corgi'               , '14976625491'       , 'Titanic', T, 8633663200),
  makePet('Titanic Doll Cat'                    , '93143962349458'  , 'Titanic', T, 8541760200),
  makePet('Titanic Mechanical Griffin'          , '139823159544156' , 'Titanic', T, 8465041800),
  makePet('Titanic Dark Fox'                    , '110119044336998' , 'Titanic', T, 8409052800),
  makePet('Titanic Abyss Carbuncle'             , '121024391063626' , 'Titanic', T, 8400831200),
  makePet('Titanic Loveserker'                  , '134671434987896' , 'Titanic', T, 8388194500),
  makePet('Titanic Reindeer Cat'                , '119319411340325' , 'Titanic', T, 8202607300),
  makePet('Titanic Autumn Teddy Bear'               , '102130006064216'   , 'Titanic', T, 8198360700),
  makePet('Titanic Clover Butterfly'            , '131125477985744' , 'Titanic', T, 8157270500),
  makePet('Titanic Lucki Angelus'               , '140159437559092' , 'Titanic', T, 8127035500),
  makePet('Titanic Pixel Angelus'               , '103752775543007' , 'Titanic', T, 8021135200),
  makePet('Titanic Icy Phoenix'                 , '119756929621348' , 'Titanic', T, 8011304100),
  makePet('Titanic Easter Cat'                  , '122516564229104' , 'Titanic', T, 7921008100),
  makePet('Titanic Sun Griffin'                 , '131108865732967' , 'Titanic', T, 7831339500),
  makePet('Titanic Jelly Wizard'                , '125800512820483' , 'Titanic', T, 7812565100),
  makePet('Titanic Origami Crane'               , '77309638284981'  , 'Titanic', T, 7777822800),
  makePet('Titanic Disco Ball Agony'            , '79337032741269'  , 'Titanic', T, 7766626000),
  makePet('Titanic Easter Golem'                , '109664286681118' , 'Titanic', T, 7765379700),
  makePet('Titanic Kraken'                      , '82337742221537'  , 'Titanic', T, 7700562800),
  makePet('Titanic Party Corgi'                 , '122915996316714' , 'Titanic', T, 7674555800),
  makePet('Titanic Keyboard Cat'                , '138627945084194' , 'Titanic', T, 7623956600),
  makePet('Titanic Beach Ball Capybara'         , '75537750566110'  , 'Titanic', T, 7612367100),
  makePet('Titanic Pixel Agony'                 , '79227180725829'  , 'Titanic', T, 7565816300),
  makePet('Titanic Captain Octopus'             , '108839170452682' , 'Titanic', T, 7548624300),
  makePet('Titanic Party Crown Corgi'           , '127025398818263' , 'Titanic', T, 7524855800),
  makePet('Titanic Brain Ball'                  , '85082755103963'  , 'Titanic', T, 7521690700),
  makePet('Titanic Holographic Axolotl Ball'    , '113783111337082' , 'Titanic', T, 7351967200),
  makePet('Titanic Pixel Monkey'                , '109746451259530' , 'Titanic', T, 7268045500),
  makePet('Titanic Inferno Cat'                 , '128197933261486' , 'Titanic', T, 7223942600),
  makePet('Titanic Gingerbread Angelus'         , '135459719245097' , 'Titanic', T, 7177394500),
  makePet('Titanic Nutcracker Squirrel'         , '72074096332299'  , 'Titanic', T, 7137681400),
  makePet('Titanic Gym Cat'                     , '116586359126755' , 'Titanic', T, 7105057500),
  makePet('Titanic Gym Dragon'                  , '91679016973225'  , 'Titanic', T, 7092886700),
  makePet('Titanic Gym Axolotl'                 , '105883777354766' , 'Titanic', T, 6994594700),
  makePet('Titanic Guilded Raven'               , '133529343440925' , 'Titanic', T, 6964116400),
  makePet('Titanic Super Wolf'                  , '114045876201670' , 'Titanic', T, 6962896700),
  makePet('Titanic Lucki Golem'                 , '136718232635599' , 'Titanic', T, 6892235200),
  makePet('Titanic Candycane Kitsune'           , '100308163043577' , 'Titanic', T, 6770966300),
  makePet('Titanic Yee-haw Cat'                 , '111695166466582' , 'Titanic', T, 6742561100),
  makePet('Titanic Anime Cat'                   , '139657034071879' , 'Titanic', T, 6718405000),
  makePet('Titanic Pilgrim Turkey'              , '126580879775166' , 'Titanic', T, 6695818700),
  makePet('Titanic Diamond Bunny'               , '118509963937429' , 'Titanic', T, 6675385500),
  makePet('Titanic Treasure Mimic'              , '101381725674777' , 'Titanic', T, 6674036400),
  makePet('Titanic Special Ops Goat'            , '113002170903758' , 'Titanic', T, 6667315000),
  makePet('Titanic Gym Piggy'                   , '83418426138856'  , 'Titanic', T, 6634469800),
  makePet('Titanic Teacher Cat'                     , '104387672853610'   , 'Titanic', T, 6589891800),
  makePet('Titanic Hydra Axolotl'               , '116530316117361' , 'Titanic', T, 6513772500),
  makePet('Titanic Comet Cyclops Ball'          , '83088944433726'  , 'Titanic', T, 6447633000),
  makePet('Titanic Gym Shark'                   , '116575608018506' , 'Titanic', T, 6442295200),
  makePet('Titanic Sandcastle Kraken'           , '90627425215733'  , 'Titanic', T, 6436712100),
  makePet('Titanic Pixel Dominus Astra'         , '129315342087717' , 'Titanic', T, 6431672100),
  makePet('Titanic Ooze Cat'                    , '114761957372566' , 'Titanic', T, 6426505600),
  makePet('Titanic Easter Axolotl'              , '76996694412887'  , 'Titanic', T, 6391841300),
  makePet('Titanic Helicopter Corgi'            , '139030108461655' , 'Titanic', T, 6386953700),
  makePet('Titanic Spirit Mushroom'             , '86911408081625'  , 'Titanic', T, 6350425800),
  makePet('Titanic Basketball Cat'              , '88337098275915'  , 'Titanic', T, 6317514900),
  makePet('Titanic Narwhal'                     , '100083536961839' , 'Titanic', T, 6308360800),
  makePet('Titanic Night Terror Dog'            , '112505092769187' , 'Titanic', T, 6244458700),
  makePet('Titanic Gym Unicorn'                 , '86624734020676'  , 'Titanic', T, 6138459400),
  makePet('Titanic Storm Axolotl Ball'          , '140349148341918' , 'Titanic', T, 6102912500),
  makePet('Titanic Diamond Monkey'              , '77972912232748'  , 'Titanic', T, 6082797100),
  makePet('Titanic Ice Snake'                   , '136281455287593' , 'Titanic', T, 6071832500),
  makePet('Titanic Nutcracker Cat'              , '131594588116580' , 'Titanic', T, 6067816600),
  makePet('Titanic Nuclear Dominus'             , '89079914653580'  , 'Titanic', T, 6047680400),
  makePet('Titanic Snow Elf'                    , '137871430705388' , 'Titanic', T, 6006056100),
  makePet('Titanic Leprechaun Dog'              , '82186253097928'  , 'Titanic', T, 5995140600),
  makePet('Titanic Crackling Dragon'            , '83961459866368'  , 'Titanic', T, 5981755400),
  makePet('Titanic Prickly Panda'               , '110590155279741' , 'Titanic', T, 5974708400),
  makePet('Titanic Snow Globe Snowman'          , '78333791441483'  , 'Titanic', T, 5938503000),
  makePet('Titanic Glitched Cat Ball'           , '106995873715009' , 'Titanic', T, 5856309300),
  makePet('Titanic Exquisite Cat'               , '71126391222560'  , 'Titanic', T, 5658182700),
  makePet('Titanic Chesnut Chipmunk'            , '106520142192819' , 'Titanic', T, 5644973000),
  makePet('Titanic Surfboard Corgi'             , '94523830121587'  , 'Titanic', T, 5631805100),
  makePet('Titanic Owl'                         , '111258824225580' , 'Titanic', T, 5545898700),
  makePet('Titanic Withered Agony'              , '131171482429329' , 'Titanic', T, 5510934100),
  makePet('Titanic Red Dragon'                  , '102919400453870' , 'Titanic', T, 5430276400),
  makePet('Titanic Sea Dragon'                  , '97419954429083'  , 'Titanic', T, 5415325800),
  makePet('Titanic North Pole Unicorn'          , '127223502497366' , 'Titanic', T, 5411702500),
  makePet('Titanic Hippomint'                   , '118720066911760' , 'Titanic', T, 5343764600),
  makePet('Titanic Pineapple Dog'               , '99869089555079'  , 'Titanic', T, 5330248200),
  makePet('Titanic Old Wizard Cat'              , '85718953892638'  , 'Titanic', T, 5295316100),
  makePet('Titanic Persimmony Cricket'          , '107901135144472' , 'Titanic', T, 5277986800),
  makePet('Titanic Exquisite Elephant'          , '97422903795997'  , 'Titanic', T, 5253182700),
  makePet('Titanic Pumpkin Dog'                 , '92147535439252'  , 'Titanic', T, 5247889400),
  makePet('Titanic Devil Tasmanian'             , '90163785900987'  , 'Titanic', T, 5180771200),
  makePet('Titanic Ghost Axolotl'               , '81649535142902'  , 'Titanic', T, 5171232600),
  makePet('Titanic Pink Lucky Block'            , '106313575575295' , 'Titanic', T, 5109073600),
  makePet('Titanic Specter Owl'                 , '75229651213956'  , 'Titanic', T, 5049383400),
  makePet('Titanic Ghostly Wolf'                , '122682792759281' , 'Titanic', T, 5035491500),
  makePet('Titanic Veil Horse'                  , '80965165352380'  , 'Titanic', T, 5032303000),
  makePet('Titanic Ruinous Angelus'             , '128700972772946' , 'Titanic', T, 5013763500),
  makePet('Titanic Scribe Squirrel'             , '119222051257563' , 'Titanic', T, 4994585500),
  makePet('Titanic Irish Badger'                , '94461290807119'  , 'Titanic', T, 4990257000),
  makePet('Titanic Lucki Chest Mimic'           , '96487317914550'  , 'Titanic', T, 4970503600),
  makePet('Titanic Starlight Pony'              , '130735528136584' , 'Titanic', T, 4962099900),
  makePet('Titanic Tiedye Corgi'                , '116762893028421' , 'Titanic', T, 4959918900),
  makePet('Titanic Diamond Chick'               , '136894452978816' , 'Titanic', T, 4838457700),
  makePet('Titanic Mucki'                       , '90224746206001'  , 'Titanic', T, 4801069800),
  makePet('Titanic Butterfly Pony'              , '71576208236179'  , 'Titanic', T, 4796661400),
  makePet('Titanic Werewolf'                    , '111055741189811' , 'Titanic', T, 4791533700),
  makePet('Titanic Quokka'                      , '118478723717753' , 'Titanic', T, 4788278800),
  makePet('Titanic Garden Goblin'               , '88678695683652'  , 'Titanic', T, 4784260700),
  makePet('Titanic Horseshoe Capybara'          , '123799433533609' , 'Titanic', T, 4757339700),
  makePet('Titanic Irish Wolfhound'             , '125815340060379' , 'Titanic', T, 4733276900),

/* -- HUGE -- (926 pets, real RAP from db.biggames.io) */
  makePet('Huge Crowned Penguin', '85416907805755', 'Huge', H, 300000000000),
  makePet('Huge Signature BIG Maskot', '98304859922444', 'Huge', H, 290000000000),
  makePet('Huge Crowned Corgi', '15281989661', 'Huge', H, 89200000000),
  makePet('Huge Crowned Cat', '15281989820', 'Huge', H, 40549643976),
  makePet('Huge Demon', '92733626673208', 'Huge', H, 29077999999),
  makePet('Huge Holographic Corgi', '117552656030475', 'Huge', H, 25400000000),
  makePet('Huge Present Cat', '15637230004', 'Huge', H, 24686318454),
  makePet('Huge Splash Angelus', '70796008015802', 'Huge', H, 22618035457),
  makePet('Huge Crowned Dog', '116949971917880', 'Huge', H, 20495138890),
  makePet('Huge Wisp Deer', '119889276435598', 'Huge', H, 20094652196),
  makePet('Huge Cat', '14976374906', 'Huge', H, 18722445222),
  makePet('Huge Stunt Unicorn', '14976564045', 'Huge', H, 18087032393),
  makePet('Huge Alien Arachnid', '16756608144', 'Huge', H, 17763125412),
  makePet('Huge Runic Wolf', '90992015930571', 'Huge', H, 15387040000),
  makePet('Huge Sensei Penguin', '16029125715', 'Huge', H, 12541318203),
  makePet('Huge Blue Balloon Cat', '14976365873', 'Huge', H, 12422959223),
  makePet('Huge Bubble Dog', '17277934726', 'Huge', H, 11727530182),
  makePet('Huge Angelus', '14976350830', 'Huge', H, 11209315064),
  makePet('Huge Pixel Shark', '17024845317', 'Huge', H, 9984743909),
  makePet('Huge Bread Shiba', '14976370557', 'Huge', H, 9661374052),
  makePet('Huge White Balloon Cat', '14976576332', 'Huge', H, 6403251061),
  makePet('Huge Mystical Fox', '14976496299', 'Huge', H, 6334473234),
  makePet('Huge Butterfly', '14976372228', 'Huge', H, 6305888407),
  makePet('Huge Hoverboard Dog', '117980545661053', 'Huge', H, 5790481711),
  makePet('Huge Mummy Bunny', '101133530585577', 'Huge', H, 5001059892),
  makePet('Huge Storm Agony', '15260479669', 'Huge', H, 4433434096),
  makePet('Huge Ninja Capybara', '101889999202642', 'Huge', H, 4297387601),
  makePet('Huge Anime Agony', '14976351312', 'Huge', H, 4177792917),
  makePet('Huge Inferno Cat', '14976463498', 'Huge', H, 4124086020),
  makePet('Huge Pop Cat', '14976525879', 'Huge', H, 3879833126),
  makePet('Huge Cupcake Unicorn', '14976388989', 'Huge', H, 3760704741),
  makePet('Huge Wicked Empyrean Dragon', '17746014334', 'Huge', H, 3550781985),
  makePet('Huge Blurred Dominus', '14976370033', 'Huge', H, 3237019117),
  makePet('Huge Neon Twilight Dragon', '15260481819', 'Huge', H, 3021142430),
  makePet('Huge Guard Bunny', '70728047813207', 'Huge', H, 2954830028),
  makePet('Huge Sombrero Chihuahua', '14976553203', 'Huge', H, 2806888287),
  makePet('Huge Prickly Panda', '14976527289', 'Huge', H, 2758180993),
  makePet('Huge Crackling Dragon', '125990599285140', 'Huge', H, 2757241433),
  makePet('Huge Kawaii Cat', '14976470713', 'Huge', H, 2699711886),
  makePet('Huge Principal Anteater', '124723336680703', 'Huge', H, 2697928143),
  makePet('Huge Easter Cat', '15281989384', 'Huge', H, 2563932106),
  makePet('Huge Wyvern of Hades', '113089838370784', 'Huge', H, 2523705218),
  makePet('Huge Santa Paws', '14976542836', 'Huge', H, 2493150901),
  makePet('Huge Comet Agony', '14976384743', 'Huge', H, 2460573572),
  makePet('Huge Cyborg Capybara', '15260482561', 'Huge', H, 2417072250),
  makePet('Huge Frontman Jellyfish', '104443983862799', 'Huge', H, 2402181136),
  makePet('Huge Patrick Star', '18313092558', 'Huge', H, 2393924334),
  makePet('Huge Basketball Retriever', '14976360269', 'Huge', H, 2362592776),
  makePet('Huge Ghost Cat', '94290261080713', 'Huge', H, 2299011632),
  makePet('Huge Angel Cat', '15281990207', 'Huge', H, 2240113178),
  makePet('Huge Diamond Dragon', '135778952005746', 'Huge', H, 2223505142),
  makePet('Huge Lucky Cat', '14976485216', 'Huge', H, 2209932141),
  makePet('Huge Reversed Cat', '86486361253800', 'Huge', H, 2205634043),
  makePet('Huge Diamond Cat', '14976396731', 'Huge', H, 2187575358),
  makePet('Huge Chest Mimic', '14976376935', 'Huge', H, 2184757149),
  makePet('Huge Orange Balloon Cat', '14976505912', 'Huge', H, 2170583562),
  makePet('Huge Glitched Cat', '16468736057', 'Huge', H, 2149502261),
  makePet('Huge Ice Cream Cone', '14976462189', 'Huge', H, 2122954291),
  makePet('Huge Gamer Shiba', '14976439240', 'Huge', H, 2102402711),
  makePet('Huge Forest Wyvern', '14976435839', 'Huge', H, 2092731807),
  makePet('Huge Gingerbread Dragon', '110621195469129', 'Huge', H, 2071321535),
  makePet('Huge Sad Hamster', '139847485438413', 'Huge', H, 2058788448),
  makePet('Huge Clown Cat', '18520054035', 'Huge', H, 2035291065),
  makePet('Huge Dino Cat', '14976397288', 'Huge', H, 2006699749),
  makePet('Huge Grim Reaper', '14976567210', 'Huge', H, 2006556346),
  makePet('Huge Shiba', '14976547077', 'Huge', H, 1992381407),
  makePet('Huge Pufferfish', '14976528215', 'Huge', H, 1914403723),
  makePet('Huge Axolotl', '14976357246', 'Huge', H, 1873017348),
  makePet('Huge Monkey', '14976491927', 'Huge', H, 1862223844),
  makePet('Huge Capybara', '14976373698', 'Huge', H, 1840831555),
  makePet('Huge Santa Monkey', '15281988558', 'Huge', H, 1640546367),
  makePet('Huge Heart Balloon Cat', '16306792637', 'Huge', H, 1628479722),
  makePet('Huge Hedgehog', '76079961004041', 'Huge', H, 1538077476),
  makePet('Huge Pinata Cat', '14976516399', 'Huge', H, 1485256778),
  makePet('Huge Evil Deer', '105420679784540', 'Huge', H, 1442724170),
  makePet('Huge Panda', '86383655760798', 'Huge', H, 1410517808),
  makePet('Huge Shark Cat', '96757523363685', 'Huge', H, 1402379768),
  makePet('Huge Gargoyle Dragon', '14976439876', 'Huge', H, 1397816710),
  makePet('Huge Apple Capybara', '14976352410', 'Huge', H, 1396280267),
  makePet('Huge Hubert', '140721677142555', 'Huge', H, 1388919098),
  makePet('Huge Love Lamb', '14976476986', 'Huge', H, 1345741991),
  makePet('Huge Sleipnir', '15260480028', 'Huge', H, 1297332819),
  makePet('Huge Fragmented Dominus', '17421845704', 'Huge', H, 1285804181),
  makePet('Huge Balloon Cat', '14976358748', 'Huge', H, 1268479186),
  makePet('Huge Cow', '14976386456', 'Huge', H, 1239122053),
  makePet('Huge Rave Crab', '109133967059639', 'Huge', H, 1216726401),
  makePet('Huge Blurred Agony', '136961969731573', 'Huge', H, 1185539519),
  makePet('Huge Otter', '14976506594', 'Huge', H, 1130360351),
  makePet('Huge Green Balloon Cat', '14976447015', 'Huge', H, 1125990411),
  makePet('Huge Three Headed Dragon', '14976567497', 'Huge', H, 1086164968),
  makePet('Huge Atlantean Dolphin', '14976354622', 'Huge', H, 1078184534),
  makePet('Huge Hippomelon', '14976456685', 'Huge', H, 1071915393),
  makePet('Huge Mr Krabs', '18313092725', 'Huge', H, 1069988128),
  makePet('Huge Clover Dragon', '14976383366', 'Huge', H, 1020848569),
  makePet('Huge Mushroom King', '125986697104431', 'Huge', H, 1013901556),
  makePet('Huge Tiedye Dog', '117016363569133', 'Huge', H, 977105595),
  makePet('Huge M-10 PROTOTYPE', '15260482198', 'Huge', H, 956837792),
  makePet('Huge Safari Dog', '14976538804', 'Huge', H, 939005549),
  makePet('Huge Dog', '14976397743', 'Huge', H, 935811571),
  makePet('Huge Kraken', '14976473284', 'Huge', H, 927885420),
  makePet('Huge Lit Octopus', '100395307748648', 'Huge', H, 907019979),
  makePet('Huge Poseidon Axolotl', '86210025446242', 'Huge', H, 901723876),
  makePet('Huge Lucki Dominus', '78303914095670', 'Huge', H, 901502822),
  makePet('Huge Neon Griffin', '14976498238', 'Huge', H, 901272582),
  makePet('Huge Ducky', '14976415577', 'Huge', H, 896507281),
  makePet('Huge Balloon Corgi', '135934944336063', 'Huge', H, 880359191),
  makePet('Huge Puurple Cat', '17450362839', 'Huge', H, 879279591),
  makePet('Huge Reindeer Dog', '15281988831', 'Huge', H, 878655470),
  makePet('Huge Safety Cat', '18127300990', 'Huge', H, 863498295),
  makePet('Huge Lucki', '14976484952', 'Huge', H, 861840405),
  makePet('Huge Anime Unicorn', '14976352077', 'Huge', H, 858246742),
  makePet('Huge Reindeer Axolotl', '15281989034', 'Huge', H, 857939713),
  makePet('Huge Party Monkey', '14976510684', 'Huge', H, 856020711),
  makePet('Huge Blimp Dragon', '113409897234634', 'Huge', H, 850908776),
  makePet('Huge Corgi', '14976386115', 'Huge', H, 825112996),
  makePet('Huge Pink Marshmallow Chick', '14976517974', 'Huge', H, 809866761),
  makePet('Huge Balloon Axolotl', '14976358125', 'Huge', H, 797449777),
  makePet('Huge Tiki Dominus', '14976571122', 'Huge', H, 792683804),
  makePet('Huge Holographic Monkey', '77505723512124', 'Huge', H, 787827470),
  makePet('Huge Santa Dragon', '15281988711', 'Huge', H, 774232472),
  makePet('Huge Pixel Wolf', '14976522632', 'Huge', H, 769056567),
  makePet('Huge Pony', '14976525582', 'Huge', H, 766344492),
  makePet('Huge Present Chest Mimic', '14976527111', 'Huge', H, 766135739),
  makePet('Huge Nightmare Kraken', '14976502236', 'Huge', H, 764811668),
  makePet('Huge Snowman', '15199736050', 'Huge', H, 760833380),
  makePet('Huge Sphinx', '112960031922397', 'Huge', H, 748839118),
  makePet('Huge Dominus Lucki', '14976479237', 'Huge', H, 748714100),
  makePet('Huge Dragon', '14976414803', 'Huge', H, 746299114),
  makePet('Huge Black Hole Kitsune', '17285736637', 'Huge', H, 745555586),
  makePet('Huge Balloon Dragon', '14976359350', 'Huge', H, 745469500),
  makePet('Huge Pumpkin Cat', '14976529226', 'Huge', H, 743659829),
  makePet('Huge Hoverboard Cat', '15542598827', 'Huge', H, 735915155),
  makePet('Huge Hacked Cat', '14976449581', 'Huge', H, 725360163),
  makePet('Huge Reaper Cat', '136851484598871', 'Huge', H, 721726855),
  makePet('Huge Grinch Cat', '14976448309', 'Huge', H, 716239231),
  makePet('Huge Atlantean Orca', '14976355521', 'Huge', H, 713661298),
  makePet('Huge Pog Cat', '123648690581827', 'Huge', H, 709097510),
  makePet('Huge Sandcastle Cat', '14976541813', 'Huge', H, 698536404),
  makePet('Huge Bloo Cat', '17375064407', 'Huge', H, 694307627),
  makePet('Huge Super Corgi', '14976565468', 'Huge', H, 679483064),
  makePet('Huge Rainbow Unicorn', '14976532168', 'Huge', H, 677906634),
  makePet('Huge Valentines Cat', '16290990548', 'Huge', H, 674035324),
  makePet('Huge Floppa', '14976434470', 'Huge', H, 672509578),
  makePet('Huge Amethyst Dragon', '14976350251', 'Huge', H, 670067918),
  makePet('Huge Lucki Agony', '14976478543', 'Huge', H, 668460730),
  makePet('Huge Evolved Hacked Cat', '14976425579', 'Huge', H, 665296272),
  makePet('Huge Specter Owl', '96339575163664', 'Huge', H, 664851655),
  makePet('Huge Nightfall Pegasus', '15260481050', 'Huge', H, 662871162),
  makePet('Huge Neon Twilight Wolf', '15260481429', 'Huge', H, 662213351),
  makePet('Huge Mummy Cow', '98874916712415', 'Huge', H, 656637337),
  makePet('Huge Inferno Dominus', '14976463903', 'Huge', H, 651293693),
  makePet('Huge Doodle Agony', '117441180861427', 'Huge', H, 647229990),
  makePet('Huge Junkyard Hound', '82197525577335', 'Huge', H, 643111413),
  makePet('Huge Cool Cat', '14976385467', 'Huge', H, 627663943),
  makePet('Huge Sapphire Phoenix', '15260480400', 'Huge', H, 623518758),
  makePet('Huge Evolved Pixel Cat', '14976426599', 'Huge', H, 619495155),
  makePet('Huge Pixel Chick', '109348174675332', 'Huge', H, 618764856),
  makePet('Huge Nightmare Cyclops', '98277417659107', 'Huge', H, 608031831),
  makePet('Huge Scuba Dog', '139017924153372', 'Huge', H, 600247432),
  makePet('Huge Emoji Monkey', '16047450351', 'Huge', H, 598085974),
  makePet('Huge Festive Cat', '15281989250', 'Huge', H, 594726422),
  makePet('Huge Dominus Darkwing', '100391666936804', 'Huge', H, 586370725),
  makePet('Huge Vampire Agony', '130091557043756', 'Huge', H, 571939313),
  makePet('Huge Wild Fire Agony', '14976578547', 'Huge', H, 571150043),
  makePet('Huge Sad Doge', '126938121450876', 'Huge', H, 570577311),
  makePet('Huge Sun Angelus', '14976564553', 'Huge', H, 569134258),
  makePet('Huge Arcade Cat', '14976352617', 'Huge', H, 562343443),
  makePet('Huge Firefly', '16744676508', 'Huge', H, 558986251),
  makePet('Huge Hologram Axolotl', '14976456919', 'Huge', H, 549420558),
  makePet('Huge Brain', '88763930700070', 'Huge', H, 545505825),
  makePet('Huge Nightfall Wolf', '15260480737', 'Huge', H, 539866264),
  makePet('Huge Pastel Sock Dragon', '14976513814', 'Huge', H, 535258361),
  makePet('Huge Hot Dog', '16250978135', 'Huge', H, 517318207),
  makePet('Huge Husky', '14976460483', 'Huge', H, 517043434),
  makePet('Huge UV Kitsune Ball', '133144353929951', 'Huge', H, 513313114),
  makePet('Huge Hacked Skeleton', '134082855413685', 'Huge', H, 511832300),
  makePet('Huge Nyan Cat', '111205928887511', 'Huge', H, 502974725),
  makePet('Huge Doodle Bee', '84450044658879', 'Huge', H, 473672730),
  makePet('Huge White Tiger', '14976576861', 'Huge', H, 472698980),
  makePet('Huge Celestial Dragon', '15163489240', 'Huge', H, 469742173),
  makePet('Huge Pixel Agony', '85105390467566', 'Huge', H, 468873785),
  makePet('Huge Neon Cat', '14976497661', 'Huge', H, 466080431),
  makePet('Huge 404 Demon', '17288680692', 'Huge', H, 463619683),
  makePet('Huge Peppermint Angelus', '15716049163', 'Huge', H, 461223307),
  makePet('Huge Autumn Chest Mimic', '131920407611756', 'Huge', H, 458359232),
  makePet('Huge Shadow Griffin', '14976546605', 'Huge', H, 456949197),
  makePet('Huge Arcane Dominus', '84981023975118', 'Huge', H, 453882718),
  makePet('Huge Athena Owl', '117588896362117', 'Huge', H, 450800024),
  makePet('Huge Storm Dominus', '15260478906', 'Huge', H, 449719528),
  makePet('Huge Googly Shark', '103658339806343', 'Huge', H, 448739123),
  makePet('Huge Super Tiger', '16746767650', 'Huge', H, 447773462),
  makePet('Huge BIG Maskot', '14976363084', 'Huge', H, 445648964),
  makePet('Huge Knife Cat', '14976472648', 'Huge', H, 445105678),
  makePet('Huge Pixel Sad Cat', '132317712200378', 'Huge', H, 437157460),
  makePet('Huge Valentines Angelus', '74709418271997', 'Huge', H, 434724458),
  makePet('Huge Gleebo The Alien', '14976443059', 'Huge', H, 432642429),
  makePet('Huge Forged Robot', '136825338355926', 'Huge', H, 432058616),
  makePet('Huge Evolved Cupcake', '14976425356', 'Huge', H, 430957357),
  makePet('Huge Party Penguin', '14976511281', 'Huge', H, 428400901),
  makePet('Huge Matryoshka Capybara', '135978924000516', 'Huge', H, 424788745),
  makePet('Huge Matryoshka Dino', '130741332412242', 'Huge', H, 416120575),
  makePet('Huge Ghoul Horse', '138823579638125', 'Huge', H, 413103862),
  makePet('Huge Mrs. Claws', '14976494867', 'Huge', H, 412340324),
  makePet('Huge Samurai Dragon', '14976541241', 'Huge', H, 410820681),
  makePet('Huge Jelly Butterfly', '119227116644693', 'Huge', H, 405587025),
  makePet('Huge Claw Beast', '102986417616097', 'Huge', H, 404875438),
  makePet('Huge Shark', '14976546876', 'Huge', H, 403392746),
  makePet('Huge Safari Cat', '14976538607', 'Huge', H, 399540365),
  makePet('Huge Machete Dog', '108025600456665', 'Huge', H, 396379976),
  makePet('Huge Comet Cyclops', '14976385072', 'Huge', H, 393764671),
  makePet('Huge Ninja Axolotl', '14976503103', 'Huge', H, 390485213),
  makePet('Huge Hypnotic Dragon', '90381015332493', 'Huge', H, 390364424),
  makePet('Huge Cupcake', '14976389145', 'Huge', H, 384423783),
  makePet('Huge Dot Matrix Axolotl', '121462024507634', 'Huge', H, 383537146),
  makePet('Huge Wild Corrupt Agony', '83829095123136', 'Huge', H, 377494540),
  makePet('Huge Snow Globe Hamster', '83324398369784', 'Huge', H, 376976030),
  makePet('Huge Techno Cat', '14976566707', 'Huge', H, 376098213),
  makePet('Huge Party Cat', '14976508941', 'Huge', H, 371171329),
  makePet('Huge Wicked Angelus', '87751794177322', 'Huge', H, 362046783),
  makePet('Huge Strawberry Cow', '14976561960', 'Huge', H, 358174428),
  makePet('Huge Cyborg Cat', '14976391620', 'Huge', H, 355985515),
  makePet('Huge Vampire Dragon', '122834900117274', 'Huge', H, 353760752),
  makePet('Huge Nice Cat', '135884487799308', 'Huge', H, 351828845),
  makePet('Huge Cartoon Demon', '114799627163759', 'Huge', H, 351811532),
  makePet('Huge Corn Cat', '115417271549195', 'Huge', H, 349216595),
  makePet('Huge Chad Bunny', '106226869216523', 'Huge', H, 348767444),
  makePet('Huge Valkyrie Wolf', '18465100470', 'Huge', H, 340334967),
  makePet('Huge Sailor Shark', '14976540139', 'Huge', H, 339614138),
  makePet('Huge Tech Samurai Cat', '17028331108', 'Huge', H, 339451949),
  makePet('Huge Kaiju Hydra', '104819925091161', 'Huge', H, 332201161),
  makePet('Huge Matrix Monkey', '17861579273', 'Huge', H, 328039854),
  makePet('Huge Pixel Cat', '14976519049', 'Huge', H, 323662455),
  makePet('Huge Poison Turtle', '90099723016359', 'Huge', H, 317092820),
  makePet('Huge Soul Dragon', '95241548572659', 'Huge', H, 312871404),
  makePet('Huge Bear', '14976361884', 'Huge', H, 311032571),
  makePet('Huge Stacked Dominus', '96928518190910', 'Huge', H, 309979636),
  makePet('Huge Tralala Brainrot', '130205496743645', 'Huge', H, 309401945),
  makePet('Huge Pixel Capybara', '120551262539366', 'Huge', H, 308844002),
  makePet('Huge Fragmented Golem', '104056264494147', 'Huge', H, 308178183),
  makePet('Huge Pixel M-2 PROTOTYPE', '114437689272259', 'Huge', H, 307254094),
  makePet('Huge Phantom Wolf', '73617612474545', 'Huge', H, 306180063),
  makePet('Huge Baby Piglet', '115008493887428', 'Huge', H, 303059211),
  makePet('Huge Sun Griffin', '122831150159277', 'Huge', H, 301628275),
  makePet('Huge Rich Corgi', '124517901804987', 'Huge', H, 300472813),
  makePet('Huge Firefighter Dalmation', '14976432950', 'Huge', H, 296330008),
  makePet('Huge Little Melty', '125054778559458', 'Huge', H, 293300285),
  makePet('Huge Snow Globe Corgi', '77464634142348', 'Huge', H, 290913811),
  makePet('Huge Good vs Evil Dragon', '18256895106', 'Huge', H, 288865355),
  makePet('Huge Wireframe Cat', '129889522181856', 'Huge', H, 286657121),
  makePet('Huge Hologram Shark', '14976457374', 'Huge', H, 286563769),
  makePet('Huge Abstract Agony', '121388356688777', 'Huge', H, 284281427),
  makePet('Huge Forcefield Cat', '85865166902992', 'Huge', H, 284059545),
  makePet('Huge Baby Puppy', '133001320495204', 'Huge', H, 284038300),
  makePet('Huge Midnight Axolotl', '124395858788677', 'Huge', H, 282898235),
  makePet('Huge Party Dog', '14976510103', 'Huge', H, 278863962),
  makePet('Huge Aura Dominus', '96765579469696', 'Huge', H, 277930641),
  makePet('Huge Party Crown Ducky', '14976509521', 'Huge', H, 273889669),
  makePet('Huge Jelly Hydra', '109899952808122', 'Huge', H, 272602618),
  makePet('Huge Redstone Cat', '14976533671', 'Huge', H, 267055106),
  makePet('Huge Unicorn', '14976573179', 'Huge', H, 262168171),
  makePet('Huge Fairy', '14976428656', 'Huge', H, 261442968),
  makePet('Huge Doodle Cat', '14976402524', 'Huge', H, 260136595),
  makePet('Huge Zeus Bear', '112711947085113', 'Huge', H, 252582736),
  makePet('Huge Orca', '14976506366', 'Huge', H, 252043448),
  makePet('Huge Nightmare Spirit', '14976825431', 'Huge', H, 251820862),
  makePet('Huge Sketch Dragon', '17027110585', 'Huge', H, 250218415),
  makePet('Huge Blazing Bat', '17749191682', 'Huge', H, 243990758),
  makePet('Huge Midnight Cat', '137864465151841', 'Huge', H, 241290650),
  makePet('Huge Keyboard Cat', '135774541851149', 'Huge', H, 237429749),
  makePet('Huge Quantum Agony', '18886114160', 'Huge', H, 235986677),
  makePet('Huge Storm Axolotl', '136706503808298', 'Huge', H, 234126245),
  makePet('Huge Easter Yeti', '14976418843', 'Huge', H, 231847274),
  makePet('Huge Cartoon Bunny', '83751288485339', 'Huge', H, 230949263),
  makePet('Huge Lucki Chest Mimic', '76209866418616', 'Huge', H, 228089729),
  makePet('Huge Silver Bison', '84066657205534', 'Huge', H, 227229624),
  makePet('Huge Sun Agony', '17687869169', 'Huge', H, 226249702),
  makePet('Huge Clover Owl', '138442898804320', 'Huge', H, 225734920),
  makePet('Huge Fox', '14976436421', 'Huge', H, 222008806),
  makePet('Huge Black Hole Axolotl', '17285736425', 'Huge', H, 221793002),
  makePet('Huge Leprechaun Dog', '82125738012621', 'Huge', H, 214019590),
  makePet('Huge Super Coral Hydra', '70870472183962', 'Huge', H, 206256494),
  makePet('Huge Lit Loris', '132382180739478', 'Huge', H, 205371835),
  makePet('Huge Wild Galaxy Agony', '126232720900762', 'Huge', H, 204919794),
  makePet('Huge Vampire Bat', '14976574393', 'Huge', H, 203881649),
  makePet('Huge Jungle Golem', '125686962742036', 'Huge', H, 202750197),
  makePet('Huge Classic Dragon', '18883372375', 'Huge', H, 202307667),
  makePet('Huge Evolved Pterodactyl', '14976427082', 'Huge', H, 201897136),
  makePet('Huge Divinus', '18152335113', 'Huge', H, 199985274),
  makePet('Huge Abstract Dominus', '138676503703270', 'Huge', H, 197111515),
  makePet('Huge Snuggle Beast', '121269844135033', 'Huge', H, 196918544),
  makePet('Huge Pirate Parrot', '14976518880', 'Huge', H, 196702036),
  makePet('Huge Starry Owl', '75830065128767', 'Huge', H, 195322135),
  makePet('Huge Panther', '127123894075183', 'Huge', H, 193202442),
  makePet('Huge Ancient Dragon', '18626986876', 'Huge', H, 192108729),
  makePet('Huge Bejeweled Lion', '17450309030', 'Huge', H, 191734594),
  makePet('Huge Triceratops', '18758757156', 'Huge', H, 190558137),
  makePet('Huge Prison Cow', '79315838011992', 'Huge', H, 190203508),
  makePet('Huge Angel Cow', '136952666611096', 'Huge', H, 189701698),
  makePet('Huge Umbrella Cat', '14976572705', 'Huge', H, 189462719),
  makePet('Huge Jurassic Beaver', '97754526096215', 'Huge', H, 182219128),
  makePet('Huge Diamond Dog', '16250896717', 'Huge', H, 180277825),
  makePet('Huge Sprout Wyrmling', '117238217692099', 'Huge', H, 178818502),
  makePet('Huge Stargazing Wolf', '17602431693', 'Huge', H, 178371228),
  makePet('Huge Empyrean Agony', '14976421040', 'Huge', H, 177456297),
  makePet('Huge Dot Matrix Cat', '118273434697077', 'Huge', H, 176073786),
  makePet('Huge Kawaii Tiger', '18539512677', 'Huge', H, 175574958),
  makePet('Huge Googly Corgi', '127100039471519', 'Huge', H, 174104455),
  makePet('Huge Masked Owl', '14976487652', 'Huge', H, 173947999),
  makePet('Huge Forged Cyclops', '108970973027495', 'Huge', H, 173814604),
  makePet('Huge Unicorn Dragon', '15163489495', 'Huge', H, 171232054),
  makePet('Huge Red Fluffy', '14976533036', 'Huge', H, 170337187),
  makePet('Huge Dove', '14976414513', 'Huge', H, 169740188),
  makePet('Huge Yin-Yang Dragon', '139547008385454', 'Huge', H, 168240431),
  makePet('Huge Totem Cat', '94635272523111', 'Huge', H, 167605388),
  makePet('Huge Pot of Gold Corgi', '106744072159762', 'Huge', H, 166389922),
  makePet('Huge Kawaii Dragon', '14976470932', 'Huge', H, 164126825),
  makePet('Huge Evolved King Cobra', '14976426069', 'Huge', H, 162722658),
  makePet('Huge Classic Dog', '18883372166', 'Huge', H, 162461291),
  makePet('Huge Cheerful Yeti', '14976375591', 'Huge', H, 162329170),
  makePet('Huge Kaiju Sea Dragon', '77556334425969', 'Huge', H, 161411899),
  makePet('Huge Stargazing Axolotl', '17602432142', 'Huge', H, 159083838),
  makePet('Huge Tech Chest Mimic', '14976490534', 'Huge', H, 157764484),
  makePet('Huge Evolved Peacock', '14976426399', 'Huge', H, 157532300),
  makePet('Huge Midnight Zebra', '137637076572981', 'Huge', H, 156448254),
  makePet('Huge Skeleton Shark', '87082066811704', 'Huge', H, 155607840),
  makePet('Huge Sketch Corgi', '17027110720', 'Huge', H, 155302369),
  makePet('Huge Valkyrie Dog', '18465101315', 'Huge', H, 154748663),
  makePet('Huge Jelly Kitsune', '98444936936302', 'Huge', H, 153199326),
  makePet('Huge Storm Axolotl Ball', '123709369335154', 'Huge', H, 152350899),
  makePet('Huge Hydra Dino', '18741937148', 'Huge', H, 151353932),
  makePet('Huge Night Terror Cat', '17451173023', 'Huge', H, 151143825),
  makePet('Huge Bubble Hydra', '88580020696117', 'Huge', H, 150773225),
  makePet('Huge Flex Tiger', '18127488955', 'Huge', H, 149813623),
  makePet('Huge Runebound Bobcat', '75929351206941', 'Huge', H, 148000165),
  makePet('Huge Treasure Turtle', '18556268254', 'Huge', H, 146936329),
  makePet('Huge Soul Cat', '114453311306931', 'Huge', H, 145351021),
  makePet('Huge Nightmare Dog', '78024171936128', 'Huge', H, 145342743),
  makePet('Huge Watermelon Golem', '79014602144468', 'Huge', H, 142696045),
  makePet('Huge Toy Duck', '118862307433647', 'Huge', H, 142301348),
  makePet('Huge Tarantula', '124339060912566', 'Huge', H, 141232439),
  makePet('Huge Devil Agony', '18256894534', 'Huge', H, 140881705),
  makePet('Huge Graffiti Raccoon', '120010094799102', 'Huge', H, 140135237),
  makePet('Huge Luchador Eagle', '92111973498255', 'Huge', H, 140001196),
  makePet('Huge Patchwork Teddy Bear', '101792961428557', 'Huge', H, 137736711),
  makePet('Huge Masked Fox', '17749184083', 'Huge', H, 134117995),
  makePet('Huge Fragmented Pterodactyl', '89915786412548', 'Huge', H, 133449249),
  makePet('Huge Chameleon', '14976375382', 'Huge', H, 133385374),
  makePet('Huge Blazing Shark', '17749190912', 'Huge', H, 132417131),
  makePet('Huge Pot of Gold Cat', '123890112908568', 'Huge', H, 130953170),
  makePet('Huge Chef Monkey', '14976376567', 'Huge', H, 129746300),
  makePet('Huge Electric Cat', '16914837316', 'Huge', H, 128706039),
  makePet('Huge Hypnotic Cat', '111380702185705', 'Huge', H, 128368094),
  makePet('Huge Robber Cat', '17604035571', 'Huge', H, 127045340),
  makePet('Huge Mucki', '126924768939379', 'Huge', H, 125093683),
  makePet('Huge Purple Dragon', '16251004392', 'Huge', H, 124858900),
  makePet('Huge Bejeweled Unicorn', '17450309349', 'Huge', H, 124123918),
  makePet('Huge Devil Dominus', '18256894835', 'Huge', H, 123115055),
  makePet('Huge Raptor', '18758705093', 'Huge', H, 122733541),
  makePet('Huge Nightmare Sludge', '100374100910394', 'Huge', H, 122720917),
  makePet('Huge Tiedye Corgi', '14976569398', 'Huge', H, 122292309),
  makePet('Huge Honey Golem', '137790687877183', 'Huge', H, 120237160),
  makePet('Huge Pixel Tiger', '91955794019105', 'Huge', H, 120205362),
  makePet('Huge Chad Elephant', '125515994456210', 'Huge', H, 118989949),
  makePet('Huge Exquisite Cat', '14976427289', 'Huge', H, 118097138),
  makePet('Huge Easter Golem', '98455133654568', 'Huge', H, 116746854),
  makePet('Huge Pixie Bee', '87836274620619', 'Huge', H, 116560078),
  makePet('Huge Cupid Corgi', '14976389349', 'Huge', H, 115790874),
  makePet('Huge Virus Griffin', '17857638038', 'Huge', H, 115061734),
  makePet('Huge Clover Fairy', '16744695511', 'Huge', H, 114662259),
  makePet('Huge Yin-Yang Bunny', '75417612099373', 'Huge', H, 114039540),
  makePet('Huge Party Axolotl', '14976508713', 'Huge', H, 113711725),
  makePet('Huge Treasure Golem', '77267608223080', 'Huge', H, 112813061),
  makePet('Huge Werewolf', '99136154252309', 'Huge', H, 111863140),
  makePet('Huge Meebo The Alien Ball', '105987856358688', 'Huge', H, 109426548),
  makePet('Huge Scary Cat', '15281988446', 'Huge', H, 108734978),
  makePet('Huge Dark Dragon', '74325129208178', 'Huge', H, 108337473),
  makePet('Huge Leprechaun Corgi', '121626640440926', 'Huge', H, 106712850),
  makePet('Huge Marshmallow Agony', '14976486981', 'Huge', H, 106552384),
  makePet('Huge Gingerbread Angelus', '137630213066675', 'Huge', H, 106173127),
  makePet('Huge Doodle Fairy', '14976404766', 'Huge', H, 105979244),
  makePet('Huge Elf Dog', '14976420144', 'Huge', H, 105285117),
  makePet('Huge Painted Cat', '14976507206', 'Huge', H, 105172548),
  makePet('Huge Kitsune Fox', '18352502490', 'Huge', H, 105104970),
  makePet('Huge Blossom Spirit', '91486613555331', 'Huge', H, 104823731),
  makePet('Huge Error Cat', '14976424262', 'Huge', H, 104792005),
  makePet('Huge Fireball Cat', '106665613932679', 'Huge', H, 102881132),
  makePet('Huge Jester Dog', '16746769132', 'Huge', H, 102772542),
  makePet('Huge Hi-Tech Tiger', '16472006999', 'Huge', H, 102631793),
  makePet('Huge Clover Unicorn', '14976383846', 'Huge', H, 102391176),
  makePet('Huge Ducky Magician', '113798399729190', 'Huge', H, 102211688),
  makePet('Huge UV Kitsune', '18351655777', 'Huge', H, 100762182),
  makePet('Huge Spectral Deer', '72961994800686', 'Huge', H, 100682947),
  makePet('Huge Leprechaun Kitsune', '100650487607408', 'Huge', H, 100117007),
  makePet('Huge Fire Horse', '15480654527', 'Huge', H, 99307174),
  makePet('Huge Easter Dominus', '14976417278', 'Huge', H, 99195328),
  makePet('Huge Crystal Dog', '14976388450', 'Huge', H, 98655652),
  makePet('Huge Soccer Terrier', '78064428614816', 'Huge', H, 96813244),
  makePet('Huge Witch Wolf', '133897914197133', 'Huge', H, 96613436),
  makePet('Huge Evil Snowman', '117577340597461', 'Huge', H, 96597081),
  makePet('Huge Pixel Monkey', '80158581180196', 'Huge', H, 95620407),
  makePet('Huge Lucki Golem', '82253634531547', 'Huge', H, 95149203),
  makePet('Huge Love Peacock', '126019438810546', 'Huge', H, 94096323),
  makePet('Huge Mosaic Griffin', '14976494343', 'Huge', H, 93747492),
  makePet('Huge Egg Chick', '135817707784435', 'Huge', H, 93496500),
  makePet('Huge Poseidon Dog', '14976526838', 'Huge', H, 93407091),
  makePet('Huge Tiedye Cat', '14976568867', 'Huge', H, 92596917),
  makePet('Huge Turtle', '14976572325', 'Huge', H, 92119882),
  makePet('Huge Luchador Coyote', '111458078240780', 'Huge', H, 91716928),
  makePet('Huge Scary Corgi', '15281988264', 'Huge', H, 91379822),
  makePet('Huge Floatie Penguin', '90846690350439', 'Huge', H, 91312212),
  makePet('Huge Flex Fluffy Cat', '18127488650', 'Huge', H, 91020570),
  makePet('Huge Cappuccina Brainrot', '110814000442591', 'Huge', H, 90930065),
  makePet('Huge Wishing Dragon', '106906458368266', 'Huge', H, 90871152),
  makePet('Huge Coach Tiger', '72728231743832', 'Huge', H, 90594693),
  makePet('Huge Elf Cat', '14976419865', 'Huge', H, 90555298),
  makePet('Huge Disco Ball Dragon', '18458208582', 'Huge', H, 90246915),
  makePet('Huge Enchanted Deer', '14976423228', 'Huge', H, 90077436),
  makePet('Huge Love Lion', '123099034281785', 'Huge', H, 88508059),
  makePet('Huge Leprechaun Cat', '14976475596', 'Huge', H, 88090716),
  makePet('Huge Special Ops Dog', '88026158372953', 'Huge', H, 87813529),
  makePet('Huge Strawberry Corgi', '15634002728', 'Huge', H, 87810884),
  makePet('Huge Evolved Icy Phoenix', '137094796065163', 'Huge', H, 87312370),
  makePet('Huge Wave Spirit', '101464830006395', 'Huge', H, 86895001),
  makePet('Huge Boxing Elephant', '110943916892100', 'Huge', H, 86576052),
  makePet('Huge Arcade Angelus', '119811643774598', 'Huge', H, 85647231),
  makePet('Huge Easter Angelus', '102295861032789', 'Huge', H, 85555102),
  makePet('Huge Pixel Yeti', '131996280038414', 'Huge', H, 85068324),
  makePet('Huge Luau Cat', '14976477787', 'Huge', H, 84611733),
  makePet('Huge Slasher Sloth', '115427285712502', 'Huge', H, 84439991),
  makePet('Huge Tiedye Axolotl', '14976567779', 'Huge', H, 83707627),
  makePet('Huge Jolly Owl', '103505479597539', 'Huge', H, 83098802),
  makePet('Huge Evolved Hell Rock', '14976425869', 'Huge', H, 82793418),
  makePet('Huge Gym Scorpion', '82303153411870', 'Huge', H, 82554394),
  makePet('Huge Origami Shark', '89090934657295', 'Huge', H, 82111958),
  makePet('Huge Evolved Elephant', '94951927058710', 'Huge', H, 81435284),
  makePet('Huge Dark Lord', '18152338133', 'Huge', H, 81390122),
  makePet('Huge Luxe Axolotl', '96174972080942', 'Huge', H, 81080595),
  makePet('Huge Cyborg Dragon', '14976392605', 'Huge', H, 81039377),
  makePet('Huge Totem Wolf', '130997023659211', 'Huge', H, 80799253),
  makePet('Huge Hacked Reaper', '119356588704518', 'Huge', H, 80472831),
  makePet('Huge Ghost Axolotl', '78816523921536', 'Huge', H, 80419351),
  makePet('Huge Hell Monkey', '75557706152622', 'Huge', H, 79790838),
  makePet('Huge Mosaic Corgi', '14976493326', 'Huge', H, 79701539),
  makePet('Huge Guard Hydra', '79622017350328', 'Huge', H, 79681541),
  makePet('Huge Atomic Axolotl', '17515613028', 'Huge', H, 79660141),
  makePet('Huge Pixel Dragon', '14976521054', 'Huge', H, 79592952),
  makePet('Huge Platypus', '81423443378217', 'Huge', H, 78138652),
  makePet('Huge Meebo in a Spaceship', '14976488429', 'Huge', H, 77952002),
  makePet('Huge Party Crown Hippomelon', '105303258618878', 'Huge', H, 77680468),
  makePet('Huge Guard Dragon', '106968856805193', 'Huge', H, 77420448),
  makePet('Huge Pineapple Cat', '14976517235', 'Huge', H, 77220211),
  makePet('Huge Evolved Kangaroo', '80169939922601', 'Huge', H, 76756682),
  makePet('Huge Easter Agony', '117110951312046', 'Huge', H, 76696088),
  makePet('Huge Jetpack Cat', '112353118554284', 'Huge', H, 76541254),
  makePet('Huge Jurassic Crocodile', '116989921255882', 'Huge', H, 76495634),
  makePet('Huge Naughty Dominus', '75328747799299', 'Huge', H, 76436835),
  makePet('Huge Trojan Horse', '127674627495853', 'Huge', H, 75720718),
  makePet('Huge Super Coral Axolotl', '123726574453022', 'Huge', H, 75708613),
  makePet('Huge Pumpkin Dog', '71270630021360', 'Huge', H, 75695829),
  makePet('Huge Plague Dragon', '17375065126', 'Huge', H, 75289432),
  makePet('Huge Sleigh Axolotl', '77508464202964', 'Huge', H, 75269780),
  makePet('Huge Electric Werewolf', '126966146144158', 'Huge', H, 75185382),
  makePet('Huge Elf Golem', '119266692715617', 'Huge', H, 74846721),
  makePet('Huge LeGoat Ball', '85572580085074', 'Huge', H, 74705434),
  makePet('Huge Patchwork Bunny', '120785546705705', 'Huge', H, 74476905),
  makePet('Huge Easter Bunny', '14976566967', 'Huge', H, 73907210),
  makePet('Huge Tiedye Bunny', '14976568628', 'Huge', H, 73768670),
  makePet('Huge Enchanted Dog', '98036079803445', 'Huge', H, 73536718),
  makePet('Huge Chef Cat', '15281989941', 'Huge', H, 73484013),
  makePet('Huge Chill Sloth', '120533708082734', 'Huge', H, 73395464),
  makePet('Huge Evolved Bison', '98184057731755', 'Huge', H, 73362386),
  makePet('Huge Rose Cat', '103846288511073', 'Huge', H, 73253464),
  makePet('Huge Holiday Pegasus', '15716049550', 'Huge', H, 72556127),
  makePet('Huge Pastel Sock Bear', '84261728017151', 'Huge', H, 72232184),
  makePet('Huge Inferno Stealth Bobcat', '18644411865', 'Huge', H, 71609761),
  makePet('Huge Doodle Dragon', '103476619059265', 'Huge', H, 71569448),
  makePet('Huge Naughty Cat', '87910318681243', 'Huge', H, 71403397),
  makePet('Huge Goldfish', '95752779695636', 'Huge', H, 71371411),
  makePet('Huge Guard Wolf', '120663531720305', 'Huge', H, 71180957),
  makePet('Huge Jolly Penguin', '14976469674', 'Huge', H, 70582282),
  makePet('Huge Police Cat', '17588549479', 'Huge', H, 70316361),
  makePet('Huge Parrot', '106937805162090', 'Huge', H, 70246434),
  makePet('Huge Garden Goblin', '97942779030547', 'Huge', H, 70232965),
  makePet('Huge Shadow Dominus', '15804010569', 'Huge', H, 70080506),
  makePet('Huge Mech Dino', '18673257007', 'Huge', H, 69860418),
  makePet('Huge Leafstorm Wolf', '139340972718086', 'Huge', H, 69710051),
  makePet('Huge Guest Noob', '14976448855', 'Huge', H, 69123523),
  makePet('Huge Snowflake Dominus', '83373370051521', 'Huge', H, 69045963),
  makePet('Huge Flamethrower Spider', '73032919339096', 'Huge', H, 68993788),
  makePet('Huge Good vs Evil Cat', '18155109260', 'Huge', H, 68480308),
  makePet('Huge Atomic Forged Shark', '18978050454', 'Huge', H, 68393985),
  makePet('Huge Jaguar', '121900456724248', 'Huge', H, 67917597),
  makePet('Huge Lucki Angelus', '139803624702732', 'Huge', H, 67772136),
  makePet('Huge Skeleton', '14976548258', 'Huge', H, 67176723),
  makePet('Huge Candycane', '103105073784990', 'Huge', H, 66895617),
  makePet('Huge Carnival Panda', '92219735800314', 'Huge', H, 66515088),
  makePet('Huge Candycane Kitsune', '74407552054754', 'Huge', H, 66152266),
  makePet('Huge Crash Dummy Noob', '138395333405462', 'Huge', H, 65490307),
  makePet('Huge Shattered Heart Agony', '129768641287127', 'Huge', H, 64721094),
  makePet('Huge Pterodactyl', '14976527837', 'Huge', H, 63589625),
  makePet('Huge Arcade Dragon', '16756391066', 'Huge', H, 63303770),
  makePet('Huge Librarian Beaver', '103600701852967', 'Huge', H, 63008282),
  makePet('Huge Hell Rock', '14976455394', 'Huge', H, 62738217),
  makePet('Huge Raining Love Dog', '73797455811877', 'Huge', H, 62404509),
  makePet('Huge Evolved Easter Lamb', '114656946868089', 'Huge', H, 62066664),
  makePet('Huge Ooze Corgi', '140383295631296', 'Huge', H, 62031797),
  makePet('Huge Sage Axolotl', '18256895424', 'Huge', H, 61638282),
  makePet('Huge Pumpkin Scarecrow', '116673779811156', 'Huge', H, 61564404),
  makePet('Huge Minecart Piggy', '106752259915805', 'Huge', H, 61547795),
  makePet('Huge Stealth Bobcat', '14976557639', 'Huge', H, 61192370),
  makePet('Huge Withered Agony', '127219457030426', 'Huge', H, 61083318),
  makePet('Huge Clover Lion', '123334593122447', 'Huge', H, 60683453),
  makePet('Huge Evil Kitsune', '122958548174928', 'Huge', H, 60351358),
  makePet('Huge Beans Balloon Cat', '14976361583', 'Huge', H, 59857303),
  makePet('Huge Lucki Monkey', '114063062613222', 'Huge', H, 59788516),
  makePet('Huge Knight Slime', '93884562630486', 'Huge', H, 59670181),
  makePet('Huge Inferno Stealth Cat', '18644412090', 'Huge', H, 59635200),
  makePet('Huge Stealth Dragon', '14976557966', 'Huge', H, 59479417),
  makePet('Huge Scarecrow Cat', '14976543713', 'Huge', H, 59227298),
  makePet('Huge Sloth', '77873746102691', 'Huge', H, 59020135),
  makePet('Huge Krampus', '127076260732138', 'Huge', H, 58949638),
  makePet('Huge Honey Bear', '83794143197410', 'Huge', H, 58808141),
  makePet('Huge Warrior Wolf', '18256895705', 'Huge', H, 58780903),
  makePet('Huge Autumn Red Panda', '119442470085082', 'Huge', H, 58626300),
  makePet('Huge Evolved Rogue Squid', '88584631141101', 'Huge', H, 58616537),
  makePet('Huge Obsidian Griffin', '105493952601280', 'Huge', H, 58594034),
  makePet('Huge Bearserker', '14976362435', 'Huge', H, 58131146),
  makePet('Huge Baby Kitten', '108106366016899', 'Huge', H, 58107458),
  makePet('Huge Lumi Axolotl', '16410740491', 'Huge', H, 57654327),
  makePet('Huge Royal Pooka', '80049481266814', 'Huge', H, 57522251),
  makePet('Huge Yee-haw Cat', '85182651602746', 'Huge', H, 57139946),
  makePet('Huge Evolved Frankenpup Dog', '85621910541891', 'Huge', H, 56321851),
  makePet('Huge Abomination', '70697028891589', 'Huge', H, 56263699),
  makePet('Huge Rich Cat', '16744715368', 'Huge', H, 56260762),
  makePet('Huge Toy Chest Mimic', '111386850399193', 'Huge', H, 56140808),
  makePet('Huge Evolved Player Fox', '88581357457195', 'Huge', H, 55986312),
  makePet('Huge Pastel Elephant', '16498745846', 'Huge', H, 55110896),
  makePet('Huge King Cobra', '14976472289', 'Huge', H, 55065884),
  makePet('Huge Pristine Snake', '18556267952', 'Huge', H, 54760708),
  makePet('Huge Evil Imp', '18150534002', 'Huge', H, 54747007),
  makePet('Huge Super Spider', '118018926499852', 'Huge', H, 54682986),
  makePet('Huge Aura Fox', '102863074844102', 'Huge', H, 54465313),
  makePet('Huge Valentines Dominus', '79026289241532', 'Huge', H, 54410209),
  makePet('Huge Clover Butterfly', '111786177414558', 'Huge', H, 53637903),
  makePet('Huge Gecko', '14976440578', 'Huge', H, 53515806),
  makePet('Huge Hell Spider', '92181296313546', 'Huge', H, 53348134),
  makePet('Huge Bobcat', '117053043329448', 'Huge', H, 53154842),
  makePet('Huge Avenging Griffin', '18150841344', 'Huge', H, 52771567),
  makePet('Huge Mosaic Lamb', '14976494608', 'Huge', H, 52553224),
  makePet('Huge Rave Butterfly', '18458208075', 'Huge', H, 52324227),
  makePet('Huge Evolved Pixel Griffin', '121188358881521', 'Huge', H, 52299636),
  makePet('Huge Rave Meebo in a Spaceship', '18351654787', 'Huge', H, 52183415),
  makePet('Huge Elemental Phoenix', '106964408163546', 'Huge', H, 52161954),
  makePet('Huge Egg Dino', '18741936725', 'Huge', H, 51902028),
  makePet('Huge Crystal Bat', '123270270237540', 'Huge', H, 51739649),
  makePet('Huge Slimezilla', '133814850196289', 'Huge', H, 51343318),
  makePet('Huge Pirate Dog', '128373074804496', 'Huge', H, 51339010),
  makePet('Huge Jelly Wizard', '84699945958141', 'Huge', H, 51259476),
  makePet('Huge Merry Manatee', '125341685392478', 'Huge', H, 51186804),
  makePet('Huge Angel Dragon', '118966983027329', 'Huge', H, 51169019),
  makePet('Huge Guard Dominus', '125199678702615', 'Huge', H, 50918204),
  makePet('Huge Sorcerer Bear', '18978051040', 'Huge', H, 50844272),
  makePet('Huge Jetpack Tiger', '124866391707961', 'Huge', H, 50716713),
  makePet('Huge Exquisite Parrot', '14976427729', 'Huge', H, 50657890),
  makePet('Huge Corrupt Butterfly', '18882974863', 'Huge', H, 50638452),
  makePet('Huge Lucki Wolf', '98519377335101', 'Huge', H, 49584014),
  makePet('Huge Pixel Corgi', '14976519576', 'Huge', H, 49497415),
  makePet('Huge Special Ops Ram', '73165145533261', 'Huge', H, 48692931),
  makePet('Huge Autumn Retriever', '127760564297635', 'Huge', H, 48620502),
  makePet('Huge Reindeer Agony', '126523808307279', 'Huge', H, 48446747),
  makePet('Huge Quartz Fox', '129331981737475', 'Huge', H, 48318165),
  makePet('Huge Dino', '108545390694992', 'Huge', H, 48280546),
  makePet('Huge Hacker Axolotl', '17769626736', 'Huge', H, 48171315),
  makePet('Huge Abyssal Axolotl', '16471981261', 'Huge', H, 47953497),
  makePet('Huge Pixie Fox', '17835929068', 'Huge', H, 47671756),
  makePet('Huge Demolition Cat', '128405982771054', 'Huge', H, 47421786),
  makePet('Huge Willow Wisp', '14976579205', 'Huge', H, 47360732),
  makePet('Huge Rootkin Fox', '76545663190754', 'Huge', H, 46892571),
  makePet('Huge Devil Tasmanian', '128236274006069', 'Huge', H, 46674067),
  makePet('Huge Gym Corgi', '100837906576069', 'Huge', H, 46569435),
  makePet('Huge Evolved Stingray', '132084946919332', 'Huge', H, 46549429),
  makePet('Huge Holiday Dove', '109237504369086', 'Huge', H, 46517078),
  makePet('Huge Knight Golem', '86043823769760', 'Huge', H, 46504904),
  makePet('Huge Evolved Evil Raven', '139468425219654', 'Huge', H, 46318803),
  makePet('Huge Anime Scorpion', '81320739190462', 'Huge', H, 46170549),
  makePet('Huge Leafy Deer', '74179288771824', 'Huge', H, 45968912),
  makePet('Huge Dino Dog', '18673255790', 'Huge', H, 45933551),
  makePet('Huge Cyber Agony', '16472011675', 'Huge', H, 45783725),
  makePet('Huge Ice Cube Penguin', '70749719164578', 'Huge', H, 45722521),
  makePet('Huge Mystical Whale', '128951201901873', 'Huge', H, 45224805),
  makePet('Huge Pixel Shadow Griffin', '138870297063423', 'Huge', H, 45015826),
  makePet('Huge Happy Computer', '16472013395', 'Huge', H, 44985940),
  makePet('Huge Gym Anteater', '113847537674540', 'Huge', H, 44906009),
  makePet('Huge Wicked Kirin', '80510335066918', 'Huge', H, 44884746),
  makePet('Huge Hippo', '14976456459', 'Huge', H, 44840118),
  makePet('Huge Peacock', '14976514269', 'Huge', H, 44830264),
  makePet('Huge Present Dragon', '78320766313104', 'Huge', H, 44719068),
  makePet('Huge Gorilla', '107479430028155', 'Huge', H, 44514864),
  makePet('Huge Gym Cow', '110341807315948', 'Huge', H, 44130533),
  makePet('Huge Evolved Scarecrow Dog', '72439149479995', 'Huge', H, 43973584),
  makePet('Huge Player Penguin', '121118923201338', 'Huge', H, 43675833),
  makePet('Huge Gym Beaver', '139877425237704', 'Huge', H, 42978184),
  makePet('Huge Skelemelon', '139632770230401', 'Huge', H, 42357577),
  makePet('Huge Alien', '123487033962716', 'Huge', H, 42151334),
  makePet('Huge Treasure Scorpion', '124383446911252', 'Huge', H, 41951936),
  makePet('Huge Marshmallow Kitsune', '95357265380757', 'Huge', H, 41884919),
  makePet('Huge Arcade Meebo in a Spaceship', '72018720220470', 'Huge', H, 41708855),
  makePet('Huge Dark Fox', '133312153663051', 'Huge', H, 41686635),
  makePet('Huge Shuriken Corgi', '18978050838', 'Huge', H, 41573451),
  makePet('Huge Nuclear Wild Dog', '18978050650', 'Huge', H, 41226523),
  makePet('Huge Bat', '14976360459', 'Huge', H, 41042684),
  makePet('Huge Snow Crab', '115554189574949', 'Huge', H, 40967867),
  makePet('Huge Ghostly Dragon', '93813808986344', 'Huge', H, 40815381),
  makePet('Huge Evolved Mining Penguin', '124239395763286', 'Huge', H, 40764396),
  makePet('Huge Lifeguard Shark', '75963541478121', 'Huge', H, 40687971),
  makePet('Huge Fragmented Dominus Ball', '100875909675761', 'Huge', H, 40612703),
  makePet('Huge Water Zebra', '132338879904830', 'Huge', H, 40524153),
  makePet('Huge Love Corgi', '112650153241543', 'Huge', H, 40477651),
  makePet('Huge Spitting Dino', '75776145321145', 'Huge', H, 40412886),
  makePet('Huge Mantis Shrimp', '83192948454394', 'Huge', H, 40242931),
  makePet('Huge Evolved Basket Bunny', '117009470735471', 'Huge', H, 40083916),
  makePet('Huge Rave Troll', '18351655132', 'Huge', H, 39911199),
  makePet('Huge Electric Dino', '18673256682', 'Huge', H, 39741289),
  makePet('Huge Hydra Axolotl', '76323621337981', 'Huge', H, 39484483),
  makePet('Huge Wild Frost Agony', '80433316929327', 'Huge', H, 39400754),
  makePet('Huge Squirrel', '14976555755', 'Huge', H, 39388442),
  makePet('Huge Coconut Corgi', '92543943369771', 'Huge', H, 39332356),
  makePet('Huge Sleigh Cat', '121879397544213', 'Huge', H, 39329400),
  makePet('Huge Abyssal Jellyfish', '18882975166', 'Huge', H, 39197545),
  makePet('Huge Temporal Owl', '18882992626', 'Huge', H, 38982520),
  makePet('Huge Jolly Narwhal', '14976825062', 'Huge', H, 38591677),
  makePet('Huge Mechatronic Robot', '18882975779', 'Huge', H, 38559287),
  makePet('Huge Blurred Axolotl', '89638501740571', 'Huge', H, 38480578),
  makePet('Huge Electric Bunny Ball', '102519001047451', 'Huge', H, 38217596),
  makePet('Huge Luxe Peacock', '18556267256', 'Huge', H, 38139528),
  makePet('Huge Rave Slime', '118307691118910', 'Huge', H, 38014937),
  makePet('Huge Happy Rock', '14976450873', 'Huge', H, 37562706),
  makePet('Huge Fluffy Cat', '15803982174', 'Huge', H, 37506944),
  makePet('Huge Shadow Pegasus', '131804456105000', 'Huge', H, 37440675),
  makePet('Huge Kawaii Dragon Ball', '108289198978887', 'Huge', H, 37403205),
  makePet('Huge Atomic Monkey Ball', '131025673327487', 'Huge', H, 37240638),
  makePet('Huge Origami Bunny', '83483274094182', 'Huge', H, 37194638),
  makePet('Huge Valentines Bear', '140051319290107', 'Huge', H, 37151484),
  makePet('Huge Evolved Red Wolf', '126635488798392', 'Huge', H, 37118799),
  makePet('Huge Poseidon Corgi', '15477703422', 'Huge', H, 37054008),
  makePet('Huge Galaxy Fox', '78675251181083', 'Huge', H, 36774798),
  makePet('Huge Vibrant Whale', '87407901102081', 'Huge', H, 36711046),
  makePet('Huge Crystal Spider', '78631219465603', 'Huge', H, 36671883),
  makePet('Huge Snowflake Dragon', '113631496802759', 'Huge', H, 36354563),
  makePet('Huge Red Panda', '14976533293', 'Huge', H, 36254872),
  makePet('Huge Loveserker', '100447142740271', 'Huge', H, 36200994),
  makePet('Huge Holographic Cat', '17515615256', 'Huge', H, 35873552),
  makePet('Huge Lit Cat', '93603448962886', 'Huge', H, 35669502),
  makePet('Huge Holiday Hedgehog', '104271630769332', 'Huge', H, 35597638),
  makePet('Huge Gorgon', '82639968294910', 'Huge', H, 35432867),
  makePet('Huge Alienus Kitsune', '135920143312386', 'Huge', H, 35173451),
  makePet('Huge Inkwell Wisp', '92033856546098', 'Huge', H, 34998093),
  makePet('Huge Rave Jaguar', '18458263548', 'Huge', H, 34995323),
  makePet('Huge Relic Deer', '113333249087302', 'Huge', H, 34896497),
  makePet('Huge Penguin', '118584949011008', 'Huge', H, 34413807),
  makePet('Huge Evolved Starry Eye Bunny', '76225100606605', 'Huge', H, 34295710),
  makePet('Huge Student Corgi', '129996809182527', 'Huge', H, 34132490),
  makePet('Huge Electric Slime', '134465209106329', 'Huge', H, 34091548),
  makePet('Huge Teacher Cat', '108033517958051', 'Huge', H, 34088005),
  makePet('Huge Gym Shark', '96513161978756', 'Huge', H, 33858129),
  makePet('Huge Sea Dragon', '109192796689135', 'Huge', H, 33799834),
  makePet('Huge Glowy the Ghost', '80650774485901', 'Huge', H, 33732544),
  makePet('Huge Colorful Wisp', '16410753529', 'Huge', H, 33677228),
  makePet('Huge Wizard Westie', '14976579774', 'Huge', H, 33642084),
  makePet('Huge Mushroom Snail', '106278894381097', 'Huge', H, 33590109),
  makePet('Huge Pumpkin Spice Cat', '126378743286438', 'Huge', H, 33523500),
  makePet('Huge Pineapple Monkey', '17689399533', 'Huge', H, 33457470),
  makePet('Huge Heartbreak Fairy', '129589212875010', 'Huge', H, 32945582),
  makePet('Huge Ancestor Eagle', '95278046256593', 'Huge', H, 32924103),
  makePet('Huge Veil Horse', '137004945467080', 'Huge', H, 32881501),
  makePet('Huge Whale Shark', '16725471591', 'Huge', H, 32775203),
  makePet('Huge Diamond Bunny', '100376851450682', 'Huge', H, 32757312),
  makePet('Huge Emerald Owl', '86244728271610', 'Huge', H, 32668904),
  makePet('Huge Gym Panda', '139794409376900', 'Huge', H, 32645948),
  makePet('Huge Knight Beagle', '15804006339', 'Huge', H, 32634104),
  makePet('Huge Lotus Koi Fish', '128936875098689', 'Huge', H, 32578570),
  makePet('Huge Rainbow Slime', '14976531943', 'Huge', H, 32488495),
  makePet('Huge Lightning Bat', '94725312781292', 'Huge', H, 32482138),
  makePet('Huge Hippomint', '105962472084546', 'Huge', H, 32324176),
  makePet('Huge Spring Dragon', '83560994028636', 'Huge', H, 32282526),
  makePet('Huge Coconut Flamingo', '124659391100423', 'Huge', H, 32272331),
  makePet('Huge Prison Cat', '17526083509', 'Huge', H, 32221180),
  makePet('Huge Horseshoe Capybara', '79249687154942', 'Huge', H, 32111718),
  makePet('Huge Ghost', '14976441222', 'Huge', H, 32066804),
  makePet('Huge Quantum Griffin', '103033034897992', 'Huge', H, 32028436),
  makePet('Huge Old Wizard Corgi', '18644412561', 'Huge', H, 31837143),
  makePet('Huge Mushroom Dragon', '98526628952494', 'Huge', H, 31753125),
  makePet('Huge Fossil Dragon', '14976436145', 'Huge', H, 31749401),
  makePet('Huge Evolved Mining Monkey', '108431740887325', 'Huge', H, 31692890),
  makePet('Huge Blue Lucky Block', '116957138915362', 'Huge', H, 31682785),
  makePet('Huge Nutcracker Cat', '131785972720265', 'Huge', H, 31655669),
  makePet('Huge Glitched Unicorn Ball', '129837188566308', 'Huge', H, 31642651),
  makePet('Huge Icy Phoenix', '77587429055460', 'Huge', H, 31625072),
  makePet('Huge Valentines Axolotl', '92646115385136', 'Huge', H, 31472721),
  makePet('Huge Sunflower Calf', '89310738281949', 'Huge', H, 31276242),
  makePet('Huge Dawn Phoenix', '104154597023155', 'Huge', H, 31162731),
  makePet('Huge Bloom Dominus', '86640323792392', 'Huge', H, 30952066),
  makePet('Huge Party Crown Corgi', '84718989767415', 'Huge', H, 30878118),
  makePet('Huge Pinecone Porcupine', '128031048512623', 'Huge', H, 30854295),
  makePet('Huge Old Wizard Owl', '18644413008', 'Huge', H, 30746956),
  makePet('Huge Tropical Toucan', '18644414181', 'Huge', H, 30480753),
  makePet('Huge Bunny Cat', '96756728639986', 'Huge', H, 30465958),
  makePet('Huge Party Corgi', '115749071497654', 'Huge', H, 30461783),
  makePet('Huge African Wild Dog', '137866343628136', 'Huge', H, 30409723),
  makePet('Huge Minecart Hamster', '106601892793198', 'Huge', H, 30398315),
  makePet('Huge Snowflake Pegasus', '128323283709486', 'Huge', H, 30372667),
  makePet('Huge Party Dragon', '16901792712', 'Huge', H, 30334363),
  makePet('Huge Poinsettia Peacock', '126024044464158', 'Huge', H, 30323612),
  makePet('Huge Propeller Cat', '15340315459', 'Huge', H, 30250676),
  makePet('Huge Holly Fawn', '123821214219134', 'Huge', H, 30240076),
  makePet('Huge Arcade Dog', '102621669325796', 'Huge', H, 30209056),
  makePet('Huge Holly Capybara', '113623794189618', 'Huge', H, 30164127),
  makePet('Huge Party Squirrel', '108200825731940', 'Huge', H, 30123918),
  makePet('Huge Basketball Corgi', '88019287527866', 'Huge', H, 30061219),
  makePet('Huge Electric Penguin', '77658045662575', 'Huge', H, 30029012),
  makePet('Huge Goblin', '14976446202', 'Huge', H, 29956421),
  makePet('Huge Cataclysm Bear', '126636577464770', 'Huge', H, 29905379),
  makePet('Huge Ice Snake', '72721925435619', 'Huge', H, 29885841),
  makePet('Huge Mermaid Cat', '14976489487', 'Huge', H, 29847236),
  makePet('Huge Robot', '110205883813636', 'Huge', H, 29791931),
  makePet('Huge Fiddlefern Cat', '106766832972765', 'Huge', H, 29676341),
  makePet('Huge Palace Pooka', '120508025732029', 'Huge', H, 29573314),
  makePet('Huge Valentines Unicorn', '87559926254835', 'Huge', H, 29552225),
  makePet('Huge Player Panda', '98031004094644', 'Huge', H, 29504204),
  makePet('Huge Anglerfish', '102757425603718', 'Huge', H, 29398869),
  makePet('Huge Horse', '112696303683971', 'Huge', H, 29166809),
  makePet('Huge Chocolate Bunny', '79481017800505', 'Huge', H, 28873878),
  makePet('Huge Bee', '14976362778', 'Huge', H, 28812428),
  makePet('Huge Chill Bunny', '87108901678067', 'Huge', H, 28530599),
  makePet('Huge Surfboard Axolotl', '134895528303880', 'Huge', H, 28502084),
  makePet('Huge Spring Bee', '137687744712532', 'Huge', H, 28474438),
  makePet('Huge Skeleton Cat', '99657539993632', 'Huge', H, 28351601),
  makePet('Huge Stunt Cat', '80484506977971', 'Huge', H, 28307591),
  makePet('Huge Giraffe', '14976442623', 'Huge', H, 28255216),
  makePet('Huge Spring Dino', '99022978600130', 'Huge', H, 28156016),
  makePet('Huge Lunar Moth', '17028306654', 'Huge', H, 28148833),
  makePet('Huge Robber Pug', '15804001482', 'Huge', H, 28074007),
  makePet('Huge Blurred Bear Ball', '133058816387774', 'Huge', H, 28046391),
  makePet('Huge Chill Polar Bear', '124471089861865', 'Huge', H, 27958751),
  makePet('Huge Lamb Wolf', '72351620062304', 'Huge', H, 27900704),
  makePet('Huge Spring Kitten', '129393017030092', 'Huge', H, 27895945),
  makePet('Huge Butterfly Pony', '130427218526414', 'Huge', H, 27869810),
  makePet('Huge Helicopter Cat', '14976453343', 'Huge', H, 27784495),
  makePet('Huge Diamond Chick', '79413984807049', 'Huge', H, 27723901),
  makePet('Huge Eclipse Owl', '106929390805837', 'Huge', H, 27659097),
  makePet('Huge Fancy Axolotl', '14976429135', 'Huge', H, 27631538),
  makePet('Huge Festive Seal', '121873386766313', 'Huge', H, 27628837),
  makePet('Huge Chill Parrot', '104805390421143', 'Huge', H, 27619514),
  makePet('Huge Leafy Yeti', '123501144563206', 'Huge', H, 27619301),
  makePet('Huge Pajamas Shark', '101224115872445', 'Huge', H, 27607186),
  makePet('Huge Elephant', '14976419563', 'Huge', H, 27583827),
  makePet('Huge Circuit Cat', '107640739737429', 'Huge', H, 27503466),
  makePet('Huge Telescope Owl', '81492004583287', 'Huge', H, 27474424),
  makePet('Huge Scarecrow Dog', '137318518159218', 'Huge', H, 27471285),
  makePet('Huge Coach Hippo', '99854649833028', 'Huge', H, 27372431),
  makePet('Huge Bison', '14976363344', 'Huge', H, 27360588),
  makePet('Huge Egg Piggy', '124169087472138', 'Huge', H, 27354684),
  makePet('Huge Cupcake Pegasus', '136860707312051', 'Huge', H, 27338245),
  makePet('Huge Torpedo Shepherd', '82812436217592', 'Huge', H, 27291271),
  makePet('Huge Frostbyte Snowman', '97928657452308', 'Huge', H, 27286061),
  makePet('Huge Reindeer Cat', '130929080368183', 'Huge', H, 27267257),
  makePet('Huge Totem Cub', '92882162036014', 'Huge', H, 27247020),
  makePet('Huge Spring Griffin', '138950017862417', 'Huge', H, 27207113),
  makePet('Huge Scribe Squirrel', '98604773500066', 'Huge', H, 27158264),
  makePet('Huge Holly Corgi', '70527773100023', 'Huge', H, 27141637),
  makePet('Huge Tree Frog', '109144627334415', 'Huge', H, 27105188),
  makePet('Huge Punksky', '14976529792', 'Huge', H, 27092529),
  makePet('Huge Snow Elf', '104334449359401', 'Huge', H, 27046140),
  makePet('Huge Clover Penguin', '70700548399137', 'Huge', H, 26988004),
  makePet('Huge Lucki Cat', '90438658462311', 'Huge', H, 26972350),
  makePet('Huge Pixel Bee', '123894797425389', 'Huge', H, 26949354),
  makePet('Huge Flamingo Hippo', '70985697718907', 'Huge', H, 26929526),
  makePet('Huge Ooze Axolotl', '131381022373439', 'Huge', H, 26905103),
  makePet('Huge Anubis', '132510616304685', 'Huge', H, 26896285),
  makePet('Huge Exquisite Elephant', '72880983476482', 'Huge', H, 26886146),
  makePet('Huge Pixel Otter', '98175499956412', 'Huge', H, 26803709),
  makePet('Huge Sacred Deer', '100676817290108', 'Huge', H, 26777692),
  makePet('Huge Rhino', '70742339660994', 'Huge', H, 26729766),
  makePet('Huge Chesnut Chipmunk', '134539491208069', 'Huge', H, 26717243),
  makePet('Huge Chill Ducky', '91155059443761', 'Huge', H, 26683673),
  makePet('Huge Empyrean Owl', '93292794652878', 'Huge', H, 26597639),
  makePet('Huge Player Fox', '101605254258375', 'Huge', H, 26596367),
  makePet('Huge Lunar Deer', '93191567038818', 'Huge', H, 26589426),
  makePet('Huge Jolly Dino', '88604762906611', 'Huge', H, 26567615),
  makePet('Huge Blurred Owl', '108865799258120', 'Huge', H, 26553982),
  makePet('Huge Holiday Owl', '84549305486932', 'Huge', H, 26519432),
  makePet('Huge Irish Badger', '132795639308777', 'Huge', H, 26515098),
  makePet('Huge Crocodile', '14976387300', 'Huge', H, 26504987),
  makePet('Huge Spring Onion', '75532551020815', 'Huge', H, 26503559),
  makePet('Huge Prism Pegasus', '80538613184733', 'Huge', H, 26497437),
  makePet('Huge Zombie Pig', '112915612904336', 'Huge', H, 26487557),
  makePet('Huge Lucki Hydra', '107790361850744', 'Huge', H, 26483565),
  makePet('Huge Strawhat Tanuki', '71139826265802', 'Huge', H, 26456644),
  makePet('Huge Old Wizard Cat', '80977445482365', 'Huge', H, 26435991),
  makePet('Huge Angry Yeti', '110929464319537', 'Huge', H, 26421535),
  makePet('Huge Moray Eel', '103239594752603', 'Huge', H, 26385409),
  makePet('Huge Bandana Shiba', '122819794900124', 'Huge', H, 26383761),
  makePet('Huge Kangaroo', '17208307820', 'Huge', H, 26342542),
  makePet('Huge Doll Cat', '104297588937430', 'Huge', H, 26340832),
  makePet('Huge Tropical Flamingo', '18644413250', 'Huge', H, 26311100),
  makePet('Huge Koi Fish', '16179890678', 'Huge', H, 26304231),
  makePet('Huge Lucki Elephant', '101748445167482', 'Huge', H, 26272186),
  makePet('Huge Vibrant Toucan', '17835926180', 'Huge', H, 26239804),
  makePet('Huge Lemur', '106102265443812', 'Huge', H, 26184121),
  makePet('Huge Ninja Dalmatian', '108653580991375', 'Huge', H, 26146143),
  makePet('Huge Rogue Squid', '82176106497018', 'Huge', H, 26141158),
  makePet('Huge Lucki Horse', '116756676652534', 'Huge', H, 26083903),
  makePet('Huge Mining Raccoon', '81824551142457', 'Huge', H, 26011176),
  makePet('Huge Skeleton Snake', '101412265452600', 'Huge', H, 26011084),
  makePet('Huge Clover Bee', '92697373462590', 'Huge', H, 25983291),
  makePet('Huge Candycane Shake Shark', '131205167107422', 'Huge', H, 25978882),
  makePet('Huge Mining Penguin', '107393069000800', 'Huge', H, 25955856),
  makePet('Huge Gingerbread Lion', '113905049892073', 'Huge', H, 25927918),
  makePet('Huge Ooze Cat', '94416745584783', 'Huge', H, 25898403),
  makePet('Huge Sticky Lamb', '135749996470461', 'Huge', H, 25859304),
  makePet('Huge Frostbyte Griffin', '133555995966095', 'Huge', H, 25853570),
  makePet('Huge Glade Griffin', '89142183208055', 'Huge', H, 25849207),
  makePet('Huge Tropical Parrot', '18644413700', 'Huge', H, 25800007),
  makePet('Huge Parachute Monkey', '137651133282362', 'Huge', H, 25758686),
  makePet('Huge Easter Axolotl', '140227031996665', 'Huge', H, 25757569),
  makePet('Huge Maple Owl', '79022104643180', 'Huge', H, 25726041),
  makePet('Huge Skateboard Bulldog', '14976548072', 'Huge', H, 25718071),
  makePet('Huge Robot Ball', '114904071316728', 'Huge', H, 25711070),
  makePet('Huge Starry Eye Bunny', '85579743157375', 'Huge', H, 25678889),
  makePet('Huge Red Wolf', '138120594404992', 'Huge', H, 25673867),
  makePet('Huge Spring Elephant', '137542174121503', 'Huge', H, 25658897),
  makePet('Huge Zebra', '15803989668', 'Huge', H, 25647887),
  makePet('Huge Party Panda', '102306587085097', 'Huge', H, 25646996),
  makePet('Huge Honey Badger', '14976457989', 'Huge', H, 25646395),
  makePet('Huge Hot Cocoa Bear', '103081269967606', 'Huge', H, 25588043),
  makePet('Huge Chill Turtle', '131025895273996', 'Huge', H, 25585661),
  makePet('Huge Festive Walrus', '130656165679355', 'Huge', H, 25557291),
  makePet('Huge Void Alien', '95087944303198', 'Huge', H, 25546501),
  makePet('Huge Flamingo Cat', '110362471835771', 'Huge', H, 25536096),
  makePet('Huge Lucki Tiger', '79319215201881', 'Huge', H, 25484982),
  makePet('Huge Nutcracker Squirrel', '125206420660994', 'Huge', H, 25460346),
  makePet('Huge Spotted Elephant', '109762155802208', 'Huge', H, 25458474),
  makePet('Huge Holiday Bearserker', '79863147405643', 'Huge', H, 25436416),
  makePet('Huge Festive Elf', '72695234324968', 'Huge', H, 25423068),
  makePet('Huge Gazelle', '137006734767024', 'Huge', H, 25358152),
  makePet('Huge Tennis Squirrel', '86863060232027', 'Huge', H, 25341400),
  makePet('Huge Deerserker', '74968067485946', 'Huge', H, 25318144),
  makePet('Huge Mushroom Raccoon', '14976495649', 'Huge', H, 25315857),
  makePet('Huge Bluebird', '14976368196', 'Huge', H, 25298739),
  makePet('Huge Easter Fox', '127847534239530', 'Huge', H, 25297882),
  makePet('Huge Player Corgi', '120748568564871', 'Huge', H, 25297544),
  makePet('Huge Lucki Lamb', '95284321977172', 'Huge', H, 25260376),
  makePet('Huge Leprechaun Fox', '126832578733355', 'Huge', H, 25259642),
  makePet('Huge Clover Phoenix', '121888921741628', 'Huge', H, 25215618),
  makePet('Huge North Pole Unicorn', '118783316706055', 'Huge', H, 25204639),
  makePet('Huge Stunt Corgi', '132747851336356', 'Huge', H, 25181496),
  makePet('Huge Evergreen Unicorn', '102257239631594', 'Huge', H, 25147248),
  makePet('Huge Clover Griffin', '129397965885657', 'Huge', H, 25130049),
  makePet('Huge Rudolf', '90192944578505', 'Huge', H, 24996295),
  makePet('Huge Hot Cocoa Cow', '94419678057049', 'Huge', H, 24992914),
  makePet('Huge Nebula Lion', '93555710520870', 'Huge', H, 24980676),
  makePet('Huge Clover Deer', '79851172093222', 'Huge', H, 24945481),
  makePet('Huge Chill Cat', '79287315277949', 'Huge', H, 24933249),
  makePet('Huge Cinnamon Bunny', '84468265134743', 'Huge', H, 24910633),
  makePet('Huge Clover Peacock', '109285154435259', 'Huge', H, 24846815),
  makePet('Huge Detective Terrier', '79798078989101', 'Huge', H, 24717656),
  makePet('Huge Evil Raven', '125919373287917', 'Huge', H, 24680989),
  makePet('Huge Green Cobra', '136758354491136', 'Huge', H, 24658662),
  makePet('Huge Mining Robot', '96864197207210', 'Huge', H, 24630661),
  makePet('Huge Basket Bunny', '75145545226238', 'Huge', H, 24629981),
  makePet('Huge Nutcracker Bunny', '134436276835311', 'Huge', H, 24552672),
  makePet('Huge Floatie Cat', '122328085750214', 'Huge', H, 24518771),
  makePet('Huge Beaver', '137999717729131', 'Huge', H, 24488652),
  makePet('Huge Royal Peacock', '87911299372812', 'Huge', H, 24429099),
  makePet('Huge Pixel Griffin', '95210896396972', 'Huge', H, 24420268),
  makePet('Huge Frankenpup Dog', '89649094845422', 'Huge', H, 24419997),
  makePet('Huge Ladybug', '99601574590476', 'Huge', H, 24417512),
  makePet('Huge Stingray', '74045348274896', 'Huge', H, 24411451),
  makePet('Huge Mining Monkey', '103555083432476', 'Huge', H, 24376765),
  makePet('Huge Sand Turtle', '135909325660471', 'Huge', H, 24308728),
  makePet('Huge Candycane Unicorn', '96812489225423', 'Huge', H, 24255240),
  makePet('Huge Wisp Griffin', '107709649476563', 'Huge', H, 24247370),
  makePet('Huge Safari Monkey', '131070721986590', 'Huge', H, 24200827),
  makePet('Huge Easter Lamb', '122710351430317', 'Huge', H, 24187611),
  makePet('Huge Elegant Eagle', '18556265741', 'Huge', H, 24106136),
  makePet('Huge Llama', '14976476776', 'Huge', H, 24081352),
  makePet('Huge Pastel Deer', '117144432225186', 'Huge', H, 24048245),
  makePet('Huge Pastel Sock Bunny', '85028487593165', 'Huge', H, 23872672),
  makePet('Huge Oracle Tiger', '86086397242289', 'Huge', H, 23829901),
  makePet('Huge Walrus', '102190929472921', 'Huge', H, 23794457),
  makePet('Huge Pixel Goblin', '122435473843216', 'Huge', H, 23548334),
  makePet('Huge Mushroom Pixie', '104120102100620', 'Huge', H, 23333792),
  makePet('Huge Festive Bear', '71088229378334', 'Huge', H, 21954969),
  makePet('Huge Merry Mule', '123118912547385', 'Huge', H, 21645059),
  makePet('Huge Balloon Monkey', '14976359711', 'Huge', H, 50000000),
  makePet('Huge Crowned Dragon', '126611400704407', 'Huge', H, 50000000),
  makePet('Huge Angel Dog', '15281990069', 'Huge', H, 50000000),
  makePet('Huge Crystal Axolotl', '78600472336744', 'Huge', H, 50000000),
  makePet('Huge Chroma Phoenix', '14976351312', 'Huge', H, 50000000),
  makePet('Huge Chroma Tiger', '14976351312', 'Huge', H, 50000000),
  makePet('Huge Crowned Pegasus', '15281989490', 'Huge', H, 50000000),
  makePet('Huge Chroma Lucky Block Mimic', '14976351312', 'Huge', H, 50000000),
  makePet('Huge Chroma Snail', '14976351312', 'Huge', H, 50000000),
  makePet('Huge Pink Balloon Cat', '14976517430', 'Huge', H, 50000000),
  makePet('Huge Glass Crocodile', '85063221597865', 'Huge', H, 50000000),
  makePet('Huge Chroma Butterfly', '14976351312', 'Huge', H, 50000000),
  makePet('Huge Empyrean Axolotl', '14976421410', 'Huge', H, 50000000),
  makePet('Huge Festive Bunny', '123556636544814', 'Huge', H, 50000000),
  makePet('Huge Jelly Monkey', '16495814071', 'Huge', H, 50000000),
  makePet('Huge Cosmic Axolotl', '15201636161', 'Huge', H, 50000000),
  makePet('Huge Chroma Unicorn', '14976351312', 'Huge', H, 50000000),
  makePet('Huge Jelly Axolotl', '16483328135', 'Huge', H, 50000000),
  makePet('Huge Jelly Corgi', '14976465933', 'Huge', H, 50000000),
  makePet('Huge Glass Dominus', '72368340879061', 'Huge', H, 50000000),
  makePet('Huge Owl', '15809137117', 'Huge', H, 50000000),
  makePet('Huge Chroma Doodle Axolotl', '104790531635237', 'Huge', H, 50000000),
  makePet('Huge Sandcastle Kraken', '123729066611034', 'Huge', H, 50000000),
  makePet('Huge Cosmic Agony', '15201636010', 'Huge', H, 50000000),
  makePet('Huge UV Cat', '18356987128', 'Huge', H, 50000000),
  makePet('Huge Ruinous Angelus', '101706886467940', 'Huge', H, 50000000),
  makePet('Huge Emoji Cat', '16047450864', 'Huge', H, 50000000),
  makePet('Huge Chroma Ink Blob', '14976351312', 'Huge', H, 50000000),
  makePet('Huge Chroma Lucki', '14976351312', 'Huge', H, 50000000),
  makePet('Huge Pegasus', '14976514552', 'Huge', H, 50000000),
  makePet('Huge Chroma Swan', '14976351312', 'Huge', H, 50000000),
  makePet('Huge Jelly Piggy', '14976467450', 'Huge', H, 50000000),
];

function getCVByName(name) { return CV.find(p => p.name === name); }

/* -- LIVE CHAT -- */
let onlineCount = 0;

function formatTime() {
  const d = new Date();
  let h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

function _updateOnlineCount(n) {
  onlineCount = n;
  const base = Math.max(n, _isVerified() ? 1 : 0);
  document.querySelectorAll('#online-count').forEach(el => el.textContent = base);
  document.querySelectorAll('#chat-count').forEach(el => el.textContent = base + ' online');
  // Keep home page hero/stat and game card counters consistent with nav
  const heroOnline = document.getElementById('hero-online');
  if (heroOnline) heroOnline.textContent = base + ' Online';
  const statOnline = document.getElementById('stat-online');
  if (statOnline) statOnline.textContent = base.toLocaleString();
  // Game card counters  -  each game gets a fair share of active users
  const cfOnline = document.getElementById('cf-online');
  const jpOnline = document.getElementById('jp-online');
  const dcOnline = document.getElementById('dc-online');
  if (cfOnline) cfOnline.textContent = Math.max(1, Math.floor(base * 0.4));
  if (jpOnline) jpOnline.textContent = Math.max(1, Math.floor(base * 0.3));
  if (dcOnline) dcOnline.textContent = Math.max(1, Math.floor(base * 0.3));
}

// Init online count to 1 if logged in
document.addEventListener('DOMContentLoaded', () => {
  if (_isVerified()) _updateOnlineCount(1);
});

/* -- COIN CANVAS (shared) -- */
function drawCVGem(ctx, cx, cy, size) {
  ctx.save(); ctx.translate(cx, cy);
  const s = size;
  ctx.beginPath();
  ctx.moveTo(0, -s); ctx.lineTo(s * .8, -s * .2); ctx.lineTo(s * .6, s);
  ctx.lineTo(-s * .6, s); ctx.lineTo(-s * .8, -s * .2);
  ctx.closePath();
  const g = ctx.createLinearGradient(-s, -s, s, s);
  g.addColorStop(0, '#bae6fd'); g.addColorStop(.4, '#7dd3fc'); g.addColorStop(1, '#0284c7');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-s * .3, -s * .8); ctx.lineTo(s * .4, -s * .2); ctx.lineTo(-s * .2, -s * .15);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();
  ctx.restore();
}

function drawCVPaw(ctx, cx, cy, size) {
  ctx.save(); ctx.translate(cx, cy);
  const s = size;
  [[-s * .55, -s * .55], [0, -s * .75], [s * .55, -s * .55], [s * .8, 0]].forEach(([px, py]) => {
    ctx.beginPath(); ctx.ellipse(px, py, s * .22, s * .18, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(51,65,85,0.7)'; ctx.fill();
  });
  ctx.beginPath(); ctx.ellipse(0, s * .1, s * .42, s * .36, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(51,65,85,0.7)'; ctx.fill();
  ctx.restore();
}

function renderCoinFace(canvas, angleDeg) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 2;
  ctx.clearRect(0, 0, W, H);
  const norm = ((angleDeg % 360) + 360) % 360;
  const cosA = Math.cos(norm * Math.PI / 180);
  const isHeads = cosA >= 0;
  const scaleX = Math.max(Math.abs(cosA), 0.006);

  ctx.save();
  ctx.translate(cx, cy); ctx.scale(scaleX, 1); ctx.translate(-cx, -cy);

  if (isHeads) {
    /* -- HEADS: PS99 gold coin -- */
    // Outer glow aura
    const aura = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r * 1.15);
    aura.addColorStop(0, 'rgba(251,191,36,0.35)');
    aura.addColorStop(1, 'rgba(251,191,36,0)');
    ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2); ctx.fill();

    // Outer rim
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    const rim = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    rim.addColorStop(0, '#7c2d12'); rim.addColorStop(0.3, '#b45309');
    rim.addColorStop(0.6, '#d97706'); rim.addColorStop(1, '#7c2d12');
    ctx.fillStyle = rim; ctx.fill();

    // Inner face
    ctx.beginPath(); ctx.arc(cx, cy, r - 5, 0, Math.PI * 2);
    const face = ctx.createRadialGradient(cx - r * .28, cy - r * .28, 2, cx, cy, r);
    face.addColorStop(0, '#fffbeb'); face.addColorStop(0.18, '#fef3c7');
    face.addColorStop(0.45, '#fcd34d'); face.addColorStop(0.72, '#f59e0b');
    face.addColorStop(0.9, '#b45309'); face.addColorStop(1, '#7c2d12');
    ctx.fillStyle = face; ctx.fill();

    // Subtle gold rim ring (no rainbow)
    ctx.beginPath(); ctx.arc(cx, cy, r - 7, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,215,80,0.25)';
    ctx.lineWidth = 3; ctx.stroke();

    // Rim tick marks
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2, long = i % 5 === 0;
      ctx.beginPath();
      ctx.moveTo(cx + (r - 1) * Math.cos(a), cy + (r - 1) * Math.sin(a));
      ctx.lineTo(cx + (r - (long ? 6.5 : 4)) * Math.cos(a), cy + (r - (long ? 6.5 : 4)) * Math.sin(a));
      ctx.strokeStyle = long ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.28)';
      ctx.lineWidth = long ? 1.6 : 0.9; ctx.stroke();
    }

    // Inner engraving circle
    ctx.beginPath(); ctx.arc(cx, cy, r - 15, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(120,53,15,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();

    // Cat silhouette
    const cs = r * 0.34;
    ctx.fillStyle = 'rgba(100,43,5,0.75)';
    ctx.beginPath(); ctx.ellipse(cx, cy - cs * .12, cs * .72, cs * .62, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - cs*.44, cy - cs*.52); ctx.lineTo(cx - cs*.66, cy - cs*.97); ctx.lineTo(cx - cs*.18, cy - cs*.66); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + cs*.44, cy - cs*.52); ctx.lineTo(cx + cs*.66, cy - cs*.97); ctx.lineTo(cx + cs*.18, cy - cs*.66); ctx.closePath(); ctx.fill();
    // glowing eyes
    ctx.fillStyle = 'rgba(255,215,0,0.9)';
    ctx.beginPath(); ctx.ellipse(cx - cs*.24, cy - cs*.18, cs*.11, cs*.082, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + cs*.24, cy - cs*.18, cs*.11, cs*.082, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath(); ctx.ellipse(cx - cs*.24, cy - cs*.18, cs*.05, cs*.065, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + cs*.24, cy - cs*.18, cs*.05, cs*.065, 0, 0, Math.PI * 2); ctx.fill();

    // Stars
    [[-r * .54, r * .2], [r * .51, r * .16], [0, -r * .67]].forEach(([dx, dy]) => {
      ctx.fillStyle = 'rgba(255,236,153,0.75)';
      ctx.font = `${r * .2}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('*', cx + dx, cy + dy);
    });

    // HEADS label
    ctx.fillStyle = 'rgba(92,38,4,0.85)';
    ctx.font = `900 ${r * .145}px "Segoe UI"`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('HEADS', cx, cy + r * .6);

  } else {
    /* -- TAILS: PSG gem coin -- */
    // Outer glow aura
    const aura = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r * 1.18);
    aura.addColorStop(0, 'rgba(124,77,232,0.45)');
    aura.addColorStop(1, 'rgba(6,182,212,0)');
    ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(cx, cy, r * 1.18, 0, Math.PI * 2); ctx.fill();

    // Outer rim
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    const rim = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    rim.addColorStop(0, '#1e0040'); rim.addColorStop(0.35, '#4c1d95');
    rim.addColorStop(0.65, '#7c3aed'); rim.addColorStop(1, '#2e1065');
    ctx.fillStyle = rim; ctx.fill();

    // Inner face
    ctx.beginPath(); ctx.arc(cx, cy, r - 5, 0, Math.PI * 2);
    const face = ctx.createRadialGradient(cx - r * .25, cy - r * .25, 2, cx, cy, r);
    face.addColorStop(0, '#ddd6fe'); face.addColorStop(0.2, '#a78bfa');
    face.addColorStop(0.5, '#7c3aed'); face.addColorStop(0.8, '#4c1d95');
    face.addColorStop(1, '#2e1065');
    ctx.fillStyle = face; ctx.fill();

    // Subtle purple rim ring (no rainbow)
    ctx.beginPath(); ctx.arc(cx, cy, r - 7, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(167,139,250,0.3)';
    ctx.lineWidth = 3; ctx.stroke();

    // Rim tick marks
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2, long = i % 5 === 0;
      ctx.beginPath();
      ctx.moveTo(cx + (r - 1) * Math.cos(a), cy + (r - 1) * Math.sin(a));
      ctx.lineTo(cx + (r - (long ? 6.5 : 4)) * Math.cos(a), cy + (r - (long ? 6.5 : 4)) * Math.sin(a));
      ctx.strokeStyle = long ? 'rgba(167,139,250,0.8)' : 'rgba(167,139,250,0.35)';
      ctx.lineWidth = long ? 1.6 : 0.9; ctx.stroke();
    }

    // Inner engraving circle
    ctx.beginPath(); ctx.arc(cx, cy, r - 15, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(139,92,246,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();

    // Glow pulse under gem
    const gemGlow = ctx.createRadialGradient(cx, cy - r * .08, 0, cx, cy - r * .08, r * .5);
    gemGlow.addColorStop(0, 'rgba(196,181,253,0.6)');
    gemGlow.addColorStop(0.4, 'rgba(124,77,232,0.3)');
    gemGlow.addColorStop(1, 'rgba(6,182,212,0)');
    ctx.fillStyle = gemGlow; ctx.beginPath(); ctx.arc(cx, cy - r * .08, r * .5, 0, Math.PI * 2); ctx.fill();

    // PSG hex gem (large, glowing)
    drawCVGem(ctx, cx, cy - r * .1, r * .34);

    // PSG "coin" label
    ctx.fillStyle = 'rgba(196,181,253,0.9)';
    ctx.font = `900 ${r * .145}px "Segoe UI"`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('TAILS', cx, cy + r * .6);
  }

  // Top shine overlay
  const shine = ctx.createRadialGradient(cx - r * .32, cy - r * .38, 0, cx, cy, r);
  shine.addColorStop(0, 'rgba(255,255,255,0.58)');
  shine.addColorStop(0.22, 'rgba(255,255,255,0.1)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = shine; ctx.fill();

  // Edge darkening when flipping
  if (scaleX < 0.45) {
    const ew = W * 0.18 / scaleX;
    const edgeL = ctx.createLinearGradient(0, 0, ew, 0);
    edgeL.addColorStop(0, 'rgba(0,0,0,0.72)'); edgeL.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = edgeL; ctx.fillRect(0, 0, ew, H);
    const edgeR = ctx.createLinearGradient(W, 0, W - ew, 0);
    edgeR.addColorStop(0, 'rgba(0,0,0,0.72)'); edgeR.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = edgeR; ctx.fillRect(W - ew, 0, ew, H);
  }

  ctx.restore();
}

/* -- PARTICLES -- */
let _particles = [], _partAnim = null;

function burstParticles(x, y, win) {
  const colors = win
    ? ['#22c55e', '#4ade80', '#86efac', '#fbbf24', '#9d71ff']
    : ['#ef4444', '#f87171', '#fca5a5', '#475569'];
  for (let i = 0; i < 70; i++) {
    const a = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 12;
    const rect = Math.random() > .4;
    _particles.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4,
      size: rect ? (3 + Math.random() * 7) : (2 + Math.random() * 5),
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1, decay: .011 + Math.random() * .011,
      rot: Math.random() * Math.PI * 2, rotV: (Math.random() - .5) * .18, rect
    });
  }
  if (!_partAnim) _animPart();
}

function _animPart() {
  const c = document.getElementById('particleCanvas') || document.getElementById('particle-canvas');
  if (!c) { _partAnim = null; return; }
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  _particles = _particles.filter(p => p.life > 0);
  _particles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.vy += .28; p.vx *= .98; p.life -= p.decay; p.rot += p.rotV;
    ctx.save(); ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color;
    ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    if (p.rect) ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  });
  if (_particles.length > 0) _partAnim = requestAnimationFrame(_animPart);
  else { _partAnim = null; ctx.clearRect(0, 0, c.width, c.height); }
}

/* -- PROFILE MODAL -- */
function _ensureProfileModal() {
  if (document.getElementById('prof-overlay')) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
<div id="prof-overlay" class="prof-overlay" onclick="closeProfileModal(event)">
  <div class="prof-card">
    <button class="prof-close" onclick="closeProfileModal(null,true)">X</button>
    <div class="prof-header-bg" id="prof-header-bg"></div>
    <div class="prof-avatar-area">
      <div class="prof-av-ring" id="prof-av-ring">
        <div class="prof-av-circle" id="prof-av-circle">YO</div>
      </div>
      <div class="prof-lv-pill" id="prof-lv-pill">LVL 1</div>
    </div>
    <div class="prof-body">
      <div class="prof-uname" id="prof-uname"> - </div>
      <div class="prof-badges-row">
        <div class="prof-rank-pill" id="prof-rank-pill"> - </div>
        <div class="prof-id-pill" id="prof-id-pill">#000000000</div>
      </div>
      <div style="display:flex;gap:10px;margin-bottom:12px;">
        <div style="flex:1;background:rgba(34,197,94,.07);border:1px solid rgba(34,197,94,.2);border-radius:10px;padding:10px;text-align:center;">
          <div style="font-size:.6rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">Games</div>
          <div style="font-size:.96rem;font-weight:900;color:#fff;" id="pstat-gc"> - </div>
        </div>
        <div style="flex:1;background:rgba(34,197,94,.07);border:1px solid rgba(34,197,94,.2);border-radius:10px;padding:10px;text-align:center;">
          <div style="font-size:.6rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">Win Rate</div>
          <div style="font-size:.96rem;font-weight:900;color:#22c55e;" id="pstat-wr"> - </div>
        </div>
      </div>
      <div class="prof-stats-grid">
        <div class="prof-stat-box">
          <div class="prof-stat-ico"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg></div>
          <div class="prof-stat-lbl">15 Games</div>
          <div class="prof-stat-val" id="pstat-w"> - </div>
          <div class="prof-stat-sub">Total Wagered</div>
        </div>
        <div class="prof-stat-box">
          <div class="prof-stat-ico" style="color:var(--green)"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><polyline points="2,10 6,6 9,9 14,3"/></svg></div>
          <div class="prof-stat-lbl">Profit</div>
          <div class="prof-stat-val" id="pstat-p"> - </div>
          <div class="prof-stat-sub">Net profit/loss</div>
        </div>
        <div class="prof-stat-box">
          <div class="prof-stat-ico" style="color:#fbbf24"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><polygon points="8,2 10.5,6 15,6.5 11.5,10 12.5,14.5 8,12 3.5,14.5 4.5,10 1,6.5 5.5,6"/></svg></div>
          <div class="prof-stat-lbl">Best Win</div>
          <div class="prof-stat-val" id="pstat-bw" style="color:#fbbf24;"> - </div>
          <div class="prof-stat-sub">Single win</div>
        </div>
        <div class="prof-stat-box">
          <div class="prof-stat-ico" style="color:#f97316"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M8 2C8 2 5 5 5 9a3 3 0 0 0 6 0c0-4-3-7-3-7z"/></svg></div>
          <div class="prof-stat-lbl">Win Streak</div>
          <div class="prof-stat-val" id="pstat-ws" style="color:#f97316;"> - </div>
          <div class="prof-stat-sub">Best streak</div>
        </div>
      </div>
      <button class="prof-tip-btn" id="prof-tip-btn" onclick="_handleTipBtn()">Tip Player</button>
    </div>
  </div>
</div>`;
  document.body.appendChild(wrap.firstElementChild);
}

function openProfileModal(type, idx, isOwner) {
  _ensureProfileModal();
  if (type === 'you') { _tipTargetUsername = ''; _tipTargetDisplayName = ''; }
  let data;
  if (type === 'you') {
    const p = myProfile();
    const isOwnAdmin = localStorage.getItem('ps99g_isAdmin') === '1';
    data = { name:p.name, level:p.level, wagered:p.wagered, won:p.won, lost:p.lost, id:p.id, color:'#7c3aed',
             winRate:p.winRate, bestWin:p.bestWin, maxStreak:p.maxStreak, winCount:p.winCount, lossCount:p.lossCount,
             isOwner: isOwner || isOwnAdmin };
  } else {
    const p = CHAT_PLAYERS[idx] || {};
    data = { name:p.name||'Player', level:p.level||1, wagered:p.wagered||0, won:p.won||0, lost:p.lost||0, id:p.id||'#0000000000', color:p.color||'#7c3aed',
             winRate: Math.floor(Math.random()*30+45), bestWin: Math.floor((p.wagered||1e8)*0.2*Math.random()+1e6),
             maxStreak: Math.floor(Math.random()*8+1), winCount: Math.floor(Math.random()*50+10), lossCount: Math.floor(Math.random()*40+8),
             isOwner: false };
  }

  const rank   = getRank(data.wagered);
  const profit = data.won - data.lost;
  const initials = data.name.slice(0,2).toUpperCase();

  const avEl  = document.getElementById('prof-av-circle');
  const ringEl = document.getElementById('prof-av-ring');
  const hdrEl  = document.getElementById('prof-header-bg');
  const rankPill = document.getElementById('prof-rank-pill');

  if (data.isOwner) {
    // -- OWNER: gold crown profile --
    avEl.style.cssText = 'background:linear-gradient(135deg,#92400e,#f59e0b,#78350f);box-shadow:0 0 24px rgba(245,158,11,.7);color:#fff;font-size:1.5rem;';
    avEl.textContent = '[crown]';
    if (ringEl) ringEl.style.background = 'linear-gradient(135deg,#f59e0b,#fbbf24,#f59e0b)';
    if (hdrEl)  hdrEl.style.background  = 'linear-gradient(135deg,rgba(245,158,11,.45) 0%,rgba(180,83,9,.2) 50%,transparent 100%),linear-gradient(135deg,#451a03,#78350f,#92400e)';
    document.getElementById('prof-lv-pill').textContent = '[crown] OWNER';
    document.getElementById('prof-lv-pill').style.cssText = 'background:linear-gradient(135deg,#f59e0b,#b45309);color:#fff;border:none;font-size:.65rem;box-shadow:0 0 12px rgba(245,158,11,.4);';
    rankPill.innerHTML = '[crown]&nbsp;SITE OWNER';
    rankPill.style.cssText = 'color:#fbbf24;border-color:#f59e0b;background:rgba(245,158,11,.12);font-size:.6rem;letter-spacing:.06em;';
  } else {
    const selfAvatar = (type === 'you') ? localStorage.getItem('ps99g_rblx_avatar') : (data.avatar || '');
    if (selfAvatar) {
      avEl.style.cssText = 'background:rgba(0,0,0,.4);overflow:hidden;';
      avEl.innerHTML = `<img src="${selfAvatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentElement.innerHTML='${initials}';this.parentElement.style.cssText='background:linear-gradient(135deg,#1e1645,#120e2a);'">`;
    } else {
      avEl.style.cssText = 'background:linear-gradient(135deg,#1e1645,#120e2a);';
      avEl.textContent = initials;
    }
    if (ringEl) ringEl.style.background = `linear-gradient(135deg,${data.color},${data.color}88)`;
    if (hdrEl)  hdrEl.style.background  = `linear-gradient(135deg,${data.color}55 0%,${data.color}22 50%,transparent 100%),linear-gradient(135deg,#3b0764,#6d28d9)`;
    document.getElementById('prof-lv-pill').textContent = `LVL ${data.level}`;
    document.getElementById('prof-lv-pill').style.cssText = '';
    rankPill.innerHTML = `${rank.icon}&nbsp;${rank.name.toUpperCase()}`;
    rankPill.style.cssText = `color:${rank.color};border-color:${rank.color};background:${rank.bg}`;
  }

  document.getElementById('prof-uname').textContent = data.name;
  document.getElementById('prof-id-pill').textContent = data.id || '#0000000000';
  document.getElementById('pstat-w').textContent  = fmtB(data.wagered);
  const pEl = document.getElementById('pstat-p');
  pEl.textContent = (profit>=0?'+':'-') + fmtB(Math.abs(profit));
  pEl.style.color = profit >= 0 ? 'var(--green)' : 'var(--red)';
  document.getElementById('pstat-wr').textContent = (data.winRate||0) + '%';
  document.getElementById('pstat-bw').textContent = fmtB(data.bestWin||0);
  document.getElementById('pstat-ws').textContent = (data.maxStreak||0) + ' games';
  const gc = (data.winCount||0) + (data.lossCount||0);
  document.getElementById('pstat-gc').textContent = gc + ' played';
  const tipBtn = document.getElementById('prof-tip-btn');
  if (tipBtn) tipBtn.style.display = (type === 'you' || !_tipTargetUsername) ? 'none' : '';
  const ov = document.getElementById('prof-overlay');
  ov.style.display = 'flex';
  requestAnimationFrame(() => ov.classList.add('active'));
}

function _openOwnerProfile() {
  _ensureProfileModal();
  const adminName = _chatAdminName || localStorage.getItem('ps99g_admin_name') || 'Owner';
  openProfileModal('you', 0, true);
  // Override name with admin's display name
  document.getElementById('prof-uname').textContent = adminName;
}

let _tipTargetUsername = '';
let _tipTargetDisplayName = '';
function _openChatProfile(key) {
  const d = (window._chatProfiles || {})[key];
  if (!d) return;
  _tipTargetUsername    = d.username || '';
  _tipTargetDisplayName = d.displayName || d.username || 'Player';
  _ensureProfileModal();
  const avEl    = document.getElementById('prof-av-circle');
  const ringEl  = document.getElementById('prof-av-ring');
  const hdrEl   = document.getElementById('prof-header-bg');
  const rankPill = document.getElementById('prof-rank-pill');
  const initials = (d.displayName || '?').slice(0,2).toUpperCase();
  if (d.avatarUrl) {
    avEl.style.cssText = 'background:rgba(0,0,0,.4);overflow:hidden;';
    avEl.innerHTML = `<img src="${d.avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentElement.textContent='${initials}';this.parentElement.style.cssText='background:linear-gradient(135deg,#1e1645,#120e2a);'">`;
  } else {
    avEl.style.cssText = 'background:linear-gradient(135deg,#1e1645,#120e2a);';
    avEl.textContent = initials;
  }
  const color = '#4338ca';
  if (ringEl) ringEl.style.background = `linear-gradient(135deg,${color},${color}88)`;
  if (hdrEl)  hdrEl.style.background  = `linear-gradient(135deg,${color}55 0%,${color}22 50%,transparent 100%),linear-gradient(135deg,#3b0764,#6d28d9)`;
  const rank = getRank(0);
  rankPill.innerHTML = `${rank.icon}&nbsp;${rank.name.toUpperCase()}`;
  rankPill.style.cssText = `color:${rank.color};border-color:${rank.color};background:${rank.bg}`;
  document.getElementById('prof-lv-pill').textContent = 'LVL 1';
  document.getElementById('prof-lv-pill').style.cssText = '';
  document.getElementById('prof-uname').textContent = d.displayName || d.username || '?';
  document.getElementById('prof-id-pill').textContent = d.username ? '@' + d.username : '';
  document.getElementById('pstat-w').textContent  = '—';
  const pEl = document.getElementById('pstat-p'); pEl.textContent = '—'; pEl.style.color = '';
  document.getElementById('pstat-wr').textContent = '—';
  document.getElementById('pstat-bw').textContent = '—';
  document.getElementById('pstat-ws').textContent = '—';
  document.getElementById('pstat-gc').textContent = '—';
  const tipBtn2 = document.getElementById('prof-tip-btn');
  if (tipBtn2) tipBtn2.style.display = _tipTargetUsername ? '' : 'none';
  const ov = document.getElementById('prof-overlay');
  ov.style.display = 'flex';
  requestAnimationFrame(() => ov.classList.add('active'));
}

function closeProfileModal(e, force) {
  if (e && e.target !== document.getElementById('prof-overlay') && !force) return;
  const ov = document.getElementById('prof-overlay');
  if (!ov) return;
  ov.classList.remove('active');
  setTimeout(() => { ov.style.display = 'none'; }, 220);
}

function _handleTipBtn() {
  if (!_tipTargetUsername) return;
  closeProfileModal(null, true);
  _openTipModal(_tipTargetUsername, _tipTargetDisplayName);
}

function _openTipModal(toUsername, toDisplayName) {
  if (document.getElementById('tip-overlay')) return;
  const inv = getInventory().filter(i => !i.gem);
  window._tipSelected = new Set();

  const overlay = document.createElement('div');
  overlay.id = 'tip-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;';

  const renderGrid = () => {
    const grid = overlay.querySelector('#tip-grid');
    if (!grid) return;
    grid.innerHTML = inv.length ? inv.map(item => {
      const sel = window._tipSelected.has(item.id);
      const thumb = item.img ? `https://assetdelivery.roblox.com/v1/asset/?id=${item.img}` : '';
      return `<div onclick="_tipToggleItem('${item.id}')" id="tic-${item.id}" style="
        display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 4px;border-radius:10px;
        cursor:pointer;border:2px solid ${sel ? '#22c55e' : 'rgba(255,255,255,.08)'};
        background:${sel ? 'rgba(34,197,94,.12)' : 'rgba(0,0,0,.3)'};transition:all .12s;">
        ${thumb ? `<img src="${thumb}" style="width:48px;height:48px;object-fit:contain;" onerror="this.style.opacity='.15'">` : `<div style="width:48px;height:48px;background:${item.color||'#7c4de8'}33;border-radius:8px;"></div>`}
        <div style="font-size:.5rem;font-weight:800;color:#fff;text-align:center;max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${item.name||'Item'}</div>
        <div style="font-size:.55rem;color:#a78bfa;font-weight:800;">${fmtPSG(item.value||0)}</div>
      </div>`;
    }).join('') : `<div style="grid-column:1/-1;text-align:center;padding:24px;color:rgba(255,255,255,.3);font-size:.8rem;">No items to tip</div>`;
    const total = inv.filter(i => window._tipSelected.has(i.id)).reduce((s,i)=>s+(i.value||0),0);
    const sendBtn = overlay.querySelector('#tip-send-btn');
    if (sendBtn) {
      sendBtn.disabled = selected.size === 0;
      sendBtn.textContent = selected.size ? `Send Tip (${fmtPSG(total)})` : 'Select Items';
    }
  };

  window._tipToggleItem = (id) => {
    if (window._tipSelected.has(id)) window._tipSelected.delete(id); else window._tipSelected.add(id);
    renderGrid();
  };

  overlay.innerHTML = `
    <div style="background:linear-gradient(160deg,#130f2e,#09071a);border:1.5px solid rgba(124,77,232,.4);border-radius:20px;padding:28px;width:min(420px,96vw);max-height:88vh;overflow-y:auto;font-family:inherit;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
        <div style="font-size:1rem;font-weight:900;color:#fff;">Tip <span style="color:#a78bfa;">${toDisplayName}</span></div>
        <button onclick="document.getElementById('tip-overlay').remove()" style="background:rgba(255,255,255,.06);border:none;color:rgba(255,255,255,.5);font-size:1.1rem;cursor:pointer;border-radius:6px;width:28px;height:28px;">&times;</button>
      </div>
      <div style="font-size:.68rem;color:rgba(148,163,184,.6);margin-bottom:14px;">Select items from your inventory to send</div>
      <div id="tip-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:18px;"></div>
      <button id="tip-send-btn" disabled onclick="_sendTip('${toUsername}')"
        style="width:100%;padding:12px;background:linear-gradient(135deg,#22c55e,#16a34a);border:none;border-radius:12px;color:#fff;font-size:.88rem;font-weight:900;cursor:pointer;font-family:inherit;box-shadow:0 0 20px rgba(34,197,94,.3);transition:opacity .15s;"
        onmouseover="if(!this.disabled)this.style.filter='brightness(1.1)'" onmouseout="this.style.filter=''">
        Select Items
      </button>
    </div>`;

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  renderGrid();
}

function _sendTip(toUsername) {
  const overlay = document.getElementById('tip-overlay');
  if (!overlay) return;
  const itemIds = [...(window._tipSelected || [])];
  if (!itemIds.length) return;
  if (!_wsConn || _wsConn.readyState !== WebSocket.OPEN) { showToast('Not connected to server', 'info'); return; }
  _wsConn.send(JSON.stringify({ type: 'tip_player', to: toUsername, itemIds }));
  overlay.remove();
  window._tipSelected = new Set();
}

/* -- INVENTORY SYSTEM -- */
const _INV_KEY = 'ps99g_inv';
function getInventory() { try { return JSON.parse(localStorage.getItem(_INV_KEY)) || []; } catch { return []; } }
function _saveInv(inv) { try { localStorage.setItem(_INV_KEY, JSON.stringify(inv)); } catch {} }
function _addToInv(pet, variant, value) {
  const inv = getInventory();
  inv.unshift({ id: Date.now()+''+Math.floor(Math.random()*9999), name:pet.name, img:pet.img, tier:pet.tier, color:pet.color, variant, value });
  _saveInv(inv);
  _updateNavInvBadge();
}
function _removeFromInv(id) { _saveInv(getInventory().filter(i => i.id !== id)); _updateNavInvBadge(); refreshBal(); }

// ── GEM DENOMINATION ITEMS ───────────────────────────────────────────
// Stackable currency items deposited by the trade bot.
const GEM_DENOMS = [
  { name: '1M Gems',   value: 1_000_000,      color: '#22d3ee', gem: true },
  { name: '10M Gems',  value: 10_000_000,     color: '#f59e0b', gem: true },
  { name: '100M Gems', value: 100_000_000,    color: '#7c4de8', gem: true },
  { name: '1B Gems',   value: 1_000_000_000,  color: '#4ade80', gem: true },
];
GEM_DENOMS.sort((a, b) => a.value - b.value); // ascending — small first

function _gemSVG(colorOrName) {
  const isBag = colorOrName === '100M Gems' || colorOrName === '1B Gems';
  const isGreen = colorOrName === '1B Gems';
  if (isBag) {
    const body = isGreen ? '#5ee85e' : '#50d4f8';
    const neck = isGreen ? '#30c030' : '#28b0dc';
    const gem1 = isGreen ? '#0a6020' : '#0060a8';
    const gem2 = isGreen ? '#085018' : '#0050a0';
    return `<svg viewBox="0 0 28 28" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="14" cy="19.5" rx="9.5" ry="7.5" fill="${body}"/>
      <rect x="11" y="10" width="6" height="6" rx="2.5" fill="${neck}"/>
      <ellipse cx="14" cy="9.5" rx="5" ry="2.8" fill="#ff45a8"/>
      <polygon points="9.5,18.5 11.5,15.5 13.5,18.5" fill="${gem1}" opacity=".9"/>
      <polygon points="13,21 15,18 17,21" fill="${gem2}" opacity=".9"/>
      <ellipse cx="10" cy="16.5" rx="2.2" ry="1.4" fill="white" opacity=".3" transform="rotate(-25,10,16.5)"/>
    </svg>`;
  }
  const isTenM = colorOrName === '10M Gems';
  const c = colorOrName.startsWith('#') ? colorOrName : (isTenM ? '#f59e0b' : '#22d3ee');
  const hi = isTenM ? 'rgba(255,240,150,.5)' : 'rgba(200,250,255,.5)';
  return `<svg viewBox="0 0 28 28" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2 L25 10.5 L20.5 25 L7.5 25 L3 10.5 Z" fill="#0a1428"/>
    <path d="M14 3.5 L23.5 11 L19.5 24 L8.5 24 L4.5 11 Z" fill="${c}"/>
    <path d="M14 3.5 L23.5 11 L14 14.5 Z" fill="white" opacity=".38"/>
    <path d="M14 3.5 L4.5 11 L14 14.5 Z" fill="white" opacity=".18"/>
    <path d="M14 14.5 L8.5 24 L19.5 24 Z" fill="rgba(0,0,0,.28)"/>
    <path d="M10.5 5 L14 3.5 L14 8.5 Z" fill="white" opacity=".5"/>
    ${isTenM ? '<circle cx="20" cy="8" r="2" fill="#fff" opacity=".7"/><circle cx="22" cy="11" r="1.2" fill="#fff" opacity=".4"/>' : ''}
  </svg>`;
}

function _countGems(inv) {
  const counts = {};
  (inv || []).forEach(item => { if (item.gem) counts[item.name] = (counts[item.name] || 0) + 1; });
  return counts;
}

function _addGemItems(name, qty) {
  const denom = GEM_DENOMS.find(g => g.name === name);
  if (!denom || qty < 1) return;
  const inv = getInventory();
  for (let i = 0; i < qty; i++) {
    inv.unshift({ id: Date.now() + 'g' + i + Math.floor(Math.random() * 9999), name, value: denom.value, color: denom.color, gem: true });
  }
  _saveInv(inv);
  _updateNavInvBadge();
}

// Build stacked gem picker UI inside `container`. Returns { getTotal() }.
// Gem items show as rows with − qty + MAX controls instead of individual slots.
function buildGemPicker(container, inv, onChange) {
  const counts = _countGems(inv);
  const present = GEM_DENOMS.filter(g => counts[g.name] > 0).reverse(); // biggest first
  if (!present.length) return null;

  const selections = {};
  present.forEach(g => { selections[g.name] = 0; });

  present.forEach(gem => {
    const owned = counts[gem.name];
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:8px 10px;margin-bottom:5px;';
    row.innerHTML = `
      <div style="width:32px;height:32px;flex-shrink:0;border-radius:8px;overflow:hidden;background:rgba(0,0,0,.3);padding:3px;">${_gemSVG(gem.name)}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:.72rem;font-weight:800;color:#fff;">${gem.name}</div>
        <div style="font-size:.58rem;color:var(--text-muted);">Owned: <b style="color:${gem.color};">${owned.toLocaleString()}</b></div>
      </div>
      <div style="display:flex;align-items:center;gap:4px;">
        <button class="gpick-dec" style="width:24px;height:24px;border-radius:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#9ca3af;font-size:1.1rem;cursor:pointer;padding:0;line-height:1;display:flex;align-items:center;justify-content:center;">−</button>
        <input class="gpick-inp" type="number" min="0" max="${owned}" value="0" style="width:42px;text-align:center;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:3px 0;color:#fff;font-size:.78rem;font-weight:800;">
        <button class="gpick-inc" style="width:24px;height:24px;border-radius:6px;background:rgba(124,77,232,.18);border:1px solid rgba(124,77,232,.4);color:#a67dff;font-size:1.1rem;cursor:pointer;padding:0;line-height:1;display:flex;align-items:center;justify-content:center;">+</button>
        <button class="gpick-max" style="padding:3px 7px;border-radius:6px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.25);color:#4ade80;font-size:.62rem;font-weight:800;cursor:pointer;white-space:nowrap;">MAX</button>
      </div>
      <div class="gpick-val" style="min-width:58px;text-align:right;font-size:.7rem;font-weight:800;color:#fbbf24;">${fmtPSG(0)}</div>
    `;
    container.appendChild(row);

    const inp   = row.querySelector('.gpick-inp');
    const valEl = row.querySelector('.gpick-val');
    const gv    = gem.value;
    const gn    = gem.name;

    const upd = (v) => {
      v = Math.max(0, Math.min(owned, isNaN(v) ? 0 : Math.round(v)));
      inp.value = v;
      selections[gn] = v;
      valEl.textContent = fmtPSG(v * gv);
      if (onChange) onChange();
    };

    row.querySelector('.gpick-dec').onclick = () => upd((+inp.value || 0) - 1);
    row.querySelector('.gpick-inc').onclick = () => upd((+inp.value || 0) + 1);
    row.querySelector('.gpick-max').onclick = () => upd(owned);
    inp.addEventListener('input', () => upd(parseInt(inp.value) || 0));
  });

  return {
    getTotal: () => GEM_DENOMS.reduce((s, g) => s + (selections[g.name] || 0) * g.value, 0),
  };
}

// Auto-populate inventory based on balance so high-balance users have pets to wager
function _autoFillInventory() {
  if (getInventory().length > 0) return;
  if (typeof CV === 'undefined' || !CV.length) return;
  const bal = getBalance();
  if (bal < 5e6) return;
  const maxPerPet = Math.floor(bal * 0.22);
  const pool = CV.filter(p => p.img && p.n > 0 && p.n <= maxPerPet)
               .sort(() => Math.random() - 0.5);
  if (!pool.length) return;
  const count = Math.min(7, Math.max(3, pool.length));
  pool.slice(0, count).forEach(p => _addToInv(p, 'Normal', p.n));

  // Also seed some gem items so users can see the stacked gem UI
  const gemBal = bal * 0.3; // treat 30% of balance as gems
  if (gemBal >= 1e9)  _addGemItems('1B Gems',   Math.min(5, Math.floor(gemBal / 1e9)));
  if (gemBal >= 1e8)  _addGemItems('100M Gems', Math.min(8, Math.floor((gemBal % 1e9) / 1e8)));
  if (gemBal >= 1e7)  _addGemItems('10M Gems',  Math.min(9, Math.floor((gemBal % 1e8) / 1e7)));
}
function _updateNavInvBadge() {
  const el = document.getElementById('nav-inv-count');
  if (!el) return;
  const n = getInventory().length;
  el.textContent = n; el.style.display = n > 0 ? 'inline-flex' : 'none';
}

/* -- DEPOSIT MODAL (Trade Bot Flow) -- */
const _DEP_BOT        = '99DepoBot';
const _DEP_SERVER_URL = 'https://www.roblox.com/share?code=9e9097507ceb1241ba8d46a11037f79e&type=Server';
let _depVerifyTimer = null;

function _ensureDepositModal() {
  if (document.getElementById('dep-overlay')) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
<div id="dep-overlay" class="dep-overlay" onclick="closeDepositModal(event)">
  <div class="dep-card">
    <div class="dep-head">
      <div class="dep-head-left">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18"><rect x="2" y="5" width="16" height="12" rx="2"/><path d="M2 9h16M6 13h2"/></svg>
        <span class="dep-title">Deposit Pets</span>
      </div>
      <button class="dep-close-btn" onclick="closeDepositModal(null,true)">X</button>
    </div>

    <div class="dep-bot-card" style="margin-bottom:16px;">
      <div class="dep-bot-av">
        <svg viewBox="0 0 20 20" fill="none" width="20" height="20"><polygon points="10,2 18,7 15,18 5,18 2,7" fill="#7c4de8"/><polygon points="10,6 14,10 10,14 6,10" fill="white" opacity=".9"/></svg>
      </div>
      <div class="dep-bot-info">
        <div class="dep-bot-name">${_DEP_BOT}</div>
        <div class="dep-bot-tag">Trade Bot . Pet Simulator 99 . In-Game</div>
      </div>
      <a class="dep-join-btn" href="${_DEP_SERVER_URL}" target="_blank" rel="noopener">Join Server -></a>
    </div>

    <div style="margin-bottom:16px;">
      <div style="font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:7px;">Your Roblox Username</div>
      <div style="display:flex;gap:8px;align-items:center;">
        <input id="dep-rblx-user" type="text" placeholder="YourRobloxName" autocomplete="off" spellcheck="false"
          style="flex:1;background:rgba(255,255,255,.05);border:1.5px solid rgba(124,77,232,.35);border-radius:10px;padding:10px 13px;color:#fff;font-size:.9rem;font-family:inherit;outline:none;transition:border .15s;"
          onfocus="this.style.borderColor='rgba(124,77,232,.7)'" onblur="this.style.borderColor='rgba(124,77,232,.35)'"
          oninput="depClearStatus()">
        <button onclick="_depRegisterUser()" id="dep-reg-btn"
          style="padding:10px 18px;background:linear-gradient(135deg,#7c4de8,#6d28d9);border:none;border-radius:10px;color:#fff;font-size:.82rem;font-weight:800;cursor:pointer;white-space:nowrap;transition:all .18s;box-shadow:0 0 16px rgba(124,77,232,.4);">
          Ready ->
        </button>
      </div>
      <div id="dep-reg-status" style="font-size:.68rem;margin-top:6px;min-height:16px;font-weight:700;"></div>
    </div>

    <div style="display:flex;flex-direction:column;gap:7px;">
      <div style="display:flex;align-items:center;gap:10px;font-size:0.8rem;color:var(--text-sub);">
        <div style="width:22px;height:22px;border-radius:50%;background:rgba(124,77,232,.2);border:1px solid rgba(124,77,232,.4);display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:900;color:#a78bfa;flex-shrink:0;">1</div>
        Enter your Roblox username and click Ready
      </div>
      <div style="display:flex;align-items:center;gap:10px;font-size:0.8rem;color:var(--text-sub);">
        <div style="width:22px;height:22px;border-radius:50%;background:rgba(124,77,232,.2);border:1px solid rgba(124,77,232,.4);display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:900;color:#a78bfa;flex-shrink:0;">2</div>
        Join the server and find <strong style="color:#fff;">${_DEP_BOT}</strong>
      </div>
      <div style="display:flex;align-items:center;gap:10px;font-size:0.8rem;color:var(--text-sub);">
        <div style="width:22px;height:22px;border-radius:50%;background:rgba(124,77,232,.2);border:1px solid rgba(124,77,232,.4);display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:900;color:#a78bfa;flex-shrink:0;">3</div>
        Send a trade request with your pets  -  no chat needed
      </div>
      <div style="display:flex;align-items:center;gap:10px;font-size:0.8rem;color:var(--text-sub);">
        <div style="width:22px;height:22px;border-radius:50%;background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.4);display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:900;color:#4ade80;flex-shrink:0;">4</div>
        <span style="color:#4ade80;font-weight:700;">Bot accepts  -  items appear in your wallet instantly</span>
      </div>
    </div>

    <!-- Success panel  -  shown by WebSocket when bot confirms trade -->
    <div id="dep-s3" style="display:none;margin-top:16px;">
      <div class="dep-success-wrap">
        <div class="dep-check-circle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="32" height="32"><path d="M5 12l5 5L20 7"/></svg></div>
        <div class="dep-s3-title">Trade Accepted!</div>
        <div class="dep-s3-sub">Items have been added to your wallet</div>
      </div>
      <div class="dep-found-grid" id="dep-found-grid"></div>
      <div class="dep-total-row">
        <span>Total credited:</span>
        <span id="dep-total-val" style="color:var(--green);font-weight:900;font-size:1rem;"></span>
      </div>
      <button class="dep-action-btn dep-done-btn" onclick="closeDepositModal(null,true)">Done  -  View Wallet</button>
    </div>
  </div>
</div>`;
  document.body.appendChild(wrap.firstElementChild);
}


function openDepositModal() {
  _ensureDepositModal();
  const s3  = document.getElementById('dep-s3');
  const btn = document.getElementById('dep-reg-btn');
  const inp = document.getElementById('dep-rblx-user');
  const st  = document.getElementById('dep-reg-status');
  if (s3)  s3.style.display = 'none';
  if (btn) { btn.textContent = 'Ready ->'; btn.disabled = false; btn.style.cssText = 'padding:10px 18px;background:linear-gradient(135deg,#7c4de8,#6d28d9);border:none;border-radius:10px;color:#fff;font-size:.82rem;font-weight:800;cursor:pointer;white-space:nowrap;transition:all .18s;box-shadow:0 0 16px rgba(124,77,232,.4);'; }
  if (st)  st.textContent = '';
  // Pre-fill saved username
  const saved = localStorage.getItem('ps99g_rblx_user');
  if (inp && saved) inp.value = saved;
  const ov = document.getElementById('dep-overlay');
  ov.style.display = 'flex';
  requestAnimationFrame(() => ov.classList.add('active'));
  _connectWS();
}
function closeDepositModal(e, force) {
  if (e && e.target !== document.getElementById('dep-overlay') && !force) return;
  clearTimeout(_depVerifyTimer);
  const ov = document.getElementById('dep-overlay');
  if (!ov) return;
  ov.classList.remove('active');
  setTimeout(() => { ov.style.display = 'none'; }, 220);
}
async function _depStartVerify() {
  const rblxUser = (document.getElementById('dep-rblx-user')?.value || '').trim();
  if (!rblxUser) {
    showToast('Enter your Roblox username first', 'info');
    return;
  }

  document.getElementById('dep-s1').style.display = 'none';
  document.getElementById('dep-s2').style.display = 'block';

  const subEl = document.getElementById('dep-v-sub');

  if (_wsId) {
    subEl.textContent = 'Registering session...';
    try {
      const resp = await fetch(_SERVER_HTTP + '/api/auth/register-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ robloxUsername: rblxUser, wsId: _wsId }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        showToast(err.error || 'Server error  -  try again', 'info');
        document.getElementById('dep-s1').style.display = 'block';
        document.getElementById('dep-s2').style.display = 'none';
        return;
      }
      subEl.textContent = 'Waiting for bot to accept trade...';
      // deposit_complete arrives via WebSocket
    } catch {
      subEl.textContent = 'Server offline  -  demo mode';
      _depVerifyTimer = setTimeout(() => _depShowPreview(), 4000);
    }
  } else {
    subEl.textContent = 'No server connection  -  demo mode';
    _depVerifyTimer = setTimeout(() => _depShowPreview(), 4000);
  }
}

// Called by WebSocket when bot completes a trade.
// items = array from bot: { petName, primaryImageId, variant, slotName, ... }
// gems  = raw gem count (PSG value 1:1)
function _depShowRealSuccess(items, gems) {
  clearTimeout(_depVerifyTimer);
  const psgIco = '<svg viewBox="0 0 28 28" width="12" height="12" fill="none" style="vertical-align:middle;margin-right:2px"><polygon points="25,14 19.5,23.5 8.5,23.5 3,14 8.5,4.5 19.5,4.5" fill="#7c4de8"/><polygon points="14,8.5 19.5,14 14,19.5 8.5,14" fill="white" opacity=".9"/></svg>';
  const grid = document.getElementById('dep-found-grid');
  if (!grid) return;
  grid.innerHTML = '';
  let total = Number(gems) || 0;

  (items || []).forEach(item => {
    const imgId   = item.primaryImageId ? String(item.primaryImageId) : null;
    const botName = (item.petName || item.slotName || '').trim();

    // Match to CV: try image ID first, then name substring
    let match = null;
    if (imgId && typeof CV !== 'undefined') {
      match = CV.find(p => String(p.img) === imgId);
    }
    if (!match && botName && typeof CV !== 'undefined') {
      const low = botName.toLowerCase();
      match = CV.find(p => p.name.toLowerCase() === low)
           || CV.find(p => p.name.toLowerCase().includes(low) || low.includes(p.name.toLowerCase()));
    }

    const name  = match ? match.name  : (botName || `Unknown (${imgId || '?'})`);
    const val   = match ? match.n     : 0;
    const img   = match ? match.img   : imgId;
    const short = name.replace(/^(Huge|Titanic|Gargantuan)\s/, '');

    total += val;
    if (match) _addToInv(match, 'n', val);

    const imgSrc = img ? `https://assetdelivery.roblox.com/v1/asset/?id=${img}` : '';
    grid.innerHTML += `<div class="dep-found-item">
      ${img ? `<div class="dep-found-img"><img src="${imgSrc}" alt="${short}" loading="lazy"
        onerror="if(!this.dataset.fb){this.dataset.fb=1;this.src='https://db.biggames.io/api/thumbnails/asset/${img}';}else{this.style.opacity='.3';}"></div>` : ''}
      <div class="dep-found-name">${short}</div>
      <div class="dep-found-val">${val > 0 ? '+' + fmtB(val) : 'Unknown value'}</div>
    </div>`;
  });

  if (total > 0) { addBal(total); refreshBal(); }
  document.getElementById('dep-total-val').textContent = '+' + fmtB(total);
  document.getElementById('dep-s2').style.display = 'none';
  document.getElementById('dep-s3').style.display = 'block';
  burstParticles(window.innerWidth / 2, window.innerHeight / 2, true);
}

// Demo / preview mode when server isn't running
function _depShowPreview() {
  const pool = (typeof CV !== 'undefined') ? CV.filter(p => p.img && p.n >= 100000000 && p.n <= 10000000000) : [];
  const count = 1 + Math.floor(Math.random() * 3);
  const picked = []; const used = new Set();
  for (let i = 0; i < count && pool.length; i++) {
    let p, tries = 0;
    do { p = pool[Math.floor(Math.random() * pool.length)]; tries++; } while (used.has(p.name) && tries < 30);
    if (!used.has(p.name)) { picked.push(p); used.add(p.name); }
  }
  let total = 0;
  const grid = document.getElementById('dep-found-grid');
  grid.innerHTML = '';
  picked.forEach(p => {
    total += p.n;
    _addToInv(p, 'n', p.n);
    const short = p.name.replace(/^(Huge|Titanic|Gargantuan)\s/, '');
    grid.innerHTML += `<div class="dep-found-item">
      <div class="dep-found-img"><img src="https://assetdelivery.roblox.com/v1/asset/?id=${p.img}" alt="${short}" loading="lazy"
        onerror="if(!this.dataset.fb){this.dataset.fb=1;this.src='https://db.biggames.io/api/thumbnails/asset/${p.img}';}else{this.style.opacity='.3';}"></div>
      <div class="dep-found-name">${short}</div>
      <div class="dep-found-val">+${fmtB(p.n)}</div>
    </div>`;
  });
  addBal(total); refreshBal();
  document.getElementById('dep-total-val').textContent = '+' + fmtB(total);
  document.getElementById('dep-s2').style.display = 'none';
  document.getElementById('dep-s3').style.display = 'block';
  burstParticles(window.innerWidth / 2, window.innerHeight / 2, true);
}

/* -- WITHDRAW MODAL -- */
let _wdrSelected = new Set();

function _ensureWithdrawModal() {
  if (document.getElementById('wdr-overlay')) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
<div id="wdr-overlay" class="dep-overlay" onclick="closeWithdrawModal(event)">
  <div class="dep-card">
    <div class="dep-head">
      <div class="dep-head-left">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18"><path d="M10 17V7M6 11l4-4 4 4"/><rect x="2" y="14" width="16" height="4" rx="1" fill="currentColor" opacity=".2"/></svg>
        <span class="dep-title">Withdraw Items</span>
      </div>
      <button class="dep-close-btn" onclick="closeWithdrawModal(null,true)">X</button>
    </div>
    <div id="wdr-s1" class="dep-step">
      <div class="wdr-inv-header">
        <span class="wdr-inv-lbl">Your Inventory</span>
        <span class="wdr-inv-count" id="wdr-inv-count">0 items</span>
      </div>
      <div class="wdr-inv-grid" id="wdr-inv-grid"></div>
      <div class="wdr-username-row">
        <label class="wdr-lbl">Your Roblox Username (we'll send the trade here)</label>
        <input type="text" id="wdr-username" class="wdr-input" placeholder="Enter Roblox username...">
      </div>
      <button class="dep-action-btn" id="wdr-submit-btn" onclick="_wdrSubmit()" disabled>Select items to withdraw</button>
    </div>
    <div id="wdr-s2" class="dep-step" style="display:none">
      <div class="dep-verify-wrap">
        <div class="dep-spinner"></div>
        <div class="dep-v-title">Processing Withdrawal...</div>
        <div class="dep-v-sub">Preparing trade offer for your account</div>
      </div>
    </div>
    <div id="wdr-s3" class="dep-step" style="display:none">
      <div class="dep-success-wrap">
        <div class="dep-check-circle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="32" height="32"><path d="M5 12l5 5L20 7"/></svg></div>
        <div class="dep-s3-title">Withdrawal Requested!</div>
        <div class="dep-s3-sub">Trade offer will be sent within <strong>5-15 minutes</strong></div>
      </div>
      <div class="wdr-note">Items removed from your inventory. Check your Roblox trade offers.</div>
      <button class="dep-action-btn dep-done-btn" onclick="closeWithdrawModal(null,true)">Close</button>
    </div>
  </div>
</div>`;
  document.body.appendChild(wrap.firstElementChild);
}
function openWithdrawModal() {
  _ensureWithdrawModal();
  _wdrSelected = new Set();
  _renderWdrInv();
  ['wdr-s1','wdr-s2','wdr-s3'].forEach((id,i) => document.getElementById(id).style.display = i===0?'block':'none');
  const ov = document.getElementById('wdr-overlay');
  ov.style.display = 'flex';
  requestAnimationFrame(() => ov.classList.add('active'));
}
function closeWithdrawModal(e, force) {
  if (e && e.target !== document.getElementById('wdr-overlay') && !force) return;
  const ov = document.getElementById('wdr-overlay');
  if (!ov) return;
  ov.classList.remove('active');
  setTimeout(() => { ov.style.display='none'; }, 220);
}
function _renderWdrInv() {
  const inv = getInventory();
  const grid = document.getElementById('wdr-inv-grid');
  const countEl = document.getElementById('wdr-inv-count');
  if (!grid) return;
  countEl.textContent = `${inv.length} item${inv.length!==1?'s':''}`;
  if (inv.length === 0) {
    grid.innerHTML = '<div class="wdr-empty"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" width="44" height="44"><rect x="4" y="12" width="40" height="28" rx="3"/><path d="M4 20h40"/><circle cx="16" cy="30" r="3"/><path d="M24 27h12M24 33h8"/></svg><div>No items in inventory</div><div>Deposit items first to see them here</div></div>';
    document.getElementById('wdr-submit-btn').disabled = true;
    document.getElementById('wdr-submit-btn').textContent = 'No items to withdraw';
    return;
  }

  // Separate gems (stacked display) from pets (individual slots)
  const gemCounts = _countGems(inv);
  const hasGems = Object.values(gemCounts).some(c => c > 0);
  const pets    = inv.filter(item => !item.gem);

  grid.innerHTML = '';

  // Gem section — stacked rows with quantity badge
  if (hasGems) {
    const gemSec = document.createElement('div');
    gemSec.style.cssText = 'margin-bottom:12px;';
    gemSec.innerHTML = '<div style="font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:6px;">Gems</div>';
    GEM_DENOMS.filter(g => gemCounts[g.name] > 0).reverse().forEach(gem => {
      const qty = gemCounts[gem.name];
      // All gem items of this denomination get selected together
      const ids = inv.filter(i => i.gem && i.name === gem.name).map(i => i.id);
      const rowId = 'wdr-gem-' + gem.name.replace(/\s/g, '_');
      const row = document.createElement('div');
      row.id = rowId;
      row.style.cssText = 'display:flex;align-items:center;gap:10px;background:rgba(0,0,0,.25);border:1.5px solid rgba(255,255,255,.07);border-radius:10px;padding:9px 12px;margin-bottom:5px;cursor:pointer;transition:border-color .15s;';
      row.innerHTML = `
        <div style="width:34px;height:34px;flex-shrink:0;border-radius:8px;overflow:hidden;background:rgba(0,0,0,.3);padding:2px;">${_gemSVG(gem.color)}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:.78rem;font-weight:800;color:#fff;">${gem.name}</div>
          <div style="font-size:.62rem;font-weight:700;" style="color:${gem.color};">×${qty.toLocaleString()} &mdash; ${fmtPSG(qty * gem.value)} total</div>
        </div>
        <div class="wdr-item-check" id="wgc-${rowId}" style="width:16px;height:16px;border-radius:4px;border:1.5px solid rgba(255,255,255,.2);flex-shrink:0;display:flex;align-items:center;justify-content:center;"></div>
      `;
      row.onclick = () => {
        const allSelected = ids.every(id => _wdrSelected.has(id));
        if (allSelected) {
          ids.forEach(id => _wdrSelected.delete(id));
          row.style.borderColor = 'rgba(255,255,255,.07)';
          document.getElementById('wgc-' + rowId).innerHTML = '';
        } else {
          ids.forEach(id => _wdrSelected.add(id));
          row.style.borderColor = gem.color;
          document.getElementById('wgc-' + rowId).innerHTML = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" width="10" height="10"><path d="M2 6l3 3 5-5"/></svg>';
        }
        const btn = document.getElementById('wdr-submit-btn');
        btn.disabled = _wdrSelected.size === 0;
        btn.textContent = _wdrSelected.size > 0 ? `Withdraw ${_wdrSelected.size} Item${_wdrSelected.size>1?'s':''}` : 'Select items to withdraw';
      };
      gemSec.appendChild(row);
    });
    grid.appendChild(gemSec);
  }

  // Pet items — individual selectable slots
  if (pets.length > 0) {
    const petSec = document.createElement('div');
    petSec.innerHTML = hasGems ? '<div style="font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:6px;">Pets</div>' : '';
    const petGrid = document.createElement('div');
    petGrid.className = 'wdr-inv-grid';
    petGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px;';
    pets.forEach(item => {
      petGrid.innerHTML += `
        <div class="wdr-item" id="wi-${item.id}" onclick="_toggleWdrItem('${item.id}')">
          <div class="wdr-item-check" id="wc-${item.id}"></div>
          <div class="wdr-item-img"><img src="https://assetdelivery.roblox.com/v1/asset/?id=${item.img}" alt="${item.name}" loading="lazy"
            onerror="if(!this.dataset.fb){this.dataset.fb=1;this.src='https://db.biggames.io/api/thumbnails/asset/${item.img}';}else{this.style.opacity='.3';}"></div>
          <div class="wdr-item-name">${item.name.replace(/^(Huge|Titanic|Gargantuan)\s/,'')}</div>
          <div class="wdr-item-val">${fmtPSG(item.value)}</div>
        </div>`;
    });
    petSec.appendChild(petGrid);
    grid.appendChild(petSec);
  }
}
function _toggleWdrItem(id) {
  const el = document.getElementById('wi-'+id);
  const chk = document.getElementById('wc-'+id);
  if (_wdrSelected.has(id)) {
    _wdrSelected.delete(id); el.classList.remove('selected');
    chk.innerHTML = '';
  } else {
    _wdrSelected.add(id); el.classList.add('selected');
    chk.innerHTML = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><path d="M2 6l3 3 5-5"/></svg>';
  }
  const btn = document.getElementById('wdr-submit-btn');
  btn.disabled = _wdrSelected.size === 0;
  btn.textContent = _wdrSelected.size > 0 ? `Withdraw ${_wdrSelected.size} Item${_wdrSelected.size>1?'s':''}` : 'Select items to withdraw';
}
function _wdrSubmit() {
  const uname = document.getElementById('wdr-username')?.value.trim();
  if (!uname) return showToast('Enter your Roblox username!', 'info');
  document.getElementById('wdr-s1').style.display = 'none';
  document.getElementById('wdr-s2').style.display = 'block';

  // Capture item IDs before clearing selection
  const itemIds = Array.from(_wdrSelected);
  const username = localStorage.getItem('ps99g_rblx_user') || '';

  // Tell server to remove items from DB and queue the withdrawal
  fetch(_SERVER_HTTP + '/api/withdraw/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, itemIds, gems: 0 }),
  }).catch(() => {});

  // Remove from local inventory immediately
  itemIds.forEach(id => _removeFromInv(id));
  _wdrSelected.clear();
  setTimeout(() => { document.getElementById('wdr-s2').style.display='none'; document.getElementById('wdr-s3').style.display='block'; }, 2200);
}

/* -- ANNOUNCE BAR TICKER -- */
function initAnnounceTicker() {
  const bar = document.querySelector('.announce-bar');
  if (!bar) return;
  const inner = bar.innerHTML;
  // Exactly 2 copies + translate(-50%) = seamless loop with no gap
  bar.innerHTML = `<span class="announce-bar-inner">${inner}&nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;${inner}&nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;</span>`;
}

/* -- BACKGROUND PARTICLES -- */
function initBgParticles() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.55;';
  document.body.insertBefore(canvas, document.body.firstChild);
  const ctx = canvas.getContext('2d');
  const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  resize();
  window.addEventListener('resize', resize);

  const DOTS = Array.from({length:28}, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    r: .5 + Math.random() * 1.2,
    vx: (Math.random() - .5) * .18,
    vy: -.08 - Math.random() * .14,
    life: Math.random(),
    maxLife: .6 + Math.random() * .4,
    color: Math.random() > .6 ? '124,77,232' : Math.random() > .5 ? '6,182,212' : '251,191,36',
  }));

  (function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    DOTS.forEach(d => {
      d.x += d.vx; d.y += d.vy;
      d.life -= .0012;
      if (d.life <= 0 || d.y < -10) {
        d.x = Math.random() * canvas.width;
        d.y = canvas.height + 10;
        d.life = d.maxLife;
      }
      const a = Math.min(d.life, 1 - d.life) * 0.5;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${d.color},${a.toFixed(3)})`;
      ctx.fill();
    });
    requestAnimationFrame(tick);
  })();
}

/* -- ITEM HOVER TOOLTIP -- */
let _itemTipEl = null;
function _showItemTip(data, x, y) {
  _hideItemTip();
  const tip = document.createElement('div');
  tip.className = 'item-hover-tip'; tip.id = 'item-hover-tip';
  const src = data.img ? `https://assetdelivery.roblox.com/v1/asset/?id=${data.img}` : '';
  tip.innerHTML = (src ? `<img src="${src}" alt="" onerror="this.style.opacity='0'">` : '') +
    `<div class="item-hover-tip-name">${data.name||'Item'}</div>` +
    `<div class="item-hover-tip-val">Value: ${typeof fmtPSG==='function'?fmtPSG(data.value||0):data.value}</div>`;
  tip.style.left = Math.min(x+14, window.innerWidth-175) + 'px';
  tip.style.top  = Math.min(y+14, window.innerHeight-130) + 'px';
  document.body.appendChild(tip);
  _itemTipEl = tip;
}
function _hideItemTip() {
  if (_itemTipEl) { _itemTipEl.remove(); _itemTipEl = null; }
}
document.addEventListener('mouseover', e => {
  const el = e.target.closest('[data-item-tip]');
  if (!el) { _hideItemTip(); return; }
  try { _showItemTip(JSON.parse(el.getAttribute('data-item-tip')), e.clientX, e.clientY); } catch {}
});
document.addEventListener('mousemove', e => {
  if (_itemTipEl) {
    _itemTipEl.style.left = Math.min(e.clientX+14, window.innerWidth-175) + 'px';
    _itemTipEl.style.top  = Math.min(e.clientY+14, window.innerHeight-130) + 'px';
  }
});
document.addEventListener('mouseout', e => {
  if (e.target.hasAttribute?.('data-item-tip') && !e.relatedTarget?.closest('[data-item-tip]')) _hideItemTip();
});

/* -- INIT -- */
document.addEventListener('DOMContentLoaded', () => {
  initAnnounceTicker();
  initBgParticles();
  // Win/lose particle canvas  -  only create if page doesn't already have one
  if (!document.getElementById('particle-canvas') && !document.getElementById('particleCanvas')) {
    const pc = document.createElement('canvas');
    pc.id = 'particle-canvas';
    pc.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:500;';
    pc.width = window.innerWidth; pc.height = window.innerHeight;
    document.body.appendChild(pc);
    window.addEventListener('resize', () => { pc.width = window.innerWidth; pc.height = window.innerHeight; });
  }
  // Ensure any existing canvas has correct dimensions
  const existingPC = document.getElementById('particleCanvas') || document.getElementById('particle-canvas');
  if (existingPC) {
    existingPC.width = window.innerWidth; existingPC.height = window.innerHeight;
    window.addEventListener('resize', () => { existingPC.width = window.innerWidth; existingPC.height = window.innerHeight; });
  }

  initVerification();
  refreshBal();
  _connectWS();

  const chatIn = document.getElementById('chat-input');
  const chatBtn = document.getElementById('chat-send');
  if (chatIn && chatBtn) {
    chatBtn.addEventListener('click', sendChatMsg);
    chatIn.addEventListener('keydown', e => { if (e.key === 'Enter') sendChatMsg(); });
  }

  document.querySelectorAll('[data-free]').forEach(b => b.addEventListener('click', claimFree));

  // Restore chat history from previous pages
  _loadChatHistory();

});

function sendChatMsg() {
  const inp = document.getElementById('chat-input');
  if (!inp || !inp.value.trim()) return;
  const text = inp.value.trim();
  inp.value = '';

  const u = currentUser();
  const displayName = u.displayName || u.username || ('Guest#' + Math.floor(Math.random()*9000+1000));

  // Always render locally immediately (optimistic)
  _renderChatMsg({ username: u.username || 'guest', displayName, avatar: u.avatar, text, ts: Date.now() }, true);

  // Also try to broadcast to server
  if (_wsConn && _wsConn.readyState === WebSocket.OPEN) {
    _wsConn.send(JSON.stringify({
      type:        'chat',
      text,
      displayName,
      avatar:      u.avatar || '',
    }));
  }
}

let _isAdmin = false;

function _checkAdminStatus() {
  const u = currentUser();
  if (!u.username) return;
  fetch(_SERVER_HTTP + '/api/admin/check/' + encodeURIComponent(u.username))
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      if (d?.isAdmin) {
        _isAdmin = true;
        localStorage.setItem('ps99g_isAdmin', '1');
        _applyAdminBadge();
        _refreshAuthButton();
      }
    })
    .catch(() => {
      // Keep cached isAdmin from localStorage
      if (localStorage.getItem('ps99g_isAdmin') === '1') { _isAdmin = true; _applyAdminBadge(); }
    });
}

function _applyAdminBadge() {
  document.querySelectorAll('.admin-crown-badge').forEach(el => el.style.display = 'inline');
}

let _chatAdminName = localStorage.getItem('ps99g_admin_name') || 'Owner';

const _CHAT_HIST_KEY = 'ps99g_chat_hist';
function _saveChatMsg(msg) {
  try {
    const hist = JSON.parse(localStorage.getItem(_CHAT_HIST_KEY) || '[]');
    hist.push({ username: msg.username || '', displayName: msg.displayName || '', avatar: msg.avatar || '', text: msg.text || '', ts: msg.ts || Date.now(), isAdmin: msg.isAdmin || false });
    if (hist.length > 30) hist.splice(0, hist.length - 30);
    localStorage.setItem(_CHAT_HIST_KEY, JSON.stringify(hist));
  } catch {}
}
function _loadChatHistory() {
  const wrap = document.getElementById('chat-msgs');
  if (!wrap) return;
  try {
    const hist = JSON.parse(localStorage.getItem(_CHAT_HIST_KEY) || '[]');
    hist.forEach(msg => _renderChatMsg({ ...msg, _noSave: true }, false));
  } catch {}
}

function _renderChatMsg(msg, isMe) {
  const wrap = document.getElementById('chat-msgs');
  if (!wrap) return;
  const u = currentUser();
  isMe = isMe || (msg.username && msg.username === u.username);
  if (!msg._noSave && !msg.isSystem && msg.username !== '__system') _saveChatMsg(msg);

  // System messages
  if (msg.isSystem || msg.username === '__system') {
    const div = document.createElement('div');
    div.style.cssText = 'padding:6px 14px;font-size:.72rem;color:rgba(148,163,184,.7);font-style:italic;text-align:center;animation:slideInMsg .2s ease;';
    div.textContent = msg.text;
    wrap.appendChild(div);
    wrap.scrollTop = wrap.scrollHeight;
    return;
  }

  const prof    = myProfile();
  const rank    = getRank(prof.wagered);
  const name    = msg.displayName || msg.username || 'Player';
  const isAdminMsg = msg.isAdmin;
  if (isAdminMsg) { _chatAdminName = msg.displayName || msg.username || 'Owner'; localStorage.setItem('ps99g_admin_name', _chatAdminName); }

  const msgAvatar = isMe ? (u.avatar || '') : (msg.avatar || '');
  const avatarHtml = msgAvatar
    ? `<img src="${msgAvatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentElement.innerHTML='<span style=\\'font-size:.7rem;font-weight:900;\\'>${name.slice(0,2).toUpperCase()}</span>'">`
    : `<span style="font-size:.7rem;font-weight:900;">${name.slice(0,2).toUpperCase()}</span>`;

  const nameColor = isAdminMsg ? '#fbbf24' : isMe ? '#a78bfa' : '#93c5fd';
  const circleBg  = isAdminMsg ? 'linear-gradient(135deg,#92400e,#f59e0b,#78350f)'
                  : isMe       ? 'linear-gradient(135deg,#7c3aed,#a78bfa)'
                  :              'linear-gradient(135deg,#1e1b4b,#4338ca)';

  const adminBadge = isAdminMsg
    ? `<span style="font-size:.54rem;font-weight:900;background:linear-gradient(135deg,#f59e0b,#b45309);color:#fff;padding:2px 7px;border-radius:20px;margin-left:4px;letter-spacing:.04em;box-shadow:0 0 8px rgba(245,158,11,.4);">[crown] OWNER</span>`
    : '';

  const msgBg = isAdminMsg
    ? 'background:linear-gradient(135deg,rgba(245,158,11,.07),rgba(180,83,9,.04));border-left:2px solid rgba(245,158,11,.45);'
    : '';

  // Store profile data so onclick can look it up without URL-encoding issues
  window._chatProfiles = window._chatProfiles || {};
  const _profileKey = msg.username || ('u' + Date.now());
  window._chatProfiles[_profileKey] = { displayName: name, avatarUrl: msgAvatar, username: msg.username };

  const avatarOnclick = isAdminMsg ? `onclick="_openOwnerProfile()"`
    : isMe ? `onclick="openProfileModal('you',0)"`
    : `onclick="_openChatProfile('${_profileKey}')"`;

  const div = document.createElement('div');
  div.className = 'chat-msg';
  div.style.cssText = 'animation:slideInMsg .2s ease forwards;' + msgBg;
  div.innerHTML = `
    <div class="cm-avatar-wrap">
      <div class="cm-av-circle" ${avatarOnclick} style="cursor:pointer;background:${circleBg};overflow:hidden;${isAdminMsg?'box-shadow:0 0 12px rgba(245,158,11,.5);':''}">${avatarHtml}</div>
    </div>
    <div class="cm-body">
      <div class="cm-meta">
        <span class="cm-name" style="color:${nameColor};font-weight:${isAdminMsg?'900':'800'}">${isMe ? (u.displayName||'You') : name}</span>
        ${adminBadge}
        ${isMe ? `<span class="cm-rank-icon" title="${rank.name}" style="color:${rank.color}">${rank.icon}</span>` : ''}
        <span class="cm-time">${formatTime()}</span>
      </div>
      <div class="cm-text">${msg.text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
    </div>`;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
  while (wrap.children.length > 120) wrap.removeChild(wrap.firstChild);
}

/* -- BIO VERIFICATION -- */
const _VERIFY_KEY = 'ps99g_verified';
const _PHRASE_KEY  = 'ps99g_phrase';

const _WORD_LIST = ['apple','bridge','candle','dragon','eagle','forest','galaxy','hammer',
  'island','jungle','kite','lantern','marble','nebula','ocean','pillar','quartz','rocket',
  'signal','thunder','umbrella','valley','whale','xenon','yellow','zebra','amber','blaze',
  'crystal','delta','ember','falcon','glider','haven','iris','jewel','knight','lotus',
  'meteor','nimbus','orbit','prism','quest','ridge','shadow','titan','ultra','vortex'];

function _genPhrase() {
  const saved = localStorage.getItem(_PHRASE_KEY);
  if (saved) return saved;
  const words = [];
  const pool = [..._WORD_LIST].sort(() => Math.random() - 0.5);
  for (let i = 0; i < 6; i++) words.push(pool[i]);
  const phrase = '99Depo - ' + words.join(' ');
  localStorage.setItem(_PHRASE_KEY, phrase);
  return phrase;
}

function _isVerified() {
  return !!localStorage.getItem(_VERIFY_KEY) || !!localStorage.getItem('ps99g_rblx_verified');
}

// -- COMPACT LOGIN SYSTEM -----------------------------

function _injectLoginCSS() {
  if (document.getElementById('login-css')) return;
  const s = document.createElement('style');
  s.id = 'login-css';
  s.textContent = `
    @keyframes loginSlideIn {
      from { opacity:0; transform:translateY(-14px) scale(.97); }
      to   { opacity:1; transform:translateY(0) scale(1); }
    }
    #login-modal-overlay {
      position:fixed;inset:0;z-index:99999;
      background:rgba(2,0,14,.6);backdrop-filter:blur(8px);
      display:flex;align-items:flex-start;justify-content:flex-end;
      padding:68px 18px 0 0;
    }
    #login-modal-box {
      background:linear-gradient(160deg,#1e1245,#0d0824);
      border:1.5px solid rgba(124,77,232,.55);
      border-radius:20px;padding:28px 24px;width:310px;
      max-width:calc(100vw - 36px);
      box-shadow:0 0 60px rgba(124,77,232,.35),0 30px 60px rgba(0,0,0,.75);
      animation:loginSlideIn .35s cubic-bezier(.34,1.56,.64,1);
    }
    #auth-wrap button { font-family:inherit; }
    .auth-user-chip {
      display:flex;align-items:center;gap:7px;
      padding:5px 12px 5px 5px;
      background:rgba(124,77,232,.16);
      border:1.5px solid rgba(124,77,232,.38);
      border-radius:30px;color:#fff;cursor:pointer;
      transition:all .15s;font-family:inherit;
    }
    .auth-user-chip:hover { background:rgba(124,77,232,.28); border-color:rgba(167,139,250,.6); }
    .auth-login-btn {
      padding:7px 18px;
      background:linear-gradient(135deg,#7c4de8,#6d28d9);
      border:none;border-radius:9px;color:#fff;
      font-size:.75rem;font-weight:800;cursor:pointer;
      transition:all .15s;font-family:inherit;
      box-shadow:0 0 16px rgba(124,77,232,.4);letter-spacing:.03em;
    }
    .auth-login-btn:hover { transform:translateY(-1px); box-shadow:0 0 28px rgba(124,77,232,.65); }
    #user-dropdown {
      position:fixed;z-index:99998;
      background:linear-gradient(160deg,#1e1245,#0d0824);
      border:1.5px solid rgba(124,77,232,.4);
      border-radius:14px;min-width:180px;
      box-shadow:0 8px 40px rgba(0,0,0,.65);
      overflow:hidden;animation:loginSlideIn .2s ease;
    }
    #user-dropdown button {
      width:100%;padding:10px 16px;background:none;border:none;
      color:rgba(255,255,255,.8);font-size:.78rem;font-weight:700;
      cursor:pointer;text-align:left;font-family:inherit;
      transition:background .12s;display:flex;align-items:center;gap:8px;
    }
    #user-dropdown button:hover { background:rgba(124,77,232,.2); color:#fff; }
  `;
  document.head.appendChild(s);
}

function _injectAuthButton() {
  if (document.getElementById('auth-wrap')) return;
  const target = document.querySelector('.nav-right') || document.querySelector('.topbar-right');
  if (!target) return;
  // + Free Balance button (small, subtle)
  if (!document.getElementById('free-bal-nav-btn')) {
    const fb = document.createElement('button');
    fb.id = 'free-bal-nav-btn';
    fb.textContent = '+ Free';
    fb.title = 'Claim free balance';
    fb.onclick = claimFree;
    fb.style.cssText = 'padding:6px 11px;background:rgba(124,77,232,.12);border:1px solid rgba(124,77,232,.28);border-radius:8px;color:#a78bfa;font-size:.7rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap;';
    fb.onmouseover = () => fb.style.background = 'rgba(124,77,232,.22)';
    fb.onmouseout  = () => fb.style.background = 'rgba(124,77,232,.12)';
    target.insertBefore(fb, target.firstChild);
  }
  // Inject wallet button
  _injectWalletButton();
  // Inject login/user chip
  const wrap = document.createElement('div');
  wrap.id = 'auth-wrap';
  wrap.style.cssText = 'display:flex;align-items:center;margin-left:6px;';
  target.appendChild(wrap);
  _refreshAuthButton();
}

function _injectWalletButton() {
  if (document.getElementById('wallet-btn-wrap')) return;
  const wrap = document.createElement('div');
  wrap.id = 'wallet-btn-wrap';
  wrap.style.cssText = 'display:flex;align-items:center;';
  wrap.innerHTML = `
    <button id="wallet-btn" onclick="_openWalletPanel(event)" title="Wallet" style="
      display:flex;align-items:center;gap:7px;
      padding:7px 13px;background:rgba(124,77,232,.15);
      border:1.5px solid rgba(124,77,232,.35);border-radius:10px;
      color:#c4b5fd;cursor:pointer;font-family:inherit;
      transition:all .15s;font-size:.78rem;font-weight:700;">
      <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
        <rect x="2" y="5" width="16" height="12" rx="2" stroke="#a78bfa" stroke-width="1.6"/>
        <path d="M2 8h16" stroke="#a78bfa" stroke-width="1.6"/>
        <circle cx="15" cy="12" r="1.5" fill="#f59e0b"/>
      </svg>
      <span data-bal-nav> - </span>
    </button>`;
  const target = document.querySelector('.nav-right') || document.querySelector('.topbar-right');
  if (target) target.insertBefore(wrap, target.firstChild);
  // Keep balance in sync
  _updateWalletDisplay();
}

function _updateWalletDisplay() {
  const el = document.querySelector('[data-bal-nav]');
  if (el) el.textContent = fmtPSG(_invTotal());
}

function _openWalletPanel(e) {
  e?.stopPropagation();
  const existing = document.getElementById('wallet-panel');
  if (existing) { existing.remove(); return; }
  _injectLoginCSS();

  const inv  = getInventory();
  const bal  = inv.reduce((s,i) => s + (i.value||0), 0);
  const u    = currentUser();
  const prof = myProfile();
  const rank = getRank(prof.wagered);
  const name = u.displayName || u.username || 'Guest';
  const ini  = name.slice(0,2).toUpperCase();
  const avatarUrl = localStorage.getItem('ps99g_rblx_avatar') || u.avatar || '';
  const lvl  = prof.level || 1;
  const gc   = (prof.winCount||0) + (prof.lossCount||0);
  const wr   = gc > 0 ? Math.round((prof.winCount||0)/gc*100) : 0;
  const profit = (prof.won||0) - (prof.lost||0);

  const panel = document.createElement('div');
  panel.id = 'wallet-panel';
  panel.style.cssText = `position:fixed;top:58px;right:0;
    z-index:99997;width:300px;height:calc(100vh - 58px);
    background:linear-gradient(160deg,#100d28,#0a0719);
    border-left:1.5px solid rgba(124,77,232,.3);
    box-shadow:-8px 0 40px rgba(0,0,0,.7);overflow-y:auto;
    animation:walletSlideIn .22s cubic-bezier(.2,.9,.3,1);font-family:inherit;
    scrollbar-width:thin;scrollbar-color:rgba(124,77,232,.3) transparent;`;

  const avHtml = avatarUrl
    ? `<img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.outerHTML='<span style=\\'font-size:1.8rem;font-weight:900;color:#fff;\\'>${ini}</span>'">`
    : `<span style="font-size:1.8rem;font-weight:900;color:#fff;">${ini}</span>`;

  const invGrid = inv.map(item => {
    const tipData = JSON.stringify({name:item.name,value:item.value||0,img:item.img||''});
    return `<div data-item-tip='${tipData.replace(/'/g,"&#39;")}' style="display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;padding:5px 3px;border-radius:8px;transition:background .12s;" onmouseover="this.style.background='rgba(255,255,255,.06)'" onmouseout="this.style.background=''">
      <div style="width:52px;height:52px;border-radius:9px;background:rgba(0,0,0,.45);border:1.5px solid rgba(255,255,255,.1);overflow:hidden;display:flex;align-items:center;justify-content:center;">
        <img src="https://assetdelivery.roblox.com/v1/asset/?id=${item.img||''}" style="width:100%;height:100%;object-fit:contain;pointer-events:none;" onerror="this.style.opacity='.12'">
      </div>
      <div style="font-size:.58rem;font-weight:700;color:#e2e8f0;text-align:center;max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;">${item.name||'Item'}</div>
      <div style="font-size:.55rem;color:#a78bfa;font-weight:800;pointer-events:none;">${fmtPSG(item.value||0)}</div>
    </div>`;
  }).join('');

  panel.innerHTML = `
    <style>
      @keyframes walletSlideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }
    </style>
    <!-- Header gradient -->
    <div style="height:90px;background:linear-gradient(160deg,#3b0764,#6d28d9,#4c1d95);position:relative;flex-shrink:0;">
      <button onclick="document.getElementById('wallet-panel')?.remove()" style="position:absolute;top:10px;right:12px;background:rgba(0,0,0,.3);border:none;color:rgba(255,255,255,.7);font-size:1.1rem;cursor:pointer;border-radius:6px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;line-height:1;">&times;</button>
    </div>
    <!-- Avatar (overlaps header) -->
    <div style="display:flex;flex-direction:column;align-items:center;margin-top:-46px;padding:0 16px;position:relative;z-index:2;">
      <div style="width:90px;height:90px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#4c1d95);border:3px solid #1a1040;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 4px 20px rgba(124,77,232,.5);position:relative;">
        ${avHtml}
        <div style="position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#7c4de8,#6d28d9);border:2px solid #1a1040;border-radius:20px;padding:1px 8px;font-size:.55rem;font-weight:900;color:#fff;white-space:nowrap;">LVL ${lvl}</div>
      </div>
      <div style="margin-top:10px;font-size:1rem;font-weight:900;color:#fff;">${name}</div>
      <div style="display:flex;gap:6px;margin-top:6px;align-items:center;">
        <span style="font-size:.6rem;font-weight:800;color:${rank.color};background:${rank.bg};border:1px solid ${rank.color}55;padding:2px 9px;border-radius:20px;">${rank.icon} ${rank.name.toUpperCase()}</span>
      </div>
      <!-- Balance pill -->
      <div style="margin-top:10px;background:rgba(0,0,0,.35);border:1.5px solid rgba(124,77,232,.3);border-radius:12px;padding:8px 20px;display:flex;align-items:center;gap:8px;">
        <svg viewBox="0 0 28 28" fill="none" width="18" height="18"><polygon points="25,14 19.5,23.5 8.5,23.5 3,14 8.5,4.5 19.5,4.5" fill="#7c4de8"/><polygon points="14,8.5 19.5,14 14,19.5 8.5,14" fill="white" opacity="0.9"/></svg>
        <span style="font-size:1.2rem;font-weight:900;color:#fff;">${fmtPSG(bal)}</span>
      </div>
    </div>
    <!-- Stats -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:14px 16px 0;">
      <div style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.15);border-radius:10px;padding:10px;text-align:center;">
        <div style="font-size:.55rem;color:rgba(148,163,184,.5);text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px;">Games</div>
        <div style="font-size:.92rem;font-weight:900;color:#fff;">${gc} played</div>
      </div>
      <div style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.15);border-radius:10px;padding:10px;text-align:center;">
        <div style="font-size:.55rem;color:rgba(148,163,184,.5);text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px;">Win Rate</div>
        <div style="font-size:.92rem;font-weight:900;color:#22c55e;">${wr}%</div>
      </div>
      <div style="background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:10px;text-align:center;">
        <div style="font-size:.55rem;color:rgba(148,163,184,.5);text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px;">Wagered</div>
        <div style="font-size:.88rem;font-weight:900;color:#fff;">${fmtPSG(prof.wagered||0)}</div>
      </div>
      <div style="background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:10px;text-align:center;">
        <div style="font-size:.55rem;color:rgba(148,163,184,.5);text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px;">Profit</div>
        <div style="font-size:.88rem;font-weight:900;color:${profit>=0?'#22c55e':'#ef4444'};">${profit>=0?'+':''}${fmtPSG(Math.abs(profit))}</div>
      </div>
    </div>
    <!-- Deposit / Withdraw -->
    <div style="display:flex;gap:8px;padding:12px 16px;">
      <button onclick="openDepositModal();document.getElementById('wallet-panel')?.remove()" style="flex:1;padding:10px;background:linear-gradient(135deg,#7c4de8,#6d28d9);border:none;border-radius:10px;color:#fff;font-size:.78rem;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 0 14px rgba(124,77,232,.35);">
        &#8595; Deposit
      </button>
      <button onclick="openWithdrawModal();document.getElementById('wallet-panel')?.remove()" style="flex:1;padding:10px;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.14);border-radius:10px;color:#fff;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;">
        &#8593; Withdraw${inv.length ? `<span style="background:#7c4de8;border-radius:20px;padding:1px 6px;font-size:.62rem;font-weight:900;">${inv.length}</span>` : ''}
      </button>
    </div>
    <!-- Inventory -->
    <div style="padding:0 16px 16px;">
      <div style="font-size:.55rem;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:rgba(148,163,184,.35);margin-bottom:8px;">YOUR INVENTORY <span style="color:#a78bfa;margin-left:5px;">${inv.length} items</span></div>
      ${inv.length
        ? `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">${invGrid}</div>`
        : `<div style="text-align:center;padding:20px 0;font-size:.75rem;color:rgba(255,255,255,.15);font-weight:700;">No items yet<br><span style="font-size:.65rem;">Deposit pets to start playing</span></div>`}
    </div>`;

  document.body.appendChild(panel);
  setTimeout(() => document.addEventListener('click', ev => {
    if (!panel.contains(ev.target)) panel.remove();
  }, { once:true }), 20);
}

function _refreshAuthButton() {
  const wrap = document.getElementById('auth-wrap');
  if (!wrap) return;
  const verified = _isVerified();
  const u = currentUser();
  if (verified && u.username) {
    const name = u.displayName || u.username;
    const ini = name.slice(0,1).toUpperCase();
    const isOwner = localStorage.getItem('ps99g_isAdmin') === '1';
    const avHtml = u.avatar
      ? `<img src="${u.avatar}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid rgba(124,77,232,.5);" onerror="this.outerHTML='<div style=\\'width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#7c4de8,#4c1d95);display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:900;border:2px solid rgba(124,77,232,.5)\\'>${ini}</div>'">`
      : `<div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#7c4de8,#4c1d95);display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:900;flex-shrink:0;border:2px solid rgba(124,77,232,.4);">${ini}</div>`;
    wrap.innerHTML = `
      <button class="auth-user-chip" onclick="_openUserDropdown(event)">
        ${avHtml}
        <span style="font-size:.75rem;font-weight:700;max-width:88px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}</span>
        ${isOwner ? '<span style="font-size:.85rem;line-height:1;filter:drop-shadow(0 0 6px gold);">[crown]</span>' : ''}
      </button>`;
  } else {
    wrap.innerHTML = `<button class="auth-login-btn" onclick="_openLoginModal()">Login</button>`;
  }
  const sbName = document.getElementById('sidebar-username');
  if (sbName) {
    if (verified && u.username) sbName.textContent = u.displayName || u.username;
    else sbName.textContent = '';
  }
}

function _openLoginModal() {
  if (document.getElementById('login-modal-overlay')) return;
  _injectLoginCSS();
  const phrase = _genPhrase();
  const el = document.createElement('div');
  el.id = 'login-modal-overlay';
  el.addEventListener('click', e => { if (e.target === el) _closeLoginModal(); });
  el.innerHTML = `
  <div id="login-modal-box">
    <div style="text-align:center;margin-bottom:20px;">
      <img src="logo.png" alt="99Depo" style="height:44px;object-fit:contain;display:block;margin:0 auto 10px;"
        onerror="this.outerHTML='<div style=&quot;font-size:1.3rem;font-weight:900;background:linear-gradient(90deg,#f472b6,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;&quot;>99DEPO</div>'">
      <div style="font-size:.72rem;color:rgba(148,163,184,.55);">Verify your Roblox account to play</div>
    </div>

    <div style="margin-bottom:12px;">
      <div style="font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:rgba(148,163,184,.45);margin-bottom:6px;">Your Roblox Username</div>
      <input id="login-username" type="text" placeholder="YourRobloxUsername" autocomplete="off" spellcheck="false"
        style="width:100%;padding:10px 13px;border-radius:10px;background:rgba(255,255,255,.05);border:1.5px solid rgba(124,77,232,.38);color:#fff;font-size:.92rem;outline:none;box-sizing:border-box;font-family:inherit;transition:border-color .15s;"
        onfocus="this.style.borderColor='rgba(167,139,250,.8)'"
        onblur="this.style.borderColor='rgba(124,77,232,.38)'"
        onkeydown="if(event.key==='Enter')_doLogin()">
    </div>

    <div style="margin-bottom:14px;">
      <div style="font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:rgba(148,163,184,.45);margin-bottom:6px;">Step 2  -  Paste this phrase in your Roblox bio</div>
      <div style="background:rgba(124,77,232,.1);border:1.5px solid rgba(124,77,232,.3);border-radius:10px;padding:10px 12px;display:flex;align-items:center;gap:8px;">
        <span id="login-phrase" style="font-family:monospace;font-size:.78rem;color:#c4b5fd;font-weight:700;flex:1;word-break:break-all;">${phrase}</span>
        <button onclick="_loginCopyPhrase()" style="padding:5px 10px;background:rgba(124,77,232,.25);border:1px solid rgba(124,77,232,.4);border-radius:7px;color:#a78bfa;font-size:.68rem;font-weight:800;cursor:pointer;white-space:nowrap;font-family:inherit;flex-shrink:0;">Copy</button>
      </div>
      <div style="font-size:.62rem;color:rgba(148,163,184,.45);margin-top:5px;line-height:1.45;">Open Roblox -> Edit Profile -> paste in bio -> come back here and click Verify.</div>
    </div>

    <label style="display:flex;align-items:flex-start;gap:8px;margin-bottom:14px;cursor:pointer;user-select:none;">
      <input type="checkbox" id="login-tos" style="width:14px;height:14px;accent-color:#7c4de8;flex-shrink:0;margin-top:2px;">
      <span style="font-size:.66rem;color:rgba(148,163,184,.55);line-height:1.45;">I am 18+ and agree to the Terms of Service. Entertainment only  -  not real gambling.</span>
    </label>

    <div id="login-error" style="font-size:.68rem;color:#f87171;text-align:center;min-height:16px;margin-bottom:8px;font-weight:700;"></div>

    <button onclick="_doLogin()" id="login-enter-btn"
      style="width:100%;padding:12px;border:none;border-radius:12px;background:linear-gradient(135deg,#7c4de8,#6d28d9);color:#fff;font-size:.88rem;font-weight:800;cursor:pointer;transition:all .15s;box-shadow:0 0 24px rgba(124,77,232,.45);letter-spacing:.02em;font-family:inherit;">
      Verify Account ->
    </button>
    <div style="text-align:center;margin-top:10px;">
      <button onclick="_closeLoginModal()" style="background:none;border:none;color:rgba(148,163,184,.35);font-size:.65rem;cursor:pointer;font-family:inherit;">Maybe later</button>
    </div>
  </div>`;
  document.body.appendChild(el);
  setTimeout(() => document.getElementById('login-username')?.focus(), 80);
}

function _loginCopyPhrase() {
  const phrase = document.getElementById('login-phrase')?.textContent;
  if (phrase) navigator.clipboard?.writeText(phrase).then(() => showToast('Phrase copied!', 'info')).catch(() => {});
}

function _closeLoginModal() {
  document.getElementById('login-modal-overlay')?.remove();
}

async function _doLogin() {
  const username = (document.getElementById('login-username')?.value || '').trim();
  const tos      = document.getElementById('login-tos')?.checked;
  const errEl    = document.getElementById('login-error');
  const btn      = document.getElementById('login-enter-btn');
  const phrase   = localStorage.getItem(_PHRASE_KEY);

  if (!username) { errEl.textContent = 'Enter your Roblox username'; return; }
  if (!tos)      { errEl.textContent = 'You must agree to the Terms of Service'; return; }
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) { errEl.textContent = 'Invalid username (3-20 letters, numbers, underscores)'; return; }
  if (!phrase)   { errEl.textContent = 'No phrase found  -  reload the page'; return; }

  btn.textContent = 'Verifying...'; btn.disabled = true; errEl.textContent = '';

  try {
    const resp = await fetch(_SERVER_HTTP + '/api/verify-bio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, phrase }),
    });
    const data = await resp.json();
    if (data.ok) {
      btn.textContent = 'Loading profile...';
      const avatarUrl = data.userId ? await _fetchRobloxAvatar(data.userId) : null;
      _finishLogin(data.displayName || username, data.userId || '', avatarUrl);
    } else {
      errEl.textContent = data.error || 'Phrase not found in bio  -  make sure you saved it correctly';
      btn.textContent = 'Verify Account ->'; btn.disabled = false;
    }
  } catch {
    errEl.textContent = 'Server offline  -  click Verify again to skip (dev mode)';
    if (btn.dataset.skip) {
      _finishLogin(username, '', null);
    } else {
      btn.dataset.skip = '1';
      btn.textContent = 'Verify Account ->'; btn.disabled = false;
    }
  }
}

function _finishLogin(displayName, userId, avatarUrl) {
  // Set all keys so both old and new login systems see the user as authenticated
  localStorage.setItem(_VERIFY_KEY, '1');
  localStorage.setItem('ps99g_rblx_verified', '1');
  localStorage.setItem('ps99g_rblx_user', displayName.toLowerCase());
  localStorage.setItem('ps99g_rblx_display', displayName);
  localStorage.setItem('ps99g_rblx_uid', userId || '');
  localStorage.setItem('ps99g_login_expiry', Date.now() + 7 * 24 * 60 * 60 * 1000);
  if (avatarUrl) localStorage.setItem('ps99g_rblx_avatar', avatarUrl);
  localStorage.removeItem(_PHRASE_KEY);
  const p = _getRawProfile(); p.name = displayName; _saveRawProfile(p);
  _closeLoginModal();
  _refreshAuthButton();
  _applyUserEverywhere();
  refreshBal();
  setTimeout(_connectWS, 100);
  _checkAdminStatus();
  showToast(`Welcome, ${displayName}! [party]`, 'win');
}

function _openUserDropdown(e) {
  e?.stopPropagation();
  const existing = document.getElementById('user-dropdown');
  if (existing) { existing.remove(); return; }
  _injectLoginCSS();
  const u = currentUser();
  const name = u.displayName || u.username || 'Player';
  const isOwner = localStorage.getItem('ps99g_isAdmin') === '1';
  const wrap = document.getElementById('auth-wrap');
  const rect = wrap?.getBoundingClientRect() || { bottom:60, right:window.innerWidth-20 };
  const menu = document.createElement('div');
  menu.id = 'user-dropdown';
  menu.style.top  = (rect.bottom + 6) + 'px';
  menu.style.right = (window.innerWidth - rect.right) + 'px';
  menu.innerHTML = `
    <div style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.07);">
      <div style="font-size:.85rem;font-weight:800;color:#fff;display:flex;align-items:center;gap:6px;">${name}${isOwner?' <span style="font-size:.9rem;filter:drop-shadow(0 0 5px gold)">[crown]</span>':''}</div>
      <div style="font-size:.62rem;color:rgba(148,163,184,.45);margin-top:2px;">${typeof fmtPSG==='function'?fmtPSG(getBalance()):'...'}</div>
    </div>
    <button onclick="openProfileModal('you',0);document.getElementById('user-dropdown')?.remove()">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><circle cx="8" cy="5.5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>
      My Profile
    </button>
    <button onclick="logoutAccount()">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M10 3h3v10h-3M6 11l4-4-4-4M1 8h8"/></svg>
      Log Out
    </button>`;
  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener('click', () => menu.remove(), { once:true }), 20);
}

function logoutAccount() {
  document.getElementById('user-dropdown')?.remove();
  ['ps99g_verified','ps99g_rblx_verified','ps99g_rblx_user','ps99g_rblx_display',
   'ps99g_rblx_uid','ps99g_rblx_avatar','ps99g_verify_phrase',
   'ps99g_isAdmin','ps99g_admin_name','ps99g_login_expiry'].forEach(k => localStorage.removeItem(k));
  _refreshAuthButton();
  showToast('Logged out', 'info');
  setTimeout(() => location.reload(), 600);
}

function initVerification() {
  _injectLoginCSS();
  setTimeout(_injectAuthButton, 200);
}

// Run inventory auto-fill after CV pets load
document.addEventListener('DOMContentLoaded', () => {
  function tryAutoFill() {
    if (typeof CV !== 'undefined' && CV.length) { _autoFillInventory(); }
    else setTimeout(tryAutoFill, 200);
  }
  setTimeout(tryAutoFill, 400);
});

/* -- QUICK BETS -- */
function setupQuickBets(inputId) {
  document.addEventListener('DOMContentLoaded', () => {
    const inp = document.getElementById(inputId);
    if (!inp) return;
    /* find the nearest ancestor that wraps both the input and a .bet-quick */
    let ancestor = inp.parentElement;
    let quickWrap = null;
    while (ancestor && !quickWrap) {
      quickWrap = ancestor.querySelector('.bet-quick');
      if (!quickWrap) ancestor = ancestor.parentElement;
    }
    if (!quickWrap) return;
    quickWrap.querySelectorAll('[data-val]').forEach(btn => {
      if (btn.onclick) return;
      btn.addEventListener('click', () => {
        const v = btn.dataset.val;
        const cur = parseInt(inp.value) || 0;
        const bal = getBalance();
        if (v === '2x')   inp.value = Math.min(cur * 2, bal);
        else if (v === '1/2') inp.value = Math.max(500000, Math.floor(cur / 2));
        else if (v === 'max') inp.value = bal;
        else inp.value = Math.min(parseInt(v), bal);
      });
    });
  });
}


