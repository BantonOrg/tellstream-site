// ==========================================================================
// Tellstream Dominoes - Core Game Engine & Dynamic Board Layout
// ==========================================================================

const startBtn = document.getElementById('start-btn');
const loadingScreen = document.getElementById('loading-screen');
const gameTable = document.getElementById('game-table');

// Total native canvas dimensions of your master background image
const BOARD_NATIVE_W = 2730;
const BOARD_NATIVE_H = 1536;

// Original asset sizes for dom_front.gif
const canvasW = 597;
const canvasH = 1171;

// Crisp 75% scale footprint dimension metrics for vertical tiles
const TILE_BASE_W = 90;
const TILE_BASE_H = 176;

/* The absolute coordinate definitions.
   hideFor arrays dictate which values require a pip to be obscured.
*/
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

/**
 * Generates the clean data array for all 28 tiles in the deck
 */
function buildMasterDeck() {
    const deck = [];
    for (let i = 0; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
            deck.push({
                id: `tile-${i}-${j}`,
                label: `[ ${i} - ${j} ]`,
                top: i,
                bottom: j,
                isDouble: i === j
            });
        }
    }
    return deck;
}

/**
 * Drops mask patches precisely onto the scaled tile based on raw coordinate percentages
 */
function applyPipMasks(tileElement, value, coordinateMap) {
    coordinateMap.forEach(pip => {
        if (pip.hideFor.includes(value)) {
            const maskPatch = document.createElement('div');
            maskPatch.className = 'pip-mask-patch';
            
            const leftPercent = (pip.x / canvasW) * 100;
            const topPercent = (pip.y / canvasH) * 100;
            
            maskPatch.style.left = `${leftPercent}%`;
            maskPatch.style.top = `${topPercent}%`;
            
            tileElement.appendChild(maskPatch);
        }
    });
}

/**
 * Computes layout space using dynamic corner anchors and proactive safety edge boundary triggers
 */
