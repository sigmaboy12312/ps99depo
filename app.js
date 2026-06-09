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
    el.innerHTML = '';
    if (u.avatar) {
      const _av = document.createElement('img');
      _av.src = u.avatar;
      _av.style.cssText = 'width:20px;height:20px;border-radius:50%;object-fit:cover;margin-right:6px;vertical-align:middle;';
      el.appendChild(_av);
    }
    el.appendChild(document.createTextNode(u.displayName || u.username));
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
          if (typeof bd.balance === 'number') setBalance(Math.max(_bal, bd.balance));
          if (Array.isArray(bd.inventory) && bd.inventory.length)
            localStorage.setItem('ps99g_inv', JSON.stringify(bd.inventory));
        }
      } catch {}

      // Save display name into profile so profile modal shows real name
      try { const _p = _getRawProfile(); _p.name = d.displayName || username; _saveRawProfile(_p); } catch {}
      _connectWS();
      _applyUserEverywhere();
      refreshBal();
      _checkAdminStatus();

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
  const _sve = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  screen.innerHTML = `
    <div style="width:min(440px,100%);background:linear-gradient(160deg,#0d1f14,#09071a);
                border:1px solid rgba(34,197,94,.35);border-radius:24px;padding:40px 32px;text-align:center;
                box-shadow:0 0 60px rgba(34,197,94,.15),0 40px 80px rgba(0,0,0,.7);">
      ${avatarUrl ? `<img src="${_sve(avatarUrl)}" style="width:80px;height:80px;border-radius:50%;border:3px solid rgba(34,197,94,.6);box-shadow:0 0 24px rgba(34,197,94,.4);margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;">` : ''}
      <div style="font-size:1.3rem;font-weight:900;color:#fff;margin-bottom:6px;">Welcome, ${_sve(displayName)}!</div>
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
      if (d?.balance != null) { setBalance(Math.max(_bal, d.balance)); refreshBal(); }
      if (Array.isArray(d?.inventory) && d.inventory.length)
        localStorage.setItem('ps99g_inv', JSON.stringify(d.inventory));
    }).catch(() => {});
}


function _updateSidebarUsername() { _applyUserEverywhere(); }

document.addEventListener('DOMContentLoaded', () => {
  const expiry = localStorage.getItem('ps99g_login_expiry');
  if (expiry && Date.now() > parseInt(expiry, 10)) {
    ['ps99g_verified','ps99g_rblx_verified','ps99g_rblx_user','ps99g_rblx_display',
     'ps99g_rblx_uid','ps99g_rblx_avatar','ps99g_login_expiry',
     'ps99g_isAdmin','ps99g_admin_name','ps99g_phrase','ps99g_verify_phrase'].forEach(k => localStorage.removeItem(k));
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
  n = (n || 0) / 10000;
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
const _SERVER_OVERRIDE = '';

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
        const savedUser = localStorage.getItem('ps99g_rblx_user');
        if (savedUser) {
          _wsConn.send(JSON.stringify({ type: 'identify', username: savedUser }));
          // Push our local stats so other players can view our profile
          const _sp = myProfile();
          _wsConn.send(JSON.stringify({ type: 'profile_update',
            wagered: _sp.wagered||0, won: _sp.won||0, lost: _sp.lost||0,
            winCount: _sp.winCount||0, lossCount: _sp.lossCount||0,
            bestWin: _sp.bestWin||0, maxStreak: _sp.maxStreak||0, level: _sp.level||1,
            displayName: _sp.name || savedUser,
            avatar: localStorage.getItem('ps99g_rblx_avatar') || '' }));
        }

      } else if (msg.type === 'session_data') {
        // Server inventory is authoritative â€” always overwrite local
        if (Array.isArray(msg.inventory)) {
          try { localStorage.setItem('ps99g_inv', JSON.stringify(msg.inventory)); } catch {}
        }
        // Use max so initial load sets bal from inventory, but game wins aren't wiped on reconnect.
        _bal = Math.max(_bal, _invTotal());
        try { localStorage.setItem(BAL_KEY, _bal); } catch {}
        _updateNavInvBadge();
        refreshBal();

      } else if (msg.type === 'deposit_complete') {
        // Add only the delta so game-session wins are preserved
        if (typeof msg.newBalance === 'number') {
          const _depDelta = msg.newBalance - _invTotal();
          if (_depDelta > 0) addBal(_depDelta);
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
        if (!me.username || (msg.username || '').toLowerCase() !== me.username.toLowerCase()) _renderChatMsg(msg, false);

      } else if (msg.type === 'banned') {
        alert('You have been banned from 99Depo.');
        localStorage.clear(); location.href = '/home.html';

      } else if (msg.type === 'timed_out') {
        showToast(`You are timed out for ${msg.mins} minute${msg.mins!==1?'s':''}.`, 'info');

      } else if (msg.type === 'item_received') {
        showToast(`You received ${msg.item?.name} from the owner!`, 'win');
        if (msg.item) try {
          const inv = JSON.parse(localStorage.getItem('ps99g_inv') || '[]');
          inv.unshift(msg.item);
          localStorage.setItem('ps99g_inv', JSON.stringify(inv));
          addBal(msg.item.value || 0);
          _updateNavInvBadge();
        } catch {}

      } else if (msg.type === 'giveaway_start') {
        _renderChatMsg({ username: '__system', text: `ðŸŽ Giveaway started by ${msg.host || 'Owner'}: ${msg.item?.name || 'item'}! Type !enter in chat to join.`, isSystem: true }, false);

      } else if (msg.type === 'giveaway_count') {
        const el = document.getElementById('giveaway-entry-count');
        if (el) el.textContent = msg.count + ' entered';

      } else if (msg.type === 'giveaway_end') {
        if (msg.winner) {
          _renderChatMsg({ username: '__system', text: `&#127881; ${msg.winner} won the giveaway (${msg.item?.name || 'item'})!`, isSystem: true }, false);
          const me = currentUser();
          if (me.username && msg.winner === me.username) showToast(`You won the giveaway!`, 'win');
        } else {
          _renderChatMsg({ username: '__system', text: 'Giveaway ended with no entries.', isSystem: true }, false);
        }

      } else if (msg.type === 'tip_sent') {
        showToast(`Tip sent! (${fmtPSG(msg.total || 0)})`, 'win');
        if (Array.isArray(msg.inventory)) try { localStorage.setItem('ps99g_inv', JSON.stringify(msg.inventory)); } catch {}
        _bal = Math.max(0, _bal - (msg.total || 0)); try { localStorage.setItem(BAL_KEY, _bal); } catch {}
        _updateNavInvBadge(); refreshBal();

      } else if (msg.type === 'tip_received') {
        showToast(`You received a tip worth ${fmtPSG(msg.total || 0)}!`, 'win');
        if (Array.isArray(msg.inventory)) try { localStorage.setItem('ps99g_inv', JSON.stringify(msg.inventory)); } catch {}
        _bal += (msg.total || 0); try { localStorage.setItem(BAL_KEY, _bal); } catch {}
        _updateNavInvBadge(); refreshBal();

      } else if (msg.type === 'withdrawal_complete') {
        showToast('Withdrawal sent! Check your trade window.', 'info');

      } else if (msg.type === 'profile_data') {
        _handleProfileData(msg);

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
  document.querySelectorAll('[data-bal]').forEach(el => { el.textContent = fmtPSG(_bal); });
  _updateWalletDisplay();
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
  const _iconSpan = document.createElement('span'); _iconSpan.textContent = icons[type] || '*';
  const _msgSpan  = document.createElement('span'); _msgSpan.textContent = msg;
  t.appendChild(_iconSpan); t.appendChild(_msgSpan);
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3400);
}

/* -- PET VALUE SYSTEM -- All variant values pulled directly from cosmic/RAP index. */
function makePet(name, img, tier, color, n, g, r, sn, sg, sr) {
  return { name, img, tier, color, n:n||0, g:g||0, r:r||0, sn:sn||0, sg:sg||0, sr:sr||0 };
}

