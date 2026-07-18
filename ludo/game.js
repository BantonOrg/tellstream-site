import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://vegwferwmyuunwvfqpsf.supabase.co",       
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZ3dmZXJ3bXl1dW53dmZxcHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzODU5NDQsImV4cCI6MjA5Nzk2MTk0NH0.7F3HUEY59BGE5phlD9AukhZzRa3Ied_ZT43j8YZeIy8"   
);

let roomCode = null;
let roomSubscription = null;
let playerColor = null; 
let myUsername = null;
let isHost = false;
let state = null;
let currentTurnColor = null;
let currentRoll = null;
let hasRolledThisTurn = false;
let soundOn = false;
let turnTimerInterval = null;
const TURN_TIMEOUT_SECONDS = 30;

let isProcessing = false;
let localTokenPositions = null;
let currentTurnNumber = 0;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const COLORS = ["red", "green", "yellow", "blue"];

const COMMON_TRACK = [
  {x:6, y:5}, {x:6, y:4}, {x:6, y:3}, {x:6, y:2}, {x:6, y:1}, {x:6, y:0},
  {x:7, y:0},
  {x:8, y:0}, {x:8, y:1}, {x:8, y:2}, {x:8, y:3}, {x:8, y:4}, {x:8, y:5},
  {x:9, y:6}, {x:10, y:6}, {x:11, y:6}, {x:12, y:6}, {x:13, y:6}, {x:14, y:6},
  {x:14, y:7},
  {x:14, y:8}, {x:13, y:8}, {x:12, y:8}, {x:11, y:8}, {x:10, y:8}, {x:9, y:8},
  {x:8, y:9}, {x:8, y:10}, {x:8, y:11}, {x:8, y:12}, {x:8, y:13}, {x:8, y:14},
  {x:7, y:14},
  {x:6, y:14}, {x:6, y:13}, {x:6, y:12}, {x:6, y:11}, {x:6, y:10}, {x:6, y:9},
  {x:5, y:8}, {x:4, y:8}, {x:3, y:8}, {x:2, y:8}, {x:1, y:8}, {x:0, y:8},
  {x:0, y:7},
  {x:0, y:6}, {x:1, y:6}, {x:2, y:6}, {x:3, y:6}, {x:4, y:6}, {x:5, y:6}
];

const COLOR_MAPS = {
  green: {
    startTrackIdx: 47, homeStartIdx: 50,
    homeCoords: [{x:1,y:7}, {x:2,y:7}, {x:3,y:7}, {x:4,y:7}, {x:5,y:7}, {x:6,y:7}],
    yard: [{x:0,y:4}, {x:1,y:4}, {x:0,y:5}, {x:1,y:5}]
  },
  yellow: {
    startTrackIdx: 8, homeStartIdx: 50,
    homeCoords: [{x:7,y:1}, {x:7,y:2}, {x:7,y:3}, {x:7,y:4}, {x:7,y:5}, {x:7,y:6}],
    yard: [{x:9,y:1}, {x:10,y:1}, {x:9,y:2}, {x:10,y:2}]
  },
  blue: {
    startTrackIdx: 21, homeStartIdx: 50,
    homeCoords: [{x:13,y:7}, {x:12,y:7}, {x:11,y:7}, {x:10,y:7}, {x:9,y:7}, {x:8,y:7}],
    yard: [{x:13,y:9}, {x:14,y:9}, {x:13,y:10}, {x:14,y:10}]
  },
  red: {
    startTrackIdx: 34, homeStartIdx: 50,
    homeCoords: [{x:7,y:13}, {x:7,y:12}, {x:7,y:11}, {x:7,y:10}, {x:7,y:9}, {x:7,y:8}],
    yard: [{x:4,y:13}, {x:5,y:13}, {x:4,y:14}, {x:5,y:14}]
  }
};

const board = document.getElementById("board");
const lobbyView = document.getElementById("lobby-view");
const seatingView = document.getElementById("seating-view");
const gameScreen = document.getElementById("gameScreen");

const usernameInput = document.getElementById("username-input");
const maxPlayersSelect = document.getElementById("max-players-select");
const themeSelect = document.getElementById("themeSelect");
const soundToggle = document.getElementById("soundToggle");
const createBtn = document.getElementById("createBtn");
const joinCodeInput = document.getElementById("joinCode");
const joinBtn = document.getElementById("joinBtn");

