// ==========================================================================
// Tellstream Dominoes - Game Board & Player Hand Rendering Layer
// ==========================================================================

let selectedTileId = null;

const BG_NATIVE_WIDTH = 2560;
const BG_NATIVE_HEIGHT = 1440;

const BOUNDS_LEFT = 265;
const BOUNDS_TOP = 523;
const BOUNDS_RIGHT = 2219;
const BOUNDS_BOTTOM = 1177;

function renderLiveTable(boardLine) {
    const tableView = document.getElementById("table-view");
    if (!tableView) return;

    if (localGameState && localGameState.game_state === 'waiting') {
        const hostName = localGameState.players && localGameState.players.player1 ? localGameState.players.player1.name : "Table Host";
        const roster = (localGameState.players && localGameState.players.lobby_roster) ? localGameState.players.lobby_roster : [hostName];
        
        if (playerSeatNumber === 1) {
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
                                ${dropdownOptions ? dropdownOptions : '<option value="" disabled selected>Waiting for players...</option>'}
                            </select>
                        </div>
                        <button id="launch-match-action-btn" class="lobby-btn primary" style="padding: 12px 35px; font-size: 1.2rem; cursor: pointer; width: 100%;" ${!dropdownOptions ? 'disabled' : ''}>START MATCH</button>
                    </div>
                </div>
            `;

            const launchBtn = document.getElementById("launch-match-action-btn");
            if (launchBtn && dropdownOptions) {
                launchBtn.addEventListener("click", () => {
                    const selectedName = document.getElementById("lineup-seat2-select").value;
                    if (selectedName) launchMatchWithLineup(selectedName);
                });
            }
        } else {
            tableView.innerHTML = `
                <div id="game-mat" style="position: relative; width: 100%; height: 100vh; background: #0b0c10; display: flex; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;">
                    <div style="text-align: center; max-width: 500px;">
                        <h2 style="color: #66fcf1; font-size: 2.2rem; margin-bottom: 15px; letter-spacing: 1px;">CONNECTED</h2>
                        <p style="color: #fff; font-size: 1.4rem; font-weight: bold; margin-bottom: 20px;">CODE: ${currentRoomCode}</p>
                        <p style="color: #c5c6c7; font-size: 1.1rem;">Waiting for host to organize lineup deck...</p>
                    </div>
                </div>
            `;
        }
        return; 
    }

    let mat = document.getElementById("game-mat");
    if (!mat || !document.getElementById("domino-track-canvas")) {
        tableView.innerHTML = `
            <div id="game-mat" style="position: relative; width: 100vw; height: 100vh; background-image: url('assets/table_bg.jpg'); background-size: cover; background-repeat: no-repeat; background-position: center; display: flex; justify-content: center; align-items: center; overflow: hidden; box-sizing: border-box;">
                <div id="scaled-table-canvas-root" style="position: relative; width: 100vw; height: 56.25vw; max-height: 100vh; max-width: 177.77vh;">
                    
                    <div id="seat-block-1" style="position: absolute; top: 12px; left: 12px; padding: 6px 14px; background: rgba(11,12,16,0.85); border: 1px solid rgba(102,252,241,0.2); border-radius: 4px; font-size: 0.85rem; z-index: 10; display: flex; gap: 8px; align-items: center; white-space: nowrap;"></div>
                    <div id="seat-block-2" style="position: absolute; top: 12px; right: 12px; padding: 6px 14px; background: rgba(11,12,16,0.85); border: 1px solid rgba(102,252,241,0.2); border-radius: 4px; font-size: 0.85rem; z-index: 10; display: flex; gap: 8px; align-items: center; white-space: nowrap;"></div>
                    <div id="seat-block-3" style="position: absolute; bottom: 25px; right: 12px; padding: 6px 14px; background: rgba(11,12,16,0.85); border: 1px solid rgba(102,252,241,0.2); border-radius: 4px; font-size: 0.85rem; z-index: 10; display: flex; gap: 8px; align-items: center; white-space: nowrap;"></div>
                    <div id="seat-block-4" style="position: absolute; bottom: 25px; left: 12px; padding: 6px 14px; background: rgba(11,12,16,0.85); border: 1px solid rgba(102,252,241,0.2); border-radius: 4px; font-size: 0.85rem; z-index: 10; display: flex; gap: 8px; align-items: center; white-space: nowrap;"></div>

                    <div id="table-status-header" style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); color: #66fcf1; font-size: 0.9rem; letter-spacing: 1px; text-transform: uppercase; z-index: 10; font-weight: bold; background: rgba(0,0,0,0.6); padding: 4px 12px; border-radius: 20px;">
                        Room: <span id="display-room-code" style="color: #fff;">----</span> | Turn: <span id="display-active-turn">-</span>
                    </div>

                    <div id="domino-track-canvas" style="position: absolute; left: ${(BOUNDS_LEFT/BG_NATIVE_WIDTH)*100}%; top: ${(BOUNDS_TOP/BG_NATIVE_HEIGHT)*100}%; width: ${((BOUNDS_RIGHT - BOUNDS_LEFT)/BG_NATIVE_WIDTH)*100}%; height: ${((BOUNDS_BOTTOM - BOUNDS_TOP)/BG_NATIVE_HEIGHT)*100}%;">
                        <div id="left-play-zone" style="display: none; position: absolute; left: 0; top: 0; width: 15%; height: 100%; background: rgba(102, 252, 241, 0.12); justify-content: center; align-items: center; z-index: 20; color: #66fcf1; font-weight: bold; font-size: 0.75rem; border-right: 2px dashed #66fcf1; cursor: pointer;">PLAY LEFT</div>
                        <div id="right-play-zone" style="display: none; position: absolute; right: 0; top: 0; width: 15%; height: 100%; background: rgba(102, 252, 241, 0.12); justify-content: center; align-items: center; z-index: 20; color: #66fcf1; font-weight: bold; font-size: 0.75rem; border-left: 2px dashed #66fcf1; cursor: pointer;">PLAY RIGHT</div>
                        <div id="placed-tiles-container" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; display: flex; justify-content: center; align-items: center; gap: 20px;"></div>
                    </div>

                    <div id="player-hand-container" style="position: absolute; left: 50%; top: 49.5%; transform: translate(-50%, -50%); width: 60%; height: 16%; display: flex; justify-content: center; align-items: center; gap: 16px; background: transparent; padding: 5px; box-sizing: border-box; z-index: 999; filter: drop-shadow(0px 12px 18px rgba(0, 0, 0, 0.95));"></div>

                    <div id="turn-alert-message" style="position: absolute; top: 59.5%; left: 50%; transform: translateX(-50%); color: #ff4a4a; font-weight: bold; font-size: 0.8rem; background: rgba(0,0,0,0.85); padding: 5px 15px; border-radius: 4px; border: 1px solid #ff4a4a; display: none; z-index: 25;"></div>
                </div>
            </div>
        `;
        mat = document.getElementById("game-mat");

        document.getElementById("domino-track-canvas").addEventListener("click", handleBoardClick);
        document.getElementById("left-play-zone").addEventListener("click", (e) => { e.stopPropagation(); processTilePlacement('left'); });
        document.getElementById("right-play-zone").addEventListener("click", (e) => { e.stopPropagation(); processTilePlacement('right'); });
    }

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
    const handContainer = document.getElementById("player-hand-container");
    const leftZone = document.getElementById("left-play-zone");
    const rightZone = document.getElementById("right-play-zone");
    
    if (trackContainer) trackContainer.innerHTML = "";
    if (handContainer) handContainer.innerHTML = "";
    if (leftZone) leftZone.style.display = "none";
    if (rightZone) rightZone.style.display = "none";

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

    // 1. RENDER PLAYED TRACK (HARDCODED 50% BIGGER SIZE PROPORTIONS)
    if (boardLine && boardLine.length > 0) {
        boardLine.forEach(tile => {
            const placedTile = document.createElement("div");
            placedTile.className = "domino-bone-interactive";
            placedTile.style.cursor = "default";
            
            // Hardcoded absolute sizing constraints ensures exact 50% scale bump
            placedTile.style.width = "106px";
            placedTile.style.height = "52px";
            placedTile.style.transform = "rotate(90deg)"; 
            placedTile.style.flexShrink = "0";
            
            placedTile.innerHTML = `
                ${generateHalfDisplay(tile.displayTop)}
                <div class="domino-divider"></div>
                ${generateHalfDisplay(tile.displayBottom)}
            `;
            trackContainer.appendChild(placedTile);
        });
    }

    // 2. RENDER PLAYER HAND DEALT TILES (MATCHING 50% BIGGER ENGINE SIZE)
    if (playerSeatNumber && localGameState.players) {
        const targetKey = `player${playerSeatNumber}`;
        const playerObj = localGameState.players[targetKey];
        
        if (playerObj && playerObj.hand) {
            playerObj.hand.forEach(tile => {
                const tileElement = document.createElement("div");
                tileElement.className = "domino-bone-interactive";
                tileElement.id = `hand-tile-${tile.id}`;
                
                // Hardcoded size matched to track exactly
                tileElement.style.width = "106px";
                tileElement.style.height = "52px";
                tileElement.style.flexShrink = "0";
                
                if (selectedTileId === tile.id) {
                    tileElement.style.transform = "translateY(-16px)";
                    tileElement.style.borderColor = "#66fcf1";
                    tileElement.style.boxShadow = "0 0 16px #66fcf1";
                    if (localGameState.active_turn === playerSeatNumber) {
                        displayValidPlacements(tile);
                    }
                }

                tileElement.onmouseenter = () => {
                    if (selectedTileId !== tile.id) tileElement.style.transform = "translateY(-8px)";
                };
                tileElement.onmouseleave = () => {
                    if (selectedTileId !== tile.id) tileElement.style.transform = "translateY(0)";
                };
                
                tileElement.innerHTML = `
                    ${generateHalfDisplay(tile.top)}
                    <div class="domino-divider"></div>
                    ${generateHalfDisplay(tile.bottom)}
                `;
                
                tileElement.addEventListener("click", (e) => {
                    e.stopPropagation(); 
                    selectedTileId = (selectedTileId === tile.id) ? null : tile.id;
                    renderLiveTable(localGameState.board_line);
                });

                handContainer.appendChild(tileElement);
            });
        }
    }
}

function updateCornerSeatBlocks() {
    for (let i = 1; i <= 4; i++) {
        const block = document.getElementById(`seat-block-${i}`);
        if (!block) continue;

        const player = localGameState.players[`player${i}`];
        if (!player) {
            block.style.display = "none";
            continue;
        }

        block.style.display = "flex";
        
        if (localGameState.active_turn === i && localGameState.game_state === 'playing') {
            block.style.backgroundColor = "rgba(11, 12, 16, 0.95)";
            block.style.borderColor = "#66fcf1";
            block.style.boxShadow = "0 0 15px rgba(102, 252, 241, 0.5)";
        } else {
            block.style.backgroundColor = "rgba(11, 12, 16, 0.85)";
            block.style.borderColor = (player.name === "Waiting..." || player.name === "Not In Use") ? "rgba(255,255,255,0.05)" : "rgba(102, 252, 241, 0.2)";
            block.style.boxShadow = "none";
        }

        const roleStr = (i === 1) ? "Host" : `P${i}`;
        const displayLabel = (player.name === "Table Host" || player.name === `Player ${i}`) ? roleStr : `${player.name}`;

        if (player.name === "Waiting...") {
            block.innerHTML = `<span style="color: #66fcf1; font-weight: bold;">${roleStr}</span> <span style="color: rgba(255,255,255,0.15); margin: 0 4px;">|</span> <span style="color: #666; font-style: italic;">Lobby...</span>`;
        } else if (player.name === "Not In Use") {
            block.innerHTML = `<span style="color: #444; font-weight: bold;">${roleStr}</span> <span style="color: rgba(255,255,255,0.15); margin: 0 4px;">|</span> <span style="color: #444;">Empty</span>`;
        } else {
            const tileCount = (player.hand) ? player.hand.length : 0;
            block.innerHTML = `
                <strong style="color: #66fcf1; max-width: 120px; overflow: hidden; text-overflow: ellipsis;">${displayLabel}</strong>
                <span style="color: rgba(255,255,255,0.15); margin: 0 3px;">|</span>
                <span style="color: #fff; font-weight: 500;">Bones: ${tileCount}</span>
                <span style="color: rgba(255,255,255,0.15); margin: 0 3px;">|</span>
                <span style="color: #66fcf1; font-weight: bold;">Active</span>
            `;
        }
    }
}

function generateHalfDisplay(value) {
    const pipMaps = {
        0: [], 1: [4], 2: [1, 7], 3: [1, 4, 7],
        4: [1, 2, 6, 7], 5: [1, 2, 4, 6, 7], 6: [1, 2, 3, 5, 6, 7]
    };
    const activePips = pipMaps[value] || [];
    let html = `<div class="domino-half" style="width:100%; height:100%; position:relative;">`;
    for (let p = 1; p <= 9; p++) {
        const isActive = activePips.includes(p) ? 'active' : '';
        html += `<div class="pip ${isActive} pos-${p}"></div>`;
    }
    html += `</div>`;
    return html;
}

function displayValidPlacements(tile) {
    const line = localGameState.board_line;
    const leftZone = document.getElementById("left-play-zone");
    const rightZone = document.getElementById("right-play-zone");
    if (!line || line.length === 0) return; 

    const openLeft = line[0].displayTop;
    const openRight = line[line.length - 1].displayBottom;

    if (tile.top === openLeft || tile.bottom === openLeft) leftZone.style.display = "flex";
    if (tile.top === openRight || tile.bottom === openRight) rightZone.style.display = "flex";
}

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

function handleBoardClick() {
    if (localGameState.active_turn !== playerSeatNumber) return;
    if (!selectedTileId) {
        alert("Select a domino bone from your hand first!");
        return;
    }
    const line = localGameState.board_line;
    if (!line || line.length === 0) processTilePlacement('initial');
}

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
    // TRUE DANCEHALL MATCH FLIP: Re-mapped to flip the display values so matching ends explicitly connect "kissing"
    else if (targetSide === 'left') {
        const openLeft = updatedBoardLine[0].displayTop;
        if (chosenTile.bottom === openLeft) {
            chosenTile.displayTop = chosenTile.top;
            chosenTile.displayBottom = chosenTile.bottom;
        } else if (chosenTile.top === openLeft) {
            chosenTile.displayTop = chosenTile.bottom;
            chosenTile.displayBottom = chosenTile.top;
        } else return;
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
        } else return;
        updatedBoardLine.push(chosenTile); 
    }

    playerHand.splice(tileIndex, 1);
    let nextTurn = calculateNextEligibleTurn(localGameState.active_turn);
    const updatedPlayersMap = { ...localGameState.players };
    updatedPlayersMap[targetKey].hand = playerHand;
    
    selectedTileId = null;
    pushMoveToDatabase(updatedBoardLine, nextTurn, updatedPlayersMap);
}

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

function handleAutoPassTurn() {
    let nextTurn = calculateNextEligibleTurn(localGameState.active_turn);
    pushMoveToDatabase(localGameState.board_line, nextTurn, localGameState.players);
}
