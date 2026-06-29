// ==========================================================================
// Tellstream Dominoes - Refined Track Alignment
// ==========================================================================

const gameTable = document.getElementById('game-table');
const loadingScreen = document.getElementById('loading-screen');

const BOARD_NATIVE_W = 2730;
const BOARD_NATIVE_H = 1536;

// Left and right channels moved inward precisely according to your visual markers
const TRACK = {
    bottomY: 1160,  // Kept locked to the bottom domino track line
    topY:    310,   // Kept locked exactly where it was
    leftX:   560,   // Moved INWARD: Pulled right to match your left marker
    rightX:  2170   // Moved INWARD: Pulled left to match your right marker
};

function resizeGameTableContainer() {
    const container = document.querySelector('.match-board-container');
    if (!container) return;
    const fitScale = Math.min(window.innerWidth / BOARD_NATIVE_W, window.innerHeight / BOARD_NATIVE_H);
    container.style.transform = `scale(${fitScale})`;
}

function drawPerfectPathTrack() {
    if (loadingScreen) loadingScreen.classList.add('hidden');
    if (gameTable) gameTable.classList.remove('hidden');

    gameTable.innerHTML = '';

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
    canvas.style.zIndex = '9999';
    boardContainer.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, BOARD_NATIVE_W, BOARD_NATIVE_H);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'miter';
    
    ctx.beginPath();
    
    // Trace balanced track loop
    ctx.moveTo(TRACK.rightX, TRACK.bottomY);
    ctx.lineTo(TRACK.leftX, TRACK.bottomY);
    ctx.lineTo(TRACK.leftX, TRACK.topY);
    ctx.lineTo(TRACK.rightX, TRACK.topY);
    ctx.lineTo(TRACK.rightX, TRACK.bottomY);
    
    ctx.stroke();

    ctx.fillStyle = '#00FFFF';
    const corners = [
        { x: TRACK.leftX, y: TRACK.bottomY },
        { x: TRACK.leftX, y: TRACK.topY },
        { x: TRACK.rightX, y: TRACK.topY },
        { x: TRACK.rightX, y: TRACK.bottomY }
    ];
    
    corners.forEach(corner => {
        ctx.beginPath();
        ctx.arc(corner.x, corner.y, 10, 0, 2 * Math.PI);
        ctx.fill();
    });

    resizeGameTableContainer();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', drawPerfectPathTrack);
} else {
    drawPerfectPathTrack();
}

window.addEventListener('resize', resizeGameTableContainer);