const lobbyChatMessages = document.getElementById("lobby-chat-messages");
const lobbyChatInput = document.getElementById("lobby-chat-input");
const sendLobbyChatBtn = document.getElementById("send-lobby-chat-btn");

const seatingRoomCodeDisplay = document.getElementById("seating-room-code-display");
const seatingVariantDisplay = document.getElementById("seating-variant-display");
const leaveRoomBtnSeating = document.getElementById("leave-room-btn-seating");
const startGameBtn = document.getElementById("start-game-btn");
const rosterList = document.getElementById("roster-list");

const roomChatMessages = document.getElementById("room-chat-messages");
const roomChatInput = document.getElementById("room-chat-input");
const sendChatBtn = document.getElementById("send-chat-btn");

const localSoundToggle = document.getElementById("localSoundToggle");
const localThemeSelect = document.getElementById("localThemeSelect");
const optionsBtn = document.getElementById("optionsBtn");
const dropdownContent = document.querySelector(".dropdownContent");

const exitLudoBtn = document.getElementById("exitLudoBtn");

// Options toggle setup
if (optionsBtn && dropdownContent) {
    optionsBtn.onclick = (e) => {
        e.stopPropagation();
        dropdownContent.style.display = dropdownContent.style.display === "flex" ? "none" : "flex";
    };
    dropdownContent.onclick = (e) => {
        e.stopPropagation();
    };
    window.onclick = () => {
        dropdownContent.style.display = "none";
    };
}
if (localSoundToggle) {
    localSoundToggle.onchange = () => {
        soundOn = localSoundToggle.checked;
        if (soundToggle) soundToggle.checked = soundOn;
    };
}
if (localThemeSelect) {
    localThemeSelect.onchange = () => {
        const theme = localThemeSelect.value;
        window.localStorage.setItem('ludo_local_theme', theme);
        board.className = "";
        board.classList.add(`theme-${theme}`);
        if (themeSelect) themeSelect.value = theme;
    };
}

// 1. Identity Display Name Setup
if (usernameInput) {
    const savedUser = window.localStorage.getItem('tellstream_active_user') || window.localStorage.getItem('ludo_username');
    if (savedUser) {
        myUsername = savedUser;
    } else {
        myUsername = "User_" + Math.floor(1000 + Math.random() * 9000);
    }
    usernameInput.value = myUsername;
    
    usernameInput.oninput = () => {
        const val = usernameInput.value.trim();
        if (val.length > 0) {
            myUsername = val;
            window.localStorage.setItem('ludo_username', myUsername);
            if (roomCode) {
                updateUsernameInRoom();
            }
        }
    };
}

// 2. Global Lounge Chat syncing
async function loadGlobalChat() {
    try {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .order('id', { ascending: true })
            .limit(40);
            
        if (data) {
            if (lobbyChatMessages) lobbyChatMessages.innerHTML = "";
            if (roomChatMessages) roomChatMessages.innerHTML = "";
            data.forEach(msg => displayGlobalChatMessage(msg));
        }
    } catch (e) {
        console.error("Failed to load global chat:", e);
    }
}

function subscribeToGlobalChat() {
    supabase.channel('public:messages')
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
        await supabase.from('messages').insert([{ username: myUsername, message: text }]);
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
    if (roomChatMessages) {
        const row = document.createElement("div");
        row.className = "chat-msg-row";
        row.innerHTML = `<span class="chat-msg-user">${escapeHtml(data.username)}:</span> <span class="chat-msg-text">${escapeHtml(data.message)}</span>`;
        roomChatMessages.appendChild(row);
        roomChatMessages.scrollTop = roomChatMessages.scrollHeight;
    }
}

