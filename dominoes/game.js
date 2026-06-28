const startBtn = document.getElementById('start-btn');
const loadingScreen = document.getElementById('loading-screen');
const gameTable = document.getElementById('game-table');

// Total original canvas dimensions
const canvasW = 597;
const canvasH = 1171;

/* The absolute coordinate definitions.
   hideFor arrays now accurately dictate which values require a pip to be obscured.
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

function buildMasterDeck() {
    const deck = [];
    for (let i = 0; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
            deck.push({
                id: `tile-${i}-${j}`,
                label: `[ ${i} - ${j} ]`,
                top: i,
                bottom: j
            });
        }
    }
    return deck;
}

// Drops cover patches precisely at percentage centers
function applyPipMasks(tileElement, value, coordinateMap) {
    coordinateMap.forEach(pip => {
        // If the current domino value means this pip should be hidden, cover it
        if (pip.hideFor.includes(value)) {
            const maskPatch = document.createElement('div');
            maskPatch.className = 'pip-mask-patch';
            
            // Convert raw pixel centers to precise element percentages
            const leftPercent = (pip.x / canvasW) * 100;
            const topPercent = (pip.y / canvasH) * 100;
            
            maskPatch.style.left = `${leftPercent}%`;
            maskPatch.style.top = `${topPercent}%`;
            
            tileElement.appendChild(maskPatch);
        }
    });
}

function displayFullTestingGrid() {
    gameTable.innerHTML = '';

    const gridContainer = document.createElement('div');
    gridContainer.className = 'test-grid-container';
    gameTable.appendChild(gridContainer);

    const masterDeck = buildMasterDeck();

    masterDeck.forEach((tile) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'debug-card-wrapper';

        const tileElement = document.createElement('div');
        tileElement.className = 'domino-item';
        tileElement.id = tile.id;

        // Apply masks for both halves directly using the pixel coordinate definitions
        applyPipMasks(tileElement, tile.top, topPipMap);
        applyPipMasks(tileElement, tile.bottom, bottomPipMap);

        const textLabel = document.createElement('div');
        textLabel.className = 'debug-label';
        textLabel.innerText = tile.label;

        wrapper.appendChild(tileElement);
        wrapper.appendChild(textLabel);
        gridContainer.appendChild(wrapper);
    });
}

setTimeout(() => {
    startBtn.disabled = false;
    startBtn.innerText = "TEST PIXEL COORDINATE GRID";
}, 1000);

startBtn.addEventListener('click', () => {
    loadingScreen.classList.add('hidden');
    gameTable.classList.remove('hidden');
    displayFullTestingGrid();
});
