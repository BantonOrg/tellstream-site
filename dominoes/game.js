const startBtn = document.getElementById('start-btn');
const loadingScreen = document.getElementById('loading-screen');
const gameTable = document.getElementById('game-table');

// The 7 active coordinates on our 3x3 matrix (ignoring Row 1 Col 2 and Row 3 Col 2)
const activePipPositions = [
    { row: 1, col: 1 }, { row: 1, col: 3 },
    { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 },
    { row: 3, col: 1 }, { row: 3, col: 3 }
];

// Returns true if a specific pip coordinate should be hidden to generate the target value
function shouldHidePip(value, row, col) {
    switch (value) {
        case 0: // Blank: Wipe everything out
            return true;
            
        case 1: // One: Hide all 6 outer pips, keep the exact center (2,2)
            return !(row === 2 && col === 2);
            
        case 2: // Two: Hide 5 pips, leaving a clean top-left to bottom-right diagonal line
            return !( (row === 1 && col === 1) || (row === 3 && col === 3) );
            
        case 3: // Three: Hide 4 pips, keeping the full clean diagonal line across the matrix
            return !( (row === 1 && col === 1) || (row === 2 && col === 2) || (row === 3 && col === 3) );
            
        case 4: // Four: Hide the middle row line completely, revealing the 4 outer corner anchors
            return (row === 2);
            
        case 5: // Five: Hide only the left and right side pips of the middle line
            return (row === 2 && (col === 1 || col === 3));
            
        case 6: // Six: Hide only the single absolute center pip
            return (row === 2 && col === 2);
            
        default:
            return false;
    }
}

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

// Builds a clean 3x3 sub-grid structure for either the top or bottom half of a tile
function renderHalfGrid(halfValue) {
    const halfContainer = document.createElement('div');
    halfContainer.className = 'tile-half';

    for (let r = 1; r <= 3; r++) {
        for (let c = 1; c <= 3; c++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            
            cell.style.gridRowStart = r;
            cell.style.gridColumnStart = c;

            const isActivePip = activePipPositions.some(p => p.row === r && p.col === c);
            if (isActivePip && shouldHidePip(halfValue, r, c)) {
                const maskPatch = document.createElement('div');
                maskPatch.className = 'pip-mask-patch';
                cell.appendChild(maskPatch);
            }

            halfContainer.appendChild(cell);
        }
    }
    return halfContainer;
}

function displayFullTestingGrid() {
    gameTable.innerHTML = '';

    const gridContainer = document.createElement('div');
    gridContainer.className = 'test-grid-container';
    gameTable.appendChild(gridContainer);

    const masterDeck = buildMasterDeck();

    masterDeck.forEach((tile) => {
        // Create a structural wrapper to group the tile and text label cleanly together
        const wrapper = document.createElement('div');
        wrapper.className = 'debug-card-wrapper';

        // Build the domino element itself
        const tileElement = document.createElement('div');
        tileElement.className = 'domino-item';
        tileElement.id = tile.id;

        tileElement.appendChild(renderHalfGrid(tile.top));
        tileElement.appendChild(renderHalfGrid(tile.bottom));

        // Create the readable descriptor text underneath
        const textLabel = document.createElement('div');
        textLabel.className = 'debug-label';
        textLabel.innerText = tile.label;

        // Group them up inside the grid column
        wrapper.appendChild(tileElement);
        wrapper.appendChild(textLabel);
        gridContainer.appendChild(wrapper);
    });
}

setTimeout(() => {
    startBtn.disabled = false;
    startBtn.innerText = "TEST DIAGNOSTIC GRID";
}, 1000);

startBtn.addEventListener('click', () => {
    loadingScreen.classList.add('hidden');
    gameTable.classList.remove('hidden');
    displayFullTestingGrid();
});
