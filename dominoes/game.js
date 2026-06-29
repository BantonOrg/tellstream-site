// ==========================================================================
// Tellstream Dominoes - Complete Vector Layout Engine & State Manager
// ==========================================================================

const gameTable = document.getElementById('game-table');
const loadingScreen = document.getElementById('loading-screen');
const dominoesLayer = document.getElementById('dominoes-layer');
const trackCanvas = document.getElementById('track-canvas');

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

// Complete 28-tile set divided structurally to match your layout baseline
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

function drawTrackGuide() {
    if (!trackCanvas) return;
    const ctx = trackCanvas.getContext('2d');
    trackCanvas.width = BOARD_NATIVE_W;
    trackCanvas.height = BOARD_NATIVE_H;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    
    // Left side loop track
    ctx.moveTo(1400, TRACK.bottomY);
    ctx.lineTo(TRACK.leftX, TRACK.bottomY);
    ctx.lineTo(TRACK.leftX, TRACK.topY);
    ctx.lineTo(1400, TRACK.topY);
    
    // Right side loop track
    ctx.moveTo(1400, TRACK.bottomY);
    ctx.lineTo(TRACK.rightX, TRACK.bottomY);
    ctx.lineTo(TRACK.rightX, TRACK.topY);
    ctx.lineTo(1400, TRACK.topY);
    
    ctx.stroke();
}

function renderTable() {
    dominoesLayer.innerHTML = '';

    const leftDeck = buildLeftBranch();
    const rightDeck = buildRightBranch();
    
    const combinedCoordinates = {
        ...calculateBranch(leftDeck, 'left'),
        ...calculateBranch(rightDeck, 'right')
    };

    // Mapping grid positions for standard 3x3 domino pip layouts
    const pipPositions = {
        1: [4],
        2: [0, 8],
        3: [0, 4, 8],
        4: [0, 2, 6, 8],
        5: [0, 2, 4, 6, 8],
        6: [0, 2, 3, 5, 6, 8]
    };

    function createHalfBlock(pipCount) {
        const half = document.createElement('div');
        half.className = 'domino-half';
        
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'pip-cell';
            if (pipPositions[pipCount] && pipPositions[pipCount].includes(i)) {
                const pip = document.createElement('div');
                pip.className = 'pip';
                cell.appendChild(pip);
            }
            half.appendChild(cell);
        }
        return half;
    }

    [...leftDeck, ...rightDeck].forEach((tile) => {
        const coords = combinedCoordinates[tile.id];
        if (!coords) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'live-card-wrapper';
        wrapper.style.width = `${coords.w}px`;
        wrapper.style.height = `${coords.h}px`;
        wrapper.style.left = `${coords.x - (coords.w / 2)}px`;
        wrapper.style.top = `${coords.y - (coords.h / 2)}px`;

        const rotationContainer = document.createElement('div');
        rotationContainer.style.width = `${TILE_BASE_W}px`;
        rotationContainer.style.height = `${TILE_BASE_H}px`;
        rotationContainer.style.transform = `rotate(${coords.angle}deg)`;
        rotationContainer.style.transformOrigin = 'center center';
        rotationContainer.style.position = 'relative';

        const tileElement = document.createElement('div');
        tileElement.className = 'domino-item';

        const topHalf = createHalfBlock(tile.top);
        
        const centerLine = document.createElement('div');
        centerLine.className = 'domino-center-line';
        
        const bottomHalf = createHalfBlock(tile.bottom);

        tileElement.appendChild(topHalf);
        tileElement.appendChild(centerLine);
        tileElement.appendChild(bottomHalf);

        rotationContainer.appendChild(tileElement);
        wrapper.appendChild(rotationContainer);
        dominoesLayer.appendChild(wrapper);
    });
}

function initEngine() {
    if (loadingScreen) loadingScreen.classList.add('hidden');
    drawTrackGuide();
    renderTable();
    resizeGameTableContainer();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEngine);
} else {
    initEngine();
}
window.addEventListener('resize', resizeGameTableContainer);
