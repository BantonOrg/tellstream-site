// ==========================================================================
// Tellstream Dominoes - Strict Edge-to-Edge Corner Layout (Scenario 1)
// ==========================================================================

const gameTable = document.getElementById('game-table');
const loadingScreen = document.getElementById('loading-screen');

const BOARD_NATIVE_W = 2730;
const BOARD_NATIVE_H = 1536;
const canvasW = 597;
const canvasH = 1171;

const TILE_BASE_W = 90;
const TILE_BASE_H = 176;

const TRACK = {
    bottomY: 1160,
    topY:    310,
    leftX:   560,
    rightX:  2170
};

// Test Scenario 1: Pure single-to-single sequence
const TEST_SCENARIO = 1; 

function buildStrictSequence(scenarioNum) {
    return [
        { id: 't1', top: 6, bottom: 5, isDouble: false, isCornerTurner: false },
        { id: 't2', top: 5, bottom: 4, isDouble: false, isCornerTurner: false },
        { id: 't3', top: 4, bottom: 3, isDouble: false, isCornerTurner: false }, // Base single
        { id: 't4', top: 3, bottom: 2, isDouble: false, isCornerTurner: true },  // Corner single
        { id: 't5', top: 2, bottom: 1, isDouble: false, isCornerTurner: false },
        { id: 't6', top: 1, bottom: 0, isDouble: false, isCornerTurner: false }
    ];
}

function calculateStrictTrack(deck) {
    const layoutMap = {};
    let currentX = 1400; 
    let currentY = TRACK.bottomY;
    let direction = 'left';
    let prevTile = null;

    deck.forEach((tile) => {
        let width, height, angle;

        // Establish proper dimensions based on flow direction and corner state
        if (direction === 'left') {
            if (tile.isCornerTurner) {
                width = TILE_BASE_W;
                height = TILE_BASE_H;
                angle = 0;
            } else {
                width = TILE_BASE_H;
                height = TILE_BASE_W;
                angle = 90;
            }
        } else if (direction === 'up') {
            width = TILE_BASE_W;
            height = TILE_BASE_H;
            angle = 0;
        }

        if (prevTile) {
            if (tile.isCornerTurner) {
                direction = 'up';

                // Physical Calculation: Determine positions by flushing edges, not center steps
                // Option A: Stack on top face (Bottom edge touches top edge of previous)
                const optionA_X = currentX;
                const optionA_Y = currentY - (prevTile.h / 2) - (height / 2);
                const optionA_Dist = Math.abs(optionA_X - TRACK.leftX);

                // Option B: Snap to left side face (Right edge touches left edge of previous)
                const optionB_X = currentX - (prevTile.w / 2) - (width / 2);
                const optionB_Y = currentY;
                const optionB_Dist = Math.abs(optionB_X - TRACK.leftX);

                // Choose the option whose center axis aligns closest to the path line
                if (optionA_Dist < optionB_Dist) {
                    currentX = optionA_X;
                    currentY = optionA_Y;
                } else {
                    currentX = optionB_X;
                    currentY = optionB_Y;
                }
            } else {
                // Strict edge-to-edge stepping for continuous lanes
                if (direction === 'left') {
                    currentX = currentX - (prevTile.w / 2) - (width / 2);
                } else if (direction === 'up') {
                    currentY = currentY - (prevTile.h / 2) - (height / 2);
                }
            }
        } else {
            currentX -= (width / 2);
        }

        layoutMap[tile.id] = { x: currentX, y: currentY, w: width, h: height, angle: angle };
        prevTile = { w: width, h: height };
    });

    return layoutMap;
}

// --- RENDERING ENGINE ---
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

    const boardContainer = document.createElement('div');
    boardContainer.className = 'match-board-container';
    boardContainer.style.width = `${BOARD_NATIVE_W}px`;
    boardContainer.style.height = `${BOARD_NATIVE_H}px`;
    boardContainer.style.position = 'absolute';
    gameTable.appendChild(boardContainer);

    const canvas = document.createElement('canvas');
    canvas.width = BOARD_NATIVE_W;
    canvas.height = BOARD_NATIVE_H;
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.zIndex = '1';
    boardContainer.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(TRACK.rightX, TRACK.bottomY);
    ctx.lineTo(TRACK.leftX, TRACK.bottomY);
    ctx.lineTo(TRACK.leftX, TRACK.topY);
    ctx.stroke();

    const testDeck = buildStrictSequence(TEST_SCENARIO);
    const layoutCoordinates = calculateStrictTrack(testDeck);

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
        wrapper.style.zIndex = '10';

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
        tileElement.style.width = `${TILE_BASE_W}px`;
        tileElement.style.height = `${TILE_BASE_H}px`;
        tileElement.style.position = 'absolute';

        applyPipMasks(tileElement, tile.top, topPipMap);
        applyPipMasks(tileElement, tile.bottom, bottomPipMap);

        rotationContainer.appendChild(tileElement);
        wrapper.appendChild(rotationContainer);
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
