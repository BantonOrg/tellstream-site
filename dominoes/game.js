// ==========================================================================
// Tellstream Dominoes - Sequential Track Layout Test Grid
// ==========================================================================

const startBtn = document.getElementById('start-btn');
const loadingScreen = document.getElementById('loading-screen');
const gameTable = document.getElementById('game-table');

const BOARD_NATIVE_W = 2730;
const BOARD_NATIVE_H = 1536;
const canvasW = 597;
const canvasH = 1171;

// 75% Scale Metrics
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

function calculateSequentialTrack(deck) {
    const layoutMap = {};
    
    // Exact starting coordinate anchors for rows to frame the neon border perfectly
    const BOTTOM_ROW_Y = 1160;
    const TOP_ROW_Y = 175;
    const LEFT_WALL_X = 415;
    const RIGHT_WALL_X = 2315;

    let currentX = 2100; // Start far right on the bottom row, moving left
    let currentY = BOTTOM_ROW_Y;
    let prevTile = null;

    deck.forEach((tile, index) => {
        let direction = 'left';
        if (index >= 8 && index <= 12) direction = 'up';
        if (index >= 13 && index <= 22) direction = 'right';
        if (index >= 23) direction = 'down';

        let width = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
        let height = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
        let angle = tile.isDouble ? 0 : 90;

        if (direction === 'left') {
            if (index > 0) {
                const prevWidth = prevTile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                currentX -= (prevWidth / 2) + (width / 2);
            }
            currentY = BOTTOM_ROW_Y;
        }
        else if (direction === 'up') {
            width = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
            height = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
            angle = tile.isDouble ? 90 : 0;

            if (prevTile.dir === 'left') {
                // Bottom-Left Flush L-Corner Snap
                const prevWidth = prevTile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                currentX = currentX - (prevWidth / 2) + (TILE_BASE_W / 2);
                currentY = BOTTOM_ROW_Y - (height / 2) - (TILE_BASE_W / 2);
            } else {
                const prevHeight = prevTile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                currentY -= (prevHeight / 2) + (height / 2);
            }
            currentX = LEFT_WALL_X;
        }
        else if (direction === 'right') {
            if (prevTile.dir === 'up') {
                // Top-Left Flush L-Corner Snap
                currentX = LEFT_WALL_X + (width / 2) + (TILE_BASE_W / 2);
                currentY = TOP_ROW_Y;
            } else {
                const prevWidth = prevTile.isDouble ? TILE_BASE_H : TILE_BASE_W;
                currentX += (prevWidth / 2) + (width / 2);
            }
            currentY = TOP_ROW_Y;
        }
        else if (direction === 'down') {
            width = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
            height = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
            angle = tile.isDouble ? 90 : 0;

            if (prevTile.dir === 'right') {
                // Top-Right Flush L-Corner Snap
                const prevWidth = prevTile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                currentX = currentX + (prevWidth / 2) - (TILE_BASE_W / 2);
                currentY = TOP_ROW_Y + (height / 2) + (TILE_BASE_W / 2);
            } else {
                const prevHeight = prevTile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                currentY += (prevHeight / 2) + (height / 2);
            }
            currentX = RIGHT_WALL_X;
        }

        layoutMap[tile.id] = { x: currentX, y: currentY, w: width, h: height, angle: angle, dir: direction };
        prevTile = { isDouble: tile.isDouble, dir: direction };
    });

    return layoutMap;
}

function resizeGameTableContainer() {
    const container = document.querySelector('.match-board-container');
    if (!container) return;
    const fitScale = Math.min(window.innerWidth / BOARD_NATIVE_W, window.innerHeight / BOARD_NATIVE_H);
    container.style.transform = `scale(${fitScale})`;
}

function displayDynamicMatchTable() {
    gameTable.innerHTML = '';
    const boardContainer = document.createElement('div');
    boardContainer.className = 'match-board-container';
    boardContainer.style.width = `${BOARD_NATIVE_W}px`;
    boardContainer.style.height = `${BOARD_NATIVE_H}px`;
    boardContainer.style.position = 'absolute';
    gameTable.appendChild(boardContainer);

    const masterDeck = buildMasterDeck();
    const layoutCoordinates = calculateSequentialTrack(masterDeck);

    masterDeck.forEach((tile) => {
        const coords = layoutCoordinates[tile.id];
        if (!coords) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'live-card-wrapper';
        wrapper.style.width = `${coords.w}px`;
        wrapper.style.height = `${coords.h}px`;
        wrapper.style.left = `${coords.x - (coords.w / 2)}px`;
        wrapper.style.top = `${coords.y - (coords.h / 2)}px`;
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
        textLabel.innerText = tile.label;

        rotationContainer.appendChild(tileElement);
        wrapper.appendChild(rotationContainer);
        wrapper.appendChild(textLabel);
        boardContainer.appendChild(wrapper);
    });

    resizeGameTableContainer();
}

window.addEventListener('resize', resizeGameTableContainer);

setTimeout(() => {
    startBtn.disabled = false;
    startBtn.innerText = "TEST FIXED TRACK";
}, 1000);

startBtn.addEventListener('click', () => {
    loadingScreen.classList.add('hidden');
    gameTable.classList.remove('hidden');
    displayDynamicMatchTable();
});
