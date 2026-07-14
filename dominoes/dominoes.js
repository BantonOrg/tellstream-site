/* ==========================================================================
   TellStream Lounge Dominoes JS - Multiplayer Sync & Sound Engine
   ========================================================================== */

// 1. SUPABASE INITIALIZATION
const SUPABASE_URL = "https://vegwferwmyuunwvfqpsf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZ3dmZXJ3bXl1dW53dmZxcHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzODU5NDQsImV4cCI6MjA5Nzk2MTk0NH0.7F3HUEY59BGE5phlD9AukhZzRa3Ied_ZT43j8YZeIy8";
const supabase_db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. GAME STATE VARIABLES
let myUsername = "Guest_" + Math.floor(1000 + Math.random() * 9000);
let currentRoomCode = null;
let currentGameState = null; // 'waiting', 'playing', 'finished'
let mySeat = null; // null if spectating, or 1, 2, 3, 4
let roomSubscription = null;
let localState = null;
let soundEnabled = true;
let selectedTileElement = null;
let selectedTileData = null;
let inWaitingRoom = false;
let gameOverCountdownInterval = null;

// DOM ELEMENTS
const lobbyView = document.getElementById("lobby-view");
const seatingView = document.getElementById("seating-view");
const tableView = document.getElementById("table-view");

const usernameInput = document.getElementById("username-input");
const roomCodeInput = document.getElementById("room-code-input");
const createRoomBtn = document.getElementById("create-room-btn");
const joinRoomBtn = document.getElementById("join-room-btn");
const seatingRoomCodeDisplay = document.getElementById("seating-room-code-display");
const seatingVariantDisplay = document.getElementById("seating-variant-display");
const leaveRoomBtnSeating = document.getElementById("leave-room-btn-seating");
const lobbyChatMessages = document.getElementById("lobby-chat-messages");
const lobbyChatInput = document.getElementById("lobby-chat-input");
const sendLobbyChatBtn = document.getElementById("send-lobby-chat-btn");
const startGameBtn = document.getElementById("start-game-btn");
const rosterList = document.getElementById("roster-list");
const chatMessages = document.getElementById("room-chat-messages");
const chatInput = document.getElementById("room-chat-input");
const sendChatBtn = document.getElementById("send-chat-btn");
const tableChatMessages = document.getElementById("table-chat-messages");
const tableChatInput = document.getElementById("table-chat-input");
const sendTableChatBtn = document.getElementById("send-table-chat-btn");

const tableRoomCodeDisplay = document.getElementById("table-room-code-display");
const tableVariantDisplay = document.getElementById("table-variant-display");
const leaveRoomBtnTable = document.getElementById("leave-room-btn-table");
const testLayoutBtn = document.getElementById("test-layout-btn");
const boneyardCountDisplay = document.getElementById("boneyard-count-display");
const audioToggleBtn = document.getElementById("audio-toggle-btn");
const turnIndicatorBanner = document.getElementById("turn-indicator-banner");
const boardDominoesLine = document.getElementById("board-dominoes-line");
const boardTrackContainer = document.getElementById("board-track-container");
const playerHandRow = document.getElementById("player-hand-row");
const drawBoneyardBtn = document.getElementById("draw-boneyard-btn");
const passTurnBtn = document.getElementById("pass-turn-btn");
const boneyardDeck = document.getElementById("boneyard-deck");
const tableLogEntries = document.getElementById("table-log-entries");
const spectatorIndicator = document.getElementById("spectator-indicator");

const playPlacementOverlay = document.getElementById("play-placement-overlay");
const playLeftBtn = document.getElementById("play-left-btn");
const playRightBtn = document.getElementById("play-right-btn");
const cancelPlacementBtn = document.getElementById("cancel-placement-btn");

const gameOverOverlay = document.getElementById("game-over-overlay");
const gameOverTitle = document.getElementById("game-over-title");
const winnerNameDisplay = document.getElementById("winner-name-display");
const gameOverScoresList = document.getElementById("game-over-scores-list");
const restartGameBtn = document.getElementById("restart-game-btn");
const goToLobbyBtn = document.getElementById("go-to-lobby-btn");

// INITIALIZATION
window.addEventListener("DOMContentLoaded", () => {
    const savedUser = window.localStorage.getItem('tellstream_active_user') || window.localStorage.getItem('dominoes_username');
    if (savedUser) {
        myUsername = savedUser;
    }
    usernameInput.value = myUsername;
    
    // Initialize Lounge Chat History and Realtime Updates
    loadGlobalChat();
    subscribeToGlobalChat();

    leaveRoomBtnSeating.addEventListener("click", leaveRoom);
    leaveRoomBtnTable.addEventListener("click", leaveRoom);
    startGameBtn.addEventListener("click", startGame);
    if (testLayoutBtn) testLayoutBtn.addEventListener("click", triggerLayoutTest);
    
    const privateGameCheckbox = document.getElementById("private-game-checkbox");
    if (privateGameCheckbox) {
        privateGameCheckbox.addEventListener("change", togglePrivateGameSetting);
    }

    if (sendLobbyChatBtn) {
        sendLobbyChatBtn.addEventListener("click", () => sendGlobalChatMessage(lobbyChatInput));
        lobbyChatInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") sendGlobalChatMessage(lobbyChatInput);
        });
    }

    sendChatBtn.addEventListener("click", () => sendGlobalChatMessage(chatInput));
    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendGlobalChatMessage(chatInput);
    });

    sendTableChatBtn.addEventListener("click", () => sendGlobalChatMessage(tableChatInput));
    tableChatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendGlobalChatMessage(tableChatInput);
    });

    audioToggleBtn.addEventListener("click", () => {
        soundEnabled = !soundEnabled;
        audioToggleBtn.textContent = soundEnabled ? "🔊" : "🔇";
    });

    playLeftBtn.addEventListener("click", () => executeMove('left'));
    playRightBtn.addEventListener("click", () => executeMove('right'));
    cancelPlacementBtn.addEventListener("click", () => {
        playPlacementOverlay.classList.add("hidden-layout");
        if (selectedTileElement) selectedTileElement.classList.remove("selected-tile");
        selectedTileElement = null;
        selectedTileData = null;
    });

    if (drawBoneyardBtn) drawBoneyardBtn.addEventListener("click", drawTileFromBoneyard);
    if (passTurnBtn) passTurnBtn.addEventListener("click", passTurn);

    restartGameBtn.addEventListener("click", restartGame);
    goToLobbyBtn.addEventListener("click", resetToLobby);

    setupBoardDragging();

    if (usernameInput) usernameInput.addEventListener("input", saveUsername);
    if (createRoomBtn) createRoomBtn.addEventListener("click", createRoom);
    if (joinRoomBtn) joinRoomBtn.addEventListener("click", joinRoom);

    const maxPlayersSelect = document.getElementById("max-players-select");
    const gameModeGroup = document.getElementById("game-mode-group");
    const gameModeSelect = document.getElementById("game-mode-select");
    if (maxPlayersSelect && gameModeGroup) {
        maxPlayersSelect.addEventListener("change", () => {
            if (parseInt(maxPlayersSelect.value) === 4) {
                gameModeGroup.style.display = "block";
            } else {
                gameModeGroup.style.display = "none";
                if (gameModeSelect) gameModeSelect.value = "ffa";
            }
        });
    }
});

// PROFILE MANAGEMENT
function saveUsername() {
    const val = usernameInput.value.trim();
    if (val.length > 0) {
        myUsername = val;
        window.localStorage.setItem('dominoes_username', myUsername);
        
        if (currentRoomCode) {
            updateUsernameInRoom();
        }
    }
}

function showView(view) {
    lobbyView.classList.add("hidden-layout");
    seatingView.classList.add("hidden-layout");
    tableView.classList.add("hidden-layout");
    
    view.classList.remove("hidden-layout");
    
    if (view === tableView) {
        resizeGame();
    }
}

// SYNTHESIZED TILE SOUNDS (Web Audio API)
function playClackSound() {
    if (!soundEnabled) return;
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;
        
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(850, now);
        osc1.frequency.exponentialRampToValueAtTime(120, now + 0.04);
        gain1.gain.setValueAtTime(0.4, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.035);
        
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1000, now + 0.012);
        osc2.frequency.exponentialRampToValueAtTime(140, now + 0.052);
        gain2.gain.setValueAtTime(0.3, now + 0.012);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.047);
        
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        
        osc1.start(now);
        osc1.stop(now + 0.04);
        osc2.start(now + 0.012);
        osc2.stop(now + 0.055);
    } catch (e) {
        console.error("Audio synthesis failed:", e);
    }
}

