// ==========================================================================
// Tellstream Dominoes - Core Game Engine & Dynamic Board Layout
// ==========================================================================

const startBtn = document.getElementById('start-btn');
const loadingScreen = document.getElementById('loading-screen');
const gameTable = document.getElementById('game-table');

// Total original canvas dimensions of dom_front.gif
const canvasW = 597;
const canvasH = 1171;

// Absolute dimension metrics for a scaled vertical tile asset (~0.2 scale)
const TILE_BASE_W = 120;
const TILE_BASE_H = 235;

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
 * Computes layout space step-by-step using strict end-to-end alignment rules
 */
function calculateCircuitLayout(deck) {
    const layoutMap = {};
    
    // Starting coordinates below logo
    const startX = 1365;
    const startY = 1160;
    
    const leftBranchTiles = deck.slice(0, 14).reverse();
    const rightBranchTiles = deck.slice(14);

    // Track state configurations
    let currentX = startX;
    let currentY = startY;
    let direction = 'left';
    let prevTile = null;

    // --- Process Left Branch (Fanning Left, Up, then Inward Right) ---
    leftBranchTiles.forEach((tile, index) => {
        let width = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
        let height = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
        let rotationDegrees = tile.isDouble ? 0 : 90;

        if (direction === 'left') {
            if (index > 0) {
                const prevWidth = prevTile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                currentX -= (prevWidth / 2) + (width / 2);
            }
            if (currentX < 450) direction = 'up';
        } 
        else if (direction === 'up') {
            width = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
            height = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
            rotationDegrees = tile.isDouble ? 90 : 0;

            const prevHeight = prevTile.dir === 'left' 
                ? (prevTile.isDouble ? TILE_BASE_H : TILE_BASE_W)
                : (prevTile.isDouble ? TILE_BASE_W : TILE_BASE_H);
            
            currentY -= (prevHeight / 2) + (height / 2);
            if (currentY < 250) direction = 'right';
        } 
        else if (direction === 'right') {
            width = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
            height = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
            rotationDegrees = tile.isDouble ? 0 : 90;

            const prevWidth = prevTile.isDouble ? TILE_BASE_H : TILE_BASE_W;
            currentX += (prevWidth / 2) + (width / 2);
        }

        layoutMap[tile.id] = { x: currentX, y: currentY, angle: rotationDegrees };
        prevTile = { isDouble: tile.isDouble, dir: direction };
    });

    // --- Process Right Branch (Fanning Right, Up, then Inward Left) ---
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
            if (currentX > 2280) direction = 'up';
        } 
        else if (direction === 'up') {
            width = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
            height = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
            rotationDegrees = tile.isDouble ? 90 : 0;

            const prevHeight = prevTile.dir === 'right' 
                ? (prevTile.isDouble ? TILE_BASE_H : TILE_BASE_W)
                : (prevTile.isDouble ? TILE_BASE_W : TILE_BASE_H);

            currentY -= (prevHeight / 2) + (height / 2);
            if (currentY < 250) direction = 'left';
        } 
        else if (direction === 'left') {
            width = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
            height = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
            rotationDegrees = tile.isDouble ? 0 : 90;

            const prevWidth = prevTile.isDouble ? TILE_BASE_H : TILE_BASE_W;
            currentX -= (prevWidth / 2) + (width / 2);
        }

        layoutMap[tile.id] = { x: currentX, y: currentY, angle: rotationDegrees };
        prevTile = { isDouble: tile.isDouble, dir: direction };
    });

    return layoutMap;
}

/**
 * Main rendering loop mapping positions cleanly onto the table container
 */
function displayDynamicMatchTable() {
    gameTable.innerHTML = '';

    const boardContainer = document.createElement('div');
    boardContainer.className = 'match-board-container';
    boardContainer.style.width = '2730px';
    boardContainer.style.height = '1536px';
    boardContainer.style.position = 'relative';
    gameTable.appendChild(boardContainer);

    const masterDeck = buildMasterDeck();
    const layoutCoordinates = calculateCircuitLayout(masterDeck);

    masterDeck.forEach((tile) => {
        const coords = layoutCoordinates[tile.id];
        if (!coords) return;

        // Create the tile element directly at standard native dimensions
        const tileElement = document.createElement('div');
        tileElement.className = 'domino-item';
        tileElement.id = tile.id;
        tileElement.style.width = `${TILE_BASE_W}px`;
        tileElement.style.height = `${TILE_BASE_H}px`;
        tileElement.style.position = 'absolute';
        
        // Offset coordinates by half width/height to center position perfectly
        tileElement.style.left = `${coords.x - (TILE_BASE_W / 2)}px`;
        tileElement.style.top = `${coords.y - (TILE_BASE_H / 2)}px`;

        // Apply masks while tile is perfectly straight (Guarantees precision alignment)
        applyPipMasks(tileElement, tile.top, topPipMap);
        applyPipMasks(tileElement, tile.bottom, bottomPipMap);

        // Spin the entire completed object including its mask children safely
        tileElement.style.transform = `rotate(${coords.angle}deg)`;

        const textLabel = document.createElement('div');
        textLabel.className = 'debug-label';
        textLabel.innerText = tile.label;
        tileElement.appendChild(textLabel);

        boardContainer.appendChild(tileElement);
    });
}

setTimeout(() => {
    startBtn.disabled = false;
    startBtn.innerText = "TEST DYNAMIC CIRCUIT GRID";
}, 1000);

startBtn.addEventListener('click', () => {
    loadingScreen.classList.add('hidden');
    gameTable.classList.remove('hidden');
    displayDynamicMatchTable();
});