const VARIANTS = [
  { key: 'n',  label: 'Normal',        short: 'Normal',  color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  { key: 'g',  label: 'Golden',        short: 'Golden',  color: '#fbbf24', bg: 'rgba(251,191,36,0.1)'  },
  { key: 'r',  label: 'Rainbow',       short: 'Rainbow', color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
  { key: 'sn', label: 'Shiny',         short: 'Shiny',   color: '#38bdf8', bg: 'rgba(56,189,248,0.1)'  },
  { key: 'sg', label: 'Shiny Golden',  short: 'Sh.Gold', color: '#fb923c', bg: 'rgba(251,146,60,0.1)'  },
  { key: 'sr', label: 'Rainbow Shiny', short: 'Rb.Shiny',color: '#f472b6', bg: 'rgba(244,114,182,0.1)' },
];

const C = '#ff5c1a', T = '#fbbf24', H = '#ef4444'; // tier colors

/* -- RANK SYSTEM -- */
const RANKS = [
  { name:'Bronze',  min:0,       color:'#cd7f32', bg:'rgba(205,127,50,.15)',
    icon:`<svg viewBox="0 0 18 18" width="14" height="14"><circle cx="9" cy="9" r="8" fill="none" stroke="#cd7f32" stroke-width="1.1" opacity=".7"/><path d="M4.5 12.5L9 6L13.5 12.5" fill="none" stroke="#cd7f32" stroke-width="1.3" stroke-linejoin="round"/><path d="M7 11L9 6L11 11" fill="#cd7f32"/><path d="M9 6L9 4.5" stroke="#cd7f32" stroke-width="1.2"/><circle cx="9" cy="4" r="1" fill="#cd7f32"/></svg>` },
  { name:'Silver',  min:500e6,   color:'#cbd5e1', bg:'rgba(203,213,225,.12)',
    icon:`<svg viewBox="0 0 18 18" width="14" height="14"><circle cx="9" cy="9" r="8" fill="none" stroke="#cbd5e1" stroke-width="1.1" opacity=".7"/><path d="M4.5 12L9 5.5L13.5 12" fill="none" stroke="#cbd5e1" stroke-width="1.3" stroke-linejoin="round"/><path d="M6.8 10.5L9 5.5L11.2 10.5" fill="rgba(203,213,225,.45)"/><path d="M9 10.5L9 13.5" stroke="#cbd5e1" stroke-width="1.2"/><path d="M7 5.5L9 7.5L11 5.5" stroke="#cbd5e1" stroke-width=".8" fill="none"/></svg>` },
  { name:'Gold',    min:5e9,     color:'#fbbf24', bg:'rgba(251,191,36,.15)',
    icon:`<svg viewBox="0 0 18 18" width="14" height="14"><circle cx="9" cy="9" r="8" fill="none" stroke="#fbbf24" stroke-width="1.2" opacity=".8"/><path d="M4 12L9 4.5L14 12" fill="none" stroke="#fbbf24" stroke-width="1.4" stroke-linejoin="round"/><path d="M6.5 10L9 4.5L11.5 10Z" fill="#fbbf24"/><path d="M9 4.5L9 3" stroke="#fbbf24" stroke-width="1.3"/><circle cx="9" cy="2.5" r="1.2" fill="#fbbf24"/><path d="M6.5 10L4 12" stroke="#fbbf24" stroke-width="1.2"/><path d="M11.5 10L14 12" stroke="#fbbf24" stroke-width="1.2"/></svg>` },
  { name:'Platinum',min:50e9,    color:'#2dd4bf', bg:'rgba(45,212,191,.12)',
    icon:`<svg viewBox="0 0 18 18" width="14" height="14"><circle cx="9" cy="9" r="8" fill="none" stroke="#2dd4bf" stroke-width="1.2" opacity=".8"/><path d="M4 12.5L9 4L14 12.5" fill="none" stroke="#2dd4bf" stroke-width="1.3" stroke-linejoin="round"/><path d="M6 11L9 4L12 11L9 14.5Z" fill="rgba(45,212,191,.3)" stroke="#2dd4bf" stroke-width=".8" stroke-linejoin="round"/><path d="M7.2 9.5L9 4L10.8 9.5Z" fill="#2dd4bf"/></svg>` },
  { name:'Diamond', min:500e9,   color:'#818cf8', bg:'rgba(129,140,248,.15)',
    icon:`<svg viewBox="0 0 18 18" width="14" height="14"><circle cx="9" cy="9" r="8" fill="rgba(129,140,248,.06)" stroke="#818cf8" stroke-width="1.3" opacity=".9"/><path d="M9 2.5L14.5 8L9 15.5L3.5 8Z" fill="rgba(129,140,248,.25)" stroke="#818cf8" stroke-width=".9" stroke-linejoin="round"/><path d="M9 2.5L13 7.5L9 6.5L5 7.5Z" fill="#c7d2fe"/><path d="M5 7.5L9 6.5L13 7.5L9 15.5Z" fill="rgba(129,140,248,.6)"/><circle cx="9" cy="2.5" r=".8" fill="#e0e7ff"/></svg>` },
];

const _OWNER_RANK = {
  name: 'Owner',
  color: '#fbbf24',
  bg: 'rgba(245,158,11,.15)',
  icon: '&#128081;',
};

function getRank(wagered) {
  let r = RANKS[0];
  for (const rank of RANKS) { if (wagered >= rank.min) r = rank; }
  return r;
}

function getEffectiveRank(username, wagered) {
  if (username && username.toLowerCase() === _OWNER_USERNAME) return _OWNER_RANK;
  return getRank(wagered);
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
  return { name: p.name||'You', xp, level: Math.min(100, Math.max(1, Math.floor((1 + Math.sqrt(1 + 0.14*xp)) / 2))),
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
  _pushProfileToServer();
}
function recordLoss(amount) {
  const p = _getRawProfile();
  p.lost = (p.lost||0) + amount;
  p.xp = (p.xp||0) + 8;
  p.lossCount = (p.lossCount||0) + 1;
  p.streak = 0;
  _saveRawProfile(p);
  _pushProfileToServer();
}
function _pushProfileToServer() {
  try {
    if (typeof _wsConn === 'undefined' || !_wsConn || _wsConn.readyState !== WebSocket.OPEN) return;
    const sp = myProfile();
    _wsConn.send(JSON.stringify({ type: 'profile_update',
      wagered: sp.wagered||0, won: sp.won||0, lost: sp.lost||0,
      winCount: sp.winCount||0, lossCount: sp.lossCount||0,
      bestWin: sp.bestWin||0, maxStreak: sp.maxStreak||0, level: sp.level||1,
      displayName: sp.name || localStorage.getItem('ps99g_rblx_user') || '',
      avatar: localStorage.getItem('ps99g_rblx_avatar') || '' }));
  } catch {}
}

const CV = [
  /* -- GARGANTUAN -- (49 pets, real RAP from db.biggames.io) */
  makePet('Gargantuan Hippomelon', '133378666610902', 'Gargantuan', C, 900000000000, 0, 0, 0, 0, 0),
  makePet('Gargantuan Kaiju King', '122037254674435', 'Gargantuan', C, 421998720000, 0, 0, 0, 0, 0),
  makePet('Gargantuan Starfall Dragon', '106256354379795', 'Gargantuan', C, 407840960000, 0, 0, 0, 0, 0),
  makePet('Gargantuan Dot Matrix Pegasus', '133716042717345', 'Gargantuan', C, 335140226560, 0, 0, 0, 0, 0),
  makePet('Gargantuan Hellish Axolotl', '74041646461593', 'Gargantuan', C, 334625025763, 0, 0, 0, 0, 0),
  makePet('Gargantuan Exquisite Parrot', '112010823795135', 'Gargantuan', C, 296427988480, 0, 0, 0, 0, 0),
  makePet('Gargantuan Jurassic Dragon', '135125751282892', 'Gargantuan', C, 291871701513, 0, 0, 0, 0, 0),
  makePet('Gargantuan Patchwork Agony', '90326669323204', 'Gargantuan', C, 281239487022, 0, 0, 0, 0, 0),
  makePet('Gargantuan Googly Agony', '99540557591138', 'Gargantuan', C, 264965797375, 0, 0, 0, 0, 0),
  makePet('Gargantuan Yin-Yang Kitsune', '90918977215657', 'Gargantuan', C, 247378565761, 0, 0, 0, 0, 0),
  makePet('Gargantuan Dark Dragon', '100327262559787', 'Gargantuan', C, 225119473155, 0, 0, 0, 0, 0),
  makePet('Gargantuan Santa Paws', '85770840304413', 'Gargantuan', C, 222082603353, 0, 0, 0, 0, 0),
  makePet('Gargantuan Forest Wyvern', '120552464852825', 'Gargantuan', C, 216853438150, 506400000000, 0, 0, 0, 0),
  makePet('Gargantuan Aura Cat', '137518632763038', 'Gargantuan', C, 213889552864, 0, 0, 0, 0, 0),
  makePet('Gargantuan Floppa', '100320985111822', 'Gargantuan', C, 206105077430, 0, 0, 0, 0, 0),
  makePet('Gargantuan Matryoshka Bear', '96710812218566', 'Gargantuan', C, 205214259029, 0, 0, 0, 0, 0),
  makePet('Gargantuan Lucki Chest Mimic', '96210965239108', 'Gargantuan', C, 200000000000, 0, 0, 0, 0, 0),
  makePet('Gargantuan Wise Cat', '83925987845910', 'Gargantuan', C, 192765417513, 0, 0, 0, 0, 0),
  makePet('Gargantuan Frankenpup Dog', '73716913913195', 'Gargantuan', C, 194371588505, 0, 0, 0, 0, 0),
  makePet('Gargantuan Super Coral Kraken', '71123467327540', 'Gargantuan', C, 182299046528, 0, 0, 0, 0, 0),
  makePet('Gargantuan Special Ops Moth', '91565856235548', 'Gargantuan', C, 173750206417, 0, 0, 0, 0, 0),
  makePet('Gargantuan Grim Reaper', '108242446619492', 'Gargantuan', C, 175968489457, 0, 830000000000, 900000000000, 0, 0),
  makePet('Gargantuan Totem Monkey', '119822736449264', 'Gargantuan', C, 172417337549, 0, 0, 0, 0, 0),
  makePet('Gargantuan Dawn Phoenix', '77286983181517', 'Gargantuan', C, 166365565445, 0, 0, 0, 0, 0),
  makePet('Gargantuan Magma Spirit', '132074129972033', 'Gargantuan', C, 163267212755, 0, 0, 0, 0, 0),
  makePet('Gargantuan Bloom Dominus', '113165518550651', 'Gargantuan', C, 163744471303, 0, 0, 0, 0, 0),
  makePet('Gargantuan Leafy Deer', '93500762936904', 'Gargantuan', C, 162169588678, 0, 0, 0, 0, 0),
  makePet('Gargantuan Wicked Kirin', '97026907883242', 'Gargantuan', C, 158000000000, 0, 0, 0, 0, 0),
  makePet('Gargantuan Doge', '91301167582038', 'Gargantuan', C, 153906288029, 187999800000, 40000000000, 0, 0, 0),
  makePet('Gargantuan Glass Squid', '114884121622306', 'Gargantuan', C, 149456631501, 0, 0, 0, 0, 0),
  makePet('Gargantuan Lucki Angelus', '126822762417464', 'Gargantuan', C, 135656207634, 0, 0, 0, 0, 0),
  makePet('Gargantuan Skelemelon', '116658660548384', 'Gargantuan', C, 135094750069, 0, 1000000000000, 0, 0, 0),
  makePet('Gargantuan Blurred Agony', '72042454012987', 'Gargantuan', C, 134199570342, 0, 0, 0, 0, 0),
  makePet('Gargantuan Fluffy Cat', '122984499289928', 'Gargantuan', C, 127883409391, 0, 0, 0, 0, 0),
  makePet('Gargantuan Evil Scarecrow Pumpkin', '114300365192444', 'Gargantuan', C, 127471678366, 0, 0, 0, 0, 0),
  makePet('Gargantuan Cappuccino Brainrot', '126301320280051', 'Gargantuan', C, 124150248385, 0, 0, 0, 0, 0),
  makePet('Gargantuan Treasure Angelus', '100287069484548', 'Gargantuan', C, 123620082332, 0, 0, 0, 0, 0),
  makePet('Gargantuan Elf Golem', '83433844494349', 'Gargantuan', C, 122677322927, 100000000000, 0, 0, 0, 0),
  makePet('Gargantuan Gingerbread Angelus', '88769910454037', 'Gargantuan', C, 118851857413, 0, 0, 0, 0, 0),
  makePet('Gargantuan Snowflake Dragon', '118532711191840', 'Gargantuan', C, 118839287806, 0, 0, 0, 0, 0),
  makePet('Gargantuan Black Balloon Cat', '70419388027416', 'Gargantuan', C, 116230447155, 0, 0, 0, 0, 0),
  makePet('Gargantuan Leprechaun Fox', '82088505811077', 'Gargantuan', C, 115811608305, 0, 0, 0, 0, 0),
  makePet('Gargantuan Krampus', '128217268096438', 'Gargantuan', C, 115708344336, 125782343680, 0, 0, 0, 0),
  makePet('Gargantuan Nightfall Tiger', '106417356158790', 'Gargantuan', C, 113607835741, 0, 0, 0, 0, 0),
  makePet('Gargantuan Cookie Cut Cat', '124818572217039', 'Gargantuan', C, 111634232038, 0, 38000000000, 0, 0, 0),
  makePet('Gargantuan Super Cat', '128024931288917', 'Gargantuan', C, 111526458585, 0, 0, 0, 0, 0),
  makePet('Gargantuan Origami Kitsune', '116438972015691', 'Gargantuan', C, 126830518209, 0, 0, 0, 0, 0),
  makePet('Gargantuan Hypnotic Kitsune', '130525621588743', 'Gargantuan', C, 750000000000, 0, 0, 0, 0, 0),
  makePet('Gargantuan Royal Beast', '120268942762821', 'Gargantuan', C, 530000000000, 0, 0, 0, 0, 0),
  makePet('Gargantuan Nyan Cat', '102598468729073', 'Gargantuan', C, 50000000000, 0, 0, 0, 0, 0),

  /* -- TITANIC -- (real data from db.biggames.io, PSG = RAP/100) */
  makePet('Titanic Hippomelon', '14976631515', 'Titanic', T, 662127258835, 0, 0, 0, 0, 0),
  makePet('Titanic Pink Balloon', '14976657520', 'Titanic', T, 264713004561, 0, 0, 0, 0, 0),
  makePet('Titanic Luxe Axolotl', '75796665600934', 'Titanic', T, 163564772626, 0, 0, 0, 0, 0),
  makePet('Titanic Blueberry Cow', '17269862161', 'Titanic', T, 126624256801, 0, 0, 0, 0, 0),
  makePet('Titanic Nightmare Cat', '15260478604', 'Titanic', T, 118172422237, 0, 0, 0, 0, 0),
  makePet('Titanic Wild Corrupt Agony', '103464099228930', 'Titanic', T, 105723463444, 0, 0, 0, 0, 0),
  makePet('Titanic Dominus Darkwing', '76103751008934', 'Titanic', T, 104985490455, 195808922659, 0, 0, 0, 0),
  makePet('Titanic Corgi', '16125357082', 'Titanic', T, 12142513526, 0, 48400000000, 0, 0, 0),
  makePet('Titanic Cat', '14976594978', 'Titanic', T, 98159649299, 0, 0, 0, 0, 0),
  makePet('Titanic Ghostface Cat', '119318487422826', 'Titanic', T, 95464464847, 0, 0, 0, 0, 0),
  makePet('Titanic Blobfish', '14976589636', 'Titanic', T, 92082165848, 0, 0, 0, 0, 0),
  makePet('Titanic Sad Cat', '14976666952', 'Titanic', T, 83698623551, 0, 0, 0, 0, 0),
  makePet('Titanic Arcane Pyro Cat', '18978058000', 'Titanic', T, 66787307517, 33573409191, 219598110409, 41839232000, 49646336000, 0),
  makePet('Titanic Atlantean Jellyfish', '14976584980', 'Titanic', T, 63850084793, 0, 0, 0, 0, 0),
  makePet('Titanic Black Hole Angelus', '17285296068', 'Titanic', T, 62815023140, 0, 100000000000, 161568089190, 0, 0),
  makePet('Titanic Neon Agony', '14976647939', 'Titanic', T, 62232072534, 0, 0, 0, 0, 0),
  makePet('Titanic SpongeBob SquarePants', '18313091924', 'Titanic', T, 62529437018, 0, 0, 0, 0, 0),
  makePet('Titanic Poseidon Axolotl', '80369065406332', 'Titanic', T, 52473981771, 0, 0, 0, 0, 0),
  makePet('Titanic Arcane Cat', '18882936169', 'Titanic', T, 52628271633, 31994536196, 74928961161, 213843600755, 53607051910, 118600000000),
  makePet('Titanic Jelly Dragon', '16483343520', 'Titanic', T, 50839591217, 0, 838720000000, 0, 0, 0),
  makePet('Titanic Jelly Cat', '14976635882', 'Titanic', T, 49446377226, 0, 0, 177934796800, 0, 0),
  makePet('Titanic Starry Owl', '90300371601451', 'Titanic', T, 47125833888, 0, 0, 0, 0, 0),
  makePet('Titanic Jolly Cat', '17787600314', 'Titanic', T, 43764516889, 0, 0, 0, 0, 0),
  makePet('Titanic Cartoon Cat', '96042514794947', 'Titanic', T, 40611920613, 0, 0, 0, 0, 0),
  makePet('Titanic Lovemelon', '16306754796', 'Titanic', T, 41105738686, 0, 0, 0, 0, 0),
  makePet('Titanic Kawaii Cat', '16393812743', 'Titanic', T, 40657500183, 0, 195000000000, 0, 0, 0),
  makePet('Titanic Angel Cow', '92969844303384', 'Titanic', T, 36386444285, 0, 0, 0, 0, 0),
  makePet('Titanic Abstract Dominus', '111308527700884', 'Titanic', T, 39989999900, 0, 0, 0, 0, 0),
  makePet('Titanic Silver Dragon', '15687351099', 'Titanic', T, 39002530297, 0, 0, 0, 0, 0),
  makePet('Titanic Balloon Monkey', '14976586764', 'Titanic', T, 37753634737, 0, 0, 16128000000, 0, 0),
  makePet('Titanic Bat Cat', '16746763420', 'Titanic', T, 37703463279, 0, 567607680000, 63923840000, 0, 0),
  makePet('Titanic Silver Stag', '139456404804245', 'Titanic', T, 37777017709, 0, 0, 0, 0, 0),
  makePet('Titanic Valkyrie Pegasus', '18465212052', 'Titanic', T, 36701809984, 0, 0, 535003200000, 0, 0),
  makePet('Titanic Cosmic Pegasus', '15201628877', 'Titanic', T, 35763204240, 0, 36519488000, 0, 0, 0),
  makePet('Titanic Clover Owl', '94606595966896', 'Titanic', T, 35430939412, 0, 0, 0, 0, 0),
  makePet('Titanic Sketch Cat', '17027114400', 'Titanic', T, 36530762600, 0, 0, 0, 0, 0),
  makePet('Titanic Hubert', '14976633736', 'Titanic', T, 37122793278, 0, 0, 95473190400, 0, 0),
  makePet('Titanic Sun Angelus', '128663320518794', 'Titanic', T, 33501072092, 0, 0, 0, 0, 0),
  makePet('Titanic Red Balloon Cat', '14976586155', 'Titanic', T, 32268751159, 0, 96000000000, 0, 0, 0),
  makePet('Titanic Blue Balloon Cat', '14976589786', 'Titanic', T, 31309628297, 0, 0, 0, 0, 0),
  makePet('Titanic Strawberry Cow', '14976827001', 'Titanic', T, 31213197997, 0, 116320000000, 0, 0, 0),
  makePet('Titanic Blazing Dragon', '17749522423', 'Titanic', T, 29942999328, 0, 0, 0, 0, 0),
  makePet('Titanic Mystic Corgi', '14976647316', 'Titanic', T, 28613788698, 0, 0, 0, 0, 0),
  makePet('Titanic Bread Shiba', '16393819211', 'Titanic', T, 27788119112, 0, 0, 0, 0, 0),
  makePet('Titanic Spectral Deer', '131625375967545', 'Titanic', T, 26751798814, 35040000000, 0, 0, 0, 0),
  makePet('Titanic Firegel Dragon', '84658799668641', 'Titanic', T, 27580034972, 21098747873, 0, 0, 0, 0),
  makePet('Titanic Hologram Cat', '14976631845', 'Titanic', T, 27084994750, 0, 0, 0, 0, 0),
  makePet('Titanic Stargazing Bull', '17602420874', 'Titanic', T, 27229533311, 0, 0, 0, 0, 0),
  makePet('Titanic Dominus Astra', '14976605624', 'Titanic', T, 25388691227, 0, 0, 0, 0, 0),
  makePet('Titanic Fire Dragon', '15163496528', 'Titanic', T, 25109552499, 0, 0, 0, 0, 0),
  makePet('Titanic Emoji Corgi', '16047477969', 'Titanic', T, 25324825590, 0, 0, 0, 0, 0),
  makePet('Titanic Soul Owl', '125310152380772', 'Titanic', T, 25002639315, 0, 0, 0, 0, 0),
  makePet('Titanic Midnight Lion', '87889546587335', 'Titanic', T, 24734022541, 0, 0, 0, 0, 0),
  makePet('Titanic Angry Yeti', '118155614090525', 'Titanic', T, 23248190594, 170363737600, 0, 0, 0, 0),
  makePet('Titanic Wild Frost Agony', '116274982839546', 'Titanic', T, 23078419174, 27051110868, 76080000000, 0, 0, 0),
  makePet('Titanic Pop Cat', '107955973846092', 'Titanic', T, 22114878419, 0, 108098419200, 45488546193, 0, 0),
  makePet('Titanic Nightfall Pegasus', '18640616333', 'Titanic', T, 22626952028, 0, 0, 0, 0, 0),
  makePet('Titanic Pumpkin Cat', '111326774282264', 'Titanic', T, 22289397666, 16632609068, 32136800051, 0, 0, 0),
  makePet('Titanic Yin-Yang Grim Reaper', '136807974742699', 'Titanic', T, 22336123270, 0, 443024588800, 500000000000, 0, 0),
  makePet('Titanic Pixel M-2 PROTOTYPE', '78274935877224', 'Titanic', T, 21873372913, 0, 0, 0, 0, 0),
  makePet('Titanic Starfall Dragon', '70374143407469', 'Titanic', T, 21717751428, 14678584917, 0, 190000000000, 190000000000, 0),
  makePet('Titanic Capybara', '14976593327', 'Titanic', T, 21293136664, 0, 0, 90287148728, 0, 0),
  makePet('Titanic Vampire Agony', '120127746226502', 'Titanic', T, 20134167548, 16406790758, 0, 0, 0, 0),
  makePet('Titanic M-14 PROTOTYPE', '99810281877777', 'Titanic', T, 20385629623, 0, 67815062891, 0, 0, 0),
  makePet('Titanic Valentines Cat', '16234782048', 'Titanic', T, 21548172796, 0, 0, 0, 0, 0),
  makePet('Titanic Dot Matrix Kitsune', '101711904618223', 'Titanic', T, 20950687468, 0, 0, 0, 0, 0),
  makePet('Titanic Snow Globe Cat', '101380058502586', 'Titanic', T, 19951686293, 0, 294968227205, 30680000000, 0, 0),
  makePet('Titanic Nightmare Corgi', '137580301485992', 'Titanic', T, 19635849512, 0, 0, 0, 0, 0),
  makePet('Titanic Tiedye Dragon', '15547792197', 'Titanic', T, 19583131203, 0, 0, 0, 0, 0),
  makePet('Titanic Love Lamb', '16234774596', 'Titanic', T, 19719018843, 0, 88723202210, 72186918195, 0, 0),
  makePet('Titanic Lucki', '14976642572', 'Titanic', T, 19807055330, 0, 0, 0, 0, 0),
  makePet('Titanic Tiedye Cat', '15547792344', 'Titanic', T, 19279443455, 0, 0, 0, 0, 0),
  makePet('Titanic Bejeweled Griffin', '17450302814', 'Titanic', T, 19083561834, 0, 0, 0, 0, 0),
  makePet('Titanic Nightfall Wolf', '16394133066', 'Titanic', T, 18693674711, 0, 0, 0, 0, 0),
  makePet('Titanic Signature BIG Maskot', '87601095664895', 'Titanic', T, 18669614057, 17949973360, 0, 0, 0, 0),
  makePet('Titanic Kaiju Moth', '119404602163936', 'Titanic', T, 18608581242, 0, 92633152000, 95120000000, 0, 0),
  makePet('Titanic Banana Cat', '15644507059', 'Titanic', T, 18379736112, 0, 0, 0, 0, 0),
  makePet('Titanic Flex Cat', '18151232769', 'Titanic', T, 18310554616, 0, 0, 401154047590, 0, 0),
  makePet('Titanic Chad Gorilla', '101924214050321', 'Titanic', T, 18100727559, 0, 0, 201920000000, 0, 0),
  makePet('Titanic Samurai Dragon', '125481811562940', 'Titanic', T, 18075915907, 0, 207860000000, 0, 0, 0),
  makePet('Titanic Rich Cat', '17194508969', 'Titanic', T, 18007060246, 29123310429, 0, 0, 0, 0),
  makePet('Titanic Shadow Griffin', '14976670848', 'Titanic', T, 17417582313, 0, 0, 0, 0, 0),
  makePet('Titanic Butterfly', '17821211666', 'Titanic', T, 17781866502, 21162951837, 0, 56816000000, 0, 0),
  makePet('Titanic Buff Tiger', '71901668649846', 'Titanic', T, 17677820876, 0, 0, 0, 0, 0),
  makePet('Titanic Inferno Dominus', '133194662787359', 'Titanic', T, 17265587382, 0, 0, 0, 0, 0),
  makePet('Titanic Party Tiger', '82287378572114', 'Titanic', T, 11367696020, 0, 0, 0, 0, 0),
  makePet('Titanic Luchador Cat', '105152814776651', 'Titanic', T, 16668742321, 0, 34770198784, 103841119800, 0, 0),
  makePet('Titanic Fossil Dragon', '107708637818615', 'Titanic', T, 16533153490, 0, 0, 196992000000, 0, 0),
  makePet('Titanic Ancient Dragon', '83209252945464', 'Titanic', T, 16610737115, 0, 0, 0, 0, 0),
  makePet('Titanic Kitsune Fox', '18352469980', 'Titanic', T, 16562371135, 12825727327, 0, 0, 0, 0),
  makePet('Titanic Wicked Angelus', '139550015983813', 'Titanic', T, 16723429374, 0, 0, 0, 0, 0),
  makePet('Titanic Classic Cat', '18883420114', 'Titanic', T, 15693434013, 0, 0, 0, 0, 0),
  makePet('Titanic Super Corgi', '83701890267359', 'Titanic', T, 15634372231, 135871192048, 0, 0, 0, 0),
  makePet('Titanic Googly Blobfish', '110994339382883', 'Titanic', T, 15564383873, 0, 0, 0, 0, 0),
  makePet('Titanic Giraffe', '82353035401807', 'Titanic', T, 15412480587, 0, 0, 0, 0, 0),
  makePet('Titanic Electric Werewolf', '76655518621406', 'Titanic', T, 15352573160, 0, 0, 0, 0, 0),
  makePet('Titanic Witch Wolf', '74523750699706', 'Titanic', T, 15203668680, 0, 0, 0, 0, 0),
  makePet('Titanic Party Crown Hippomelon', '119580032207661', 'Titanic', T, 14057493999, 14984439820, 0, 0, 0, 0),
  makePet('Titanic Warrior Beast', '131949076812775', 'Titanic', T, 14800098678, 0, 123064640000, 297000000000, 0, 0),
  makePet('Titanic Sock Cat', '16393837325', 'Titanic', T, 14780611537, 0, 0, 0, 0, 0),
  makePet('Titanic Diamond Dog', '95245493036006', 'Titanic', T, 14667729845, 0, 0, 0, 0, 0),
  makePet('Titanic Hypnotic Monkey', '85590653495391', 'Titanic', T, 14703989238, 0, 59264128000, 0, 0, 0),
  makePet('Titanic Dragonfruit Dragon', '17269789414', 'Titanic', T, 14464968364, 0, 36008000000, 61770880000, 0, 0),
  makePet('Titanic Patchwork Capybara', '94494477823308', 'Titanic', T, 14169262906, 0, 65141540733, 154771818240, 0, 0),
  makePet('Titanic Jelly Kitsune', '80481264507529', 'Titanic', T, 14177106482, 12062653147, 73188805813, 193779200000, 0, 0),
  makePet('Titanic Dino Cat', '14976604955', 'Titanic', T, 14132727328, 0, 34159408333, 0, 0, 0),
  makePet('Titanic Scary Corgi', '14976669980', 'Titanic', T, 13885953785, 0, 0, 220225280000, 0, 0),
  makePet('Titanic Stunt Cat', '128964854488748', 'Titanic', T, 13845702877, 12312558004, 36564799999, 0, 0, 0),
  makePet('Titanic Wild Fire Agony', '80761300754593', 'Titanic', T, 14055014372, 0, 0, 0, 0, 0),
  makePet('Titanic Empyrean Owl', '104879205036593', 'Titanic', T, 13675080185, 0, 0, 0, 0, 0),
  makePet('Titanic Holiday Owl', '116557921050130', 'Titanic', T, 13543603194, 15391575580, 155143200000, 110000000000, 0, 0),
  makePet('Titanic Pink Kitsune Fox', '81549697873082', 'Titanic', T, 13462945719, 0, 0, 34242794240, 0, 0),
  makePet('Titanic Gamer Shiba', '119206417994536', 'Titanic', T, 13563514709, 0, 0, 0, 0, 0),
  makePet('Titanic Party Cat', '16901676187', 'Titanic', T, 13512407401, 15334417268, 39619200000, 0, 0, 0),
  makePet('Titanic Calico Cat', '89706854037994', 'Titanic', T, 13461954050, 0, 0, 23174712320, 0, 0),
  makePet('Titanic Aura Kitsune', '80758347451953', 'Titanic', T, 13670330356, 0, 39217972102, 57382848000, 0, 0),
  makePet('Titanic Sock Monkey', '16393836771', 'Titanic', T, 13172797318, 0, 80000000000, 0, 0, 0),
  makePet('Titanic Snowflake Angelus', '72623839017294', 'Titanic', T, 12782283567, 0, 37168729027, 70492487107, 0, 0),
  makePet('Titanic Party Panda', '74514642411800', 'Titanic', T, 13133928930, 26464101072, 60000000000, 0, 0, 0),
  makePet('Titanic Lucky Cat', '74474705951113', 'Titanic', T, 12349558160, 0, 0, 0, 0, 0),
  makePet('Titanic Mosaic Cat', '121979531633033', 'Titanic', T, 12875689156, 13808291894, 44520000000, 0, 0, 0),
  makePet('Titanic Love Corgi', '124293758484647', 'Titanic', T, 13114244770, 13386768982, 28115386002, 0, 0, 0),
  makePet('Titanic Orange Axolotl', '17269848594', 'Titanic', T, 12780125743, 0, 0, 0, 0, 0),
  makePet('Titanic DJ Shark', '111270922153333', 'Titanic', T, 12572264176, 0, 0, 0, 0, 0),
  makePet('Titanic Red Panda', '15842479817', 'Titanic', T, 12609567785, 0, 25000000000, 0, 0, 0),
  makePet('Titanic Shiba', '16393850015', 'Titanic', T, 12647570480, 0, 0, 0, 0, 0),
  makePet('Titanic Matryoshka Cat', '113135543154400', 'Titanic', T, 12377402962, 0, 42466187837, 59680000000, 0, 0),
  makePet('Titanic Bobcat', '93912731395332', 'Titanic', T, 12019774344, 19572333106, 97960000000, 0, 0, 0),
  makePet('Titanic Obsidian Dragon', '98113510502520', 'Titanic', T, 12153042678, 8511255635, 22086651952, 147800000000, 0, 0),
  makePet('Titanic Strawberry Corgi', '17269911360', 'Titanic', T, 12097679568, 0, 51638080000, 29061225489, 0, 0),
  makePet('Titanic Nyan Cat', '102693200913432', 'Titanic', T, 11993238002, 8136468902, 27096812892, 0, 0, 0),
  makePet('Titanic Frontman Jellyfish', '91877971354703', 'Titanic', T, 11943503631, 8997931537, 25594449117, 0, 0, 0),
  makePet('Titanic Monkey', '15842479997', 'Titanic', T, 11766566865, 0, 0, 471920652698, 0, 0),
  makePet('Titanic Koi Fish', '86724162375646', 'Titanic', T, 11619874571, 0, 64000000000, 32896857805, 0, 0),
  makePet('Titanic Wood Spirit', '125083583849659', 'Titanic', T, 11428990844, 0, 32307052384, 326881837327, 0, 0),
  makePet('Titanic Parrot', '81714067299017', 'Titanic', T, 11518716945, 17018875813, 0, 0, 0, 0),
  makePet('Titanic Axolotl', '14976585715', 'Titanic', T, 11371953403, 0, 26197824000, 143788849227, 0, 0),
  makePet('Titanic Gingerbread Dragon', '110203202746890', 'Titanic', T, 11167639712, 0, 30719645357, 25529799317, 0, 0),
  makePet('Titanic Super Coral Stingray', '78134385272600', 'Titanic', T, 11225516607, 0, 66368000000, 0, 0, 0),
  makePet('Titanic Black Hole Angelus Ball', '113303682260217', 'Titanic', T, 11144038928, 0, 321868604160, 135283003677, 0, 0),
  makePet('Titanic Snowflake Dominus', '71393734598151', 'Titanic', T, 11051593554, 10921738519, 68728320000, 0, 0, 0),
  makePet('Titanic Jurassic Feline', '129218443079434', 'Titanic', T, 10706432569, 0, 48659042304, 26971328000, 0, 0),
  makePet('Titanic Guard Dominus', '100676807930076', 'Titanic', T, 10743936909, 8848504119, 69335872000, 27607593486, 0, 0),
  makePet('Titanic Dolphin', '17269957040', 'Titanic', T, 10575032050, 0, 23584000000, 80654353920, 0, 0),
  makePet('Titanic Cupcake Pegasus', '78403514636510', 'Titanic', T, 10555078511, 8816082079, 323700403200, 0, 0, 0),
  makePet('Titanic Arcane Halo Cat', '94452581960646', 'Titanic', T, 7503065580, 11042400234, 40299447390, 0, 0, 0),
  makePet('Titanic Nightmare Sludge', '92769377018385', 'Titanic', T, 10468246601, 0, 44550066466, 0, 0, 0),
  makePet('Titanic Grinch Cat', '105600589075929', 'Titanic', T, 10554704391, 8397911038, 35996195440, 0, 0, 0),
  makePet('Titanic Crocodilo Brainrot', '134789752916568', 'Titanic', T, 10328859767, 0, 22760399500, 28602486956, 0, 0),
  makePet('Titanic Reindeer', '15581758974', 'Titanic', T, 10339840984, 0, 0, 0, 0, 0),
  makePet('Titanic Cheerful Yeti', '14976595593', 'Titanic', T, 10241358582, 0, 72934560000, 60296000000, 0, 0),
  makePet('Titanic Propeller Cat', '73254502740127', 'Titanic', T, 10192899718, 0, 0, 0, 0, 0),
  makePet('Titanic Fawn', '14976619071', 'Titanic', T, 10260414165, 0, 48025600000, 0, 0, 0),
  makePet('Titanic Gingerbread Cat', '123881708128597', 'Titanic', T, 10073774655, 0, 22610224050, 23744035109, 0, 0),
  makePet('Titanic Noob', '101954252153126', 'Titanic', T, 10761090217, 14382122762, 51027456000, 0, 0, 0),
  makePet('Titanic Pineapple Cat', '17269938973', 'Titanic', T, 9892686922, 0, 0, 25689307238, 0, 0),
  makePet('Titanic Totem Owl', '113883294151672', 'Titanic', T, 9838770777, 0, 110473600000, 0, 0, 0),
  makePet('Titanic Arcane Void Cat', '77026614501642', 'Titanic', T, 8731601417, 11295232732, 37208679544, 0, 0, 0),
  makePet('Titanic Blobenstein', '133816643880772', 'Titanic', T, 9511289497, 9253580335, 22025645378, 6039994880, 0, 0),
  makePet('Titanic Valentines Axolotl', '123399141850216', 'Titanic', T, 9330236039, 0, 0, 0, 0, 0),
  makePet('Titanic Glass Blobfish', '95794427114818', 'Titanic', T, 8891775045, 0, 43607084185, 0, 0, 0),
  makePet('Titanic Wishing Dragon', '133278674561506', 'Titanic', T, 9064763895, 0, 44752718236, 0, 0, 0),
  makePet('Titanic Scroll Dragon', '118843935500036', 'Titanic', T, 8528598398, 12215006166, 0, 0, 0, 0),
  makePet('Titanic Leprechaun Kitsune', '119959214731762', 'Titanic', T, 8729337705, 8532949566, 35308645627, 0, 0, 0),
  makePet('Titanic Leafy Seahorse', '116393400860813', 'Titanic', T, 8684619921, 9389375261, 62481088000, 0, 0, 0),
  makePet('Titanic Chest Mimic', '121868378193136', 'Titanic', T, 8629131517, 7564654681, 24541539980, 94574425600, 0, 0),
  makePet('Titanic Gingerbread Corgi', '14976625491', 'Titanic', T, 8576595203, 0, 24467023442, 0, 0, 0),
  makePet('Titanic Doll Cat', '93143962349458', 'Titanic', T, 8559921853, 10801670545, 0, 164824000000, 66520000000, 0),
  makePet('Titanic Mechanical Griffin', '139823159544156', 'Titanic', T, 8421476320, 0, 0, 0, 0, 0),
  makePet('Titanic Dark Fox', '110119044336998', 'Titanic', T, 8487051794, 7254713062, 27564702448, 15000000000, 0, 15000000000),
  makePet('Titanic Abyss Carbuncle', '121024391063626', 'Titanic', T, 8299404881, 7031390113, 22289196353, 49824000000, 0, 0),
  makePet('Titanic Loveserker', '134671434987896', 'Titanic', T, 8358670305, 7622716621, 21190657665, 0, 0, 0),
  makePet('Titanic Reindeer Cat', '119319411340325', 'Titanic', T, 8231150402, 7298165947, 23675295499, 35000000000, 150000000000, 0),
  makePet('Titanic Autumn Teddy Bear', '102130006064216', 'Titanic', T, 8204281508, 6902059519, 19116765721, 0, 0, 0),
  makePet('Titanic Clover Butterfly', '131125477985744', 'Titanic', T, 8134004508, 0, 33521440000, 29360000000, 0, 0),
  makePet('Titanic Lucki Angelus', '140159437559092', 'Titanic', T, 8075851878, 7788094104, 28930036950, 85400000000, 0, 0),
  makePet('Titanic Pixel Angelus', '103752775543007', 'Titanic', T, 7939528855, 7639925016, 26542453136, 209160000000, 0, 0),
  makePet('Titanic Icy Phoenix', '119756929621348', 'Titanic', T, 8007318863, 8384872583, 25093360571, 0, 0, 0),
  makePet('Titanic Easter Cat', '122516564229104', 'Titanic', T, 7752891920, 9040767073, 31018651605, 0, 0, 0),
  makePet('Titanic Sun Griffin', '131108865732967', 'Titanic', T, 7779976593, 13404796985, 37654209470, 0, 0, 0),
  makePet('Titanic Jelly Wizard', '125800512820483', 'Titanic', T, 7809492738, 0, 36037920000, 0, 0, 0),
  makePet('Titanic Origami Crane', '77309638284981', 'Titanic', T, 7455873438, 0, 0, 0, 0, 0),
  makePet('Titanic Disco Ball Agony', '79337032741269', 'Titanic', T, 7705276097, 7687349517, 20942011582, 62705148948, 0, 0),
  makePet('Titanic Easter Golem', '109664286681118', 'Titanic', T, 7706612750, 0, 50124736000, 498400000000, 0, 1000000000000),
  makePet('Titanic Kraken', '82337742221537', 'Titanic', T, 7717340393, 7854436653, 49492839070, 0, 0, 0),
  makePet('Titanic Party Corgi', '122915996316714', 'Titanic', T, 7650857729, 8299438718, 22372708069, 0, 0, 0),
  makePet('Titanic Keyboard Cat', '138627945084194', 'Titanic', T, 7674108647, 8134060937, 89344773298, 35000291130, 0, 0),
  makePet('Titanic Beach Ball Capybara', '75537750566110', 'Titanic', T, 7478107425, 6621864572, 18869156040, 0, 0, 0),
  makePet('Titanic Pixel Agony', '79227180725829', 'Titanic', T, 7522789709, 7083647743, 25345300820, 0, 0, 0),
  makePet('Titanic Captain Octopus', '108839170452682', 'Titanic', T, 7526386857, 18968064000, 0, 167115425349, 120584000000, 306894937600),
  makePet('Titanic Party Crown Corgi', '127025398818263', 'Titanic', T, 7489187277, 7600991912, 31339872000, 0, 0, 0),
  makePet('Titanic Brain Ball', '85082755103963', 'Titanic', T, 7448558656, 7524169149, 21415553938, 0, 0, 0),
  makePet('Titanic Holographic Axolotl Ball', '113783111337082', 'Titanic', T, 7401874971, 5142446041, 52377383834, 53200000000, 0, 0),
  makePet('Titanic Pixel Monkey', '109746451259530', 'Titanic', T, 7199806408, 7089158625, 233438679593, 0, 0, 0),
  makePet('Titanic Inferno Cat', '128197933261486', 'Titanic', T, 6306951957, 9847671624, 37587068437, 0, 0, 0),
  makePet('Titanic Gingerbread Angelus', '135459719245097', 'Titanic', T, 7030230044, 7494182409, 22223254865, 24272000000, 75000000000, 0),
  makePet('Titanic Nutcracker Squirrel', '72074096332299', 'Titanic', T, 7104536823, 0, 0, 28747526400, 0, 0),
  makePet('Titanic Gym Cat', '116586359126755', 'Titanic', T, 7104468875, 0, 96784939780, 79525120000, 0, 0),
  makePet('Titanic Gym Dragon', '91679016973225', 'Titanic', T, 6973811891, 0, 28619638499, 20272971188, 0, 0),
  makePet('Titanic Gym Axolotl', '105883777354766', 'Titanic', T, 6955409872, 6115129338, 49260954112, 0, 0, 0),
  makePet('Titanic Guilded Raven', '133529343440925', 'Titanic', T, 6758649384, 6956909665, 18428741893, 19269494102, 15000000000, 0),
  makePet('Titanic Super Wolf', '114045876201670', 'Titanic', T, 6887361279, 0, 24645719927, 23587223681, 0, 0),
  makePet('Titanic Lucki Golem', '136718232635599', 'Titanic', T, 6789246286, 0, 26731940312, 0, 0, 0),
  makePet('Titanic Candycane Kitsune', '100308163043577', 'Titanic', T, 6765712145, 0, 0, 0, 0, 0),
  makePet('Titanic Yee-haw Cat', '111695166466582', 'Titanic', T, 6687412308, 7014208944, 20188162535, 82224332564, 43960000000, 0),
  makePet('Titanic Anime Cat', '139657034071879', 'Titanic', T, 6638970255, 0, 22934694333, 20347008109, 0, 0),
  makePet('Titanic Pilgrim Turkey', '126580879775166', 'Titanic', T, 6606472146, 6633159745, 16380151902, 0, 0, 0),
  makePet('Titanic Diamond Bunny', '118509963937429', 'Titanic', T, 6513107217, 9466989828, 27352530654, 0, 0, 0),
  makePet('Titanic Treasure Mimic', '101381725674777', 'Titanic', T, 6523009150, 0, 24349786011, 70164307623, 0, 0),
  makePet('Titanic Special Ops Goat', '113002170903758', 'Titanic', T, 6504129521, 0, 23115781805, 0, 0, 0),
  makePet('Titanic Gym Piggy', '83418426138856', 'Titanic', T, 6669960914, 7267046791, 34447165027, 182200160000, 0, 0),
  makePet('Titanic Teacher Cat', '104387672853610', 'Titanic', T, 6544814312, 9027753346, 23743197624, 0, 0, 0),
  makePet('Titanic Hydra Axolotl', '116530316117361', 'Titanic', T, 6520643137, 6452724098, 17765756899, 17134723649, 0, 0),
  makePet('Titanic Comet Cyclops Ball', '83088944433726', 'Titanic', T, 6298833571, 0, 28401173236, 19733440998, 0, 0),
  makePet('Titanic Gym Shark', '116575608018506', 'Titanic', T, 6363733358, 6500679365, 17022029254, 0, 0, 0),
  makePet('Titanic Sandcastle Kraken', '90627425215733', 'Titanic', T, 6396606082, 6115926034, 17712211176, 0, 0, 0),
  makePet('Titanic Pixel Dominus Astra', '129315342087717', 'Titanic', T, 6478090176, 0, 18134953198, 0, 0, 0),
  makePet('Titanic Ooze Cat', '114761957372566', 'Titanic', T, 6402045895, 6532527368, 23110688239, 0, 0, 0),
  makePet('Titanic Easter Axolotl', '76996694412887', 'Titanic', T, 6338778298, 6870135099, 42765951703, 648000000000, 0, 0),
  makePet('Titanic Helicopter Corgi', '139030108461655', 'Titanic', T, 6330968107, 0, 0, 0, 0, 0),
  makePet('Titanic Spirit Mushroom', '86911408081625', 'Titanic', T, 6263307641, 0, 23805215872, 15642262528, 0, 0),
  makePet('Titanic Basketball Cat', '88337098275915', 'Titanic', T, 6296054857, 6332623938, 21170605771, 444400000000, 0, 0),
  makePet('Titanic Narwhal', '100083536961839', 'Titanic', T, 6189719511, 0, 0, 0, 0, 0),
  makePet('Titanic Night Terror Dog', '112505092769187', 'Titanic', T, 6260101352, 0, 0, 0, 0, 0),
  makePet('Titanic Gym Unicorn', '86624734020676', 'Titanic', T, 6109235423, 6471033517, 16447584308, 0, 0, 0),
  makePet('Titanic Storm Axolotl Ball', '140349148341918', 'Titanic', T, 6039475773, 0, 0, 0, 0, 0),
  makePet('Titanic Diamond Monkey', '77972912232748', 'Titanic', T, 6047864971, 9893108968, 0, 0, 0, 0),
  makePet('Titanic Ice Snake', '136281455287593', 'Titanic', T, 6063531094, 6178519768, 17184801463, 15380629291, 0, 0),
  makePet('Titanic Nutcracker Cat', '131594588116580', 'Titanic', T, 6011191315, 6502850970, 16365545226, 16756537502, 0, 0),
  makePet('Titanic Nuclear Dominus', '89079914653580', 'Titanic', T, 5674544473, 6377225020, 17101030248, 22257658789, 0, 0),
  makePet('Titanic Snow Elf', '137871430705388', 'Titanic', T, 5980910101, 6368761549, 18180418224, 22547869395, 0, 0),
  makePet('Titanic Leprechaun Dog', '82186253097928', 'Titanic', T, 5940273610, 6444922758, 17834778854, 179534873600, 0, 0),
  makePet('Titanic Crackling Dragon', '83961459866368', 'Titanic', T, 5843398165, 0, 0, 0, 0, 0),
  makePet('Titanic Prickly Panda', '110590155279741', 'Titanic', T, 5309734546, 8128862946, 31616579098, 19875740834, 0, 0),
  makePet('Titanic Snow Globe Snowman', '78333791441483', 'Titanic', T, 5927840808, 0, 24178167407, 20263573821, 0, 0),
  makePet('Titanic Glitched Cat Ball', '106995873715009', 'Titanic', T, 5863250220, 6496239195, 0, 15625968782, 0, 0),
  makePet('Titanic Exquisite Cat', '71126391222560', 'Titanic', T, 5713537059, 6433816399, 23407116972, 15713278312, 0, 0),
  makePet('Titanic Chesnut Chipmunk', '106520142192819', 'Titanic', T, 5571721534, 8383724162, 25965534706, 0, 0, 0),
  makePet('Titanic Surfboard Corgi', '94523830121587', 'Titanic', T, 5525319318, 6568639626, 17773815422, 15372527460, 0, 0),
  makePet('Titanic Owl', '111258824225580', 'Titanic', T, 5487341372, 8963686801, 19645549462, 32736449772, 92510000000, 0),
  makePet('Titanic Withered Agony', '131171482429329', 'Titanic', T, 5419800288, 6037737972, 23028955636, 20862223904, 0, 0),
  makePet('Titanic Red Dragon', '102919400453870', 'Titanic', T, 5360487421, 5733204445, 21052888809, 0, 0, 0),
  makePet('Titanic Sea Dragon', '97419954429083', 'Titanic', T, 5400180105, 5812818677, 16804678326, 26169168734, 208787987200, 0),
  makePet('Titanic North Pole Unicorn', '127223502497366', 'Titanic', T, 5314678490, 5736833056, 18347822946, 32675198000, 0, 0),
  makePet('Titanic Hippomint', '118720066911760', 'Titanic', T, 5251260058, 5773267179, 16201994655, 14342836196, 0, 68860000000),
  makePet('Titanic Pineapple Dog', '99869089555079', 'Titanic', T, 5310661147, 5940458537, 16315301805, 0, 0, 0),
  makePet('Titanic Old Wizard Cat', '85718953892638', 'Titanic', T, 5350898245, 6992894535, 16112669081, 49458869146, 0, 0),
  makePet('Titanic Persimmony Cricket', '107901135144472', 'Titanic', T, 5175330717, 7354812776, 25719322178, 700000000000, 0, 0),
  makePet('Titanic Exquisite Elephant', '97422903795997', 'Titanic', T, 5143503986, 6129186246, 15975348887, 24738470851, 0, 0),
  makePet('Titanic Pumpkin Dog', '92147535439252', 'Titanic', T, 5188573929, 0, 0, 0, 0, 0),
  makePet('Titanic Devil Tasmanian', '90163785900987', 'Titanic', T, 5136473178, 0, 0, 0, 0, 0),
  makePet('Titanic Ghost Axolotl', '81649535142902', 'Titanic', T, 5065131325, 5752785743, 15510071252, 18124821250, 124760000000, 0),
  makePet('Titanic Pink Lucky Block', '106313575575295', 'Titanic', T, 5034862500, 0, 0, 0, 0, 0),
  makePet('Titanic Specter Owl', '75229651213956', 'Titanic', T, 5092636896, 0, 0, 0, 0, 0),
  makePet('Titanic Ghostly Wolf', '122682792759281', 'Titanic', T, 4929534432, 0, 18589078549, 14901392493, 0, 0),
  makePet('Titanic Veil Horse', '80965165352380', 'Titanic', T, 4890003431, 0, 0, 0, 0, 0),
  makePet('Titanic Ruinous Angelus', '128700972772946', 'Titanic', T, 4914400834, 5251715205, 15087779205, 18123392116, 0, 0),
  makePet('Titanic Scribe Squirrel', '119222051257563', 'Titanic', T, 4909089487, 5431555152, 16827443989, 0, 0, 0),
  makePet('Titanic Irish Badger', '94461290807119', 'Titanic', T, 4967773359, 6985557747, 0, 0, 0, 0),
  makePet('Titanic Lucki Chest Mimic', '96487317914550', 'Titanic', T, 4958961377, 5320675852, 15994246830, 17893484364, 0, 0),
  makePet('Titanic Starlight Pony', '130735528136584', 'Titanic', T, 4989328265, 5697902644, 17655822427, 31060857878, 0, 747600000000),
  makePet('Titanic Tiedye Corgi', '116762893028421', 'Titanic', T, 4942506139, 0, 19161722484, 15636094565, 0, 0),
  makePet('Titanic Diamond Chick', '136894452978816', 'Titanic', T, 4835641227, 5389560909, 19005496703, 0, 0, 0),
  makePet('Titanic Mucki', '90224746206001', 'Titanic', T, 4824427390, 5115207632, 15431202861, 19431825692, 24614321606, 0),
  makePet('Titanic Butterfly Pony', '71576208236179', 'Titanic', T, 4848966253, 5136636573, 17989774183, 22873992800, 0, 0),
  makePet('Titanic Werewolf', '111055741189811', 'Titanic', T, 4765057337, 5163455572, 15715346402, 16648983031, 0, 0),
  makePet('Titanic Quokka', '118478723717753', 'Titanic', T, 4830245553, 5090030916, 13957736629, 14651546213, 425990240000, 1000000000000),
  makePet('Titanic Garden Goblin', '88678695683652', 'Titanic', T, 4804319569, 5067536809, 15381519954, 14323267133, 0, 0),
  makePet('Titanic Horseshoe Capybara', '123799433533609', 'Titanic', T, 4802304235, 5070883155, 14691464601, 14726268894, 32888417955, 0),
  makePet('Titanic Irish Wolfhound', '125815340060379', 'Titanic', T, 4747244755, 5119290741, 15267493476, 17309742137, 38162836127, 0),

/* -- HUGE -- (926 pets, real RAP from db.biggames.io) */
  makePet('Huge Crowned Penguin', '85416907805755', 'Huge', H, 300000000000, 0, 0, 0, 0, 0),
  makePet('Huge Signature BIG Maskot', '98304859922444', 'Huge', H, 290000000000, 0, 0, 0, 0, 0),
  makePet('Huge Crowned Corgi', '15281989661', 'Huge', H, 89200000000, 0, 0, 0, 0, 0),
  makePet('Huge Crowned Cat', '15281989820', 'Huge', H, 40549643976, 0, 0, 0, 0, 0),
  makePet('Huge Demon', '92733626673208', 'Huge', H, 29078000000, 0, 0, 0, 0, 0),
  makePet('Huge Holographic Corgi', '117552656030475', 'Huge', H, 25400000000, 0, 0, 0, 0, 0),
  makePet('Huge Present Cat', '15637230004', 'Huge', H, 24686318454, 0, 0, 0, 0, 0),
  makePet('Huge Splash Angelus', '70796008015802', 'Huge', H, 22623514977, 16056651946, 0, 0, 0, 0),
  makePet('Huge Crowned Dog', '116949971917880', 'Huge', H, 23157500851, 0, 0, 0, 0, 0),
  makePet('Huge Wisp Deer', '119889276435598', 'Huge', H, 20094652196, 100000000000, 0, 0, 0, 0),
  makePet('Huge Cat', '14976374906', 'Huge', H, 17755532616, 0, 31956996346, 0, 0, 0),
  makePet('Huge Stunt Unicorn', '14976564045', 'Huge', H, 18087032394, 0, 0, 0, 0, 0),
  makePet('Huge Alien Arachnid', '16756608144', 'Huge', H, 17763125412, 0, 0, 0, 0, 0),
  makePet('Huge Runic Wolf', '90992015930571', 'Huge', H, 15387040000, 0, 0, 0, 0, 0),
  makePet('Huge Sensei Penguin', '16029125715', 'Huge', H, 12541318204, 0, 0, 0, 0, 0),
  makePet('Huge Blue Balloon Cat', '14976365873', 'Huge', H, 12422959223, 0, 0, 0, 0, 0),
  makePet('Huge Bubble Dog', '17277934726', 'Huge', H, 11727530183, 0, 0, 0, 0, 0),
  makePet('Huge Angelus', '14976350830', 'Huge', H, 11179599835, 5966067507, 0, 0, 0, 0),
  makePet('Huge Pixel Shark', '17024845317', 'Huge', H, 9984743909, 0, 0, 0, 0, 0),
  makePet('Huge Bread Shiba', '14976370557', 'Huge', H, 9728305349, 6371803552, 0, 0, 0, 0),
  makePet('Huge White Balloon Cat', '14976576332', 'Huge', H, 5502047865, 0, 29027973074, 0, 0, 0),
  makePet('Huge Mystical Fox', '14976496299', 'Huge', H, 6334473235, 0, 0, 0, 0, 0),
  makePet('Huge Butterfly', '14976372228', 'Huge', H, 9300975312, 6526220143, 0, 0, 0, 0),
  makePet('Huge Hoverboard Dog', '117980545661053', 'Huge', H, 5790481711, 0, 0, 0, 0, 0),
  makePet('Huge Mummy Bunny', '101133530585577', 'Huge', H, 4951006897, 2164924449, 0, 0, 0, 0),
  makePet('Huge Storm Agony', '15260479669', 'Huge', H, 4304214372, 3902411047, 7034634693, 0, 0, 0),
  makePet('Huge Ninja Capybara', '101889999202642', 'Huge', H, 4303554403, 131671896632, 0, 0, 0, 0),
  makePet('Huge Anime Agony', '14976351312', 'Huge', H, 4172342349, 6786062580, 20449146099, 0, 0, 0),
  makePet('Huge Inferno Cat', '14976463498', 'Huge', H, 4026211305, 2729925068, 12490767938, 0, 0, 0),
  makePet('Huge Pop Cat', '14976525879', 'Huge', H, 3400567136, 0, 14978527659, 10266228462, 0, 0),
  makePet('Huge Cupcake Unicorn', '14976388989', 'Huge', H, 3764509844, 1511787828, 65975270207, 0, 0, 0),
  makePet('Huge Wicked Empyrean Dragon', '17746014334', 'Huge', H, 3550781985, 1533718755, 10240838104, 0, 0, 0),
  makePet('Huge Blurred Dominus', '14976370033', 'Huge', H, 3237019117, 155868004732, 0, 0, 0, 0),
  makePet('Huge Neon Twilight Dragon', '15260481819', 'Huge', H, 2997841266, 5040191303, 16244266835, 0, 0, 0),
  makePet('Huge Guard Bunny', '70728047813207', 'Huge', H, 2915886706, 1398871247, 14531931366, 22222720000, 18000000000, 0),
  makePet('Huge Sombrero Chihuahua', '14976553203', 'Huge', H, 2839011137, 753197960, 10611224986, 0, 0, 0),
  makePet('Huge Prickly Panda', '14976527289', 'Huge', H, 2781490640, 3230913695, 16291115631, 0, 0, 0),
  makePet('Huge Crackling Dragon', '125990599285140', 'Huge', H, 2710896329, 3075026549, 0, 0, 0, 0),
  makePet('Huge Kawaii Cat', '14976470713', 'Huge', H, 2616936792, 1142448567, 0, 16941262202, 0, 0),
  makePet('Huge Principal Anteater', '124723336680703', 'Huge', H, 2651942217, 0, 0, 0, 0, 0),
  makePet('Huge Easter Cat', '15281989384', 'Huge', H, 2603734686, 1654978674, 4530945862, 0, 0, 0),
  makePet('Huge Wyvern of Hades', '113089838370784', 'Huge', H, 2637802869, 1440685842, 6286414175, 0, 0, 0),
  makePet('Huge Santa Paws', '14976542836', 'Huge', H, 2402009240, 2510419022, 8017982087, 0, 0, 0),
  makePet('Huge Comet Agony', '14976384743', 'Huge', H, 2310024925, 1587268538, 11672393561, 14581605783, 0, 0),
  makePet('Huge Cyborg Capybara', '15260482561', 'Huge', H, 2460196082, 1953490628, 8448924120, 0, 0, 0),
  makePet('Huge Frontman Jellyfish', '104443983862799', 'Huge', H, 2396881092, 2837831517, 9172770667, 0, 0, 0),
  makePet('Huge Patrick Star', '18313092558', 'Huge', H, 2362215275, 0, 8857467217, 5174777283, 0, 0),
  makePet('Huge Basketball Retriever', '14976360269', 'Huge', H, 2382794980, 1650124901, 6772688343, 82580000000, 82580000000, 0),
  makePet('Huge Ghost Cat', '94290261080713', 'Huge', H, 2301561051, 1682958090, 7978812308, 0, 0, 0),
  makePet('Huge Angel Cat', '15281990207', 'Huge', H, 2324181772, 1880536291, 0, 8470361600, 0, 0),
  makePet('Huge Diamond Dragon', '135778952005746', 'Huge', H, 2232294756, 1654934763, 0, 0, 0, 0),
  makePet('Huge Lucky Cat', '14976485216', 'Huge', H, 2207131528, 2541223716, 7650143705, 0, 0, 0),
  makePet('Huge Reversed Cat', '86486361253800', 'Huge', H, 2195352341, 1010040207, 5397914678, 0, 0, 0),
  makePet('Huge Diamond Cat', '14976396731', 'Huge', H, 2146705524, 2558073995, 14692075554, 14263797650, 0, 0),
  makePet('Huge Chest Mimic', '14976376935', 'Huge', H, 2203964387, 1613649646, 9568449416, 7699621806, 1000000000000, 0),
  makePet('Huge Orange Balloon Cat', '14976505912', 'Huge', H, 2132319654, 0, 7040456216, 0, 0, 0),
  makePet('Huge Glitched Cat', '16468736057', 'Huge', H, 2167027148, 892673104, 4588491023, 0, 0, 0),
  makePet('Huge Ice Cream Cone', '14976462189', 'Huge', H, 2138780999, 1037324451, 4833954837, 0, 0, 0),
  makePet('Huge Gamer Shiba', '14976439240', 'Huge', H, 2106213485, 1883734857, 0, 33255245824, 33255245824, 0),
  makePet('Huge Forest Wyvern', '14976435839', 'Huge', H, 1949395420, 1723720315, 5052260611, 0, 0, 0),
  makePet('Huge Gingerbread Dragon', '110621195469129', 'Huge', H, 2055212245, 1300929902, 9786922658, 0, 0, 0),
  makePet('Huge Sad Hamster', '139847485438413', 'Huge', H, 2025212145, 0, 6076788829, 5653759297, 0, 0),
  makePet('Huge Clown Cat', '18520054035', 'Huge', H, 2070880703, 1534230030, 2871956433, 0, 0, 0),
  makePet('Huge Dino Cat', '14976397288', 'Huge', H, 1948215007, 0, 6546782986, 9099440000, 0, 0),
  makePet('Huge Grim Reaper', '14976567210', 'Huge', H, 2026596916, 1537505404, 6426860716, 0, 0, 0),
  makePet('Huge Shiba', '14976547077', 'Huge', H, 1997119608, 4417271040, 24574400000, 0, 0, 0),
  makePet('Huge Pufferfish', '14976528215', 'Huge', H, 1916502814, 926005097, 21312172646, 5285463028, 100000000000, 0),
  makePet('Huge Axolotl', '14976357246', 'Huge', H, 1875898157, 634235315, 13030071208, 0, 0, 0),
  makePet('Huge Monkey', '14976491927', 'Huge', H, 1840965361, 2710905282, 5629313879, 0, 0, 0),
  makePet('Huge Capybara', '14976373698', 'Huge', H, 1747734536, 2128091002, 5989496184, 16479600000, 0, 0),
  makePet('Huge Santa Monkey', '15281988558', 'Huge', H, 1629181746, 1942659715, 10108981629, 0, 0, 0),
  makePet('Huge Heart Balloon Cat', '16306792637', 'Huge', H, 1569812216, 0, 10516019272, 5131078808, 0, 0),
  makePet('Huge Hedgehog', '76079961004041', 'Huge', H, 1568864782, 334120000000, 0, 0, 0, 0),
  makePet('Huge Pinata Cat', '14976516399', 'Huge', H, 814643542, 0, 0, 0, 0, 0),
  makePet('Huge Evil Deer', '105420679784540', 'Huge', H, 1454909534, 936582189, 4422063146, 0, 0, 0),
  makePet('Huge Panda', '86383655760798', 'Huge', H, 1426545880, 0, 0, 7400000000, 0, 0),
  makePet('Huge Shark Cat', '96757523363685', 'Huge', H, 1426281721, 1481343353, 7903488000, 0, 0, 0),
  makePet('Huge Gargoyle Dragon', '14976439876', 'Huge', H, 1232517459, 1637470171, 4056027286, 0, 0, 0),
  makePet('Huge Apple Capybara', '14976352410', 'Huge', H, 1389361383, 0, 5540378660, 3309127543, 0, 0),
  makePet('Huge Hubert', '140721677142555', 'Huge', H, 1337743776, 0, 4823747207, 3028553203, 0, 0),
  makePet('Huge Love Lamb', '14976476986', 'Huge', H, 1334204080, 447558986, 0, 3652675026, 0, 0),
  makePet('Huge Sleipnir', '15260480028', 'Huge', H, 1287529289, 2178899737, 4388132855, 0, 0, 0),
  makePet('Huge Fragmented Dominus', '17421845704', 'Huge', H, 1386210630, 958268501, 3700029588, 0, 0, 0),
  makePet('Huge Balloon Cat', '14976358748', 'Huge', H, 1210045341, 781936216, 4555202150, 3115375498, 0, 0),
  makePet('Huge Cow', '14976386456', 'Huge', H, 1190952149, 655082967, 6215247688, 11052146893, 0, 0),
  makePet('Huge Rave Crab', '109133967059639', 'Huge', H, 1138842174, 839232727, 3134067534, 0, 0, 0),
  makePet('Huge Blurred Agony', '136961969731573', 'Huge', H, 1130494114, 1197486560, 4938369682, 0, 0, 0),
  makePet('Huge Otter', '14976506594', 'Huge', H, 1202299145, 630423915, 7941780079, 1059087510, 7000000000, 0),
  makePet('Huge Green Balloon Cat', '14976447015', 'Huge', H, 1098368730, 0, 4250499006, 681025276, 0, 0),
  makePet('Huge Three Headed Dragon', '14976567497', 'Huge', H, 1085724544, 16720000000, 16646365184, 0, 0, 0),
  makePet('Huge Atlantean Dolphin', '14976354622', 'Huge', H, 1038590218, 0, 2684773387, 0, 0, 0),
  makePet('Huge Hippomelon', '14976456685', 'Huge', H, 1037896139, 0, 4042919862, 2985027124, 0, 0),
  makePet('Huge Mr Krabs', '18313092725', 'Huge', H, 1075262108, 0, 0, 0, 0, 0),
  makePet('Huge Clover Dragon', '14976383366', 'Huge', H, 1002350758, 393096707, 5540074916, 2563184256, 25048698505, 0),
  makePet('Huge Mushroom King', '125986697104431', 'Huge', H, 1047602445, 1098154340, 4467347745, 0, 0, 0),
  makePet('Huge Tiedye Dog', '117016363569133', 'Huge', H, 977964879, 764172745, 4485194997, 0, 0, 0),
  makePet('Huge M-10 PROTOTYPE', '15260482198', 'Huge', H, 898994236, 0, 6922053120, 3336184524, 0, 0),
  makePet('Huge Safari Dog', '14976538804', 'Huge', H, 929861313, 93594689902, 9315243471, 6603258444, 0, 0),
  makePet('Huge Dog', '14976397743', 'Huge', H, 929445554, 1254658797, 4723150053, 1224579429, 0, 0),
  makePet('Huge Kraken', '14976473284', 'Huge', H, 896800734, 1525227516, 55904116097, 0, 0, 0),
  makePet('Huge Lit Octopus', '100395307748648', 'Huge', H, 864719922, 742869460, 7304729600, 0, 0, 0),
  makePet('Huge Poseidon Axolotl', '86210025446242', 'Huge', H, 901311262, 0, 0, 14589321784, 0, 0),
  makePet('Huge Lucki Dominus', '78303914095670', 'Huge', H, 901502822, 807436068, 0, 0, 0, 0),
  makePet('Huge Neon Griffin', '14976498238', 'Huge', H, 876846838, 0, 5649016665, 3156634846, 0, 0),
  makePet('Huge Ducky', '14976415577', 'Huge', H, 874371101, 647559875, 1602225561, 144774359040, 144774359040, 0),
  makePet('Huge Balloon Corgi', '135934944336063', 'Huge', H, 884380747, 524518319, 2799885862, 0, 0, 0),
  makePet('Huge Puurple Cat', '17450362839', 'Huge', H, 883776523, 356653990, 3997052508, 3331158186, 0, 0),
  makePet('Huge Reindeer Dog', '15281988831', 'Huge', H, 876526477, 667288465, 8528093293, 18594849779, 0, 0),
  makePet('Huge Safety Cat', '18127300990', 'Huge', H, 873121851, 850344162, 2634636494, 0, 0, 0),
  makePet('Huge Lucki', '14976484952', 'Huge', H, 844367584, 360745618, 21308432333, 0, 0, 0),
  makePet('Huge Anime Unicorn', '14976352077', 'Huge', H, 842048250, 0, 4764233787, 1205641722, 0, 0),
  makePet('Huge Reindeer Axolotl', '15281989034', 'Huge', H, 857708077, 692757700, 7106584316, 5927584110, 0, 0),
  makePet('Huge Party Monkey', '14976510684', 'Huge', H, 865719660, 2312241255, 0, 12549183478, 0, 0),
  makePet('Huge Blimp Dragon', '113409897234634', 'Huge', H, 858537516, 824744867, 3682562527, 0, 0, 0),
  makePet('Huge Corgi', '14976386115', 'Huge', H, 819572848, 1277191863, 7779203100, 0, 0, 0),
  makePet('Huge Pink Marshmallow Chick', '14976517974', 'Huge', H, 821309331, 533427140, 9012449992, 6126463041, 0, 0),
  makePet('Huge Balloon Axolotl', '14976358125', 'Huge', H, 793380121, 0, 3567122254, 3068544045, 0, 0),
  makePet('Huge Tiki Dominus', '14976571122', 'Huge', H, 793686903, 810342534, 7445694724, 4733852447, 0, 0),
  makePet('Huge Holographic Monkey', '77505723512124', 'Huge', H, 789048972, 876704568, 5213437986, 0, 0, 0),
  makePet('Huge Santa Dragon', '15281988711', 'Huge', H, 776624782, 1381418025, 7862507023, 6062306340, 0, 0),
  makePet('Huge Pixel Wolf', '14976522632', 'Huge', H, 766020463, 892736962, 3036720000, 0, 0, 0),
  makePet('Huge Pony', '14976525582', 'Huge', H, 765634514, 1545189554, 3199332030, 0, 0, 0),
  makePet('Huge Present Chest Mimic', '14976527111', 'Huge', H, 763153250, 0, 2869209522, 2163493320, 0, 0),
  makePet('Huge Nightmare Kraken', '14976502236', 'Huge', H, 730225710, 0, 5795154513, 1693864674, 0, 0),
  makePet('Huge Snowman', '15199736050', 'Huge', H, 752109881, 996084049, 7143331841, 4390847705, 0, 0),
  makePet('Huge Sphinx', '112960031922397', 'Huge', H, 780882752, 831095197, 3166102500, 0, 0, 0),
  makePet('Huge Dominus Lucki', '14976479237', 'Huge', H, 743424663, 0, 0, 0, 0, 0),
  makePet('Huge Dragon', '14976414803', 'Huge', H, 750585764, 536843286, 4004020371, 2658749037, 0, 0),
  makePet('Huge Black Hole Kitsune', '17285736637', 'Huge', H, 767328914, 0, 1480921272, 1781069700, 0, 0),
  makePet('Huge Balloon Dragon', '14976359350', 'Huge', H, 746604803, 0, 2903862570, 850824541, 0, 0),
  makePet('Huge Pumpkin Cat', '14976529226', 'Huge', H, 744925456, 611077553, 2920466317, 2365292127, 4332328852, 0),
  makePet('Huge Hoverboard Cat', '15542598827', 'Huge', H, 730447996, 327609819, 5324156043, 3310550145, 0, 0),
  makePet('Huge Hacked Cat', '14976449581', 'Huge', H, 719765096, 360486524, 2091464269, 0, 0, 0),
  makePet('Huge Reaper Cat', '136851484598871', 'Huge', H, 741439655, 428356452, 3585441323, 0, 0, 0),
  makePet('Huge Grinch Cat', '14976448309', 'Huge', H, 719357317, 0, 4715663387, 3203275513, 0, 0),
  makePet('Huge Atlantean Orca', '14976355521', 'Huge', H, 716038430, 0, 3129135851, 913945093, 0, 0),
  makePet('Huge Pog Cat', '123648690581827', 'Huge', H, 703916661, 380262353, 2328149715, 4399715398, 250000000000, 0),
  makePet('Huge Sandcastle Cat', '14976541813', 'Huge', H, 712124000, 3343001152, 5603547444, 4622045575, 0, 0),
  makePet('Huge Bloo Cat', '17375064407', 'Huge', H, 677099314, 291292529, 2132578052, 1819239898, 5802699568, 0),
  makePet('Huge Super Corgi', '14976565468', 'Huge', H, 696778576, 797047532, 2870018203, 0, 0, 0),
  makePet('Huge Rainbow Unicorn', '14976532168', 'Huge', H, 681271474, 712430276, 2346969932, 0, 0, 0),
  makePet('Huge Valentines Cat', '16290990548', 'Huge', H, 686149742, 0, 0, 0, 0, 0),
  makePet('Huge Floppa', '14976434470', 'Huge', H, 647997016, 482993472, 4148612317, 0, 0, 0),
  makePet('Huge Amethyst Dragon', '14976350251', 'Huge', H, 646839757, 0, 3396682672, 1535573332, 0, 0),
  makePet('Huge Lucki Agony', '14976478543', 'Huge', H, 651612829, 2065824280, 0, 2581059794, 0, 0),
  makePet('Huge Evolved Hacked Cat', '14976425579', 'Huge', H, 644217676, 0, 1684436764, 36987168637, 0, 14700000000),
  makePet('Huge Specter Owl', '96339575163664', 'Huge', H, 673709143, 622131140, 3804532980, 383461376000, 0, 0),
  makePet('Huge Nightfall Pegasus', '15260481050', 'Huge', H, 643250879, 375724115, 3790072994, 2939171720, 18568993894, 0),
  makePet('Huge Neon Twilight Wolf', '15260481429', 'Huge', H, 661965408, 36309828267, 12615355750, 0, 0, 0),
  makePet('Huge Mummy Cow', '98874916712415', 'Huge', H, 654718911, 526024292, 5436942632, 0, 0, 0),
  makePet('Huge Inferno Dominus', '14976463903', 'Huge', H, 630020784, 0, 2759358698, 1974638542, 0, 0),
  makePet('Huge Doodle Agony', '117441180861427', 'Huge', H, 648075209, 715443209, 3867024493, 12999998000, 0, 0),
  makePet('Huge Junkyard Hound', '82197525577335', 'Huge', H, 623669863, 330536680, 1288295777, 0, 0, 0),
  makePet('Huge Cool Cat', '14976385467', 'Huge', H, 609709432, 411389764, 2961791883, 3231118615, 0, 0),
  makePet('Huge Sapphire Phoenix', '15260480400', 'Huge', H, 616093184, 394889345, 2924595150, 1528051314, 90931039793, 0),
  makePet('Huge Evolved Pixel Cat', '14976426599', 'Huge', H, 615035269, 0, 1838549346, 3059761461, 0, 10000000000),
  makePet('Huge Pixel Chick', '109348174675332', 'Huge', H, 607627176, 332052797, 1391188825, 0, 0, 0),
  makePet('Huge Nightmare Cyclops', '98277417659107', 'Huge', H, 603704944, 305249465, 2343507627, 0, 0, 0),
  makePet('Huge Scuba Dog', '139017924153372', 'Huge', H, 599957734, 586785847, 1488688564, 0, 0, 0),
  makePet('Huge Emoji Monkey', '16047450351', 'Huge', H, 579786078, 0, 1897238261, 1182023297, 0, 0),
  makePet('Huge Festive Cat', '15281989250', 'Huge', H, 593959470, 430915933, 2973278853, 0, 0, 0),
  makePet('Huge Dominus Darkwing', '100391666936804', 'Huge', H, 601460078, 150263877, 2742035773, 33930592263, 0, 18000000000),
  makePet('Huge Vampire Agony', '130091557043756', 'Huge', H, 584895117, 1200568366, 15061373178, 0, 0, 0),
  makePet('Huge Wild Fire Agony', '14976578547', 'Huge', H, 566378045, 317673644, 4647516895, 3503070423, 5530854656, 0),
  makePet('Huge Sad Doge', '126938121450876', 'Huge', H, 569391696, 0, 1297257863, 1032222856, 0, 0),
  makePet('Huge Sun Angelus', '14976564553', 'Huge', H, 554379356, 459427157, 2409439112, 4391485361, 6163672650, 0),
  makePet('Huge Arcade Cat', '14976352617', 'Huge', H, 557691647, 641446800, 5457441627, 4052061211, 0, 0),
  makePet('Huge Firefly', '16744676508', 'Huge', H, 556004050, 765410963, 7023965365, 0, 0, 0),
  makePet('Huge Hologram Axolotl', '14976456919', 'Huge', H, 553858911, 0, 2839313280, 3394294730, 0, 0),
  makePet('Huge Brain', '88763930700070', 'Huge', H, 536025957, 870992632, 0, 0, 0, 0),
  makePet('Huge Nightfall Wolf', '15260480737', 'Huge', H, 539579736, 427868639, 2628792996, 2042533999, 3970168388, 0),
  makePet('Huge Pastel Sock Dragon', '14976513814', 'Huge', H, 539456995, 464864443, 5465472164, 3165225303, 0, 0),
  makePet('Huge Hot Dog', '16250978135', 'Huge', H, 512632061, 0, 1962513424, 2360154704, 0, 0),
  makePet('Huge Husky', '14976460483', 'Huge', H, 510827892, 437091264, 3262418658, 2125165515, 0, 0),
  makePet('Huge UV Kitsune Ball', '133144353929951', 'Huge', H, 517092362, 0, 0, 0, 0, 0),
  makePet('Huge Hacked Skeleton', '134082855413685', 'Huge', H, 500805429, 1339773182, 4642216503, 0, 0, 0),
  makePet('Huge Nyan Cat', '111205928887511', 'Huge', H, 516194864, 182436847, 1033327731, 791689986, 1325677344, 0),
  makePet('Huge Doodle Bee', '84450044658879', 'Huge', H, 475165729, 666726092, 3037499437, 0, 0, 0),
  makePet('Huge White Tiger', '14976576861', 'Huge', H, 479310816, 0, 4403666645, 6047089531, 0, 0),
  makePet('Huge Celestial Dragon', '15163489240', 'Huge', H, 466800670, 0, 4067250276, 12409820842, 0, 0),
  makePet('Huge Pixel Agony', '85105390467566', 'Huge', H, 474812772, 972762509, 7264342600, 0, 0, 0),
  makePet('Huge Neon Cat', '14976497661', 'Huge', H, 433775227, 0, 1099120155, 673077748, 0, 0),
  makePet('Huge 404 Demon', '17288680692', 'Huge', H, 415517988, 0, 0, 0, 0, 0),
  makePet('Huge Peppermint Angelus', '15716049163', 'Huge', H, 454259878, 0, 4348830901, 1558095113, 0, 0),
  makePet('Huge Autumn Chest Mimic', '131920407611756', 'Huge', H, 451560358, 258684036, 972765434, 25000000000, 25000000000, 0),
  makePet('Huge Shadow Griffin', '14976546605', 'Huge', H, 445289621, 300161087, 4474418033, 7378055782, 1000000000000, 0),
  makePet('Huge Arcane Dominus', '84981023975118', 'Huge', H, 455803511, 164092873, 2063428779, 6650266642, 0, 0),
  makePet('Huge Athena Owl', '117588896362117', 'Huge', H, 446051201, 398973817, 2461693799, 0, 0, 0),
  makePet('Huge Storm Dominus', '15260478906', 'Huge', H, 435030509, 0, 1324773037, 774832496, 0, 0),
  makePet('Huge Googly Shark', '103658339806343', 'Huge', H, 462729653, 0, 17847846087, 6004684840, 0, 0),
  makePet('Huge Super Tiger', '16746767650', 'Huge', H, 428761608, 0, 1495894365, 927034200, 0, 16400000000),
  makePet('Huge BIG Maskot', '14976363084', 'Huge', H, 441269536, 0, 2550893452, 0, 0, 0),
  makePet('Huge Knife Cat', '14976472648', 'Huge', H, 444528427, 0, 2674997085, 1429839420, 0, 0),
  makePet('Huge Pixel Sad Cat', '132317712200378', 'Huge', H, 440459633, 220986878, 3262483395, 5902317005, 0, 0),
  makePet('Huge Valentines Angelus', '74709418271997', 'Huge', H, 426104213, 0, 0, 0, 0, 0),
  makePet('Huge Gleebo The Alien', '14976443059', 'Huge', H, 422389176, 12233910394, 5229220817, 3758869983, 0, 0),
  makePet('Huge Forged Robot', '136825338355926', 'Huge', H, 432623042, 518104997, 1855383687, 0, 0, 0),
  makePet('Huge Evolved Cupcake', '14976425356', 'Huge', H, 427358265, 0, 1594132724, 2470408289, 0, 518136028581),
  makePet('Huge Party Penguin', '14976511281', 'Huge', H, 430894506, 270732319, 9383976128, 2398458525, 0, 0),
  makePet('Huge Matryoshka Capybara', '135978924000516', 'Huge', H, 428285638, 0, 2277966561, 755830529, 0, 0),
  makePet('Huge Matryoshka Dino', '130741332412242', 'Huge', H, 414924503, 0, 537734778725, 3883375713, 0, 0),
  makePet('Huge Ghoul Horse', '138823579638125', 'Huge', H, 407823016, 201833179, 926325823, 962424624, 2568733902, 0),
  makePet('Huge Mrs. Claws', '14976494867', 'Huge', H, 406836590, 286047376, 813302870, 693658186, 1263848573, 0),
  makePet('Huge Samurai Dragon', '14976541241', 'Huge', H, 419975810, 284443536, 5556080968, 27897409511, 0, 0),
  makePet('Huge Jelly Butterfly', '119227116644693', 'Huge', H, 404570436, 375122032, 2505637512, 26396701762, 0, 0),
  makePet('Huge Claw Beast', '102986417616097', 'Huge', H, 410170377, 0, 3230118502, 4627097907, 0, 0),
  makePet('Huge Shark', '14976546876', 'Huge', H, 402551886, 335364684, 6635841231, 4730010235, 0, 0),
  makePet('Huge Safari Cat', '14976538607', 'Huge', H, 383828756, 598349438, 3928603159, 1992428655, 0, 0),
  makePet('Huge Machete Dog', '108025600456665', 'Huge', H, 402918245, 0, 3290493232, 2074621733, 0, 0),
  makePet('Huge Comet Cyclops', '14976385072', 'Huge', H, 386727585, 634232911, 3123087669, 1136671511, 0, 0),
  makePet('Huge Ninja Axolotl', '14976503103', 'Huge', H, 380098619, 206462533, 1111012094, 650147814, 0, 0),
  makePet('Huge Hypnotic Dragon', '90381015332493', 'Huge', H, 386604938, 0, 4423991015, 1906337288, 0, 0),
  makePet('Huge Cupcake', '14976389145', 'Huge', H, 373568320, 302475526, 2196151921, 1206908176, 0, 0),
  makePet('Huge Dot Matrix Axolotl', '121462024507634', 'Huge', H, 385340578, 0, 0, 5122659582, 0, 0),
  makePet('Huge Wild Corrupt Agony', '83829095123136', 'Huge', H, 375271163, 92966994, 1071908039, 1187101403, 7008000000, 0),
  makePet('Huge Snow Globe Hamster', '83324398369784', 'Huge', H, 369984873, 0, 1817615384, 1181222384, 0, 0),
  makePet('Huge Techno Cat', '14976566707', 'Huge', H, 377130044, 309515551, 1762433912, 1479249458, 8061917967, 0),
  makePet('Huge Party Cat', '14976508941', 'Huge', H, 373803505, 251702078, 2661483552, 0, 0, 0),
  makePet('Huge Wicked Angelus', '87751794177322', 'Huge', H, 343675557, 114890233, 769465836, 1138952468, 3475296047, 0),
  makePet('Huge Strawberry Cow', '14976561960', 'Huge', H, 352037771, 191652715, 2460790822, 508861152, 3878191240, 0),
  makePet('Huge Cyborg Cat', '14976391620', 'Huge', H, 358067422, 325362621, 5314928928, 3064584643, 0, 0),
  makePet('Huge Vampire Dragon', '122834900117274', 'Huge', H, 357585329, 321476637, 5381573016, 0, 0, 0),
  makePet('Huge Nice Cat', '135884487799308', 'Huge', H, 363293160, 353700185, 3462545294, 16112480000, 0, 0),
  makePet('Huge Cartoon Demon', '114799627163759', 'Huge', H, 354970140, 0, 5315471573, 2516756779, 0, 0),
  makePet('Huge Corn Cat', '115417271549195', 'Huge', H, 351023284, 749570657, 1525646539, 11480000000, 0, 11480000000),
  makePet('Huge Chad Bunny', '106226869216523', 'Huge', H, 348422346, 0, 3319437950, 909226852, 0, 0),
  makePet('Huge Valkyrie Wolf', '18465100470', 'Huge', H, 340530543, 0, 4972259491, 2032559965, 0, 0),
  makePet('Huge Sailor Shark', '14976540139', 'Huge', H, 346885345, 1088487354, 2074045291, 1715198070, 0, 0),
  makePet('Huge Tech Samurai Cat', '17028331108', 'Huge', H, 335740400, 0, 0, 0, 0, 0),
  makePet('Huge Kaiju Hydra', '104819925091161', 'Huge', H, 344361994, 0, 4882792190, 7195388676, 0, 0),
  makePet('Huge Matrix Monkey', '17861579273', 'Huge', H, 323230515, 197771683, 1117717035, 0, 0, 0),
  makePet('Huge Pixel Cat', '14976519049', 'Huge', H, 328781026, 221820773, 2309196001, 0, 0, 0),
  makePet('Huge Poison Turtle', '90099723016359', 'Huge', H, 318040187, 247865623, 1289333115, 0, 0, 0),
  makePet('Huge Soul Dragon', '95241548572659', 'Huge', H, 310898292, 0, 3409966124, 2629433807, 0, 0),
  makePet('Huge Bear', '14976361884', 'Huge', H, 310141615, 216814224, 5519618697, 3481414804, 0, 0),
  makePet('Huge Stacked Dominus', '96928518190910', 'Huge', H, 308676379, 763204654, 2960015875, 1935809557, 7836000000, 0),
  makePet('Huge Tralala Brainrot', '130205496743645', 'Huge', H, 307183898, 0, 1618426874, 1290035809, 0, 207554293760),
  makePet('Huge Pixel Capybara', '120551262539366', 'Huge', H, 308671186, 295118263, 3368512329, 78420168746, 0, 0),
  makePet('Huge Fragmented Golem', '104056264494147', 'Huge', H, 307710072, 215387568, 1725304752, 0, 0, 0),
  makePet('Huge Pixel M-2 PROTOTYPE', '114437689272259', 'Huge', H, 293337436, 325357039, 2575240571, 4528999989, 0, 0),
  makePet('Huge Phantom Wolf', '73617612474545', 'Huge', H, 307339161, 93431662, 865887529, 1096322674, 3963972608, 0),
  makePet('Huge Baby Piglet', '115008493887428', 'Huge', H, 306684371, 347189261, 4750456734, 0, 0, 0),
  makePet('Huge Sun Griffin', '122831150159277', 'Huge', H, 302792504, 832237039, 2148539627, 0, 0, 0),
  makePet('Huge Rich Corgi', '124517901804987', 'Huge', H, 296972738, 824811319, 2673912856, 214426189497, 6610803200, 0),
  makePet('Huge Firefighter Dalmation', '14976432950', 'Huge', H, 197420699, 0, 0, 0, 0, 0),
  makePet('Huge Little Melty', '125054778559458', 'Huge', H, 297206105, 178518781, 3425719582, 0, 0, 0),
  makePet('Huge Snow Globe Corgi', '77464634142348', 'Huge', H, 289571003, 0, 1501122875, 587479675, 0, 0),
  makePet('Huge Good vs Evil Dragon', '18256895106', 'Huge', H, 287949694, 533491917, 1637177133, 145742343392, 0, 0),
  makePet('Huge Wireframe Cat', '129889522181856', 'Huge', H, 213003644, 380817856, 1018211687, 0, 0, 0),
  makePet('Huge Hologram Shark', '14976457374', 'Huge', H, 287619917, 0, 1570909884, 917450723, 0, 0),
  makePet('Huge Abstract Agony', '121388356688777', 'Huge', H, 279337355, 430819994, 4343064373, 0, 0, 0),
  makePet('Huge Forcefield Cat', '85865166902992', 'Huge', H, 277232649, 252039276, 2146510154, 1202532016, 0, 0),
  makePet('Huge Baby Puppy', '133001320495204', 'Huge', H, 291479434, 182441235, 2763048249, 0, 0, 0),
  makePet('Huge Midnight Axolotl', '124395858788677', 'Huge', H, 280801804, 883177121, 0, 0, 0, 0),
  makePet('Huge Party Dog', '14976510103', 'Huge', H, 274769945, 183191651, 2046438197, 1094727542, 7122560000, 0),
  makePet('Huge Aura Dominus', '96765579469696', 'Huge', H, 276724478, 0, 2197052011, 880204161, 0, 6322099200),
  makePet('Huge Party Crown Ducky', '14976509521', 'Huge', H, 272544245, 227174583, 2314351800, 2552475526, 0, 0),
  makePet('Huge Jelly Hydra', '109899952808122', 'Huge', H, 270576906, 143149637, 766702842, 1947821185, 104381584936, 0),
  makePet('Huge Redstone Cat', '14976533671', 'Huge', H, 264720742, 0, 1813301169, 920385060, 0, 0),
  makePet('Huge Unicorn', '14976573179', 'Huge', H, 263951613, 432373926, 4581589616, 2880854887, 0, 0),
  makePet('Huge Fairy', '14976428656', 'Huge', H, 259677860, 312724326, 2461667062, 922026271, 6304668800, 0),
  makePet('Huge Doodle Cat', '14976402524', 'Huge', H, 263475931, 80683572, 1075974447, 987880454, 1265738918, 0),
  makePet('Huge Zeus Bear', '112711947085113', 'Huge', H, 260304901, 0, 0, 25361426118, 0, 0),
  makePet('Huge Orca', '14976506366', 'Huge', H, 247818406, 531011596, 1962474271, 993010555, 0, 0),
  makePet('Huge Nightmare Spirit', '14976825431', 'Huge', H, 244545418, 0, 2689531922, 2375585871, 0, 0),
  makePet('Huge Sketch Dragon', '17027110585', 'Huge', H, 258840014, 0, 1521651271, 1233385555, 0, 0),
  makePet('Huge Blazing Bat', '17749191682', 'Huge', H, 245522590, 0, 1134210515, 777512904, 0, 0),
  makePet('Huge Midnight Cat', '137864465151841', 'Huge', H, 245316707, 0, 1285146238, 756741666, 0, 0),
  makePet('Huge Keyboard Cat', '135774541851149', 'Huge', H, 241073560, 325702113, 2243798714, 0, 0, 0),
  makePet('Huge Quantum Agony', '18886114160', 'Huge', H, 228918691, 48171438, 551608019, 357226760, 1193004534, 0),
  makePet('Huge Storm Axolotl', '136706503808298', 'Huge', H, 227803252, 170638311, 2504622858, 408769074832, 0, 0),
  makePet('Huge Easter Yeti', '14976418843', 'Huge', H, 229607806, 82247170, 622936773, 2166333249, 551569777, 2236639800),
  makePet('Huge Cartoon Bunny', '83751288485339', 'Huge', H, 234544582, 0, 1199634407, 922062158, 0, 0),
  makePet('Huge Lucki Chest Mimic', '76209866418616', 'Huge', H, 222553829, 655355875, 4799779355, 0, 0, 0),
  makePet('Huge Silver Bison', '84066657205534', 'Huge', H, 224026791, 359925887, 2804671982, 0, 0, 0),
  makePet('Huge Sun Agony', '17687869169', 'Huge', H, 225016689, 180416196, 1889164926, 2721456637, 0, 0),
  makePet('Huge Clover Owl', '138442898804320', 'Huge', H, 215382930, 575493879, 2588246545, 0, 0, 0),
  makePet('Huge Fox', '14976436421', 'Huge', H, 223506745, 249754207, 0, 2662742399, 7116479999, 0),
  makePet('Huge Black Hole Axolotl', '17285736425', 'Huge', H, 214878183, 0, 715483254, 490126286, 0, 0),
  makePet('Huge Leprechaun Dog', '82125738012621', 'Huge', H, 216620601, 357232883, 3630241258, 0, 0, 0),
  makePet('Huge Super Coral Hydra', '70870472183962', 'Huge', H, 205736090, 0, 1965820610, 1285039250, 0, 5520000000),
  makePet('Huge Lit Loris', '132382180739478', 'Huge', H, 202965578, 434235608, 6355656202, 17178155520, 0, 110000000000),
  makePet('Huge Wild Galaxy Agony', '126232720900762', 'Huge', H, 206222866, 85786771, 847971935, 1481856052, 2117700768, 0),
  makePet('Huge Vampire Bat', '14976574393', 'Huge', H, 199057203, 179221618, 3400147656, 903404810, 3349306880, 0),
  makePet('Huge Jungle Golem', '125686962742036', 'Huge', H, 203617279, 188544705, 1319846550, 0, 0, 0),
  makePet('Huge Classic Dragon', '18883372375', 'Huge', H, 201054087, 0, 995124576, 777439427, 0, 0),
  makePet('Huge Evolved Pterodactyl', '14976427082', 'Huge', H, 200919944, 0, 700153059, 965348429, 0, 0),
  makePet('Huge Divinus', '18152335113', 'Huge', H, 198815766, 75587035, 665644508, 391365720, 1044410334, 0),
  makePet('Huge Abstract Dominus', '138676503703270', 'Huge', H, 189869317, 83999809, 386800258, 476610589, 1474066769, 10000000000),
  makePet('Huge Snuggle Beast', '121269844135033', 'Huge', H, 193736910, 0, 1783381531, 1053030434, 0, 0),
  makePet('Huge Pirate Parrot', '14976518880', 'Huge', H, 192698176, 293403707, 1835635178, 1294719289, 150000, 0),
  makePet('Huge Starry Owl', '75830065128767', 'Huge', H, 192509365, 328556609, 4814566487, 0, 0, 0),
  makePet('Huge Panther', '127123894075183', 'Huge', H, 199467544, 399121263, 2578800277, 4511991800, 3200000000, 0),
  makePet('Huge Ancient Dragon', '18626986876', 'Huge', H, 182275977, 129163089, 1223866803, 856902190, 6553216000, 0),
  makePet('Huge Bejeweled Lion', '17450309030', 'Huge', H, 191829527, 0, 0, 2033471370, 0, 0),
  makePet('Huge Triceratops', '18758757156', 'Huge', H, 191711502, 293704186, 3746317476, 0, 0, 0),
  makePet('Huge Prison Cow', '79315838011992', 'Huge', H, 175613721, 256941691, 0, 0, 0, 0),
  makePet('Huge Angel Cow', '136952666611096', 'Huge', H, 175788687, 326177216, 3558540313, 0, 0, 0),
  makePet('Huge Umbrella Cat', '14976572705', 'Huge', H, 189762916, 690204204, 3760108651, 1510918455, 0, 0),
  makePet('Huge Jurassic Beaver', '97754526096215', 'Huge', H, 180542695, 0, 0, 1318617766, 0, 0),
  makePet('Huge Diamond Dog', '16250896717', 'Huge', H, 182302656, 629503653, 2881520756, 1936919270, 13200000000, 0),
  makePet('Huge Sprout Wyrmling', '117238217692099', 'Huge', H, 137197320, 402321346, 956946795, 0, 0, 0),
  makePet('Huge Stargazing Wolf', '17602431693', 'Huge', H, 185006674, 0, 1090939358, 764153188, 0, 9832000000),
  makePet('Huge Empyrean Agony', '14976421040', 'Huge', H, 179733856, 119230744, 1644069339, 1774048292, 1958498878, 0),
  makePet('Huge Dot Matrix Cat', '118273434697077', 'Huge', H, 173299335, 0, 1418834759, 831031074, 0, 5548000000),
  makePet('Huge Kawaii Tiger', '18539512677', 'Huge', H, 179887575, 180815028, 1369747373, 4259427686, 762600000000, 0),
  makePet('Huge Googly Corgi', '127100039471519', 'Huge', H, 185676471, 0, 1171478880, 828755746, 0, 0),
  makePet('Huge Masked Owl', '14976487652', 'Huge', H, 174126320, 177744399, 1291214587, 2038698670, 140311520000, 0),
  makePet('Huge Forged Cyclops', '108970973027495', 'Huge', H, 172325460, 0, 0, 0, 0, 0),
  makePet('Huge Unicorn Dragon', '15163489495', 'Huge', H, 175258138, 0, 1127606258, 7871735684, 0, 0),
  makePet('Huge Red Fluffy', '14976533036', 'Huge', H, 172556576, 349754237, 1934840662, 787978933, 7041568000, 0),
  makePet('Huge Dove', '14976414513', 'Huge', H, 167964735, 325468194, 6241115042, 3901925397, 0, 0),
  makePet('Huge Yin-Yang Dragon', '139547008385454', 'Huge', H, 176495095, 0, 1219456576, 643351118, 0, 0),
  makePet('Huge Totem Cat', '94635272523111', 'Huge', H, 165547819, 0, 1501787681, 623336748, 0, 6043840000),
  makePet('Huge Pot of Gold Corgi', '106744072159762', 'Huge', H, 162043923, 329666583, 2301288554, 0, 0, 0),
  makePet('Huge Kawaii Dragon', '14976470932', 'Huge', H, 165245313, 126960968, 1524110002, 1451389156, 2150598004, 0),
  makePet('Huge Evolved King Cobra', '14976426069', 'Huge', H, 165596214, 0, 1109470874, 2209472173, 0, 0),
  makePet('Huge Classic Dog', '18883372166', 'Huge', H, 155071400, 0, 515318205, 540590215, 0, 10948800000),
  makePet('Huge Cheerful Yeti', '14976375591', 'Huge', H, 163169385, 178270055, 1215362883, 1790632043, 0, 51307604480),
  makePet('Huge Kaiju Sea Dragon', '77556334425969', 'Huge', H, 168436276, 0, 939964550, 639914405, 0, 29500000000),
  makePet('Huge Stargazing Axolotl', '17602432142', 'Huge', H, 159012402, 0, 1045607512, 756288435, 0, 0),
  makePet('Huge Tech Chest Mimic', '14976490534', 'Huge', H, 154991828, 122430345, 855274724, 756546571, 2302079510, 0),
  makePet('Huge Evolved Peacock', '14976426399', 'Huge', H, 154135495, 0, 775978294, 725257735, 0, 10471040000),
  makePet('Huge Midnight Zebra', '137637076572981', 'Huge', H, 156088585, 0, 7980414279, 1103869214, 0, 0),
  makePet('Huge Skeleton Shark', '87082066811704', 'Huge', H, 146283733, 229152112, 805201883, 6386103382, 0, 0),
  makePet('Huge Sketch Corgi', '17027110720', 'Huge', H, 155654745, 0, 1127415392, 457477299, 0, 0),
  makePet('Huge Valkyrie Dog', '18465101315', 'Huge', H, 155043657, 0, 1890375392, 1577210926, 0, 19865600000),
  makePet('Huge Jelly Kitsune', '98444936936302', 'Huge', H, 149330639, 83370570, 469230005, 871385241, 2230129080, 0),
  makePet('Huge Storm Axolotl Ball', '123709369335154', 'Huge', H, 150355678, 120973807, 605153542, 2221166187, 0, 0),
  makePet('Huge Hydra Dino', '18741937148', 'Huge', H, 152756023, 80556499, 358179255, 1078216420, 4295872000, 0),
  makePet('Huge Night Terror Cat', '17451173023', 'Huge', H, 156675986, 136774318, 492529445, 426213602, 956700698, 142181542875),
  makePet('Huge Bubble Hydra', '88580020696117', 'Huge', H, 152486915, 112855283, 861780655, 3146722253, 0, 0),
  makePet('Huge Flex Tiger', '18127488955', 'Huge', H, 150109658, 0, 773645364, 685783889, 0, 25000000000),
  makePet('Huge Runebound Bobcat', '75929351206941', 'Huge', H, 139366916, 601222389, 291936639, 422654087, 835000000000, 40999200000),
  makePet('Huge Treasure Turtle', '18556268254', 'Huge', H, 147369482, 255737173, 1104728691, 2132237710, 0, 2132237710),
  makePet('Huge Soul Cat', '114453311306931', 'Huge', H, 143181504, 0, 1144337989, 730904626, 0, 26131776000),
  makePet('Huge Nightmare Dog', '78024171936128', 'Huge', H, 148063180, 87134354, 984033069, 185200081204, 0, 0),
  makePet('Huge Watermelon Golem', '79014602144468', 'Huge', H, 144648717, 112091888, 594243620, 142818974659, 7400000000, 0),
  makePet('Huge Toy Duck', '118862307433647', 'Huge', H, 143189562, 139032121, 396498674, 989473910, 6292125440, 0),
  makePet('Huge Tarantula', '124339060912566', 'Huge', H, 141769862, 133586278, 809689884, 0, 0, 0),
  makePet('Huge Devil Agony', '18256894534', 'Huge', H, 142169436, 83361890, 853110112, 3987930519, 3488720118, 0),
  makePet('Huge Graffiti Raccoon', '120010094799102', 'Huge', H, 140830939, 174387770, 1592674426, 0, 0, 0),
  makePet('Huge Luchador Eagle', '92111973498255', 'Huge', H, 133770802, 0, 4742060282, 1125937994, 0, 0),
  makePet('Huge Patchwork Teddy Bear', '101792961428557', 'Huge', H, 136662794, 0, 1656003054, 1401684822, 0, 0),
  makePet('Huge Masked Fox', '17749184083', 'Huge', H, 133990189, 109830187, 438282327, 2094162577, 2517833830, 0),
  makePet('Huge Fragmented Pterodactyl', '89915786412548', 'Huge', H, 96096150, 324781805, 0, 0, 0, 0),
  makePet('Huge Chameleon', '14976375382', 'Huge', H, 131788804, 367315305, 2680183078, 1816470284, 0, 0),
  makePet('Huge Blazing Shark', '17749190912', 'Huge', H, 136313758, 0, 801957844, 486684793, 0, 0),
  makePet('Huge Pot of Gold Cat', '123890112908568', 'Huge', H, 129854489, 90890331, 551488898, 751462600, 10078913828, 0),
  makePet('Huge Chef Monkey', '14976376567', 'Huge', H, 130403943, 285679275, 321106660, 590656093, 11926399840, 5483450150),
  makePet('Huge Electric Cat', '16914837316', 'Huge', H, 126823551, 115933466, 512499134, 0, 0, 0),
  makePet('Huge Hypnotic Cat', '111380702185705', 'Huge', H, 125296286, 0, 968053502, 753237733, 0, 8611111110),
  makePet('Huge Robber Cat', '17604035571', 'Huge', H, 126715613, 264397640, 657752659, 1782427093, 0, 0),
  makePet('Huge Mucki', '126924768939379', 'Huge', H, 121931573, 594505099, 1231503945, 2487952136, 0, 0),
  makePet('Huge Purple Dragon', '16251004392', 'Huge', H, 115362605, 0, 1004899768, 1090515563, 0, 0),
  makePet('Huge Bejeweled Unicorn', '17450309349', 'Huge', H, 124682346, 0, 788751883, 544618553, 0, 0),
  makePet('Huge Devil Dominus', '18256894835', 'Huge', H, 125354557, 71216813, 316444459, 488920198, 1186184362, 7552864000),
  makePet('Huge Raptor', '18758705093', 'Huge', H, 120559847, 157645359, 783993046, 24641324374, 0, 0),
  makePet('Huge Nightmare Sludge', '100374100910394', 'Huge', H, 123027643, 0, 565684017, 917684793, 0, 4100567101),
  makePet('Huge Tiedye Corgi', '14976569398', 'Huge', H, 118034609, 214261157, 865211850, 987256448, 5769982062, 0),
  makePet('Huge Honey Golem', '137790687877183', 'Huge', H, 119571499, 94571899, 490852197, 2663012320, 4767202833, 0),
  makePet('Huge Pixel Tiger', '91955794019105', 'Huge', H, 117350445, 84070979, 744914023, 0, 0, 0),
  makePet('Huge Chad Elephant', '125515994456210', 'Huge', H, 120507501, 0, 966263856, 523716838, 0, 0),
  makePet('Huge Exquisite Cat', '14976427289', 'Huge', H, 122401659, 156007289, 897500141, 516073693, 3303311801, 0),
  makePet('Huge Easter Golem', '98455133654568', 'Huge', H, 114687682, 0, 518598901, 819729669, 0, 4295943757),
  makePet('Huge Pixie Bee', '87836274620619', 'Huge', H, 120817025, 197479610, 2912274909, 189595040000, 0, 0),
  makePet('Huge Cupid Corgi', '14976389349', 'Huge', H, 114130494, 54610877, 406188949, 367771047, 482385948, 0),
  makePet('Huge Virus Griffin', '17857638038', 'Huge', H, 117108952, 148965736, 710269403, 889834193, 8414097818, 0),
  makePet('Huge Clover Fairy', '16744695511', 'Huge', H, 113378391, 217206187, 769626549, 628164920, 0, 0),
  makePet('Huge Yin-Yang Bunny', '75417612099373', 'Huge', H, 118548065, 0, 1559050908, 811526026, 0, 6989833258),
  makePet('Huge Party Axolotl', '14976508713', 'Huge', H, 108305655, 212899522, 1106780160, 548199632, 2932840942, 0),
  makePet('Huge Treasure Golem', '77267608223080', 'Huge', H, 114826771, 0, 667607890, 556540436, 0, 3664076793),
  makePet('Huge Werewolf', '99136154252309', 'Huge', H, 115152579, 126807794, 812598178, 0, 0, 0),
  makePet('Huge Meebo The Alien Ball', '105987856358688', 'Huge', H, 110351247, 116077713, 644895252, 3409928545, 6424000000, 0),
  makePet('Huge Scary Cat', '15281988446', 'Huge', H, 105710361, 117677349, 566865961, 0, 0, 0),
  makePet('Huge Dark Dragon', '74325129208178', 'Huge', H, 110900293, 180101669, 574599477, 2012988200, 0, 0),
  makePet('Huge Leprechaun Corgi', '121626640440926', 'Huge', H, 106552443, 78806689, 525817281, 0, 0, 0),
  makePet('Huge Marshmallow Agony', '14976486981', 'Huge', H, 105846814, 163949139, 485456662, 451273255, 1154820787, 0),
  makePet('Huge Gingerbread Angelus', '137630213066675', 'Huge', H, 107408635, 96416911, 652261593, 1737964316, 2914873244, 27000000000),
  makePet('Huge Doodle Fairy', '14976404766', 'Huge', H, 108428523, 112064786, 574217397, 534776019, 2609769148, 0),
  makePet('Huge Elf Dog', '14976420144', 'Huge', H, 105438894, 399949136, 632984471, 457871431, 2542211334, 6620000000),
  makePet('Huge Painted Cat', '14976507206', 'Huge', H, 105022130, 67510737, 410471422, 1140116029, 453136713, 0),
  makePet('Huge Kitsune Fox', '18352502490', 'Huge', H, 109088277, 45376166, 384857969, 305073403, 744631527, 0),
  makePet('Huge Blossom Spirit', '91486613555331', 'Huge', H, 101694490, 0, 592930158, 979543977, 0, 6900000000),
  makePet('Huge Error Cat', '14976424262', 'Huge', H, 102785917, 77101997, 443379679, 487160549, 1170866741, 0),
  makePet('Huge Fireball Cat', '106665613932679', 'Huge', H, 101854983, 69157630, 398545050, 537226758, 2289546151, 0),
  makePet('Huge Jester Dog', '16746769132', 'Huge', H, 104968938, 0, 619179849, 443165590, 0, 7805420257),
  makePet('Huge Hi-Tech Tiger', '16472006999', 'Huge', H, 101238844, 135740109, 749113574, 0, 0, 0),
  makePet('Huge Clover Unicorn', '14976383846', 'Huge', H, 102509675, 119206893, 500469991, 1301033890, 2349793588, 4700831856),
  makePet('Huge Ducky Magician', '113798399729190', 'Huge', H, 97220278, 90787549, 942812058, 624129061, 0, 0),
  makePet('Huge UV Kitsune', '18351655777', 'Huge', H, 101035024, 57429142, 321634145, 451521900, 2925831414, 0),
  makePet('Huge Spectral Deer', '72961994800686', 'Huge', H, 99050117, 111114697, 1665094112, 1619712641, 3697599800, 0),
  makePet('Huge Leprechaun Kitsune', '100650487607408', 'Huge', H, 99666538, 65440885, 346820306, 0, 0, 0),
  makePet('Huge Fire Horse', '15480654527', 'Huge', H, 100085599, 162342490, 1221137904, 0, 0, 0),
  makePet('Huge Easter Dominus', '14976417278', 'Huge', H, 101099022, 218504255, 511827071, 324796086, 722947603, 1069584001),
  makePet('Huge Crystal Dog', '14976388450', 'Huge', H, 97737871, 84089264, 639956531, 337950688, 2868860274, 0),
  makePet('Huge Soccer Terrier', '78064428614816', 'Huge', H, 97100931, 228436237, 619676225, 353754107267, 0, 0),
  makePet('Huge Witch Wolf', '133897914197133', 'Huge', H, 97834837, 72138884, 540620180, 904312556, 1864799872, 0),
  makePet('Huge Evil Snowman', '117577340597461', 'Huge', H, 96995311, 84749918, 273817966, 994166634, 0, 31832000000),
  makePet('Huge Pixel Monkey', '80158581180196', 'Huge', H, 95220011, 108724601, 391859388, 1840048585, 0, 0),
  makePet('Huge Lucki Golem', '82253634531547', 'Huge', H, 92718536, 127383278, 486335652, 719407805, 1388852683, 0),
  makePet('Huge Love Peacock', '126019438810546', 'Huge', H, 93702280, 64472988, 303015470, 826819562, 800000000, 0),
  makePet('Huge Mosaic Griffin', '14976494343', 'Huge', H, 92236265, 83072971, 507389165, 321561867, 5789559276, 8369167360),
  makePet('Huge Egg Chick', '135817707784435', 'Huge', H, 92689063, 84327272, 277138620, 1507175128, 5628504320, 0),
  makePet('Huge Poseidon Dog', '14976526838', 'Huge', H, 93016863, 247956311, 547520621, 0, 0, 0),
  makePet('Huge Tiedye Cat', '14976568867', 'Huge', H, 92675702, 318085122, 1217047127, 1183464617, 71102605357, 63760000000),
  makePet('Huge Turtle', '14976572325', 'Huge', H, 91105989, 233359957, 2598081012, 776965029, 0, 0),
  makePet('Huge Luchador Coyote', '111458078240780', 'Huge', H, 91490307, 0, 681303145, 504566372, 0, 0),
  makePet('Huge Scary Corgi', '15281988264', 'Huge', H, 90382344, 95967282, 630097510, 13101056000, 0, 0),
  makePet('Huge Floatie Penguin', '90846690350439', 'Huge', H, 91130187, 332693280, 1608039070, 0, 0, 0),
  makePet('Huge Flex Fluffy Cat', '18127488650', 'Huge', H, 93239112, 0, 620022733, 394276739, 0, 17807984000),
  makePet('Huge Cappuccina Brainrot', '110814000442591', 'Huge', H, 87870561, 0, 603287319, 379070548, 0, 360435200000),
  makePet('Huge Wishing Dragon', '106906458368266', 'Huge', H, 90729104, 0, 328319138, 531770835, 0, 2733760000),
  makePet('Huge Coach Tiger', '72728231743832', 'Huge', H, 89964386, 101942200, 307731158, 2260982123, 10518048251, 0),
  makePet('Huge Elf Cat', '14976419865', 'Huge', H, 91259056, 141555331, 427302736, 354079497, 3352343355, 0),
  makePet('Huge Disco Ball Dragon', '18458208582', 'Huge', H, 88948147, 79466706, 464293160, 566382617, 2420513400, 0),
  makePet('Huge Enchanted Deer', '14976423228', 'Huge', H, 90691014, 61766997, 436497583, 331676953, 870020910, 0),
  makePet('Huge Love Lion', '123099034281785', 'Huge', H, 86612535, 200830855, 396942120, 0, 0, 0),
  makePet('Huge Leprechaun Cat', '14976475596', 'Huge', H, 88415596, 60125985, 426502721, 296174327, 482846643, 0),
  makePet('Huge Special Ops Dog', '88026158372953', 'Huge', H, 84546782, 0, 852095863, 551982526, 0, 4987914235),
  makePet('Huge Strawberry Corgi', '15634002728', 'Huge', H, 85529749, 0, 517822871, 397436060, 0, 306551403383),
  makePet('Huge Evolved Icy Phoenix', '137094796065163', 'Huge', H, 86519452, 0, 738404884, 700038006, 0, 302852906916),
  makePet('Huge Wave Spirit', '101464830006395', 'Huge', H, 85861367, 0, 1271575313, 725097989, 0, 3821353269),
  makePet('Huge Boxing Elephant', '110943916892100', 'Huge', H, 86810082, 67390141, 764063821, 1146736148, 132480000000, 0),
  makePet('Huge Arcade Angelus', '119811643774598', 'Huge', H, 85516571, 83934503, 492633495, 636215047, 2675200000, 0),
  makePet('Huge Easter Angelus', '102295861032789', 'Huge', H, 82933953, 80876429, 654809189, 791747057, 5605600000, 0),
  makePet('Huge Pixel Yeti', '131996280038414', 'Huge', H, 84245840, 107866716, 695677105, 1586655355, 4515279885, 0),
  makePet('Huge Luau Cat', '14976477787', 'Huge', H, 84047155, 306144074, 1204774976, 1408393335, 0, 0),
  makePet('Huge Slasher Sloth', '115427285712502', 'Huge', H, 84568198, 0, 1375563700, 787829411, 0, 637103872000),
  makePet('Huge Tiedye Axolotl', '14976567779', 'Huge', H, 82465488, 163694941, 907984900, 398372426, 2966614716, 0),
  makePet('Huge Jolly Owl', '103505479597539', 'Huge', H, 82596527, 116528557, 875130399, 4619632508, 0, 0),
  makePet('Huge Evolved Hell Rock', '14976425869', 'Huge', H, 82689802, 0, 339244806, 916411972, 0, 2853778970),
  makePet('Huge Gym Scorpion', '82303153411870', 'Huge', H, 81832076, 779384649, 603038830731, 321222353611, 321222353611, 0),
  makePet('Huge Origami Shark', '89090934657295', 'Huge', H, 77445451, 0, 678156223, 442522197, 0, 4049590209),
  makePet('Huge Evolved Elephant', '94951927058710', 'Huge', H, 79901173, 0, 255921408, 640521257, 0, 9445980416),
  makePet('Huge Dark Lord', '18152338133', 'Huge', H, 81104864, 51716370, 399023873, 311191879, 0, 9833138368),
  makePet('Huge Luxe Axolotl', '96174972080942', 'Huge', H, 64387737, 119805369, 511151196, 691193524, 0, 0),
  makePet('Huge Cyborg Dragon', '14976392605', 'Huge', H, 79572545, 300862881, 1109845993, 904099493, 4670025419, 0),
  makePet('Huge Totem Wolf', '130997023659211', 'Huge', H, 80657376, 0, 734204402, 904639221, 0, 0),
  makePet('Huge Hacked Reaper', '119356588704518', 'Huge', H, 78498767, 118786303, 545222828, 923647547, 1786855608, 0),
  makePet('Huge Ghost Axolotl', '78816523921536', 'Huge', H, 79909010, 199747783, 1585171188, 0, 0, 0),
  makePet('Huge Hell Monkey', '75557706152622', 'Huge', H, 79294932, 122301035, 600958471, 0, 0, 0),
  makePet('Huge Mosaic Corgi', '14976493326', 'Huge', H, 77486346, 85135444, 430458094, 412812948, 830124466, 0),
  makePet('Huge Guard Hydra', '79622017350328', 'Huge', H, 80378146, 65855413, 305353602, 867130476, 23331006080, 2494848000),
  makePet('Huge Atomic Axolotl', '17515613028', 'Huge', H, 79226945, 160305451, 763007829, 5634997510, 9400000000, 0),
  makePet('Huge Pixel Dragon', '14976521054', 'Huge', H, 79057216, 305347322, 593629694, 438243782, 0, 0),
  makePet('Huge Platypus', '81423443378217', 'Huge', H, 60450249, 99626006, 356768516, 707061909, 0, 0),
  makePet('Huge Meebo in a Spaceship', '14976488429', 'Huge', H, 78335856, 103187907, 573120488, 3022904909, 0, 0),
  makePet('Huge Party Crown Hippomelon', '105303258618878', 'Huge', H, 79701124, 87494591, 544994186, 2388016039, 3410880000, 0),
  makePet('Huge Guard Dragon', '106968856805193', 'Huge', H, 77248591, 74012918, 287779420, 968306605, 1725131280, 0),
  makePet('Huge Pineapple Cat', '14976517235', 'Huge', H, 75461190, 95918227, 410616241, 531998805, 910098131, 1371840000),
  makePet('Huge Evolved Kangaroo', '80169939922601', 'Huge', H, 77368704, 0, 272660970, 335606821, 0, 0),
  makePet('Huge Easter Agony', '117110951312046', 'Huge', H, 75066160, 70939972, 344448002, 1794140221, 1868859136, 4492096000),
  makePet('Huge Jetpack Cat', '112353118554284', 'Huge', H, 75799279, 65798501, 442990137, 2039789815, 0, 0),
  makePet('Huge Jurassic Crocodile', '116989921255882', 'Huge', H, 74665668, 0, 562323512, 396973472, 0, 0),
  makePet('Huge Naughty Dominus', '75328747799299', 'Huge', H, 76291318, 0, 1271816504, 565312659, 0, 0),
  makePet('Huge Trojan Horse', '127674627495853', 'Huge', H, 75456114, 178021870, 408389173, 0, 0, 0),
  makePet('Huge Super Coral Axolotl', '123726574453022', 'Huge', H, 74644275, 0, 941430879, 805655683, 0, 0),
  makePet('Huge Pumpkin Dog', '71270630021360', 'Huge', H, 74797366, 73156216, 322965814, 332198169, 1370775090, 7329447680),
  makePet('Huge Plague Dragon', '17375065126', 'Huge', H, 76154563, 70197712, 300969886, 253114939, 698234158, 3742436784),
  makePet('Huge Sleigh Axolotl', '77508464202964', 'Huge', H, 73036170, 0, 575323680, 502768534, 0, 3432562420),
  makePet('Huge Electric Werewolf', '126966146144158', 'Huge', H, 74228119, 82829476, 327771639, 405174922, 3067120000, 0),
  makePet('Huge Elf Golem', '119266692715617', 'Huge', H, 74181210, 97485848, 745121548, 0, 0, 0),
  makePet('Huge LeGoat Ball', '85572580085074', 'Huge', H, 74889269, 0, 795448106, 399423765, 0, 0),
  makePet('Huge Patchwork Bunny', '120785546705705', 'Huge', H, 74176393, 0, 480319788, 483944243, 0, 12410886279),
  makePet('Huge Easter Bunny', '14976566967', 'Huge', H, 73136456, 138247915, 1291736451, 427988592, 2434524319, 0),
  makePet('Huge Tiedye Bunny', '14976568628', 'Huge', H, 73860093, 146306307, 789971733, 584376616, 2148534861, 0),
  makePet('Huge Enchanted Dog', '98036079803445', 'Huge', H, 75064867, 144947624, 1926537613, 1863951159, 0, 0),
  makePet('Huge Chef Cat', '15281989941', 'Huge', H, 73301570, 0, 0, 0, 0, 0),
  makePet('Huge Chill Sloth', '120533708082734', 'Huge', H, 73696163, 79207050, 304963177, 1024484706, 0, 0),
  makePet('Huge Evolved Bison', '98184057731755', 'Huge', H, 73595623, 0, 224397551, 619395324, 0, 11421470720),
  makePet('Huge Rose Cat', '103846288511073', 'Huge', H, 74391576, 55080817, 349315398, 1041469614, 2163119368, 0),
  makePet('Huge Holiday Pegasus', '15716049550', 'Huge', H, 73370933, 0, 991856473, 558428025, 0, 0),
  makePet('Huge Pastel Sock Bear', '84261728017151', 'Huge', H, 73209610, 91256771, 1095261337, 0, 0, 0),
  makePet('Huge Inferno Stealth Bobcat', '18644411865', 'Huge', H, 66411697, 80214626, 341513839, 309063371, 1269624119, 0),
  makePet('Huge Doodle Dragon', '103476619059265', 'Huge', H, 72396862, 80325041, 431177013, 997262023, 37136000000, 0),
  makePet('Huge Naughty Cat', '87910318681243', 'Huge', H, 69988527, 168853642, 2875627483, 0, 0, 0),
  makePet('Huge Goldfish', '95752779695636', 'Huge', H, 46092143, 101729855, 530133940, 495385600, 0, 0),
  makePet('Huge Guard Wolf', '120663531720305', 'Huge', H, 71062407, 85584182, 363882989, 0, 0, 0),
  makePet('Huge Jolly Penguin', '14976469674', 'Huge', H, 70454834, 83159300, 397537878, 399997859, 827174406, 3383040000),
  makePet('Huge Police Cat', '17588549479', 'Huge', H, 69657070, 109370033, 370693689, 0, 0, 0),
  makePet('Huge Parrot', '106937805162090', 'Huge', H, 67969459, 45829900, 286777606, 2606534024, 0, 47310400000),
  makePet('Huge Garden Goblin', '97942779030547', 'Huge', H, 53426370, 47581328, 177530003, 0, 0, 0),
  makePet('Huge Shadow Dominus', '15804010569', 'Huge', H, 69231781, 40247261, 194671000, 111793852, 276131874, 2248001131),
  makePet('Huge Mech Dino', '18673257007', 'Huge', H, 68761539, 42748308, 216026785, 318586570, 2995362304, 5910574878),
  makePet('Huge Leafstorm Wolf', '139340972718086', 'Huge', H, 68556992, 0, 745532522, 603927898, 0, 15840000000),
  makePet('Huge Guest Noob', '14976448855', 'Huge', H, 69646056, 60356220, 226940887, 294369799, 2139759636, 2072063980),
  makePet('Huge Snowflake Dominus', '83373370051521', 'Huge', H, 68584872, 55144185, 213845647, 130424735, 0, 0),
  makePet('Huge Flamethrower Spider', '73032919339096', 'Huge', H, 69184088, 179988156, 647653910, 2413223424, 0, 0),
  makePet('Huge Good vs Evil Cat', '18155109260', 'Huge', H, 69859452, 98696428, 705646667, 0, 0, 0),
  makePet('Huge Atomic Forged Shark', '18978050454', 'Huge', H, 69631079, 63330559, 322272564, 339786912, 1744218872, 0),
  makePet('Huge Jaguar', '121900456724248', 'Huge', H, 67561349, 434366972, 3005697527, 2291156395, 0, 0),
  makePet('Huge Lucki Angelus', '139803624702732', 'Huge', H, 68398883, 54922081, 423437451, 358960848, 1614942732, 7160016000),
  makePet('Huge Skeleton', '14976548258', 'Huge', H, 67810090, 97571648, 719936166, 531373023, 3851580071, 0),
  makePet('Huge Candycane', '103105073784990', 'Huge', H, 66609946, 63389565, 341493590, 556352671, 3786711183, 0),
  makePet('Huge Carnival Panda', '92219735800314', 'Huge', H, 57674618, 199029343, 1590060794, 0, 0, 0),
  makePet('Huge Candycane Kitsune', '74407552054754', 'Huge', H, 64246389, 62767053, 291090540, 303635283, 1547952400, 7256010427),
  makePet('Huge Crash Dummy Noob', '138395333405462', 'Huge', H, 65604099, 122945980, 770238511, 0, 0, 0),
  makePet('Huge Shattered Heart Agony', '129768641287127', 'Huge', H, 65042063, 69036270, 325282527, 523578032, 1686885276, 0),
  makePet('Huge Pterodactyl', '14976527837', 'Huge', H, 63513754, 102598190, 357436023, 296994988, 7292833280, 0),
  makePet('Huge Arcade Dragon', '16756391066', 'Huge', H, 61016181, 294092915, 2750461331, 0, 0, 0),
  makePet('Huge Librarian Beaver', '103600701852967', 'Huge', H, 62575423, 82910208, 487994857, 0, 0, 0),
  makePet('Huge Hell Rock', '14976455394', 'Huge', H, 61390421, 53293429, 250539994, 8088166400, 0, 0),
  makePet('Huge Raining Love Dog', '73797455811877', 'Huge', H, 63344462, 56876612, 458919235, 0, 0, 0),
  makePet('Huge Evolved Easter Lamb', '114656946868089', 'Huge', H, 61097070, 0, 596441664, 418678593, 0, 0),
  makePet('Huge Ooze Corgi', '140383295631296', 'Huge', H, 61642775, 169441540, 326940199, 13562419646, 0, 0),
  makePet('Huge Sage Axolotl', '18256895424', 'Huge', H, 62825401, 54825387, 420482111, 1817265206, 4920850304, 0),
  makePet('Huge Pumpkin Scarecrow', '116673779811156', 'Huge', H, 62692729, 108743718, 390877339, 668345549, 1961811026, 12697600000),
  makePet('Huge Minecart Piggy', '106752259915805', 'Huge', H, 61566015, 138513671, 336621522, 1312628272, 18631888450, 0),
  makePet('Huge Stealth Bobcat', '14976557639', 'Huge', H, 60377180, 101262367, 565111655, 279351407, 6878116538, 6654080000),
  makePet('Huge Withered Agony', '127219457030426', 'Huge', H, 49221913, 40803898, 299726890, 1457392818, 1457392818, 0),
  makePet('Huge Clover Lion', '123334593122447', 'Huge', H, 60896465, 80232106, 449957533, 0, 0, 0),
  makePet('Huge Evil Kitsune', '122958548174928', 'Huge', H, 59551987, 0, 0, 0, 0, 0),
  makePet('Huge Beans Balloon Cat', '14976361583', 'Huge', H, 58651391, 0, 0, 0, 0, 0),
  makePet('Huge Lucki Monkey', '114063062613222', 'Huge', H, 59866033, 68129131, 248726528, 787525164, 5377440000, 0),
  makePet('Huge Knight Slime', '93884562630486', 'Huge', H, 59320815, 122225729, 1162507657, 25295378003, 0, 0),
  makePet('Huge Inferno Stealth Cat', '18644412090', 'Huge', H, 59744057, 86263910, 330498861, 244691697, 3305773242, 8357011968),
  makePet('Huge Stealth Dragon', '14976557966', 'Huge', H, 58689173, 50006003, 477071085, 256043456, 885970944, 127388131224),
  makePet('Huge Scarecrow Cat', '14976543713', 'Huge', H, 56520364, 81683580, 456060682, 0, 0, 0),
  makePet('Huge Sloth', '77873746102691', 'Huge', H, 58801478, 138017335, 344958669, 803880648, 2900000000, 18550400000),
  makePet('Huge Krampus', '127076260732138', 'Huge', H, 59009838, 66454334, 502639970, 888718639, 3221441949, 27235200000),
  makePet('Huge Honey Bear', '83794143197410', 'Huge', H, 59352759, 0, 574918019, 284499413, 0, 10583467776),
  makePet('Huge Warrior Wolf', '18256895705', 'Huge', H, 57932583, 87529043, 244974549, 372195938, 6935090742, 0),
  makePet('Huge Autumn Red Panda', '119442470085082', 'Huge', H, 57270614, 64761213, 200828157, 464365951, 5085591040, 0),
  makePet('Huge Evolved Rogue Squid', '88584631141101', 'Huge', H, 58670303, 0, 467140687, 491087903, 0, 0),
  makePet('Huge Obsidian Griffin', '105493952601280', 'Huge', H, 58551313, 120211115, 326779922, 321590870, 2288256000, 10443740928),
  makePet('Huge Bearserker', '14976362435', 'Huge', H, 58242082, 133724750, 304188789, 768940585, 0, 0),
  makePet('Huge Baby Kitten', '108106366016899', 'Huge', H, 58257810, 61435787, 246288208, 428382185, 2387069592, 3107879633),
  makePet('Huge Lumi Axolotl', '16410740491', 'Huge', H, 55657068, 80021519, 400389760, 0, 0, 0),
  makePet('Huge Royal Pooka', '80049481266814', 'Huge', H, 57485237, 17940807, 1211748148, 0, 0, 0),
  makePet('Huge Yee-haw Cat', '85182651602746', 'Huge', H, 58824047, 155365083, 224369323, 330166800, 2835871038, 12543487989),
  makePet('Huge Evolved Frankenpup Dog', '85621910541891', 'Huge', H, 57444831, 0, 804892974, 450777810, 0, 0),
  makePet('Huge Abomination', '70697028891589', 'Huge', H, 57408648, 63070394, 262502351, 530092387, 969340633, 6865445888),
  makePet('Huge Rich Cat', '16744715368', 'Huge', H, 55285174, 44013372, 318404240, 367315956, 1013550163, 45455353600),
  makePet('Huge Toy Chest Mimic', '111386850399193', 'Huge', H, 56081832, 37679235, 176700376, 97367751, 396052611, 2749942839),
  makePet('Huge Evolved Player Fox', '88581357457195', 'Huge', H, 58192252, 0, 366407756, 685336239, 0, 5667200000),
  makePet('Huge Pastel Elephant', '16498745846', 'Huge', H, 56489448, 216486250, 414636812, 300614828, 0, 0),
  makePet('Huge King Cobra', '14976472289', 'Huge', H, 55995692, 184736624, 294207696, 787020597, 4000000000, 0),
  makePet('Huge Pristine Snake', '18556267952', 'Huge', H, 54656288, 177282378, 213073105, 413985160, 0, 3161956832),
  makePet('Huge Evil Imp', '18150534002', 'Huge', H, 54306627, 43580514, 252153664, 337288175, 820097888, 0),
  makePet('Huge Super Spider', '118018926499852', 'Huge', H, 54799747, 0, 392153066, 480000732, 0, 0),
  makePet('Huge Aura Fox', '102863074844102', 'Huge', H, 54884006, 860989787, 332559766, 362918066, 9760251379, 24942437753),
  makePet('Huge Valentines Dominus', '79026289241532', 'Huge', H, 54697269, 0, 0, 0, 0, 0),
  makePet('Huge Clover Butterfly', '111786177414558', 'Huge', H, 54023111, 0, 499512938, 1071635641, 0, 8931757252),
  makePet('Huge Gecko', '14976440578', 'Huge', H, 51104878, 132744147, 485188908, 396524937, 0, 0),
  makePet('Huge Hell Spider', '92181296313546', 'Huge', H, 52880228, 73342891, 206414489, 838413150, 9184857600, 0),
  makePet('Huge Bobcat', '117053043329448', 'Huge', H, 51603592, 55788742, 349608875, 1416115859, 188864000000, 29762048000),
  makePet('Huge Avenging Griffin', '18150841344', 'Huge', H, 52797869, 55446078, 500239961, 345790473, 823906675, 4866339757),
  makePet('Huge Mosaic Lamb', '14976494608', 'Huge', H, 53059007, 87994755, 368159655, 267095113, 1014124158, 10213747123),
  makePet('Huge Rave Butterfly', '18458208075', 'Huge', H, 51401107, 71555879, 272838462, 395542263, 1030896004, 4428779776),
  makePet('Huge Evolved Pixel Griffin', '121188358881521', 'Huge', H, 51864431, 0, 423471066, 342894699, 0, 0),
  makePet('Huge Rave Meebo in a Spaceship', '18351654787', 'Huge', H, 52580896, 36898933, 211901372, 237677120, 1012253129, 4989079142),
  makePet('Huge Elemental Phoenix', '106964408163546', 'Huge', H, 51564419, 75014131, 210518708, 254605535, 1974800510, 3247286200),
  makePet('Huge Egg Dino', '18741936725', 'Huge', H, 52312900, 33133355, 143760496, 206094262, 274221414, 2314074392),
  makePet('Huge Crystal Bat', '123270270237540', 'Huge', H, 51186750, 65179753, 375860390, 797152146, 0, 0),
  makePet('Huge Slimezilla', '133814850196289', 'Huge', H, 49753366, 49494895, 185774037, 492885254, 26202539295, 0),
  makePet('Huge Pirate Dog', '128373074804496', 'Huge', H, 52334012, 199995940, 455835455, 896138182, 81700000000, 6886400000),
  makePet('Huge Jelly Wizard', '84699945958141', 'Huge', H, 51006605, 0, 668583474, 714856846, 0, 4423555077),
  makePet('Huge Merry Manatee', '125341685392478', 'Huge', H, 51138732, 130215299, 297002451, 3219336521, 0, 0),
  makePet('Huge Angel Dragon', '118966983027329', 'Huge', H, 51282621, 69944134, 386535471, 816819133, 1483768739, 0),
  makePet('Huge Guard Dominus', '125199678702615', 'Huge', H, 49270125, 36991649, 211391256, 108266645, 0, 0),
  makePet('Huge Sorcerer Bear', '18978051040', 'Huge', H, 50153849, 49442154, 242144113, 181593559, 309101163, 2194870979),
  makePet('Huge Jetpack Tiger', '124866391707961', 'Huge', H, 50765024, 74635572, 326630361, 0, 0, 0),
  makePet('Huge Exquisite Parrot', '14976427729', 'Huge', H, 50135792, 89694640, 502295243, 350848690, 3100283092, 5676930560),
  makePet('Huge Corrupt Butterfly', '18882974863', 'Huge', H, 50395864, 34308054, 223958561, 242440718, 293741820, 2307484523),
  makePet('Huge Lucki Wolf', '98519377335101', 'Huge', H, 48987906, 66296689, 385062069, 626283843, 3500701625, 0),
  makePet('Huge Pixel Corgi', '14976519576', 'Huge', H, 50067608, 50337167, 229750784, 253371813, 854570139, 84734166370),
  makePet('Huge Special Ops Ram', '73165145533261', 'Huge', H, 47803644, 0, 553689223, 302767655, 0, 0),
  makePet('Huge Autumn Retriever', '127760564297635', 'Huge', H, 49168965, 58547118, 193458555, 443361490, 7922224000, 0),
  makePet('Huge Reindeer Agony', '126523808307279', 'Huge', H, 47219851, 103732039, 427287677, 2027565528, 0, 0),
  makePet('Huge Quartz Fox', '129331981737475', 'Huge', H, 47963684, 33723871, 227792158, 525897134, 1028090855, 0),
  makePet('Huge Dino', '108545390694992', 'Huge', H, 45093862, 112309052, 394231666, 200323141, 0, 0),
  makePet('Huge Hacker Axolotl', '17769626736', 'Huge', H, 47556590, 55095498, 210962859, 374755924, 3041456640, 0),
  makePet('Huge Abyssal Axolotl', '16471981261', 'Huge', H, 48018993, 94084838, 656135643, 0, 0, 0),
  makePet('Huge Pixie Fox', '17835929068', 'Huge', H, 47479266, 113753630, 507669646, 1323864404, 7656320000, 0),
  makePet('Huge Demolition Cat', '128405982771054', 'Huge', H, 44913491, 0, 812125167, 496980369, 0, 0),
  makePet('Huge Willow Wisp', '14976579205', 'Huge', H, 46013613, 123388091, 347015418, 237217142, 731691867, 3701128279),
  makePet('Huge Rootkin Fox', '76545663190754', 'Huge', H, 46854601, 141944527, 341252090, 1030241049, 0, 0),
  makePet('Huge Devil Tasmanian', '128236274006069', 'Huge', H, 45872946, 40108506, 435872215, 7695513669, 1982809600, 0),
  makePet('Huge Gym Corgi', '100837906576069', 'Huge', H, 44398346, 0, 417523729, 461035519, 0, 3188800000),
  makePet('Huge Evolved Stingray', '132084946919332', 'Huge', H, 47428120, 0, 390574563, 453255930, 0, 0),
  makePet('Huge Holiday Dove', '109237504369086', 'Huge', H, 46077792, 69811025, 599399985, 0, 0, 0),
  makePet('Huge Knight Golem', '86043823769760', 'Huge', H, 46210101, 100631678, 415686643, 966899512, 0, 0),
  makePet('Huge Evolved Evil Raven', '139468425219654', 'Huge', H, 46451178, 0, 495725864, 308898013, 0, 0),
  makePet('Huge Anime Scorpion', '81320739190462', 'Huge', H, 45357509, 0, 598403938, 529821171, 0, 1000000000000),
  makePet('Huge Leafy Deer', '74179288771824', 'Huge', H, 46547152, 48663597, 598290169, 1392102636, 3061184000, 0),
  makePet('Huge Dino Dog', '18673255790', 'Huge', H, 44447260, 56125429, 230478529, 192314811, 1117604703, 3127953133),
  makePet('Huge Cyber Agony', '16472011675', 'Huge', H, 45714156, 44079691, 222388275, 0, 0, 0),
  makePet('Huge Ice Cube Penguin', '70749719164578', 'Huge', H, 46224509, 0, 403713399, 258392647, 0, 7177034256),
  makePet('Huge Mystical Whale', '128951201901873', 'Huge', H, 45518841, 35070352, 424835714, 5501834557, 1962000000, 0),
  makePet('Huge Pixel Shadow Griffin', '138870297063423', 'Huge', H, 43954487, 96671475, 336728064, 970247473007, 0, 15855443200),
  makePet('Huge Happy Computer', '16472013395', 'Huge', H, 43538671, 53141242, 249376808, 163324157, 298132297, 2063824559),
  makePet('Huge Gym Anteater', '113847537674540', 'Huge', H, 45945887, 58456180, 323266201, 0, 0, 0),
  makePet('Huge Wicked Kirin', '80510335066918', 'Huge', H, 43905141, 39469958, 357031727, 909257810, 0, 0),
  makePet('Huge Hippo', '14976456459', 'Huge', H, 44251099, 237469828, 806572304, 528717909, 2703529984, 0),
  makePet('Huge Peacock', '14976514269', 'Huge', H, 44942819, 81082649, 334907805, 265710208, 435050271, 17140294553),
  makePet('Huge Present Dragon', '78320766313104', 'Huge', H, 46485246, 65972228, 558391233, 3798168001, 35138400000, 0),
  makePet('Huge Gorilla', '107479430028155', 'Huge', H, 41739636, 140106464, 193832528, 409929378, 3701600000, 4936000000),
  makePet('Huge Gym Cow', '110341807315948', 'Huge', H, 43249907, 0, 449356487, 364285756, 0, 0),
  makePet('Huge Evolved Scarecrow Dog', '72439149479995', 'Huge', H, 45458956, 0, 224438418, 207053428, 0, 5276678729),
  makePet('Huge Player Penguin', '121118923201338', 'Huge', H, 44560832, 95361263, 514974462, 0, 0, 0),
  makePet('Huge Gym Beaver', '139877425237704', 'Huge', H, 42633285, 120702477, 199374603, 0, 0, 0),
  makePet('Huge Skelemelon', '139632770230401', 'Huge', H, 41993941, 48229975, 391300595, 2730039846, 1560780700, 0),
  makePet('Huge Alien', '123487033962716', 'Huge', H, 40825519, 79028536, 269470270, 394713085, 0, 0),
  makePet('Huge Treasure Scorpion', '124383446911252', 'Huge', H, 40176532, 0, 402385838, 298287244, 0, 52534189265),
  makePet('Huge Marshmallow Kitsune', '95357265380757', 'Huge', H, 41504372, 41349069, 180286773, 115807072, 819370387, 3035733738),
  makePet('Huge Arcade Meebo in a Spaceship', '72018720220470', 'Huge', H, 40277590, 0, 0, 522981911, 0, 0),
  makePet('Huge Dark Fox', '133312153663051', 'Huge', H, 41585217, 85365780, 202683969, 1158236917, 2235549972, 14000000000),
  makePet('Huge Shuriken Corgi', '18978050838', 'Huge', H, 41310966, 35189632, 169196975, 167243185, 317125644, 2100644512),
  makePet('Huge Nuclear Wild Dog', '18978050650', 'Huge', H, 40656532, 34302758, 170337038, 147116656, 311410396, 2066515354),
  makePet('Huge Bat', '14976360459', 'Huge', H, 40009516, 59861100, 294580755, 194457781, 1593798208, 3024143213),
  makePet('Huge Snow Crab', '115554189574949', 'Huge', H, 40481704, 55592727, 278196158, 1170128778, 5455697095, 16105600000),
  makePet('Huge Ghostly Dragon', '93813808986344', 'Huge', H, 38717546, 0, 430897578, 317498247, 0, 1000000000000),
  makePet('Huge Evolved Mining Penguin', '124239395763286', 'Huge', H, 40929349, 0, 230362747, 228354645, 0, 2383874688),
  makePet('Huge Lifeguard Shark', '75963541478121', 'Huge', H, 41029374, 63685990, 155507396, 0, 0, 0),
  makePet('Huge Fragmented Dominus Ball', '100875909675761', 'Huge', H, 41466151, 0, 324924564, 191958428, 0, 4263232000),
  makePet('Huge Water Zebra', '132338879904830', 'Huge', H, 40572996, 73356139, 208303407, 0, 0, 0),
  makePet('Huge Love Corgi', '112650153241543', 'Huge', H, 39339812, 52021866, 246116149, 307455099, 1077962868, 2886682308),
  makePet('Huge Spitting Dino', '75776145321145', 'Huge', H, 39567689, 120095976, 446990451, 440688047, 2382070450, 249801579520),
  makePet('Huge Mantis Shrimp', '83192948454394', 'Huge', H, 40406425, 64434436, 196597872, 117069027, 1570755780, 68507038527),
  makePet('Huge Evolved Basket Bunny', '117009470735471', 'Huge', H, 40316147, 0, 204965965, 318176155, 0, 3054778030),
  makePet('Huge Rave Troll', '18351655132', 'Huge', H, 38948465, 82685585, 204976541, 875571069, 1621020123, 0),
  makePet('Huge Electric Dino', '18673256682', 'Huge', H, 39766045, 58036231, 329985637, 551133127, 2415668439, 0),
  makePet('Huge Hydra Axolotl', '76323621337981', 'Huge', H, 39355436, 43288235, 210954842, 423235778, 2961463040, 7944000000),
  makePet('Huge Wild Frost Agony', '80433316929327', 'Huge', H, 37644733, 35729441, 181139410, 207081448, 479592938, 7432441989),
  makePet('Huge Squirrel', '14976555755', 'Huge', H, 39686836, 83732694, 263880744, 245310873, 1722141239, 7354709299),
  makePet('Huge Coconut Corgi', '92543943369771', 'Huge', H, 39629145, 50961824, 317149060, 0, 0, 0),
  makePet('Huge Sleigh Cat', '121879397544213', 'Huge', H, 38777790, 37997317, 198197308, 196863477, 991770453, 10293208202),
  makePet('Huge Abyssal Jellyfish', '18882975166', 'Huge', H, 39139770, 32400664, 154046633, 151049804, 346035726, 2153185239),
  makePet('Huge Temporal Owl', '18882992626', 'Huge', H, 38373345, 31004552, 192051892, 154113490, 323178809, 2192465644),
  makePet('Huge Jolly Narwhal', '14976825062', 'Huge', H, 39377897, 0, 0, 0, 0, 0),
  makePet('Huge Mechatronic Robot', '18882975779', 'Huge', H, 38093698, 31021419, 167169595, 145657422, 408887787, 2152221075),
  makePet('Huge Blurred Axolotl', '89638501740571', 'Huge', H, 38756543, 62240705, 401961502, 2324919134, 0, 0),
  makePet('Huge Electric Bunny Ball', '102519001047451', 'Huge', H, 39387633, 0, 254002247, 187218409, 0, 3746269300),
  makePet('Huge Luxe Peacock', '18556267256', 'Huge', H, 37838783, 37140557, 194399715, 332796026, 1211520397, 8817331200),
  makePet('Huge Rave Slime', '118307691118910', 'Huge', H, 37554978, 91387525, 309671369, 588083796, 34110848000, 0),
  makePet('Huge Happy Rock', '14976450873', 'Huge', H, 36607596, 685278101, 237135736, 184132021, 0, 2639885810),
  makePet('Huge Fluffy Cat', '15803982174', 'Huge', H, 37212222, 31806165, 210361234, 150177025, 284321803, 2498452203),
  makePet('Huge Shadow Pegasus', '131804456105000', 'Huge', H, 37460596, 116092342, 263897201, 0, 0, 0),
  makePet('Huge Kawaii Dragon Ball', '108289198978887', 'Huge', H, 36837419, 50381830, 204151480, 0, 0, 0),
  makePet('Huge Atomic Monkey Ball', '131025673327487', 'Huge', H, 36952092, 40554970, 160885347, 96381523, 283346297, 1943965057),
  makePet('Huge Origami Bunny', '83483274094182', 'Huge', H, 35807516, 0, 306991437, 199131218, 0, 0),
  makePet('Huge Valentines Bear', '140051319290107', 'Huge', H, 26762083, 0, 0, 0, 0, 0),
  makePet('Huge Evolved Red Wolf', '126635488798392', 'Huge', H, 38505613, 0, 145231106, 172516081, 0, 3862303399),
  makePet('Huge Poseidon Corgi', '15477703422', 'Huge', H, 37257383, 35708193, 171151780, 0, 0, 0),
  makePet('Huge Galaxy Fox', '78675251181083', 'Huge', H, 35057444, 36666880, 228126699, 279522845, 622565365, 0),
  makePet('Huge Vibrant Whale', '87407901102081', 'Huge', H, 31198683, 52124954, 326970966, 0, 0, 0),
  makePet('Huge Crystal Spider', '78631219465603', 'Huge', H, 36613575, 51364373, 345199628, 3838990070, 12038828800, 7286400000),
  makePet('Huge Snowflake Dragon', '113631496802759', 'Huge', H, 35339475, 57956137, 706648194, 1487848725, 5540000000, 0),
  makePet('Huge Red Panda', '14976533293', 'Huge', H, 36167738, 28011857, 160876181, 134682892, 286117267, 2216187601),
  makePet('Huge Loveserker', '100447142740271', 'Huge', H, 36694184, 40289033, 196055839, 194688801, 5284573463, 4565984648),
  makePet('Huge Holographic Cat', '17515615256', 'Huge', H, 35456013, 27858923, 172014165, 0, 0, 0),
  makePet('Huge Lit Cat', '93603448962886', 'Huge', H, 34484706, 60648693, 152339876, 176409358, 885905472, 3003908002),
  makePet('Huge Holiday Hedgehog', '104271630769332', 'Huge', H, 35787354, 50552382, 430369275, 1826002610, 0, 0),
  makePet('Huge Gorgon', '82639968294910', 'Huge', H, 34803434, 90737079, 248580325, 285467127, 1547354112, 2965334973),
  makePet('Huge Alienus Kitsune', '135920143312386', 'Huge', H, 35036106, 42547408, 165015242, 202783718, 515868714, 0),
  makePet('Huge Inkwell Wisp', '92033856546098', 'Huge', H, 31415001, 35366737, 279502335, 0, 0, 0),
  makePet('Huge Rave Jaguar', '18458263548', 'Huge', H, 34836921, 30313572, 162907684, 244394753, 1301513031, 4350056411),
  makePet('Huge Relic Deer', '113333249087302', 'Huge', H, 35274664, 53118569, 140512111, 1200729775, 27981352305, 0),
  makePet('Huge Penguin', '118584949011008', 'Huge', H, 33463133, 94951164, 363141024, 671587963, 0, 0),
  makePet('Huge Evolved Starry Eye Bunny', '76225100606605', 'Huge', H, 33946053, 0, 252782408, 232872615, 0, 0),
  makePet('Huge Student Corgi', '129996809182527', 'Huge', H, 33759421, 81636005, 246586309, 214159579, 3143320744, 5600000000),
  makePet('Huge Electric Slime', '134465209106329', 'Huge', H, 31404459, 62432089, 212014337, 182174910, 879467957, 0),
  makePet('Huge Teacher Cat', '108033517958051', 'Huge', H, 33549925, 98533186, 152469546, 123622619, 672552356, 2923807010),
  makePet('Huge Gym Shark', '96513161978756', 'Huge', H, 32489198, 28011959, 149338867, 166726567, 580507593, 1986178951),
  makePet('Huge Sea Dragon', '109192796689135', 'Huge', H, 33738565, 45838295, 196676571, 546124367, 1535074742, 3108400000),
  makePet('Huge Glowy the Ghost', '80650774485901', 'Huge', H, 35356446, 72905020, 253658750, 120648830, 740451120, 2439320907),
  makePet('Huge Colorful Wisp', '16410753529', 'Huge', H, 33871118, 69226890, 319245535, 0, 0, 0),
  makePet('Huge Wizard Westie', '14976579774', 'Huge', H, 32349011, 33104674, 106948449, 0, 0, 0),
  makePet('Huge Mushroom Snail', '106278894381097', 'Huge', H, 33505559, 42183080, 324715256, 202631231, 0, 0),
  makePet('Huge Pumpkin Spice Cat', '126378743286438', 'Huge', H, 32773225, 49583800, 187382828, 852619413, 1800347541, 0),
  makePet('Huge Pineapple Monkey', '17689399533', 'Huge', H, 33516731, 44037237, 203003709, 352919615, 810799124, 4192866963),
  makePet('Huge Heartbreak Fairy', '129589212875010', 'Huge', H, 32161288, 32231173, 173336875, 125862530, 334587167, 2066828579),
  makePet('Huge Ancestor Eagle', '95278046256593', 'Huge', H, 30165899, 48863568, 588305573, 896018941, 0, 0),
  makePet('Huge Veil Horse', '137004945467080', 'Huge', H, 23984166, 25079756, 147646961, 281294412, 858153700, 3790473598),
  makePet('Huge Whale Shark', '16725471591', 'Huge', H, 33304961, 26914806, 149307658, 0, 0, 0),
  makePet('Huge Diamond Bunny', '100376851450682', 'Huge', H, 32704292, 43628340, 138672355, 126485884, 1201014323, 3714358288),
  makePet('Huge Emerald Owl', '86244728271610', 'Huge', H, 32190974, 40124574, 207146153, 468948220, 3865645331, 6723517818),
  makePet('Huge Gym Panda', '139794409376900', 'Huge', H, 32653082, 113195910, 144633578, 458305286, 0, 0),
  makePet('Huge Knight Beagle', '15804006339', 'Huge', H, 32614040, 29820543, 161091257, 80249991, 233868863, 1176606459),
  makePet('Huge Lotus Koi Fish', '128936875098689', 'Huge', H, 26876919, 25282876, 175467888, 197832636, 881366800, 4780269012),
  makePet('Huge Rainbow Slime', '14976531943', 'Huge', H, 32180647, 0, 0, 0, 0, 0),
  makePet('Huge Lightning Bat', '94725312781292', 'Huge', H, 32130577, 48053780, 343561027, 831248244, 1740398715, 0),
  makePet('Huge Hippomint', '105962472084546', 'Huge', H, 32879211, 35048798, 182899657, 164670924, 542154390, 5114416701),
  makePet('Huge Spring Dragon', '83560994028636', 'Huge', H, 32962972, 56585556, 348667718, 249629710, 0, 0),
  makePet('Huge Coconut Flamingo', '124659391100423', 'Huge', H, 32804460, 81667213, 233947549, 0, 0, 0),
  makePet('Huge Prison Cat', '17526083509', 'Huge', H, 31795869, 31869150, 158560866, 0, 0, 0),
  makePet('Huge Horseshoe Capybara', '79249687154942', 'Huge', H, 31660948, 40158494, 167394036, 229869188, 408834054, 6429354650),
  makePet('Huge Ghost', '14976441222', 'Huge', H, 32576093, 71177806, 283285150, 199164454, 1323601677, 4712967697),
  makePet('Huge Quantum Griffin', '103033034897992', 'Huge', H, 28992928, 35481386, 224550184, 0, 0, 0),
  makePet('Huge Old Wizard Corgi', '18644412561', 'Huge', H, 32121600, 71063695, 221026502, 214788031, 1430278210, 0),
  makePet('Huge Mushroom Dragon', '98526628952494', 'Huge', H, 31893254, 30405631, 174897577, 133222867, 12518976000, 3091904556),
  makePet('Huge Fossil Dragon', '14976436145', 'Huge', H, 31410940, 0, 0, 0, 0, 0),
  makePet('Huge Evolved Mining Monkey', '108431740887325', 'Huge', H, 32052302, 0, 164371190, 175187527, 0, 3081535190),
  makePet('Huge Blue Lucky Block', '116957138915362', 'Huge', H, 30727428, 32155492, 432693587, 1271681397, 4485461493, 0),
  makePet('Huge Nutcracker Cat', '131785972720265', 'Huge', H, 30461748, 47773923, 131276963, 200340310, 1560115331, 6077600000),
  makePet('Huge Glitched Unicorn Ball', '129837188566308', 'Huge', H, 31613774, 28908787, 123510523, 144572534, 311242096, 2189993218),
  makePet('Huge Icy Phoenix', '77587429055460', 'Huge', H, 30811676, 26305150, 166829385, 137865302, 334585071, 1896321874),
  makePet('Huge Valentines Axolotl', '92646115385136', 'Huge', H, 31872139, 0, 0, 0, 0, 0),
  makePet('Huge Sunflower Calf', '89310738281949', 'Huge', H, 31968715, 48197880, 198713251, 187026168, 0, 0),
  makePet('Huge Dawn Phoenix', '104154597023155', 'Huge', H, 30975639, 40941049, 248251421, 173345734, 876389128, 4643014438),
  makePet('Huge Bloom Dominus', '86640323792392', 'Huge', H, 30486475, 37881125, 252888610, 163557337, 777334839, 5949785161),
  makePet('Huge Party Crown Corgi', '84718989767415', 'Huge', H, 30378077, 48805906, 275075055, 296069432, 1099766079, 8866720000),
  makePet('Huge Pinecone Porcupine', '128031048512623', 'Huge', H, 31350611, 100806070, 464005459, 1075690248, 0, 0),
  makePet('Huge Old Wizard Owl', '18644413008', 'Huge', H, 30940746, 73242208, 326372394, 214224213, 1566672799, 0),
  makePet('Huge Tropical Toucan', '18644414181', 'Huge', H, 30267079, 49641497, 262433800, 180428871, 2029331464, 11096144000),
  makePet('Huge Bunny Cat', '96756728639986', 'Huge', H, 29597567, 29083254, 178781648, 246002523, 877669853, 0),
  makePet('Huge Party Corgi', '115749071497654', 'Huge', H, 30138760, 58114636, 275982523, 713297758, 2478003855, 9208747150),
  makePet('Huge African Wild Dog', '137866343628136', 'Huge', H, 31551724, 103040489, 205722839, 366844350, 920585449, 6945600000),
  makePet('Huge Minecart Hamster', '106601892793198', 'Huge', H, 30559644, 27933740, 149577927, 124543683, 402999889, 2002075283),
  makePet('Huge Snowflake Pegasus', '128323283709486', 'Huge', H, 29453678, 27166100, 162371564, 150881998, 283741615, 0),
  makePet('Huge Party Dragon', '16901792712', 'Huge', H, 30191428, 84249146, 202307247, 245525446, 2396000654, 12675200000),
  makePet('Huge Poinsettia Peacock', '126024044464158', 'Huge', H, 29464959, 46553036, 162364349, 333002928, 1902783913, 0),
  makePet('Huge Propeller Cat', '15340315459', 'Huge', H, 30420631, 44376335, 325453448, 0, 0, 0),
  makePet('Huge Holly Fawn', '123821214219134', 'Huge', H, 29920383, 54048070, 121736330, 904625119, 1583409491, 8343520000),
  makePet('Huge Arcade Dog', '102621669325796', 'Huge', H, 29672615, 30752141, 148857479, 127112867, 321544604, 2608400171),
  makePet('Huge Holly Capybara', '113623794189618', 'Huge', H, 30213339, 28044204, 145376887, 141617104, 476891754, 2964623223),
  makePet('Huge Party Squirrel', '108200825731940', 'Huge', H, 29559535, 41300040, 334631855, 539905091, 0, 0),
  makePet('Huge Basketball Corgi', '88019287527866', 'Huge', H, 29213955, 27489649, 142732504, 152214013, 714683177, 1571336448),
  makePet('Huge Electric Penguin', '77658045662575', 'Huge', H, 29826771, 24160695, 154002037, 128051033, 561808619, 2937782677),
  makePet('Huge Goblin', '14976446202', 'Huge', H, 30096289, 78839459, 193858804, 163342033, 1663227912, 4648736930),
  makePet('Huge Cataclysm Bear', '126636577464770', 'Huge', H, 29795646, 35009664, 165135477, 134346906, 380823524, 2241434747),
  makePet('Huge Ice Snake', '72721925435619', 'Huge', H, 30017635, 38242569, 150376221, 177783536, 1274088232, 9784670174),
  makePet('Huge Mermaid Cat', '14976489487', 'Huge', H, 30488377, 33071172, 142283791, 91459889, 312734730, 1136079857),
  makePet('Huge Robot', '110205883813636', 'Huge', H, 29099354, 53960993, 288378607, 0, 0, 0),
  makePet('Huge Fiddlefern Cat', '106766832972765', 'Huge', H, 29632681, 26124500, 143420614, 124622495, 408648187, 2228206927),
  makePet('Huge Palace Pooka', '120508025732029', 'Huge', H, 26324939, 29695747, 244237046, 400952874, 0, 0),
  makePet('Huge Valentines Unicorn', '87559926254835', 'Huge', H, 28898787, 0, 0, 0, 0, 0),
  makePet('Huge Player Panda', '98031004094644', 'Huge', H, 29484148, 112660967, 123745726, 412031984, 8187081600, 3852521840),
  makePet('Huge Anglerfish', '102757425603718', 'Huge', H, 29666681, 26527452, 136154476, 178299340, 880224002, 3574932365),
  makePet('Huge Horse', '112696303683971', 'Huge', H, 28175655, 62468208, 201683746, 329918268, 2019519602, 3247909003),
  makePet('Huge Chocolate Bunny', '79481017800505', 'Huge', H, 27089050, 32169159, 175485544, 282096386, 442729999, 0),
  makePet('Huge Bee', '14976362778', 'Huge', H, 29198260, 30379183, 140247820, 94444835, 229083045, 1230389072),
  makePet('Huge Chill Bunny', '87108901678067', 'Huge', H, 28968091, 63381375, 1023537090, 0, 0, 0),
  makePet('Huge Surfboard Axolotl', '134895528303880', 'Huge', H, 28403900, 37230941, 135529232, 306834795, 884126950, 6826735360),
  makePet('Huge Spring Bee', '137687744712532', 'Huge', H, 28563677, 148927585, 257748699, 422763719, 19062046382, 7905022764),
  makePet('Huge Skeleton Cat', '99657539993632', 'Huge', H, 28183146, 53354445, 131446464, 0, 0, 0),
  makePet('Huge Stunt Cat', '80484506977971', 'Huge', H, 27913761, 25629799, 154502544, 141961706, 715761057, 5324672831),
  makePet('Huge Giraffe', '14976442623', 'Huge', H, 26899280, 28646902, 153143824, 107316104, 219055097, 1936345061),
  makePet('Huge Spring Dino', '99022978600130', 'Huge', H, 28515494, 42118181, 207098159, 153438798, 0, 0),
  makePet('Huge Lunar Moth', '17028306654', 'Huge', H, 28364417, 35655294, 253261891, 309371762, 3274143371, 0),
  makePet('Huge Robber Pug', '15804001482', 'Huge', H, 27993578, 32615382, 160502159, 98583418, 256067469, 1480716675),
  makePet('Huge Blurred Bear Ball', '133058816387774', 'Huge', H, 27579250, 26087348, 253630381, 102821642, 938313321, 6700000000),
  makePet('Huge Chill Polar Bear', '124471089861865', 'Huge', H, 27722710, 25429051, 152685421, 112755756, 382039336, 1873627284),
  makePet('Huge Lamb Wolf', '72351620062304', 'Huge', H, 27287364, 26409242, 142746727, 163527917, 1933484671, 0),
  makePet('Huge Spring Kitten', '129393017030092', 'Huge', H, 27863736, 33765027, 231598888, 132469895, 0, 0),
  makePet('Huge Butterfly Pony', '130427218526414', 'Huge', H, 27461803, 32736965, 194609971, 148043878, 1151876123, 6272089333),
  makePet('Huge Helicopter Cat', '14976453343', 'Huge', H, 27594414, 29312912, 165970407, 114199344, 257914105, 2021779876),
  makePet('Huge Diamond Chick', '79413984807049', 'Huge', H, 26243407, 30027071, 154972323, 129241002, 371395714, 3024022163),
  makePet('Huge Eclipse Owl', '106929390805837', 'Huge', H, 27361960, 35310305, 150166457, 119821896, 344894281, 2137053719),
  makePet('Huge Fancy Axolotl', '14976429135', 'Huge', H, 28015358, 25963865, 141314302, 113341847, 225449240, 1355859453),
  makePet('Huge Festive Seal', '121873386766313', 'Huge', H, 26316705, 26610057, 125496530, 111472596, 481901514, 2125689671),
  makePet('Huge Chill Parrot', '104805390421143', 'Huge', H, 27677545, 30025527, 142353701, 97501535, 372804940, 1787757149),
  makePet('Huge Leafy Yeti', '123501144563206', 'Huge', H, 27549159, 27904945, 148855542, 123335537, 384726035, 3138264696),
  makePet('Huge Pajamas Shark', '101224115872445', 'Huge', H, 28282004, 26361113, 109207462, 104978113, 1339842005, 3338064285),
  makePet('Huge Elephant', '14976419563', 'Huge', H, 27019451, 32408693, 155837056, 95133488, 276718787, 1787953154),
  makePet('Huge Circuit Cat', '107640739737429', 'Huge', H, 26777860, 33431919, 164655914, 0, 0, 0),
  makePet('Huge Telescope Owl', '81492004583287', 'Huge', H, 26311159, 30045798, 196940382, 197419490, 789844209, 7010566631),
  makePet('Huge Scarecrow Dog', '137318518159218', 'Huge', H, 26005162, 29709581, 180072445, 152313179, 242260560, 1664517932),
  makePet('Huge Coach Hippo', '99854649833028', 'Huge', H, 27752300, 285310676, 316918973, 459474639, 3591269120, 0),
  makePet('Huge Bison', '14976363344', 'Huge', H, 27563023, 28725987, 154215437, 123963132, 181944907, 2213787447),
  makePet('Huge Egg Piggy', '124169087472138', 'Huge', H, 27066200, 32765467, 163915032, 126488972, 612397707, 2345329726),
  makePet('Huge Cupcake Pegasus', '136860707312051', 'Huge', H, 25500555, 26713173, 141567739, 144054480, 408747893, 3860771947),
  makePet('Huge Torpedo Shepherd', '82812436217592', 'Huge', H, 27391656, 48463819, 250221545, 348004152, 1101902850, 0),
  makePet('Huge Frostbyte Snowman', '97928657452308', 'Huge', H, 27727845, 24849931, 197397872, 293130156, 2205872307, 0),
  makePet('Huge Reindeer Cat', '130929080368183', 'Huge', H, 25458573, 30177028, 152778574, 128441246, 0, 0),
  makePet('Huge Totem Cub', '92882162036014', 'Huge', H, 23045689, 29305311, 191478136, 242770939, 0, 0),
  makePet('Huge Spring Griffin', '138950017862417', 'Huge', H, 25496843, 28350546, 147300388, 103138824, 295411985, 2246938159),
  makePet('Huge Scribe Squirrel', '98604773500066', 'Huge', H, 26865844, 37120934, 293808798, 158893330, 3420240640, 4071209599),
  makePet('Huge Holly Corgi', '70527773100023', 'Huge', H, 26629360, 59960259, 110560442, 121128241, 2823237648, 2636313703),
  makePet('Huge Tree Frog', '109144627334415', 'Huge', H, 26031777, 28730840, 148975492, 122640069, 330830751, 2087064463),
  makePet('Huge Punksky', '14976529792', 'Huge', H, 27184400, 29563756, 151938986, 107338919, 244442406, 1634188974),
  makePet('Huge Snow Elf', '104334449359401', 'Huge', H, 25616135, 26584672, 115970743, 156363710, 947814004, 0),
  makePet('Huge Clover Penguin', '70700548399137', 'Huge', H, 26626161, 34617235, 288734644, 1133287420, 0, 0),
  makePet('Huge Lucki Cat', '90438658462311', 'Huge', H, 26454763, 26718244, 167410802, 123962512, 382786744, 1896597965),
  makePet('Huge Pixel Bee', '123894797425389', 'Huge', H, 26194307, 25540165, 141406651, 106315502, 333155695, 2297151764),
  makePet('Huge Flamingo Hippo', '70985697718907', 'Huge', H, 26528137, 21525470, 332523718, 1291422731, 0, 0),
  makePet('Huge Ooze Axolotl', '131381022373439', 'Huge', H, 26519409, 27540680, 139378156, 109068483, 452293891, 2259975178),
  makePet('Huge Anubis', '132510616304685', 'Huge', H, 23833600, 33071258, 156461119, 144418421, 848977179, 3496686890),
  makePet('Huge Exquisite Elephant', '72880983476482', 'Huge', H, 26371747, 27559698, 135339803, 181392045, 2136089549, 5033417399),
  makePet('Huge Pixel Otter', '98175499956412', 'Huge', H, 26132750, 27581984, 145460463, 135584078, 538919780, 0),
  makePet('Huge Sacred Deer', '100676817290108', 'Huge', H, 26185224, 0, 0, 0, 0, 0),
  makePet('Huge Rhino', '70742339660994', 'Huge', H, 25054976, 55518928, 193342614, 308048610, 1248954170, 3275722194),
  makePet('Huge Chesnut Chipmunk', '134539491208069', 'Huge', H, 26827692, 27315397, 156663834, 177104782, 572247007, 3730912000),
  makePet('Huge Chill Ducky', '91155059443761', 'Huge', H, 26826186, 26798368, 161573962, 0, 0, 0),
  makePet('Huge Empyrean Owl', '93292794652878', 'Huge', H, 26362233, 31779238, 180257305, 177444036, 476793548, 3469270582),
  makePet('Huge Player Fox', '101605254258375', 'Huge', H, 25402033, 30262339, 156569746, 93048514, 290653574, 1719442991),
  makePet('Huge Lunar Deer', '93191567038818', 'Huge', H, 22430477, 53240616, 187015405, 174380465, 833302625, 2889893233),
  makePet('Huge Jolly Dino', '88604762906611', 'Huge', H, 25494037, 24156238, 146744384, 107196446, 339517636, 27440172019),
  makePet('Huge Blurred Owl', '108865799258120', 'Huge', H, 25601256, 27362370, 147979609, 127974318, 635978002, 2572952785),
  makePet('Huge Holiday Owl', '84549305486932', 'Huge', H, 25967900, 29293378, 149719085, 135872869, 283207450, 1945903779),
  makePet('Huge Irish Badger', '132795639308777', 'Huge', H, 25219165, 28566367, 140721225, 126259248, 415339068, 3981025355),
  makePet('Huge Crocodile', '14976387300', 'Huge', H, 26419664, 29510103, 153048528, 91549238, 212534574, 2096930690),
  makePet('Huge Spring Onion', '75532551020815', 'Huge', H, 26233567, 28256981, 168577291, 201839569, 867682004, 10591048959),
  makePet('Huge Prism Pegasus', '80538613184733', 'Huge', H, 24151210, 30657374, 165497506, 129645395, 427753752, 3178964656),
  makePet('Huge Zombie Pig', '112915612904336', 'Huge', H, 25834989, 24727899, 129299987, 249222993, 727156871, 11648000000),
  makePet('Huge Lucki Hydra', '107790361850744', 'Huge', H, 24576276, 31494040, 156812116, 125335600, 344154027, 2060795775),
  makePet('Huge Strawhat Tanuki', '71139826265802', 'Huge', H, 25798309, 223047815, 1181760546, 448802456, 3293120000, 0),
  makePet('Huge Old Wizard Cat', '80977445482365', 'Huge', H, 27391671, 28213514, 171139308, 287947927, 782226247, 4308803338),
  makePet('Huge Angry Yeti', '110929464319537', 'Huge', H, 25857671, 24815566, 156086966, 129963786, 311560778, 7132392116),
  makePet('Huge Moray Eel', '103239594752603', 'Huge', H, 26661424, 86486666, 222505613, 469764919, 1866115525, 10000000000),
  makePet('Huge Bandana Shiba', '122819794900124', 'Huge', H, 26007375, 0, 0, 0, 0, 0),
  makePet('Huge Kangaroo', '17208307820', 'Huge', H, 24897773, 31170603, 162068007, 100767520, 234587768, 2271413647),
  makePet('Huge Doll Cat', '104297588937430', 'Huge', H, 26220823, 41622827, 296873970, 201562063, 277536196, 2099896468),
  makePet('Huge Tropical Flamingo', '18644413250', 'Huge', H, 26365012, 150693685, 270440272, 187956144, 1499112257, 122140779998),
  makePet('Huge Koi Fish', '16179890678', 'Huge', H, 26094792, 31277752, 153515789, 136919543, 301141613, 1886470659),
  makePet('Huge Lucki Elephant', '101748445167482', 'Huge', H, 25865073, 26460304, 148587850, 203152259, 2692182584, 4713475200),
  makePet('Huge Vibrant Toucan', '17835926180', 'Huge', H, 25984698, 74904881, 118309677, 105194316, 499831685, 3148878945),
  makePet('Huge Lemur', '106102265443812', 'Huge', H, 24390463, 60108482, 156363812, 387898892, 1492794280, 0),
  makePet('Huge Ninja Dalmatian', '108653580991375', 'Huge', H, 25076482, 26422955, 142385488, 122557768, 383577548, 1701014343),
  makePet('Huge Rogue Squid', '82176106497018', 'Huge', H, 24508885, 29306081, 158359271, 117992240, 283000202, 1534429678),
  makePet('Huge Lucki Horse', '116756676652534', 'Huge', H, 23943080, 28801514, 136560869, 113958951, 424362366, 2851210920),
  makePet('Huge Mining Raccoon', '81824551142457', 'Huge', H, 25449535, 24331503, 144900325, 91156607, 501274761, 1927861764),
  makePet('Huge Skeleton Snake', '101412265452600', 'Huge', H, 23950206, 1452938880, 2295507712, 3806595354, 1607996800, 2680416000),
  makePet('Huge Clover Bee', '92697373462590', 'Huge', H, 26157995, 32183559, 293472231, 247925324, 1179707295, 6160219499),
  makePet('Huge Candycane Shake Shark', '131205167107422', 'Huge', H, 26744347, 0, 0, 0, 0, 0),
  makePet('Huge Mining Penguin', '107393069000800', 'Huge', H, 23842340, 27783952, 157091363, 126340230, 269252319, 2011962186),
  makePet('Huge Gingerbread Lion', '113905049892073', 'Huge', H, 25242898, 28676523, 145794026, 86712699, 301555864, 2400105332),
  makePet('Huge Ooze Cat', '94416745584783', 'Huge', H, 26177600, 28599883, 142832555, 104831196, 338246380, 3164217274),
  makePet('Huge Sticky Lamb', '135749996470461', 'Huge', H, 25459776, 25523774, 134291142, 104203509, 854767632, 2961607750),
  makePet('Huge Frostbyte Griffin', '133555995966095', 'Huge', H, 25378617, 25319719, 142355586, 291760195, 840588825, 3838800000),
  makePet('Huge Glade Griffin', '89142183208055', 'Huge', H, 24769055, 39428537, 223236528, 0, 0, 0),
  makePet('Huge Tropical Parrot', '18644413700', 'Huge', H, 24733959, 65135700, 191479818, 353634933, 1456562377, 13588800000),
  makePet('Huge Parachute Monkey', '137651133282362', 'Huge', H, 26283437, 49028108, 205453689, 234878752, 2048887219, 6171055687),
  makePet('Huge Easter Axolotl', '140227031996665', 'Huge', H, 25562681, 69579869, 288593866, 465634305, 2080000000, 0),
  makePet('Huge Maple Owl', '79022104643180', 'Huge', H, 24605413, 25887541, 137568664, 114147796, 404029898, 2154287053),
  makePet('Huge Skateboard Bulldog', '14976548072', 'Huge', H, 25300777, 23339255, 152723319, 107073145, 220814050, 1760043348),
  makePet('Huge Robot Ball', '114904071316728', 'Huge', H, 25149569, 29329972, 164912396, 207035814, 1203433336, 1798413423),
  makePet('Huge Starry Eye Bunny', '85579743157375', 'Huge', H, 24323793, 32036157, 156152043, 129471865, 301285882, 2268911166),
  makePet('Huge Red Wolf', '138120594404992', 'Huge', H, 24251455, 29942291, 168568847, 93109251, 233729732, 1765583641),
  makePet('Huge Spring Elephant', '137542174121503', 'Huge', H, 24301189, 37307533, 157928708, 171287472, 0, 0),
  makePet('Huge Zebra', '15803989668', 'Huge', H, 26447666, 30207761, 140431430, 102435795, 189143880, 1971225939),
  makePet('Huge Party Panda', '102306587085097', 'Huge', H, 25454937, 34386959, 183413367, 225342669, 922942017, 2834803111),
  makePet('Huge Honey Badger', '14976457989', 'Huge', H, 25097782, 29329271, 142042101, 92954785, 291285860, 1775745933),
  makePet('Huge Hot Cocoa Bear', '103081269967606', 'Huge', H, 24215242, 25040729, 136334021, 82545333, 378263166, 3614164942),
  makePet('Huge Chill Turtle', '131025895273996', 'Huge', H, 24969290, 21504383, 137071472, 0, 0, 0),
  makePet('Huge Festive Walrus', '130656165679355', 'Huge', H, 26093886, 225237923, 468976854, 718938243, 0, 22000000000),
  makePet('Huge Void Alien', '95087944303198', 'Huge', H, 25412245, 25180885, 121647986, 0, 0, 0),
  makePet('Huge Flamingo Cat', '110362471835771', 'Huge', H, 25645382, 24002945, 110550584, 0, 0, 0),
  makePet('Huge Lucki Tiger', '79319215201881', 'Huge', H, 24981016, 40341959, 301019643, 616225255, 2341078272, 0),
  makePet('Huge Nutcracker Squirrel', '125206420660994', 'Huge', H, 25002986, 38940278, 136417459, 93224402, 462496010, 2356363771),
  makePet('Huge Spotted Elephant', '109762155802208', 'Huge', H, 23198674, 24804982, 132558211, 80754463, 260775162, 2176248036),
  makePet('Huge Holiday Bearserker', '79863147405643', 'Huge', H, 26196402, 0, 216031924, 102703857, 0, 5301114535),
  makePet('Huge Festive Elf', '72695234324968', 'Huge', H, 24790784, 34521017, 152299230, 115693478, 598315658, 2034934147),
  makePet('Huge Gazelle', '137006734767024', 'Huge', H, 24860627, 74454576, 189266608, 365083855, 1879927031, 8149226903),
  makePet('Huge Tennis Squirrel', '86863060232027', 'Huge', H, 24046595, 25462668, 137598934, 158448587, 3201927725, 4270720000),
  makePet('Huge Deerserker', '74968067485946', 'Huge', H, 24406505, 39078921, 278053334, 761063978, 1981879926, 0),
  makePet('Huge Mushroom Raccoon', '14976495649', 'Huge', H, 25101668, 45217904, 120045888, 78621591, 302201716, 1235625594),
  makePet('Huge Bluebird', '14976368196', 'Huge', H, 23814971, 0, 175145470, 126096971, 0, 2174170078),
  makePet('Huge Easter Fox', '127847534239530', 'Huge', H, 25055394, 26349346, 130957552, 100567107, 405794401, 4483620577),
  makePet('Huge Player Corgi', '120748568564871', 'Huge', H, 24743370, 24113637, 121329490, 253482019, 716648079, 362726746063),
  makePet('Huge Lucki Lamb', '95284321977172', 'Huge', H, 25321543, 22967205, 119128398, 118193600, 546236960, 2075535581),
  makePet('Huge Leprechaun Fox', '126832578733355', 'Huge', H, 23504147, 31226961, 144123473, 125485605, 352204026, 2425828251),
  makePet('Huge Clover Phoenix', '121888921741628', 'Huge', H, 24646766, 28052495, 145254286, 114612023, 321698927, 2449838661),
  makePet('Huge North Pole Unicorn', '118783316706055', 'Huge', H, 24916813, 23419532, 126384043, 178317439, 1371570038, 0),
  makePet('Huge Stunt Corgi', '132747851336356', 'Huge', H, 24595388, 41778232, 124209959, 186084161, 499057200, 2969648010),
  makePet('Huge Evergreen Unicorn', '102257239631594', 'Huge', H, 24581057, 26592685, 137688535, 103904039, 333899403, 2099183951),
  makePet('Huge Clover Griffin', '129397965885657', 'Huge', H, 25194926, 30054963, 137303192, 135273167, 1160054762, 2169040850),
  makePet('Huge Rudolf', '90192944578505', 'Huge', H, 25368676, 27430877, 119433128, 98271252, 535212986, 0),
  makePet('Huge Hot Cocoa Cow', '94419678057049', 'Huge', H, 21983974, 0, 0, 0, 0, 0),
  makePet('Huge Nebula Lion', '93555710520870', 'Huge', H, 24739913, 29233359, 147961143, 119900292, 285879066, 2078237082),
  makePet('Huge Clover Deer', '79851172093222', 'Huge', H, 23983769, 31501632, 156212571, 128663596, 322303819, 2227646262),
  makePet('Huge Chill Cat', '79287315277949', 'Huge', H, 25002608, 31472956, 221152180, 460237941, 1442670060, 0),
  makePet('Huge Cinnamon Bunny', '84468265134743', 'Huge', H, 25202802, 64887725, 535184449, 363674767, 1000000000, 7816000000),
  makePet('Huge Clover Peacock', '109285154435259', 'Huge', H, 24161847, 34945744, 144629089, 301498149, 1525234659, 0),
  makePet('Huge Detective Terrier', '79798078989101', 'Huge', H, 24567438, 31913184, 135524033, 123729226, 632665099, 3653912827),
  makePet('Huge Evil Raven', '125919373287917', 'Huge', H, 21841228, 0, 0, 0, 0, 0),
  makePet('Huge Green Cobra', '136758354491136', 'Huge', H, 23849696, 31371575, 140494062, 104081801, 267581030, 1946700100),
  makePet('Huge Mining Robot', '96864197207210', 'Huge', H, 24186117, 37319308, 175316573, 601619752, 528720000, 4771200000),
  makePet('Huge Basket Bunny', '75145545226238', 'Huge', H, 23768396, 28800061, 151653939, 116871622, 295428664, 1761705536),
  makePet('Huge Nutcracker Bunny', '134436276835311', 'Huge', H, 24201729, 32726023, 194067676, 315829536, 4498584682, 15000000000),
  makePet('Huge Floatie Cat', '122328085750214', 'Huge', H, 24599921, 58059357, 226406308, 0, 0, 0),
  makePet('Huge Beaver', '137999717729131', 'Huge', H, 24229278, 24389447, 136413015, 114482780, 267673639, 1585356982),
  makePet('Huge Royal Peacock', '87911299372812', 'Huge', H, 24356783, 24544385, 136658028, 324075743, 1096014200, 9166000000),
  makePet('Huge Pixel Griffin', '95210896396972', 'Huge', H, 21628630, 27198705, 144007950, 105199300, 252915043, 2259882164),
  makePet('Huge Frankenpup Dog', '89649094845422', 'Huge', H, 24356145, 0, 0, 0, 0, 0),
  makePet('Huge Ladybug', '99601574590476', 'Huge', H, 23900851, 47544164, 159648576, 130125557, 845747104, 2923445090),
  makePet('Huge Stingray', '74045348274896', 'Huge', H, 22958533, 28397392, 139900086, 108748484, 264627945, 2053015906),
  makePet('Huge Mining Monkey', '103555083432476', 'Huge', H, 21418334, 28580847, 160146113, 132462786, 312471579, 2058125156),
  makePet('Huge Sand Turtle', '135909325660471', 'Huge', H, 23739038, 0, 0, 0, 0, 0),
  makePet('Huge Candycane Unicorn', '96812489225423', 'Huge', H, 23610423, 35410622, 186284130, 452738798, 2952305394, 23200000000),
  makePet('Huge Wisp Griffin', '107709649476563', 'Huge', H, 20681186, 29172510, 135580552, 119038820, 671061781, 2592552881),
  makePet('Huge Safari Monkey', '131070721986590', 'Huge', H, 24488240, 27853635, 139478181, 217671707, 6340455073, 0),
  makePet('Huge Easter Lamb', '122710351430317', 'Huge', H, 22433238, 0, 0, 0, 0, 0),
  makePet('Huge Elegant Eagle', '18556265741', 'Huge', H, 23386662, 32266429, 164282318, 166866108, 1075000551, 2909340609),
  makePet('Huge Llama', '14976476776', 'Huge', H, 23814133, 21901894, 146487250, 89201992, 263434216, 2404833359),
  makePet('Huge Pastel Deer', '117144432225186', 'Huge', H, 24066408, 23297242, 128786331, 0, 0, 0),
  makePet('Huge Pastel Sock Bunny', '85028487593165', 'Huge', H, 23882367, 35921827, 122317515, 342317209, 1408645212, 7652640000),
  makePet('Huge Oracle Tiger', '86086397242289', 'Huge', H, 22130460, 28121284, 141493153, 116134553, 302372145, 2321648491),
  makePet('Huge Walrus', '102190929472921', 'Huge', H, 22523089, 45879574, 138299168, 227008648, 636494406, 4826134806),
  makePet('Huge Pixel Goblin', '122435473843216', 'Huge', H, 22892575, 24130766, 154135919, 184145273, 508941651, 9083841094),
  makePet('Huge Mushroom Pixie', '104120102100620', 'Huge', H, 21224503, 23715899, 129728107, 185783410, 372264329, 0),
  makePet('Huge Festive Bear', '71088229378334', 'Huge', H, 23621136, 0, 0, 0, 0, 0),
  makePet('Huge Merry Mule', '123118912547385', 'Huge', H, 24019985, 45570244, 212532718, 171344405, 600000000, 12607808000),
  makePet('Huge Crowned Dragon', '126611400704407', 'Huge', H, 50000000, 0, 0, 0, 0, 0),
  makePet('Huge Angel Dog', '15281990069', 'Huge', H, 50000000, 0, 0, 0, 0, 0),
  makePet('Huge Crystal Axolotl', '78600472336744', 'Huge', H, 50000000, 0, 0, 0, 0, 0),
  makePet('Huge Chroma Phoenix', '79819458470257', 'Huge', H, 53511023, 0, 340328183, 1057898841, 0, 21100000000),
  makePet('Huge Chroma Tiger', '95114398104330', 'Huge', H, 92539797, 0, 459270024, 710542721, 0, 0),
  makePet('Huge Crowned Pegasus', '15281989490', 'Huge', H, 50000000, 0, 0, 0, 0, 0),
  makePet('Huge Chroma Lucky Block Mimic', '15282013087', 'Huge', H, 307001619, 0, 0, 2874942151, 0, 0),
  makePet('Huge Chroma Snail', '99780016268743', 'Huge', H, 92247131, 0, 634172109, 0, 0, 0),
  makePet('Huge Glass Crocodile', '85063221597865', 'Huge', H, 101481521, 0, 719322044, 434647367, 0, 9990524771),
  makePet('Huge Chroma Butterfly', '85411857304687', 'Huge', H, 91923278, 0, 1518056509, 0, 0, 0),
  makePet('Huge Empyrean Axolotl', '14976421410', 'Huge', H, 50000000, 0, 0, 0, 0, 0),
  makePet('Huge Jelly Monkey', '16495814071', 'Huge', H, 625335277, 0, 2217019600, 1701905585, 0, 0),
  makePet('Huge Cosmic Axolotl', '15201636161', 'Huge', H, 427709910, 0, 2668100906, 1186529516, 0, 0),
  makePet('Huge Chroma Unicorn', '137010472014317', 'Huge', H, 548545076, 0, 832466914, 1631158346, 0, 5624800000),
  makePet('Huge Jelly Axolotl', '16483328135', 'Huge', H, 663373971, 0, 4537774459, 1018197906, 0, 103776000000),
  makePet('Huge Jelly Corgi', '14976465933', 'Huge', H, 720556921, 0, 5471314264, 1319642125, 0, 0),
  makePet('Huge Glass Dominus', '72368340879061', 'Huge', H, 306632647, 0, 1443731368, 996041622, 0, 8163457217),
  makePet('Huge Owl', '15809137117', 'Huge', H, 50000000, 0, 0, 0, 0, 0),
  makePet('Huge Chroma Doodle Axolotl', '104790531635237', 'Huge', H, 1060103447, 0, 1027483565, 341683705, 0, 0),
  makePet('Huge Cosmic Agony', '15201636010', 'Huge', H, 1212169230, 0, 5209588388, 3226679360, 0, 0),
  makePet('Huge UV Cat', '18356987128', 'Huge', H, 46352399, 78542939, 298209183, 276358308, 961786071, 4609316442),
  makePet('Huge Ruinous Angelus', '101706886467940', 'Huge', H, 50000000, 0, 0, 0, 0, 0),
  makePet('Huge Emoji Cat', '16047450864', 'Huge', H, 298013166, 0, 1041149211, 1023976176, 0, 1600256000),
  makePet('Huge Chroma Ink Blob', '109166274058146', 'Huge', H, 696628134, 0, 279992641, 1154877236, 0, 262748800000),
  makePet('Huge Chroma Lucki', '14976381547', 'Huge', H, 178424483, 0, 1522109439, 895822869, 0, 0),
  makePet('Huge Pegasus', '14976514552', 'Huge', H, 50000000, 0, 0, 0, 0, 0),
  makePet('Huge Chroma Swan', '109938539345401', 'Huge', H, 90354401, 0, 911605264, 0, 0, 0),
  makePet('Huge Jelly Piggy', '14976467450', 'Huge', H, 1066635412, 0, 8266499756, 5369561253, 0, 0),
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
          <div class="prof-stat-lbl">Wagered</div>
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
  const p = myProfile();
  const isOwnAdmin = localStorage.getItem('ps99g_isAdmin') === '1';
  const data = { name:p.name, level:p.level, wagered:p.wagered, won:p.won, lost:p.lost, id:p.id, color:'#7c3aed',
             winRate:p.winRate, bestWin:p.bestWin, maxStreak:p.maxStreak, winCount:p.winCount, lossCount:p.lossCount,
             isOwner: isOwner || isOwnAdmin };

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
    avEl.textContent = '👑';
    if (ringEl) ringEl.style.background = 'linear-gradient(135deg,#f59e0b,#fbbf24,#f59e0b)';
    if (hdrEl)  hdrEl.style.background  = 'linear-gradient(135deg,rgba(245,158,11,.45) 0%,rgba(180,83,9,.2) 50%,transparent 100%),linear-gradient(135deg,#451a03,#78350f,#92400e)';
    document.getElementById('prof-lv-pill').textContent = '👑 OWNER';
    document.getElementById('prof-lv-pill').style.cssText = 'background:linear-gradient(135deg,#f59e0b,#b45309);color:#fff;border:none;font-size:.65rem;box-shadow:0 0 12px rgba(245,158,11,.4);';
    rankPill.innerHTML = '&#128081;&nbsp;SITE OWNER';
    rankPill.style.cssText = 'color:#fbbf24;border-color:#f59e0b;background:rgba(245,158,11,.12);font-size:.6rem;letter-spacing:.06em;';
  } else {
    const selfAvatar = (type === 'you') ? localStorage.getItem('ps99g_rblx_avatar') : (data.avatar || '');
    if (selfAvatar) {
      avEl.style.cssText = 'background:rgba(0,0,0,.4);overflow:hidden;';
      const _pi = document.createElement('img');
      _pi.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
      _pi.src = selfAvatar;
      _pi.onerror = () => { avEl.textContent = initials; avEl.style.cssText = 'background:linear-gradient(135deg,#1e1645,#120e2a);'; };
      avEl.innerHTML = ''; avEl.appendChild(_pi);
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
    const _avImg = document.createElement('img');
    _avImg.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
    _avImg.src = d.avatarUrl;
    _avImg.onerror = () => { avEl.textContent = initials; avEl.style.cssText = 'background:linear-gradient(135deg,#1e1645,#120e2a);'; };
    avEl.innerHTML = '';
    avEl.appendChild(_avImg);
  } else {
    avEl.style.cssText = 'background:linear-gradient(135deg,#1e1645,#120e2a);';
    avEl.textContent = initials;
  }
  const color = '#4338ca';
  if (ringEl) ringEl.style.background = `linear-gradient(135deg,${color},${color}88)`;
  if (hdrEl)  hdrEl.style.background  = `linear-gradient(135deg,${color}55 0%,${color}22 50%,transparent 100%),linear-gradient(135deg,#3b0764,#6d28d9)`;
  document.getElementById('prof-lv-pill').textContent = 'LVL 1';
  document.getElementById('prof-lv-pill').style.cssText = '';
  document.getElementById('prof-uname').textContent = d.displayName || d.username || '?';
  document.getElementById('prof-id-pill').textContent = d.username ? '@' + d.username : '';
  // Show loading state while we fetch real stats
  ['pstat-w','pstat-p','pstat-wr','pstat-bw','pstat-ws','pstat-gc'].forEach(id => {
    const el = document.getElementById(id); if (el) { el.textContent = 'â€¦'; el.style.color = ''; }
  });
  const rank0 = getEffectiveRank(_tipTargetUsername, 0);
  rankPill.innerHTML = `${rank0.icon}&nbsp;${rank0.name.toUpperCase()}`;
  rankPill.style.cssText = `color:${rank0.color};border-color:${rank0.color};background:${rank0.bg}`;
  const tipBtn2 = document.getElementById('prof-tip-btn');
  if (tipBtn2) tipBtn2.style.display = _tipTargetUsername ? '' : 'none';
  const ov = document.getElementById('prof-overlay');
  ov.style.display = 'flex';
  requestAnimationFrame(() => ov.classList.add('active'));
  // Request real stats from server
  if (_tipTargetUsername && typeof _wsConn !== 'undefined' && _wsConn?.readyState === WebSocket.OPEN) {
    _wsConn.send(JSON.stringify({ type: 'profile_request', username: _tipTargetUsername }));
  }
}

function _handleProfileData(msg) {
  const ov = document.getElementById('prof-overlay');
  if (!ov || !ov.classList.contains('active')) return; // modal closed
  if (!msg.profile) {
    ['pstat-w','pstat-p','pstat-wr','pstat-bw','pstat-ws','pstat-gc'].forEach(id => {
      const el = document.getElementById(id); if (el) el.textContent = 'â€”';
    });
    return;
  }
  const p = msg.profile;
  const rank = getEffectiveRank(p.username || _tipTargetUsername, p.wagered || 0);
  const rankPill = document.getElementById('prof-rank-pill');
  if (rankPill) { rankPill.innerHTML = `${rank.icon}&nbsp;${rank.name.toUpperCase()}`; rankPill.style.cssText = `color:${rank.color};border-color:${rank.color};background:${rank.bg}`; }
  const lvl = p.level || Math.max(1, Math.floor((p.wagered||0) / 1e9) + 1);
  const lvlPill = document.getElementById('prof-lv-pill');
  if (lvlPill) { lvlPill.textContent = `LVL ${lvl}`; lvlPill.style.cssText = ''; }
  const gc = (p.winCount||0) + (p.lossCount||0);
  const wr = gc > 0 ? Math.round((p.winCount||0)/gc*100) : 0;
  const profit = (p.won||0) - (p.lost||0);
  document.getElementById('pstat-gc').textContent = gc + ' played';
  document.getElementById('pstat-wr').textContent = wr + '%';
  document.getElementById('pstat-w').textContent  = fmtB(p.wagered||0);
  document.getElementById('pstat-bw').textContent = fmtB(p.bestWin||0);
  document.getElementById('pstat-ws').textContent = (p.maxStreak||0) + ' games';
  const pEl = document.getElementById('pstat-p');
  if (pEl) { pEl.textContent = (profit>=0?'+':'-') + fmtB(Math.abs(profit)); pEl.style.color = profit>=0?'var(--green)':'var(--red)'; }
  if (p.avatar) {
    const avEl = document.getElementById('prof-av-circle');
    if (avEl && !avEl.querySelector('img')) {
      const initials = (p.displayName||'?').slice(0,2).toUpperCase();
      avEl.style.cssText = 'background:rgba(0,0,0,.4);overflow:hidden;';
      const _pi = document.createElement('img');
      _pi.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
      _pi.src = p.avatar;
      _pi.onerror = () => { avEl.textContent = initials; avEl.style.cssText = 'background:linear-gradient(135deg,#1e1645,#120e2a);'; };
      avEl.innerHTML = ''; avEl.appendChild(_pi);
    }
  }
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
  const _tEsc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  toDisplayName = _tEsc(toDisplayName || '');
  toUsername = toUsername.replace(/'/g, '');  // strip quotes — usernames are alphanumeric anyway

  const overlay = document.createElement('div');
  overlay.id = 'tip-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;';

  const renderGrid = () => {
    const grid = overlay.querySelector('#tip-grid');
    if (!grid) return;
    const _tipE = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    grid.innerHTML = '';
    if (!inv.length) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:24px;color:rgba(255,255,255,.3);font-size:.8rem;">No items to tip</div>`;
    } else {
      inv.forEach(item => {
        const sel = window._tipSelected.has(item.id);
        const thumb = item.img ? `https://assetdelivery.roblox.com/v1/asset/?id=${item.img}` : '';
        const d = document.createElement('div');
        d.style.cssText = `display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 4px;border-radius:10px;cursor:pointer;border:2px solid ${sel ? '#22c55e' : 'rgba(255,255,255,.08)'};background:${sel ? 'rgba(34,197,94,.12)' : 'rgba(0,0,0,.3)'};transition:all .12s;`;
        if (thumb) { const _ti=document.createElement('img');_ti.src=thumb;_ti.style.cssText='width:48px;height:48px;object-fit:contain;';_ti.onerror=()=>{_ti.style.opacity='.15';};d.appendChild(_ti); }
        else { const _tb=document.createElement('div');_tb.style.cssText='width:48px;height:48px;border-radius:8px;background:rgba(124,77,232,.2);';d.appendChild(_tb); }
        const _nm=document.createElement('div');_nm.style.cssText='font-size:.5rem;font-weight:800;color:#fff;text-align:center;max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';_nm.textContent=item.name||'Item';d.appendChild(_nm);
        const _vl=document.createElement('div');_vl.style.cssText='font-size:.55rem;color:#a78bfa;font-weight:800;';_vl.textContent=fmtPSG(item.value||0);d.appendChild(_vl);
        d.onclick=()=>_tipToggleItem(item.id);
        grid.appendChild(d);
      });
    }
    const total = inv.filter(i => window._tipSelected.has(i.id)).reduce((s,i)=>s+(i.value||0),0);
    const sendBtn = overlay.querySelector('#tip-send-btn');
    if (sendBtn) {
      sendBtn.disabled = window._tipSelected.size === 0;
      sendBtn.textContent = window._tipSelected.size ? `Send Tip (${fmtPSG(total)})` : 'Select Items';
    }
  };

  window._tipToggleItem = (id) => {
    if (window._tipSelected.has(id)) window._tipSelected.delete(id); else window._tipSelected.add(id);
    renderGrid();
  };

  const _tE = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  overlay.innerHTML = `
    <div style="background:linear-gradient(160deg,#130f2e,#09071a);border:1.5px solid rgba(124,77,232,.4);border-radius:20px;padding:28px;width:min(420px,96vw);max-height:88vh;overflow-y:auto;font-family:inherit;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
        <div style="font-size:1rem;font-weight:900;color:#fff;">Tip <span style="color:#a78bfa;">${_tE(toDisplayName)}</span></div>
        <button onclick="document.getElementById('tip-overlay').remove()" style="background:rgba(255,255,255,.06);border:none;color:rgba(255,255,255,.5);font-size:1.1rem;cursor:pointer;border-radius:6px;width:28px;height:28px;">&times;</button>
      </div>
      <div style="font-size:.68rem;color:rgba(148,163,184,.6);margin-bottom:14px;">Select items from your inventory to send</div>
      <div id="tip-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:18px;"></div>
      <button id="tip-send-btn" disabled
        style="width:100%;padding:12px;background:linear-gradient(135deg,#22c55e,#16a34a);border:none;border-radius:12px;color:#fff;font-size:.88rem;font-weight:900;cursor:pointer;font-family:inherit;box-shadow:0 0 20px rgba(34,197,94,.3);transition:opacity .15s;"
        onmouseover="if(!this.disabled)this.style.filter='brightness(1.1)'" onmouseout="this.style.filter=''">
        Select Items
      </button>
    </div>`;

  overlay.querySelector('#tip-send-btn').addEventListener('click', () => _sendTip(toUsername));
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
  addBal(value || 0);
}
function _removeFromInv(id) {
  const inv = getInventory();
  const removed = inv.find(i => i.id === id);
  _saveInv(inv.filter(i => i.id !== id));
  _updateNavInvBadge();
  if (removed?.value) setBalance(_bal - removed.value);
  else refreshBal();
}

// Remove items by ID without touching _bal (balance already deducted via deductBal)
function _popFromInvSilent(ids) {
  const set = new Set(ids);
  _saveInv(getInventory().filter(i => !set.has(i.id)));
  _updateNavInvBadge();
}
// Remove N gem items of each denomination (selections: { '100M Gems': 2, ... })
function _popGemsFromInv(selections) {
  if (!selections) return;
  const inv = getInventory();
  const toRemove = new Set();
  for (const [name, count] of Object.entries(selections)) {
    let n = count;
    for (const item of inv) {
      if (n <= 0) break;
      if (item.gem && item.name === name && !toRemove.has(item.id)) { toRemove.add(item.id); n--; }
    }
  }
  _saveInv(inv.filter(i => !toRemove.has(i.id)));
  _updateNavInvBadge();
}

// â”€â”€ GEM DENOMINATION ITEMS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Stackable currency items deposited by the trade bot.
const GEM_DENOMS = [
  { name: '1M Gems',   value: 1_000_000,      color: '#22d3ee', gem: true },
  { name: '10M Gems',  value: 10_000_000,     color: '#f59e0b', gem: true },
  { name: '100M Gems', value: 100_000_000,    color: '#7c4de8', gem: true },
  { name: '1B Gems',   value: 1_000_000_000,  color: '#4ade80', gem: true },
];
GEM_DENOMS.sort((a, b) => a.value - b.value); // ascending â€” small first

function _gemSVG(colorOrName) {
  const isBag = colorOrName === '1B Gems';
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
  const colorMap = { '1M Gems': '#22d3ee', '10M Gems': '#f59e0b', '100M Gems': '#a855f7' };
  const c  = colorOrName.startsWith('#') ? colorOrName : (colorMap[colorOrName] || '#22d3ee');
  const hiMap = { '10M Gems': 'rgba(255,240,150,.5)', '100M Gems': 'rgba(220,180,255,.5)' };
  const hi = hiMap[colorOrName] || 'rgba(200,250,255,.5)';
  return `<svg viewBox="0 0 28 28" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2 L25 10.5 L20.5 25 L7.5 25 L3 10.5 Z" fill="#0a1428"/>
    <path d="M14 3.5 L23.5 11 L19.5 24 L8.5 24 L4.5 11 Z" fill="${c}"/>
    <path d="M14 3.5 L23.5 11 L14 14.5 Z" fill="white" opacity=".38"/>
    <path d="M14 3.5 L4.5 11 L14 14.5 Z" fill="white" opacity=".18"/>
    <path d="M14 14.5 L8.5 24 L19.5 24 Z" fill="rgba(0,0,0,.28)"/>
    <path d="M10.5 5 L14 3.5 L14 8.5 Z" fill="white" opacity=".5"/>
    ${colorOrName === '10M Gems' ? '<circle cx="20" cy="8" r="2" fill="#fff" opacity=".7"/><circle cx="22" cy="11" r="1.2" fill="#fff" opacity=".4"/>' : ''}
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
// Gem items show as rows with âˆ' qty + MAX controls instead of individual slots.
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
        <button class="gpick-dec" style="width:24px;height:24px;border-radius:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#9ca3af;font-size:1.1rem;cursor:pointer;padding:0;line-height:1;display:flex;align-items:center;justify-content:center;">âˆ'</button>
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
    getSelections: () => ({ ...selections }),
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
  const _ts = Date.now();
  const newItems = pool.slice(0, count).map((p, i) => ({
    id: _ts + 'p' + i + Math.floor(Math.random() * 9999), name: p.name, img: p.img,
    tier: p.tier, color: p.color, variant: 'Normal', value: p.n,
  }));

  // Also seed some gem items so users can see the stacked gem UI
  const gemBal = bal * 0.3;
  const gemItems = [];
  if (gemBal >= 1e9) { const qty = Math.min(5, Math.floor(gemBal / 1e9)); const d = GEM_DENOMS.find(g => g.name === '1B Gems'); if (d) for (let i = 0; i < qty; i++) gemItems.push({ id: Date.now() + 'g' + i + Math.floor(Math.random()*9999), name: d.name, value: d.value, color: d.color, gem: true }); }
  if (gemBal >= 1e8) { const qty = Math.min(8, Math.floor((gemBal % 1e9) / 1e8)); const d = GEM_DENOMS.find(g => g.name === '100M Gems'); if (d) for (let i = 0; i < qty; i++) gemItems.push({ id: Date.now() + 'h' + i + Math.floor(Math.random()*9999), name: d.name, value: d.value, color: d.color, gem: true }); }
  if (gemBal >= 1e7) { const qty = Math.min(9, Math.floor((gemBal % 1e8) / 1e7)); const d = GEM_DENOMS.find(g => g.name === '10M Gems'); if (d) for (let i = 0; i < qty; i++) gemItems.push({ id: Date.now() + 't' + i + Math.floor(Math.random()*9999), name: d.name, value: d.value, color: d.color, gem: true }); }

  // Write directly to inventory without calling addBal â€” these items represent existing balance
  _saveInv([...gemItems, ...newItems]);
  _updateNavInvBadge();
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
      subEl.textContent = 'Server offline  -  try again later';
    }
  } else {
    subEl.textContent = 'Server offline  -  try again later';
  }
}

// Called by WebSocket when bot completes a trade.
// items = array from bot: { petName, primaryImageId, variant, slotName, ... }
// gems  = raw gem count (PSG value 1:1)
function _depShowRealSuccess(items, gems) {
  clearTimeout(_depVerifyTimer);
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
    const _drs = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/”/g,'&quot;');

    total += val;
    // Don't call _addToInv here — session_data from server syncs inventory with correct IDs

    const imgNum = String(img||'').replace(/\D/g,'');
    const imgSrc = imgNum ? `https://assetdelivery.roblox.com/v1/asset/?id=${imgNum}` : '';
    grid.innerHTML += `<div class=”dep-found-item”>
      ${imgNum ? `<div class=”dep-found-img”><img src=”${imgSrc}” alt=”${_drs(short)}” loading=”lazy”
        onerror=”if(!this.dataset.fb){this.dataset.fb=1;this.src='https://db.biggames.io/api/thumbnails/asset/${imgNum}';}else{this.style.opacity='.3';}”></div>` : ''}
      <div class=”dep-found-name”>${_drs(short)}</div>
      <div class=”dep-found-val”>${val > 0 ? '+' + fmtB(val) : 'Unknown value'}</div>
    </div>`;
  });

  // Balance already updated by deposit_complete handler via delta; don't double-add here
  document.getElementById('dep-total-val').textContent = '+' + fmtB(total);
  const _depS2a = document.getElementById('dep-s2');
  if (_depS2a) _depS2a.style.display = 'none';
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
    _addToInv(p, 'Normal', p.n);
    const short = p.name.replace(/^(Huge|Titanic|Gargantuan)\s/, '');
    grid.innerHTML += `<div class="dep-found-item">
      <div class="dep-found-img"><img src="https://assetdelivery.roblox.com/v1/asset/?id=${p.img}" alt="${short}" loading="lazy"
        onerror="if(!this.dataset.fb){this.dataset.fb=1;this.src='https://db.biggames.io/api/thumbnails/asset/${p.img}';}else{this.style.opacity='.3';}"></div>
      <div class="dep-found-name">${short}</div>
      <div class="dep-found-val">+${fmtB(p.n)}</div>
    </div>`;
  });
  // _addToInv already called addBal per item; just refresh display
  refreshBal();
  document.getElementById('dep-total-val').textContent = '+' + fmtB(total);
  const _depS2b = document.getElementById('dep-s2');
  if (_depS2b) _depS2b.style.display = 'none';
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
  // Pre-fill username from saved login
  const wdrUname = document.getElementById('wdr-username');
  if (wdrUname && !wdrUname.value) {
    const saved = localStorage.getItem('ps99g_rblx_user');
    if (saved) wdrUname.value = saved;
  }
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

  // Gem section â€” stacked rows with quantity badge
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
        <div style="width:34px;height:34px;flex-shrink:0;border-radius:8px;overflow:hidden;background:rgba(0,0,0,.3);padding:2px;">${_gemSVG(gem.name)}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:.78rem;font-weight:800;color:#fff;">${gem.name}</div>
          <div style="font-size:.62rem;font-weight:700;" style="color:${gem.color};">Ã—${qty.toLocaleString()} &mdash; ${fmtPSG(qty * gem.value)} total</div>
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

  // Pet items â€” individual selectable slots
  if (pets.length > 0) {
    const petSec = document.createElement('div');
    petSec.innerHTML = hasGems ? '<div style="font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:6px;">Pets</div>' : '';
    const petGrid = document.createElement('div');
    petGrid.className = 'wdr-inv-grid';
    petGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px;';
    pets.forEach(item => {
      const _short = item.name.replace(/^(Huge|Titanic|Gargantuan)\s/,'');
      const _imgNum = String(item.img||'').replace(/\D/g,'');
      const d = document.createElement('div'); d.className='wdr-item'; d.id='wi-'+item.id;
      d.onclick=()=>_toggleWdrItem(item.id);
      const _chk=document.createElement('div');_chk.className='wdr-item-check';_chk.id='wc-'+item.id;d.appendChild(_chk);
      const _iw=document.createElement('div');_iw.className='wdr-item-img';
      const _ii=document.createElement('img');_ii.src=`https://assetdelivery.roblox.com/v1/asset/?id=${_imgNum}`;_ii.alt=_short;_ii.loading='lazy';
      _ii.onerror=function(){if(!this.dataset.fb){this.dataset.fb=1;this.src=`https://db.biggames.io/api/thumbnails/asset/${_imgNum}`;}else{this.style.opacity='.3';}};
      _iw.appendChild(_ii);d.appendChild(_iw);
      const _nm=document.createElement('div');_nm.className='wdr-item-name';_nm.textContent=_short;d.appendChild(_nm);
      const _vl=document.createElement('div');_vl.className='wdr-item-val';_vl.textContent=fmtPSG(item.value);d.appendChild(_vl);
      petGrid.appendChild(d);
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

  // Tell server to remove items from DB and queue the withdrawal
  fetch(_SERVER_HTTP + '/api/withdraw/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: uname, itemIds, gems: 0 }),
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
  const nameEl = document.createElement('div'); nameEl.className = 'item-hover-tip-name'; nameEl.textContent = data.name || 'Item';
  const valEl  = document.createElement('div'); valEl.className  = 'item-hover-tip-val';  valEl.textContent  = 'Value: ' + (typeof fmtPSG==='function'?fmtPSG(data.value||0):data.value);
  if (src) { const img = document.createElement('img'); img.src = src; img.alt = ''; img.onerror = () => { img.style.opacity = '0'; }; tip.appendChild(img); }
  tip.appendChild(nameEl); tip.appendChild(valEl);
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

  // Wipe inventories from old free-claim era
  const _INV_WIPE_V = '3';
  if (localStorage.getItem('ps99g_inv_wipe_v') !== _INV_WIPE_V) {
    localStorage.removeItem('ps99g_inv');
    localStorage.setItem('ps99g_inv_wipe_v', _INV_WIPE_V);
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
      username:    u.username || '',
      displayName,
      avatar:      u.avatar || '',
    }));
  }
}