function escapeHtml(text) {
    if (!text) return "";
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Bind chat elements
if (sendLobbyChatBtn && lobbyChatInput) {
    sendLobbyChatBtn.onclick = () => sendGlobalChatMessage(lobbyChatInput);
    lobbyChatInput.onkeydown = (e) => { if (e.key === "Enter") sendGlobalChatMessage(lobbyChatInput); };
}
if (sendChatBtn && roomChatInput) {
    sendChatBtn.onclick = () => sendGlobalChatMessage(roomChatInput);
    roomChatInput.onkeydown = (e) => { if (e.key === "Enter") sendGlobalChatMessage(roomChatInput); };
}

// Initialize chat on load
loadGlobalChat();
subscribeToGlobalChat();

function genCode() { return Math.random().toString(36).substring(2,6).toUpperCase(); }

async function getLoggedInUser() {
  const savedUser = window.localStorage.getItem('tellstream_active_user') || window.localStorage.getItem('ludo_username');
  if (savedUser) {
    return savedUser;
  }
  return "User_" + Math.floor(Math.random() * 1000);
}

// HOST CREATION LOOP
createBtn.onclick = async () => {
  myUsername = await getLoggedInUser();
  roomCode = genCode();
  isHost = true;
  playerColor = "red"; 
  
  const maxPlayers = parseInt(maxPlayersSelect.value);
  const theme = themeSelect.value;
  const sound = soundToggle.checked;
  soundOn = sound;
  if (localSoundToggle) localSoundToggle.checked = sound;
  if (localThemeSelect) {
      localThemeSelect.value = theme;
      board.className = "";
      board.classList.add(`theme-${theme}`);
  }

  const playersObj = {
      creator: myUsername,
      lobby_roster: [myUsername],
      settings: {
          max_players: maxPlayers,
          theme: theme,
          sound: sound
      },
      red: myUsername,
      green: "Waiting...",
      yellow: maxPlayers >= 3 ? "Waiting..." : "Not In Use",
      blue: maxPlayers >= 4 ? "Waiting..." : "Not In Use"
  };

  enterRoom(roomCode);
  
  const { error } = await supabase.from("lud_room").insert({
    room_code: roomCode,
    game_state: "waiting",
    players: playersObj,
    connected_spectators: [],
    turn: 0,
    state: defaultState()
  });

  if (error) console.error("Error creating room:", error);
};

// GUEST JOINING LOOP
joinBtn.onclick = async () => {
  const inputCode = joinCodeInput.value.trim().toUpperCase();
  if (!inputCode || inputCode.length !== 4) return alert("Enter a valid 4-letter room code");
  
  myUsername = await getLoggedInUser();
  
  const { data, error } = await supabase.from("lud_room").select("*").eq("room_code", inputCode).single();
  if (!data || error) return alert("Room not found");

  roomCode = inputCode;
  isHost = false;

  const playersObj = data.players || {};
  if (!playersObj.lobby_roster) playersObj.lobby_roster = [];
  if (!playersObj.lobby_roster.includes(myUsername)) {
      playersObj.lobby_roster.push(myUsername);
  }

  // Update room roster
  await supabase.from("lud_room").update({ players: playersObj }).eq("room_code", roomCode);

  enterRoom(roomCode);
};

function defaultState() {
  return {
    tokens: { red: [-1,-1,-1,-1], green: [-1,-1,-1,-1], yellow: [-1,-1,-1,-1], blue: [-1,-1,-1,-1] },
    currentRoll: null,
    hasRolled: false,
    lastTurnTimestamp: Date.now()
  };
}

function enterRoom(code) {
  window.localStorage.setItem('tellstream_active_game', 'ludo');
  roomCode = code;
  seatingRoomCodeDisplay.textContent = code;
  document.getElementById("roomDisplay").textContent = code;
  
  listenRoom();
  showView(seatingView);
}

function showView(view) {
    lobbyView.classList.add("hidden-layout");
    seatingView.classList.add("hidden-layout");
    gameScreen.classList.add("hidden-layout");
    
    view.classList.remove("hidden-layout");
}

function listenRoom() {
  if (roomSubscription) {
    supabase.removeChannel(roomSubscription);
    roomSubscription = null;
  }
  
  roomSubscription = supabase.channel("room-" + roomCode);
  
  roomSubscription
    .on("postgres_changes", { event: "*", schema: "public", table: "lud_room", filter: `room_code=eq.${roomCode}` }, payload => {
      if (payload.new) handleStateUpdate(payload.new);
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        const { data } = await supabase.from("lud_room").select("*").eq("room_code", roomCode).single();
        if (data) handleStateUpdate(data);
      }
    });
}

