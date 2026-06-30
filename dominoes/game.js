// ==========================================================================
// Tellstream Dominoes - Game Board & Player Hand Rendering Layer
// ==========================================================================

let selectedTileId = null;

// Absolute master dimensions of table_bg.jpg
const BG_NATIVE_WIDTH = 2560;
const BG_NATIVE_HEIGHT = 1440;

// FINAL LAYOUT: Expanded Boundaries for "Breathing Room"
const PATH_TRACK = {
    lowerY: 1180, 
    upperY: 150,  
    leftX: 300,   
    rightX: 2340  
};

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

            <div id="game-mat" style="position: relative; width: 100vw; height: 100vh; overflow: hidden; background: #0b0c10;">
                <div id="scaled-table-canvas-root" style="position: absolute; width: 2560px; height: 1440px; background-image: url('assets/table_bg.jpg'); background-size: 100% 100%; transform-origin: center center;">
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

        function applyBoardScaling() {
            const mat = document.getElementById("game-mat");
            const root = document.getElementById("scaled-table-canvas-root");
            if (!mat || !root) return;
            const scale = Math.min(mat.clientWidth / BG_NATIVE_WIDTH, mat.clientHeight / BG_NATIVE_HEIGHT);
            root.style.transform = `scale(${scale})`;
        }
        window.addEventListener("resize", applyBoardScaling);
        applyBoardScaling();

        document.getElementById("domino-track-canvas").addEventListener("click", handleBoardClick);
        document.getElementById("left-play-zone").addEventListener("click", (e) => { e.stopPropagation(); processTilePlacement('left'); });
        document.getElementById("right-play-zone").addEventListener("click", (e) => { e.stopPropagation(); processTilePlacement('right'); });
    }

    // [..REMAINDER OF LOGIC STAYS IDENTICAL..]
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
    // LOGIC: A/B BOSS-ANCHOR PATHING ENGINE (UNCHANGED)
    // ==========================================================================
    // [..Include your existing getCornerChoices, pickBestCorner, and pathing render loop here..]
    // Note: To save space in this response, please ensure the getCornerChoices, 
    // pickBestCorner, and the full rendering loop functions from the previous 
    // iteration are preserved here.
}
