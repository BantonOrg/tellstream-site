import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://vegwferwmyuunwvfqpsf.supabase.co",       
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZ3dmZXJ3bXl1dW53dmZxcHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzODU5NDQsImV4cCI6MjA5Nzk2MTk0NH0.7F3HUEY59BGE5phlD9AukhZzRa3Ied_ZT43j8YZeIy8"   
);

let roomCode = null;
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
    homeCoords: [{x:7,y:1}, {x:7,y:2}, {x:7,y:3}, {x:7,y:4}, {x:7,y:5}, {x:7,y:6}],
    yard: [{x:0,y:4}, {x:1,y:4}, {x:0,y:5}, {x:1,y:5}]
  },
  yellow: {
    startTrackIdx: 8, homeStartIdx: 50,
    homeCoords: [{x:13,y:7}, {x:12,y:7}, {x:11,y:7}, {x:10,y:7}, {x:9,y:7}, {x:8,y:7}],
    yard: [{x:9,y:1}, {x:10,y:1}, {x:9,y:2}, {x:10,y:2}]
  },
  blue: {
    startTrackIdx: 21, homeStartIdx: 50,
    homeCoords: [{x:7,y:13}, {x:7,y:12}, {x:7,y:11}, {x:7,y:10}, {x:7,y:9}, {x:7,y:8}],
    yard: [{x:13,y:9}, {x:14,y:9}, {x:13,y:10}, {x:14,y:10}]
  },
  red: {
    startTrackIdx: 34, homeStartIdx: 50,
    homeCoords: [{x:1,y:7}, {x:2,y:7}, {x:3,y:7}, {x:4,y:7}, {x:5,y:7}, {x:6,y:7}],
    yard: [{x:4,y:12}, {x:5,y:12}, {x:4,y:13}, {x:5,y:13}]
  }
};

const board = document.getElementById("board");
const menuScreen = document.getElementById("menuScreen");
const gameScreen = document.getElementById("gameScreen");
const soundToggle = document.getElementById("soundToggle");
const themeSelect = document.getElementById("themeSelect");
const optionsBtn = document.getElementById("optionsBtn");
const dropdownContent = document.querySelector(".dropdownContent");

soundToggle.onchange = () => soundOn = soundToggle.checked;
themeSelect.onchange = () => { board.className = ""; board.classList.add(`theme-${themeSelect.value}`); };
optionsBtn.onclick = (e) => { e.stopPropagation(); dropdownContent.classList.toggle("show"); };
window.onclick = () => dropdownContent.classList.remove("show");

const exitLudoBtn = document.getElementById("exitLudoBtn");
if (exitLudoBtn) {
  exitLudoBtn.onclick = async () => {
    if (roomCode) {
      try {
        const { data } = await supabase.from("lud_room").select("*").eq("room_code", roomCode).single();
        if (data) {
          let currentPlayers = { ...data.players };
          let currentSpectators = (data.connected_spectators || []).filter(name => name !== myUsername);
          
          Object.keys(currentPlayers).forEach(color => {
            if (currentPlayers[color] === myUsername) delete currentPlayers[color];
          });

          await supabase.from("lud_room").update({
            players: currentPlayers,
            connected_spectators: currentSpectators
          }).eq("room_code", roomCode);
        }
      } catch(e) {
        console.error(e);
      }
    }
    window.localStorage.removeItem('tellstream_active_game');
    if (window.parent && typeof window.parent.closeFullscreenGame === 'function') {
      window.parent.closeFullscreenGame();
    } else {
      window.location.reload();
    }
  };
}

function genCode() { return Math.random().toString(36).substring(2,6).toUpperCase(); }

async function getLoggedInUser() {
  const savedUser = window.localStorage.getItem('tellstream_active_user');
  if (savedUser) {
    return savedUser;
  }
  return "User_" + Math.floor(Math.random() * 1000);
}

// HOST CREATION LOOP
document.getElementById("createBtn").onclick = async () => {
  myUsername = await getLoggedInUser();
  roomCode = genCode();
  isHost = true;
  playerColor = "red"; 
  
  const initialPlayersObj = {};
  initialPlayersObj[playerColor] = myUsername;

  enterGame();
  
  const { error } = await supabase.from("lud_room").insert({
    room_code: roomCode,
    game_state: "waiting",
    players: initialPlayersObj,
    connected_spectators: [],
    turn: 0,
    state: defaultState()
  });

  if (error) console.error("Error creating room:", error);
  listenRoom();
};