// Exit room/leave mechanics
async function leaveRoom() {
    if (!roomCode) return;
    window.localStorage.removeItem('tellstream_active_game');
    
    const exitingRoomCode = roomCode;
    
    if (roomSubscription) {
        supabase.removeChannel(roomSubscription);
        roomSubscription = null;
    }
    
    try {
        const { data } = await supabase.from("lud_room").select("*").eq("room_code", exitingRoomCode).single();
        if (data) {
            const playersObj = data.players || {};
            if (playersObj.lobby_roster) {
                playersObj.lobby_roster = playersObj.lobby_roster.filter(u => u !== myUsername);
            }
            COLORS.forEach(color => {
                if (playersObj[color] === myUsername) {
                    playersObj[color] = "Waiting...";
                }
            });
            await supabase.from("lud_room").update({ players: playersObj }).eq("room_code", exitingRoomCode);
        }
    } catch (e) {
        console.error("Failed to leave room:", e);
    }
    
    roomCode = null;
    playerColor = null;
    isHost = false;
    showView(lobbyView);
}

if (leaveRoomBtnSeating) leaveRoomBtnSeating.onclick = leaveRoom;
if (exitLudoBtn) exitLudoBtn.onclick = leaveRoom;

async function updateUsernameInRoom() {
    if (!roomCode) return;
    try {
        const { data } = await supabase.from("lud_room").select("*").eq("room_code", roomCode).single();
        if (data) {
            const playersObj = data.players || {};
            if (playersObj.lobby_roster) {
                playersObj.lobby_roster = playersObj.lobby_roster.map(n => n.startsWith("User_") ? myUsername : n);
                if (!playersObj.lobby_roster.includes(myUsername)) {
                    playersObj.lobby_roster.push(myUsername);
                }
            }
            COLORS.forEach(color => {
                if (playersObj[color] === myUsername) {
                    playersObj[color] = myUsername;
                }
            });
            await supabase.from("lud_room").update({ players: playersObj }).eq("room_code", roomCode);
        }
    } catch (e) {
        console.error("Failed to update name in room:", e);
    }
}

// Toggle seating by clicking on roster items
async function toggleSeating(username) {
    if (!roomCode) return;
    try {
        const { data } = await supabase.from("lud_room").select("*").eq("room_code", roomCode).single();
        if (data) {
            const playersObj = data.players || {};
            if (playersObj.creator !== myUsername) return; // Only host can manage seats
            if (username === playersObj.creator) return; // Creator cannot be unseated/reseated from RED
            
            let seatedColor = null;
            COLORS.forEach(color => {
                if (playersObj[color] === username) {
                    seatedColor = color;
                }
            });
            
            if (seatedColor) {
                playersObj[seatedColor] = "Waiting...";
            } else {
                let emptyColor = null;
                for (let i = 0; i < COLORS.length; i++) {
                    const color = COLORS[i];
                    if (playersObj[color] === "Waiting...") {
                        emptyColor = color;
                        break;
                    }
                }
                if (emptyColor) {
                    playersObj[emptyColor] = username;
                } else {
                    alert("All active game seats are currently full!");
                    return;
                }
            }
            await supabase.from("lud_room").update({ players: playersObj }).eq("room_code", roomCode);
        }
    } catch (e) {
        console.error("Failed to toggle seating:", e);
    }
}

async function launchMatch() {
    if (!roomCode) return;
    await supabase.from("lud_room").update({
        game_state: "playing",
        state: defaultState()
    }).eq("room_code", roomCode);
}

if (startGameBtn) startGameBtn.onclick = launchMatch;

async function runMovementAnimation(movedColor, tokenIdx, targetPos, finalRoomData) {
  isProcessing = true;
  try {
    const startPos = localTokenPositions[movedColor][tokenIdx];

  // Walk step by step
  if (startPos === -1) {
    localTokenPositions[movedColor][tokenIdx] = 0;
    render();
    if (soundOn) playSound("move");
    await delay(250);
  } else {
    let cur = startPos;
    while (cur < targetPos) {
      cur++;
      localTokenPositions[movedColor][tokenIdx] = cur;
      render();
      if (soundOn) playSound("move");
      await delay(250);
    }
  }

  // Check if any token was captured
  let captured = false;
  COLORS.forEach(c => {
    for (let i = 0; i < 4; i++) {
      if (finalRoomData.state.tokens[c][i] === -1 && localTokenPositions[c][i] >= 0) {
        captured = true;
      }
    }
  });

  if (captured && soundOn) {
    playSound("capture");
  }

  localTokenPositions = {
      red: [...finalRoomData.state.tokens.red],
      green: [...finalRoomData.state.tokens.green],
      yellow: [...finalRoomData.state.tokens.yellow],
      blue: [...finalRoomData.state.tokens.blue]
    };
  } catch (err) {
    console.error("Error in movement animation:", err);
  } finally {
    isProcessing = false;
    handleStateUpdate(finalRoomData);
  }
}

