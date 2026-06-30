// ==========================================================================
// Tellstream Dominoes - FULL ENGINE RESTORATION
// ==========================================================================

let selectedTileId = null;

const BG_NATIVE_WIDTH = 2560;
const BG_NATIVE_HEIGHT = 1440;

const PATH_TRACK = {
    lowerY: 1180, 
    upperY: 269,  
    leftX: 420,   
    rightX: 2220  
};

function renderLiveTable(boardLine) {
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
            { id: 'r15', top: 6, bottom: 6, displayTop: 6, displayBottom: 6 },
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
    }

    const tableView = document.getElementById("table-view");
    if (!tableView) return;

    if (!document.getElementById("game-mat")) {
        tableView.innerHTML = `
            <style>
                .domino-bone-interactive { width: 84px !important; height: 173px !important; }
                .domino-bone-interactive.domino-flat-track { width: 173px !important; height: 84px !important; flex-direction: row !important; }
                .domino-half { width: 70px !important; height: 70px !important; padding: 6px !important; }
                .pip { width: 12px !important; height: 12px !important; }
                .domino-divider { background: #1a1a1a !important; flex-shrink: 0; }
            </style>
            <div id="game-mat" style="position: relative; width: 100vw; height: 100vh; background-image: url('assets/table_bg.jpg'); background-size: cover; background-repeat: no-repeat; background-position: center; display: flex; justify-content: center; align-items: center; overflow: hidden;">
                <div id="scaled-table-canvas-root" style="position: absolute; transform-origin: center center;">
                    <div id="seat-block-1" style="position: absolute; top: 30px; left: 30px; padding: 12px 28px; background: rgba(11,12,16,0.85); border: 2px solid rgba(102,252,241,0.2); border-radius: 8px; color: #fff; z-index: 10;"></div>
                    <div id="seat-block-2" style="position: absolute; top: 30px; right: 30px; padding: 12px 28px; background: rgba(11,12,16,0.85); border: 2px solid rgba(102,252,241,0.2); border-radius: 8px; color: #fff; z-index: 10;"></div>
                    <div id="table-status-header" style="position: absolute; top: 40px; left: 50%; transform: translateX(-50%); z-index: 10; color: #66fcf1; font-weight: bold; background: rgba(0,0,0,0.6); padding: 8px 24px; border-radius: 40px;">ROOM: SANDBOX</div>
                    <div id="domino-track-canvas" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%;">
                        <div id="left-play-zone" style="display: none; position: absolute; left: 0; top: 0; width: 15%; height: 100%; background: rgba(102, 252, 241, 0.12); z-index: 20; border-right: 4px dashed #66fcf1; cursor: pointer;"></div>
                        <div id="right-play-zone" style="display: none; position: absolute; right: 0; top: 0; width: 15%; height: 100%; background: rgba(102, 252, 241, 0.12); z-index: 20; border-left: 4px dashed #66fcf1; cursor: pointer;"></div>
                        <div id="placed-tiles-container" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0;"></div>
                    </div>
                    <div id="player-hand-container" style="position: absolute; display: flex; justify-content: center; align-items: center; gap: 20px; z-index: 999;"></div>
                </div>
            </div>
        `;
        const root = document.getElementById("scaled-table-canvas-root");
        root.style.width = "2560px"; root.style.height = "1440px";
        const resize = () => {
            const scale = Math.min(window.innerWidth / 2560, window.innerHeight / 1440);
            root.style.transform = `scale(${scale})`;
        };
        window.addEventListener("resize", resize);
        resize();
    }

    const trackContainer = document.getElementById("placed-tiles-container");
    const handContainer = document.getElementById("player-hand-container");
    trackContainer.innerHTML = "";
    handContainer.innerHTML = "";

    // A/B BOSS-ANCHOR PATHING ENGINE
    function getCornerChoices(state, prevX, prevY, prevIsDouble, currIsDouble) {
        let A, B;
        if (state === 'LEFT_BOTTOM_TO_UP_LEFT') {
            if (!prevIsDouble && !currIsDouble) { A = { x: prevX - 43.25, y: prevY - 134.5, isRotated: false, flipVisuals: false }; B = { x: prevX + 43.25, y: prevY - 134.5, isRotated: false, flipVisuals: false }; }
            else if (!prevIsDouble && currIsDouble) { A = { x: prevX - 134.5, y: prevY, isRotated: false, flipVisuals: false }; B = A; }
            else if (prevIsDouble && !currIsDouble) { A = { x: prevX + 134.5, y: prevY - 43.25, isRotated: true, flipVisuals: false }; B = { x: prevX, y: prevY - 179, isRotated: false, flipVisuals: false }; }
            else { A = { x: prevX, y: prevY - 179, isRotated: false, flipVisuals: false }; B = A; }
        }
        else if (state === 'RIGHT_BOTTOM_TO_UP_RIGHT') {
            if (!prevIsDouble && !currIsDouble) { A = { x: prevX + 43.25, y: prevY - 134.5, isRotated: false, flipVisuals: true }; B = { x: prevX - 43.25, y: prevY - 134.5, isRotated: false, flipVisuals: true }; }
            else if (!prevIsDouble && currIsDouble) { A = { x: prevX + 134.5, y: prevY, isRotated: false, flipVisuals: true }; B = A; }
            else if (prevIsDouble && !currIsDouble) { A = { x: prevX - 134.5, y: prevY - 43.25, isRotated: true, flipVisuals: true }; B = { x: prevX, y: prevY - 179, isRotated: false, flipVisuals: true }; }
            else { A = { x: prevX, y: prevY - 179, isRotated: false, flipVisuals: true }; B = A; }
        }
        else if (state === 'UP_LEFT_TO_RIGHT_TOP') {
            if (!prevIsDouble && !currIsDouble) { A = { x: prevX + 134.5, y: prevY - 43.25, isRotated: true, flipVisuals: true }; B = { x: prevX + 134.5, y: prevY + 43.25, isRotated: true, flipVisuals: true }; }
            else if (!prevIsDouble && currIsDouble) { A = { x: prevX, y: prevY - 134.5, isRotated: true, flipVisuals: true }; B = A; }
            else if (prevIsDouble && !currIsDouble) { A = { x: prevX + 43.25, y: prevY + 134.5, isRotated: false, flipVisuals: true }; B = { x: prevX + 179, y: prevY, isRotated: true, flipVisuals: true }; }
            else { A = { x: prevX + 179, y: prevY, isRotated: true, flipVisuals: true }; B = A; }
        }
        else if (state === 'UP_RIGHT_TO_LEFT_TOP') {
            if (!prevIsDouble && !currIsDouble) { A = { x: prevX - 134.5, y: prevY - 43.25, isRotated: true, flipVisuals: true }; B = { x: prevX - 134.5, y: prevY + 43.25, isRotated: true, flipVisuals: true }; }
            else if (!prevIsDouble && currIsDouble) { A = { x: prevX, y: prevY - 134.5, isRotated: true, flipVisuals: true }; B = A; }
            else if (prevIsDouble && !currIsDouble) { A = { x: prevX - 43.25, y: prevY + 134.5, isRotated: false, flipVisuals: true }; B = { x: prevX - 179, y: prevY, isRotated: true, flipVisuals: true }; }
            else { A = { x: prevX - 179, y: prevY, isRotated: true, flipVisuals: true }; B = A; }
        }
        return [A, B];
    }

    function pickBestCorner(A, B, boundary, edgeType) {
        let wA = A.isRotated ? 173 : 84; let hA = A.isRotated ? 84 : 173;
        let wB = B.isRotated ? 173 : 84; let hB = B.isRotated ? 84 : 173;
        let distA, distB;
        if (edgeType === 'leftX') { distA = (A.x - wA/2 >= boundary) ? (A.x - wA/2 - boundary) : (boundary - (A.x - wA/2) + 1000); distB = (B.x - wB/2 >= boundary) ? (B.x - wB/2 - boundary) : (boundary - (B.x - wB/2) + 1000); }
        else if (edgeType === 'rightX') { distA = (A.x + wA/2 <= boundary) ? (boundary - (A.x + wA/2)) : ((A.x + wA/2) - boundary + 1000); distB = (B.x + wB/2 <= boundary) ? (boundary - (B.x + wB/2)) : ((B.x + wB/2) - boundary + 1000); }
        else { distA = (A.y - hA/2 >= boundary) ? (A.y - hA/2 - boundary) : (boundary - (A.y - hA/2) + 1000); distB = (B.y - hB/2 >= boundary) ? (B.y - hB/2 - boundary) : (boundary - (B.y - hB/2) + 1000); }
        return distA <= distB ? A : B;
    }

    // RUN COORDINATE ENGINE
    let initialIndex = 14;
    let coords = new Array(boardLine.length);
    let anchorIsDouble = (boardLine[initialIndex].top === boardLine[initialIndex].bottom);
    coords[initialIndex] = { x: 1280, y: PATH_TRACK.lowerY, isRotated: !anchorIsDouble, flipVisuals: false, w: anchorIsDouble ? 84 : 173, h: anchorIsDouble ? 173 : 84, isDouble: anchorIsDouble };

    // RUN LEFT CHAIN
    let stateL = 'LEFT_BOTTOM';
    for (let i = initialIndex - 1; i >= 0; i--) {
        let prev = coords[i + 1]; let currIsDouble = (boardLine[i].top === boardLine[i].bottom);
        if (stateL === 'LEFT_BOTTOM') {
            let nextX = prev.x - (prev.w/2) - 6 - (currIsDouble ? 42 : 86);
            if (nextX - (currIsDouble ? 42 : 86) < PATH_TRACK.leftX - 100) {
                stateL = 'UP_LEFT';
                let best = pickBestCorner(...getCornerChoices('LEFT_BOTTOM_TO_UP_LEFT', prev.x, prev.y, prev.isDouble, currIsDouble), PATH_TRACK.leftX, 'leftX');
                coords[i] = { x: best.x, y: best.y, isRotated: best.isRotated, flipVisuals: best.flipVisuals, w: best.isRotated ? 173 : 84, h: best.isRotated ? 84 : 173, isDouble: currIsDouble };
            } else { coords[i] = { x: nextX, y: PATH_TRACK.lowerY, isRotated: !currIsDouble, flipVisuals: false, w: currIsDouble ? 84 : 173, h: currIsDouble ? 173 : 84, isDouble: currIsDouble }; }
        } else if (stateL === 'UP_LEFT') {
            let nextY = prev.y - (prev.h/2) - 6 - (currIsDouble ? 86 : 42);
            if (nextY - (currIsDouble ? 86 : 42) < PATH_TRACK.upperY) {
                stateL = 'RIGHT_TOP';
                let best = pickBestCorner(...getCornerChoices('UP_LEFT_TO_RIGHT_TOP', prev.x, prev.y, prev.isDouble, currIsDouble), PATH_TRACK.upperY, 'upperY');
                coords[i] = { x: best.x, y: best.y, isRotated: best.isRotated, flipVisuals: best.flipVisuals, w: best.isRotated ? 173 : 84, h: best.isRotated ? 84 : 173, isDouble: currIsDouble };
            } else { coords[i] = { x: prev.x, y: nextY, isRotated: currIsDouble, flipVisuals: false, w: currIsDouble ? 173 : 84, h: currIsDouble ? 84 : 173, isDouble: currIsDouble }; }
        } else {
            let nextX = prev.x + (prev.w/2) + 6 + (currIsDouble ? 42 : 86);
            coords[i] = { x: nextX, y: prev.y, isRotated: !currIsDouble, flipVisuals: true, w: currIsDouble ? 84 : 173, h: currIsDouble ? 173 : 84, isDouble: currIsDouble };
        }
    }

    // RUN RIGHT CHAIN
    let stateR = 'RIGHT_BOTTOM';
    for (let i = initialIndex + 1; i < boardLine.length; i++) {
        let prev = coords[i - 1]; let currIsDouble = (boardLine[i].top === boardLine[i].bottom);
        if (stateR === 'RIGHT_BOTTOM') {
            let nextX = prev.x + (prev.w/2) + 6 + (currIsDouble ? 42 : 86);
            if (nextX + (currIsDouble ? 42 : 86) > PATH_TRACK.rightX + 100) {
                stateR = 'UP_RIGHT';
                let best = pickBestCorner(...getCornerChoices('RIGHT_BOTTOM_TO_UP_RIGHT', prev.x, prev.y, prev.isDouble, currIsDouble), PATH_TRACK.rightX, 'rightX');
                coords[i] = { x: best.x, y: best.y, isRotated: best.isRotated, flipVisuals: best.flipVisuals, w: best.isRotated ? 173 : 84, h: best.isRotated ? 84 : 173, isDouble: currIsDouble };
            } else { coords[i] = { x: nextX, y: PATH_TRACK.lowerY, isRotated: !currIsDouble, flipVisuals: false, w: currIsDouble ? 84 : 173, h: currIsDouble ? 173 : 84, isDouble: currIsDouble }; }
        } else if (stateR === 'UP_RIGHT') {
            let nextY = prev.y - (prev.h/2) - 6 - (currIsDouble ? 86 : 42);
            if (nextY - (currIsDouble ? 86 : 42) < PATH_TRACK.upperY) {
                stateR = 'LEFT_TOP';
                let best = pickBestCorner(...getCornerChoices('UP_RIGHT_TO_LEFT_TOP', prev.x, prev.y, prev.isDouble, currIsDouble), PATH_TRACK.upperY, 'upperY');
                coords[i] = { x: best.x, y: best.y, isRotated: best.isRotated, flipVisuals: best.flipVisuals, w: best.isRotated ? 173 : 84, h: best.isRotated ? 84 : 173, isDouble: currIsDouble };
            } else { coords[i] = { x: prev.x, y: nextY, isRotated: currIsDouble, flipVisuals: true, w: currIsDouble ? 173 : 84, h: currIsDouble ? 84 : 173, isDouble: currIsDouble }; }
        } else {
            let nextX = prev.x - (prev.w/2) - 6 - (currIsDouble ? 42 : 86);
            coords[i] = { x: nextX, y: prev.y, isRotated: !currIsDouble, flipVisuals: true, w: currIsDouble ? 84 : 173, h: currIsDouble ? 173 : 84, isDouble: currIsDouble };
        }
    }

    // RENDER
    boardLine.forEach((tile, index) => {
        const c = coords[index];
        const el = document.createElement("div");
        el.className = "domino-bone-interactive" + (c.isRotated ? " domino-flat-track" : "");
        el.style.position = "absolute"; el.style.left = (c.x - c.w/2) + "px"; el.style.top = (c.y - c.h/2) + "px";
        el.innerHTML = `${generateHalfDisplay(c.flipVisuals ? tile.displayBottom : tile.displayTop)}<div class="domino-divider" style="${c.isRotated ? 'width:2px; height:100%' : 'width:100%; height:2px'}"></div>${generateHalfDisplay(c.flipVisuals ? tile.displayTop : tile.displayBottom)}`;
        trackContainer.appendChild(el);
    });
}
function generateHalfDisplay(val) { let h = `<div class="domino-half">`; for(let p=1;p<=9;p++) h += `<div class="pip ${[[],[4],[6,2],[6,4,2],[1,2,6,7],[1,2,4,6,7],[1,8,2,6,9,7]][val]?.includes(p)?'active':''}"></div>`; return h+'</div>'; }
function processTilePlacement(side) { /* Add your final placement logic here */ }
function handleBoardClick() {}
function updateCornerSeatBlocks() {}
function displayValidPlacements() {}
