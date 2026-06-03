--[[
    PS99 Trade Bot v3 - Username-based, no chat needed
    
    HOW IT WORKS:
    1. Bot keeps watching for someone to open a trade with it
    2. When trade opens, bot reads who initiated (Roblox username)
    3. Waits for player to add items + click Ready
    4. Bot mirrors Ready -> Yes -> wait for their Confirm -> Confirm -> Yes
    5. Captures all items + gems from their side
    6. POSTs to server with {robloxUsername, items, gems}
    7. Server credits matching user account on website
    
    NO CHAT CODES NEEDED - uses Roblox username for matching
]]

-- ═══════════════════════════════════════════════════════════
-- CONFIG (UPDATE THESE TO MATCH YOUR SETUP)
-- ═══════════════════════════════════════════════════════════

local WEBHOOK_URL = "http://localhost:3001/api/trade-deposit"
local WEBHOOK_SECRET = "Chickens7119922211!" -- ← MUST match your .env WEBHOOK_SECRET

-- ═══════════════════════════════════════════════════════════
-- SERVICES
-- ═══════════════════════════════════════════════════════════

local Players = game:GetService("Players")
local HttpService = game:GetService("HttpService")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local VirtualInputManager = game:GetService("VirtualInputManager")
local CoreGui = game:GetService("CoreGui")

local LocalPlayer = Players.LocalPlayer
local PlayerGui = LocalPlayer:WaitForChild("PlayerGui")

-- ═══════════════════════════════════════════════════════════
-- STATE
-- ═══════════════════════════════════════════════════════════

local botState = "IDLE"
local currentTrader = nil  -- Roblox username of trader
local capturedItems = {}
local capturedGems = 0
local autoMode = true  -- Toggle for full automation
local statusLabel = nil
local logFrame = nil
local stateLabel = nil

-- ═══════════════════════════════════════════════════════════
-- GET HTTP FUNCTION (works on any executor)
-- ═══════════════════════════════════════════════════════════

local httpRequest = (syn and syn.request) 
    or (http and http.request) 
    or http_request 
    or request 
    or (fluxus and fluxus.request)

-- ═══════════════════════════════════════════════════════════
-- BUTTON CLICKING (4 methods, tries all)
-- ═══════════════════════════════════════════════════════════

local function clickButton(button)
    if not button or not button.Parent then 
        print("[BOT] CLICK FAIL: button gone")
        if log then pcall(log, "CLICK FAIL: button gone", Color3.fromRGB(255, 100, 100)) end
        return false 
    end
    
    -- Force button to accept input
    pcall(function() button.Active = true end)
    pcall(function() button.Selectable = true end)
    
    -- Wait one frame for AbsolutePosition to be accurate
    task.wait()
    
    local pos = button.AbsolutePosition
    local size = button.AbsoluteSize
    local x = pos.X + (size.X / 2)
    local y = pos.Y + (size.Y / 2)
    
    if size.X == 0 or size.Y == 0 then
        print("[BOT] CLICK FAIL: " .. button.Name .. " zero size")
        if log then pcall(log, "CLICK FAIL: " .. button.Name .. " zero size", Color3.fromRGB(255, 100, 100)) end
        return false
    end
    
    local msg = string.format("Click %s @ (%d,%d)", button.Name, x, y)
    print("[BOT] " .. msg)
    if log then pcall(log, msg, Color3.fromRGB(150, 200, 255)) end
    
    -- METHOD 1: VirtualInputManager mouse events (with mouse unlock)
    pcall(function()
        UserInputService.MouseBehavior = Enum.MouseBehavior.Default
        UserInputService.MouseIconEnabled = true
        task.wait(0.03)
        
        VirtualInputManager:SendMouseMoveEvent(x, y, game)
        task.wait(0.06)
        VirtualInputManager:SendMouseMoveEvent(x, y, game)
        task.wait(0.06)
        
        VirtualInputManager:SendMouseButtonEvent(x, y, 0, true, game, 0)
        task.wait(0.08)
        VirtualInputManager:SendMouseButtonEvent(x, y, 0, false, game, 0)
    end)
    
    task.wait(0.05)
    
    -- METHOD 2: firesignal (Synapse-style)
    pcall(function()
        if firesignal then
            firesignal(button.MouseButton1Down)
            firesignal(button.MouseButton1Up)
            firesignal(button.MouseButton1Click)
            firesignal(button.Activated)
        end
    end)
    
    -- METHOD 3: getconnections + Fire (KRNL/Fluxus-style)
    pcall(function()
        if getconnections then
            for _, sig in pairs({button.MouseButton1Click, button.Activated, button.MouseButton1Down, button.MouseButton1Up}) do
                local ok, conns = pcall(getconnections, sig)
                if ok and conns then
                    for _, conn in pairs(conns) do
                        pcall(function() 
                            if conn.Fire then conn:Fire()
                            elseif conn.Function then conn.Function() 
                            elseif conn.Replicate then conn:Replicate() end
                        end)
                    end
                end
            end
        end
    end)
    
    -- METHOD 4: Touch events (mobile compat)
    pcall(function()
        VirtualInputManager:SendTouchEvent(1, 0, x, y)
        task.wait(0.05)
        VirtualInputManager:SendTouchEvent(1, 2, x, y)
    end)
    
    -- METHOD 5: GuiService Select + Enter key
    pcall(function()
        local GuiService = game:GetService("GuiService")
        GuiService.SelectedObject = button
        task.wait(0.05)
        VirtualInputManager:SendKeyEvent(true, Enum.KeyCode.Return, false, game)
        task.wait(0.05)
        VirtualInputManager:SendKeyEvent(false, Enum.KeyCode.Return, false, game)
        task.wait(0.05)
        GuiService.SelectedObject = nil
    end)
    
    -- METHOD 6: button:Activate()
    pcall(function() button:Activate() end)
    
    task.wait(0.1)
    return true
end

-- ═══════════════════════════════════════════════════════════
-- LOGGING
-- ═══════════════════════════════════════════════════════════

local logEntries = 0
local function log(msg, color)
    color = color or Color3.fromRGB(200, 200, 200)
    print("[PS99BOT] " .. msg)
    
    if not logFrame then return end
    
    logEntries = logEntries + 1
    local entry = Instance.new("TextLabel")
    entry.Size = UDim2.new(1, -8, 0, 14)
    entry.BackgroundTransparency = 1
    entry.Text = "[" .. logEntries .. "] " .. msg
    entry.TextColor3 = color
    entry.TextSize = 10
    entry.Font = Enum.Font.Code
    entry.TextXAlignment = Enum.TextXAlignment.Left
    entry.TextTruncate = Enum.TextTruncate.AtEnd
    entry.LayoutOrder = logEntries
    entry.Parent = logFrame
    
    task.wait()
    if logFrame then
        logFrame.CanvasPosition = Vector2.new(0, logFrame.AbsoluteCanvasSize.Y)
    end
end

