// ==========================================================================
// Tellstream Dominoes - Unified Vertical Canvas Generation & Placement Layer
// ==========================================================================

let selectedTileId = null;

// Absolute master dimensions of table_bg.jpg
const BG_NATIVE_WIDTH = 2560;
const BG_NATIVE_HEIGHT = 1440;

// Your precise grid coordinates verified from the midpoints
const PATH_TRACK = {
    lowerY: 1180, // Halfway between 920 and 1440
    upperY: 95,   // Shifted up -> Moves top row up by ~174px
    leftX: 245,   // Shifted left -> Moves left corner out by 175px
    rightX: 2220  // Restored original right boundary point
};

// Global active skin tracker - hooks into board settings (can be changed to 'skin-premium' or 'skin-rasta')
window.activeSkinClass = 'skin-classic';

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
            <div id="game-mat" style="position: relative; width: 100vw; height: 100vh; background-color: #0b0c10; display: flex; justify-content: center; align-items: center; overflow: hidden; box-sizing: border-box;">
                <div id="scaled-table-canvas-root" style="position: absolute; display: flex; justify-content: center; align-items: center; background-image: url('assets/table_bg.jpg'); background-size: 100% 100%; background-repeat: no-repeat; background-position: center; flex-shrink: 0;">
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
    // DYNAMIC A/B BOSS-ANCHOR PATHING ENGINE
    // ==========================================================================
    function getCornerChoices(state, prevX, prevY, prevIsDouble, currIsDouble) {
        let A, B;
        if (state === 'LEFT_BOTTOM_TO_UP_LEFT') {
            if (!prevIsDouble && !currIsDouble) {
                A = { x: prevX - 43.25, y: prevY - 134.5, angle: 0, flipVisuals: false };
                B = { x: prevX + 43.25, y: prevY - 134.5, angle: 0, flipVisuals: false };
            } else if (!prevIsDouble && currIsDouble) {
                A = { x: prevX - 134.5, y: prevY, angle: 0, flipVisuals: false };
                B = A;
            } else if (prevIsDouble && !currIsDouble) {
                A = { x: prevX + 134.5, y: prevY - 43.25, angle: 90, flipVisuals: false };
                B = { x: prevX, y: prevY - 179, angle: 0, flipVisuals: false };
            } else { A = { x: prevX, y: prevY - 179, angle: 0, flipVisuals: false }; B = A; }
        }
        else if (state === 'RIGHT_BOTTOM_TO_UP_RIGHT') {
            if (!prevIsDouble && !currIsDouble) { 
                A = { x: prevX + 43.25, y: prevY - 134.5, angle: 0, flipVisuals: true };
                B = { x: prevX - 43.25, y: prevY - 134.5, angle: 0, flipVisuals: true };
            } else if (!prevIsDouble && currIsDouble) { 
                A = { x: prevX + 134.5, y: prevY, angle: 0, flipVisuals: true };
                B = A;
            } else if (prevIsDouble && !currIsDouble) { 
                A = { x: prevX - 134.5, y: prevY - 43.25, angle: 90, flipVisuals: true }; 
                B = { x: prevX, y: prevY - 179, angle: 0, flipVisuals: true };
            } else { A = { x: prevX, y: prevY - 179, angle: 0, flipVisuals: true }; B = A; }
        }
        else if (state === 'UP_LEFT_TO_RIGHT_TOP') {
            if (!prevIsDouble && !currIsDouble) {
                A = { x: prevX + 134.5, y: prevY - 43.25, angle: 90, flipVisuals: true };
                B = { x: prevX + 134.5, y: prevY + 43.25, angle: 90, flipVisuals: true };
            } else if (!prevIsDouble && currIsDouble) {
                A = { x: prevX, y: prevY - 134.5, angle: 90, flipVisuals: true };
                B = A;
            } else if (prevIsDouble && !currIsDouble) {
                A = { x: prevX + 43.25, y: prevY + 134.5, angle: 0, flipVisuals: true };
                B = { x: prevX + 179, y: prevY, angle: 90, flipVisuals: true };
            } else { A = { x: prevX + 179, y: prevY, angle: 90, flipVisuals: true }; B = A; }
        }
        else if (state === 'UP_RIGHT_TO_LEFT_TOP') {
            if (!prevIsDouble && !currIsDouble) {
                A = { x: prevX - 134.5, y: prevY - 43.25, angle: 90, flipVisuals: true };
                B = { x: prevX - 134.5, y: prevY + 43.25, angle: 90, flipVisuals: true };
            } else if (!prevIsDouble && currIsDouble) {
                A = { x: prevX, y: prevY - 134.5, angle: 90, flipVisuals: true };
                B = a;
            } else if (prevIsDouble && !currIsDouble) {
                A = { x: prevX - 43.25, y: prevY + 134.5, angle: 0, flipVisuals: true };
                B = { x: prevX - 179, y: prevY, angle: 90, flipVisuals: true };
            } else { A = { x: prevX - 179, y: prevY, angle: 90, flipVisuals: true }; B = A; }
        }
        return [A, B];
    }

    function pickBestCorner(A, B, boundary, edgeType) {
        // Native physical sizing is always 84x173 in our layout
        let wA = (A.angle === 90) ? 173 : 84; let hA = (A.angle === 90) ? 84 : 173;
        let wB = (B.angle === 90) ? 173 : 84; let hB = (B.angle === 90) ? 84 : 173;
        let distA, distB;

        if (edgeType === 'leftX') {
            let edgeA = A.x - wA/2; let edgeB = B.x - wB/2;
            distA = edgeA >= boundary ? edgeA - boundary : boundary - edgeA + 1000;
            distB = edgeB >= boundary ? edgeB - boundary : boundary - edgeB + 1000;
        } else if (edgeType === 'rightX') {
            let edgeA = A.x + wA/2; let edgeB = B.x + wB/2;
            distA = edgeA <= boundary ? boundary - edgeA : edgeA - boundary + 1000;
            distB = edgeB <= boundary ? boundary - edgeB : edgeB - boundary + 1000;
        } else if (edgeType === 'upperY') {
            let edgeA = A.y - hA/2; let edgeB = B.y - hB/2;
            distA = edgeA >= boundary ? edgeA - boundary : boundary - edgeA + 1000;
            distB = edgeB >= boundary ? edgeB - boundary : boundary - edgeB + 1000;
        }
        return distA <= distB ? A : B;
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
            angle: anchorIsDouble ? 0 : 90, flipVisuals: false,
            w: anchorIsDouble ? 84 : 173, h: anchorIsDouble ? 173 : 84,
            isDouble: anchorIsDouble
        };

        // RUN LEFT CHAIN
        let stateL = 'LEFT_BOTTOM';
        for (let i = initialIndex - 1; i >= 0; i--) {
            let prev = calculatedCoordinates[i + 1];
            let currIsDouble = boardLine[i].top === boardLine[i].bottom;
            let currW, currH, nextX, nextY, rotAngle, flip;

            if (stateL === 'LEFT_BOTTOM') {
                currW = currIsDouble ? 84 : 173; currH = currIsDouble ? 173 : 84; rotAngle = currIsDouble ? 0 : 90; flip = false;
                nextX = prev.x - prev.w/2 - GAP - currW/2;
                if (nextX - currW/2 < PATH_TRACK.leftX) {
                    stateL = 'UP_LEFT';
                    let [optA, optB] = getCornerChoices('LEFT_BOTTOM_TO_UP_LEFT', prev.x, prev.y, prev.isDouble, currIsDouble);
                    let best = pickBestCorner(optA, optB, PATH_TRACK.leftX, 'leftX');
                    calculatedCoordinates[i] = { x: best.x, y: best.y, angle: best.angle, flipVisuals: best.flipVisuals, w: (best.angle === 90) ? 173 : 84, h: (best.angle === 90) ? 84 : 173, isDouble: currIsDouble };
                } else {
                    calculatedCoordinates[i] = { x: nextX, y: PATH_TRACK.lowerY, angle: rotAngle, flipVisuals: flip, w: currW, h: currH, isDouble: currIsDouble };
                }
            } else if (stateL === 'UP_LEFT') {
                currW = currIsDouble ? 173 : 84; currH = currIsDouble ? 84 : 173; rotAngle = currIsDouble ? 90 : 0; flip = false;
                nextY = prev.y - prev.h/2 - GAP - currH/2;
                if (nextY - currH/2 < PATH_TRACK.upperY) {
                    stateL = 'RIGHT_TOP';
                    let [optA, optB] = getCornerChoices('UP_LEFT_TO_RIGHT_TOP', prev.x, prev.y, prev.isDouble, currIsDouble);
                    let best = pickBestCorner(optA, optB, PATH_TRACK.upperY, 'upperY');
                    calculatedCoordinates[i] = { x: best.x, y: best.y, angle: best.angle, flipVisuals: best.flipVisuals, w: (best.angle === 90) ? 173 : 84, h: (best.angle === 90) ? 84 : 173, isDouble: currIsDouble };
                } else {
                    calculatedCoordinates[i] = { x: prev.x, y: nextY, angle: rotAngle, flipVisuals: flip, w: currW, h: currH, isDouble: currIsDouble };
                }
            } else if (stateL === 'RIGHT_TOP') {
                currW = currIsDouble ? 84 : 173; currH = currIsDouble ? 173 : 84; rotAngle = currIsDouble ? 0 : 90; flip = true;
                nextX = prev.x + prev.w/2 + GAP + currW/2;
                calculatedCoordinates[i] = { x: nextX, y: prev.y, angle: rotAngle, flipVisuals: flip, w: currW, h: currH, isDouble: currIsDouble };
            }
        }

        // RUN RIGHT CHAIN
        let stateR = 'RIGHT_BOTTOM';
        for (let i = initialIndex + 1; i < boardLine.length; i++) {
            let prev = calculatedCoordinates[i - 1];
            let currIsDouble = boardLine[i].top === boardLine[i].bottom;
            let currW, currH, nextX, nextY, rotAngle, flip;

            if (stateR === 'RIGHT_BOTTOM') {
                currW = currIsDouble ? 84 : 173; currH = currIsDouble ? 173 : 84; rotAngle = currIsDouble ? 0 : 90; flip = false;
                nextX = prev.x + prev.w/2 + GAP + currW/2;
                if (nextX + currW/2 > PATH_TRACK.rightX) {
                    stateR = 'UP_RIGHT';
                    let [optA, optB] = getCornerChoices('RIGHT_BOTTOM_TO_UP_RIGHT', prev.x, prev.y, prev.isDouble, currIsDouble);
                    let best = pickBestCorner(optA, optB, PATH_TRACK.rightX, 'rightX');
                    calculatedCoordinates[i] = { x: best.x, y: best.y, angle: best.angle, flipVisuals: best.flipVisuals, w: (best.angle === 90) ? 173 : 84, h: (best.angle === 90) ? 84 : 173, isDouble: currIsDouble };
                } else {
                    calculatedCoordinates[i] = { x: nextX, y: prev.y, angle: rotAngle, flipVisuals: flip, w: currW, h: currH, isDouble: currIsDouble };
                }
            } else if (stateR === 'UP_RIGHT') {
                currW = currIsDouble ? 173 : 84; currH = currIsDouble ? 84 : 173; rotAngle = currIsDouble ? 90 : 0; flip = true;
                nextY = prev.y - prev.h/2 - GAP - currH/2;
                if (nextY - currH/2 < PATH_TRACK.upperY) {
                    stateR = 'LEFT_TOP';
                    let [optA, optB] = getCornerChoices('UP_RIGHT_TO_LEFT_TOP', prev.x, prev.y, prev.isDouble, currIsDouble);
                    let best = pickBestCorner(optA, optB, PATH_TRACK.upperY, 'upperY');
                    calculatedCoordinates[i] = { x: best.x, y: best.y, angle: best.angle, flipVisuals: best.flipVisuals, w: (best.angle === 90) ? 173 : 84, h: (best.angle === 90) ? 84 : 173, isDouble: currIsDouble };
                } else {
                    calculatedCoordinates[i] = { x: prev.x, y: nextY, angle: rotAngle, flipVisuals: flip, w: currW, h: currH, isDouble: currIsDouble };
                }
            } else if (stateR === 'LEFT_TOP') {
                currW = currIsDouble ? 84 : 173; currH = currIsDouble ? 173 : 84; rotAngle = currIsDouble ? 0 : 90; flip = true;
                nextX = prev.x - prev.w/2 - GAP - currW/2;
                calculatedCoordinates[i] = { x: nextX, y: prev.y, angle: rotAngle, flipVisuals: flip, w: currW, h: currH, isDouble: currIsDouble };
            }
        }

        // RENDER LIVE PLACEMENTS VIA PURE WRAPPER ROTATIONS
