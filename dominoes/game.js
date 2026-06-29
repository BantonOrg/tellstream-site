// ==========================================================================
// Tellstream Dominoes - Dynamic Seating & Host Selection Layer
// ==========================================================================

let selectedTileId = null;
let selectedSpectatorNames = []; // Tracks names the host has highlighted

/**
 * Sweeps the screen and renders the game board based on who is looking at it
 */
function renderLiveTable(boardLine) {
    const tableView = document.getElementById("table-view");
    if (!tableView) return;

    let mat = document.getElementById("game-mat");
    if (!mat) {
        tableView.innerHTML = `
            <div id="game-mat" style="position: relative; width: 100%; height: 100vh; background: #0b0c10; display: flex; flex-direction: column; justify-content: space-between; align-items: center; padding: 20px; box-sizing: border-box;">
                
                <!-- Top Status Header Bar -->
                <div id="table-status-header" style="color: #66fcf1; font-family: sans-serif; font-size: 1.2rem; letter-spacing: 2px; text-transform: uppercase; margin-top: 10px;">
                    <span id="room-code-wrapper">Room Code: <span id="display-room-code" style="color: #fff; font-weight: bold;">----</span> | </span>
                    Turn: <span id="display-active-turn" style="color: #fff; font-weight: bold;">-</span>
                    <span id="my-status-tag" style="margin-left: 15px; font-size: 0.9rem; color: #ffdd1a; border: 1px solid #ffdd1a; padding: 2px 6px; border-radius: 4px;"></span>
                </div>

                <!-- Center Domino Track / Selection Lounge Area -->
                <div id="domino-track-canvas" style="position: relative; width: 85%; height: 58vh; border: 4px solid #66fcf1; box-shadow: 0 0 20px #66fcf1; background: radial-gradient(circle, #1f2833 0%, #0b0c10 100%); border-radius: 12px; display: flex; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;">
                    
                    <!-- Dynamic Middle Box: Switches between Player Selection List and Active Board Track -->
                    <div id="middle-lounge-content" style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;"></div>
                    
                </div>

                <!-- Bottom Interactive Player Hand Row -->
                <div id="player-hand-container" style="width: 90%; min-height: 140px; display: flex; justify-content: center; align-items: center; gap: 15px; background: rgba(31, 40, 51, 0.5); border: 1px solid rgba(102, 252, 241, 0.2); border-radius: 10px; padding: 15px; margin-bottom: 10px; box-sizing: border-box;"></div>
            </div>
        `;
        mat = document.getElementById("game-mat");
    }

    // 1. Handle Security & Visibility Configurations
    const codeWrapper = document.getElementById("room-code-wrapper");
    const statusTag = document.getElementById("my-status-tag");

    if (playerSeatNumber === 1) {
        codeWrapper.style.display = "inline";
        document.getElementById("display-room-code").innerText = currentRoomCode;
        statusTag.innerText = "Host (Player 1)";
    } else if (playerSeatNumber >= 2) {
        codeWrapper.style.display = "none";
        statusTag.innerText = `Player ${playerSeatNumber}`;
    } else {
        codeWrapper.style.display = "none";
        statusTag.innerText = "Watching";
    }

    // 2. Map Dynamic Active Turn Display
    if (localGameState && localGameState.players) {
        const turnSeat = localGameState.active_turn;
        const activeName = localGameState.players[`player${turnSeat}`]?.name || `Waiting...`;
        document.getElementById("display-active-turn").innerText = activeName;
    }

    // Clear dynamic sub-containers to redraw fresh states
    const middleContent = document.getElementById("middle-lounge-content");
    const handContainer = document.getElementById("player-hand-container");
    if (handContainer) handContainer.innerHTML = "";

    // 3. Render Center Screen: Selection List vs Live Gameplay Track
    if (localGameState.game_state === 'waiting') {
        // Still setting up the match! Show the scrollable players list
        if (playerSeatNumber === 1) {
            // HOST VIEW: Show interactive selection module
            let spectators = localGameState.connected_spectators || [];
            // Filter out the host's own name so you don't accidentally select yourself
            let filterSpecs = spectators.filter(name => name !== localPlayerName);

            let listHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; width: 400px; max-width: 90%;">
                    <h3 style="color: #66fcf1; margin-bottom: 15px; letter-spacing: 1px; text-transform: uppercase; font-size: 1.1rem;">Select Players to Seat (Up to 3)</h3>
                    
                    <div style="width: 100%; max-height: 200px; overflow-y: auto; background: rgba(11, 12, 16, 0.8); border: 1px solid rgba(102, 252, 241, 0.4); border-radius: 6px; padding: 10px; box-sizing: border-box; margin-bottom: 20px;">
            `;

            if (filterSpecs.length === 0) {
                listHTML += `<div style="color: #c5c6c7; font-style: italic; text-align: center; padding: 10px;">Waiting for users to enter room...</div>`;
            } else {
                filterSpecs.forEach(name => {
                    const isSelected = selectedSpectatorNames.includes(name);
                    const bgStyle = isSelected ? 'background: #66fcf1; color: #0b0c10; font-weight: bold;' : 'background: transparent; color: #c5c6c7;';
                    const borderStyle = isSelected ? 'border: 1px solid #fff;' : 'border: 1px solid rgba(102, 252, 241, 0.2);';
                    
                    listHTML += `
                        <div class="spectator-list-item" data-name="${name}" style="padding: 10px; margin-bottom: 6px; border-radius: 4px; cursor: pointer; transition: all 0.2s; ${bgStyle} ${borderStyle}">
                            👤 ${name}
                        </div>
                    `;
                });
            }

            listHTML += `
                    </div>
                    <button id="launch-match-btn" style="background: transparent; color: #45f3ff; border: 2px solid #45f3ff; padding: 12px 35px; font-size: 1.1rem; font-weight: bold; border-radius: 6px; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; transition: all 0.2s;">Start Match</button>
                </div>
            `;
            
            middleContent.innerHTML = listHTML;

            // Attach toggle click bindings to the names list items
            middleContent.querySelectorAll('.spectator-list-item').forEach(item => {
                item.addEventListener('click', () => {
                    const targetName = item.getAttribute('data-name');
                    if (selectedSpectatorNames.includes(targetName)) {
                        selectedSpectatorNames = selectedSpectatorNames.filter(n => n !== targetName);
                    } else {
                        if (selectedSpectatorNames.length >= 3) {
                            alert("Maximum table capacity is 4 players total (Host + 3 players)!");
                            return;
                        }
                        selectedSpectatorNames.push(targetName);
                    }
                    renderLiveTable(localGameState.board_line); // Re-render to show updated highlights
                });
            });

            // Start Match button trigger action
            document.getElementById("launch-match-btn").addEventListener("click", () => {
                if (typeof triggerGameStartHandshake === 'function') {
                    triggerGameStartHandshake(selectedSpectatorNames);
                } else {
                    alert("Ready to deal! Standing by for network handler connection.");
                }
            });

        } else {
            // SPECTATOR/PLAYER 2 VIEW: Waiting patiently for host to initiate launch sequence
            middleContent.innerHTML = `
                <div style="text-align: center; color: #c5c6c7; font-family: sans-serif; letter-spacing: 1px;">
                    <div style="font-size: 1.3rem; color: #66fcf1; margin-bottom: 10px; font-weight: bold;">CONNECTED TO LOUNGE</div>
                    Waiting for the host to finalize table seating setup and deal bones...
                </div>
            `;
        }

    } else {
        // The game has started! Draw the real domino track canvas
        if (!boardLine || boardLine.length === 0) {
            middleContent.innerHTML = `<div id="empty-track-message" style="color: #c5c6c7; font-family: sans-serif; font-size: 1.1rem; letter-spacing: 1px;">BOARD IS EMPTY - WAITING FOR INITIAL DROP</div>`;
        } else {
            let trackHTML = `<div id="placed-tiles-container" style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; gap: 10px;">`;
            boardLine.forEach(tile => {
                trackHTML += `
                    <div class="domino-bone-interactive" style="cursor: default; transform: rotate(90deg);">
                        ${generateHalfDisplay(tile.top)}
                        <div class="domino-divider"></div>
                        ${generateHalfDisplay(tile.bottom)}
                    </div>
                `;
            });
            trackHTML += `</div>`;
            middleContent.innerHTML = trackHTML;
        }
        
        // Setup board placement listener link
        middleContent.onclick = () => {
            if (typeof handleBoardClick === 'function') handleBoardClick();
        };
    }

    // 4. Draw Hand Container Bottom Row
    if (playerSeatNumber && playerSeatNumber >= 1 && localGameState.players) {
        const targetKey = `player${playerSeatNumber}`;
        const playerObj = localGameState.players[targetKey];
        
        if (playerObj && playerObj.hand && localGameState.game_state !== 'waiting') {
            playerObj.hand.forEach(tile => {
                const tileElement = document.createElement("div");
                tileElement.className = "domino-bone-interactive";
                
                if (selectedTileId === tile.id) {
                    tileElement.style.transform = "translateY(-20px)";
                    tileElement.style.borderColor = "#66fcf1";
                    tileElement.style.boxShadow = "0 0 15px #66fcf1";
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
                    if (localGameState.active_turn !== playerSeatNumber) {
                        alert("It is not your turn!");
                        return;
                    }
                    selectedTileId = (selectedTileId === tile.id) ? null : tile.id;
                    renderLiveTable(localGameState.board_line);
                });

                handContainer.appendChild(tileElement);
            });
        } else if (localGameState.game_state === 'waiting') {
            handContainer.innerHTML = `<div style="color: rgba(102, 252, 241, 0.6); font-style: italic; font-size: 0.95rem;">Bones will be dealt here once match is started.</div>`;
        }
    } else {
        handContainer.innerHTML = `<div style="color: #c5c6c7; font-style: italic; letter-spacing: 1px; font-size: 0.95rem;">You are currently spectating this match. Enjoy the stream!</div>`;
    }
}

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