// GUEST JOINING LOOP
document.getElementById("joinBtn").onclick = async () => {
  const inputCode = document.getElementById("joinCode").value.toUpperCase();
  if (!inputCode || inputCode.length !== 4) return alert("Enter a valid 4-letter room code");
  
  myUsername = await getLoggedInUser();
  
  const { data, error } = await supabase.from("lud_room").select("*").eq("room_code", inputCode).single();
  if (!data || error) return alert("Room not found");

  roomCode = inputCode;
  isHost = false;

  let spectators = data.connected_spectators || [];
  let isSeated = Object.values(data.players).includes(myUsername);

  if (!spectators.includes(myUsername) && !isSeated) {
    spectators.push(myUsername);
    await supabase.from("lud_room").update({ connected_spectators: spectators }).eq("room_code", roomCode);
  }

  enterGame();
  listenRoom();
};

function defaultState() {
  return {
    tokens: { red: [-1,-1,-1,-1], green: [-1,-1,-1,-1], yellow: [-1,-1,-1,-1], blue: [-1,-1,-1,-1] },
    currentRoll: null,
    hasRolled: false,
    lastTurnTimestamp: Date.now()
  };
}

function enterGame() {
  window.localStorage.setItem('tellstream_active_game', 'ludo');
  menuScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  document.getElementById("roomDisplay").innerText = `ROOM: ${roomCode}`;
  renderLobbyOverlay();
}

function listenRoom() {
  supabase
    .channel("room-" + roomCode)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "lud_room", filter: `room_code=eq.${roomCode}` }, payload => {
      handleStateUpdate(payload.new);
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        const { data } = await supabase.from("lud_room").select("*").eq("room_code", roomCode).single();
        if (data) handleStateUpdate(data);
      }
    });
}

function renderLobbyOverlay() {
  let overlay = document.getElementById("lobby-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "lobby-overlay";
    overlay.style = "position: absolute; top:0; left:0; width:100%; height:100%; background:rgba(11,12,16,0.98); z-index:9999; display:flex; flex-direction:column; justify-content:center; align-items:center; color:#fff; font-family:sans-serif;";
    gameScreen.appendChild(overlay);
  }
}

async function assignSeat(spectatorName, selectedColor) {
  const { data } = await supabase.from("lud_room").select("*").eq("room_code", roomCode).single();
  if (!data) return;

  let currentPlayers = { ...data.players };
  let currentSpectators = (data.connected_spectators || []).filter(name => name !== spectatorName);

  Object.keys(currentPlayers).forEach(color => {
    if (currentPlayers[color] === spectatorName) delete currentPlayers[color];
  });

  currentPlayers[selectedColor] = spectatorName;

  await supabase.from("lud_room").update({
    players: currentPlayers,
    connected_spectators: currentSpectators
  }).eq("room_code", roomCode);
}

async function launchMatch() {
  await supabase.from("lud_room").update({
    game_state: "playing",
    state: {
      tokens: { red: [-1,-1,-1,-1], green: [-1,-1,-1,-1], yellow: [-1,-1,-1,-1], blue: [-1,-1,-1,-1] },
      currentRoll: null,
      hasRolled: false,
      lastTurnTimestamp: Date.now()
    }
  }).eq("room_code", roomCode);
}