function playShuffleSound() {
    if (!soundEnabled) return;
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;
        
        const bufferSize = ctx.sampleRate * 0.4;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(800, now + 0.2);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.4);
        filter.Q.setValueAtTime(3, now);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        noise.start(now);
        noise.stop(now + 0.4);
    } catch(e) {
        console.error("Shuffle audio failed:", e);
    }
}

// LOBBY DATABASE OPERATIONS
function generateRoomCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let code = "";
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

async function createRoom() {
    const code = generateRoomCode();
    const maxPlayers = parseInt(document.getElementById("max-players-select").value);
    const gameType = document.getElementById("game-type-select").value;
    const skinSelect = document.getElementById("skin-select");
    const selectedSkin = skinSelect ? skinSelect.value : "1";
    
    const gameModeSelect = document.getElementById("game-mode-select");
    const targetScoreSelect = document.getElementById("target-score-select");
    const gameMode = gameModeSelect && maxPlayers === 4 ? gameModeSelect.value : "ffa";
    const targetScore = targetScoreSelect ? parseInt(targetScoreSelect.value) : 0;
    
    const playersObj = {
        lobby_roster: [myUsername],
        creator: myUsername,
        settings: {
            max_players: maxPlayers,
            game_type: gameType,
            skin: selectedSkin,
            game_mode: gameMode,
            target_score: targetScore,
            match_scores: gameMode === "2v2" ? { team_a: 0, team_b: 0 } : { p1: 0, p2: 0, p3: 0, p4: 0 }
        }
    };
    
    for (let i = 1; i <= 4; i++) {
        if (i <= maxPlayers) {
            playersObj[`player${i}`] = { seat: i, name: i === 1 ? myUsername : "Waiting...", hand: [] };
        } else {
            playersObj[`player${i}`] = { seat: i, name: "Not In Use", hand: [] };
        }
    }
    
    try {
        const { error } = await supabase_db
            .from('domino_rooms')
            .insert([{
                room_code: code,
                game_state: 'waiting',
                board_line: [],
                active_turn: 1,
                players: playersObj,
                connected_spectators: []
            }]);
            
        if (error) throw error;
        
        mySeat = 1; 
        enterRoom(code);
    } catch(err) {
        alert("Error creating room: " + err.message);
    }
}

async function joinRoom() {
    const code = roomCodeInput.value.trim().toUpperCase();
    if (code.length !== 4) {
        alert("Please enter a valid 4-letter room code.");
        return;
    }
    
    try {
        const { data, error } = await supabase_db
            .from('domino_rooms')
            .select('*')
            .eq('room_code', code)
            .single();
            
        if (error || !data) {
            alert("Room not found!");
            return;
        }
        
        const players = data.players || {};
        
        if (!players.lobby_roster.includes(myUsername)) {
            players.lobby_roster.push(myUsername);
        }
        
        mySeat = null;
        for (let i = 1; i <= 4; i++) {
            if (players[`player${i}`] && players[`player${i}`].name === myUsername) {
                mySeat = i;
                break;
            }
        }
        
        await supabase_db
            .from('domino_rooms')
            .update({ players: players })
            .eq('room_code', code);
            
        enterRoom(code);
    } catch(err) {
        alert("Error joining room: " + err.message);
    }
}

async function fetchCurrentRoomState() {
    if (!currentRoomCode) return;
    try {
        const { data, error } = await supabase_db
            .from('domino_rooms')
            .select('*')
            .eq('room_code', currentRoomCode)
            .single();
        if (error) throw error;
        if (data) {
            handleRoomUpdate(data);
        }
    } catch(err) {
        console.error("Error fetching room state:", err);
    }
}

async function updateRoomState(updatedFields) {
    if (!currentRoomCode) return;
    try {
        const { error } = await supabase_db
            .from('domino_rooms')
            .update(updatedFields)
            .eq('room_code', currentRoomCode);
        if (error) throw error;
        
        await fetchCurrentRoomState();
        
        if (roomSubscription) {
            roomSubscription.send({
                type: 'broadcast',
                event: 'state_updated'
            });
        }
    } catch(err) {
        console.error("Error updating room state:", err);
    }
}

function enterRoom(code) {
    window.localStorage.setItem('tellstream_active_game', 'dominoes');
    currentRoomCode = code;
    seatingRoomCodeDisplay.textContent = code;
    tableRoomCodeDisplay.textContent = code;
    
    subscribeToRoom(code);
    fetchCurrentRoomState();
    showView(seatingView);
    loadGlobalChat();
}

function subscribeToRoom(code) {
    if (roomSubscription) {
        supabase_db.removeChannel(roomSubscription);
    }
    
    roomSubscription = supabase_db.channel('room:' + code)
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'domino_rooms', 
            filter: `room_code=eq.${code}` 
        }, payload => {
            if (payload.new) {
                handleRoomUpdate(payload.new);
            }
        })
        .on('broadcast', { event: 'state_updated' }, () => {
            fetchCurrentRoomState();
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log("Subscribed to Realtime channel room:" + code);
            }
        });
}

async function leaveRoom() {
    if (!currentRoomCode) return;
    window.localStorage.removeItem('tellstream_active_game');
    
    try {
        const { data, error } = await supabase_db
            .from('domino_rooms')
            .select('*')
            .eq('room_code', currentRoomCode)
            .single();
            
        if (data) {
            const players = data.players || {};
            
            players.lobby_roster = players.lobby_roster.filter(u => u !== myUsername);
            
            if (mySeat) {
                players[`player${mySeat}`].name = "Waiting...";
                players[`player${mySeat}`].hand = [];
            }
            
            await supabase_db
                .from('domino_rooms')
                .update({ players: players })
                .eq('room_code', currentRoomCode);
        }
    } catch(err) {
        console.error("Error leaving room:", err);
    }
    
    if (roomSubscription) {
        supabase_db.removeChannel(roomSubscription);
        roomSubscription = null;
    }
    
    currentRoomCode = null;
    mySeat = null;
    localState = null;
    currentGameState = null;
    
    showView(lobbyView);
}

async function updateUsernameInRoom() {
    if (!currentRoomCode) return;
    try {
        const { data } = await supabase_db
            .from('domino_rooms')
            .select('*')
            .eq('room_code', currentRoomCode)
            .single();
            
        if (data) {
            const players = data.players || {};
            
            players.lobby_roster = players.lobby_roster.map(n => n.startsWith("Guest_") ? myUsername : n);
            if (!players.lobby_roster.includes(myUsername)) {
                players.lobby_roster.push(myUsername);
            }
            
            if (mySeat && players[`player${mySeat}`]) {
                players[`player${mySeat}`].name = myUsername;
            }
            
            await updateRoomState({ players: players });
        }
    } catch(e) {
        console.error("Failed to update name in room:", e);
    }
}

