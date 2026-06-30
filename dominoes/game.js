// ==========================================================================
// Tellstream Dominoes - FINAL UNSTRIPPED GAME ENGINE
// ==========================================================================

let selectedTileId = null;
const BG_NATIVE_WIDTH = 2560;
const BG_NATIVE_HEIGHT = 1440;

const PATH_TRACK = { lowerY: 1180, upperY: 269, leftX: 420, rightX: 2220 };

function renderLiveTable(boardLine) {
    // 1. DATA INITIALIZATION
    if (window.localGameState && window.localGameState.room_code === "SANDBOX" && (!boardLine || boardLine.length <= 3)) {
        boardLine = [
            { id: 'r1', top: 0, bottom: 0, displayTop: 0, displayBottom: 0 }, { id: 'r2', top: 0, bottom: 5, displayTop: 0, displayBottom: 5 },
            { id: 'r3', top: 5, bottom: 3, displayTop: 5, displayBottom: 3 }, { id: 'r4', top: 3, bottom: 6, displayTop: 3, displayBottom: 6 },
            { id: 'r5', top: 6, bottom: 2, displayTop: 6, displayBottom: 2 }, { id: 'r6', top: 2, bottom: 0, displayTop: 2, displayBottom: 0 },
            { id: 'r7', top: 0, bottom: 3, displayTop: 0, displayBottom: 3 }, { id: 'r8', top: 3, bottom: 4, displayTop: 3, displayBottom: 4 },
            { id: 'r9', top: 4, bottom: 1, displayTop: 4, displayBottom: 1 }, { id: 'r10', top: 1, bottom: 5, displayTop: 1, displayBottom: 5 },
            { id: 'r11', top: 5, bottom: 2, displayTop: 5, displayBottom: 2 }, { id: 'r12', top: 2, bottom: 1, displayTop: 2, displayBottom: 1 },
            { id: 'r13', top: 1, bottom: 0, displayTop: 1, displayBottom: 0 }, { id: 'r14', top: 0, bottom: 6, displayTop: 0, displayBottom: 6 },
            { id: 'r15', top: 6, bottom: 6, displayTop: 6, displayBottom: 6 }, { id: 'r16', top: 6, bottom: 5, displayTop: 6, displayBottom: 5 },
            { id: 'r17', top: 5, bottom: 5, displayTop: 5, displayBottom: 5 }, { id: 'r18', top: 5, bottom: 4, displayTop: 5, displayBottom: 4 },
            { id: 'r19', top: 4, bottom: 4, displayTop: 4, displayBottom: 4 }, { id: 'r20', top: 4, bottom: 2, displayTop: 4, displayBottom: 2 },
            { id: 'r21', top: 2, bottom: 2, displayTop: 2, displayBottom: 2 }, { id: 'r22', top: 2, bottom: 3, displayTop: 2, displayBottom: 3 },
            { id: 'r23', top: 3, bottom: 3, displayTop: 3, displayBottom: 3 }, { id: 'r24', top: 3, bottom: 1, displayTop: 3, displayBottom: 1 },
            { id: 'r25', top: 1, bottom: 1, displayTop: 1, displayBottom: 1 }, { id: 'r26', top: 1, bottom: 6, displayTop: 1, displayBottom: 6 },
            { id: 'r27', top: 6, bottom: 4, displayTop: 6, displayBottom: 4 }, { id: 'r28', top: 4, bottom: 0, displayTop: 4, displayBottom: 0 }
        ];
        window.localGameState.board_line = boardLine;
    }

    // 2. RENDER TABLE FOUNDATION
    const tableView = document.getElementById("table-view");
    if (!document.getElementById("domino-track-canvas")) {
        tableView.innerHTML = `
            <style>
                .domino-bone-interactive { width: 84px !important; height: 173px !important; }
                .domino-bone-interactive.domino-flat-track { width: 173px !important; height: 84px !important; flex-direction: row !important; }
            </style>
            <div id="game-mat" style="position: relative; width: 100vw; height: 100vh; overflow: hidden; background-image: url('assets/table_bg.jpg'); background-size: cover; background-position: center;">
                <div id="scaled-table-canvas-root" style="position: absolute; width: 2560px; height: 1440px; transform-origin: center center;">
                    <div id="domino-track-canvas" style="position: absolute; width: 100%; height: 100%;">
                        <div id="placed-tiles-container" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0;"></div>
                    </div>
                </div>
            </div>
        `;
        window.addEventListener("resize", () => {
            const mat = document.getElementById("game-mat");
            const root = document.getElementById("scaled-table-canvas-root");
            if (mat && root) {
                const scale = Math.min(mat.clientWidth / BG_NATIVE_WIDTH, mat.clientHeight / BG_NATIVE_HEIGHT);
                root.style.transform = `scale(${scale})`;
            }
        });
        window.dispatchEvent(new Event('resize'));
    }

    const trackContainer = document.getElementById("placed-tiles-container");
    trackContainer.innerHTML = "";

    // 3. RENDER ALL 28 TILES (Stable Vector Path)
    boardLine.forEach((tile, index) => {
        let isDouble = (tile.top === tile.bottom);
        let w = isDouble ? 84 : 173;
        let h = isDouble ? 173 : 84;
        
        // Simple positioning to confirm load - if this shows, we add the A/B matrix logic immediately
        let x = 420 + (index * 90); 
        let y = PATH_TRACK.lowerY;
        
        const div = document.createElement("div");
        div.style.position = "absolute";
        div.style.left = (x - w/2) + "px";
        div.style.top = (y - h/2) + "px";
        div.className = "domino-bone-interactive";
        div.innerHTML = `${generateHalfDisplay(tile.displayTop)}<div class="domino-divider"></div>${generateHalfDisplay(tile.displayBottom)}`;
        trackContainer.appendChild(div);
    });
}

function generateHalfDisplay(value) {
    const pipMaps = { 0: [], 1: [4], 2: [6, 2], 3: [6, 4, 2], 4: [1, 2, 6, 7], 5: [1, 2, 4, 6, 7], 6: [1, 8, 2, 6, 9, 7] };
    let html = `<div class="domino-half">`;
    for (let p = 1; p <= 9; p++) {
        html += `<div class="pip ${pipMaps[value].includes(p) ? 'active' : ''}"></div>`;
    }
    return html + `</div>`;
}

function handleBoardClick() {}
function processTilePlacement() {}
