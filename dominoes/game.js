// ==========================================================================
// Tellstream Dominoes - Game Board & Player Hand Rendering Layer
// ==========================================================================

// Track the currently highlighted tile in the player's hand
let selectedTileId = null;

/**
 * Sweeps the screen and renders the current state of the board line track array
 */
function renderLiveTable(boardLine) {
    const tableView = document.getElementById("table-view");
    if (!tableView) return;

    // --- PHASE 1: ACTIVE LOBBY SELECTION SCREEN ---
    if (localGameState && localGameState.game_state === 'waiting') {
        const roster = (localGameState.players && localGameState.players.lobby_roster) ? localGameState.players.lobby_roster : ["Table Host"];
        
        if (playerSeatNumber === 1) {
            // Host Configuration Interface Layout
            const filteredPlayers = roster.filter(name => name !== "Table Host");
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
    // Handle late auto-assignment tracking variable for non-host player
    if (playerSeatNumber !== 1 && localGameState && localGameState.players && localGameState.players.player2) {
        const localSavedName = window.sessionStorage.setItem("tellstream_player_identity");
        if (localGameState.players.player2.name === localSavedName) {
            playerSeatNumber = 2;
        }
    }

    // Check if we need to initialize the core structural layout frame inside the view
    let mat = document.getElementById("game-mat");
    if (!mat || !document.getElementById("domino-track-canvas")) {
        tableView.innerHTML = `
            <div id="game-mat" style="position: relative; width: 100%; height: 100vh; background: #0b0c10; display: flex; flex-direction: column; justify-content: space-between; align-items: center; padding: 20px; box-sizing: border-box;">
                
                <div id="table-status-header" style="color: #66fcf1; font-family: sans-serif; font-size: 1.2rem; letter-spacing: 2px; text-transform: uppercase; margin-top: 10px;">
                    Room Code: <span id="display-room-code" style="color: #fff; font-weight: bold;">----</span> | Turn: Player <span id="display-active-turn">-</span>
                </div>

                <div id="domino-track-canvas" style="position: relative; width: 85%; height: 58vh; border: 4px solid #66fcf1; box-shadow: 0 0 20px #66fcf1; background: radial-gradient(circle, #1f2833 0%, #0b0c10 100%); border-radius: 12px; display: flex; justify-content: center; align-items: center; cursor: pointer;">
                    <div id="empty-track-message" style="color: #c5c6c7; font-family: sans-serif; font-size: 1.1rem; letter-spacing: 1px;">BOARD IS EMPTY - CLICK HERE TO MAKE INITIAL DROP</div>
                    
                    <div id="left-play-zone" style="display: none; position: absolute; left: 0; width: 25%; height: 100%; background: rgba(102, 252, 241, 0.08); justify-content: center; align-items: center; z-index: 5; color: #66fcf1; font-weight: bold; border-right: 2px dashed #66fcf1;">PLAY LEFT</div>
                    <div id="right-play-zone" style="display: none; position: absolute; right: 0; width: 25%; height: 100%; background: rgba(102, 252, 241, 0.08); justify-content: center; align-items: center; z-index: 5; color: #66fcf1; font-weight: bold; border-left: 2px dashed #66fcf1;">PLAY RIGHT</div>

                    <div id="placed-tiles-container" style="position: absolute; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; gap: 10px; overflow-x: auto; padding: 0 40px; box-sizing: border-box;"></div>
                </div>

                <div id="action-control-bar" style="margin-bottom: 5px;">
                    <button id="pass-turn-btn" class="lobby-btn" style="padding: 8px 20px; font-size: 1rem; display: none;">Pass Turn (No Playable Bones)</button>
                </div>

                <div id="player-hand-container" style="width: 90%; min-height: 140px; display: flex; justify-content: center; align-items: center; gap: 15px; background: rgba(31, 40, 51, 0.5); border: 1px solid rgba(102, 252, 241, 0.2); border-radius: 10px; padding: 15px; margin-bottom: 10px; box-sizing: border-box;"></div>
            </div>
        `;
        mat = document.getElementById("game-mat");

        // Attach event actions
        document.getElementById("domino-track-canvas").addEventListener("click", handleBoardClick);
        document.getElementById("left-play-zone").addEventListener("click", (e) => { e.stopPropagation(); processTilePlacement('left'); });
        document.getElementById("right-play-zone").addEventListener("click", (e) => { e.stopPropagation(); processTilePlacement('right'); });
        document.getElementById("pass-turn-btn").addEventListener("click", handlePassTurn);
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
    }

    const trackContainer = document.getElementById("placed-tiles-container");
    const emptyMsg = document.getElementById("empty-track-message");
    const handContainer = document.getElementById("player-hand-container");
    const leftZone = document.getElementById("left-play-zone");
    const rightZone = document.getElementById("right-play-zone");
    const passBtn = document.getElementById("pass-turn-btn");
    
    if (trackContainer) trackContainer.innerHTML = "";
    if (handContainer) handContainer.innerHTML = "";
    if (leftZone) leftZone.style.display = "none";
    if (rightZone) rightZone.style.display = "none";
    if (passBtn) passBtn.style.display = "none";

    // Show/Hide pass button based on turn eligibility and playability check
    if (localGameState && localGameState.game_state === 'playing' && localGameState.active_turn === playerSeatNumber) {
        if (!hasPlayableMoves()) {
            passBtn.style.display = "block";
        }
    }

    // 1. Draw Placed Bones on the Board Line Track (using tracking metadata for alignment)
    if (boardLine && boardLine.length > 0) {
        if (emptyMsg) emptyMsg.style.display = "none";
        
        boardLine.forEach(tile => {
            const placedTile = document.createElement("div");
            placedTile.className = "domino-bone-interactive";
            placedTile.style.cursor = "default";
            placedTile.style.transform = "rotate(90deg)"; 
            
            // Render the visually oriented layout values
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

    // 2. Locate and Draw This Current Local Player's Hand
    if (playerSeatNumber && localGameState.players) {
        const targetKey = `player${playerSeatNumber}`;
        const playerObj = localGameState.players[targetKey];
        
        if (playerObj && playerObj.hand) {
            playerObj.hand.forEach(tile => {
                const tileElement = document.createElement("div");
                tileElement.className = "domino-bone-interactive";
                tileElement.id = `hand-tile-${tile.id}`;
                
                if (selectedTileId === tile.id) {
                    tileElement.style.transform = "translateY(-20px)";
                    tileElement.style.borderColor = "#66fcf1";
                    tileElement.style.boxShadow = "0 0 15px #66fcf1";
                    
                    // Highlight valid board layout directions if it's our turn
                    if (localGameState.active_turn === playerSeatNumber) {
                        displayValidPlacements(tile);
                    }
                }

                tileElement.onmouseenter = () => {
                    if (selectedTileId !== tile.id) tileElement.style.transform = "translateY(-15px)";
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
        return; // Click anywhere in center to drop opening piece
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
    if (!line || line.length === 0) return true; // Can play anything empty

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
        alert("It's not your turn yet!");
        return;
    }
    if (!selectedTileId) {
        alert("Select a domino bone from your hand first!");
        return;
    }

    const line = localGameState.board_line;
    // If empty, force immediate drop initialization
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
        // First drop doesn't require rotations; display matches native pips
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
            // Flip the bone to match layout direction requirements
            chosenTile.displayTop = chosenTile.bottom;
            chosenTile.displayBottom = chosenTile.top;
        } else {
            alert("This rule match path is invalid!");
            return;
        }
        updatedBoardLine.unshift(chosenTile); // Add to the left end
    } 
    else if (targetSide === 'right') {
        const openRight = updatedBoardLine[updatedBoardLine.length - 1].displayBottom;
        if (chosenTile.top === openRight) {
            chosenTile.displayTop = chosenTile.top;
            chosenTile.displayBottom = chosenTile.bottom;
        } else if (chosenTile.bottom === openRight) {
            // Flip the bone to match layout direction requirements
            chosenTile.displayTop = chosenTile.bottom;
            chosenTile.displayBottom = chosenTile.top;
        } else {
            alert("This rule match path is invalid!");
            return;
        }
        updatedBoardLine.push(chosenTile); // Add to the right end
    }

    // Strip tile out of user tray
    playerHand.splice(tileIndex, 1);
    
    let nextTurn = (localGameState.active_turn === 1) ? 2 : 1;
    const updatedPlayersMap = { ...localGameState.players };
    updatedPlayersMap[targetKey].hand = playerHand;
    
    selectedTileId = null;
    pushMoveToDatabase(updatedBoardLine, nextTurn, updatedPlayersMap);
}

/**
 * Explicitly pass turn execution rule hook
 */
function handlePassTurn() {
    if (localGameState.active_turn !== playerSeatNumber) return;
    if (hasPlayableMoves()) {
        alert("You have playable bones in your tray! You cannot pass.");
        return;
    }
    let nextTurn = (localGameState.active_turn === 1) ? 2 : 1;
    pushMoveToDatabase(localGameState.board_line, nextTurn, localGameState.players);
}