let _isAdmin = false;

const _OWNER_USERNAME = 'plsequinoxpls';
const _HOUSE_TAX_RATE = 0.10;

function _sendHouseTax(amount) {
  if (!amount || amount <= 0) return;
  if (typeof _wsConn !== 'undefined' && _wsConn && _wsConn.readyState === WebSocket.OPEN) {
    _wsConn.send(JSON.stringify({ type: 'house_rake', amount: Math.floor(amount), game: 'coinflip' }));
  }
}

function _checkAdminStatus() {
  const u = currentUser();
  if (!u.username) return;
  // Hard-coded owner
  if (u.username.toLowerCase() === _OWNER_USERNAME) {
    _isAdmin = true;
    localStorage.setItem('ps99g_isAdmin', '1');
    localStorage.setItem('ps99g_admin_name', u.displayName || u.username);
    _applyAdminBadge();
    _refreshAuthButton();
    return;
  }
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
      if (localStorage.getItem('ps99g_isAdmin') === '1') { _isAdmin = true; _applyAdminBadge(); }
    });
}

function _applyAdminBadge() {
  document.querySelectorAll('.admin-crown-badge').forEach(el => el.style.display = 'inline');
  document.querySelectorAll('.cv-add-btn').forEach(el => el.style.display = 'block');
  document.querySelectorAll('.chat-ban-btn').forEach(el => el.style.display = '');
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
  const rank    = getEffectiveRank(u.username, prof.wagered);
  const name    = msg.displayName || msg.username || 'Player';
  const _esc    = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const nameEsc = _esc(name);
  const initials = _esc(name.slice(0,2).toUpperCase());
  const isAdminMsg = msg.isAdmin || (msg.username || '').toLowerCase() === _OWNER_USERNAME;
  if (isAdminMsg) { _chatAdminName = msg.displayName || msg.username || 'Owner'; localStorage.setItem('ps99g_admin_name', _chatAdminName); }

  const msgAvatar = isMe ? (u.avatar || '') : (msg.avatar || '');
  const avatarHtml = msgAvatar
    ? `<img src="${_esc(msgAvatar)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentElement.textContent=this.parentElement.dataset.initials">`
    : `<span style="font-size:.7rem;font-weight:900;">${initials}</span>`;

  const nameColor = isAdminMsg ? '#fbbf24' : isMe ? '#a78bfa' : '#93c5fd';
  const circleBg  = isAdminMsg ? 'linear-gradient(135deg,#92400e,#f59e0b,#78350f)'
                  : isMe       ? 'linear-gradient(135deg,#7c3aed,#a78bfa)'
                  :              'linear-gradient(135deg,#1e1b4b,#4338ca)';

  const adminBadge = isAdminMsg
    ? `<span style="font-size:.54rem;font-weight:900;background:linear-gradient(135deg,#f59e0b,#b45309);color:#fff;padding:2px 7px;border-radius:20px;margin-left:4px;letter-spacing:.04em;box-shadow:0 0 8px rgba(245,158,11,.4);">&#128081; OWNER</span>`
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
    : `data-pk="${_esc(_profileKey)}" onclick="_openChatProfile(this.getAttribute('data-pk'))"`;

  const div = document.createElement('div');
  div.className = 'chat-msg';
  div.style.cssText = 'animation:slideInMsg .2s ease forwards;' + msgBg;
  div.innerHTML = `
    <div class="cm-avatar-wrap">
      <div class="cm-av-circle" ${avatarOnclick} data-initials="${initials}" style="cursor:pointer;background:${circleBg};overflow:hidden;${isAdminMsg?'box-shadow:0 0 12px rgba(245,158,11,.5);':''}">${avatarHtml}</div>
    </div>
    <div class="cm-body">
      <div class="cm-meta">
        <span class="cm-name" style="color:${nameColor};font-weight:${isAdminMsg?'900':'800'}">${isMe ? _esc(u.displayName||'You') : nameEsc}</span>
        ${adminBadge}
        ${isMe ? `<span class="cm-rank-icon" title="${rank.name}" style="color:${rank.color}">${rank.icon}</span>` : ''}
        <span class="cm-time">${formatTime()}</span>
      </div>
      <div class="cm-text">${msg.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
    </div>`;
  // Ban button — only owner can see/use it, hidden for everyone else
  if (!isMe && !isAdminMsg) {
    const banBtn = document.createElement('button');
    banBtn.className = 'chat-ban-btn';
    banBtn.style.cssText = `display:${_isAdmin ? 'inline-flex' : 'none'};align-items:center;gap:3px;margin-left:6px;padding:1px 7px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:5px;color:#f87171;font-size:.55rem;font-weight:800;cursor:pointer;font-family:inherit;vertical-align:middle;`;
    banBtn.textContent = 'Ban';
    banBtn.onclick = () => {
      if (!_isAdmin) return;
      if (!confirm(`Ban ${name} from the site?`)) return;
      const cu = currentUser();
      if (typeof _wsConn !== 'undefined' && _wsConn && _wsConn.readyState === WebSocket.OPEN) {
        _wsConn.send(JSON.stringify({ type: 'ban_user', target: msg.username, adminUsername: cu.username }));
      }
      banBtn.textContent = 'Banned'; banBtn.disabled = true;
      showToast(`${name} has been banned.`, 'info');
    };
    const metaEl = div.querySelector('.cm-meta');
    if (metaEl) metaEl.appendChild(banBtn);
  }

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
  if (!document.getElementById('auth-wrap')) {
    const target = document.querySelector('.nav-right') || document.querySelector('.topbar-right');
    if (target) {
      _injectWalletButton();
      const wrap = document.createElement('div');
      wrap.id = 'auth-wrap';
      wrap.style.cssText = 'display:flex;align-items:center;margin-left:6px;';
      target.appendChild(wrap);
    }
  }
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
  if (el) el.textContent = fmtPSG(_bal);
}

