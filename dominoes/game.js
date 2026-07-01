// ==========================================================================
// Tellstream Dominoes - Game Board & Player Hand Rendering Layer
// ==========================================================================

let selectedTileId = null;

// Absolute master dimensions of table_bg.jpg
const BG_NATIVE_WIDTH = 2560;
const BG_NATIVE_HEIGHT = 1440;

// Your precise grid coordinates verified from the midpoints
const PATH_TRACK = {
    lowerY: 1266, // Lowered by ~half a tile (from 1180)
    upperY: 269,  // Halfway between 92 and 446
    leftX: 240,   // Widened left by 1 tile width (from 420)
    rightX: 2400  // Widened right by 1 tile width (from 2220)
};

// Absolute center point for the dealt hand tray (moved down between graphic and bottom track)
const HAND_CENTER = { x: 1280, y: 1020 };

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

            <div id="game-mat" style="position: relative; width: 100vw; height: 100vh; background-color: #0b0c10; display: flex; justify-content: center; align-items: center; overflow: hidden; box-sizing: border-box;">
                <div id="scaled-table-canvas-root" style="position: absolute; display: flex; justify-content: center; align-items: center; background-image: url('assets/table_bg.jpg'); background-size: 100% 100%; background-repeat: no-repeat; background-position: center;">
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
        handContainer.style.top = "1020px";
        handContainer.style.transform = "translate(-50%, -50%)";
        handContainer.style.width = "1664px";
        handContainer.style.height = "230px";
    }

    // ==========================================================================
    // DYNAMIC A/B BOSS-ANCHOR PATHING ENGINE
    // ==========================================================================
    
    function getCornerChoices(state, prevX, prevY, prevIsDouble, currIsDouble) {
        let A, B;
        if (state === 'LEFT_BOTTOM_TO_UP_LEFT') {
            if (!prevIsDouble && !currIsDouble) {
                A = { x: prevX - 43.25, y: prevY - 134.5, isRotated: false, flipVisuals: false };
                B = { x: prevX + 43.25, y: prevY - 134.5, isRotated: false, flipVisuals: false };
            } else if (!prevIsDouble && currIsDouble) {
                A = { x: prevX - 134.5, y: prevY, isRotated: false, flipVisuals: false };
                B = A;
            } else if (prevIsDouble && !currIsDouble) {
                A = { x: prevX + 134.5, y: prevY - 43.25, isRotated: true, flipVisuals: false };
                B = { x: prevX, y: prevY - 179, isRotated: false, flipVisuals: false };
            } else { A = { x: prevX, y: prevY - 179, isRotated: false, flipVisuals: false }; B = A; }
        }
        else if (state === 'RIGHT_BOTTOM_TO_UP_RIGHT') {
            if (!prevIsDouble && !currIsDouble) { 
                A = { x: prevX + 43.25, y: prevY - 134.5, isRotated: false, flipVisuals: true };
                B = { x: prevX - 43.25, y: prevY - 134.5, isRotated: false, flipVisuals: true };
            } else if (!prevIsDouble && currIsDouble) { 
                A = { x: prevX + 134.5, y: prevY, isRotated: false, flipVisuals: true };
                B = A;
            } else if (prevIsDouble && !currIsDouble) { 
                A = { x: prevX - 134.5, y: prevY - 43.25, isRotated: true, flipVisuals: true }; 
                B = { x: prevX, y: prevY - 179, isRotated: false, flipVisuals: true };
            } else { A = { x: prevX, y: prevY - 179, isRotated: false, flipVisuals: true }; B = A; }
        }
        else if (state === 'UP_LEFT_TO_RIGHT_TOP') {
            if (!prevIsDouble && !currIsDouble) {
                A = { x: prevX + 134.5, y: prevY - 43.25, isRotated: true, flipVisuals: true };
                B = { x: prevX + 134.5, y: prevY + 43.25, isRotated: true, flipVisuals: true };
            } else if (!prevIsDouble && currIsDouble) {
                A = { x: prevX, y: prevY - 134.5, isRotated: true, flipVisuals: true };
                B = A;
            } else if (prevIsDouble && !currIsDouble) {
                A = { x: prevX + 43.25, y: prevY + 134.5, isRotated: false, flipVisuals: true };
                B = { x: prevX + 179, y: prevY, isRotated: true, flipVisuals: true };
            } else { A = { x: prevX + 179, y: prevY, isRotated: true, flipVisuals: true }; B = A; }
        }
        else if (state === 'UP_RIGHT_TO_LEFT_TOP') {
            if (!prevIsDouble && !currIsDouble) {
                A = { x: prevX - 134.5, y: prevY - 43.25, isRotated: true, flipVisuals: true };
                B = { x: prevX - 134.5, y: prevY + 43.25, isRotated: true, flipVisuals: true };
            } else if (!prevIsDouble && currIsDouble) {
                A = { x: prevX, y: prevY - 134.5, isRotated: true, flipVisuals: true };
                B = A;
            } else if (prevIsDouble && !currIsDouble) {
                A = { x: prevX - 43.25, y: prevY + 134.5, isRotated: false, flipVisuals: true };
                B = { x: prevX - 179, y: prevY, isRotated: true, flipVisuals: true };
            } else { A = { x: prevX - 179, y: prevY, isRotated: true, flipVisuals: true }; B = A; }
        }
        return [A, B];
    }

    // Guarantees perfect geometric continuation and prevents track from folding backwards over itself
    function getForwardCorner(optA, optB, prevIsDouble, currIsDouble) {
        if (prevIsDouble && !currIsDouble) return optB;
        return optA;
    }

    if (boardLine && boardLine.length > 0) {
        let initialIndex = 14; 
        if (boardLine.length !== 28) {
            initialIndex = boardLine.findIndex(tile => tile.top === tile.bottom);
            if (initialIndex === -1) initialIndex = 0;
        }

        let calculatedCoordinates = new Array(boardLine.length);
        const GAP = 6;
        
        let anchorIsDouble = boardLine[initialIndex].top === boardLine[initialIndex].bottom;
        calculatedCoordinates[initialIndex] = {
            x: 1280, y: PATH_TRACK.lowerY,
            isRotated: anchorIsDouble ? false : true, flipVisuals: false,
            w: anchorIsDouble ? 84 : 173, h: anchorIsDouble ? 173 : 84,
            isDouble: anchorIsDouble
        };

        // RUN LEFT CHAIN
        let stateL = 'LEFT_BOTTOM';
        for (let i = initialIndex - 1; i >= 0; i--) {
            let prev = calculatedCoordinates[i + 1];
            let currIsDouble = boardLine[i].top === boardLine[i].bottom;
            let currW, currH, nextX, nextY, rot, flip;

            if (stateL === 'LEFT_BOTTOM') {
                currW = currIsDouble ? 84 : 173; currH = currIsDouble ? 173 : 84; rot = currIsDouble ? false : true; flip = false;
                nextX = prev.x - prev.w/2 - GAP - currW/2;
                if (nextX - currW/2 < PATH_TRACK.leftX) {
                    stateL = 'UP_LEFT';
                    let [optA, optB] = getCornerChoices('LEFT_BOTTOM_TO_UP_LEFT', prev.x, prev.y, prev.isDouble, currIsDouble);
                    let best = getForwardCorner(optA, optB, prev.isDouble, currIsDouble);
                    calculatedCoordinates[i] = { x: best.x, y: best.y, isRotated: best.isRotated, flipVisuals: best.flipVisuals, w: best.isRotated ? 173 : 84, h: best.isRotated ? 84 : 173, isDouble: currIsDouble };
                } else {
                    calculatedCoordinates[i] = { x: nextX, y: PATH_TRACK.lowerY, isRotated: rot, flipVisuals: flip, w: currW, h: currH, isDouble: currIsDouble };
                }
            } else if (stateL === 'UP_LEFT') {
                currW = currIsDouble ? 173 : 84; currH = currIsDouble ? 84 : 173; rot = currIsDouble ? true : false; flip = false;
                nextY = prev.y - prev.h/2 - GAP - currH/2;
                if (nextY - currH/2 < PATH_TRACK.upperY) {
                    stateL = 'RIGHT_TOP';
                    let [optA, optB] = getCornerChoices('UP_LEFT_TO_RIGHT_TOP', prev.x, prev.y, prev.isDouble, currIsDouble);
                    let best = getForwardCorner(optA, optB, prev.isDouble, currIsDouble);
                    calculatedCoordinates[i] = { x: best.x, y: best.y, isRotated: best.isRotated, flipVisuals: best.flipVisuals, w: best.isRotated ? 173 : 84, h: best.isRotated ? 84 : 173, isDouble: currIsDouble };
                } else {
                    calculatedCoordinates[i] = { x: prev.x, y: nextY, isRotated: rot, flipVisuals: flip, w: currW, h: currH, isDouble: currIsDouble };
                }
            } else if (stateL === 'RIGHT_TOP') {
                currW = currIsDouble ? 84 : 173; currH = currIsDouble ? 173 : 84; rot = currIsDouble ? false : true; flip = true;
                nextX = prev.x + prev.w/2 + GAP + currW/2;
                calculatedCoordinates[i] = { x: nextX, y: prev.y, isRotated: rot, flipVisuals: flip, w: currW, h: currH, isDouble: currIsDouble };
            }
        }

        // RUN RIGHT CHAIN
        let stateR = 'RIGHT_BOTTOM';
        for (let i = initialIndex + 1; i < boardLine.length; i++) {
            let prev = calculatedCoordinates[i - 1];
            let currIsDouble = boardLine[i].top === boardLine[i].bottom;
            let currW, currH, nextX, nextY, rot, flip;

            if (stateR === 'RIGHT_BOTTOM') {
                currW = currIsDouble ? 84 : 173; currH = currIsDouble ? 173 : 84; rot = currIsDouble ? false : true; flip = false;
                nextX = prev.x + prev.w/2 + GAP + currW/2;
                if (nextX + currW/2 > PATH_TRACK.rightX) {
                    stateR = 'UP_RIGHT';
                    let [optA, optB] = getCornerChoices('RIGHT_BOTTOM_TO_UP_RIGHT', prev.x, prev.y, prev.isDouble, currIsDouble);
                    let best = getForwardCorner(optA, optB, prev.isDouble, currIsDouble);
                    calculatedCoordinates[i] = { x: best.x, y: best.y, isRotated: best.isRotated, flipVisuals: best.flipVisuals, w: best.isRotated ? 173 : 84, h: best.isRotated ? 84 : 173, isDouble: currIsDouble };
                } else {
                    calculatedCoordinates[i] = { x: nextX, y: prev.y, isRotated: rot, flipVisuals: flip, w: currW, h: currH, isDouble: currIsDouble };
                }
            } else if (stateR === 'UP_RIGHT') {
                currW = currIsDouble ? 173 : 84; currH = currIsDouble ? 84 : 173; rot = currIsDouble ? true : false; flip = true;
                nextY = prev.y - prev.h/2 - GAP - currH/2;
                if (nextY - currH/2 < PATH_TRACK.upperY) {
                    stateR = 'LEFT_TOP';
                    let [optA, optB] = getCornerChoices('UP_RIGHT_TO_LEFT_TOP', prev.x, prev.y, prev.isDouble, currIsDouble);
                    let best = getForwardCorner(optA, optB, prev.isDouble, currIsDouble);
                    calculatedCoordinates[i] = { x: best.x, y: best.y, isRotated: best.isRotated, flipVisuals: best.flipVisuals, w: best.isRotated ? 173 : 84, h: best.isRotated ? 84 : 173, isDouble: currIsDouble };
                } else {
                    calculatedCoordinates[i] = { x: prev.x, y: nextY, isRotated: rot, flipVisuals: flip, w: currW, h: currH, isDouble: currIsDouble };
                }
            } else if (stateR === 'LEFT_TOP') {
                currW = currIsDouble ? 84 : 173; currH = currIsDouble ? 173 : 84; rot = currIsDouble ? false : true; flip = true;
                nextX = prev.x - prev.w/2 - GAP - currW/2;
                calculatedCoordinates[i] = { x: nextX, y: prev.y, isRotated: rot, flipVisuals: flip, w: currW, h: currH, isDouble: currIsDouble };
            }
        }

        // RENDER PIXEL-PERFECT COORDINATES
        boardLine.forEach((tile, index) => {
            const coords = calculatedCoordinates[index];
            const placedTile = document.createElement("div");
            placedTile.style.position = "absolute";
            
            placedTile.style.left = Math.round(coords.x - coords.w / 2) + "px";
            placedTile.style.top = Math.round(coords.y - coords.h / 2) + "px";
            placedTile.style.cursor = "default";
            placedTile.style.margin = "0";
            placedTile.className = coords.isRotated ? "domino-bone-interactive domino-flat-track" : "domino-bone-interactive";

            let topHalf = generateHalfDisplay(tile.displayTop, coords.isRotated);
            let bottomHalf = generateHalfDisplay(tile.displayBottom, coords.isRotated);
            let divStyle = coords.isRotated ? "width: 2px; height: 100%;" : "width: 100%; height: 2px;";
            
            if (coords.flipVisuals) {
                placedTile.innerHTML = `${bottomHalf}<div style="${divStyle} background: #1a1a1a; flex-shrink: 0;" class="domino