function handleStateUpdate(roomData) {
  if (!roomCode || roomData.room_code !== roomCode) return;
  currentTurnNumber = roomData.turn;

  // Animation check
  let animated = false;
  if (localTokenPositions && (roomData.game_state === "playing" || roomData.game_state === "finished") && roomData.state && roomData.state.tokens) {
    for (let c of COLORS) {
      for (let i = 0; i < 4; i++) {
        const oldPos = localTokenPositions[c][i];
        const newPos = roomData.state.tokens[c][i];
        if (newPos > oldPos) {
          animated = true;
          state = roomData.state;
          const playersObj = roomData.players || {};
          const localTheme = window.localStorage.getItem('ludo_local_theme');
          const theme = localTheme || playersObj.settings?.theme || "classic";
          const sound = playersObj.settings?.sound ?? true;
          soundOn = sound;
          if (localSoundToggle) localSoundToggle.checked = sound;
          board.className = "";
          board.classList.add(`theme-${theme}`);
          if (localThemeSelect) localThemeSelect.value = theme;
          playerColor = null;
          COLORS.forEach(color => {
            if (playersObj[color] === myUsername) playerColor = color;
          });
          const joinedColors = COLORS.filter(color => playersObj[color] && playersObj[color] !== "Waiting..." && playersObj[color] !== "Not In Use");
          const activeSeatsCount = joinedColors.length;
          currentTurnColor = activeSeatsCount > 0 ? joinedColors[roomData.turn % activeSeatsCount] : "red";
          currentRoll = state.currentRoll;
          hasRolledThisTurn = state.hasRolled;
          showView(gameScreen);

          runMovementAnimation(c, i, newPos, roomData);
          break;
        }
      }
      if (animated) break;
    }
  }

  if (animated) return;

  if (roomData.game_state === "finished") {
      showView(gameScreen);
      const playersObj = roomData.players || {};
      const winnerColor = (roomData.state && roomData.state.winner) ? roomData.state.winner : "red";
      const winnerName = playersObj[winnerColor] || winnerColor;
      showWinnerAnnounce(winnerName);
      return;
  }

  localTokenPositions = roomData.state ? {
    red: [...roomData.state.tokens.red],
    green: [...roomData.state.tokens.green],
    yellow: [...roomData.state.tokens.yellow],
    blue: [...roomData.state.tokens.blue]
  } : null;

  const playersObj = roomData.players || {};
  const maxPlayers = playersObj.settings?.max_players || 4;
  const localTheme = window.localStorage.getItem('ludo_local_theme');
  const theme = localTheme || playersObj.settings?.theme || "classic";
  const sound = playersObj.settings?.sound ?? true;
  
  soundOn = sound;
  if (localSoundToggle) localSoundToggle.checked = sound;
  board.className = "";
  board.classList.add(`theme-${theme}`);
  if (localThemeSelect) localThemeSelect.value = theme;

  playerColor = null;
  COLORS.forEach(color => {
    if (playersObj[color] === myUsername) playerColor = color;
  });

  if (roomData.game_state === "waiting") {
      showView(seatingView);
      seatingVariantDisplay.textContent = theme === "classic" ? "Classic Table" : "Futuristic Board";
      
      const isCreator = (playersObj.creator === myUsername);
      
      // Update Seating cards UI
      COLORS.forEach(color => {
          const card = document.getElementById(`seat-card-${color}`);
          const nameEl = document.getElementById(`seat-player-${color}`);
          if (!card || !nameEl) return;
          
          const val = playersObj[color];
          if (val === "Not In Use") {
              card.style.display = "none";
          } else {
              card.style.display = "flex";
              nameEl.textContent = val;
              if (val === "Waiting...") {
                  card.classList.remove("claimed");
              } else {
                  card.classList.add("claimed");
              }
          }
      });
      
      // Update Roster Roster
      rosterList.innerHTML = "";
      const roster = playersObj.lobby_roster || [];
      
      const helperText = document.getElementById("roster-helper-text");
      if (helperText) {
          helperText.style.display = isCreator ? "block" : "none";
      }
      
      roster.forEach(user => {
          const li = document.createElement("li");
          let seatedColor = null;
          COLORS.forEach(color => {
              if (playersObj[color] === user) seatedColor = color;
          });
          
          if (seatedColor) {
              li.innerHTML = `<span>${escapeHtml(user)}</span> <span class="table-badge" style="margin-left: 10px; text-transform: uppercase;">${seatedColor}</span>`;
              li.classList.add("seated-player-item");
          } else {
              li.textContent = user;
          }
          
          if (isCreator && user !== playersObj.creator) {
              li.style.cursor = "pointer";
              li.title = "Click to add or remove player from game";
              li.addEventListener("click", () => toggleSeating(user));
          }
          rosterList.appendChild(li);
      });
      
      // Enable/Disable Start Game
      if (startGameBtn) {
          if (isCreator) {
              startGameBtn.style.display = "block";
              // Check if all active seats are claimed
              let allClaimed = true;
              COLORS.forEach(color => {
                  if (playersObj[color] === "Waiting...") {
                      allClaimed = false;
                  }
              });
              startGameBtn.disabled = !allClaimed;
          } else {
              startGameBtn.style.display = "none";
          }
      }
      return;
  } else {
      showView(gameScreen);
  }

  const joinedColors = COLORS.filter(color => playersObj[color] && playersObj[color] !== "Waiting..." && playersObj[color] !== "Not In Use");
  const activeSeatsCount = joinedColors.length;
  
  currentTurnColor = activeSeatsCount > 0 ? joinedColors[roomData.turn % activeSeatsCount] : "red";
  currentRoll = state.currentRoll;
  hasRolledThisTurn = state.hasRolled;
  
  COLORS.forEach(color => {
    const el = document.getElementById(`details-${color}`);
    if (!el) return;
    
    const isSeated = playersObj[color] && playersObj[color] !== "Waiting..." && playersObj[color] !== "Not In Use";
    let statusText = `${color.toUpperCase()}: ${isSeated ? playersObj[color].toUpperCase() : "EMPTY"}`;
    if (isSeated && color === currentTurnColor) {
      const elapsed = Math.floor((Date.now() - state.lastTurnTimestamp) / 1000);
      const remaining = Math.max(0, TURN_TIMEOUT_SECONDS - elapsed);
      statusText = `${color.toUpperCase()}'S TURN (${remaining}s)`;
    }
    
    if (color === "yellow") {
      el.querySelector("span").innerText = statusText;
    } else {
      el.innerText = statusText;
    }
  });

  if (activeSeatsCount > 1) {
    startTurnTimer();
  } else {
    clearInterval(turnTimerInterval);
  }
  render();
}

