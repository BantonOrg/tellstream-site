// ==========================================================================
// Tellstream Dominoes - Direct Coordinate Visual Path Check
// ==========================================================================

const gameTable = document.getElementById('game-table');
const loadingScreen = document.getElementById('loading-screen');

const BOARD_NATIVE_W = 2730;
const BOARD_NATIVE_H = 1536;

// Direct track intersections mapped directly to your board paths
const TRACK = {
    bottomY: 1160,  // Exact horizontal center line matching the first domino track
    topY:    511,   // Calculated center line between Top Outer and Top Inner (693)
    leftX:   684,   // Calculated center line between Left Outer and Left Inner (940)
    rightX:  2110   // Calculated center line between Right Inner (1794) and Right Outer
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

    // Wipe out any old elements or text labels
    gameTable.innerHTML = '';

    const boardContainer = document.createElement('div');
    boardContainer.className = 'match-board-container';
    boardContainer.style.width = `${BOARD_NATIVE_W}px`;
    boardContainer.style.height = `${BOARD_NATIVE_H}px`;
    boardContainer.style.position = 'absolute';
    gameTable.appendChild(boardContainer);

    // Create a high-res rendering canvas for the path line
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

    // Clear, sharp white path line styling
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'miter';
    
    // Begin path loop trace
    ctx.beginPath();
    
    // Start at Bottom Right
    ctx.moveTo(TRACK.rightX, TRACK.bottomY);
    // Track horizontally to Left Corner
    ctx.lineTo(TRACK.leftX, TRACK.bottomY);
    // Track vertically to Top Left Corner
    ctx.lineTo(TRACK.leftX, TRACK.topY);
    // Track horizontally to Top Right Corner
    ctx.lineTo(TRACK.rightX, TRACK.topY);
    // Track vertically back to Bottom Right
    ctx.lineTo(TRACK.rightX, TRACK.bottomY);
    
    ctx.stroke();

    // Blue anchor points on corner joints to see exact turning vertexes
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
