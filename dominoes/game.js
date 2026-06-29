// ==========================================================================
// Tellstream Dominoes - Game Board & Player Hand Rendering Layer
// ==========================================================================

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

                <div id="domino-track-canvas" style="position: relative; width: 85%; height: 60vh; border: 4px solid #66fcf1; box-shadow: 0 0 20px #66fcf1; background: radial-gradient(circle, #1f2833 0%, #0b0c10 100%); border-radius: 12px; display: flex; justify-content: center; align-items: center;">
                    <div id="empty-track-message" style="color: #c5c6c7; font-family: sans-serif; font-size: 1.1rem; letter-spacing: 1px;">BOARD IS EMPTY - WAITING FOR INITIAL DROP</div>
                    <div id="placed-tiles-container" style="position: absolute; width: 100%; height: 100%;"></div>
                </div>

                <div id="player-hand-container" style="width: 90%; min-height: 120px; display: flex; justify-content: center; align-items: center; gap: 15px; background: rgba(31, 40, 51, 0.5); border: 1px solid rgba(102, 252, 241, 0.2); border-radius: 10px; padding: 15px; margin-bottom: 20px; box-sizing: border-box;"></div>
            </div>
        `;
        mat = document.getElementById("game-mat");
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
        // Horseshoe placement math layer goes here next
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
                tileElement.style.cssText = "width: 50px; height: 90px; background: #fff; border: 2px solid #000; border-radius: 6px; display: flex; flex-direction: column; justify-content: space-between; align-items: center; padding: 5px; box-sizing: border-box; cursor: pointer; font-family: sans-serif; font-weight: bold; font-size: 1.4rem; color: #000; box-shadow: 0 5px 10px rgba(0,0,0,0.3); transition: transform 0.2s;";
                
                // Add hover effect via JS listener controls
                tileElement.onmouseenter = () => tileElement.style.transform = "translateY(-15px)";
                tileElement.onmouseleave = () => tileElement.style.transform = "translateY(0)";
                
                // Temporary textual view setup of pips values
                tileElement.innerHTML = `
                    <div>${tile.top}</div>
                    <div style="width: 100%; border-top: 2px dashed #000;"></div>
                    <div>${tile.bottom}</div>
                `;
                
                // Clicking triggers bone selection logic
                tileElement.addEventListener("click", () => {
                    console.log(`Selected Tile ID: ${tile.id} [${tile.top}|${tile.bottom}]`);
                });

                handContainer.appendChild(tileElement);
            });
        }
    }
}
