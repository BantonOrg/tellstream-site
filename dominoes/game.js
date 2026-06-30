// ==========================================================================
// Tellstream Dominoes - Game Board & Player Hand Rendering Layer
// ==========================================================================

// Track the currently highlighted tile in the player's hand
let selectedTileId = null;

// Fixed dimensions of table_bg.jpg to process percentage coordinate maps
const BG_NATIVE_WIDTH = 2560;
const BG_NATIVE_HEIGHT = 1440;

// Inner Neon Bounds Coordinates relative to image sizing constraints 
const BOUNDS_LEFT = 265;
const BOUNDS_TOP = 523;
const BOUNDS_RIGHT = 2219;
const BOUNDS_BOTTOM = 1177;

/**
 * Sweeps the screen and renders the current state of the board line track array
 */
function renderLiveTable(boardLine) {
    const tableView = document.getElementById("table-view");
    if (!tableView) return;

    // --- PHASE 1: ACTIVE LOBBY SELECTION SCREEN ---
    if (localGameState && localGameState.game_state === 'waiting') {
        const hostName = localGameState.players && localGameState.players.player1 ? localGameState.players.player1.name : "Table Host";
        const roster = (localGameState.players && localGameState.players.lobby_roster) ? localGameState.players.lobby_roster : [hostName];
        
        if (playerSeatNumber === 1) {
            // Host Configuration Interface Layout
            const filteredPlayers = roster.filter(name => name !== hostName);
            let dropdownOptions = filteredPlayers.map(name => `<option value="${name}">${name}</option>`).join("");

            tableView.innerHTML = `
                <div id="game-mat" style="position: relative; width: 100%; height: 100vh; background: #0b0c10; display: flex; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;">
                    <div class="lobby-panel" style="padding: 40px; text-align: center; border: 2px solid #66fcf1; background: rgba(31, 40, 51, 0.9); border-radius: 12px; max-width: 500px; width: 100%;">
                        <h2 style="color: #66fcf1; font-size: 2rem; margin-bottom: 15px; letter-spacing: 1px;">TABLE LINEUP</h2>
                        <p style="color: #c5c6c7; margin-bottom: 25px; font-size: 1.1rem;">Room Code: <strong style="color: #fff;">${currentRoomCode}</strong></p>
                        
                        <div style="margin-bottom: 35px; text-align: left;">
                            <label style="color: #66fcf1; font-weight: bold; display: block; margin-bottom: 8px; font-size: 1rem;">CHOOSE SEAT 2 OPPONENT:</label>
                            <select id="lineup-seat2-select" style="width: 100%; padding: 12px; font-size: 1.1rem; background: #0b0c10; color: #fff; border: 1px solid #66fcf1; border-radius: 4px;">
                                ${dropdownOptions ? dropdownOptions : '<option value="" disabled selected>Waiting for players to join room...</option>'}
                            </select>
                        </div>

                        <button id="launch-match-action-btn" class="lobby-btn primary" style="padding: 12px 35px; font-size: 1.2rem; cursor: pointer; width: 100%;" ${!dropdownOptions ? 'disabled' : ''}>
                            START MATCH
                        </button>
                    </div>
                </div>
            `;

            const launchBtn = document.getElementById("launch-match-action-btn");
            if (launchBtn && dropdownOptions) {
                launchBtn.addEventListener("click", () => {
                    const selectedName = document.getElementById("lineup-seat2-select").value;
                    if (selectedName) {
                        launchMatchWithLineup(selectedName);
                    }
                });
            }
        } else {
            // Guest Loading Status screen placeholder layout
            tableView.innerHTML = `
                <div id="game-mat" style="position: relative; width: 100%; height: 100vh; background: #0b0c10; display: flex; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;">
                    <div style="text-align: center; max-width: 500px;">
                        <h2 style="color: #66fcf1; font-size: 2.2rem; margin-bottom: 15px; letter-spacing: 1px;">CONNECTED TO ROOM</h2>
                        <p style="color: #fff; font-size: 1.4rem; font-weight: bold; margin-bottom: 20px;">CODE: ${currentRoomCode}</p>
                        <p style="color: #c5c6c7; font-size: 1.1rem;">Hold tight! The Table Host is matching names and organizing the lineup deck now...</p>
                        <div class="domino-divider" style="width: 60px; margin: 30px auto 0 auto;"></div>
                    </div>
                </div>
            `;
        }
        return; 
    }

    // --- PHASE 2: MATCH LAUNCHED & ACTIVE PLAY ---
    let mat = document.getElementById("game-mat");
    if (!mat || !document.getElementById("domino-track-canvas")) {
        // Fix 2 & 3: Background url routed to assets directory, expanded container framework to fill full screens
        tableView.innerHTML = `
            <div id="game-mat" style="position: relative; width: 100vw; height: 100vh; background-image: url('assets/table_bg.jpg'); background-size: cover; background-repeat: no-repeat; background-position: center; display: flex; justify-content: center; align-items: center; overflow: hidden; box-sizing: border-box;">
                
                <div id="scaled-table-canvas-root" style="position: relative; width: 100vw; height: 56.25vw; max-height: 100vh; max-width: 177.77vh;">
                    
                    <div id="seat-block-1" style="position: absolute; top: 10px; left: 10px; padding: 10px; background: rgba(11,12,16,0.85); border: 1px solid #66fcf1; border-radius: 4px; min-width: 120px; font-size: 0.75rem; line-height: 1.2; z-index: 10;"></div>
                    <div id="seat-block-2" style="position: absolute; top: 10px; right: 10px; padding: 10px; background: rgba(11,12,16,0.85); border: 1px solid rgba(102,252,241,0.4); border-radius: 4px; min-width: 120px; font-size: 0.75rem; line-height: 1.2; z-index: 10;"></div>
                    <div id="seat-block-3" style="position: absolute; bottom: 10px; right: 10px; padding: 10px; background: rgba(11,12,16,0.85); border: 1px solid rgba(102,252,241,0.4); border-radius: 4px; min-width: 120px; font-size: 0.75rem; line-height: 1.2; z-index: 10;"></div>
                    <div id="seat-block-4" style="position: absolute; bottom: 10px; left: 10px; padding: 10px; background: rgba(11,12,16,0.85); border: 1px solid rgba(102,252,241,0.4); border-radius: 4px; min-width: 120px; font-size: 0.75rem; line-height: 1.2; z-index: 10;"></div>

                    <div id="table-status-header" style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); color: #66fcf1; font-size: 0.9rem; letter-spacing: 1px; text-transform: uppercase; z-index: 10; font-weight: bold; background: rgba(0,0,0,0.6); padding: 4px 12px; border-radius: 20px;">
                        Room: <span id="display-room-code" style="color: #fff;">----</span> | Turn: <span id="display-active-turn">-</span>
                    </div>

                    <div id="domino-track-canvas" style="position: absolute; left: ${(BOUNDS_LEFT/BG_NATIVE_WIDTH)*100}%; top: ${(BOUNDS_TOP/BG_NATIVE_HEIGHT)*100}%; width: ${((BOUNDS_RIGHT - BOUNDS_LEFT)/BG_NATIVE_WIDTH)*100}%; height: ${((BOUNDS_BOTTOM - BOUNDS_TOP)/BG_NATIVE_HEIGHT)*100}%;">
                        <div id="empty-track-message" style="position: absolute; width: 100%; top: 20%; text-align: center; color: rgba(197, 198, 199, 0.6); font-size: 0.8rem; letter-spacing: 1px;">BOARD IS EMPTY - CLICK CONTAINER BOUNDS TO INITIATE INITIAL DROP</div>
                        
                        <div id="left-play-zone" style="display: none; position: absolute; left: 0; top: 0; width: 15%; height: 100%; background: rgba(102, 252, 241, 0.12); justify-content: center; align-items: center; z-index: 20; color: #66fcf1; font-weight: bold; font-size: 0.75rem; border-right: 2px dashed #66fcf1; cursor: pointer;">PLAY LEFT</div>
                        <div id="right-play-zone" style="display: none; position: absolute; right: 0; top: 0; width: 15%; height: 100%; background: rgba(102, 252, 241, 0.12); justify-content: center; align-items: center; z-index: 20; color: #66fcf1; font-weight: bold; font-size: 0.75rem; border-left: 2px dashed #66fcf1; cursor: pointer;">PLAY RIGHT</div>

                        <div id="placed-tiles-container" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; display: flex; justify-content: center; align-items: center; gap: 6px;"></div>
                    </div>

                    <div id="player-hand-container" style="position: absolute; left: 50%; top: 32%; transform: translate(-50%, -50%); width: 50%; height: 20%; display: flex; justify-content: center; align-items: center; gap: 8px; background: rgba(11, 40, 51, 0.3); border: 1px solid rgba(102, 252, 241, 0.15); border-radius: 6px; padding: 5px; box-sizing: border-box; z-index: 15;"></div>

                    <div id="turn-alert-message" style="position: absolute; top: 43%; left: 50%; transform: translateX(-50%); color: #ff4a4a; font-weight: bold; font-size: 0.8rem; background: rgba(0,0,0,0.85); padding: 5px 15px; border-radius: 4px; border: 1px solid #ff4a4a; display: none; z-index: 25;"></div>

                </div>
            </div>
        `;
        mat = document.getElementById("game-mat");

        // Attach event actions
        document.getElementById("domino-track-canvas").addEventListener("click", handleBoardClick);
        document.getElementById("left-play-zone").addEventListener("click", (e) => { e.stopPropagation(); processTilePlacement('left'); });
        document.getElementById("right-play-zone").addEventListener("click", (e) => { e.stopPropagation(); processTilePlacement('right'); });
    }

    // Dynamic State Updates
    if (currentRoomCode) {
        document.getElementById("display-room-code").innerText = currentRoomCode;
    }
    if (localGameState) {
        let activeNameStr = `Player ${localGameState.active_turn}`;
        if (localGameState.players && localGameState.players[`player${localGameState.active_turn}`]) {
            activeNameStr = localGameState.players[`player${localGameState.active_turn}`].name;
        }
        document.getElementById("display-active-turn").innerText = activeNameStr;
        
        updateCornerSeatBlocks();
    }

    const trackContainer = document.getElementById("placed-tiles-container");
    const emptyMsg = document.getElementById("empty-track-message");
    const handContainer = document.getElementById("player-hand-container");
    const leftZone = document.getElementById("left-play-zone");
    const rightZone = document.getElementById("right-play-zone");
    
    if (trackContainer) trackContainer.innerHTML = "";
    if (handContainer) handContainer.innerHTML = "";
    if (leftZone) leftZone.style.display = "none";
    if (rightZone) rightZone.style.display = "none";

    // Skip Turn Loop verification hook
    if (localGameState && localGameState.game_state === 'playing' && localGameState.active_turn === playerSeatNumber) {
        if (!hasPlayableMoves()) {
            const alertBox = document.getElementById("turn-alert-message");
            if (alertBox) {
                alertBox.innerText = "NO PLAYABLE BONES - SKIPPING YOUR TURN...";
                alertBox.style.display = "block";
            }
            setTimeout(() => {
                if (alertBox) alertBox.style.display = "none";
                handleAutoPassTurn();
            }, 2000);
            return;
        }
    }

    // 1. Draw Placed Bones inside the Inner Neon Tracking Bounds
    if (boardLine && boardLine.length > 0) {
        if (emptyMsg) emptyMsg.style.display = "none";
        
        boardLine.forEach(tile => {
            const placedTile = document.createElement("div");
            placedTile.className = "domino-bone-interactive";
            placedTile.style.cursor = "default";
            placedTile.style.transform = "rotate(90deg) scale(0.75)"; 
            
            placedTile.innerHTML = `
                ${generateHalfDisplay(tile.displayTop)}
                <div class="domino-divider"></div>
                ${generateHalfDisplay(tile.displayBottom)}
            `;
            trackContainer.appendChild(placedTile);
        });
    } else {
        if (emptyMsg) emptyMsg.style.display = "block";
    }

    // 2. Draw Local Player's Tray Centered Directly Above Logo Matrix
    if (playerSeatNumber && localGameState.players) {
        const targetKey = `player${playerSeatNumber}`;
        const playerObj = localGameState.players[targetKey];
        
        if (playerObj && playerObj.hand) {
            playerObj.hand.forEach(tile => {
                const tileElement = document.createElement("div");
                tileElement.className = "domino-bone-interactive";
                tileElement.id = `hand-tile-${tile.id}`;
                tileElement.style.transform = "scale(0.85)";
                
                if (selectedTileId === tile.id) {
                    tileElement.style.transform = "translateY(-10px) scale(0.9)";
                    tileElement.style.borderColor = "#66fcf1";
                    tileElement.style.boxShadow = "0 0 10px #66fcf1";
                    
                    if (localGameState.active_turn === playerSeatNumber) {
                        displayValidPlacements(tile);
                    }
                }

                tileElement.onmouseenter = () => {
                    if (selectedTileId !== tile.id) tileElement.style.transform = "translateY(-5px) scale(0.88)";
                };
                tileElement.onmouseleave = () => {
                    if (selectedTileId !== tile.id) tileElement.style.transform = "translateY(0) scale(0.85)";
                };
                
                tileElement.innerHTML = `
                    ${generateHalfDisplay(tile.top)}
                    <div class="domino-divider"></div>
                    ${generateHalfDisplay(tile.bottom)}
                `;
                
                tileElement.addEventListener("click", (e) => {
                    e.stopPropagation(); 
                    if (selectedTileId === tile.id) {
                        selectedTileId = null;
                    } else {
                        selectedTileId = tile.id;
                    }
                    renderLiveTable(localGameState.board_line);
                });

                handContainer.appendChild(tileElement);
            });
        }
    }
}