local function setState(newState, color)
    botState = newState
    log("STATE: " .. newState, color or Color3.fromRGB(150, 200, 255))
    if stateLabel then
        stateLabel.Text = "State: " .. newState
        stateLabel.TextColor3 = color or Color3.fromRGB(100, 255, 100)
    end
end

local function setStatus(text, color)
    if statusLabel then
        statusLabel.Text = text
        statusLabel.TextColor3 = color or Color3.fromRGB(200, 200, 200)
    end
end

-- ═══════════════════════════════════════════════════════════
-- ITEM CAPTURE (gets pet data + variants + gems)
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- SLOT DUMP - prints EVERYTHING about a slot (call while trade open)
-- ═══════════════════════════════════════════════════════════

local function dumpSlot(slot, slotIndex)
    print("[BOT] ══ SLOT " .. slotIndex .. " ═══════════════")
    print("[BOT] Name: " .. slot.Name .. " | Class: " .. slot.ClassName)
    
    -- Slot-level image (if ImageButton)
    if slot:IsA("ImageButton") or slot:IsA("ImageLabel") then
        print("[BOT]   directImage: " .. (slot.Image or "none"))
    end
    
    -- Slot-level attributes
    local attrs = slot:GetAttributes()
    for k, v in pairs(attrs) do
        print("[BOT]   ATTR: " .. k .. " = " .. tostring(v))
    end
    
    -- Every single descendant
    for _, desc in pairs(slot:GetDescendants()) do
        local line = "[BOT]   " .. desc.Name .. " (" .. desc.ClassName .. ")"
        
        if desc:IsA("TextLabel") or desc:IsA("TextButton") then
            if desc.Text and desc.Text ~= "" then
                line = line .. " TEXT='" .. desc.Text .. "'"
            end
        end
        
        if desc:IsA("ImageLabel") or desc:IsA("ImageButton") then
            if desc.Image and desc.Image ~= "" then
                line = line .. " IMG=" .. desc.Image
            end
        end
        
        if desc:IsA("Model") then
            line = line .. " MODEL_NAME='" .. desc.Name .. "'"
        end
        
        -- Attributes on descendants
        for k, v in pairs(desc:GetAttributes()) do
            line = line .. " [" .. k .. "=" .. tostring(v) .. "]"
        end
        
        print(line)
    end
end