function handleStateUpdate(roomData) {
  state = roomData.state;
  const playersObj = roomData.players || {};
  const spectators = roomData.connected_spectators || [];
  
  playerColor = null;
  Object.keys(playersObj).forEach(color => {
    if (playersObj[color] === myUsername) playerColor = color;
  });

  const overlay = document.getElementById("lobby-overlay");
  if (roomData.game_state === "waiting") {
    if (overlay) {
      overlay.style.display = "flex";
      let seatedLayout = "<h3>SEAT ASSIGNMENTS</h3><ul style='list-style:none; padding:0; width:280px;'>";
      COLORS.forEach(c => {
        seatedLayout += `<li style='padding:8px; margin:4px 0; background:#1f2833; border-left:5px solid ${c}; display:flex; justify-content:between;'>
          <span>${c.toUpperCase()}: <strong>${playersObj[c] || "EMPTY"}</strong></span>
        </li>`;
      });
      seatedLayout += "</ul>";

      let queueLayout = "<h3>WAITING POOL</h3><div style='width:280px; max-height:150px; overflow-y:auto;'>";
      if (spectators.length === 0) queueLayout += "<p style='color:#666; font-size:0.9rem;'>No pending connections...</p>";
      
      spectators.forEach(spec => {
        queueLayout += `<div style='background:#0b0c10; border:1px solid #1f2833; padding:8px; margin:4px 0; display:flex; justify-content:space-between; align-items:center;'>
          <span>${spec}</span>`;
        if (isHost) {
          queueLayout += `<select onchange="this.value ? window.assignSeat('${spec}', this.value) : null" style="background:#1f2833; color:#fff; border:1px solid #66fcf1; border-radius:4px; font-size:0.8rem; padding:2px;">
            <option value="">Seat...</option>
            ${COLORS.map(c => !playersObj[c] ? `<option value="${c}">${c}</option>` : '').join('')}
          </select>`;
        }
        queueLayout += `</div>`;
      });
      queueLayout += "</div>";

      let actionButton = "";
      if (isHost) {
        const structuralActiveCount = Object.keys(playersObj).length;
        actionButton = `<button id='startMatchBtn' ${structuralActiveCount < 2 ? 'disabled style="background:#333; cursor:not-allowed;"' : 'style="background:#66fcf1; color:#0b0c10;"'} style='margin-top:20px; padding:10px 24px; font-weight:bold; border:none; border-radius:4px; cursor:pointer;'>START MATCH</button>`;
      } else {
        actionButton = `<p style='color:#66fcf1; animation:pulse 1.5s infinite; font-size:0.9rem; margin-top:20px;'>Waiting for host to launch match...</p>`;
      }

      overlay.innerHTML = `
        <h2 style='color:#66fcf1; margin-bottom:5px;'>LUDO LOBBY</h2>
        <p style='margin:0 0 20px 0; color:#888;'>Room Code: <strong style='color:#fff;'>${roomCode}</strong></p>
        ${seatedLayout}
        ${queueLayout}
        ${actionButton}
      `;

      window.assignSeat = assignSeat;

      if (isHost) {
        document.getElementById("startMatchBtn").onclick = launchMatch;
      }
    }
    return; 
  } else {
    if (overlay) overlay.style.display = "none";
  }

  const joinedColors = Object.keys(playersObj);
  const activeSeatsCount = joinedColors.length;
  
  currentTurnColor = activeSeatsCount > 0 ? COLORS[roomData.turn % activeSeatsCount] : "red";
  currentRoll = state.currentRoll;
  hasRolledThisTurn = state.hasRolled;
  
  COLORS.forEach(color => {
    const el = document.getElementById(`details-${color}`);
    if (!el) return;
    
    const isSeated = !!playersObj[color];
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
  if (playerColor !== currentTurnColor) return;
  if (hasRolledThisTurn) return;

  const roll = Math.floor(Math.random() * 6) + 1;
  if(soundOn) playSound("roll");

  state.currentRoll = roll;
  state.hasRolled = true;

  if (!hasValidMoves(playerColor, roll)) {
    setTimeout(() => passTurn(roll === 6), 1500);
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
  if (playerColor !== currentTurnColor || !hasRolledThisTurn) return;
  if (!isValidMove(playerColor, tokenIdx, currentRoll)) return;

  if (soundOn) playSound("move");
  
  let currentPos = state.tokens[playerColor][tokenIdx];
  if (currentPos === -1 && currentRoll === 6) {
    state.tokens[playerColor][tokenIdx] = 0;
  } else {
    state.tokens[playerColor][tokenIdx] += currentRoll;
  }

  checkCaptures(playerColor, tokenIdx);
  await passTurn(currentRoll === 6);
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
  const { data } = await supabase.from("lud_room").select("*").eq("room_code", roomCode).single();
  let nextTurn = data.turn;
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

  COLORS.forEach(c => {
    state.tokens[c].forEach((pos, idx) => {
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

    if (token.color === playerColor && currentTurnColor === playerColor && hasRolledThisTurn && isValidMove(token.color, token.index, currentRoll)) {
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