/**
 * Renders the multi-layered text block output onto the absolute 10px corner seat panels
 */
function updateCornerSeatBlocks() {
    for (let i = 1; i <= 4; i++) {
        const block = document.getElementById(`seat-block-${i}`);
        if (!block) continue;

        const player = localGameState.players[`player${i}`];
        if (!player) {
            block.style.display = "none";
            continue;
        }

        block.style.display = "block";
        
        if (localGameState.active_turn === i && localGameState.game_state === 'playing') {
            block.style.backgroundColor = "rgba(102, 252, 241, 0.15)";
            block.style.borderColor = "#66fcf1";
        } else {
            block.style.backgroundColor = "rgba(11, 12, 16, 0.85)";
            block.style.borderColor = (player.name === "Waiting..." || player.name === "Not In Use") ? "rgba(255,255,255,0.08)" : "rgba(102, 252, 241, 0.3)";
        }

        const roleStr = (i === 1) ? "Table Host" : `Player ${i}`;
        const displayLabel = (player.name === "Table Host" || player.name === `Player ${i}`) ? roleStr : `${player.name}`;

        const tileCount = (player.hand) ? player.hand.length : 0;
        const capacityStr = (player.name === "Waiting..." || player.name === "Not In Use") ? "" : `<div style="color: #fff; margin-top: 1px;">Bones: <strong>${tileCount}</strong></div>`;

        let healthTag = `<span style="color: #66fcf1; font-weight: bold;">Active</span>`;
        if (player.name === "Waiting...") {
            healthTag = `<span style="color: #999; font-style: italic;">Lobby...</span>`;
        } else if (player.name === "Not In Use") {
            healthTag = `<span style="color: #444;">Empty</span>`;
        }

        block.innerHTML = `
            <div style="font-weight: bold; color: #66fcf1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 110px;">${displayLabel}</div>
            ${capacityStr}
            <div style="font-size: 0.65rem; margin-top: 2px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 2px;">${healthTag}</div>
        `;
    }
}

