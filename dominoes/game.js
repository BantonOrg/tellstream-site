// ==========================================================================
// Tellstream Dominoes - Core Game Engine & Dynamic Board Layout
// ==========================================================================

const startBtn = document.getElementById('start-btn');
const loadingScreen = document.getElementById('loading-screen');
const gameTable = document.getElementById('game-table');

// Total original canvas dimensions
const canvasW = 597;
const canvasH = 1171;

// Scaled domino dimensions for the table view (~0.2 scale)
const SINGLE_W = 235;
const SINGLE_H = 120;
const DOUBLE_W = 120;
const DOUBLE_H = 235;

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
 * Computes the layout coordinates for all 28 tiles winding around the table boundaries
 */
function calculateCircuitLayout(deck) {
    const layoutMap = {};
    
    // Starting baseline settings
    const startX = 1365;
    const startY = 1160;
    
    // Split deck right down the middle
    const leftBranchTiles = deck.slice(0, 14).reverse(); // Tiles 14 down to 1
    const rightBranchTiles = deck.slice(14);             // Tiles 15 up to 28

    // --- Process Left Branch (Moving Left, Turning Up Left Wall, Heading Right at Top) ---
    let currentX = startX;
    let currentY = startY;
    let direction = 'left'; 
    let lastIsDouble = false;

    leftBranchTiles.forEach((tile, index) => {
        let width, height;

        if (direction === 'left') {
            width = tile.isDouble ? DOUBLE_W : SINGLE_W;
            height = tile.isDouble ? DOUBLE_H : SINGLE_H;

            if (index > 0) {
                const offset = lastIsDouble 
                    ? (DOUBLE_W / 2) + (width / 2)
                    : (SINGLE_W / 2) + (width / 2);
                currentX -= offset;
            }

            // Turn Trigger: If we near the left extreme limit (107), prepare to head up
            if (currentX - (width / 2) < 350) {
                direction = 'up';
            }
        } else if (direction === 'up') {
            // Turning along the left wall: swap orientation logic to crawl upward cleanly
            width = tile.isDouble ? DOUBLE_H : SINGLE_H;
            height = tile.isDouble ? DOUBLE_W : SINGLE_W;

            const offset = lastIsDouble
                ? (DOUBLE_W / 2) + (height / 2)
                : (SINGLE_W / 2) + (height / 2);
            currentY -= offset;

            // Turn Trigger: If we near the top extreme limit (95), turn inward right
            if (currentY - (height / 2) < 250) {
                direction = 'right';
            }
        } else if (direction === 'right') {
            width = tile.isDouble ? DOUBLE_W : SINGLE_W;
            height = tile.isDouble ? DOUBLE_H : SINGLE_H;

            const offset = lastIsDouble
                ? (DOUBLE_W / 2) + (width / 2)
                : (SINGLE_W / 2) + (width / 2);
            currentX += offset;
        }

        layoutMap[tile.id] = { x: currentX, y: currentY, w: width, h: height, isDouble: tile.isDouble, dir: direction };
        lastIsDouble = tile.isDouble;
    });

    // --- Process Right Branch (Moving Right, Turning Up Right Wall, Heading Left at Top) ---
    currentX = startX;
    currentY = startY;
    direction = 'right';
    lastIsDouble = false;

    rightBranchTiles.forEach((tile, index) => {
        let width, height;

        if (direction === 'right') {
            width = tile.isDouble ? DOUBLE_W : SINGLE_W;
            height = tile.isDouble ? DOUBLE_H : SINGLE_H;

            if (index > 0) {
                const offset = lastIsDouble 
                    ? (DOUBLE_W / 2) + (width / 2)
                    : (SINGLE_W / 2) + (width / 2);
                currentX += offset;
            }

            // Turn Trigger: If we near the right extreme limit (2645), prepare to head up
            if (currentX + (width / 2) > 2380) {
                direction = 'up';
            }
        } else if (direction === 'up') {
            // Turning along the right wall: crawl upward cleanly
            width = tile.isDouble ? DOUBLE_H : SINGLE_H;
            height = tile.isDouble ? DOUBLE_W : SINGLE_W;

            const offset = lastIsDouble
                ? (DOUBLE_W / 2) + (height / 2)
                : (SINGLE_W / 2) + (height / 2);
            currentY -= offset;

            // Turn Trigger: If we near the top extreme limit (95), turn inward left
            if (currentY - (height / 2) < 250) {
                direction = 'left';
            }
        } else if (direction === 'left') {
            width = tile.isDouble ? DOUBLE_W : SINGLE_W;
            height = tile.isDouble ? DOUBLE_H : SINGLE_H;

            const offset = lastIsDouble
                ? (DOUBLE_W / 2) + (width / 2)
                : (SINGLE_W / 2) + (width / 2);
            currentX -= offset;
        }

        layoutMap[tile.id] = { x: currentX, y: currentY, w: width, h: height, isDouble: tile.isDouble, dir: direction };
        lastIsDouble = tile.isDouble;
    });

    return layoutMap;
}

/**
 * Main rendering loop that projects the 28 calculated domino cards onto the table layout
 */
function displayDynamicMatchTable() {
    gameTable.innerHTML = '';

    // Create a container matched exactly to the table_bg.jpg size limits
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

        const wrapper = document.createElement('div');
        wrapper.className = 'live-card-wrapper';
        wrapper.style.width = `${coords.w}px`;
        wrapper.style.height = `${coords.h}px`;
        wrapper.style.left = `${coords.x - (coords.w / 2)}px`;
        wrapper.style.top = `${coords.y - (coords.h / 2)}px`;
        wrapper.style.position = 'absolute';

        const tileElement = document.createElement('div');
        tileElement.className = 'domino-item';
        tileElement.id = tile.id;
        tileElement.style.width = '100%';
        tileElement.style.height = '100%';

        // Dynamically rotate the visual asset mask maps based on the current track direction
        if (coords.dir === 'up' || (coords.dir === 'left' && !coords.isDouble) || (coords.dir === 'right' && coords.isDouble)) {
            tileElement.classList.add('rotated-tile');
            applyPipMasks(tileElement, tile.top, topPipMap);
            applyPipMasks(tileElement, tile.bottom, bottomPipMap);
        } else {
            applyPipMasks(tileElement, tile.top, topPipMap);
            applyPipMasks(tileElement, tile.bottom, bottomPipMap);
        }

        const textLabel = document.createElement('div');
        textLabel.className = 'debug-label';
        textLabel.innerText = tile.label;

        wrapper.appendChild(tileElement);
        wrapper.appendChild(textLabel);
        boardContainer.appendChild(wrapper);
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