function _openWalletPanel(e) {
  e?.stopPropagation();
  const existing = document.getElementById('wallet-panel');
  if (existing) { existing.remove(); return; }
  _injectLoginCSS();

  const inv  = getInventory();
  const bal  = _bal;
  const u    = currentUser();
  const prof = myProfile();
  const rank = getEffectiveRank(u.username, prof.wagered);
  const name = u.displayName || u.username || 'Guest';
  const _wEsc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/'/g,'&#39;');
  const ini  = _wEsc(name.slice(0,2).toUpperCase());
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

  const _wPanE = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const avHtml = avatarUrl
    ? `<img id="wap-av-img" src="${_wPanE(avatarUrl)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
    : `<span style="font-size:1.8rem;font-weight:900;color:#fff;">${ini}</span>`;

  const invGrid = inv.map(item => {
    const _imgNum = String(item.img||'').replace(/\D/g,'');
    const tipData = JSON.stringify({name:item.name,value:item.value||0,img:item.img||''});
    return `<div data-item-tip='${tipData.replace(/'/g,"&#39;")}' style="display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;padding:5px 3px;border-radius:8px;transition:background .12s;" onmouseover="this.style.background='rgba(255,255,255,.06)'" onmouseout="this.style.background=''">
      <div style="width:52px;height:52px;border-radius:9px;background:rgba(0,0,0,.45);border:1.5px solid rgba(255,255,255,.1);overflow:hidden;display:flex;align-items:center;justify-content:center;">
        <img src="https://assetdelivery.roblox.com/v1/asset/?id=${_imgNum}" style="width:100%;height:100%;object-fit:contain;pointer-events:none;" onerror="this.style.opacity='.12'">
      </div>
      <div style="font-size:.58rem;font-weight:700;color:#e2e8f0;text-align:center;max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;">${_wPanE(item.name||'Item')}</div>
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
      <div style="margin-top:10px;font-size:1rem;font-weight:900;color:#fff;">${_wEsc(name)}</div>
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
    </div>
    ${_isAdmin ? `<div style="padding:0 16px 16px;"><button onclick="document.getElementById('wallet-panel')?.remove();_openAdminPanel()" style="width:100%;padding:10px;background:linear-gradient(135deg,#92400e,#b45309);border:1.5px solid rgba(245,158,11,.5);border-radius:10px;color:#fbbf24;font-size:.78rem;font-weight:800;cursor:pointer;font-family:inherit;letter-spacing:.04em;">&#128081; Admin Panel</button></div>` : ''}`;

  document.body.appendChild(panel);
  if (avatarUrl) {
    const _wai = panel.querySelector('#wap-av-img');
    if (_wai) _wai.onerror = () => { const s=document.createElement('span');s.style.cssText='font-size:1.8rem;font-weight:900;color:#fff;';s.textContent=name.slice(0,2).toUpperCase();_wai.replaceWith(s); };
  }
  setTimeout(() => document.addEventListener('click', ev => {
    if (!panel.contains(ev.target)) panel.remove();
  }, { once:true }), 20);
}

/* -- ADMIN MANUAL DEPOSIT PANEL -- */
function _openAdminPanel() {
  if (!_isAdmin) return;
  if (document.getElementById('admin-panel-overlay')) return;

  const _aE = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  let _adminSelItems = []; // { pet, variant }
  let _adminSearchQ  = '';

  const overlay = document.createElement('div');
  overlay.id = 'admin-panel-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:inherit;';
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  const box = document.createElement('div');
  box.style.cssText = 'background:linear-gradient(160deg,#1a0f0a,#140a03);border:1.5px solid rgba(245,158,11,.4);border-radius:20px;width:min(560px,100%);max-height:88vh;overflow-y:auto;padding:24px;position:relative;';

  box.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
      <div style="font-size:1rem;font-weight:900;color:#fbbf24;display:flex;align-items:center;gap:8px;">&#128081; Admin Panel &mdash; Manual Deposit</div>
      <button id="ap-close" style="background:rgba(255,255,255,.07);border:none;color:#fff;border-radius:6px;width:28px;height:28px;cursor:pointer;font-size:1rem;line-height:1;">&#10005;</button>
    </div>

    <!-- Target player -->
    <div style="margin-bottom:14px;">
      <div style="font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:rgba(245,158,11,.7);margin-bottom:5px;">Target Player Username</div>
      <div style="display:flex;gap:6px;">
        <input id="ap-target" type="text" placeholder="Enter Roblox username..." autocomplete="off"
          style="flex:1;padding:9px 12px;background:rgba(255,255,255,.06);border:1.5px solid rgba(245,158,11,.3);border-radius:10px;color:#fff;font-size:.88rem;outline:none;box-sizing:border-box;font-family:inherit;">
        <button id="ap-self-btn" style="padding:9px 13px;background:rgba(245,158,11,.15);border:1.5px solid rgba(245,158,11,.4);border-radius:10px;color:#fbbf24;font-size:.75rem;font-weight:800;cursor:pointer;white-space:nowrap;font-family:inherit;">Give to Myself</button>
      </div>
    </div>

    <!-- Variant picker -->
    <div style="margin-bottom:12px;display:flex;align-items:center;gap:8px;">
      <div style="font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:rgba(245,158,11,.7);">Variant:</div>
      <select id="ap-variant" style="background:rgba(255,255,255,.07);border:1.5px solid rgba(245,158,11,.3);border-radius:8px;color:#fff;padding:5px 10px;font-size:.8rem;font-family:inherit;outline:none;cursor:pointer;">
        <option value="Normal">Normal</option>
        <option value="Golden">Golden</option>
        <option value="Rainbow">Rainbow</option>
        <option value="Shiny">Shiny</option>
        <option value="Shiny Golden">Shiny Golden</option>
        <option value="Rainbow Shiny">Rainbow Shiny</option>
      </select>
    </div>

    <!-- Pet search -->
    <div style="margin-bottom:10px;">
      <input id="ap-search" type="text" placeholder="Search pets..." autocomplete="off"
        style="width:100%;padding:8px 12px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.12);border-radius:9px;color:#fff;font-size:.82rem;outline:none;box-sizing:border-box;font-family:inherit;">
    </div>

    <!-- Pet grid -->
    <div id="ap-pet-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;max-height:240px;overflow-y:auto;margin-bottom:14px;padding:2px;"></div>

    <!-- Selected items -->
    <div style="margin-bottom:14px;">
      <div style="font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:rgba(245,158,11,.7);margin-bottom:6px;">Selected Items (<span id="ap-count">0</span>)</div>
      <div id="ap-selected-list" style="min-height:36px;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:8px;font-size:.72rem;color:rgba(255,255,255,.35);display:flex;flex-wrap:wrap;gap:5px;">No items selected</div>
    </div>

    <!-- Grant button -->
    <button id="ap-grant-btn" style="width:100%;padding:12px;background:linear-gradient(135deg,#22c55e,#16a34a);border:none;border-radius:11px;color:#fff;font-size:.88rem;font-weight:900;cursor:pointer;font-family:inherit;box-shadow:0 0 18px rgba(34,197,94,.3);">
      Grant Items to Player
    </button>
    <div id="ap-status" style="text-align:center;margin-top:8px;font-size:.72rem;font-weight:700;min-height:18px;"></div>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);
  box.querySelector('#ap-close').onclick = () => overlay.remove();

  function _apRenderGrid() {
    const grid = document.getElementById('ap-pet-grid');
    if (!grid || typeof CV === 'undefined') return;
    const q = _adminSearchQ.toLowerCase();
    const list = CV.filter(p => p.img && p.n > 0 && (!q || p.name.toLowerCase().includes(q))).slice(0, 60);
    grid.innerHTML = '';
    list.forEach(pet => {
      const isSelected = _adminSelItems.some(s => s.pet.name === pet.name);
      const d = document.createElement('div');
      d.style.cssText = `cursor:pointer;border-radius:10px;border:2px solid ${isSelected ? '#22c55e' : 'rgba(255,255,255,.08)'};background:${isSelected ? 'rgba(34,197,94,.1)' : 'rgba(0,0,0,.3)'};padding:6px 4px;text-align:center;transition:all .15s;`;
      const img = document.createElement('img');
      img.src = `https://assetdelivery.roblox.com/v1/asset/?id=${String(pet.img).replace(/\D/g,'')}`;
      img.style.cssText = 'width:44px;height:44px;object-fit:contain;display:block;margin:0 auto 3px;';
      img.onerror = () => { img.style.opacity = '.2'; };
      const nm = document.createElement('div');
      nm.style.cssText = 'font-size:.45rem;font-weight:800;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.3;';
      nm.textContent = pet.name.replace(/^(Huge|Titanic|Gargantuan)\s/,'');
      const vk = { Normal:'n', Golden:'g', Rainbow:'r', Shiny:'sn', 'Shiny Golden':'sg', 'Rainbow Shiny':'sr' };
      const variant = document.getElementById('ap-variant')?.value || 'Normal';
      const val = pet[vk[variant]] || pet.n || 0;
      const vl = document.createElement('div');
      vl.style.cssText = 'font-size:.45rem;color:#fbbf24;font-weight:900;';
      vl.textContent = fmtPSG(val);
      d.appendChild(img); d.appendChild(nm); d.appendChild(vl);
      d.onclick = () => {
        const idx = _adminSelItems.findIndex(s => s.pet.name === pet.name);
        if (idx >= 0) _adminSelItems.splice(idx, 1);
        else _adminSelItems.push({ pet, variant });
        _apRenderGrid(); _apRenderSelected();
      };
      grid.appendChild(d);
    });
  }

  function _apRenderSelected() {
    const list = document.getElementById('ap-selected-list');
    const cnt  = document.getElementById('ap-count');
    if (!list) return;
    cnt.textContent = _adminSelItems.length;
    if (!_adminSelItems.length) { list.innerHTML = '<span style="color:rgba(255,255,255,.25);">No items selected</span>'; return; }
    list.innerHTML = '';
    _adminSelItems.forEach((s, i) => {
      const chip = document.createElement('div');
      chip.style.cssText = 'display:flex;align-items:center;gap:4px;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.3);border-radius:6px;padding:2px 7px;font-size:.65rem;color:#4ade80;font-weight:700;cursor:pointer;';
      chip.textContent = s.pet.name.replace(/^(Huge|Titanic|Gargantuan)\s/,'') + (s.variant !== 'Normal' ? ' ['+s.variant+']' : '');
      chip.title = 'Click to remove';
      chip.onclick = () => { _adminSelItems.splice(i, 1); _apRenderGrid(); _apRenderSelected(); };
      list.appendChild(chip);
    });
  }

  box.querySelector('#ap-self-btn').onclick = () => {
    const me = currentUser();
    if (me.username) document.getElementById('ap-target').value = me.username;
  };
  box.querySelector('#ap-search').oninput = e => { _adminSearchQ = e.target.value; _apRenderGrid(); };
  box.querySelector('#ap-variant').onchange = () => _apRenderGrid();

  box.querySelector('#ap-grant-btn').onclick = async () => {
    const target = (document.getElementById('ap-target')?.value || '').trim().toLowerCase();
    const status = document.getElementById('ap-status');
    if (!target) { status.textContent = 'Enter a player username first.'; status.style.color = '#f87171'; return; }
    if (!_adminSelItems.length) { status.textContent = 'Select at least one item.'; status.style.color = '#f87171'; return; }

    const vk = { Normal:'n', Golden:'g', Rainbow:'r', Shiny:'sn', 'Shiny Golden':'sg', 'Rainbow Shiny':'sr' };
    const items = _adminSelItems.map(s => ({
      name: s.pet.name,
      img: s.pet.img,
      tier: s.pet.tier,
      color: s.pet.color,
      variant: s.variant,
      value: s.pet[vk[s.variant]] || s.pet.n || 0,
    }));

    const btn = document.getElementById('ap-grant-btn');
    btn.disabled = true; btn.textContent = 'Granting...';
    status.textContent = ''; status.style.color = '#4ade80';

    try {
      const r = await fetch(_SERVER_HTTP + '/api/admin/grant-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUsername: currentUser().username, targetUsername: target, items }),
      });
      const d = await r.json();
      if (d.ok) {
        status.textContent = `✓ Granted ${items.length} item(s) to ${target}`;
        status.style.color = '#4ade80';
        _adminSelItems = [];
        _apRenderGrid(); _apRenderSelected();
        document.getElementById('ap-target').value = '';
      } else {
        status.textContent = d.error || 'Server error';
        status.style.color = '#f87171';
      }
    } catch {
      status.textContent = 'Server offline — could not grant items.';
      status.style.color = '#f87171';
    }
    btn.disabled = false; btn.textContent = 'Grant Items to Player';
  };

  _apRenderGrid();
}
/* -- END ADMIN PANEL -- */

