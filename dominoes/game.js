// ==========================================================================
// Tellstream Dominoes - Clean Array-Driven Structural Corner Test
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

function buildLeftBranch() {
    return [
        { id: 'l1', top: 6, bottom: 5, isDouble: false, isCornerTurner: false },
        { id: 'l2', top: 5, bottom: 4, isDouble: false, isCornerTurner: false },
        { id: 'l3', top: 4, bottom: 3, isDouble: false, isCornerTurner: false }, 
        { id: 'l4', top: 3, bottom: 2, isDouble: false, isCornerTurner: false }, // Stays flat
        { id: 'l5', top: 2, bottom: 1, isDouble: false, isCornerTurner: true  }, // Explicit turn execution point
        { id: 'l6', top: 1, bottom: 0, isDouble: false, isCornerTurner: false }
    ];
}

function buildRightBranch() {
    return [
        { id: 'r1', top: 6, bottom: 5, isDouble: false, isCornerTurner: false },
        { id: 'r2', top: 5, bottom: 4, isDouble: false, isCornerTurner: false },
        { id: 'r3', top: 4, bottom: 3, isDouble: false, isCornerTurner: false }, 
        { id: 'r4', top: 3, bottom: 2, isDouble: false, isCornerTurner: true  }, // Explicit turn execution point
        { id: 'r5', top: 2, bottom: 1, isDouble: false, isCornerTurner: false }, 
        { id: 'r6', top: 1, bottom: 0, isDouble: false, isCornerTurner: false }
    ];
}

function calculateBranch(deck, startDirection) {
    const layoutMap = {};
    let currentX = 1400; 
    let currentY = TRACK.bottomY;
    let direction = startDirection; 
    let prevTile = null;

    deck.forEach((tile, index) => {
        let width = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
        let height = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
        let angle = tile.isDouble ? 0 : 90;

        if (index > 0) {
            if (direction === 'left') {
                const stepX = currentX - (prevTile.w / 2) - (width / 2);
                
                if (tile.isCornerTurner) {
                    direction = 'up';
                    
                    width = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
                    height = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                    angle = tile.isDouble ? 90 : 0;

                    const optionA_X = currentX; 
                    const optionA_X_Dist = Math.abs(optionA_X - TRACK.leftX);
                    const optionB_X = stepX;
                    const optionB_X_Dist = Math.abs(optionB_X - TRACK.leftX);
                    
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
            else if (direction === 'right') {
                const stepX = currentX + (prevTile.w / 2) + (width / 2);
                
                if (tile.isCornerTurner) {
                    direction = 'up';
                    
                    width = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
                    height = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                    angle = tile.isDouble ? 90 : 0;

                    const optionA_X = currentX; 
                    const optionA_X_Dist = Math.abs(optionA_X - TRACK.rightX);
                    const optionB_X = stepX;
                    const optionB_X_Dist = Math.abs(optionB_X - TRACK.rightX);
                    
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
                width = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
                height = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                angle = tile.isDouble ? 90 : 0;
                currentY -= (prevTile.h / 2) + (height / 2);
            }
        } else {
            currentX = (startDirection === 'left') ? currentX - (width / 2) : currentX + (width / 2);
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
    ctx.moveTo(1400, TRACK.bottomY);
    ctx.lineTo(TRACK.rightX, TRACK.bottomY);
    ctx.lineTo(TRACK.rightX, TRACK.topY);
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
