// ==========================================================================
// Tellstream Dominoes - Four-Corner Index-Driven Structural Test
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

// Explicit structural sequences for Scenario 1 across all 4 corners
function buildLeftBranch() {
    return [
        { id: 'l1', top: 6, bottom: 5, isDouble: false, isBottomTurn: false, isTopTurn: false },
        { id: 'l2', top: 5, bottom: 4, isDouble: false, isBottomTurn: false, isTopTurn: false },
        { id: 'l3', top: 4, bottom: 3, isDouble: false, isBottomTurn: false, isTopTurn: false }, 
        { id: 'l4', top: 3, bottom: 2, isDouble: false, isBottomTurn: true,  isTopTurn: false }, // Bottom-Left
        { id: 'l5', top: 2, bottom: 1, isDouble: false, isBottomTurn: false, isTopTurn: false }, 
        { id: 'l6', top: 1, bottom: 0, isDouble: false, isBottomTurn: false, isTopTurn: false },
        { id: 'l7', top: 0, bottom: 0, isDouble: false, isBottomTurn: false, isTopTurn: true  }, // Top-Left
        { id: 'l8', top: 0, bottom: 1, isDouble: false, isBottomTurn: false, isTopTurn: false }
    ];
}

function buildRightBranch() {
    return [
        { id: 'r1', top: 6, bottom: 5, isDouble: false, isBottomTurn: false, isTopTurn: false },
        { id: 'r2', top: 5, bottom: 4, isDouble: false, isBottomTurn: false, isTopTurn: false },
        { id: 'r3', top: 4, bottom: 3, isDouble: false, isBottomTurn: false, isTopTurn: false }, 
        { id: 'r4', top: 3, bottom: 2, isDouble: false, isBottomTurn: true,  isTopTurn: false }, // Bottom-Right
        { id: 'r5', top: 2, bottom: 1, isDouble: false, isBottomTurn: false, isTopTurn: false }, 
        { id: 'r6', top: 1, bottom: 0, isDouble: false, isBottomTurn: false, isTopTurn: false },
        { id: 'r7', top: 0, bottom: 0, isDouble: false, isBottomTurn: false, isTopTurn: true  }, // Top-Right
        { id: 'r8', top: 0, bottom: 1, isDouble: false, isBottomTurn: false, isTopTurn: false }
    ];
}

function calculateBranch(deck, startDirection) {
    const layoutMap = {};
    let currentX = 1400; 
    let currentY = TRACK.bottomY;
    let direction = startDirection; 
    let prevTile = null;

    deck.forEach((tile) => {
        let width, height, angle;

        // Determine base shape sizes based on structural execution state
        if (direction === 'left' || direction === 'right' || direction === 'turn-right' || direction === 'turn-left') {
            width = TILE_BASE_H;
            height = TILE_BASE_W;
            angle = 90;
        } else if (direction === 'up') {
            width = TILE_BASE_W;
            height = TILE_BASE_H;
            angle = 0;
        }

        if (prevTile) {
            // --- BOTTOM CORNER TURNS ---
            if (tile.isBottomTurn) {
                direction = 'up';
                width = TILE_BASE_W; height = TILE_BASE_H; angle = 0;

                const stepX = (startDirection === 'left') ? currentX - (prevTile.w / 2) - (width / 2) : currentX + (prevTile.w / 2) + (width / 2);
                const targetX = (startDirection === 'left') ? TRACK.leftX : TRACK.rightX;

                const optionA_X = currentX; 
                const optionA_Dist = Math.abs(optionA_X - targetX);
                const optionB_X = stepX;
                const optionB_Dist = Math.abs(optionB_X - targetX);
                
                if (optionA_Dist < optionB_Dist) {
                    currentX = optionA_X;
                    currentY = TRACK.bottomY - (prevTile.h / 2) - (height / 2);
                } else {
                    currentX = optionB_X;
                    currentY = TRACK.bottomY;
                }
            } 
            // --- TOP CORNER TURNS ---
            else if (tile.isTopTurn) {
                direction = (startDirection === 'left') ? 'turn-right' : 'turn-left';
                width = TILE_BASE_H; height = TILE_BASE_W; angle = 90;

                const stepY = currentY - (prevTile.h / 2) - (height / 2);

                const optionA_Y = currentY;
                const optionA_Dist = Math.abs(optionA_Y - TRACK.topY);
                const optionB_Y = stepY;
                const optionB_Dist = Math.abs(optionB_Y - TRACK.topY);

                if (optionA_Dist < optionB_Dist) {
                    currentY = optionA_Y;
                    currentX = (direction === 'turn-right') ? currentX + (prevTile.w / 2) + (width / 2) : currentX - (prevTile.w / 2) - (width / 2);
                } else {
                    currentY = optionB_Y;
                    currentX = currentX; // Center axis remains stacked on top of the vertical column
                }
            } 
            // --- STANDARD TRACK STEPS ---
            else {
                if (direction === 'left') {
                    currentX = currentX - (prevTile.w / 2) - (width / 2);
                } else if (direction === 'right') {
                    currentX = currentX + (prevTile.w / 2) + (width / 2);
                } else if (direction === 'up') {
                    currentY = currentY - (prevTile.h / 2) - (height / 2);
                } else if (direction === 'turn-right') {
                    currentX = currentX + (prevTile.w / 2) + (width / 2);
                } else if (direction === 'turn-left') {
                    currentX = currentX - (prevTile.w / 2) - (width / 2);
                }
            }
        } else {
            currentX = (startDirection === 'left') ? currentX - (width / 2) : currentX + (width / 2);
        }

        layoutMap[tile.id] = { x: currentX, y: currentY, w: width, h: height, angle: angle };
        prevTile = { w: width, h: height };
    });

    return layoutMap;
}

// --- RENDERING INTEGRATION ---
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
    canvas.style.zIndex = '1';
    boardContainer.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(1400, TRACK.bottomY);
    ctx.lineTo(TRACK.leftX, TRACK.bottomY);
    ctx.lineTo(TRACK.leftX, TRACK.topY);
    ctx.lineTo(1400, TRACK.topY);
    ctx.moveTo(1400, TRACK.bottomY);
    ctx.lineTo(TRACK.rightX, TRACK.bottomY);
    ctx.lineTo(TRACK.rightX, TRACK.topY);
    ctx.lineTo(1400, TRACK.topY);
    ctx.stroke();

    const leftDeck = buildLeftBranch();
    const rightDeck = buildRightBranch();
    
    const combinedCoordinates = {
        ...calculateBranch(leftDeck, 'left'),
        ...calculateBranch(rightDeck, 'right')
    };

    [...leftDeck, ...rightDeck].forEach((tile) => {
        const coords = combinedCoordinates[tile.id];
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