function startTurnTimer() {
  clearInterval(turnTimerInterval);
  if (!state || !state.lastTurnTimestamp) return;

  turnTimerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - state.lastTurnTimestamp) / 1000);
    const remaining = Math.max(0, TURN_TIMEOUT_SECONDS - elapsed);

    COLORS.forEach(color => {
      if (color === currentTurnColor) {
        const el = document.getElementById(`details-${color}`);
        if (!el) return;
        const txt = `${color.toUpperCase()}'S TURN (${remaining}s)`;
        if (color === "yellow") el.querySelector("span").innerText = txt;
        else el.innerText = txt;
      }
    });

    if (remaining <= 0 && playerColor === currentTurnColor) {
      clearInterval(turnTimerInterval);
      passTurn(false);
    }
  }, 1000);
}

async function handleDiceRoll() {
  if (isProcessing) return;
  if (playerColor !== currentTurnColor) return;
  if (hasRolledThisTurn) return;

  const roll = Math.floor(Math.random() * 6) + 1;
  if(soundOn) playSound("roll");

  state.currentRoll = roll;
  state.hasRolled = true;

  if (!hasValidMoves(playerColor, roll)) {
    isProcessing = true;
    setTimeout(async () => {
      try {
        await passTurn(roll === 6);
      } catch (err) {
        console.error("Error passing turn:", err);
      } finally {
        isProcessing = false;
      }
    }, 1500);
  }
  await updateDatabaseState();
}