local function captureItemData(slot, slotIndex)
    local data = {
        petName   = nil,
        variant   = "Normal",
        imageId   = nil,    -- primary image asset ID number
        imageStr  = nil,    -- full rbxassetid:// string
        allImages = {},     -- every image found
        attributes = {},
        slotName  = slot.Name
    }

    -- ── 1. Slot is itself an ImageButton (pet image directly on it)
    if slot:IsA("ImageButton") or slot:IsA("ImageLabel") then
        local img = slot.Image or ""
        local id  = img:match("(%d+)")
        if id then
            data.imageId  = tonumber(id)
            data.imageStr = img
        end
    end

    -- ── 2. Slot attributes (often has ItemId, PetId, etc.)
    for k, v in pairs(slot:GetAttributes()) do
        data.attributes[k] = tostring(v)
        local kl = k:lower()
        if kl:find("name") and not data.petName then
            data.petName = tostring(v)
        end
        if kl:find("id") or kl:find("pet") or kl:find("asset") then
            data.attributes["_foundId"] = tostring(v)
        end
    end

    -- ── 3. Walk every descendant
    for _, child in pairs(slot:GetDescendants()) do

        -- Attributes on children
        for k, v in pairs(child:GetAttributes()) do
            data.attributes[k] = tostring(v)
            local kl = k:lower()
            if kl:find("name") and not data.petName then
                data.petName = tostring(v)
            end
        end

        -- ImageLabel / ImageButton → grab image ID
        if (child:IsA("ImageLabel") or child:IsA("ImageButton")) and (child.Image or "") ~= "" then
            local img = child.Image
            local id  = img:match("(%d+)")
            if id then
                local num = tonumber(id)
                if not table.find(data.allImages, num) then
                    table.insert(data.allImages, num)
                end
                -- "Icon" is the standard primary image name
                if child.Name == "Icon" or child.Name == "PetIcon" or child.Name == "Thumbnail" then
                    data.imageId  = num
                    data.imageStr = img
                elseif not data.imageId then
                    data.imageId  = num
                    data.imageStr = img
                end
            end
        end

        -- TextLabel / TextButton → grab pet name
        if (child:IsA("TextLabel") or child:IsA("TextButton")) and child.Text and child.Text ~= "" then
            local txt = child.Text:gsub("^%s+", ""):gsub("%s+$", "")
            -- Skip pure numbers and very short strings
            if #txt > 2 and not txt:match("^[%d%.,]+$") and not txt:match("^x%d+$") then
                if not data.petName then
                    data.petName = txt
                end
            end
        end

        -- ViewportFrame → 3D model inside has the pet's name
        if child:IsA("ViewportFrame") then
            for _, vfc in pairs(child:GetChildren()) do
                if vfc:IsA("Model") and vfc.Name ~= "" and vfc.Name ~= "Model" then
                    data.petName = vfc.Name
                end
            end
        end

        -- Variant detection from element names
        local n = child.Name:lower()
        if child:IsA("GuiObject") and child.Visible then
            if     n:find("rainbow")            then data.variant = "Rainbow"
            elseif n:find("gold")               then data.variant = "Golden"
            elseif n:find("shiny") or n:find("diamond") then data.variant = "Shiny"
            elseif n:find("mythic")             then data.variant = "Mythic"
            elseif n:find("dark")               then data.variant = "DarkMatter"
            end
        end
    end

    -- ── 4. Log what we found
    local logLine = string.format("[BOT] SLOT %d: '%s' (%s) imgId=%s allImgs=%d",
        slotIndex or 0,
        data.petName  or "NO_NAME",
        data.variant,
        tostring(data.imageId) or "nil",
        #data.allImages)
    print(logLine)
    if log then pcall(log, logLine, Color3.fromRGB(100, 200, 255)) end

    return data
end

local function captureAllItems()
    local items = {}
    local gems  = 0

    local tw = PlayerGui:FindFirstChild("TradeWindow")
    if not tw then
        print("[BOT] captureAllItems: no TradeWindow")
        return items, gems
    end

    local frame = tw:FindFirstChild("Frame")
    if not frame then return items, gems end

    -- ── Pets
    local playerItems = frame:FindFirstChild("PlayerItems")
    if playerItems then
        local container = playerItems:FindFirstChild("Items")
        if container then
            -- First do a full raw dump to F9 console
            print("[BOT] ══ FULL SLOT DUMP ══════════════════")
            local idx = 0
            for _, slot in pairs(container:GetChildren()) do
                if slot:IsA("GuiObject")
                   and slot.Name ~= "UIListLayout"
                   and slot.Name ~= "UIGridLayout"
                   and slot.Name ~= "UIPadding" then
                    idx = idx + 1
                    dumpSlot(slot, idx)
                    local data = captureItemData(slot, idx)
                    table.insert(items, data)
                end
            end
            if idx == 0 then
                print("[BOT] WARNING: Items container is empty!")
                if log then pcall(log, "Items container empty - path may be wrong", Color3.fromRGB(255, 100, 100)) end
            end
        else
            print("[BOT] WARNING: No 'Items' child in PlayerItems!")
            -- Dump PlayerItems children so we can see the real name
            print("[BOT] PlayerItems children:")
            for _, c in pairs(playerItems:GetChildren()) do
                print("[BOT]   " .. c.Name .. " (" .. c.ClassName .. ")")
            end
        end
    else
        print("[BOT] WARNING: No PlayerItems in Frame!")
        print("[BOT] Frame children:")
        for _, c in pairs(frame:GetChildren()) do
            print("[BOT]   " .. c.Name .. " (" .. c.ClassName .. ")")
        end
    end

    -- ── Gems
    local playerDiamonds = frame:FindFirstChild("PlayerDiamonds")
    if playerDiamonds then
        for _, child in pairs(playerDiamonds:GetDescendants()) do
            if (child:IsA("TextLabel") or child:IsA("TextBox")) and child.Text then
                local num = tonumber((child.Text or ""):gsub("[^%d]", ""))
                if num and num > gems then gems = num end
            end
        end
    end

    local summary = string.format("Captured: %d items, %d gems", #items, gems)
    print("[BOT] " .. summary)
    if log then pcall(log, summary, Color3.fromRGB(100, 255, 200)) end

    return items, gems
end

-- ═══════════════════════════════════════════════════════════
-- GET TRADER USERNAME
-- ═══════════════════════════════════════════════════════════

local function getTraderUsername()
    local tw = PlayerGui:FindFirstChild("TradeWindow")
    if not tw then return nil end
    
    local frame = tw:FindFirstChild("Frame")
    if not frame then return nil end
    
    -- Try PlayerTitle TextLabel
    local playerTitle = frame:FindFirstChild("PlayerTitle")
    if playerTitle and playerTitle:IsA("TextLabel") and playerTitle.Text ~= "" then
        local name = playerTitle.Text:gsub("%s+", "")
        if name ~= "" then return name end
    end
    
    -- Try searching descendants for text that matches a player name
    for _, child in pairs(frame:GetDescendants()) do
        if child:IsA("TextLabel") and child.Text then
            local txt = child.Text:gsub("%s+", "")
            -- Check if this matches any player in the server
            for _, p in pairs(Players:GetPlayers()) do
                if p ~= LocalPlayer and (p.Name:lower() == txt:lower() or p.DisplayName:lower() == txt:lower()) then
                    return p.Name
                end
            end
        end
    end
    
    return nil
end

-- ═══════════════════════════════════════════════════════════
-- WEBHOOK
-- ═══════════════════════════════════════════════════════════

local function sendWebhook(robloxUsername, items, gems)
    if not httpRequest then
        log("ERROR: No HTTP function available", Color3.fromRGB(255, 100, 100))
        return false
    end
    
    local payload = {
        robloxUsername = robloxUsername,
        items = items,
        gems = gems,
        secret = WEBHOOK_SECRET,
        botName = LocalPlayer.Name,
        timestamp = os.time()
    }
    
    local body = HttpService:JSONEncode(payload)
    log("POSTing to " .. WEBHOOK_URL, Color3.fromRGB(150, 200, 255))
    log("Username: " .. robloxUsername .. " | Items: " .. #items .. " | Gems: " .. gems, Color3.fromRGB(150, 200, 255))
    
    local success, response = pcall(function()
        return httpRequest({
            Url = WEBHOOK_URL,
            Method = "POST",
            Headers = {["Content-Type"] = "application/json"},
            Body = body
        })
    end)
    
    if success and response then
        local code = response.StatusCode or response.Status or "?"
        log("Webhook response: " .. tostring(code), Color3.fromRGB(100, 255, 100))
        if response.Body then
            log("Body: " .. tostring(response.Body):sub(1, 100), Color3.fromRGB(180, 180, 180))
        end
        return true
    else
        log("Webhook FAILED: " .. tostring(response), Color3.fromRGB(255, 100, 100))
        return false
    end
end

-- ═══════════════════════════════════════════════════════════
-- TRADE FLOW ACTIONS (each step manual + auto)
-- ═══════════════════════════════════════════════════════════
-- FIND READY BUTTON (searches multiple paths)
-- ═══════════════════════════════════════════════════════════

local function findReadyButton()
    local tw = PlayerGui:FindFirstChild("TradeWindow")
    if not tw then return nil end
    local frame = tw:FindFirstChild("Frame")
    if not frame then return nil end
    
    -- Standard PS99 path
    local buttons = frame:FindFirstChild("Buttons")
    if buttons then
        local rh = buttons:FindFirstChild("ReadyHolder")
        if rh then
            local r = rh:FindFirstChild("Ready")
            if r then return r end
        end
        local r = buttons:FindFirstChild("Ready")
        if r then return r end
    end
    
    -- Fallback: search all descendants
    for _, desc in pairs(frame:GetDescendants()) do
        if desc.Name == "Ready" and (desc:IsA("TextButton") or desc:IsA("ImageButton")) then
            return desc
        end
    end
    return nil
end

-- ═══════════════════════════════════════════════════════════
-- WAIT FOR TRADEMESSAGE + CLICK YES
-- ═══════════════════════════════════════════════════════════

local function waitForPromptAndYes(timeoutSecs)
    local elapsed = 0
    while elapsed < (timeoutSecs or 90) do
        local tm = PlayerGui:FindFirstChild("TradeMessage")
        if tm then
            local f = tm:FindFirstChild("Frame")
            if f and f.Visible then
                log("Prompt appeared!", Color3.fromRGB(100, 255, 100))
                local btns = f:FindFirstChild("Buttons")
                local yes  = btns and btns:FindFirstChild("Yes")
                if yes then
                    for i = 1, 6 do
                        clickButton(yes)
                        task.wait(0.3)
                        if not f.Visible then break end
                    end
                end
                return true
            end
        end
        task.wait(0.25)
        elapsed = elapsed + 0.25
    end
    log("Prompt wait timed out after " .. timeoutSecs .. "s", Color3.fromRGB(255, 100, 100))
    return false
end

-- ═══════════════════════════════════════════════════════════
-- KEEP CLICKING READY UNTIL BOTH ARE READY (TradeMessage fires)
-- ═══════════════════════════════════════════════════════════

local function clickUntilBothReady(timeoutSecs)
    local elapsed = 0
    while elapsed < (timeoutSecs or 90) do
        -- Check if prompt already appeared (both ready)
        local tm = PlayerGui:FindFirstChild("TradeMessage")
        if tm then
            local f = tm:FindFirstChild("Frame")
            if f and f.Visible then
                log("Both ready - prompt visible!", Color3.fromRGB(100, 255, 100))
                return true
            end
        end
        
        -- Click Ready/Confirm button
        local btn = findReadyButton()
        if btn then
            log("Clicking Ready/Confirm...", Color3.fromRGB(255, 200, 50))
            clickButton(btn)
        else
            log("Ready button not found yet", Color3.fromRGB(255, 200, 50))
        end
        
        task.wait(2)
        elapsed = elapsed + 2
    end
    return false
end

-- ═══════════════════════════════════════════════════════════
-- MAIN TRADE FLOW - runs as one linear coroutine
-- Captures items AFTER the ready→yes phase (items locked, 
-- player cannot add/remove after both click Ready)
-- ═══════════════════════════════════════════════════════════

local function runTradeFlow(traderName)
    log("═══ Trade started with: " .. (traderName or "?"), Color3.fromRGB(100, 200, 255))
    currentTrader = traderName
    capturedItems = {}
    capturedGems  = 0

    -- ── Step 1: Wait for trade window ──────────────────────
    local tw = PlayerGui:WaitForChild("TradeWindow", 15)
    if not tw then
        log("TradeWindow never appeared - aborting", Color3.fromRGB(255, 100, 100))
        setState("IDLE", Color3.fromRGB(100, 255, 100))
        return
    end
    
    local frame = tw:WaitForChild("Frame", 5)
    if not frame then
        log("TradeWindow Frame missing", Color3.fromRGB(255, 100, 100))
        setState("IDLE", Color3.fromRGB(100, 255, 100))
        return
    end
    
    -- Try to get player name from the trade window itself
    if not currentTrader or currentTrader == "" then
        local pt = frame:FindFirstChild("PlayerTitle")
        if pt and pt:IsA("TextLabel") and pt.Text ~= "" then
            currentTrader = pt.Text
            log("Trader from window: " .. currentTrader, Color3.fromRGB(150, 200, 255))
        end
    end

    -- ── Step 2: Wait for player to add items/gems ─────────
    setState("WAITING_FOR_ITEMS", Color3.fromRGB(255, 200, 50))
    log("Waiting for player to add items (up to 3 min)...", Color3.fromRGB(180, 180, 180))
    
    local function itemsPresent()
        local pi = frame:FindFirstChild("PlayerItems")
        if pi then
            local items = pi:FindFirstChild("Items")
            if items then
                for _, c in pairs(items:GetChildren()) do
                    if c:IsA("GuiObject") and c.Name ~= "UIListLayout"
                       and c.Name ~= "UIGridLayout" and c.Name ~= "UIPadding" then
                        return true
                    end
                end
            end
        end
        -- Check gems too
        local pd = frame:FindFirstChild("PlayerDiamonds")
        if pd then
            for _, c in pairs(pd:GetDescendants()) do
                if (c:IsA("TextLabel") or c:IsA("TextBox")) and c.Text then
                    local n = tonumber((c.Text):gsub("[^%d]",""))
                    if n and n > 0 then return true end
                end
            end
        end
        return false
    end
    
    local itemWait = 0
    while not itemsPresent() and itemWait < 180 do
        task.wait(0.5)
        itemWait = itemWait + 0.5
    end
    
    if not itemsPresent() then
        log("No items added in 3 minutes - aborting", Color3.fromRGB(255, 100, 100))
        setState("IDLE", Color3.fromRGB(100, 255, 100))
        return
    end
    
    log("Items/gems detected! Giving 2s for player to finish...", Color3.fromRGB(100, 255, 100))
    task.wait(2)

    -- ── Step 3: Click Ready until both ready (TradeMessage) ─
    setState("CLICKING_READY", Color3.fromRGB(255, 200, 50))
    log("Clicking Ready... (keeps clicking until both ready)", Color3.fromRGB(255, 200, 50))
    
    local bothReady = clickUntilBothReady(90)
    if not bothReady then
        log("Both-ready timeout - aborting", Color3.fromRGB(255, 100, 100))
        setState("IDLE", Color3.fromRGB(100, 255, 100))
        return
    end

    -- ── Step 4: Click Yes on "Are you sure?" (Ready phase) ──
    setState("YES_AFTER_READY", Color3.fromRGB(255, 200, 50))
    waitForPromptAndYes(15)
    log("Ready confirmed!", Color3.fromRGB(100, 255, 100))
    
    -- ── ITEMS ARE NOW LOCKED - safe to capture ───────────────
    -- After both click Ready→Yes, PS99 locks the trade.
    -- Player CANNOT add or remove items anymore.
    task.wait(0.5)
    setState("CAPTURING", Color3.fromRGB(100, 255, 200))
    log("CAPTURING LOCKED ITEMS...", Color3.fromRGB(100, 255, 200))
    capturedItems, capturedGems = captureAllItems()
    log("Captured: " .. #capturedItems .. " items + " .. capturedGems .. " gems", Color3.fromRGB(100, 255, 200))

    -- ── Step 5: Click Confirm until both confirmed ───────────
    setState("CLICKING_CONFIRM", Color3.fromRGB(255, 200, 50))
    log("Clicking Confirm...", Color3.fromRGB(255, 200, 50))
    task.wait(0.5)
    
    local bothConfirmed = clickUntilBothReady(90) -- same logic, button is now Confirm
    if not bothConfirmed then
        log("Both-confirm timeout - sending webhook anyway", Color3.fromRGB(255, 200, 50))
    end

    -- ── Step 6: Click final Yes ──────────────────────────────
    setState("YES_AFTER_CONFIRM", Color3.fromRGB(255, 200, 50))
    waitForPromptAndYes(15)
    log("Trade COMPLETE!", Color3.fromRGB(100, 255, 100))

    -- ── Step 7: Send webhook ─────────────────────────────────
    setState("COMPLETED", Color3.fromRGB(100, 255, 100))
    task.wait(0.5)
    
    local trader = currentTrader or "Unknown"
    log("Sending webhook for: " .. trader, Color3.fromRGB(150, 200, 255))
    sendWebhook(trader, capturedItems, capturedGems)

    -- ── Reset ────────────────────────────────────────────────
    task.wait(2)
    currentTrader = nil
    capturedItems = {}
    capturedGems  = 0
    setState("IDLE", Color3.fromRGB(100, 255, 100))
    log("Ready for next trade!", Color3.fromRGB(100, 255, 100))
end

-- ═══════════════════════════════════════════════════════════
-- ACCEPT INCOMING TRADE - watches player list for "Accept" button
-- ═══════════════════════════════════════════════════════════

local function findAcceptButton()
    local tpl = PlayerGui:FindFirstChild("TradePlayerList")
    if not tpl then return nil, nil, nil end
    if tpl:IsA("ScreenGui") and not tpl.Enabled then return nil, nil, nil end
    
    local frame = tpl:FindFirstChild("Frame")
    if not frame or not frame.Visible then return nil, nil, nil end
    
    local players = frame:FindFirstChild("Players")
    if not players then return nil, nil, nil end
    
    for _, pf in pairs(players:GetChildren()) do
        if pf:IsA("Frame") then
            local bh  = pf:FindFirstChild("ButtonHolder")
            local btn = bh and bh:FindFirstChild("Trade")
            if btn then
                local tl  = btn:FindFirstChild("TextLabel")
                local txt = tl and (tl.Text or ""):lower():gsub("%s", "") or ""
                if txt:find("accept") or txt:find("incoming") or txt:find("request") or txt:find("pending") or txt:find("invite") then
                    return btn, pf.Name, txt
                end
            end
        end
    end
    return nil, nil, nil
end

local function acceptIncomingTradeWatcher()
    task.spawn(function()
        while true do
            task.wait(0.3)
            if not autoMode or botState ~= "IDLE" then continue end
            
            local btn, trader, txt = findAcceptButton()
            if btn and trader then
                log("Accept button found! Player: " .. trader, Color3.fromRGB(255, 200, 50))
                setState("ACCEPTING", Color3.fromRGB(255, 200, 50))
                
                -- Click Accept (retry up to 3 times)
                for i = 1, 3 do
                    clickButton(btn)
                    task.wait(0.7)
                    local tw = PlayerGui:FindFirstChild("TradeWindow")
                    if tw then break end
                end
                
                task.wait(0.5)
                task.spawn(function() runTradeFlow(trader) end)
            end
        end
    end)
end

-- Also watch for trade window appearing directly (player clicked Trade! on us)
local function directTradeWatcher()
    task.spawn(function()
        local lastEnabled = false
        while true do
            task.wait(0.3)
            if not autoMode or botState ~= "IDLE" then continue end
            
            local tw = PlayerGui:FindFirstChild("TradeWindow")
            if not tw then lastEnabled = false; continue end
            
            local isEnabled = not (tw:IsA("ScreenGui") and not tw.Enabled)
            local frame = tw:FindFirstChild("Frame")
            local isVisible = frame and frame.Visible
            
            if isEnabled and isVisible and not lastEnabled then
                log("Trade window appeared directly!", Color3.fromRGB(255, 200, 50))
                lastEnabled = true
                
                local trader = ""
                local pt = frame and frame:FindFirstChild("PlayerTitle")
                if pt and pt:IsA("TextLabel") then trader = pt.Text end
                
                task.wait(0.5)
                task.spawn(function() runTradeFlow(trader) end)
            elseif not isVisible then
                lastEnabled = false
            end
        end
    end)
end

-- ═══════════════════════════════════════════════════════════
-- MANUAL HELPERS (called by UI buttons)
-- ═══════════════════════════════════════════════════════════

local function clickReady()
    -- Find and click the Ready/Confirm button
    local btn = findReadyButton()
    if btn then
        log("Manual: clicking Ready/Confirm", Color3.fromRGB(150, 200, 255))
        clickButton(btn)
        return true
    else
        log("Ready button not found in trade window", Color3.fromRGB(255, 100, 100))
        return false
    end
end

local function clickYesPrompt()
    -- Find and click Yes on any visible TradeMessage prompt
    local tm = PlayerGui:FindFirstChild("TradeMessage")
    if not tm then log("No TradeMessage found", Color3.fromRGB(255, 100, 100)); return false end
    local frame = tm:FindFirstChild("Frame")
    if not frame or not frame.Visible then log("TradeMessage not visible", Color3.fromRGB(255, 100, 100)); return false end
    local buttons = frame:FindFirstChild("Buttons")
    local yesBtn = buttons and buttons:FindFirstChild("Yes")
    if not yesBtn then log("Yes button not found", Color3.fromRGB(255, 100, 100)); return false end
    log("Manual: clicking Yes", Color3.fromRGB(150, 200, 255))
    clickButton(yesBtn)
    return true
end

local function manualCaptureAndSend()
    log("Manual capture + send", Color3.fromRGB(255, 200, 50))
    local items, gems = captureAllItems()
    local trader = currentTrader or getTraderUsername() or "Unknown"
    log("Items: " .. #items .. " | Gems: " .. gems .. " | Trader: " .. trader, Color3.fromRGB(100, 255, 200))
    sendWebhook(trader, items, gems)
end

-- ═══════════════════════════════════════════════════════════
-- DEBUG UI
-- ═══════════════════════════════════════════════════════════

local function dumpPlayerGui()
    log("=== PlayerGui contents ===", Color3.fromRGB(150, 200, 255))
    for _, child in pairs(PlayerGui:GetChildren()) do
        local visible = "?"
        if child:IsA("ScreenGui") then
            visible = tostring(child.Enabled)
        end
        log("- " .. child.Name .. " (" .. child.ClassName .. ") enabled=" .. visible, Color3.fromRGB(180, 180, 180))
    end
    
    local tw = PlayerGui:FindFirstChild("TradeWindow")
    if tw then
        log("TradeWindow EXISTS", Color3.fromRGB(100, 255, 100))
        local frame = tw:FindFirstChild("Frame")
        if frame then
            log("- Frame.Visible = " .. tostring(frame.Visible), Color3.fromRGB(180, 180, 180))
            local trader = getTraderUsername()
            if trader then
                log("- Trader: " .. trader, Color3.fromRGB(100, 255, 200))
            end
        end
    else
        log("TradeWindow NOT in PlayerGui", Color3.fromRGB(255, 200, 50))
    end
end

local function createUI()
    local existing = (CoreGui:FindFirstChild("PS99BotUI")) or (PlayerGui:FindFirstChild("PS99BotUI"))
    if existing then existing:Destroy() end
    
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "PS99BotUI"
    screenGui.ResetOnSpawn = false
    screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
    screenGui.DisplayOrder = 999999
    
    local parented = false
    pcall(function() 
        screenGui.Parent = CoreGui 
        parented = true
    end)
    if not parented then 
        pcall(function() 
            if gethui then
                screenGui.Parent = gethui()
            else
                screenGui.Parent = PlayerGui
            end
        end)
    end
    
    -- Main frame
    local main = Instance.new("Frame")
    main.Size = UDim2.new(0, 320, 0, 580)
    main.Position = UDim2.new(0, 10, 0, 100)
    main.BackgroundColor3 = Color3.fromRGB(20, 20, 30)
    main.BorderSizePixel = 0
    main.Active = true
    main.Draggable = true
    main.Parent = screenGui
    
    Instance.new("UICorner", main).CornerRadius = UDim.new(0, 8)
    
    -- Header
    local header = Instance.new("TextLabel")
    header.Size = UDim2.new(1, 0, 0, 30)
    header.BackgroundColor3 = Color3.fromRGB(40, 100, 200)
    header.BorderSizePixel = 0
    header.Text = "PS99 TRADE BOT v3"
    header.TextColor3 = Color3.fromRGB(255, 255, 255)
    header.TextSize = 14
    header.Font = Enum.Font.GothamBold
    header.Parent = main
    Instance.new("UICorner", header).CornerRadius = UDim.new(0, 8)
    
    -- State display
    stateLabel = Instance.new("TextLabel")
    stateLabel.Size = UDim2.new(1, -20, 0, 24)
    stateLabel.Position = UDim2.new(0, 10, 0, 38)
    stateLabel.BackgroundColor3 = Color3.fromRGB(30, 30, 45)
    stateLabel.BorderSizePixel = 0
    stateLabel.Text = "State: IDLE"
    stateLabel.TextColor3 = Color3.fromRGB(100, 255, 100)
    stateLabel.TextSize = 12
    stateLabel.Font = Enum.Font.GothamBold
    stateLabel.Parent = main
    Instance.new("UICorner", stateLabel).CornerRadius = UDim.new(0, 4)
    
    -- Status display
    statusLabel = Instance.new("TextLabel")
    statusLabel.Size = UDim2.new(1, -20, 0, 30)
    statusLabel.Position = UDim2.new(0, 10, 0, 65)
    statusLabel.BackgroundColor3 = Color3.fromRGB(30, 30, 45)
    statusLabel.BorderSizePixel = 0
    statusLabel.Text = "Waiting for trade..."
    statusLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
    statusLabel.TextSize = 11
    statusLabel.Font = Enum.Font.Gotham
    statusLabel.TextWrapped = true
    statusLabel.Parent = main
    Instance.new("UICorner", statusLabel).CornerRadius = UDim.new(0, 4)
    
    -- Auto mode toggle
    local autoToggle = Instance.new("TextButton")
    autoToggle.Size = UDim2.new(1, -20, 0, 30)
    autoToggle.Position = UDim2.new(0, 10, 0, 100)
    autoToggle.BackgroundColor3 = Color3.fromRGB(50, 150, 50)
    autoToggle.BorderSizePixel = 0
    autoToggle.Text = "AUTO MODE: ON (click to toggle)"
    autoToggle.TextColor3 = Color3.fromRGB(255, 255, 255)
    autoToggle.TextSize = 12
    autoToggle.Font = Enum.Font.GothamBold
    autoToggle.Parent = main
    Instance.new("UICorner", autoToggle).CornerRadius = UDim.new(0, 4)
    
    autoToggle.MouseButton1Click:Connect(function()
        autoMode = not autoMode
        if autoMode then
            autoToggle.Text = "AUTO MODE: ON (click to toggle)"
            autoToggle.BackgroundColor3 = Color3.fromRGB(50, 150, 50)
        else
            autoToggle.Text = "AUTO MODE: OFF (manual only)"
            autoToggle.BackgroundColor3 = Color3.fromRGB(150, 50, 50)
        end
        log("Auto mode: " .. tostring(autoMode), Color3.fromRGB(255, 200, 50))
    end)
    
    -- Manual buttons section
    local manualLabel = Instance.new("TextLabel")
    manualLabel.Size = UDim2.new(1, -20, 0, 16)
    manualLabel.Position = UDim2.new(0, 10, 0, 135)
    manualLabel.BackgroundTransparency = 1
    manualLabel.Text = "Manual Controls:"
    manualLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    manualLabel.TextSize = 11
    manualLabel.Font = Enum.Font.GothamBold
    manualLabel.TextXAlignment = Enum.TextXAlignment.Left
    manualLabel.Parent = main
    
    -- Helper to create button
    local function createBtn(name, yPos, color, callback)
        local btn = Instance.new("TextButton")
        btn.Size = UDim2.new(0.5, -12, 0, 26)
        btn.Position = UDim2.new(0, 10, 0, yPos)
        btn.BackgroundColor3 = color
        btn.BorderSizePixel = 0
        btn.Text = name
        btn.TextColor3 = Color3.fromRGB(255, 255, 255)
        btn.TextSize = 11
        btn.Font = Enum.Font.GothamBold
        btn.Parent = main
        Instance.new("UICorner", btn).CornerRadius = UDim.new(0, 4)
        btn.MouseButton1Click:Connect(callback)
        return btn
    end
    
    local function createBtnRight(name, yPos, color, callback)
        local btn = Instance.new("TextButton")
        btn.Size = UDim2.new(0.5, -12, 0, 26)
        btn.Position = UDim2.new(0.5, 2, 0, yPos)
        btn.BackgroundColor3 = color
        btn.BorderSizePixel = 0
        btn.Text = name
        btn.TextColor3 = Color3.fromRGB(255, 255, 255)
        btn.TextSize = 11
        btn.Font = Enum.Font.GothamBold
        btn.Parent = main
        Instance.new("UICorner", btn).CornerRadius = UDim.new(0, 4)
        btn.MouseButton1Click:Connect(callback)
        return btn
    end
    
    createBtn("Click Ready", 155, Color3.fromRGB(60, 100, 180), function()
        log("Manual: Click Ready", Color3.fromRGB(255, 200, 50))
        clickReady()
    end)
    
    createBtnRight("Click Yes", 155, Color3.fromRGB(60, 100, 180), function()
        log("Manual: Click Yes", Color3.fromRGB(255, 200, 50))
        clickYesPrompt()
    end)
    
    createBtn("Capture+Send", 185, Color3.fromRGB(60, 150, 100), function()
        manualCaptureAndSend()
    end)
    
    createBtnRight("Reset State", 185, Color3.fromRGB(150, 100, 50), function()
        setState("IDLE", Color3.fromRGB(100, 255, 100))
        currentTrader = nil
        capturedItems = {}
        capturedGems = 0
        log("State reset", Color3.fromRGB(255, 200, 50))
    end)
    
    createBtn("Scan Player List", 215, Color3.fromRGB(100, 100, 150), function()
        log("=== Scanning Player List ===", Color3.fromRGB(150, 200, 255))
        local tradePlayerList = PlayerGui:FindFirstChild("TradePlayerList")
        if not tradePlayerList then
            log("TradePlayerList NOT in PlayerGui!", Color3.fromRGB(255, 100, 100))
            log("You need to OPEN the trade menu in-game!", Color3.fromRGB(255, 200, 50))
            return
        end
        
        -- Show GUI status
        if tradePlayerList:IsA("ScreenGui") then
            log("TradePlayerList.Enabled = " .. tostring(tradePlayerList.Enabled), Color3.fromRGB(180, 180, 180))
        end
        
        local frame = tradePlayerList:FindFirstChild("Frame")
        if not frame then 
            log("No Frame in TradePlayerList", Color3.fromRGB(255, 100, 100))
            return 
        end
        
        log("Frame.Visible = " .. tostring(frame.Visible), Color3.fromRGB(180, 180, 180))
        
        local playersFrame = frame:FindFirstChild("Players")
        if not playersFrame then
            log("No Players frame!", Color3.fromRGB(255, 100, 100))
            return
        end
        
        local count = 0
        for _, playerFrame in pairs(playersFrame:GetChildren()) do
            if playerFrame:IsA("Frame") then
                count = count + 1
                local btnHolder = playerFrame:FindFirstChild("ButtonHolder")
                local btn = btnHolder and btnHolder:FindFirstChild("Trade")
                
                local btnText = "?"
                local btnImage = "?"
                local childCount = 0
                
                if btn then
                    -- Get text
                    local txtLabel = btn:FindFirstChild("TextLabel")
                    if txtLabel then btnText = txtLabel.Text or "" end
                    
                    -- Get image if ImageButton
                    if btn:IsA("ImageButton") then
                        btnImage = (btn.Image or ""):sub(-15)
                    end
                    
                    childCount = #btn:GetChildren()
                end
                
                log("- " .. playerFrame.Name, Color3.fromRGB(200, 200, 255))
                log("   text: '" .. btnText .. "'", Color3.fromRGB(180, 180, 180))
                log("   img: ..." .. btnImage, Color3.fromRGB(180, 180, 180))
                log("   children: " .. childCount, Color3.fromRGB(180, 180, 180))
                
                -- Also show ALL children of the player frame to find indicators
                for _, child in pairs(playerFrame:GetDescendants()) do
                    if child:IsA("TextLabel") and child.Text and child.Text ~= "" and 
                       child.Text ~= playerFrame.Name and #child.Text > 0 then
                        log("    txt: '" .. child.Text .. "'", Color3.fromRGB(150, 150, 200))
                    end
                end
            end
        end
        log("Found " .. count .. " players in list", Color3.fromRGB(150, 200, 255))
        log("Now send a trade from main and click Scan AGAIN", Color3.fromRGB(255, 200, 50))
        log("Compare what changed", Color3.fromRGB(255, 200, 50))
    end)
    
    createBtnRight("Monitor Changes", 245, Color3.fromRGB(150, 100, 200), function()
        log("=== MONITOR MODE ===", Color3.fromRGB(255, 200, 50))
        log("Recording current state...", Color3.fromRGB(180, 180, 180))
        
        local tradePlayerList = PlayerGui:FindFirstChild("TradePlayerList")
        if not tradePlayerList then
            log("Open trade menu first!", Color3.fromRGB(255, 100, 100))
            return
        end
        local frame = tradePlayerList:FindFirstChild("Frame")
        local playersFrame = frame and frame:FindFirstChild("Players")
        if not playersFrame then 
            log("Players frame missing", Color3.fromRGB(255, 100, 100))
            return 
        end
        
        -- Snapshot current state
        local snapshot = {}
        for _, pf in pairs(playersFrame:GetChildren()) do
            if pf:IsA("Frame") then
                local bh = pf:FindFirstChild("ButtonHolder")
                local b = bh and bh:FindFirstChild("Trade")
                local data = {
                    childCount = #pf:GetDescendants(),
                    btnText = "",
                    btnImage = "",
                }
                if b then
                    local tl = b:FindFirstChild("TextLabel")
                    data.btnText = tl and tl.Text or ""
                    if b:IsA("ImageButton") then
                        data.btnImage = b.Image or ""
                    end
                end
                snapshot[pf.Name] = data
            end
        end
        
        log("Snapshot taken of " .. (function() local c=0; for _ in pairs(snapshot) do c=c+1 end; return c end)() .. " players", Color3.fromRGB(100, 255, 100))
        log("NOW: Have your main send a trade request to bot", Color3.fromRGB(255, 200, 50))
        log("Monitoring for 30 seconds...", Color3.fromRGB(255, 200, 50))
        
        task.spawn(function()
            local startTime = tick()
            while tick() - startTime < 30 do
                task.wait(0.3)
                
                for _, pf in pairs(playersFrame:GetChildren()) do
                    if pf:IsA("Frame") then
                        local bh = pf:FindFirstChild("ButtonHolder")
                        local b = bh and bh:FindFirstChild("Trade")
                        local current = {
                            childCount = #pf:GetDescendants(),
                            btnText = "",
                            btnImage = "",
                        }
                        if b then
                            local tl = b:FindFirstChild("TextLabel")
                            current.btnText = tl and tl.Text or ""
                            if b:IsA("ImageButton") then
                                current.btnImage = b.Image or ""
                            end
                        end
                        
                        local old = snapshot[pf.Name]
                        if old then
                            if old.btnText ~= current.btnText then
                                log("CHANGE! " .. pf.Name .. " text: '" .. old.btnText .. "' -> '" .. current.btnText .. "'", Color3.fromRGB(100, 255, 100))
                                snapshot[pf.Name] = current
                            elseif old.btnImage ~= current.btnImage then
                                log("CHANGE! " .. pf.Name .. " image changed", Color3.fromRGB(100, 255, 100))
                                log("  old: ..." .. old.btnImage:sub(-15), Color3.fromRGB(180, 180, 180))
                                log("  new: ..." .. current.btnImage:sub(-15), Color3.fromRGB(180, 180, 180))
                                snapshot[pf.Name] = current
                            elseif old.childCount ~= current.childCount then
                                log("CHANGE! " .. pf.Name .. " children: " .. old.childCount .. " -> " .. current.childCount, Color3.fromRGB(100, 255, 100))
                                snapshot[pf.Name] = current
                            end
                        end
                    end
                end
            end
            log("Monitor ended after 30s", Color3.fromRGB(150, 200, 255))
        end)
    end)
    
    createBtn("Test Webhook", 245, Color3.fromRGB(100, 100, 150), function()
        log("Sending test webhook", Color3.fromRGB(255, 200, 50))
        sendWebhook(LocalPlayer.Name, {}, 0)
    end)
    
    -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    -- Watch Trade Window - monitors ALL changes during trade
    -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    createBtnRight("Watch Trade", 275, Color3.fromRGB(200, 100, 200), function()
        log("=== WATCH TRADE WINDOW ===", Color3.fromRGB(255, 200, 50))
        local tw = PlayerGui:FindFirstChild("TradeWindow")
        if not tw then
            log("No TradeWindow yet - open trade first!", Color3.fromRGB(255, 100, 100))
            return
        end
        
        log("Recording trade window state...", Color3.fromRGB(180, 180, 180))
        log("Now have main click Ready - we'll see what changes", Color3.fromRGB(255, 200, 50))
        
        -- Snapshot every element
        local snapshot = {}
        
        local function snap(el, path)
            local data = {
                visible = el:IsA("GuiObject") and el.Visible or nil,
                bgTrans = el:IsA("GuiObject") and el.BackgroundTransparency or nil,
                text = (el:IsA("TextLabel") or el:IsA("TextBox") or el:IsA("TextButton")) and el.Text or nil,
                image = (el:IsA("ImageLabel") or el:IsA("ImageButton")) and el.Image or nil,
                color = el:IsA("GuiObject") and tostring(el.BackgroundColor3) or nil,
                childCount = #el:GetChildren()
            }
            snapshot[path] = data
        end
        
        local function snapAll(el, path)
            path = path or el.Name
            pcall(snap, el, path)
            for _, child in pairs(el:GetChildren()) do
                pcall(snapAll, child, path .. "." .. child.Name)
            end
        end
        
        snapAll(tw)
        
        local snapCount = 0
        for _ in pairs(snapshot) do snapCount = snapCount + 1 end
        log("Snapshotted " .. snapCount .. " elements", Color3.fromRGB(100, 255, 100))
        
        -- Monitor changes for 60 seconds
        task.spawn(function()
            local startTime = tick()
            local changesFound = 0
            
            while tick() - startTime < 60 do
                task.wait(0.2)
                
                local function checkAll(el, path)
                    path = path or el.Name
                    
                    local newData = {
                        visible = el:IsA("GuiObject") and el.Visible or nil,
                        bgTrans = el:IsA("GuiObject") and el.BackgroundTransparency or nil,
                        text = (el:IsA("TextLabel") or el:IsA("TextBox") or el:IsA("TextButton")) and el.Text or nil,
                        image = (el:IsA("ImageLabel") or el:IsA("ImageButton")) and el.Image or nil,
                        color = el:IsA("GuiObject") and tostring(el.BackgroundColor3) or nil,
                        childCount = #el:GetChildren()
                    }
                    
                    local old = snapshot[path]
                    if old then
                        local shortPath = path:gsub("^TradeWindow%.Frame%.", "")
                        
                        if old.visible ~= newData.visible and newData.visible ~= nil then
                            log("VIS: " .. shortPath .. " " .. tostring(old.visible) .. "->" .. tostring(newData.visible), Color3.fromRGB(100, 255, 100))
                            changesFound = changesFound + 1
                        end
                        if old.text ~= newData.text and newData.text and newData.text ~= "" then
                            log("TXT: " .. shortPath .. " -> '" .. newData.text .. "'", Color3.fromRGB(100, 255, 100))
                            changesFound = changesFound + 1
                        end
                        if old.image ~= newData.image and newData.image and newData.image ~= "" then
                            log("IMG: " .. shortPath .. " -> ..." .. newData.image:sub(-12), Color3.fromRGB(100, 255, 100))
                            changesFound = changesFound + 1
                        end
                        if old.childCount ~= newData.childCount then
                            log("KIDS: " .. shortPath .. " " .. old.childCount .. "->" .. newData.childCount, Color3.fromRGB(100, 255, 100))
                            changesFound = changesFound + 1
                        end
                        if old.color ~= newData.color and newData.color then
                            log("CLR: " .. shortPath .. " color changed", Color3.fromRGB(100, 255, 100))
                            changesFound = changesFound + 1
                        end
                    else
                        -- New element appeared!
                        log("NEW: " .. path, Color3.fromRGB(255, 255, 100))
                        changesFound = changesFound + 1
                    end
                    
                    snapshot[path] = newData
                end
                
                local function walkAll(el, path)
                    path = path or el.Name
                    pcall(checkAll, el, path)
                    for _, child in pairs(el:GetChildren()) do
                        pcall(walkAll, child, path .. "." .. child.Name)
                    end
                end
                
                pcall(function() walkAll(tw) end)
            end
            
            log("Watch ended - found " .. changesFound .. " changes", Color3.fromRGB(255, 200, 50))
        end)
    end)
    
    createBtn("Dump Items", 275, Color3.fromRGB(100, 150, 100), function()
        log("=== Dumping trade items ===", Color3.fromRGB(150, 200, 255))
        local items, gems = captureAllItems()
        log("Items: " .. #items, Color3.fromRGB(100, 255, 100))
        log("Gems: " .. gems, Color3.fromRGB(100, 255, 100))
        for i, item in ipairs(items) do
            log("  " .. i .. ". " .. item.name, Color3.fromRGB(180, 180, 200))
            if item.iconImage then
                log("     icon: ..." .. tostring(item.iconImage):sub(-15), Color3.fromRGB(150, 150, 180))
            end
            for _, txt in ipairs(item.textLabels) do
                if txt and txt ~= "" then
                    log("     txt: '" .. txt .. "'", Color3.fromRGB(150, 150, 180))
                end
            end
        end
    end)
    
    -- Log section
    local logTitle = Instance.new("TextLabel")
    logTitle.Size = UDim2.new(1, -20, 0, 16)
    logTitle.Position = UDim2.new(0, 10, 0, 315)
    logTitle.BackgroundTransparency = 1
    logTitle.Text = "Log:"
    logTitle.TextColor3 = Color3.fromRGB(255, 255, 255)
    logTitle.TextSize = 11
    logTitle.Font = Enum.Font.GothamBold
    logTitle.TextXAlignment = Enum.TextXAlignment.Left
    logTitle.Parent = main
    
    logFrame = Instance.new("ScrollingFrame")
    logFrame.Size = UDim2.new(1, -20, 0, 215)
    logFrame.Position = UDim2.new(0, 10, 0, 335)
    logFrame.BackgroundColor3 = Color3.fromRGB(10, 10, 15)
    logFrame.BorderSizePixel = 0
    logFrame.ScrollBarThickness = 4
    logFrame.CanvasSize = UDim2.new(0, 0, 0, 0)
    logFrame.AutomaticCanvasSize = Enum.AutomaticSize.Y
    logFrame.Parent = main
    Instance.new("UICorner", logFrame).CornerRadius = UDim.new(0, 4)
    
    local layout = Instance.new("UIListLayout")
    layout.SortOrder = Enum.SortOrder.LayoutOrder
    layout.Padding = UDim.new(0, 1)
    layout.Parent = logFrame
    
    return screenGui
end

-- ═══════════════════════════════════════════════════════════
-- INIT
-- ═══════════════════════════════════════════════════════════

createUI()

log("====================================", Color3.fromRGB(100, 200, 255))
log("PS99 TRADE BOT v3 - STARTED", Color3.fromRGB(100, 200, 255))
log("====================================", Color3.fromRGB(100, 200, 255))
log("Webhook: " .. WEBHOOK_URL, Color3.fromRGB(180, 180, 180))
log("Bot Account: " .. LocalPlayer.Name, Color3.fromRGB(180, 180, 180))

if not httpRequest then
    log("CRITICAL: No HTTP function found!", Color3.fromRGB(255, 100, 100))
    log("Your executor may not support HTTP requests", Color3.fromRGB(255, 100, 100))
else
    log("HTTP function: OK", Color3.fromRGB(100, 255, 100))
end

-- Start watchers
acceptIncomingTradeWatcher()
directTradeWatcher()

setState("IDLE", Color3.fromRGB(100, 255, 100))
log("Bot is READY", Color3.fromRGB(100, 255, 100))
log("KEEP THE TRADE MENU OPEN to receive trades!", Color3.fromRGB(255, 200, 50))
log("Bot will auto-click Accept when someone sends a trade", Color3.fromRGB(180, 180, 180))

-- Heartbeat
task.spawn(function()
    while true do
        task.wait(60)
        log("Heartbeat | State: " .. botState, Color3.fromRGB(100, 100, 100))
    end
end)