/**
 * Translates an integer value (0-6) into an authentic 3x3 dot matrix frame
 */
function generateHalfDisplay(value) {
    const pipMaps = {
        0: [], 1: [4], 2: [1, 7], 3: [1, 4, 7],
        4: [1, 2, 6, 7], 5: [1, 2, 4, 6, 7], 6: [1, 2, 3, 5, 6, 7]
    };
    
    const activePips = pipMaps[value] || [];
    let html = `<div class="domino-half">`;
    for (let p = 1; p <= 9; p++) {
        const isActive = activePips.includes(p) ? 'active' : '';
        html += `<div class="pip ${isActive} pos-${p}"></div>`;
    }
    html += `</div>`;
    return html;
}

/**
 * Validates tracking match positions to reveal overlay zones
 */
function displayValidPlacements(tile) {
    const line = localGameState.board_line;
    const leftZone = document.getElementById("left-play-zone");
    const rightZone = document.getElementById("right-play-zone");
    
    if (!line || line.length === 0) {
        return; 
    }

    const openLeft = line[0].displayTop;
    const openRight = line[line.length - 1].displayBottom;

    if (tile.top === openLeft || tile.bottom === openLeft) {
        leftZone.style.display = "flex";
    }
    if (tile.top === openRight || tile.bottom === openRight) {
        rightZone.style.display = "flex";
    }
}