// REALTIME UPDATE HANDLER
function handleRoomUpdate(roomData) {
    localState = roomData;
    currentGameState = roomData.game_state;
    
    const roomCode = roomData.room_code;
    if (tableRoomCodeDisplay) tableRoomCodeDisplay.textContent = roomCode;
    const roomCodeVal = document.getElementById("table-room-code-val");
    if (roomCodeVal) roomCodeVal.textContent = roomCode;
    
    const players = roomData.players || {};
    const maxPlayers = players.settings?.max_players || 4;
    const gameType = players.settings?.game_type || 'block';

    mySeat = null;
    for (let i = 1; i <= 4; i++) {
        if (players[`player${i}`] && players[`player${i}`].name === myUsername) {
            mySeat = i;
            break;
        }
    }
    
    if (currentGameState === 'waiting') {
        inWaitingRoom = true;
        showView(seatingView);
        seatingVariantDisplay.textContent = gameType === 'draw' ? 'Draw Game' : 'Block Game';
        
        const isCreator = (players.creator === myUsername);
        
        rosterList.innerHTML = "";
        const roster = players.lobby_roster || [];
        
        const helperText = document.getElementById("roster-helper-text");
        if (helperText) {
            helperText.style.display = isCreator ? "block" : "none";
        }
        
        roster.forEach(user => {
            const li = document.createElement("li");
            
            let seatedSeat = null;
            for (let i = 1; i <= 4; i++) {
                if (players[`player${i}`] && players[`player${i}`].name === user) {
                    seatedSeat = i;
                    break;
                }
            }
            
            if (seatedSeat) {
                li.innerHTML = `<span>${escapeHtml(user)}</span> <span class="table-badge" style="margin-left: 10px;">Seat ${seatedSeat}</span>`;
                li.classList.add("seated-player-item");
            } else {
                li.textContent = user;
            }
            
            if (isCreator && user !== players.creator) {
                li.style.cursor = "pointer";
                li.title = "Click to add or remove player from game";
                li.addEventListener("click", () => toggleSeating(user));
            }
            
            rosterList.appendChild(li);
        });
        
        for (let i = 1; i <= 4; i++) {
            const p = players[`player${i}`];
            const seatCard = document.getElementById(`seat-card-${i}`);
            const pName = document.getElementById(`seat-player-${i}`);
            
            if (!seatCard) continue;
            
            if (p) {
                if (p.name === "Not In Use") {
                    seatCard.style.display = "none";
                } else {
                    seatCard.style.display = "flex";
                    pName.textContent = p.name;
                    if (p.name === "Waiting...") {
                        seatCard.classList.remove("claimed");
                    } else {
                        seatCard.classList.add("claimed");
                    }
                }
            }
        }
        
        const privateGameCheckbox = document.getElementById("private-game-checkbox");
        if (privateGameCheckbox) {
            privateGameCheckbox.checked = !!players.settings?.private;
            if (isCreator) {
                privateGameCheckbox.removeAttribute("disabled");
            } else {
                privateGameCheckbox.setAttribute("disabled", "true");
            }
        }
        
        let activePlayersCount = 0;
        for (let i = 1; i <= 4; i++) {
            const name = players[`player${i}`]?.name;
            if (name && name !== "Waiting..." && name !== "Not In Use") {
                activePlayersCount++;
            }
        }
        
        if (isCreator && activePlayersCount >= 2) {
            startGameBtn.removeAttribute("disabled");
        } else {
            startGameBtn.setAttribute("disabled", "true");
        }
        
    } else if (currentGameState === 'playing' || currentGameState === 'finished') {
        const isPrivate = !!players.settings?.private;
        if (!mySeat) {
            if (isPrivate || inWaitingRoom) {
                if (roomSubscription) {
                    supabase_db.removeChannel(roomSubscription);
                    roomSubscription = null;
                }
                window.location.href = '../index.html';
                return;
            }
        }
        
        showView(tableView);
        
        if (tableVariantDisplay) {
            tableVariantDisplay.textContent = gameType === 'draw' ? 'Draw Game' : 'Block Game';
        }
        if (boneyardCountDisplay) {
            boneyardCountDisplay.textContent = players.boneyard ? players.boneyard.length : 0;
        }
        
        const boneyardCounterEl = document.querySelector(".boneyard-counter");
        if (boneyardCounterEl) {
            boneyardCounterEl.style.display = (gameType === 'draw') ? 'inline-block' : 'none';
        }
        if (drawBoneyardBtn) {
            drawBoneyardBtn.style.display = (gameType === 'draw') ? 'inline-block' : 'none';
        }
        
        const hudName = document.getElementById("player-hud-name");
        const hudSeat = document.getElementById("player-hud-seat");
        if (hudName) hudName.textContent = myUsername;
        
        if (mySeat) {
            if (hudSeat) hudSeat.textContent = "Seat " + mySeat;
            if (spectatorIndicator) spectatorIndicator.classList.add("hidden-layout");
        } else {
            if (hudSeat) hudSeat.textContent = "Spectator";
            if (spectatorIndicator) spectatorIndicator.classList.remove("hidden-layout");
        }
        
        renderBoardLine(roomData.board_line || []);
        renderPlayerHand(players);
        
        const skinIndex = roomData.players?.settings?.skin || '1';
        let frontUrl = "assets/dom_front.gif";
        let backUrl = "assets/dom_back.gif";
        if (skinIndex === "2") {
            frontUrl = "assets/dom_front1.gif";
            backUrl = "assets/dom_back1.gif";
        } else if (skinIndex === "3") {
            frontUrl = "assets/dom_front3.gif";
            backUrl = "assets/dom_back3.gif";
        }
        if (tableView) {
            tableView.style.setProperty('--tile-front-url', `url('${frontUrl}')`);
            tableView.style.setProperty('--tile-back-url', `url('${backUrl}')`);
        }
        
        if (boneyardDeck) {
            if (gameType === 'draw') {
                boneyardDeck.style.display = "flex";
                const boneyardCount = players.boneyard ? players.boneyard.length : 0;
                const countValEl = document.getElementById("boneyard-deck-count-val");
                if (countValEl) {
                    countValEl.textContent = boneyardCount;
                }
                const pileEl = document.getElementById("boneyard-deck-pile");
                if (pileEl) {
                    pileEl.innerHTML = "";
                    const visibleCount = Math.min(3, boneyardCount);
                    for (let i = 0; i < visibleCount; i++) {
                        const tileEl = document.createElement("div");
                        tileEl.className = `domino-tile double face-down boneyard-scatter-${i + 1}`;
                        pileEl.appendChild(tileEl);
                    }
                }
            } else {
                boneyardDeck.style.display = "none";
            }
        }
        
        renderOpponentsAtTable(players, roomData.active_turn);
        setTurnState(roomData.active_turn, players, roomData.board_line || []);
        
        if (currentGameState === 'finished') {
            displayGameOverModal(players, roomData.board_line);
        } else {
            gameOverOverlay.classList.add("hidden-layout");
        }
    }
}

// CHAT SYSTEM
async function loadGlobalChat() {
    try {
        const { data } = await supabase_db
            .from('messages')
            .select('*')
            .order('id', { ascending: true })
            .limit(40);
            
        if (data) {
            if (lobbyChatMessages) lobbyChatMessages.innerHTML = "";
            if (chatMessages) chatMessages.innerHTML = "";
            if (tableChatMessages) tableChatMessages.innerHTML = "";
            data.forEach(msg => displayGlobalChatMessage(msg));
        }
    } catch (e) {
        console.error("Failed to load global chat:", e);
    }
}

function subscribeToGlobalChat() {
    supabase_db.channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', pattern: 'public', table: 'messages' }, payload => {
            if (payload.new) {
                displayGlobalChatMessage(payload.new);
            }
        })
        .subscribe();
}

async function sendGlobalChatMessage(inputEl) {
    const text = inputEl.value.trim();
    if (!text) return;
    
    try {
        await supabase_db.from('messages').insert([{ username: myUsername, message: text }]);
        inputEl.value = "";
    } catch (e) {
        console.error("Failed to send global message:", e);
    }
}

