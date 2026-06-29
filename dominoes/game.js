// ==========================================================================
// Tellstream Dominoes - Circumstance 2: Single-to-Single Corner Test
// ==========================================================================

const gameTable = document.getElementById('game-table');
const loadingScreen = document.getElementById('loading-screen');

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

// Completely new mix of tiles to force a Single-to-Single corner pivot
function buildTestSequence() {
    return [
        { id: 'tile-6-6', top: 6, bottom: 6, isDouble: true },
        { id: 'tile-6-5', top: 6, bottom: 5, isDouble: false },
        { id: 'tile-5-4', top: 5, bottom: 4, isDouble: false },
        { id: 'tile-4-1', top: 4, bottom: 1, isDouble: false }, // Flat incoming single
        { id: 'tile-1-0', top: 1, bottom: 0, isDouble: false }, // Vertical turning single
        { id: 'tile-0-0', top: 0, bottom: 0, isDouble: true },  // Double on left wall
        { id: 'tile-0-2', top: 0, bottom: 2, isDouble: false }
    ];
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
    
    const LEFT_BOUND_X = 415;
    const BOTTOM_BOUND_Y = 1160;

    let currentX = 1400;
    let currentY = BOTTOM_BOUND_Y;
    let direction = 'left';
    let prevTile = null;

    deck.forEach((tile, index) => {
        let width = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
        let height = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
        let angle = tile.isDouble ? 0 : 90;

        if (direction === 'up') {
            width = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
            height = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
            angle = tile.isDouble ? 90 : 0;
        }

        if (index > 0) {
            const prevWidth = prevTile.isDouble ? (prevTile.dir === 'up' ? TILE_BASE_H : TILE_BASE_W) : (prevTile.dir === 'up' ? TILE_BASE_W : TILE_BASE_H);
            const prevHeight = prevTile.isDouble ? (prevTile.dir === 'up' ? TILE_BASE_W : TILE_BASE_H) : (prevTile.dir === 'up' ? TILE_BASE_H : TILE_BASE_W);

            if (direction === 'left') {
                currentX -= (prevWidth / 2) + (width / 2);
                
                // Read ahead: trigger corner state if this tile steps into the left lane zone
                if (currentX - (width / 2) < LEFT_BOUND_X + 100) { 
                    direction = 'up';
                    
                    width = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
                    height = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                    angle = tile.isDouble ? 90 : 0;

                    // Tighten the offset for the narrower single face footprint
                    currentX = (currentX + (prevWidth / 2) + (width / 2)) - (prevWidth / 2) - (width / 2);
                    currentY = BOTTOM_BOUND_Y; 
                }
            }
            else if (direction === 'up') {
                currentY -= (prevHeight / 2) + (height / 2);
            }
        } else {
            currentX -= (width / 2);
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

function initDirectCanvas() {
    if (loadingScreen) loadingScreen.classList.add('hidden');
    if (gameTable) gameTable.classList.remove('hidden');

    gameTable.innerHTML = '';
    
    document.body.style.backgroundColor = '#000000';
    gameTable.style.backgroundColor = '#000000';
    gameTable.style.backgroundImage = 'none';

    const boardContainer = document.createElement('div');
    boardContainer.className = 'match-board-container';
    boardContainer.style.width = `${BOARD_NATIVE_W}px`;
    boardContainer.style.height = `${BOARD_NATIVE_H}px`;
    boardContainer.style.position = 'absolute';
    gameTable.appendChild(boardContainer);

    const testDeck = buildTestSequence();
    const layoutCoordinates = calculateSequentialTrack(testDeck);

    testDeck.forEach((tile) => {
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
        textLabel.innerText = `[${tile.top}-${tile.bottom}]`;

        rotationContainer.appendChild(tileElement);
        wrapper.appendChild(rotationContainer);
        wrapper.appendChild(textLabel);
        boardContainer.appendChild(wrapper);
    });

    resizeGameTableContainer();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDirectCanvas);
} else {
    initDirectCanvas();
}

window.addEventListener('resize', resizeGameTableContainer);