/**
 * Scans user tray to determine if pass rule handles apply
 */
function hasPlayableMoves() {
    const line = localGameState.board_line;
    if (!line || line.length === 0) return true; 

    const openLeft = line[0].displayTop;
    const openRight = line[line.length - 1].displayBottom;
    
    const hand = localGameState.players[`player${playerSeatNumber}`].hand || [];
    return hand.some(tile => 
        tile.top === openLeft || tile.bottom === openLeft ||
        tile.top === openRight || tile.bottom === openRight
    );
}

/**
 * General click handler redirects execution for board drops
 */
function handleBoardClick() {
    if (localGameState.active_turn !== playerSeatNumber) {
        return;
    }
    if (!selectedTileId) {
        alert("Select a domino bone from your hand first!");
        return;
    }

    const line = localGameState.board_line;
    if (!line || line.length === 0) {
        processTilePlacement('initial');
    }
}

/**
 * Master game mechanics solver: verifies, rotates, and chains bones to track layout
 */
function processTilePlacement(targetSide) {
    const targetKey = `player${playerSeatNumber}`;
    const playerHand = localGameState.players[targetKey].hand;
    const tileIndex = playerHand.findIndex(t => t.id === selectedTileId);
    
    if (tileIndex === -1) return;
    const chosenTile = playerHand[tileIndex];
    let updatedBoardLine = [...localGameState.board_line];

    if (targetSide === 'initial') {
        chosenTile.displayTop = chosenTile.top;
        chosenTile.displayBottom = chosenTile.bottom;
        updatedBoardLine.push(chosenTile);
    } 
    else if (targetSide === 'left') {
        const openLeft = updatedBoardLine[0].displayTop;
        if (chosenTile.bottom === openLeft) {
            chosenTile.displayTop = chosenTile.top;
            chosenTile.displayBottom = chosenTile.bottom;
        } else if (chosenTile.top === openLeft) {
            chosenTile.displayTop = chosenTile.bottom;
            chosenTile.displayBottom = chosenTile.top;
        } else {
            alert("This rule match path is invalid!");
            return;
        }
        updatedBoardLine.unshift(chosenTile); 
    } 
    else if (targetSide === 'right') {
        const openRight = updatedBoardLine[updatedBoardLine.length - 1].displayBottom;
        if (chosenTile.top === openRight) {
            chosenTile.displayTop = chosenTile.top;
            chosenTile.displayBottom = chosenTile.bottom;
        } else if (chosenTile.bottom === openRight) {
            chosenTile.displayTop = chosenTile.bottom;
            chosenTile.displayBottom = chosenTile.top;
        } else {
            alert("This rule match path is invalid!");
            return;
        }
        updatedBoardLine.push(chosenTile); 
    }

    playerHand.splice(tileIndex, 1);
    
    let nextTurn = calculateNextEligibleTurn(localGameState.active_turn);
    const updatedPlayersMap = { ...localGameState.players };
    updatedPlayersMap[targetKey].hand = playerHand;
    
    selectedTileId = null;
    pushMoveToDatabase(updatedBoardLine, nextTurn, updatedPlayersMap);
}

/**
 * Calculates the next seat that is actually participating in the session
 */
function calculateNextEligibleTurn(currentTurn) {
    let checkSeat = currentTurn;
    for (let i = 0; i < 4; i++) {
        checkSeat = checkSeat + 1;
        if (checkSeat > 4) checkSeat = 1;
        
        const nextPlayerObj = localGameState.players[`player${checkSeat}`];
        if (nextPlayerObj && nextPlayerObj.name !== "Waiting..." && nextPlayerObj.name !== "Not In Use") {
            return checkSeat;
        }
    }
    return 1;
}

/**
 * Triggered automatically when the engine catches a locked player hand tray
 */
function handleAutoPassTurn() {
    let nextTurn = calculateNextEligibleTurn(localGameState.active_turn);
    pushMoveToDatabase(localGameState.board_line, nextTurn, localGameState.players);
}