function displayGlobalChatMessage(data) {
    if (lobbyChatMessages) {
        const row = document.createElement("div");
        row.className = "chat-msg-row";
        row.innerHTML = `<span class="chat-msg-user">${escapeHtml(data.username)}:</span> <span class="chat-msg-text">${escapeHtml(data.message)}</span>`;
        lobbyChatMessages.appendChild(row);
        lobbyChatMessages.scrollTop = lobbyChatMessages.scrollHeight;
    }
    
    if (chatMessages) {
        const row = document.createElement("div");
        row.className = "chat-msg-row";
        row.innerHTML = `<span class="chat-msg-user">${escapeHtml(data.username)}:</span> <span class="chat-msg-text">${escapeHtml(data.message)}</span>`;
        chatMessages.appendChild(row);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    if (tableChatMessages) {
        const row = document.createElement("div");
        row.className = "chat-msg-row";
        row.innerHTML = `<span class="chat-msg-user">${escapeHtml(data.username)}:</span> <span class="chat-msg-text">${escapeHtml(data.message)}</span>`;
        tableChatMessages.appendChild(row);
        tableChatMessages.scrollTop = tableChatMessages.scrollHeight;
    }
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// SEATING CONTROLS
async function toggleSeating(username) {
    if (!currentRoomCode || !localState) return;
    const players = localState.players || {};
    if (players.creator !== myUsername) return; 
    if (username === players.creator) return; 
    
    let seatedSeat = null;
    for (let i = 2; i <= 4; i++) {
        if (players[`player${i}`] && players[`player${i}`].name === username) {
            seatedSeat = i;
            break;
        }
    }
    
    if (seatedSeat) {
        players[`player${seatedSeat}`].name = "Waiting...";
        players[`player${seatedSeat}`].hand = [];
    } else {
        let emptySeat = null;
        for (let i = 2; i <= 4; i++) {
            if (players[`player${i}`] && players[`player${i}`].name === "Waiting...") {
                emptySeat = i;
                break;
            }
        }
        
        if (emptySeat) {
            players[`player${emptySeat}`].name = username;
            players[`player${emptySeat}`].hand = [];
        } else {
            alert("All game seats are currently full! Remove a seated player first.");
            return;
        }
    }
    
    try {
        await updateRoomState({ players: players });
    } catch(err) {
        console.error("Failed to toggle seating:", err);
    }
}

async function togglePrivateGameSetting() {
    if (!currentRoomCode || !localState) return;
    const players = localState.players || {};
    if (players.creator !== myUsername) return; 
    
    const privateGameCheckbox = document.getElementById("private-game-checkbox");
    if (!privateGameCheckbox) return;
    
    if (!players.settings) players.settings = {};
    players.settings.private = privateGameCheckbox.checked;
    
    try {
        await updateRoomState({ players: players });
    } catch(err) {
        console.error("Failed to update private setting:", err);
    }
}

// LOBBY LOGS AND TABLE LOGS
function logTableAction(text, highlightType = "") {
    const div = document.createElement("div");
    if (highlightType) {
        div.className = highlightType;
    }
    div.textContent = `[${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}] ${text}`;
    tableLogEntries.appendChild(div);
    tableLogEntries.scrollTop = tableLogEntries.scrollHeight;
}

function logSystemMessage(text) {
    console.log(text);
}

// GAME FLOW: START GAME
async function startGame() {
    if (!currentRoomCode || !localState) return;
    
    playShuffleSound();
    logTableAction("Shuffling and dealing tiles...", "log-highlight");
    
    const players = localState.players || {};
    const settings = players.settings || {};
    
    const deck = [];
    let dId = 1;
    for (let i = 0; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
            deck.push({
                id: 'b' + dId++,
                top: i,
                bottom: j,
                isDouble: i === j
            });
        }
    }
    
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    const activeSeats = [];
    const seatedNames = [];
    for (let i = 1; i <= 4; i++) {
        const pName = players[`player${i}`]?.name;
        if (pName && pName !== "Waiting..." && pName !== "Not In Use") {
            activeSeats.push(i);
            seatedNames.push(pName);
        }
    }
    players.lobby_roster = seatedNames;
    
    activeSeats.forEach(seatNum => {
        players[`player${seatNum}`].hand = deck.splice(0, 7);
    });
    
    players.boneyard = deck;
    players.scores = {};
    activeSeats.forEach(s => {
        players.scores[`player${s}`] = 0;
    });
    
    // Handle match score persistence/resets
    const targetScore = settings.target_score || 0;
    let matchEnded = false;
    if (targetScore > 0 && settings.match_scores) {
        if (settings.game_mode === "2v2") {
            if (settings.match_scores.team_a >= targetScore || settings.match_scores.team_b >= targetScore) {
                matchEnded = true;
            }
        } else {
            for (let i = 1; i <= 4; i++) {
                if (settings.match_scores["p" + i] >= targetScore) {
                    matchEnded = true;
                    break;
                }
            }
        }
    }
    if (matchEnded || !settings.match_scores) {
        settings.match_scores = settings.game_mode === "2v2" ? { team_a: 0, team_b: 0 } : { p1: 0, p2: 0, p3: 0, p4: 0 };
    }
    
    let starterSeat = activeSeats[0];
    let highestDouble = -1;
    let highestSum = -1;
    
    activeSeats.forEach(seatNum => {
        const hand = players[`player${seatNum}`].hand || [];
        hand.forEach(tile => {
            if (tile.isDouble && tile.top > highestDouble) {
                highestDouble = tile.top;
                starterSeat = seatNum;
            } else if (highestDouble === -1) {
                const sum = tile.top + tile.bottom;
                if (sum > highestSum) {
                    highestSum = sum;
                    starterSeat = seatNum;
                }
            }
        });
    });
    
    try {
        await updateRoomState({
            game_state: 'playing',
            board_line: [],
            active_turn: starterSeat,
            players: players
        });
            
    } catch(err) {
        alert("Failed to start game: " + err.message);
    }
}

// TRACK MATH: BOUNDARIES & PIVOT LOGIC
function walkTrack(x, y, dir, prevIsDouble, currIsDouble, gap, xMin, xMax, yMin, yMax, cy) {
    const L = 91.2;
    const W = 45.6;

    let prevAlong = prevIsDouble ? W/2 : L/2;
    let prevPerp = prevIsDouble ? L/2 : W/2;
    let currAlong = currIsDouble ? W/2 : L/2;
    let currPerp = currIsDouble ? L/2 : W/2;

    let step = prevAlong + currAlong + gap;
    let nx = x + dir[0] * step;
    let ny = y + dir[1] * step;
    let ndir = [...dir];
    let turned = false;

    // Check bounds and declare turn
    if (dir[0] === 1 && nx > xMax) {
        ndir = [0, y < cy ? 1 : -1]; 
        turned = true;
    } else if (dir[0] === -1 && nx < xMin) {
        ndir = [0, y < cy ? 1 : -1];
        turned = true;
    } else if (dir[1] === 1 && ny > yMax) {
        ndir = [x < (xMin + xMax) / 2 ? 1 : -1, 0];
        turned = true;
    } else if (dir[1] === -1 && ny < yMin) {
        ndir = [x < (xMin + xMax) / 2 ? 1 : -1, 0];
        turned = true;
    }

    if (turned) {
        let pipX = x;
        let pipY = y;
        
        if (!prevIsDouble) {
            pipX += dir[0] * (prevAlong / 2);
            pipY += dir[1] * (prevAlong / 2);
        }

        let edgeX = pipX + ndir[0] * prevPerp;
        let edgeY = pipY + ndir[1] * prevPerp;

        nx = edgeX + ndir[0] * (gap + currAlong);
        ny = edgeY + ndir[1] * (gap + currAlong);
    }

    return { x: nx, y: ny, dir: ndir };
}

// RENDER DOMINO BOARD LINE
function renderBoardLine(boardLine) {
    if (!boardDominoesLine) return;
    boardDominoesLine.innerHTML = "";
    
    if (boardLine.length === 0) {
        boardDominoesLine.innerHTML = `<div class="empty-board-msg">Board is empty. Play any tile to start the line!</div>`;
        return;
    }
    
    const W = 1536; // Fixed design width matching .felt-table
    const H = 729;  // Fixed design height matching .felt-table
    
    const xMin = 240;
    const xMax = W - 350; 
    const yMin = 90 + 22.8; // Reverted back to stable top boundary
    const yMax = H - 110.6 - 22.8; // Reverted back to stable bottom boundary
    
    const tileLength = 91.2;
    const tileWidth = 45.6;
    const gap = 4;
    
    let centerIdx = boardLine.findIndex(t => t.isCenter);
    if (centerIdx === -1) {
        centerIdx = Math.floor(boardLine.length / 2);
        boardLine[centerIdx].isCenter = true;
    }
    
    const centerTile = boardLine[centerIdx];
    let cx = W / 2;
    let cy = H - 140; 
    
    let centerEl = createBoardTileElement(centerTile);
    centerEl.style.position = "absolute";
    
    let centerIsDouble = centerTile.isDouble;
    let centerAngle = 0; 
    
    centerEl.style.left = `${cx - (centerIsDouble ? tileWidth : tileLength)/2}px`;
    centerEl.style.top = `${cy - (centerIsDouble ? tileLength : tileWidth)/2}px`;
    centerEl.style.transform = `rotate(${centerAngle}deg)`;
    boardDominoesLine.appendChild(centerEl);
    
    // Left branch 
    let lx = cx;
    let ly = cy;
    let lDir = [-1, 0]; 
    let prevIsDouble = centerIsDouble;
    
    for (let i = centerIdx - 1; i >= 0; i--) {
        const tile = boardLine[i];
        const currIsDouble = tile.isDouble;
        
        const walkResult = walkTrack(lx, ly, lDir, prevIsDouble, currIsDouble, gap, xMin, xMax, yMin, yMax, cy);
        lx = walkResult.x;
        ly = walkResult.y;
        lDir = walkResult.dir;
        
        const el = createBoardTileElement(tile);
        el.style.position = "absolute";
        
        let angle = 0;
        if (lDir[0] === -1) angle = 0;
        else if (lDir[0] === 1) angle = 180;
        else if (lDir[1] === -1) angle = 90; 
        else if (lDir[1] === 1) angle = -90; 
        
        const elW = currIsDouble ? tileWidth : tileLength;
        const elH = currIsDouble ? tileLength : tileWidth;
        el.style.left = `${lx - elW/2}px`;
        el.style.top = `${ly - elH/2}px`;
        el.style.transform = `rotate(${angle}deg)`;
        
        boardDominoesLine.appendChild(el);
        prevIsDouble = currIsDouble;
    }
    
    // Right branch 
    let rx = cx;
    let ry = cy;
    let rDir = [1, 0]; 
    prevIsDouble = centerIsDouble;
    
    for (let i = centerIdx + 1; i < boardLine.length; i++) {
        const tile = boardLine[i];
        const currIsDouble = tile.isDouble;
        
        const walkResult = walkTrack(rx, ry, rDir, prevIsDouble, currIsDouble, gap, xMin, xMax, yMin, yMax, cy);
        rx = walkResult.x;
        ry = walkResult.y;
        rDir = walkResult.dir;
        
        const el = createBoardTileElement(tile);
        el.style.position = "absolute";
        
        let angle = 0;
        if (rDir[0] === 1) angle = 0;
        else if (rDir[0] === -1) angle = 180;
        else if (rDir[1] === -1) angle = -90; 
        else if (rDir[1] === 1) angle = 90; 
        
        const elW = currIsDouble ? tileWidth : tileLength;
        const elH = currIsDouble ? tileLength : tileWidth;
        el.style.left = `${rx - elW/2}px`;
        el.style.top = `${ry - elH/2}px`;
        el.style.transform = `rotate(${angle}deg)`;
        
        boardDominoesLine.appendChild(el);
        prevIsDouble = currIsDouble;
    }
}

function createBoardTileElement(tile) {
    const isDouble = tile.isDouble;
    return createDominoElement(tile, isDouble ? 'double' : 'single');
}

// HELPER: CREATE DOMINO CARD NODE
function createDominoElement(tile, layoutClass = 'single') {
    const outer = document.createElement("div");
    outer.className = `domino-tile ${layoutClass}`;
    outer.dataset.tileId = tile.id;
    
    const topVal = tile.displayTop !== undefined ? tile.displayTop : tile.top;
    const bottomVal = tile.displayBottom !== undefined ? tile.displayBottom : tile.bottom;
    
    const half1 = document.createElement("div");
    half1.className = `domino-half top-half pips-${topVal}`;
    populatePips(half1, topVal, layoutClass);
    
    const divider = document.createElement("div");
    divider.className = "domino-divider";
    
    const half2 = document.createElement("div");
    half2.className = `domino-half bottom-half pips-${bottomVal}`;
    populatePips(half2, bottomVal, layoutClass);
    
    outer.appendChild(half1);
    outer.appendChild(divider);
    outer.appendChild(half2);
    
    return outer;
}

// POPULATE PIPS 3x3 GRID RENDERER
function populatePips(container, count, layoutClass = 'single') {
    container.innerHTML = "";
    
    const pipPositionsVertical = {
        0: [],
        1: [4],
        2: [0, 8],
        3: [0, 4, 8],
        4: [0, 2, 6, 8],
        5: [0, 2, 4, 6, 8],
        6: [0, 2, 3, 5, 6, 8]
    };
    
    const pipPositionsHorizontal = {
        0: [],
        1: [4],
        2: [2, 6],
        3: [2, 4, 6],
        4: [0, 2, 6, 8],
        5: [0, 2, 4, 6, 8],
        6: [0, 1, 2, 6, 7, 8]
    };
    
    const pipPositions = (layoutClass === 'single') ? pipPositionsHorizontal : pipPositionsVertical;
    const activeDots = pipPositions[count] || [];
    
    for (let i = 0; i < 9; i++) {
        const dot = document.createElement("span");
        if (activeDots.includes(i)) {
            dot.className = "pip";
        } else {
            dot.className = "pip-empty";
        }
        container.appendChild(dot);
    }
}

// RENDER PLAYER HAND (BOTTOM FOOTER)
function renderPlayerHand(players) {
    const prevCount = parseInt(playerHandRow.getAttribute("data-tile-count") || "0");
    playerHandRow.innerHTML = "";
    
    if (!mySeat) {
        playerHandRow.innerHTML = `<div style="color: var(--text-secondary); font-style:italic;">You are spectating this table</div>`;
        return;
    }
    
    const myHand = players[`player${mySeat}`]?.hand || [];
    const newCount = myHand.length;
    playerHandRow.setAttribute("data-tile-count", newCount);
    
    if (newCount === 0) {
        playerHandRow.innerHTML = `<div style="color: var(--text-secondary);">Your hand is empty.</div>`;
        return;
    }
    
    myHand.forEach(tile => {
        const dom = createDominoElement(tile, 'double'); 
        
        dom.addEventListener("click", () => {
            if (localState.active_turn !== mySeat || currentGameState !== 'playing') return;
            
            if (dom.classList.contains("selected-tile")) {
                dom.classList.remove("selected-tile");
                selectedTileElement = null;
                selectedTileData = null;
                playPlacementOverlay.classList.add("hidden-layout");
            } else {
                const allTiles = playerHandRow.querySelectorAll(".domino-tile");
                allTiles.forEach(t => t.classList.remove("selected-tile"));
                
                dom.classList.add("selected-tile");
                selectedTileElement = dom;
                selectedTileData = tile;
                
                checkMoveValidityAndPrompt(tile);
            }
        });
        
        playerHandRow.appendChild(dom);
    });
    
    if (newCount > prevCount) {
        setTimeout(() => {
            playerHandRow.scrollLeft = playerHandRow.scrollWidth;
        }, 50);
    }
}

// RENDER OPPONENTS 
function renderOpponentsAtTable(players, activeTurn) {
    if (!localState) return;
    
    const myCapsule = document.getElementById("my-player-capsule");
    const is2v2 = (players.settings?.game_mode === "2v2");
    
    if (myCapsule) {
        myCapsule.classList.remove("team-a-border", "team-b-border");
        const existingBadge = myCapsule.querySelector(".team-badge");
        if (existingBadge) existingBadge.remove();
    }
    
    for (let i = 1; i <= 4; i++) {
        const p = players[`player${i}`];
        const badge = document.getElementById(`corner-player-${i}`);
        if (!badge) continue;
        
        badge.classList.remove("team-a-border", "team-b-border");
        
        const isTeamA = (i === 1 || i === 3);
        const teamClass = isTeamA ? "team-a" : "team-b";
        
        if (is2v2) {
            badge.classList.add(teamClass + "-border");
        }
        
        if (mySeat === i) {
            badge.style.display = "none";
            
            if (myCapsule) {
                myCapsule.classList.remove("hidden-layout");
                if (is2v2) {
                    myCapsule.classList.add(teamClass + "-border");
                    const badgeDiv = document.createElement("div");
                    badgeDiv.className = `team-badge ${teamClass}`;
                    badgeDiv.textContent = isTeamA ? "Team A (You)" : "Team B (You)";
                    myCapsule.appendChild(badgeDiv);
                }
                
                const nameEl = document.getElementById("my-player-capsule-name");
                const statusEl = document.getElementById("my-player-capsule-status");
                if (nameEl) nameEl.textContent = p.name;
                const handCount = p.hand ? p.hand.length : 0;
                if (statusEl) statusEl.textContent = `Bones: ${handCount}`;
                
                if (activeTurn === i && currentGameState === 'playing') {
                    myCapsule.classList.add("active-turn-badge");
                } else {
                    myCapsule.classList.remove("active-turn-badge");
                }
            }
            continue;
        }
        
        badge.style.display = "flex";
        
        if (!p || p.name === "Not In Use" || p.name === "Waiting...") {
            badge.innerHTML = `<span class="player-name">P${i}</span> <span class="player-status">Empty</span>`;
            badge.classList.remove("active-turn-badge");
        } else {
            const handCount = p.hand ? p.hand.length : 0;
            
            let teamBadgeHtml = "";
            if (is2v2) {
                let teamLabel = isTeamA ? "Team A" : "Team B";
                if (mySeat) {
                    const partnerSeat = (mySeat === 1 ? 3 : mySeat === 3 ? 1 : mySeat === 2 ? 4 : 2);
                    if (i === partnerSeat) teamLabel += " (Partner)";
                    else teamLabel += " (Opponent)";
                }
                teamBadgeHtml = `<div class="team-badge ${teamClass}">${teamLabel}</div>`;
            }
            
            badge.innerHTML = `<span class="player-name">${escapeHtml(p.name)}</span> <span class="player-status">Bones: ${handCount}</span>${teamBadgeHtml}`;
            
            if (activeTurn === i && currentGameState === 'playing') {
                badge.classList.add("active-turn-badge");
            } else {
                badge.classList.remove("active-turn-badge");
            }
        }
    }
    
    if (!mySeat && myCapsule) {
        myCapsule.classList.add("hidden-layout");
    }
}

// TURN LOGIC 
let autoSkipTimeout = null;

function setTurnState(activeTurn, players, boardLine) {
    if (autoSkipTimeout) {
        clearTimeout(autoSkipTimeout);
        autoSkipTimeout = null;
    }
    
    const activePlayerName = players[`player${activeTurn}`]?.name || "Player";
    const isMyTurn = (mySeat === activeTurn);
    
    const activeTurnVal = document.getElementById("table-active-turn-val");
    if (activeTurnVal) {
        if (isMyTurn && currentGameState === 'playing') {
            activeTurnVal.textContent = "YOU ! PLAY A TILE !";
        } else {
            activeTurnVal.textContent = activePlayerName.toUpperCase();
        }
    }
    
    const myCapsule = document.getElementById("my-player-capsule");
    for (let i = 1; i <= 4; i++) {
        const badge = document.getElementById(`corner-player-${i}`);
        if (badge) {
            if (activeTurn === i && currentGameState === 'playing') {
                badge.classList.add("active-turn-badge");
                if (mySeat === i && myCapsule) {
                    myCapsule.classList.add("active-turn-badge");
                }
            } else {
                badge.classList.remove("active-turn-badge");
                if (mySeat === i && myCapsule) {
                    myCapsule.classList.remove("active-turn-badge");
                }
            }
        }
    }
    
    if (currentGameState !== 'playing') {
        turnIndicatorBanner.classList.remove("my-turn");
        turnIndicatorBanner.textContent = "Round Finished";
        if (drawBoneyardBtn) drawBoneyardBtn.setAttribute("disabled", "true");
        return;
    }
    
    if (isMyTurn) {
        turnIndicatorBanner.classList.add("my-turn");
        turnIndicatorBanner.textContent = "YOUR TURN";
        
        const myHand = players[`player${mySeat}`]?.hand || [];
        const hasMoves = checkAnyValidMoves(myHand, boardLine);
        
        if (!hasMoves) {
            const boneyardCount = players.boneyard ? players.boneyard.length : 0;
            const gameType = players.settings?.game_type || 'block';
            const canDraw = (gameType === 'draw' && boneyardCount > 0);
            
            if (canDraw) {
                if (drawBoneyardBtn) drawBoneyardBtn.removeAttribute("disabled");
                turnIndicatorBanner.textContent = "No moves! Drawing tile...";
                turnIndicatorBanner.classList.add("my-turn");
                
                autoSkipTimeout = setTimeout(async () => {
                    await drawTileFromBoneyard();
                }, 800);
            } else {
                if (drawBoneyardBtn) drawBoneyardBtn.setAttribute("disabled", "true");
                turnIndicatorBanner.textContent = "Turn skipped, no play!";
                turnIndicatorBanner.classList.add("skipped-glow");
                
                autoSkipTimeout = setTimeout(async () => {
                    turnIndicatorBanner.classList.remove("skipped-glow");
                    await passTurn();
                }, 500);
            }
        } else {
            if (drawBoneyardBtn) drawBoneyardBtn.setAttribute("disabled", "true");
        }
    } else {
        turnIndicatorBanner.classList.remove("my-turn");
        turnIndicatorBanner.textContent = `${activePlayerName}'s Turn`;
        if (drawBoneyardBtn) drawBoneyardBtn.setAttribute("disabled", "true");
    }
}

function checkMoveValidityAndPrompt(tile) {
    if (!localState) return;
    const boardLine = localState.board_line || [];
    
    if (boardLine.length === 0) {
        executeMove('center');
        return;
    }
    
    const leftValue = boardLine[0].displayTop !== undefined ? boardLine[0].displayTop : boardLine[0].top;
    const rightValue = boardLine[boardLine.length - 1].displayBottom !== undefined ? boardLine[boardLine.length - 1].displayBottom : boardLine[boardLine.length - 1].bottom;
    
    const fitsLeft = (tile.top === leftValue || tile.bottom === leftValue);
    const fitsRight = (tile.top === rightValue || tile.bottom === rightValue);
    
    if (fitsLeft && fitsRight && leftValue !== rightValue) {
        playPlacementOverlay.classList.remove("hidden-layout");
    } else if (fitsLeft) {
        executeMove('left');
    } else if (fitsRight) {
        executeMove('right');
    } else {
        if (selectedTileElement) {
            selectedTileElement.classList.add("error-shake");
            setTimeout(() => {
                if (selectedTileElement) selectedTileElement.classList.remove("error-shake");
            }, 500);
        }
        logTableAction("This tile does not match either end of the board line.", "chat-system");
    }
}

function checkAnyValidMoves(hand, boardLine) {
    if (boardLine.length === 0) return true; 
    
    const leftValue = boardLine[0].displayTop !== undefined ? boardLine[0].displayTop : boardLine[0].top;
    const rightValue = boardLine[boardLine.length - 1].displayBottom !== undefined ? boardLine[boardLine.length - 1].displayBottom : boardLine[boardLine.length - 1].bottom;
    
    return hand.some(tile => {
        return (tile.top === leftValue || tile.bottom === leftValue || tile.top === rightValue || tile.bottom === rightValue);
    });
}

// EXECUTE PLAY MOVE
async function executeMove(position) {
    if (!localState || !selectedTileData || !mySeat) return;
    
    playClackSound();
    playPlacementOverlay.classList.add("hidden-layout");
    
    const boardLine = localState.board_line || [];
    const players = localState.players || {};
    const myHand = players[`player${mySeat}`]?.hand || [];
    
    let playedTile = { ...selectedTileData };
    
    if (boardLine.length === 0) {
        playedTile.displayTop = playedTile.top;
        playedTile.displayBottom = playedTile.bottom;
        boardLine.push(playedTile);
    } else {
        const leftValue = boardLine[0].displayTop !== undefined ? boardLine[0].displayTop : boardLine[0].top;
        const rightValue = boardLine[boardLine.length - 1].displayBottom !== undefined ? boardLine[boardLine.length - 1].displayBottom : boardLine[boardLine.length - 1].bottom;
        
        if (position === 'left') {
            if (playedTile.bottom === leftValue) {
                playedTile.displayTop = playedTile.top;
                playedTile.displayBottom = playedTile.bottom;
            } else {
                playedTile.displayTop = playedTile.bottom;
                playedTile.displayBottom = playedTile.top;
            }
            boardLine.unshift(playedTile);
        } else if (position === 'right') {
            if (playedTile.top === rightValue) {
                playedTile.displayTop = playedTile.top;
                playedTile.displayBottom = playedTile.bottom;
            } else {
                playedTile.displayTop = playedTile.bottom;
                playedTile.displayBottom = playedTile.top;
            }
            boardLine.push(playedTile);
        }
    }
    
    players[`player${mySeat}`].hand = myHand.filter(t => t.id !== playedTile.id);
    
    let isRoundOver = false;
    let winnerSeat = null;
    
    if (players[`player${mySeat}`].hand.length === 0) {
        isRoundOver = true;
        winnerSeat = mySeat;
    }
    
    let isBlocked = false;
    if (!isRoundOver) {
        const activeSeats = [];
        for (let i = 1; i <= 4; i++) {
            const name = players[`player${i}`]?.name;
            if (name && name !== "Waiting..." && name !== "Not In Use") {
                activeSeats.push(i);
            }
        }
        
        const boneyardCount = players.boneyard ? players.boneyard.length : 0;
        
        if (boneyardCount === 0) {
            const anyMoves = activeSeats.some(seatNum => {
                const hand = players[`player${seatNum}`].hand || [];
                return checkAnyValidMoves(hand, boardLine);
            });
            if (!anyMoves) {
                isBlocked = true;
                isRoundOver = true;
            }
        }
    }
    
    let nextTurn = localState.active_turn;
    if (!isRoundOver) {
        nextTurn = getNextTurnSeat(localState.active_turn, players);
    }
    
    let gameState = isRoundOver ? 'finished' : 'playing';
    
    if (isRoundOver) {
        const roundRes = calculateRoundScores(players);
        const is2v2 = (players.settings?.game_mode === "2v2");
        if (!players.settings.match_scores) {
            players.settings.match_scores = is2v2 ? { team_a: 0, team_b: 0 } : { p1: 0, p2: 0, p3: 0, p4: 0 };
        }
        if (is2v2) {
            players.settings.match_scores[roundRes.winningTeam] = (players.settings.match_scores[roundRes.winningTeam] || 0) + roundRes.roundPoints;
        } else {
            players.settings.match_scores[`p${roundRes.winnerSeat}`] = (players.settings.match_scores[`p${roundRes.winnerSeat}`] || 0) + roundRes.roundPoints;
        }
    }
    
    const tileStr = `[${playedTile.top}-${playedTile.bottom}]`;
    const sideStr = position === 'center' ? 'center' : (position === 'left' ? 'Left End' : 'Right End');
    logTableAction(`${myUsername} played ${tileStr} on ${sideStr}`, "log-success");
    
    selectedTileElement = null;
    selectedTileData = null;
    
    try {
        await updateRoomState({
            board_line: boardLine,
            players: players,
            active_turn: nextTurn,
            game_state: gameState
        });
    } catch(err) {
        alert("Failed to submit move: " + err.message);
    }
}

function getNextTurnSeat(currentTurn, players) {
    let nextSeat = (currentTurn % 4) + 1;
    while (players[`player${nextSeat}`]?.name === "Waiting..." || players[`player${nextSeat}`]?.name === "Not In Use") {
        nextSeat = (nextSeat % 4) + 1;
    }
    return nextSeat;
}

// DRAW TILE FROM BONEYARD
async function drawTileFromBoneyard() {
    if (!localState || !mySeat || localState.active_turn !== mySeat) return;
    
    const players = localState.players || {};
    const boneyard = players.boneyard || [];
    
    if (boneyard.length === 0) return;
    
    playClackSound();
    
    const drawnTile = boneyard.pop();
    players[`player${mySeat}`].hand.push(drawnTile);
    players.boneyard = boneyard;
    
    logTableAction(`${myUsername} drew a tile from boneyard`);
    
    try {
        await updateRoomState({
            players: players
        });
    } catch(err) {
        alert("Failed to draw tile: " + err.message);
    }
}

// PASS TURN
async function passTurn() {
    if (!localState || !mySeat || localState.active_turn !== mySeat) return;
    
    const players = localState.players || {};
    const boardLine = localState.board_line || [];
    
    let isBlocked = false;
    const activeSeats = [];
    for (let i = 1; i <= 4; i++) {
        const name = players[`player${i}`]?.name;
        if (name && name !== "Waiting..." && name !== "Not In Use") {
            activeSeats.push(i);
        }
    }
    
    const boneyardCount = players.boneyard ? players.boneyard.length : 0;
    if (boneyardCount === 0) {
        const anyMoves = activeSeats.some(seatNum => {
            const hand = players[`player${seatNum}`].hand || [];
            return checkAnyValidMoves(hand, boardLine);
        });
        if (!anyMoves) {
            isBlocked = true;
        }
    }
    
    logTableAction(`${myUsername} passed their turn`, "log-highlight");
    
    try {
        if (isBlocked) {
            const roundRes = calculateRoundScores(players);
            const is2v2 = (players.settings?.game_mode === "2v2");
            if (!players.settings.match_scores) {
                players.settings.match_scores = is2v2 ? { team_a: 0, team_b: 0 } : { p1: 0, p2: 0, p3: 0, p4: 0 };
            }
            if (is2v2) {
                players.settings.match_scores[roundRes.winningTeam] = (players.settings.match_scores[roundRes.winningTeam] || 0) + roundRes.roundPoints;
            } else {
                players.settings.match_scores[`p${roundRes.winnerSeat}`] = (players.settings.match_scores[`p${roundRes.winnerSeat}`] || 0) + roundRes.roundPoints;
            }
            
            await updateRoomState({
                game_state: 'finished',
                players: players
            });
        } else {
            const nextTurn = getNextTurnSeat(mySeat, players);
            await updateRoomState({
                active_turn: nextTurn
            });
        }
    } catch(err) {
        alert("Failed to pass turn: " + err.message);
    }
}

// CALCULATE ROUND SCORES HELPER
function calculateRoundScores(players) {
    const is2v2 = (players.settings?.game_mode === "2v2");
    
    const activePlayers = [];
    for (let i = 1; i <= 4; i++) {
        const p = players[`player${i}`];
        if (p && p.name !== "Waiting..." && p.name !== "Not In Use") {
            const hand = p.hand || [];
            let sum = 0;
            hand.forEach(t => sum += (t.top + t.bottom));
            activePlayers.push({ seat: i, name: p.name, sum: sum, count: hand.length });
        }
    }
    
    activePlayers.sort((a, b) => a.sum - b.sum);
    const roundWinner = activePlayers[0];
    
    let roundPoints = 0;
    let winningTeam = null;
    
    if (is2v2) {
        const winnerIsTeamA = (roundWinner.seat === 1 || roundWinner.seat === 3);
        winningTeam = winnerIsTeamA ? 'team_a' : 'team_b';
        activePlayers.forEach(p => {
            const playerIsTeamA = (p.seat === 1 || p.seat === 3);
            if (playerIsTeamA !== winnerIsTeamA) {
                roundPoints += p.sum;
            }
        });
    } else {
        activePlayers.forEach(p => {
            if (p.seat !== roundWinner.seat) {
                roundPoints += p.sum;
            }
        });
    }
    
    return {
        winnerSeat: roundWinner.seat,
        winnerName: roundWinner.name,
        roundPoints: roundPoints,
        winningTeam: winningTeam
    };
}

// DISPLAY GAME OVER MODAL 
function displayGameOverModal(players, boardLine) {
    if (gameOverCountdownInterval) {
        clearInterval(gameOverCountdownInterval);
        gameOverCountdownInterval = null;
    }

    gameOverOverlay.classList.remove("hidden-layout");
    
    const seated = [];
    for (let i = 1; i <= 4; i++) {
        const p = players[`player${i}`];
        if (p && p.name !== "Waiting..." && p.name !== "Not In Use") {
            const hand = p.hand || [];
            let pipSum = 0;
            hand.forEach(tile => {
                pipSum += tile.top + tile.bottom;
            });
            
            seated.push({
                seat: i,
                name: p.name,
                pipSum: pipSum,
                tileCount: hand.length
            });
        }
    }
    
    seated.sort((a, b) => a.pipSum - b.pipSum);
    
    let blockTriggered = true;
    seated.forEach(s => {
        if (s.tileCount === 0) blockTriggered = false;
    });
    
    const roundRes = calculateRoundScores(players);
    const is2v2 = (players.settings?.game_mode === "2v2");
    const targetScore = players.settings?.target_score || 0;
    const matchScores = players.settings?.match_scores;
    
    // Check if match winner exists
    let matchWinnerName = "";
    if (targetScore > 0 && matchScores) {
        if (is2v2) {
            if (matchScores.team_a >= targetScore) matchWinnerName = "Team A";
            else if (matchScores.team_b >= targetScore) matchWinnerName = "Team B";
        } else {
            for (let i = 1; i <= 4; i++) {
                if (matchScores["p" + i] >= targetScore) {
                    matchWinnerName = players["player" + i]?.name || `Player ${i}`;
                    break;
                }
            }
        }
    }
    
    const countdownEl = document.getElementById("game-over-countdown");
    const countdownSecsEl = document.getElementById("countdown-seconds");
    
    if (matchWinnerName !== "") {
        gameOverTitle.textContent = "Match Finished!";
        winnerNameDisplay.textContent = `${matchWinnerName} wins the Match! 🏆`;
        if (countdownEl) countdownEl.style.display = "none";
    } else {
        gameOverTitle.textContent = blockTriggered ? "Game Blocked!" : "Round Over!";
        if (is2v2) {
            const teamLabel = roundRes.winningTeam === 'team_a' ? "Team A" : "Team B";
            winnerNameDisplay.textContent = `${teamLabel} wins round! +${roundRes.roundPoints} points`;
        } else {
            winnerNameDisplay.textContent = `${roundRes.winnerName} wins round! +${roundRes.roundPoints} points`;
        }
        
        // Auto-restart countdown if match target score is active and not reached
        if (targetScore > 0 && countdownEl && countdownSecsEl) {
            countdownEl.style.display = "block";
            let secondsLeft = 5;
            countdownSecsEl.textContent = secondsLeft;
            
            gameOverCountdownInterval = setInterval(() => {
                secondsLeft--;
                countdownSecsEl.textContent = secondsLeft;
                if (secondsLeft <= 0) {
                    clearInterval(gameOverCountdownInterval);
                    gameOverCountdownInterval = null;
                    const isCreator = (players.creator === myUsername);
                    if (isCreator) {
                        restartGame();
                    }
                }
            }, 1000);
        } else if (countdownEl) {
            countdownEl.style.display = "none";
        }
    }
    
    gameOverScoresList.innerHTML = "";
    
    // Round Header
    const roundHeader = document.createElement("div");
    roundHeader.style.fontWeight = "bold";
    roundHeader.style.marginTop = "10px";
    roundHeader.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
    roundHeader.textContent = "Round Pip Counts:";
    gameOverScoresList.appendChild(roundHeader);
    
    seated.forEach((s, idx) => {
        const div = document.createElement("div");
        div.className = `score-row ${s.seat === roundRes.winnerSeat ? 'winner-row' : ''}`;
        div.innerHTML = `
            <span>${idx + 1}. ${s.name} ${s.seat === roundRes.winnerSeat ? '🏆' : ''}</span>
            <span>${s.pipSum} pips (${s.tileCount} tiles left)</span>
        `;
        gameOverScoresList.appendChild(div);
    });
    
    // Cumulative Match Scores if active
    if (targetScore > 0 && matchScores) {
        const matchHeader = document.createElement("div");
        matchHeader.style.fontWeight = "bold";
        matchHeader.style.marginTop = "20px";
        matchHeader.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
        matchHeader.textContent = `Match Standing (Target: ${targetScore}):`;
        gameOverScoresList.appendChild(matchHeader);
        
        if (is2v2) {
            const rowA = document.createElement("div");
            rowA.className = `score-row ${matchWinnerName === "Team A" ? "winner-row" : ""}`;
            rowA.innerHTML = `<span>Team A (P1 + P3) ${matchWinnerName === "Team A" ? "🏆" : ""}</span><span>${matchScores.team_a} pts</span>`;
            
            const rowB = document.createElement("div");
            rowB.className = `score-row ${matchWinnerName === "Team B" ? "winner-row" : ""}`;
            rowB.innerHTML = `<span>Team B (P2 + P4) ${matchWinnerName === "Team B" ? "🏆" : ""}</span><span>${matchScores.team_b} pts</span>`;
            
            gameOverScoresList.appendChild(rowA);
            gameOverScoresList.appendChild(rowB);
        } else {
            seated.forEach(s => {
                const row = document.createElement("div");
                const score = matchScores[`p${s.seat}`] || 0;
                const isWinner = (s.name === matchWinnerName);
                row.className = `score-row ${isWinner ? "winner-row" : ""}`;
                row.innerHTML = `<span>${s.name} ${isWinner ? "🏆" : ""}</span><span>${score} pts</span>`;
                gameOverScoresList.appendChild(row);
            });
        }
    }
    
    const isCreator = (players.creator === myUsername);
    if (isCreator) {
        restartGameBtn.style.display = "block";
    } else {
        restartGameBtn.style.display = "none";
    }
}

// PLAY AGAIN / RESET ROOM
async function restartGame() {
    if (gameOverCountdownInterval) {
        clearInterval(gameOverCountdownInterval);
        gameOverCountdownInterval = null;
    }
    if (!currentRoomCode) return;
    startGame();
}

function resetToLobby() {
    if (gameOverCountdownInterval) {
        clearInterval(gameOverCountdownInterval);
        gameOverCountdownInterval = null;
    }
    gameOverOverlay.classList.add("hidden-layout");
    leaveRoom();
}

// SETUP BOARD PANNING / SCROLLING
function setupBoardDragging() {
    let isDown = false;
    let startX;
    let startY;
    let scrollLeft;
    let scrollTop;

    boardTrackContainer.addEventListener('mousedown', (e) => {
        isDown = true;
        boardTrackContainer.classList.add('active');
        startX = e.pageX - boardTrackContainer.offsetLeft;
        startY = e.pageY - boardTrackContainer.offsetTop;
        scrollLeft = boardTrackContainer.scrollLeft;
        scrollTop = boardTrackContainer.scrollTop;
    });

    boardTrackContainer.addEventListener('mouseleave', () => {
        isDown = false;
    });

    boardTrackContainer.addEventListener('mouseup', () => {
        isDown = false;
    });

    boardTrackContainer.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - boardTrackContainer.offsetLeft;
        const y = e.pageY - boardTrackContainer.offsetTop;
        const walkX = (x - startX) * 1.5;
        const walkY = (y - startY) * 1.5;
        boardTrackContainer.scrollLeft = scrollLeft - walkX;
        boardTrackContainer.scrollTop = scrollTop - walkY;
    });
}

