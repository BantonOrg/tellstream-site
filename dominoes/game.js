const startBtn = document.getElementById('start-btn');
const loadingScreen = document.getElementById('loading-screen');
const gameTable = document.getElementById('game-table');

// 1. Build the mathematically unique 28-card Double-Six deck
function generateDeck() {
    const deck = [];
    for (let i = 0; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
            deck.push({ top: i, bottom: j });
        }
    }
    return deck;
}

// 2. Shuffle array using the standard Fisher-Yates routine
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 3. Populate 10 random non-duplicate domino positions on the field
function spawnDisplayDominoes() {
    const fullDeck = generateDeck();
    const shuffledDeck = shuffle(fullDeck);
    
    // Snag exactly 10 unique elements for our display pool
    const displayPool = shuffledDeck.slice(0, 10);

    displayPool.forEach((tileData, index) => {
        const tileElement = document.createElement('div');
        tileElement.className = 'domino-item';

        // Split the pool: 7 face up (indices 0-6), 3 face down (indices 7-9)
        if (index < 7) {
            tileElement.style.backgroundImage = "url('assets/dom_front.gif')";
            // We stamp the numbers into data properties so the masking logic can read them next
            tileElement.dataset.top = tileData.top;
            tileElement.dataset.bottom = tileData.bottom;
        } else {
            tileElement.style.backgroundImage = "url('assets/dom_back.gif')";
        }

        // Drop them at random, dispersed spots and rotations on the stretched canvas
        const randomX = Math.floor(Math.random() * 75) + 5;   // 5% to 80% horizontal bounds
        const randomY = Math.floor(Math.random() * 65) + 10;  // 10% to 75% vertical bounds
        const randomRotation = Math.floor(Math.random() * 360);

        tileElement.style.left = `${randomX}%`;
        tileElement.style.top = `${randomY}%`;
        tileElement.style.transform = `rotate(${randomRotation}deg)`;

        gameTable.appendChild(tileElement);
    });
}

// Simulate the asset loader completion
setTimeout(() => {
    startBtn.disabled = false;
    startBtn.innerText = "START GAME";
}, 1000);

// Transition to gameplay surface and trigger the test distribution
startBtn.addEventListener('click', () => {
    loadingScreen.classList.add('hidden');
    gameTable.classList.remove('hidden');
    
    spawnDisplayDominoes();
});
