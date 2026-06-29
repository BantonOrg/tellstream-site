// ==========================================================================
// Tellstream Dominoes - Clean Array-Driven Structural Corner Test
// ==========================================================================

const BOARD_NATIVE_W = 2730;
const BOARD_NATIVE_H = 1536;

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
        { id: 'l1', top: 6, bottom: 5, isDouble: false },
        { id: 'l2', top: 5, bottom: 4, isDouble: false },
        { id: 'l3', top: 4, bottom: 4, isDouble: true },  
        { id: 'l4', top: 4, bottom: 3, isDouble: false },
        { id: 'l5', top: 3, bottom: 2, isDouble: false }, 
        { id: 'l6', top: 2, bottom: 2, isDouble: true },  
        { id: 'l7', top: 2, bottom: 1, isDouble: false }, 
        { id: 'l8', top: 1, bottom: 1, isDouble: true },
        { id: 'l9', top: 1, bottom: 0, isDouble: false },
        { id: 'l10', top: 0, bottom: 0, isDouble: true },
        { id: 'l11', top: 0, bottom: 3, isDouble: false },
        { id: 'l12', top: 3, bottom: 5, isDouble: false },
        { id: 'l13', top: 5, bottom: 5, isDouble: true }
    ];
}

function buildRightBranch() {
    return [
        { id: 'r1', top: 6, bottom: 6, isDouble: true },  
        { id: 'r2', top: 6, bottom: 4, isDouble: false },
        { id: 'r3', top: 4, bottom: 2, isDouble: false },
        { id: 'r4', top: 2, bottom: 5, isDouble: false },
        { id: 'r5', top: 5, bottom: 1, isDouble: false },
        { id: 'r6', top: 1, bottom: 3, isDouble: false },
        { id: 'r7', top: 3, bottom: 3, isDouble: true },
        { id: 'r8', top: 3, bottom: 6, isDouble: false },
        { id: 'r9', top: 6, bottom: 1, isDouble: false },
        { id: 'r10', top: 1, bottom: 4, isDouble: false }, 
        { id: 'r11', top: 4, bottom: 5, isDouble: false }, 
        { id: 'r12', top: 5, bottom: 0, isDouble: false },
        { id: 'r13', top: 0, bottom: 2, isDouble: false },
        { id: 'r14', top: 2, bottom: 6, isDouble: false },
        { id: 'r15', top: 0, bottom: 4, isDouble: false }
    ];
}

function calculateBranch(deck, startDirection) {
    const layoutMap = {};
    let headX = 1400; 
    let headY = TRACK.bottomY;
    let vector = (startDirection === 'left') ? [-1, 0] : [1, 0];
    let prevTile = null;

    deck.forEach((tile, index) => {
        let isMovingHorizontal = vector[1] === 0;
        let width, height, angle;
        
        if (tile.isDouble) {
            width = isMovingHorizontal ? TILE_BASE_W : TILE_BASE_H;
            height = isMovingHorizontal ? TILE_BASE_H : TILE_BASE_W;
            angle = isMovingHorizontal ? 0 : 90;
        } else {
            width = isMovingHorizontal ? TILE_BASE_H : TILE_BASE_W;
            height = isMovingHorizontal ? TILE_BASE_W : TILE_BASE_H;
            angle = isMovingHorizontal ? 90 : 0;
        }

        if (index > 0) {
            let stepDist = isMovingHorizontal 
                ? (prevTile.w / 2) + (width / 2)
                : (prevTile.h / 2) + (height / 2);

            let nextX = headX + (vector[0] * stepDist);
            let nextY = headY + (vector[1] * stepDist);

            if (startDirection === 'left') {
                if (vector[0] === -1 && nextX <= TRACK.leftX) {
                    vector = [0, -1]; 
                    isMovingHorizontal = false;
                    width = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
                    height = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                    angle = tile.isDouble ? 90 : 0;
                    headX = TRACK.leftX;
                    headY = TRACK.bottomY - (prevTile.h / 2) - (height / 2);
                } 
                else if (vector[1] === -1 && nextY <= TRACK.topY) {
                    vector = [1, 0]; 
                    isMovingHorizontal = true;
                    width = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                    height = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
                    angle = tile.isDouble ? 0 : 90;
                    headX = TRACK.leftX + (prevTile.w / 2) + (width / 2);
                    headY = TRACK.topY;
                } 
                else {
                    headX = nextX;
                    headY = nextY;
                }
            } 
            else if (startDirection === 'right') {
                if (vector[0] === 1 && nextX >= TRACK.rightX) {
                    vector = [0, -1]; 
                    isMovingHorizontal = false;
                    width = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
                    height = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                    angle = tile.isDouble ? 90 : 0;
                    headX = TRACK.rightX;
                    headY = TRACK.bottomY - (prevTile.h / 2) - (height / 2);
                } 
                else if (vector[1] === -1 && nextY <= TRACK.topY) {
                    vector = [-1, 0]; 
                    isMovingHorizontal = true;
                    width = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                    height = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
                    angle = tile.isDouble ? 0 : 90;
                    headX = TRACK.rightX - (prevTile.w / 2) - (width / 2);
                    headY = TRACK.topY;
                } 
                else {
                    headX = nextX;
                    headY = nextY;
                }
            }
        } else {
            headX = (startDirection === 'left') ? headX - (width / 2) : headX + (width / 2);
        }

        layoutMap[tile.id] = { x: headX, y: headY, w: width, h: height, angle: angle };
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

function renderLiveTable(boardLineArray) {
    const gameTable = document.getElementById('game-table');
    if (!gameTable) return;

    const leftDeck = boardLineArray ? boardLineArray.filter(t => t.side === 'left') : buildLeftBranch();
    const rightDeck = boardLineArray ? boardLineArray.filter(t => t.side === 'right') : buildRightBranch();
    
    const existingContainer = document.querySelector('.match-board-container');
    if (existingContainer) existingContainer.remove();

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

function setupClickEvent() {
    const startBtn = document.getElementById('start-btn');
    const loadingScreen = document.getElementById('loading-screen');
    
    if (startBtn) {
        startBtn.removeAttribute('disabled');
        startBtn.innerText = "Click to Enter Lounge";
        startBtn.addEventListener('click', () => {
            if (loadingScreen) loadingScreen.classList.add('hidden');
            if (typeof initNetwork === 'function') {
                initNetwork();
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupClickEvent);
} else {
    setupClickEvent();
}
window.addEventListener('resize', resizeGameTableContainer);
