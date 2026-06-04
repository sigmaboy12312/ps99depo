/**
 * PASTE THIS INTO YOUR WEBSITE'S JAVASCRIPT
 * 
 * This handles:
 * 1. Connecting to your server's WebSocket  
 * 2. Showing items when a deposit comes in
 * 3. Loading existing inventory on page load
 * 
 * WebSocket is FREE - it runs on your existing Node.js server.
 * No extra service needed. The ws package you already have handles it.
 */

// ─────────────────────────────────────────────────────────
// CONFIG - change this to your server URL
// ─────────────────────────────────────────────────────────
const SERVER_URL = 'http://localhost:3001';  // change to your real server URL in production
const WS_URL     = 'ws://localhost:3001';    // same but ws:// instead of http://

// ─────────────────────────────────────────────────────────
// 1. CONNECT TO WEBSOCKET (put this in your main JS file)
// ─────────────────────────────────────────────────────────
let socket = null;

function connectWebSocket(robloxUsername) {
    socket = new WebSocket(WS_URL);

    socket.addEventListener('open', () => {
        console.log('[WS] Connected');
        // Tell the server which Roblox user this browser tab belongs to
        socket.send(JSON.stringify({
            type: 'register',
            robloxUsername: robloxUsername
        }));
    });

    socket.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data);

        // ── Deposit came in from the bot ──
        if (msg.type === 'deposit_complete') {
            console.log('[Deposit]', msg);

            // Add each pet to the inventory display
            msg.items.forEach(item => {
                addItemToInventoryUI({
                    petName:  item.petName  || item.name || 'Unknown',
                    variant:  item.variant  || 'Normal',
                    value:    item.value    || 0,
                    imageId:  item.imageId,
                });
            });

            // Update gem display
            if (msg.gems > 0) {
                addGemsToUI(msg.gems);
            }

            // Show a notification
            showNotification(`Deposit received! ${msg.items.length} pets + ${msg.gems.toLocaleString()} gems`);
        }

        // ── Withdrawal sent out ──
        if (msg.type === 'withdrawal_complete') {
            showNotification('Withdrawal sent! Check your trade in-game.');
            loadInventory(robloxUsername); // Refresh inventory
        }
    });

    socket.addEventListener('close', () => {
        console.log('[WS] Disconnected - reconnecting in 3s');
        setTimeout(() => connectWebSocket(robloxUsername), 3000);
    });
}

// ─────────────────────────────────────────────────────────
// 2. LOAD INVENTORY ON PAGE LOAD
// ─────────────────────────────────────────────────────────
async function loadInventory(robloxUsername) {
    try {
        const res  = await fetch(`${SERVER_URL}/api/inventory/${robloxUsername}`);
        const data = await res.json();

        // Clear existing inventory display
        const container = document.getElementById('inventory-container');
        if (container) container.innerHTML = '';

        // Add each item
        (data.inventory || []).forEach(item => {
            addItemToInventoryUI({
                petName: item.pet_name || item.petName,
                variant: item.variant,
                value:   item.value,
                imageId: item.image_id || item.imageId,
                id:      item.id,
            });
        });

        // Update gem balance
        if (data.gems !== undefined) {
            const gemEl = document.getElementById('gem-balance');
            if (gemEl) gemEl.textContent = data.gems.toLocaleString();
        }

    } catch (err) {
        console.error('[Inventory] Load failed:', err);
    }
}

// ─────────────────────────────────────────────────────────
// 3. ADD ITEM TO THE INVENTORY UI
// ─────────────────────────────────────────────────────────
function addItemToInventoryUI(item) {
    const container = document.getElementById('inventory-container');
    if (!container) return;

    const card = document.createElement('div');
    card.className = 'inventory-card';
    card.dataset.petName = item.petName;
    card.dataset.variant  = item.variant;
    card.dataset.id       = item.id || '';

    // Pet image - use Roblox asset if we have imageId
    const imgSrc = item.imageId
        ? `https://assetdelivery.roblox.com/v1/asset/?id=${item.imageId}`
        : '/assets/unknown-pet.png';

    card.innerHTML = `
        <div class="item-image-wrap">
            <img src="${imgSrc}" alt="${item.petName}" onerror="this.src='/assets/unknown-pet.png'">
            ${item.variant !== 'Normal' ? `<span class="variant-badge ${item.variant.toLowerCase()}">${item.variant}</span>` : ''}
        </div>
        <div class="item-name">${item.petName || 'Unknown'}</div>
        <div class="item-value">${(item.value || 0).toLocaleString()} 💎</div>
        <label class="item-select">
            <input type="checkbox" class="withdraw-check" value="${item.id || ''}">
            Select
        </label>
    `;

    container.prepend(card); // Newest first
}

