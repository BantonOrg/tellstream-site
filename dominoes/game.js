const startBtn = document.getElementById('start-btn');
const loadingScreen = document.getElementById('loading-screen');
const gameTable = document.getElementById('game-table');

// Adjusted slots to keep tiles inside the neon felt lines, away from the wooden border
const tableSlots = [
    { x: 14, y: 16, rot: 12 },   // Top Left
    { x: 34, y: 14, rot: -8 },   // Top Left-Center
    { x: 54, y: 14, rot: 6 },    // Top Right-Center
    { x: 74, y: 17, rot: -15 },  // Top Right
    
    { x: 12, y: 44, rot: 90 },   // Left Mid Felt
    { x: 78, y: 46, rot: -90 },  // Right Mid Felt
    
    { x: 16, y: 70, rot: -6 },   // Bottom Left
    { x: 36, y: 72, rot: 14 },   // Bottom Left-Center
    { x: 56, y: 70, rot: -10 },  // Bottom Right-Center
    { x: 76, y: 71, rot: 5 }     // Bottom Right
];

// Maps numbers 0-6 to percentage shifts for your vertical background mask asset
// This assumes a vertical strip layout. If the offsets look inverted or misaligned, 
// we can easily flip the order or fine-tune these percentages to lock it in.
const maskYOffsets = {
    0: '0%',
    1: '16.66%',
    2: '33.33%',
    3: '50%',
    4: '66.66%',
    5: '83.33%',
    6: '100%'
};

function generateDeck() {
    const deck = [];
    for (let i = 0; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
            deck.push({ top: i, bottom: j });
        }
    }
    return deck;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function spawnDisplayDominoes() {
    gameTable.innerHTML = '';

    const fullDeck = generateDeck();
    const shuffledDeck = shuffle(fullDeck);
    const displayPool = shuffledDeck.slice(0, 10);
    const shuffledSlots = shuffle([...tableSlots]);

    displayPool.forEach((tileData, index) => {
        const tileElement = document.createElement('div');
        tileElement.className = 'domino-item';

        if (index < 7) {
            // 1. Set base front image (shows all 7 pips natively)
            tileElement.style.backgroundImage = "url('assets/dom_front.gif')";
            tileElement.dataset.top = tileData.top;
            tileElement.dataset.bottom = tileData.bottom;

            // 2. Inject top half cover layer
            const topMask = document.createElement('div');
            topMask.className = 'pip-mask top-half';
            topMask.style.backgroundImage = "url('assets/_DOM_PIPS.png')";
            topMask.style.backgroundPosition = `0px ${maskYOffsets[tileData.top]}`;
            tileElement.appendChild(topMask);

            // 3. Inject bottom half cover layer
            const bottomMask = document.createElement('div');
            bottomMask.className = 'pip-mask bottom-half';
            bottomMask.style.backgroundImage = "url('assets/_DOM_PIPS.png')";
            bottomMask.style.backgroundPosition = `0px ${maskYOffsets[tileData.bottom]}`;
            tileElement.appendChild(bottomMask);

        } else {
            // Face down tiles
            tileElement.style.backgroundImage = "url('assets/dom_back.gif')";
        }

        const slot = shuffledSlots[index];
        tileElement.style.left = `${slot.x}%`;
        tileElement.style.top = `${slot.y}%`;
        tileElement.style.transform = `rotate(${slot.rot}deg)`;

        gameTable.appendChild(tileElement);
    });
}

setTimeout(() => {
    startBtn.disabled = false;
    startBtn.innerText = "START GAME";
}, 1000);

startBtn.addEventListener('click', () => {
    loadingScreen.classList.add('hidden');
    gameTable.classList.remove('hidden');
    spawnDisplayDominoes();
});