boardLine.forEach((tile, index) => {
    const coords = calculatedCoordinates[index];
    const placedTile = document.createElement("div");
    
    // Explicit canvas base size remains vertical via CSS skin rules
    placedTile.className = `domino-bone-interactive ${window.activeSkinClass}`;
    placedTile.style.position = "absolute";
    
    // FIX: Shift the placement center point using the track's calculated layout footprint
    placedTile.style.left = Math.round(coords.x - coords.w / 2) + "px";
    placedTile.style.top = Math.round(coords.y - coords.h / 2) + "px";
    placedTile.style.margin = "0";

    // One unified transform matrix handles the 90-degree track rotation seamlessly
    placedTile.style.transform = `rotate(${coords.angle}deg)`;

    let topHalf = generateHalfDisplay(tile.displayTop, true);
    let bottomHalf = generateHalfDisplay(tile.displayBottom, false);
    
    let divStyle = "width: 100%; height: 2px; background: #1a1a1a; flex-shrink: 0; position: relative;";
    
    if (coords.flipVisuals) {
        placedTile.innerHTML = `${bottomHalf}<div style="${divStyle}" class="domino-divider"></div>${topHalf}`;
    } else {
        placedTile.innerHTML = `${topHalf}<div style="${divStyle}" class="domino-divider"></div>${bottomHalf}`;
    }
    trackContainer.appendChild(placedTile);
});
    }

    // 2. RENDER PLAYER HAND (Always standing up vertical)
    if (window.localGameState && window.localGameState.players && window.localGameState.players.player1) {
        const hand = window.localGameState.players.player1.hand || [];
        hand.forEach(tile => {
            const tileElement = document.createElement("div");
            tileElement.className = `domino-bone-interactive ${window.activeSkinClass}`;
            tileElement.id = `hand-tile-${tile.id}`;
            tileElement.style.flexShrink = "0";
            
            let transformState = "rotate(0deg)";
            if (selectedTileId === tile.id) {
                transformState = "translateY(-16px) rotate(0deg)";
                tileElement.style.borderColor = "#66fcf1";
                tileElement.style.boxShadow = "0 0 20px #66fcf1";
                displayValidPlacements(tile);
            }

            tileElement.style.transform = transformState;

            tileElement.onmouseenter = () => {
                if (selectedTileId !== tile.id) tileElement.style.transform = "translateY(-8px) rotate(0deg)";
            };
            tileElement.onmouseleave = () => {
                if (selectedTileId !== tile.id) tileElement.style.transform = "translateY(0deg) rotate(0deg)";
            };
            
            tileElement.innerHTML = `
                ${generateHalfDisplay(tile.top, true)}
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

    // Decorative face-down center scatter bones remain untouched
    if (trackContainer) {
        const positions = [
            { x: 1080, y: 550 }, 
            { x: 1260, y: 510 }, 
            { x: 1420, y: 570 } 
        ];

        positions.forEach((pos, idx) => {
            const backTile = document.createElement("div");
            
            // Left without internal half components, instantly loading the back graphic style skin rule
            backTile.className = `domino-bone-interactive ${window.activeSkinClass}`;
            backTile.style.position = "absolute";
            backTile.style.border = "none";
            backTile.style.boxShadow = "0 6px 12px rgba(0,0,0,0.5)";
            backTile.style.cursor = "default";

            const randomTilt = Math.floor(Math.random() * 90) - 45; 
            
            backTile.style.left = Math.round(pos.x - 84 / 2) + "px";
            backTile.style.top = Math.round(pos.y - 173 / 2) + "px";
            backTile.style.transform = `rotate(${randomTilt}deg)`;
            
            trackContainer.appendChild(backTile);
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

// 14-Slot Vertical Generation Engine Core
function generateHalfDisplay(value, isTopHalf = true) {
    // Standard 7-Pip mapping dictionary
    const pipMaps = {
        0: [],
        1: [4],
        2: [1, 7],
        3: [1, 4, 7],
        4: [1, 2, 6, 7],
        5: [1, 2, 4, 6, 7],
        6: [1, 2, 3, 5, 6, 7]
    };
    
    const activePips = pipMaps[value] || [];
    const halfClass = isTopHalf ? "domino-half top-half" : "domino-half bottom-half";
    
    let html = `<div class="${halfClass}">`;
    
    // Always map all 7 slots on the canvas. 
    // Adding '.active' class hides the blank overlay cover patch, uncovering the baked dots.
    for (let p = 1; p <= 7; p++) {
        const isUnmasked = activePips.includes(p) ? 'active' : '';
        html += `<div class="pip ${isUnmasked} pos-${p}"></div>`;
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
