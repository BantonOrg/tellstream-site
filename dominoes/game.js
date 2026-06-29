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
    // 13 Tiles total matching out from center
    return [
        { id: 'l1', top: 6, bottom: 5, isDouble: false },
        { id: 'l2', top: 5, bottom: 4, isDouble: false },
        { id: 'l3', top: 4, bottom: 4, isDouble: true },  // Crosswise double
        { id: 'l4', top: 4, bottom: 3, isDouble: false },
        { id: 'l5', top: 3, bottom: 2, isDouble: false }, 
        { id: 'l6', top: 2, bottom: 2, isDouble: true },  // Hits near the corner track
        { id: 'l7', top: 2, bottom: 1, isDouble: false }, // Climbs Left Wall
        { id: 'l8', top: 1, bottom: 1, isDouble: true },
        { id: 'l9', top: 1, bottom: 0, isDouble: false },
        { id: 'l10', top: 0, bottom: 0, isDouble: true },
        { id: 'l11', top: 0, bottom: 3, isDouble: false },
        { id: 'l12', top: 3, bottom: 5, isDouble: false },
        { id: 'l13', top: 5, bottom: 5, isDouble: true }
    ];
}

function buildRightBranch() {
    // 15 Tiles total (including the center starting tile r1)
    return [
        { id: 'r1', top: 6, bottom: 6, isDouble: true },  // CENTER STARTING TILE (The Spinner)
        { id: 'r2', top: 6, bottom: 4, isDouble: false },
        { id: 'r3', top: 4, bottom: 2, isDouble: false },
        { id: 'r4', top: 2, bottom: 5, isDouble: false },
        { id: 'r5', top: 5, bottom: 1, isDouble: false },
        { id: 'r6', top: 1, bottom: 3, isDouble: false },
        { id: 'r7', top: 3, bottom: 3, isDouble: true },
        { id: 'r8', top: 3, bottom: 6, isDouble: false },
        { id: 'r9', top: 6, bottom: 1, isDouble: false },
        { id: 'r10', top: 1, bottom: 4, isDouble: false }, // Hits Right Corner!
        { id: 'r11', top: 4, bottom: 5, isDouble: false }, // Climbs Right Wall
        { id: 'r12', top: 5, bottom: 0, isDouble: false },
        { id: 'r13', top: 0, bottom: 2, isDouble: false },
        { id: 'r14', top: 2, bottom: 6, isDouble: false },
        { id: 'r15', top: 0, bottom: 4, isDouble: false }
    ];
}

function calculateBranch(deck, startDirection) {
    const layoutMap = {};
    
    // Establish initial head position at center bottom line
    let headX = 1400; 
    let headY = TRACK.bottomY;
    
    // Vector states: Left = [-1, 0], Right = [1, 0], Up = [0, -1]
    let vector = (startDirection === 'left') ? [-1, 0] : [1, 0];
    let prevTile = null;

    deck.forEach((tile, index) => {
        let isMovingHorizontal = vector[1] === 0;
        
        // Dynamic orientation based on active path vector direction
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
            // Calculate step space: Half of previous tile + half of current tile
            let stepDist = isMovingHorizontal 
                ? (prevTile.w / 2) + (width / 2)
                : (prevTile.h / 2) + (height / 2);

            // Project boundary coordinate
            let nextX = headX + (vector[0] * stepDist);
            let nextY = headY + (vector[1] * stepDist);

            // Handle Left Boundary Cross
            if (startDirection === 'left' && vector[0] === -1 && nextX <= TRACK.leftX) {
                headX = TRACK.leftX;
                vector = [0, -1]; // Flip path vector straight UP
                isMovingHorizontal = false;

                // Re-evaluate orientation instantly for vertical track
                width = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
                height = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                angle = tile.isDouble ? 90 : 0;

                headY = TRACK.bottomY - (height / 2);
            } 
            // Handle Right Boundary Cross
            else if (startDirection === 'right' && vector[0] === 1 && nextX >= TRACK.rightX) {
                headX = TRACK.rightX;
                vector = [0, -1]; // Flip path vector straight UP
                isMovingHorizontal = false;

                // Re-evaluate orientation instantly for vertical track
                width = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
                height = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                angle = tile.isDouble ? 90 : 0;

                headY = TRACK.bottomY - (height / 2);
            } 
            else {
                // Keep moving along current path vector
                headX = nextX;
                headY = nextY;
            }
        } else {
            // Place initial tiles offsetting away from exact mid point 1400
            headX = (startDirection === 'left') ? headX - (width / 2) : headX + (width / 2);
        }

        // Store layout positioning vectors
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