async function triggerLayoutTest() {
    // Full practice deck (28 tiles) to force all corner scenarios
    const testSequence = [
        // Forced pathing
        { id: 'b1', top: 6, bottom: 6, isDouble: true, isCenter: true },
        { id: 'b2', top: 6, bottom: 5, isDouble: false },
        { id: 'b3', top: 5, bottom: 5, isDouble: true },
        { id: 'b4', top: 5, bottom: 4, isDouble: false },
        { id: 'b5', top: 4, bottom: 4, isDouble: true },
        { id: 'b6', top: 4, bottom: 3, isDouble: false },
        { id: 'b7', top: 3, bottom: 3, isDouble: true },
        { id: 'b8', top: 3, bottom: 2, isDouble: false },
        { id: 'b9', top: 2, bottom: 2, isDouble: true },
        { id: 'b10', top: 2, bottom: 1, isDouble: false },
        { id: 'b11', top: 1, bottom: 1, isDouble: true },
        { id: 'b12', top: 1, bottom: 0, isDouble: false },
        { id: 'b13', top: 0, bottom: 0, isDouble: true },
        { id: 'b14', top: 0, bottom: 6, isDouble: false },
        { id: 'b15', top: 6, bottom: 1, isDouble: false },
        { id: 'b16', top: 1, bottom: 2, isDouble: false },
        { id: 'b17', top: 2, bottom: 3, isDouble: false },
        { id: 'b18', top: 3, bottom: 4, isDouble: false },
        { id: 'b19', top: 4, bottom: 5, isDouble: false },
        { id: 'b20', top: 5, bottom: 6, isDouble: false },
        { id: 'b21', top: 6, bottom: 0, isDouble: false },
        { id: 'b22', top: 0, bottom: 1, isDouble: false },
        { id: 'b23', top: 1, bottom: 3, isDouble: false },
        { id: 'b24', top: 3, bottom: 5, isDouble: false },
        { id: 'b25', top: 5, bottom: 0, isDouble: false },
        { id: 'b26', top: 0, bottom: 2, isDouble: false },
        { id: 'b27', top: 2, bottom: 4, isDouble: false },
        { id: 'b28', top: 4, bottom: 6, isDouble: false }
    ];

    if (currentRoomCode) {
        try {
            const { error } = await supabase_db
                .from('domino_rooms')
                .update({
                    board_line: testSequence,
                    game_state: 'playing'
                })
                .eq('room_code', currentRoomCode);
            if (error) throw error;
            logSystemMessage("Full deck layout test triggered.");
        } catch (err) {
            console.error("Database update failed for layout test:", err);
            renderBoardLine(testSequence);
        }
    } else {
        renderBoardLine(testSequence);
    }
}

function resizeGame() {
    const gameBoard = document.getElementById("game-board-table");
    if (!gameBoard) return;
    const baseW = 1536;
    const baseH = 729;
    const scale = Math.min(window.innerWidth / baseW, window.innerHeight / baseH);
    gameBoard.style.transform = `scale(${scale})`;
    gameBoard.style.transformOrigin = "top left";
    
    const leftOffset = (window.innerWidth - baseW * scale) / 2;
    const topOffset = (window.innerHeight - baseH * scale) / 2;
    gameBoard.style.left = `${leftOffset}px`;
    gameBoard.style.top = `${topOffset}px`;
}
window.addEventListener('resize', resizeGame);