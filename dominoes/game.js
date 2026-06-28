const startBtn = document.getElementById('start-btn');
const loadingScreen = document.getElementById('loading-screen');
const gameTable = document.getElementById('game-table');

// Horizontal sprite panel offsets (0 through 6)
const maskXOffsets = {
    0: '0%',
    1: '16.66%',
    2: '33.33%',
    3: '50%',
    4: '66.66%',
    5: '83.33%',
    6: '100%'
};

// Explicitly generate and label the 28 unique domino pieces
function buildMasterDeck() {
    const deck = [];
    for (let i = 0; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
            deck.push({
                id: `tile-${i}-${j}`,  // Machine ID
                title: `Domino ${i}:${j}`, // Readable title
                top: i,
                bottom: j
            });
        }
    }
    return deck;
}

// Render all 28 tiles neatly inside a layout grid
function displayFullTestingGrid() {
    gameTable.innerHTML = '';

    // Create a neat grid container element
    const gridContainer = document.createElement('div');
    gridContainer.className = 'test-grid-container';
    gameTable.appendChild(gridContainer);

    const masterDeck = buildMasterDeck();

    masterDeck.forEach((tile) => {
        const tileElement = document.createElement('div');
        tileElement.className = 'domino-item';
        
        // Label the elements physically so you can inspect them via DevTools
        tileElement.id = tile.id;
        tileElement.setAttribute('title', tile.title);
        tileElement.dataset.top = tile.top;
        tileElement.dataset.bottom = tile.bottom;

        // Base background template asset
        tileElement.style.backgroundImage = "url('assets/dom_front.gif')";

        // Render the top half pip mask layer
        const topMask = document.createElement('div');
        topMask.className = 'pip-mask top-half';
        topMask.style.backgroundImage = "url('assets/_DOM_PIPS.png')";
        topMask.style.backgroundPosition = `${maskXOffsets[tile.top]} 0px`;
        tileElement.appendChild(topMask);

        // Render the bottom half pip mask layer
        const bottomMask = document.createElement('div');
        bottomMask.className = 'pip-mask bottom-half';
        bottomMask.style.backgroundImage = "url('assets/_DOM_PIPS.png')";
        bottomMask.style.backgroundPosition = `${maskXOffsets[tile.bottom]} 0px`;
        tileElement.appendChild(bottomMask);

        // Add the finished tile directly to the layout grid row
        gridContainer.appendChild(tileElement);
    });
}

// Emulate loader ready sequence
setTimeout(() => {
    startBtn.disabled = false;
    startBtn.innerText = "TEST 28 DECK GRID";
}, 1000);

startBtn.addEventListener('click', () => {
    loadingScreen.classList.add('hidden');
    gameTable.classList.remove('hidden');
    displayFullTestingGrid();
});
