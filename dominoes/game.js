const startBtn = document.getElementById('start-btn');
const loadingScreen = document.getElementById('loading-screen');
const gameTable = document.getElementById('game-table');

// Define 10 fixed, non-overlapping coordinate slots around the screen edges (leaving center logo clear)
const tableSlots = [
    { x: 10, y: 10, rot: 15 },   // Top Left
    { x: 32, y: 8,  rot: -10 },  // Top Left-Center
    { x: 55, y: 8,  rot: 5 },    // Top Right-Center
    { x: 78, y: 12, rot: -20 },  // Top Right
    
    { x: 8,  y: 42, rot: 90 },   // Far Left Middle
    { x: 82, y: 45, rot: -90 },  // Far Right Middle
    
    { x: 12, y: 75, rot: -5 },   // Bottom Left
    { x: 35, y: 78, rot: 12 },   // Bottom Left-Center
    { x: 58, y: 75, rot: -15 },  // Bottom Right-Center
    { x: 80, y: 76, rot: 8 }     // Bottom Right
];

// Build the mathematically unique 28-card Double-Six deck
function generateDeck() {
    const deck = [];
    for (let i = 0; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
            deck.push({ top: i, bottom: j });
        }
    }
    return deck;
}

// Shuffle routine
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Populate 10 random non-duplicate domino positions on the field without overlaps
function spawnDisplayDominoes() {
    // Clear out any old dominoes first
    gameTable.innerHTML = '';

    const fullDeck = generateDeck();
    const shuffledDeck = shuffle(fullDeck);
    
    // Snag exactly 10 unique elements for our display pool
    const displayPool = shuffledDeck.slice(0, 10);

    // Shuffle the layout slots so dominoes land in different spots every match
    const shuffledSlots = shuffle([...tableSlots]);

    displayPool.forEach((tileData, index) => {
        const tileElement = document.createElement('div');
        tileElement.className = 'domino-item';

        // Split the pool: 7 face up (indices 0-6), 3 face down (indices 7-9)
        if (index < 7) {
            tileElement.style.backgroundImage = "url('assets/dom_front.gif')";
            tileElement.dataset.top = tileData.top;
            tileElement.dataset.bottom = tileData.bottom;
        } else {
            tileElement.style.backgroundImage = "url('assets/dom_back.gif')";
        }

        // Get one of our guaranteed safe, non-overlapping coordinates
        const slot = shuffledSlots[index];

        // Apply coordinates flat onto the table layout
        tileElement.style.left = `${slot.x}%`;
        tileElement.style.top = `${slot.y}%`;
        tileElement.style.transform = `rotate(${slot.rot}deg)`;

        gameTable.appendChild(tileElement);
    });
}

// Simulate the asset loader completion
setTimeout(() => {
    startBtn.disabled = false;
    startBtn.innerText = "START GAME";
}, 1000);

// Transition to gameplay surface and trigger the distribution
startBtn.addEventListener('click', () => {
    loadingScreen.classList.add('hidden');
    gameTable.classList.remove('hidden');
    
    spawnDisplayDominoes();
});