// ─────────────────────────────────────────────────────────
// 4. UPDATE GEMS
// ─────────────────────────────────────────────────────────
function addGemsToUI(amount) {
    const gemEl = document.getElementById('gem-balance');
    if (!gemEl) return;
    const current = parseInt(gemEl.textContent.replace(/[^0-9]/g, '')) || 0;
    gemEl.textContent = (current + amount).toLocaleString();
}

// ─────────────────────────────────────────────────────────
// 5. NOTIFICATION TOAST
// ─────────────────────────────────────────────────────────
function showNotification(message) {
    const toast = document.createElement('div');
    toast.className = 'deposit-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }, 10);
}

// ─────────────────────────────────────────────────────────
// 6. WITHDRAW - user selects items on site, clicks withdraw
// ─────────────────────────────────────────────────────────
async function requestWithdrawal(robloxUsername) {
    // Get selected item IDs from checkboxes
    const checked = [...document.querySelectorAll('.withdraw-check:checked')];
    const inventoryIds = checked.map(c => c.value).filter(Boolean);

    // Get gem amount from input
    const gemInput = document.getElementById('withdraw-gems-input');
    const gems = parseInt(gemInput?.value || '0') || 0;

    if (inventoryIds.length === 0 && gems === 0) {
        alert('Select at least one item or enter gems to withdraw');
        return;
    }

    try {
        const res = await fetch(`${SERVER_URL}/api/withdraw/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ robloxUsername, inventoryIds, gems })
        });

        const data = await res.json();
        if (data.ok) {
            showNotification(`Trade ${data.botUsername} in-game to receive your items!`);
            // Remove selected items from UI
            checked.forEach(c => c.closest('.inventory-card')?.remove());
        } else {
            alert('Withdrawal failed: ' + (data.error || 'unknown error'));
        }
    } catch (err) {
        console.error('[Withdraw]', err);
    }
}

// ─────────────────────────────────────────────────────────
// 7. INIT - call this after user logs in
// ─────────────────────────────────────────────────────────
function initDepositSystem(robloxUsername) {
    console.log('[Init] Setting up deposit system for:', robloxUsername);
    connectWebSocket(robloxUsername);
    loadInventory(robloxUsername);
}

// ─────────────────────────────────────────────────────────
// 8. HTML you need in your page:
// ─────────────────────────────────────────────────────────
/*
<!-- Gem balance -->
<div id="gem-balance">0</div>

<!-- Inventory grid -->
<div id="inventory-container" class="inventory-grid"></div>

<!-- Withdraw button -->
<button onclick="requestWithdrawal(currentUser)">Withdraw Selected</button>
<input id="withdraw-gems-input" type="number" placeholder="Gems to withdraw" min="0">

<!-- CSS you need -->
<style>
.inventory-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
    padding: 16px;
}
.inventory-card {
    background: #1a1f3a;
    border-radius: 8px;
    padding: 8px;
    text-align: center;
    cursor: pointer;
    border: 2px solid transparent;
    transition: border-color 0.2s;
}
.inventory-card:has(.withdraw-check:checked) {
    border-color: #4caf50;
}
.item-image-wrap {
    position: relative;
    width: 80px;
    height: 80px;
    margin: 0 auto 6px;
}
.item-image-wrap img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}
.variant-badge {
    position: absolute;
    top: 0; right: 0;
    font-size: 9px;
    padding: 2px 4px;
    border-radius: 4px;
    font-weight: bold;
}
.variant-badge.rainbow { background: linear-gradient(135deg, #f00, #ff0, #0f0, #00f); color: white; }
.variant-badge.golden  { background: gold; color: #333; }
.variant-badge.shiny   { background: #00bcd4; color: white; }
.variant-badge.mythic  { background: #9c27b0; color: white; }
.item-name  { font-size: 11px; color: white; margin: 4px 0; }
.item-value { font-size: 10px; color: #4caf50; }
.item-select { font-size: 10px; color: #aaa; cursor: pointer; }
.deposit-toast {
    position: fixed;
    bottom: 24px; right: 24px;
    background: #1a1f3a;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    border-left: 4px solid #4caf50;
    transform: translateX(200%);
    transition: transform 0.4s;
    z-index: 9999;
    max-width: 320px;
}
.deposit-toast.show { transform: translateX(0); }
</style>
*/

// ─────────────────────────────────────────────────────────
// SERVER-SIDE: Add this to your server.js WebSocket handler
// so it knows which WS connection = which Roblox user
// ─────────────────────────────────────────────────────────
/*
// In your existing ws.on('connection') handler, add:
ws.on('message', (raw) => {
    try {
        const msg = JSON.parse(raw);
        if (msg.type === 'register' && msg.robloxUsername) {
            // Register this WS connection to the Roblox username
            robloxUserToWsId.set(msg.robloxUsername.toLowerCase(), wsId);
            console.log(`[WS] Registered ${msg.robloxUsername} -> ${wsId}`);
        }
    } catch(e) {}
});
*/