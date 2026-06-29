// ==========================================================================
// Tellstream Dominoes - Scenario 3: Double-to-Single Path Test
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

// Mapped directly to your customized white path track
const TRACK = {
    bottomY: 1160,
    topY:    310,
    leftX:   560,
    rightX:  2170
};

// Sequence where a Double is followed by a Single to turn the corner
function buildTestSequence() {
    return [
        { id: 'tile-6-5', top: 6, bottom: 5, isDouble: false },
        { id: 'tile-5-4', top: 5, bottom: 4, isDouble: false },
        { id: 'tile-4-4', top: 4, bottom: 4, isDouble: true },  // Horizontal Double leading up to corner
        { id: 'tile-4-3', top: 4, bottom: 3, isDouble: false }, // The Corner Turner (Single)
        { id: 'tile-3-2', top: 3, bottom: 2, isDouble: false }, // Up vertical wall
        { id: 'tile-2-1', top: 2, bottom: 1, isDouble: false }
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
    let currentX = 1400; 
    let currentY = TRACK.bottomY;
    let direction = 'left';
    let prevTile = null;

    deck.forEach((tile, index) => {
        // Handle initial geometry based on double status layout on bottom lane
        let width = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
        let height = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
        let angle = tile.isDouble ? 0 : 90;

        if (index > 0) {
            if (direction === 'left') {
                const stepX = currentX - (prevTile.w / 2) - (width / 2);
                
                // Trigger corner check when approaching left track line
                if (stepX - (width / 2) <= TRACK.leftX + 50) {
                    direction = 'up';
                    
                    // Incoming single stands tall for vertical layout flow
                    width = TILE_BASE_W;
                    height = TILE_BASE_H;
                    angle = 0;

                    // Option A: Stack on top face of the previous double
                    const optionA_X = currentX;
                    const optionA_X_Dist = Math.abs(optionA_X - TRACK.leftX);
                    
                    // Option B: Snap to side face of the previous double
                    const optionB_X = currentX - (prevTile.w / 2) - (width / 2);
                    const optionB_X_Dist = Math.abs(optionB_X - TRACK.leftX);
                    
                    // Magnet Check: Choose layout option closest to the path line
                    if (optionA_X_Dist < optionB_X_Dist) {
                        currentX = optionA_X;
                        currentY = TRACK.bottomY - (prevTile.h / 2) - (height / 2);
                    } else {
                        currentX = optionB_X;
                        currentY = TRACK.bottomY;
                    }
                } else {
                    currentX = stepX;
                }
            } 
            else if (direction === 'up') {
                // Moving up vertical wall
                width = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
                height = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                angle = tile.isDouble ? 90 : 0;
                currentY -= (prevTile.h / 2) + (height / 2);
            }
        } else {
            currentX -= (width / 2);
        }

        layoutMap[tile.id] = { x: currentX, y: currentY, w: width, h: height, angle: angle };
        prevTile = { w: width, h: height };
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

    // Render path track guide line
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