function hasValidMoves(color, roll) {
  return state.tokens[color].some((pos, idx) => isValidMove(color, idx, roll));
}

function isValidMove(color, tokenIdx, roll) {
  const pos = state.tokens[color][tokenIdx];
  if (pos === -1 && roll !== 6) return false;
  if (pos >= 0 && pos + roll > 57) return false;
  return true;
}

async function selectTokenToMove(tokenIdx) {
  if (isProcessing) return;
  if (playerColor !== currentTurnColor || !hasRolledThisTurn) return;
  if (!isValidMove(playerColor, tokenIdx, currentRoll)) return;

  isProcessing = true;
  try {
    let currentPos = state.tokens[playerColor][tokenIdx];
    if (currentPos === -1 && currentRoll === 6) {
      state.tokens[playerColor][tokenIdx] = 0;
    } else {
      state.tokens[playerColor][tokenIdx] += currentRoll;
    }

    checkCaptures(playerColor, tokenIdx);
    
    const hasWon = state.tokens[playerColor].every(pos => pos === 57);
    if (hasWon) {
      state.currentRoll = null;
      state.hasRolled = false;
      state.winner = playerColor;
      await supabase.from("lud_room").update({
        game_state: "finished",
        state: state
      }).eq("room_code", roomCode);
    } else {
      await passTurn(currentRoll === 6);
    }
  } catch (err) {
    console.error("Error moving token:", err);
    isProcessing = false;
  }
}

function checkCaptures(movingColor, movingIdx) {
  const currentPos = state.tokens[movingColor][movingIdx];
  if (currentPos === -1 || currentPos > 51) return;

  const map = COLOR_MAPS[movingColor];
  const absoluteTrackIndex = (map.startTrackIdx + currentPos) % 52;

  const SAFE_TRACK_INDICES = [2, 8, 15, 21, 28, 34, 41, 47];
  if (SAFE_TRACK_INDICES.includes(absoluteTrackIndex)) return;

  const targetCoords = getTokenGridCoords(movingColor, currentPos, movingIdx);

  COLORS.forEach(color => {
    if (color === movingColor) return;
    state.tokens[color].forEach((pos, idx) => {
      if (pos >= 0 && pos <= 51) {
        const otherCoords = getTokenGridCoords(color, pos, idx);
        if (otherCoords.x === targetCoords.x && otherCoords.y === targetCoords.y) {
          state.tokens[color][idx] = -1;
          if (soundOn) playSound("capture");
        }
      }
    });
  });
}

async function passTurn(getsBonusRoll) {
  let nextTurn = currentTurnNumber;
  if (!getsBonusRoll) nextTurn += 1;

  state.currentRoll = null;
  state.hasRolled = false;
  state.lastTurnTimestamp = Date.now();

  await supabase.from("lud_room").update({ state: state, turn: nextTurn }).eq("room_code", roomCode);
}

async function updateDatabaseState() {
  await supabase.from("lud_room").update({ state }).eq("room_code", roomCode);
}

function getTokenGridCoords(color, pos, tokenIdx) {
  const map = COLOR_MAPS[color];
  if (pos === -1) return map.yard[tokenIdx];
  if (pos === 57) return {x: 7, y: 7};

  if (pos > map.homeStartIdx) {
    const homeStep = pos - (map.homeStartIdx + 1);
    return map.homeCoords[homeStep];
  }

  const absoluteTrackIndex = (map.startTrackIdx + pos) % 52;
  return COMMON_TRACK[absoluteTrackIndex];
}

