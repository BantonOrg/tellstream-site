// ==========================================================================
// Tellstream Dominoes - Raw Asset Layout Canvas
// ==========================================================================

const startBtn = document.getElementById('start-btn');
const loadingScreen = document.getElementById('loading-screen');
const gameTable = document.getElementById('game-table');

const BOARD_NATIVE_W = 2730;
const BOARD_NATIVE_H = 1536;
const canvasW = 597;
const canvasH = 1171;

const TILE_BASE_W = 90;
const TILE_BASE_H = 176;

const topPipMap = [
    { name: 'top-left',     x: 126, y: 126, hideFor: [0, 1] },
    { name: 'top-right',    x: 469, y: 126, hideFor: [0, 1, 2, 3] },
    { name: 'mid-left',     x: 126, y: 291, hideFor: [0, 1, 2, 3, 4, 5] },
    { name: 'mid-center',   x: 298, y: 291, hideFor: [0, 2, 4, 6] },
    { name: 'mid-right',    x: 469, y: 291, hideFor: [0, 1, 2, 3, 4, 5] },
    { name: 'bottom-left',  x: 126, y: 453, hideFor: [0, 1, 2, 3] },
    { name: 'bottom-right', x: 469, y: 453, hideFor: [0, 1] }
];

const bottomPipMap = [
    { name: 'top-left',     x: 126, y: 714, hideFor: [0, 1] },
    { name: 'top-right',    x: 469, y: 714, hideFor: [0, 1, 2, 3] },
    { name: 'mid-left',     x: 126, y: 881, hideFor: [0, 1, 2, 3, 4, 5] },
    { name: 'mid-center',   x: 298, y: 881, hideFor: [0, 2, 4, 6] },
    { name: 'mid-right',    x: 469, y: 881, hideFor: [0, 1, 2, 3, 4, 5] },
    { name: 'bottom-left',  x: 126, y: 1042, hideFor: [0, 1, 2, 3] },
    { name: 'bottom-right', x: 469, y: 1042, hideFor: [0, 1] }
];

function buildMasterDeck() {
    const deck = [];
    for (let i = 0; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
            deck.push({
                id: `tile-${i}-${j}`,
                label: `[ ${i} - ${j} ]`,
                top: i,
                bottom: j,
                isDouble: i === j
            });
        }
    }
    return deck;
}

function applyPipMasks(tileElement, value, coordinateMap) {
    coordinateMap.forEach(pip => {
        if (pip.hideFor.includes(value)) {
            const maskPatch = document.createElement('div');
            maskPatch.className = 'pip-mask-patch';
            maskPatch.style.left = `${(pip.x / canvasW) * 100}%`;
            maskPatch.style.top = `${(pip.y / canvasH) * 100}%`;
            tileElement.appendChild(maskPatch);
        }
    });
}

/**
 * MANUAL RAW CANVAS PLACEMENT MAP
 * Edit the X, Y, and Angle values here directly to arrange your sample patterns.
 */
function getManualCoordinates() {
    return {
        'tile-6-6': { x: 500,  y: 400,  angle: 0   }, // Vertical Double
        'tile-6-5': { x: 650,  y: 400,  angle: 90  }, // Horizontal Single
        'tile-5-5': { x: 800,  y: 400,  angle: 0   },
        'tile-5-4': { x: 950,  y: 400,  angle: 90  },
        'tile-4-4': { x: 1100, y: 400,  angle: 0   },
        'tile-4-3': { x: 1250, y: 400,  angle: 90  },
        'tile-3-3': { x: 1400, y: 400,  angle: 0   },
        
        // Next row coordinates for staging your test pieces
        'tile-3-2': { x: 500,  y: 650,  angle: 90  },
        'tile-2-2': { x: 650,  y: 650,  angle: 0   },
        'tile-2-1': { x: 800,  y: 650,  angle: 90  },
        'tile-1-1': { x: 950,  y: 650,  angle: 0   },
        'tile-1-0': { x: 1100, y: 650,  angle: 90  },
        { name: 'remainder-tiles', note: 'All other tiles will stack cleanly across the grid lines below.' }
    };
}

