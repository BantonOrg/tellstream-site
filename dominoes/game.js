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
const HAND_CENTER = { x: 1280, y: 720 };

function renderLiveTable(boardLine) {
    // ==========================================================================
    // SANDBOX 28-TILE CLOSED LOOP INJECTION
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
            window.localGameState.players.player1.hand = []; 
        }
    }

    const tableView = document.getElementById("table-view");
    if (!tableView) return;

    let mat = document.getElementById("game-mat");
    if (!mat || !document.getElementById("domino-track-canvas")) {
        tableView.innerHTML = `
            <style id="dynamic-45-scale">
                .domino-bone-interactive { width: 84px !important; height: 173px !important; }
                .domino-bone-interactive.domino-flat-track { width: 173px !important; height: 84px !important; flex-direction: row !important; }
                .domino-half { width: 70px !important; height: 70px !important; padding: 6px !important; }
                .pip { width: 12px !important; height: 12px !important; }
                .domino-divider::after { width: 6px !important; height: 6px !important; }
            </style>

            <div id="game-mat" style="position: relative; width: 100vw; height: 100vh; background-image: url('assets/table_bg.jpg'); background-size: cover; background-repeat: no-repeat; background-position: center; display: flex; justify-content: center; align-items: center; overflow: hidden; box-sizing: border-box;">
                <div id="scaled-table-canvas-root" style="position: absolute; display: flex; justify-content: center; align-items: center;">
                    
                    <div id="seat-block-1" style="position: absolute; top: 30px; left: 30px; padding: 12px 28px; background: rgba(11,12,16,0.85); border: 2px solid rgba(102,252,241,0.2); border-radius: 8px; font-size: 1.5rem; z-index: 10; display: flex; gap: 16px; align-items: center; white-space: nowrap;"></div>
                    <div id="seat-block-2" style="position: absolute; top: 30px; right: 30px; padding: 12px 28px; background: rgba(11,12,16,0.85); border: 2px solid rgba(102,252,241,0.2); border-radius: 8px; font-size: 1.5rem; z-index: 10; display: flex; gap: 16px; align-items: center; white-space: nowrap;"></div>
                    <div id="seat-block-3" style="position: absolute; bottom: 50px; right: 30px; padding: 12px 28px; background: rgba(11,12,16,0.85); border: 2px solid rgba(102,252,241,0.2); border-radius: 8px; font-size: 1.5rem; z-index: 10; display: flex; gap: 16px; align-items: center; white-space: nowrap;"></div>
                    <div id="seat-block-4" style="position: absolute; bottom: 50px; left: 30px; padding: 12px 28px; background: rgba(11,12,16,0.85); border: 2px solid rgba(102,252,241,0.2); border-radius: 8px; font-size: 1.5rem; z-index: 10; display: flex; gap: 16px; align-items: center; white-space: nowrap;"></div>

                    <div id="table-status-header" style="position: absolute; top: 40px; left: 50%; transform: translateX(-50%); color: #66fcf1; font-size: 1.8rem; letter-spacing: 2px; text-transform: uppercase; z-index: 10; font-weight: bold; background: rgba(0,0,0,0.6); padding: 8px 24px; border-radius: 40px;">
                        Room: <span id="display-room-code" style="color: #fff;">SANDBOX</span> | Turn: <span id="display-active-turn">BANTON</span>
                    </div>

                    <div id="domino-track-canvas" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%;">
                        <div id="left-play-zone" style="display: none; position: absolute; left: 0; top: 0; width: 15%; height: 100%; background: rgba(102, 252, 241, 0.12); justify-content: center; align-items: center; z-index: 20; color: #66fcf1; font-weight: bold; font-size: 1.5rem; border-right: 4px dashed #66fcf1; cursor: pointer;">PLAY LEFT</div>
                        <div id="right-play-zone" style="display: none; position: absolute; right: 0; top: 0; width: 15%; height: 100%; background: rgba(102, 252, 241, 0.12); justify-content: center; align-items: center; z-index: 20; color: #66fcf1; font-weight: bold; font-size: 1.5rem; border-left: 4px dashed #66fcf1; cursor: pointer;">PLAY RIGHT</div>
                        <div id="placed-tiles-container" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0;"></div>
                    </div>

                    <div id="player-hand-container" style="position: absolute; display: flex; justify-content: center; align-items: center; gap: 20px; background: transparent; box-sizing: border-box; z-index: 999; filter: drop-shadow(0px 16px 24px rgba(0, 0, 0, 0.95));"></div>
                </div>
            </div>
        `;

        const rootCanvas = document.getElementById("scaled-table-canvas-root");
        rootCanvas.style.width = "2560px";
        rootCanvas.style.height = "1440px";
        
        function resizeBoard() {
            const mat = document.getElementById("game-mat");
            if (!mat || !rootCanvas) return;
            const scale = Math.min(mat.clientWidth / 2560, mat.clientHeight / 1440);
            rootCanvas.style.transform = `scale(${scale})`;
        }
        window.addEventListener("resize", resizeBoard);
        resizeBoard(); 

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

    if (handContainer) {
        handContainer.style.left = "1280px";
        handContainer.style.top = "720px";
        handContainer.style.transform = "translate(-50%, -50%)";
        handContainer.style.width = "1664px";
        handContainer.style.height = "230px";
    }

    // ==========================================================================
    // DYNAMIC LOOKAHEAD CURSOR ENGINE (Prevents Overshoot at corners)
    // ==========================================================================
    if (boardLine && boardLine.length > 0) {
        let initialIndex = 14; 
        if (boardLine.length !== 28) {
            initialIndex = boardLine.findIndex(tile => tile.top === tile.bottom);
            if (initialIndex === -1) initialIndex = 0;
        }

        let calculatedCoordinates = new Array(boardLine.length);
        const GAP = 6;
        
        // 1. PLACE ANCHOR
        let anchorIsDouble = boardLine[initialIndex].top === boardLine[initialIndex].bottom;
        calculatedCoordinates[initialIndex] = {
            x: 1280, y: PATH_TRACK.lowerY,
            isRotated: anchorIsDouble ? false : true,
            flipVisuals: false
        };

        let anchorW = anchorIsDouble ? 84 : 173;
        let anchorH = anchorIsDouble ? 173 : 84;

        // 2. RUN LEFT CHAIN
        let stateL = 'LEFT_BOTTOM';
        let prevXL = 1280, prevYL = PATH_TRACK.lowerY, prevWL = anchorW, prevHL = anchorH;

        for (let i = initialIndex - 1; i >= 0; i--) {
            let isDouble = boardLine[i].top === boardLine[i].bottom;
            let w, h, x, y, rot, flip;

            if (stateL === 'LEFT_BOTTOM') {
                w = isDouble ? 84 : 173; h = isDouble ? 173 : 84; rot = isDouble ? false : true; flip = false;
                let nextX = prevXL - (prevWL/2) - GAP - (w/2);
                if (nextX - (w/2) < PATH_TRACK.leftX) {
                    stateL = 'UP_LEFT';
                    w = isDouble ? 173 : 84; h = isDouble ? 84 : 173; rot = isDouble ? true : false; flip = false;
                    x = PATH_TRACK.leftX;
                    y = prevYL - (prevHL/2) - GAP - (h/2);
                } else { x = nextX; y = PATH_TRACK.lowerY; }
            } else if (stateL === 'UP_LEFT') {
                w = isDouble ? 173 : 84; h = isDouble ? 84 : 173; rot = isDouble ? true : false; flip = false;
                let nextY = prevYL - (prevHL/2) - GAP - (h/2);
                if (nextY - (h/2) < PATH_TRACK.upperY) {
                    stateL = 'RIGHT_TOP';
                    w = isDouble ? 84 : 173; h = isDouble ? 173 : 84; rot = isDouble ? false : true; flip = true;
                    x = prevXL + (prevWL/2) + GAP + (w/2);
                    y = PATH_TRACK.upperY;
                } else { x = PATH_TRACK.leftX; y = nextY; }
            } else if (stateL === 'RIGHT_TOP') {
                w = isDouble ? 84 : 173; h = isDouble ? 173 : 84; rot = isDouble ? false : true; flip = true;
                x = prevXL + (prevWL/2) + GAP + (w/2); y = PATH_TRACK.upperY;
            }

            calculatedCoordinates[i] = { x, y, isRotated: rot, flipVisuals: flip };
            prevXL = x; prevYL = y; prevWL = w; prevHL = h;
        }

        // 3. RUN RIGHT CHAIN
        let stateR = 'RIGHT_BOTTOM';
        let prevXR = 1280, prevYR = PATH_TRACK.lowerY, prevWR = anchorW, prevHR = anchorH;

        for (let i = initialIndex + 1; i < boardLine.length; i++) {
            let isDouble = boardLine[i].top === boardLine[i].bottom;
            let w, h, x, y, rot, flip;

            if (stateR === 'RIGHT_BOTTOM') {
                w = isDouble ? 84 : 173; h = isDouble ? 173 : 84; rot = isDouble ? false : true; flip = false;
                let nextX = prevXR + (prevWR/2) + GAP + (w/2);
                if (nextX + (w/2) > PATH_TRACK.rightX) {
                    stateR = 'UP_RIGHT';
                    w = isDouble ? 173 : 84; h = isDouble ? 84 : 173; rot = isDouble ? true : false; flip = true;
                    x = PATH_TRACK.rightX;
                    y = prevYR - (prevHR/2) - GAP - (h/2);
                } else { x = nextX; y = PATH_TRACK.lowerY; }
            } else if (stateR === 'UP_RIGHT') {
                w = isDouble ? 173 : 84; h = isDouble ? 84 : 173; rot = isDouble ? true : false; flip = true;
                let nextY = prevYR - (prevHR/2) - GAP - (h/2);
                if (nextY - (h/2) < PATH_TRACK.upperY) {
                    stateR = 'LEFT_TOP';
                    w = isDouble ? 84 : 173; h = isDouble ? 173 : 84; rot = isDouble ? false : true; flip = true;
                    x = prevXR - (prevWR/2) - GAP - (w/2);
                    y = PATH_TRACK.upperY;
                } else { x = PATH_TRACK.rightX; y = nextY; }
            } else if (stateR === 'LEFT_TOP') {
                w = isDouble ? 84 : 173; h = isDouble ? 173 : 84; rot = isDouble ? false : true; flip = true;
                x = prevXR - (prevWR/2) - GAP - (w/2); y = PATH_TRACK.upperY;
            }

            calculatedCoordinates[i] = { x, y, isRotated: rot, flipVisuals: flip };
            prevXR = x; prevYR = y; prevWR = w; prevHR = h;
        }

        // 4. RENDER EXACT COORDINATES
        boardLine.forEach((tile, index) => {
            const coords = calculatedCoordinates[index];
            const placedTile = document.createElement("div");
            placedTile.style.position = "absolute";
            
            let width = coords.isRotated ? 173 : 84;
            let height = coords.isRotated ? 84 : 173;
            
            placedTile.style.left = Math.round(coords.x - width / 2) + "px";
            placedTile.style.top = Math.round(coords.y - height / 2) + "px";
            placedTile.style.cursor = "default";
            placedTile.style.margin = "0";
            placedTile.className = coords.isRotated ? "domino-bone-interactive domino-flat-track" : "domino-bone-interactive";

            let topHalf = generateHalfDisplay(tile.displayTop, coords.isRotated);
            let bottomHalf = generateHalfDisplay(tile.displayBottom, coords.isRotated);
            let divStyle = coords.isRotated ? "width: 2px; height: 100%;" : "width: 100%; height: 2px;";
            
            if (coords.flipVisuals) {
                placedTile.innerHTML = `${bottomHalf}<div style="${divStyle} background: #1a1a1a; flex-shrink: 0;" class="domino-divider"></div>${topHalf}`;
            } else {
                placedTile.innerHTML = `${topHalf}<div style="${divStyle} background: #1a1a1a; flex-shrink: 0;" class="domino-divider"></div>${bottomHalf}`;
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
                tileElement.style.boxShadow = "0 0 20px #66fcf1";
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
    // CORRECTED PIP MAP: Forces structural rotation for flat tiles
    const pipMaps = {
        0: [],
        1: [4],
        2: isHorizontal ? [6, 2] : [1, 7],
        3: isHorizontal ? [6, 4, 2] : [1, 4, 7],
        4: [1, 2, 6, 7],
        5: [1, 2, 4, 6, 7],
        6: isHorizontal ? [1, 8, 2, 6, 9, 7] : [1, 2, 3, 5, 6, 7]
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
