// ==========================================================================
// Tellstream Dominoes - Game Board & Player Hand Rendering Layer
// ==========================================================================

let selectedTileId = null;

// Absolute master dimensions of table_bg.jpg
const BG_NATIVE_WIDTH = 2560;
const BG_NATIVE_HEIGHT = 1440;

// Your precise grid coordinates verified from the midpoints
const PATH_TRACK = {
    lowerY: 1180, // Halfway between 920 and 1440
    upperY: 269,  // Halfway between 92 and 446
    leftX: 420,   // Strict left vertical boundary
    rightX: 2220  // Halfway between 1790 and 2650
};

// Absolute center point for the dealt hand tray
const HAND_CENTER = {
    x: 1280,
    y: 720
};

function renderLiveTable(boardLine) {
    // ==========================================================================
    // SANDBOX 28-TILE CLOSED LOOP INJECTION
    // Automatically injects a perfect Eulerian Ring to test physical overlap
    // ==========================================================================
    if (window.localGameState && window.localGameState.room_code === "SANDBOX" && boardLine && boardLine.length <= 3) {
        boardLine = [
            { id: 'r1', top: 0, bottom: 0, displayTop: 0, displayBottom: 0 },
            { id: 'r2', top: 0, bottom: 5, displayTop: 0, displayBottom: 5 },
            { id: 'r3', top: 5, bottom: 3, displayTop: 5, displayBottom: 3 },
            { id: 'r4', top: 3, bottom: 6, displayTop: 3, displayBottom: 6 },
            { id: 'r5', top: 6, bottom: 2, displayTop: 6, displayBottom: 2 },
            { id: 'r6', top: 2, bottom: 0, displayTop: 2, displayBottom: 0 },
            { id: 'r7', top: 0, bottom: 3, displayTop: 0, displayBottom: 3 },
            { id: 'r8', top: 3, bottom: 4, displayTop: 3, displayBottom: 4 },
            { id: 'r9', top: 4, bottom: 1, displayTop: 4, displayBottom: 1 },
            { id: 'r10', top: 1, bottom: 5, displayTop: 1, displayBottom: 5 },
            { id: 'r11', top: 5, bottom: 2, displayTop: 5, displayBottom: 2 },
            { id: 'r12', top: 2, bottom: 1, displayTop: 2, displayBottom: 1 },
            { id: 'r13', top: 1, bottom: 0, displayTop: 1, displayBottom: 0 },
            { id: 'r14', top: 0, bottom: 6, displayTop: 0, displayBottom: 6 },
            { id: 'r15', top: 6, bottom: 6, displayTop: 6, displayBottom: 6 }, // INDEX 14 = Exact Center Anchor
            { id: 'r16', top: 6, bottom: 5, displayTop: 6, displayBottom: 5 },
            { id: 'r17', top: 5, bottom: 5, displayTop: 5, displayBottom: 5 },
            { id: 'r18', top: 5, bottom: 4, displayTop: 5, displayBottom: 4 },
            { id: 'r19', top: 4, bottom: 4, displayTop: 4, displayBottom: 4 },
            { id: 'r20', top: 4, bottom: 2, displayTop: 4, displayBottom: 2 },
            { id: 'r21', top: 2, bottom: 2, displayTop: 2, displayBottom: 2 },
            { id: 'r22', top: 2, bottom: 3, displayTop: 2, displayBottom: 3 },
            { id: 'r23', top: 3, bottom: 3, displayTop: 3, displayBottom: 3 },
            { id: 'r24', top: 3, bottom: 1, displayTop: 3, displayBottom: 1 },
            { id: 'r25', top: 1, bottom: 1, displayTop: 1, displayBottom: 1 },
            { id: 'r26', top: 1, bottom: 6, displayTop: 1, displayBottom: 6 },
            { id: 'r27', top: 6, bottom: 4, displayTop: 6, displayBottom: 4 },
            { id: 'r28', top: 4, bottom: 0, displayTop: 4, displayBottom: 0 }
        ];
        window.localGameState.board_line = boardLine;
        if (window.localGameState.players && window.localGameState.players.player1) {
            window.localGameState.players.player1.hand = []; // Visually clears floating hand to prevent blocking the track
        }
    }

    const tableView = document.getElementById("table-view");
    if (!tableView) return;

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
                        Room: <span id="display-room-code" style="color: #fff;">SANDBOX</span> | Turn: <span id="display-active-turn">BANTON</span>
                    </div>

                    <div id="domino-track-canvas" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%;">
                        <div id="left-play-zone" style="display: none; position: absolute; left: 0; top: 0; width: 15%; height: 100%; background: rgba(102, 252, 241, 0.12); justify-content: center; align-items: center; z-index: 20; color: #66fcf1; font-weight: bold; font-size: 0.75rem; border-right: 2px dashed #66fcf1; cursor: pointer;">PLAY LEFT</div>
                        <div id="right-play-zone" style="display: none; position: absolute; right: 0; top: 0; width: 15%; height: 100%; background: rgba(102, 252, 241, 0.12); justify-content: center; align-items: center; z-index: 20; color: #66fcf1; font-weight: bold; font-size: 0.75rem; border-left: 2px dashed #66fcf1; cursor: pointer;">PLAY RIGHT</div>
                        <div id="placed-tiles-container" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0;"></div>
                    </div>

                    <div id="player-hand-container" style="position: absolute; display: flex; justify-content: center; align-items: center; gap: 16px; background: transparent; box-sizing: border-box; z-index: 999; filter: drop-shadow(0px 12px 18px rgba(0, 0, 0, 0.95));"></div>

                    <div id="turn-alert-message" style="position: absolute; top: 59.5%; left: 50%; transform: translateX(-50%); color: #ff4a4a; font-weight: bold; font-size: 0.8rem; background: rgba(0,0,0,0.85); padding: 5px 15px; border-radius: 4px; border: 1px solid #ff4a4a; display: none; z-index: 25;"></div>
                </div>
            </div>
        `;
        mat = document.getElementById("game-mat");

        document.getElementById("domino-track-canvas").addEventListener("click", handleBoardClick);
        document.getElementById("left-play-zone").addEventListener("click", (e) => { e.stopPropagation(); processTilePlacement('left'); });
        document.getElementById("right-play-zone").addEventListener("click", (e) => { e.stopPropagation(); processTilePlacement('right'); });
    }

    document.getElementById("display-room-code").innerText = "SANDBOX";
    document.getElementById("display-active-turn").innerText = "BANTON";
    updateCornerSeatBlocks();

    const trackContainer = document.getElementById("placed-tiles-container");
    const handContainer = document.getElementById("player-hand-container");
    const leftZone = document.getElementById("left-play-zone");
    const rightZone = document.getElementById("right-play-zone");
    
    if (trackContainer) trackContainer.innerHTML = "";
    if (handContainer) handContainer.innerHTML = "";
    if (leftZone) leftZone.style.display = "none";
    if (rightZone) rightZone.style.display = "none";

    // Position Hand Container directly at your exact 1280 x 720 center point coordinates
    if (handContainer) {
        handContainer.style.left = `${(HAND_CENTER.x / BG_NATIVE_WIDTH) * 100}%`;
        handContainer.style.top = `${(HAND_CENTER.y / BG_NATIVE_HEIGHT) * 100}%`;
        handContainer.style.transform = "translate(-50%, -50%)";
        handContainer.style.width = "65%";
        handContainer.style.height = "16%";
    }

    // ==========================================================================
    // COMPLETE PATH CORNER TRACK CORRECTION MECHANISM
    // ==========================================================================
    if (boardLine && boardLine.length > 0) {
        
        let initialIndex = 14; 
        if (boardLine.length !== 28) {
            // Anchor bug fix: Standardized fallback if not playing the 28-tile demo
            initialIndex = boardLine.findIndex(tile => tile.top === tile.bottom);
            if (initialIndex === -1) initialIndex = 0;
        }

        let calculatedCoordinates = new Array(boardLine.length);

        // First Double anchors natively right in the middle of lower horizontal path
        calculatedCoordinates[initialIndex] = {
            x: PATH_TRACK.leftX + ((PATH_TRACK.rightX - PATH_TRACK.leftX) / 2) - (58 / 2),
            y: PATH_TRACK.lowerY - (119 / 2),
            isRotated: false
        };

        // TRACK LEFT SIDE CHAIN 
        for (let i = initialIndex - 1; i >= 0; i--) {
            let prevCoords = calculatedCoordinates[i + 1];
            let isDouble = boardLine[i].top === boardLine[i].bottom;
            let prevIsDouble = boardLine[i + 1].top === boardLine[i + 1].bottom;

            if (prevCoords.y > PATH_TRACK.lowerY - 60) {
                // Currently on Bottom Horizontal Track
                let currentW = isDouble ? 58 : 119;
                let nextX = prevCoords.x - currentW - 6;

                if (nextX < PATH_TRACK.leftX + 20) {
                    // Turn Corner UP to Left Wall
                    let currentH = isDouble ? 58 : 119;
                    calculatedCoordinates[i] = {
                        x: PATH_TRACK.leftX - (isDouble ? 119 / 2 : 58 / 2),
                        y: PATH_TRACK.lowerY - 60 - currentH - 6,
                        isRotated: isDouble ? true : false // standard stands, double lays flat on walls
                    };
                } else {
                    calculatedCoordinates[i] = {
                        x: nextX,
                        y: PATH_TRACK.lowerY - (isDouble ? 119 / 2 : 58 / 2),
                        isRotated: isDouble ? false : true 
                    };
                }
            } else if (prevCoords.x < PATH_TRACK.leftX + 60) {
                // Currently on Left Vertical Wall
                let currentH = isDouble ? 58 : 119;
                let nextY = prevCoords.y - currentH - 6;

                if (nextY < PATH_TRACK.upperY + 20) {
                    // Turn Corner RIGHT across Top Track
                    calculatedCoordinates[i] = {
                        x: PATH_TRACK.leftX + 60 + 6,
                        y: PATH_TRACK.upperY - (isDouble ? 119 / 2 : 58 / 2),
                        isRotated: isDouble ? false : true
                    };
                } else {
                    calculatedCoordinates[i] = {
                        x: PATH_TRACK.leftX - (isDouble ? 119 / 2 : 58 / 2),
                        y: nextY,
                        isRotated: isDouble ? true : false
                    };
                }
            } else {
                // Currently on Top Horizontal Track going RIGHT towards center
                let currentW = isDouble ? 58 : 119;
                calculatedCoordinates[i] = {
                    x: prevCoords.x + currentW + 6, 
                    y: PATH_TRACK.upperY - (isDouble ? 119 / 2 : 58 / 2),
                    isRotated: isDouble ? false : true
                };
            }
        }

        // TRACK RIGHT SIDE CHAIN 
        for (let i = initialIndex + 1; i < boardLine.length; i++) {
            let prevCoords = calculatedCoordinates[i - 1];
            let isDouble = boardLine[i].top === boardLine[i].bottom;
            let prevIsDouble = boardLine[i - 1].top === boardLine[i - 1].bottom;

            if (prevCoords.y > PATH_TRACK.lowerY - 60) {
                // Currently on Bottom Horizontal Track
                let prevW = prevIsDouble ? 58 : 119;
                let currentW = isDouble ? 58 : 119;
                let nextX = prevCoords.x + prevW + 6;

                if (nextX + currentW > PATH_TRACK.rightX - 20) {
                    // Turn Corner UP to Right Wall
                    let currentH = isDouble ? 58 : 119;
                    calculatedCoordinates[i] = {
                        x: PATH_TRACK.rightX - (isDouble ? 119 / 2 : 58 / 2),
                        y: PATH_TRACK.lowerY - 60 - currentH - 6,
                        isRotated: isDouble ? true : false 
                    };
                } else {
                    calculatedCoordinates[i] = {
                        x: nextX,
                        y: PATH_TRACK.lowerY - (isDouble ? 119 / 2 : 58 / 2),
                        isRotated: isDouble ? false : true
                    };
                }
            } else if (prevCoords.x > PATH_TRACK.rightX - 60) {
                // Currently on Right Vertical Wall
                let currentH = isDouble ? 58 : 119;
                let nextY = prevCoords.y - currentH - 6;

                if (nextY < PATH_TRACK.upperY + 20) {
                    // Turn Corner LEFT across Top Track
                    let currentW = isDouble ? 58 : 119;
                    calculatedCoordinates[i] = {
                        x: PATH_TRACK.rightX - 60 - currentW - 6,
                        y: PATH_TRACK.upperY - (isDouble ? 119 / 2 : 58 / 2),
                        isRotated: isDouble ? false : true
                    };
                } else {
                    calculatedCoordinates[i] = {
                        x: PATH_TRACK.rightX - (isDouble ? 119 / 2 : 58 / 2),
                        y: nextY,
                        isRotated: isDouble ? true : false
                    };
                }
            } else {
                // Currently on Top Horizontal Track going LEFT towards center
                let currentW = isDouble ? 58 : 119;
                calculatedCoordinates[i] = {
                    x: prevCoords.x - currentW - 6, 
                    y: PATH_TRACK.upperY - (isDouble ? 119 / 2 : 58 / 2),
                    isRotated: isDouble ? false : true
                };
            }
        }

        // Render everything directly as precise background image percentage mappings
        boardLine.forEach((tile, index) => {
            const coords = calculatedCoordinates[index];
            const placedTile = document.createElement("div");
            placedTile.style.position = "absolute";
            placedTile.style.left = `${(coords.x / BG_NATIVE_WIDTH) * 100}%`;
            placedTile.style.top = `${(coords.y / BG_NATIVE_HEIGHT) * 100}%`;
            placedTile.style.cursor = "default";
            placedTile.style.margin = "0";

            if (!coords.isRotated) {
                placedTile.className = "domino-bone-interactive";
                placedTile.innerHTML = `
                    ${generateHalfDisplay(tile.displayTop, false)}
                    <div style="width: 100%; height: 2px; background: #1a1a1a; flex-shrink: 0;" class="domino-divider-horizontal"></div>
                    ${generateHalfDisplay(tile.displayBottom, false)}
                `;
            } else {
                placedTile.className = "domino-bone-interactive domino-flat-track";
                placedTile.innerHTML = `
                    ${generateHalfDisplay(tile.displayTop, true)}
                    <div style="width: 2px; height: 100%; background: #1a1a1a; flex-shrink: 0;" class="domino-divider"></div>
                    ${generateHalfDisplay(tile.displayBottom, true)}
                `;
            }
            trackContainer.appendChild(placedTile);
        });
    }

    // 2. RENDER PLAYER HAND
    if (window.localGameState && window.localGameState.players && window.localGameState.players.player1) {
        const hand = window.localGameState.players.player1.hand || [];
        hand.forEach(tile => {
            const tileElement = document.createElement("div");
            tileElement.className = "domino-bone-interactive";
            tileElement.id = `hand-tile-${tile.id}`;
            tileElement.style.flexShrink = "0";
            
            if (selectedTileId === tile.id) {
                tileElement.style.transform = "translateY(-16px)";
                tileElement.style.borderColor = "#66fcf1";
                tileElement.style.boxShadow = "0 0 16px #66fcf1";
                displayValidPlacements(tile);
            }

            tileElement.onmouseenter = () => {
                if (selectedTileId !== tile.id) tileElement.style.transform = "translateY(-8px)";
            };
            tileElement.onmouseleave = () => {
                if (selectedTileId !== tile.id) tileElement.style.transform = "translateY(0)";
            };
            
            tileElement.innerHTML = `
                ${generateHalfDisplay(tile.top, false)}
                <div style="width: 100%; height: 2px; background: #1a1a1a; flex-shrink: 0; position: relative;" class="domino-divider"></div>
                ${generateHalfDisplay(tile.bottom, false)}
            `;
            
            tileElement.addEventListener("click", (e) => {
                e.stopPropagation(); 
                selectedTileId = (selectedTileId === tile.id) ? null : tile.id;
                renderLiveTable(window.localGameState.board_line);
            });

            handContainer.appendChild(tileElement);
        });
    }
}

function updateCornerSeatBlocks() {
    for (let i = 1; i <= 4; i++) {
        const block = document.getElementById(`seat-block-${i}`);
        if (!block) continue;
        block.style.display = "flex";
        
        if (i === 1) {
            block.style.backgroundColor = "rgba(11, 12, 16, 0.95)";
            block.style.borderColor = "#66fcf1";
            block.style.boxShadow = "0 0 15px rgba(102, 252, 241, 0.5)";
            block.innerHTML = `<strong style="color: #66fcf1;">Banton</strong><span style="color: rgba(255,255,255,0.15); margin: 0 3px;">|</span><span style="color: #fff;">Bones: 7</span>`;
        } else if (i === 2) {
            block.style.backgroundColor = "rgba(11, 12, 16, 0.85)";
            block.style.borderColor = "rgba(102, 252, 241, 0.2)";
            block.style.boxShadow = "none";
            block.innerHTML = `<strong style="color: #66fcf1;">TellaSecurity</strong><span style="color: rgba(255,255,255,0.15); margin: 0 3px;">|</span><span style="color: #fff;">Bones: 7</span>`;
        } else {
            block.style.backgroundColor = "rgba(11, 12, 16, 0.85)";
            block.style.borderColor = "rgba(255,255,255,0.05)";
            block.style.boxShadow = "none";
            block.innerHTML = `<span style="color: #444; font-weight: bold;">P${i}</span><span style="color: rgba(255,255,255,0.15); margin: 0 4px;">|</span><span style="color: #444;">Empty</span>`;
        }
    }
}

function generateHalfDisplay(value, isHorizontal = false) {
    const pipMaps = {
        0: [],
        1: [4],
        2: isHorizontal ? [3, 7] : [1, 7],
        3: isHorizontal ? [3, 4, 7] : [1, 4, 7],
        4: [1, 2, 6, 7],
        5: [1, 2, 4, 6, 7],
        6: isHorizontal ? [1, 2, 3, 5, 6, 7] : [1, 2, 3, 5, 6, 7]
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

function displayValidPlacements(tile) {
    const line = window.localGameState.board_line;
    const leftZone = document.getElementById("left-play-zone");
    const rightZone = document.getElementById("right-play-zone");
    if (!line || line.length === 0) return; 

    const openLeft = line[0].displayTop;
    const openRight = line[line.length - 1].displayBottom;

    if (tile.top === openLeft || tile.bottom === openLeft) leftZone.style.display = "flex";
    if (tile.top === openRight || tile.bottom === openRight) rightZone.style.display = "flex";
}

function handleBoardClick() {
    const line = window.localGameState.board_line;
    if (!line || line.length === 0) processTilePlacement('initial');
}

function processTilePlacement(targetSide) {
    const playerHand = window.localGameState.players.player1.hand;
    const tileIndex = playerHand.findIndex(t => t.id === selectedTileId);
    if (tileIndex === -1) return;
    
    const chosenTile = playerHand[tileIndex];
    let updatedBoardLine = [...window.localGameState.board_line];

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
    window.localGameState.board_line = updatedBoardLine;
    window.localGameState.players.player1.hand = playerHand;
    
    selectedTileId = null;
    renderLiveTable(window.localGameState.board_line);
}