function render() {
  board.querySelectorAll('.token').forEach(el => el.remove());
  const controlsContainer = document.getElementById("yard-controls-container");
  controlsContainer.innerHTML = "";

  COLORS.forEach(color => {
    const rollBox = document.createElement("div");
    rollBox.className = `yard-control roll ${color}`;
    
    if (color === currentTurnColor) {
      const rollButton = document.createElement("button");
      rollButton.className = "yard-roll-btn";
      rollButton.innerText = playerColor === currentTurnColor ? "ROLL" : "DICE";
      rollButton.disabled = (playerColor !== currentTurnColor || hasRolledThisTurn);
      rollButton.onclick = handleDiceRoll;
      rollBox.appendChild(rollButton);
    }
    controlsContainer.appendChild(rollBox);

    const diceBox = document.createElement("div");
    diceBox.className = `yard-control dice ${color}`;
    
    if (color === currentTurnColor) {
      const diceDisplay = document.createElement("div");
      diceDisplay.className = "yard-dice-view";
      const diceEmojis = ["🎲", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
      diceDisplay.innerText = currentRoll ? diceEmojis[currentRoll] : "🎲";
      diceBox.appendChild(diceDisplay);
    }
    controlsContainer.appendChild(diceBox);
  });

  const coordinateGroups = {};
  const tokensToRender = [];
  const positionsToUse = localTokenPositions || state.tokens;

  COLORS.forEach(c => {
    positionsToUse[c].forEach((pos, idx) => {
      const coords = getTokenGridCoords(c, pos, idx);
      const coordKey = `${coords.x},${coords.y}`;
      
      if (!coordinateGroups[coordKey]) coordinateGroups[coordKey] = [];
      
      const tokenData = { color: c, index: idx, pos: pos, coords: coords, coordKey: coordKey };
      coordinateGroups[coordKey].push(tokenData);
      tokensToRender.push(tokenData);
    });
  });

  tokensToRender.forEach(token => {
    const tokenEl = document.createElement("div");
    tokenEl.className = `token ${token.color}`;
    
    tokenEl.style.gridColumnStart = token.coords.x + 1;
    tokenEl.style.gridRowStart = token.coords.y + 1;

    let transformString = "";
    const sharedOccupants = coordinateGroups[token.coordKey];
    
    if (sharedOccupants.length > 1) {
      const occupantIndex = sharedOccupants.indexOf(token);
      const totalOccupants = sharedOccupants.length;
      const angle = (occupantIndex / totalOccupants) * 2 * Math.PI;
      const radius = 5; 
      transformString = `translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius}px) scale(0.75)`;
    }
    tokenEl.style.transform = transformString;

    if (!isProcessing && token.color === playerColor && currentTurnColor === playerColor && hasRolledThisTurn && isValidMove(token.color, token.index, currentRoll)) {
      tokenEl.classList.add("movable");
      tokenEl.onclick = () => selectTokenToMove(token.index);
    }
    board.appendChild(tokenEl);
  });
}

function playSound(name) {
  let a = new Audio(`assets/sfx/${name}.mp3`);
  a.play().catch(()=>{});
}

function showWinnerAnnounce(winnerName) {
  let overlay = document.getElementById("winner-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "winner-overlay";
    overlay.style = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(10px);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
    `;
    overlay.innerHTML = `
      <h1 style="font-size: 3rem; color: #22e532; text-shadow: 0 0 20px rgba(34,229,50,0.5); font-family: 'Space Grotesk', sans-serif;">🏆 GAME OVER 🏆</h1>
      <p style="font-size: 1.5rem; color: white;" id="winner-name-display"></p>
      <button onclick="location.reload()" class="btn primary-btn" style="padding: 10px 20px; font-size: 1rem; border-radius: 8px; font-family: 'Space Grotesk', sans-serif; cursor: pointer;">Back to Lobby</button>
    `;
    document.body.appendChild(overlay);
  }
  document.getElementById("winner-name-display").innerText = `🎉 ${winnerName.toUpperCase()} HAS WON THE GAME! 🎉`;
}

window.simulateLudoTestState = async () => {
  if (!roomCode || !playerColor) {
    alert("Please join or create a game room first!");
    return;
  }
  state.tokens[playerColor] = [57, 57, 57, 50];
  state.currentRoll = null;
  state.hasRolled = false;
  await supabase.from("lud_room").update({ state }).eq("room_code", roomCode);
  alert("Ludo test state set successfully!\n- 3 tokens at Goal (57)\n- 1 token at chevron entrance (50)\n\nRoll the dice to walk the last token home!");
};

if (window.parent) {
  window.parent.simulateLudoTestState = window.simulateLudoTestState;
}
