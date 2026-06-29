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

    // Check if we need to initialize the core structural layout frame inside the view
    let mat = document.getElementById("game-mat");
    if (!mat) {
        tableView.innerHTML = `
            <div id="game-mat" style="position: relative; width: 100%; height: 100vh; background: #0b0c10; display: flex; flex-direction: column; justify-content: space-between; align-items: center; padding: 20px; box-sizing: border-box;">
                
                <div id="table-status-header" style="color: #66fcf1; font-family: sans-serif; font-size: 1.2rem; letter-spacing: 2px; text-transform: uppercase; margin-top: 10px;">
                    Room Code: <span id="display-room-code" style="color: #fff; font-weight: bold;">----</span> | Turn: Player <span id="display-active-turn">-</span>
                </div>

                <div id="domino-track-canvas" style="position: relative; width: 85%; height: 58vh; border: 4px solid #66fcf1; box-shadow: 0 0 20px #66fcf1; background: radial-gradient(circle, #1f2833 0%, #0b0c10 100%); border-radius: 12px; display: flex; justify-content: center; align-items: center; cursor: pointer;">
                    <div id="empty-track-message" style="color: #c5c6c7; font-family: sans-serif; font-size: 1.1rem; letter-spacing: 1px;">BOARD IS EMPTY - CLICK HERE TO MAKE INITIAL DROP</div>
                    <div id="placed-tiles-container" style="position: absolute; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; gap: 10px;"></div>
                </div>

                <div id="player-hand-container" style="width: 90%; min-height: 140px; display: flex; justify-content: center; align-items: center; gap: 15px; background: rgba(31, 40, 51, 0.5); border: 1px solid rgba(102, 252, 241, 0.2); border-radius: 10px; padding: 15px; margin-bottom: 10px; box-sizing: border-box;"></div>
            </div>
        `;
        mat = document.getElementById("game-mat");

        // Attach click listener to the center track board for placing selected tiles
        document.getElementById("domino-track-canvas").addEventListener("click", handleBoardClick);
    }

    // Dynamic State Updates
    if (currentRoomCode) {
        document.getElementById("display-room-code").innerText = currentRoomCode;
    }
    if (localGameState) {
        document.getElementById("display-active-turn").innerText = localGameState.active_turn;
    }

    // Clear previous elements inside containers to prevent duplicates on redraw
    const trackContainer = document.getElementById("placed-tiles-container");
    const emptyMsg = document.getElementById("empty-track-message");
    const handContainer = document.getElementById("player-hand-container");
    
    if (trackContainer) trackContainer.innerHTML = "";
    if (handContainer) handContainer.innerHTML = "";

    // 1. Draw Placed Bones on the Board Line Track
    if (boardLine && boardLine.length > 0) {
        if (emptyMsg) emptyMsg.style.display = "none";
        
        // Simple starting render logic: draw bones horizontally in the center
        boardLine.forEach(tile => {
            const placedTile = document.createElement("div");
            placedTile.className = "domino-bone-interactive";
            placedTile.style.cursor = "default";
            placedTile.style.transform = "rotate(90deg)"; // Lay them down flat on the track line
            placedTile.innerHTML = `
                ${generateHalfDisplay(tile.top)}
                <div class="domino-divider"></div>
                ${generateHalfDisplay(tile.bottom)}
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
                
                // Keep highlighted style persistent if this specific tile is currently selected
                if (selectedTileId === tile.id) {
                    tileElement.style.transform = "translateY(-20px)";
                    tileElement.style.borderColor = "#66fcf1";
                    tileElement.style.boxShadow = "0 0 15px #66fcf1";
                }

                // Add hover shift dynamics via event triggers (only if not selected)
                tileElement.onmouseenter = () => {
                    if (selectedTileId !== tile.id) tileElement.style.transform = "translateY(-15px)";
                };
                tileElement.onmouseleave = () => {
                    if (selectedTileId !== tile.id) tileElement.style.transform = "translateY(0)";
                };
                
                // Inject the pip matrix dots layout
                tileElement.innerHTML = `
                    ${generateHalfDisplay(tile.top)}
                    <div class="domino-divider"></div>
                    ${generateHalfDisplay(tile.bottom)}
                `;
                
                // Clicking selects/unselects a specific tile
                tileElement.addEventListener("click", (e) => {
                    e.stopPropagation(); // Stop click from bubbling to layout elements
                    
                    // Toggle selection state
                    if (selectedTileId === tile.id) {
                        selectedTileId = null;
                    } else {
                        selectedTileId = tile.id;
                    }
                    
                    // Instantly redraw the hand tray to update visual borders
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
 * Handles playing the selected tile onto the board canvas track
 */
function handleBoardClick() {
    // If it's not our turn, block action
    if (localGameState.active_turn !== playerSeatNumber) {
        alert("It's not your turn yet!");
        return;
    }

    // If no tile is highlighted, do nothing
    if (!selectedTileId) {
        alert("Select a domino bone from your hand first!");
        return;
    }

    const targetKey = `player${playerSeatNumber}`;
    const playerHand = localGameState.players[targetKey].hand;
    const tileIndex = playerHand.findIndex(t => t.id === selectedTileId);
    
    if (tileIndex > -1) {
        const chosenTile = playerHand[tileIndex];
        
        // 1. Remove tile from hand array
        playerHand.splice(tileIndex, 1);
        
        // 2. Add tile to the board track line array
        const updatedBoardLine = [...localGameState.board_line, chosenTile];
        
        // 3. Cycle turn to next seating placement position (1 -> 2 -> 3 -> 4 -> 1)
        let nextTurn = localGameState.active_turn + 1;
        if (nextTurn > 4) nextTurn = 1;
        
        // 4. Update memory object mapping
        const updatedPlayersMap = { ...localGameState.players };
        updatedPlayersMap[targetKey].hand = playerHand;
        
        // Reset selection tracker
        selectedTileId = null;
        
        // 5. Fire changes directly up to your Supabase backend
        pushMoveToDatabase(updatedBoardLine, nextTurn, updatedPlayersMap);
    }
}