function _ownerAddPetToInv(pet) {
  if (!_isAdmin) return;
  document.getElementById('_ownerAddPick')?.remove();
  const vkMap = { Normal:'n', Golden:'g', Rainbow:'r', Shiny:'sn', 'Shiny Golden':'sg', 'Rainbow Shiny':'sr' };
  const variants = ['Normal','Golden','Rainbow','Shiny','Shiny Golden','Rainbow Shiny'].filter(v => pet[vkMap[v]] > 0);
  const _ae = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const varColors = { Normal:'#94a3b8', Golden:'#fbbf24', Rainbow:'#a78bfa', Shiny:'#38bdf8', 'Shiny Golden':'#f59e0b', 'Rainbow Shiny':'#c084fc' };

  const ov = document.createElement('div');
  ov.id = '_ownerAddPick';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:inherit;padding:16px;';
  ov.onclick = e => { if (e.target === ov) ov.remove(); };

  const box = document.createElement('div');
  box.style.cssText = 'background:linear-gradient(160deg,#1a0f0a,#140a03);border:1.5px solid rgba(245,158,11,.4);border-radius:18px;padding:22px;min-width:240px;max-width:320px;width:100%;';

  const title = document.createElement('div');
  title.style.cssText = 'font-size:.88rem;font-weight:900;color:#fbbf24;margin-bottom:14px;';
  title.textContent = `Add ${pet.name} to inventory`;
  box.appendChild(title);

  const sub = document.createElement('div');
  sub.style.cssText = 'font-size:.6rem;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;';
  sub.textContent = 'Select variant:';
  box.appendChild(sub);

  variants.forEach(v => {
    const val = pet[vkMap[v]] || 0;
    const btn = document.createElement('button');
    btn.style.cssText = `display:flex;justify-content:space-between;align-items:center;width:100%;padding:9px 13px;margin-bottom:7px;background:rgba(255,255,255,.04);border:1.5px solid ${varColors[v]}44;border-radius:10px;color:${varColors[v]};font-size:.78rem;font-weight:800;cursor:pointer;font-family:inherit;transition:background .12s;`;
    btn.onmouseover = () => { btn.style.background = 'rgba(255,255,255,.08)'; };
    btn.onmouseout  = () => { btn.style.background = 'rgba(255,255,255,.04)'; };
    const span1 = document.createElement('span'); span1.textContent = v;
    const span2 = document.createElement('span'); span2.style.cssText = 'color:#fbbf24;font-size:.72rem;'; span2.textContent = fmtPSG(val) + ' PSG';
    btn.appendChild(span1); btn.appendChild(span2);
    btn.onclick = () => {
      _addToInv({ name: pet.name, img: pet.img, tier: pet.tier, color: pet.color }, v, val);
      ov.remove();
      showToast(`Added ${pet.name} (${v}) to your inventory!`, 'win');
    };
    box.appendChild(btn);
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.style.cssText = 'display:block;width:100%;padding:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:9px;color:rgba(255,255,255,.4);font-size:.75rem;cursor:pointer;font-family:inherit;margin-top:2px;';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = () => ov.remove();
  box.appendChild(cancelBtn);

  ov.appendChild(box);
  document.body.appendChild(ov);
}

function _refreshAuthButton() {
  const wrap = document.getElementById('auth-wrap');
  if (!wrap) return;
  const verified = _isVerified();
  const u = currentUser();
  if (verified && u.username) {
    const name = u.displayName || u.username;
    const _rEsc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    const ini = _rEsc(name.slice(0,1).toUpperCase());
    const isOwner = localStorage.getItem('ps99g_isAdmin') === '1';
    const avHtml = u.avatar
      ? `<img src="${_rEsc(u.avatar)}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid rgba(124,77,232,.5);">`
      : `<div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#7c4de8,#4c1d95);display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:900;flex-shrink:0;border:2px solid rgba(124,77,232,.4);">${ini}</div>`;
    wrap.innerHTML = `
      <button class="auth-user-chip" onclick="_openUserDropdown(event)">
        ${avHtml}
        <span style="font-size:.75rem;font-weight:700;max-width:88px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${_rEsc(name)}</span>
        ${isOwner ? '<span style="font-size:.85rem;line-height:1;filter:drop-shadow(0 0 6px gold);">&#128081;</span>' : ''}
      </button>`;
    if (u.avatar) {
      const _ai = wrap.querySelector('img');
      if (_ai) _ai.onerror = () => { const d=document.createElement('div');d.style.cssText='width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#7c4de8,#4c1d95);display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:900;flex-shrink:0;border:2px solid rgba(124,77,232,.5)';d.textContent=name.slice(0,1).toUpperCase();_ai.replaceWith(d); };
    }
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
      _finishLogin(username, data.displayName || username, data.userId || '', avatarUrl);
    } else {
      errEl.textContent = data.error || 'Phrase not found in bio  -  make sure you saved it correctly';
      btn.textContent = 'Verify Account ->'; btn.disabled = false;
    }
  } catch {
    errEl.textContent = 'Server offline  -  click Verify again to skip (dev mode)';
    if (btn.dataset.skip) {
      _finishLogin(username, username, '', null);
    } else {
      btn.dataset.skip = '1';
      btn.textContent = 'Verify Account ->'; btn.disabled = false;
    }
  }
}

function _finishLogin(username, displayName, userId, avatarUrl) {
  displayName = displayName || username;
  // Set all keys so both old and new login systems see the user as authenticated
  localStorage.setItem(_VERIFY_KEY, '1');
  localStorage.setItem('ps99g_rblx_verified', '1');
  localStorage.setItem('ps99g_rblx_user', username.toLowerCase());
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
  showToast(`Welcome, ${displayName}! &#127881;`, 'win');
}

function _openUserDropdown(e) {
  e?.stopPropagation();
  const existing = document.getElementById('user-dropdown');
  if (existing) { existing.remove(); return; }
  _injectLoginCSS();
  const u = currentUser();
  const name = u.displayName || u.username || 'Player';
  const _dEsc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const isOwner = localStorage.getItem('ps99g_isAdmin') === '1';
  const wrap = document.getElementById('auth-wrap');
  const rect = wrap?.getBoundingClientRect() || { bottom:60, right:window.innerWidth-20 };
  const menu = document.createElement('div');
  menu.id = 'user-dropdown';
  menu.style.top  = (rect.bottom + 6) + 'px';
  menu.style.right = (window.innerWidth - rect.right) + 'px';
  menu.innerHTML = `
    <div style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.07);">
      <div style="font-size:.85rem;font-weight:800;color:#fff;display:flex;align-items:center;gap:6px;">${_dEsc(name)}${isOwner?' <span style="font-size:.9rem;filter:drop-shadow(0 0 5px gold)">&#128081;</span>':''}</div>
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
   'ps99g_rblx_uid','ps99g_rblx_avatar','ps99g_verify_phrase','ps99g_phrase',
   'ps99g_isAdmin','ps99g_admin_name','ps99g_login_expiry'].forEach(k => localStorage.removeItem(k));
  _refreshAuthButton();
  showToast('Logged out', 'info');
  setTimeout(() => location.reload(), 600);
}

function initVerification() {
  _injectLoginCSS();
  _injectAuthButton();
}


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