function displayDynamicMatchTable() {
    gameTable.innerHTML = '';
    
    // Force a pitch black background frame override
    document.body.style.backgroundColor = '#000000';
    gameTable.style.backgroundColor = '#000000';
    gameTable.style.backgroundImage = 'none';

    const boardContainer = document.createElement('div');
    boardContainer.className = 'match-board-container';
    boardContainer.style.width = `${BOARD_NATIVE_W}px`;
    boardContainer.style.height = `${BOARD_NATIVE_H}px`;
    boardContainer.style.position = 'absolute';
    gameTable.appendChild(boardContainer);

    const masterDeck = buildMasterDeck();
    const manualPositions = getManualCoordinates();

    let gridX = 200;
    let gridY = 900;

    masterDeck.forEach((tile) => {
        let coords = manualPositions[tile.id];
        
        // If a tile isn't manually positioned above, grid it out systematically along the bottom area
        if (!coords) {
            coords = { x: gridX, y: gridY, angle: tile.isDouble ? 0 : 90 };
            gridX += 160;
            if (gridX > 2400) {
                gridX = 200;
                gridY += 200;
            }
        }

        const width = coords.angle === 90 ? TILE_BASE_H : TILE_BASE_W;
        const height = coords.angle === 90 ? TILE_BASE_W : TILE_BASE_H;

        const wrapper = document.createElement('div');
        wrapper.className = 'live-card-wrapper';
        wrapper.style.width = `${width}px`;
        wrapper.style.height = `${height}px`;
        wrapper.style.left = `${coords.x - (width / 2)}px`;
        wrapper.style.top = `${coords.y - (height / 2)}px`;
        wrapper.style.position = 'absolute';

        const rotationContainer = document.createElement('div');
        rotationContainer.style.width = `${TILE_BASE_W}px`;
        rotationContainer.style.height = `${TILE_BASE_H}px`;
        rotationContainer.style.transform = `rotate(${coords.angle}deg)`;
        rotationContainer.style.transformOrigin = 'center center';
        rotationContainer.style.position = 'relative';
        rotationContainer.style.display = 'flex';
        rotationContainer.style.justifyContent = 'center';
        rotationContainer.style.alignItems = 'center';

        const tileElement = document.createElement('div');
        tileElement.className = 'domino-item';
        tileElement.id = tile.id;
        tileElement.style.width = `${TILE_BASE_W}px`;
        tileElement.style.height = `${TILE_BASE_H}px`;
        tileElement.style.position = 'absolute';

        applyPipMasks(tileElement, tile.top, topPipMap);
        applyPipMasks(tileElement, tile.bottom, bottomPipMap);

        const textLabel = document.createElement('div');
        textLabel.className = 'debug-label';
        textLabel.innerText = `[${tile.top}-${tile.bottom}]`;

        rotationContainer.appendChild(tileElement);
        wrapper.appendChild(rotationContainer);
        wrapper.appendChild(textLabel);
        boardContainer.appendChild(wrapper);
    });

    const container = document.querySelector('.match-board-container');
    if (container) {
        const fitScale = Math.min(window.innerWidth / BOARD_NATIVE_W, window.innerHeight / BOARD_NATIVE_H);
        container.style.transform = `scale(${fitScale})`;
    }
}

window.addEventListener('resize', () => {
    const container = document.querySelector('.match-board-container');
    if (container) {
        const fitScale = Math.min(window.innerWidth / BOARD_NATIVE_W, window.innerHeight / BOARD_NATIVE_H);
        container.style.transform = `scale(${fitScale})`;
    }
});

setTimeout(() => {
    startBtn.disabled = false;
    startBtn.innerText = "OPEN MANUAL CANVAS";
}, 1000);

startBtn.addEventListener('click', () => {
    loadingScreen.classList.add('hidden');
    gameTable.classList.remove('hidden');
    displayDynamicMatchTable();
});
