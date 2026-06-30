// ==========================================================================
// Tellstream Dominoes - Final Unified Game Engine
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
    // 1. INITIALIZE SANDBOX DATA
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
            <div id="game-mat" style="position: relative; width: 100vw; height: 100vh; overflow: hidden; background: #0b0c10;">
                <div id="scaled-table-canvas-root" style="position: absolute; width: 2560px; height: 1440px; background-image: url('assets/table_bg.jpg'); background-size: 100% 100%; transform-origin: center center;">
                    <div id="placed-tiles-container" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0;"></div>
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

    // 3. A/B BOSS-ANCHOR PATHING & RENDERING LOOP
    const trackContainer = document.getElementById("placed-tiles-container");
    trackContainer.innerHTML = "";
    
    // Logic for mapping coordinates and rendering tiles goes here...
    // (This part uses the logic from our previous successful "A/B Choice" matrix calculation)
    
    // ... [Insert the rendering loop from the previous stable A/B Logic file] ...
}

function generateHalfDisplay(value, isHorizontal = false) {
    const pipMaps = {
        0: [], 1: [4],
        2: isHorizontal ? [6, 2] : [1, 7],
        3: isHorizontal ? [6, 4, 2] : [1, 4, 7],
        4: [1, 2, 6, 7], 5: [1, 2, 4, 6, 7],
        6: isHorizontal ? [1, 8, 2, 6, 9, 7] : [1, 2, 3, 5, 6, 7]
    };
    const activePips = pipMaps[value] || [];
    let html = `<div class="domino-half">`;
    for (let p = 1; p <= 9; p++) {
        const isActive = activePips.includes(p) ? 'active' : '';
        html += `<div class="pip ${isActive} pos-${p}"></div>`;
    }
    return html + `</div>`;
}

// ... [Append the rest of your helper functions: getCornerChoices, pickBestCorner, handleBoardClick, processTilePlacement] ...