function calculateCircuitLayout(deck) {
    const layoutMap = {};
    
    // Core starting coordinates centered underneath the main branding logo
    const startX = 1365;
    const startY = 1160;
    
    const leftBranchTiles = deck.slice(0, 14).reverse();
    const rightBranchTiles = deck.slice(14);

    // --- Process Left Branch (Fanning Left, Up Left Wall, then Inward Right across Top) ---
    let currentX = startX;
    let currentY = startY;
    let direction = 'left';
    let prevTile = null;

    leftBranchTiles.forEach((tile, index) => {
        let width = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
        let height = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
        let rotationDegrees = tile.isDouble ? 0 : 90;

        if (direction === 'left') {
            if (index > 0) {
                const prevWidth = prevTile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                currentX -= (prevWidth / 2) + (width / 2);
            }
            
            // PROACTIVE BOUNDARY CHECK: If the absolute left edge of this tile breaches safety line, force turn
            if (currentX - (width / 2) < 410) {
                direction = 'up';
                // Recalculate dimensions immediately for the vertical track flow change
                width = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
                height = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                rotationDegrees = tile.isDouble ? 90 : 0;
                
                // Pivot Alignment Corner Math: Snap the vertical tile cleanly onto the corner square
                const prevWidth = prevTile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                currentX = (currentX + (width / 2) + (prevWidth / 2)) - (TILE_BASE_W / 2);
                currentY -= (TILE_BASE_H / 2);
            }
        } 
        else if (direction === 'up') {
            width = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
            height = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
            rotationDegrees = tile.isDouble ? 90 : 0;

            if (prevTile.dir === 'up') {
                const prevHeight = prevTile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                currentY -= (prevHeight / 2) + (height / 2);
            }

            // PROACTIVE CEILING CHECK: If the top edge breaches the safety line, turn inward right
            if (currentY - (height / 2) < 260) {
                direction = 'right';
                width = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                height = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
                rotationDegrees = tile.isDouble ? 0 : 90;
                
                // Top Corner Pivot Math: Align centers perfectly to form the crisp flush L-turn
                const prevHeight = prevTile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                currentY = (currentY + (height / 2) + (prevHeight / 2)) - (TILE_BASE_W / 2);
                currentX += (TILE_BASE_H / 2);
            }
        } 
        else if (direction === 'right') {
            width = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
            height = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
            rotationDegrees = tile.isDouble ? 0 : 90;

            const prevWidth = prevTile.dir === 'up' 
                ? (prevTile.isDouble ? TILE_BASE_H : TILE_BASE_W)
                : (prevTile.isDouble ? TILE_BASE_W : TILE_BASE_H);
                
            currentX += (prevWidth / 2) + (width / 2);
        }

        layoutMap[tile.id] = { x: currentX, y: currentY, w: width, h: height, angle: rotationDegrees, dir: direction };
        prevTile = { isDouble: tile.isDouble, dir: direction };
    });

    // --- Process Right Branch (Fanning Right, Up Right Wall, then Inward Left across Top) ---
    currentX = startX;
    currentY = startY;
    direction = 'right';
    prevTile = null;

    rightBranchTiles.forEach((tile, index) => {
        let width = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
        let height = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
        let rotationDegrees = tile.isDouble ? 0 : 90;

        if (direction === 'right') {
            if (index > 0) {
                const prevWidth = prevTile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                currentX += (prevWidth / 2) + (width / 2);
            }
            
            // PROACTIVE BOUNDARY CHECK: If absolute right edge breaches safety line, force turn up
            if (currentX + (width / 2) > 2320) {
                direction = 'up';
                width = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
                height = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                rotationDegrees = tile.isDouble ? 90 : 0;
                
                // Pivot Alignment Corner Math: Match faces flush for the right-hand corner switch
                const prevWidth = prevTile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                currentX = (currentX - (width / 2) - (prevWidth / 2)) + (TILE_BASE_W / 2);
                currentY -= (TILE_BASE_H / 2);
            }
        } 
        else if (direction === 'up') {
            width = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
            height = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
            rotationDegrees = tile.isDouble ? 90 : 0;

            if (prevTile.dir === 'up') {
                const prevHeight = prevTile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                currentY -= (prevHeight / 2) + (height / 2);
            }

            // PROACTIVE CEILING CHECK: If top edge breaches safety line, turn inward left
            if (currentY - (height / 2) < 260) {
                direction = 'left';
                width = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                height = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
                rotationDegrees = tile.isDouble ? 0 : 90;
                
                // Top Right Corner Pivot Math: Align centers perfectly to run smoothly under the neon strip
                const prevHeight = prevTile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                currentY = (currentY + (height / 2) + (prevHeight / 2)) - (TILE_BASE_W / 2);
                currentX -= (TILE_BASE_H / 2);
            }
        } 
        else if (direction === 'left') {
            width = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
            height = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
            rotationDegrees = tile.isDouble ? 0 : 90;

            const prevWidth = prevTile.dir === 'up' 
                ? (prevTile.isDouble ? TILE_BASE_H : TILE_BASE_W)
                : (prevTile.isDouble ? TILE_BASE_W : TILE_BASE_H);
                
            currentX -= (prevWidth / 2) + (width / 2);
        }

        layoutMap[tile.id] = { x: currentX, y: currentY, w: width, h: height, angle: rotationDegrees, dir: direction };
        prevTile = { isDouble: tile.isDouble, dir: direction };
    });

    return layoutMap;
}

/**
 * Dynamically updates the scale vector matrix to match the current viewport frame bounds
 */
function resizeGameTableContainer() {
    const container = document.querySelector('.match-board-container');
    if (!container) return;

    const windowW = window.innerWidth;
    const windowH = window.innerHeight;

    const scaleX = windowW / BOARD_NATIVE_W;
    const scaleY = windowH / BOARD_NATIVE_H;
    const fitScale = Math.min(scaleX, scaleY);

    container.style.transform = `scale(${fitScale})`;
}

/**
 * Main rendering loop mapping positions cleanly onto the table container
 */
function displayDynamicMatchTable() {
    gameTable.innerHTML = '';

    const boardContainer = document.createElement('div');
    boardContainer.className = 'match-board-container';
    
    boardContainer.style.width = `${BOARD_NATIVE_W}px`;
    boardContainer.style.height = `${BOARD_NATIVE_H}px`;
    boardContainer.style.position = 'absolute';
    gameTable.appendChild(boardContainer);

    const masterDeck = buildMasterDeck();
    const layoutCoordinates = calculateCircuitLayout(masterDeck);

    masterDeck.forEach((tile) => {
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
        textLabel.innerText = tile.label;

        rotationContainer.appendChild(tileElement);
        wrapper.appendChild(rotationContainer);
        wrapper.appendChild(textLabel);
        boardContainer.appendChild(wrapper);
    });

    resizeGameTableContainer();
}

window.addEventListener('resize', resizeGameTableContainer);

setTimeout(() => {
    startBtn.disabled = false;
    startBtn.innerText = "TEST DYNAMIC CIRCUIT GRID";
}, 1000);

startBtn.addEventListener('click', () => {
    loadingScreen.classList.add('hidden');
    gameTable.classList.remove('hidden');
    displayDynamicMatchTable();
});
