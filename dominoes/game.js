function renderTable() {
    dominoesLayer.innerHTML = '';

    const leftDeck = buildLeftBranch();
    const rightDeck = buildRightBranch();
    
    const combinedCoordinates = {
        ...calculateBranch(leftDeck, 'left'),
        ...calculateBranch(rightDeck, 'right')
    };

    // Mapping grid position classes for standard 3x3 domino pip layouts
    const pipPositions = {
        1: [4],
        2: [0, 8],
        3: [0, 4, 8],
        4: [0, 2, 6, 8],
        5: [0, 2, 4, 6, 8],
        6: [0, 2, 3, 5, 6, 8]
    };

    function createHalfBlock(pipCount) {
        const half = document.createElement('div');
        half.className = 'domino-half';
        
        // Generate 9 grid cells for the 3x3 pip matrix
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'pip-cell';
            if (pipPositions[pipCount] && pipPositions[pipCount].includes(i)) {
                const pip = document.createElement('div');
                pip.className = 'pip';
                cell.appendChild(pip);
            }
            half.appendChild(cell);
        }
        return half;
    }

    [...leftDeck, ...rightDeck].forEach((tile) => {
        const coords = combinedCoordinates[tile.id];
        if (!coords) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'live-card-wrapper';
        wrapper.style.width = `${coords.w}px`;
        wrapper.style.height = `${coords.h}px`;
        wrapper.style.left = `${coords.x - (coords.w / 2)}px`;
        wrapper.style.top = `${coords.y - (coords.h / 2)}px`;

        const rotationContainer = document.createElement('div');
        rotationContainer.style.width = `${TILE_BASE_W}px`;
        rotationContainer.style.height = `${TILE_BASE_H}px`;
        rotationContainer.style.transform = `rotate(${coords.angle}deg)`;
        rotationContainer.style.transformOrigin = 'center center';
        rotationContainer.style.position = 'relative';

        // Main Domino Item Face
        const tileElement = document.createElement('div');
        tileElement.className = 'domino-item';

        // Render Top Half, Divider Line, and Bottom Half
        const topHalf = createHalfBlock(tile.top);
        
        const centerLine = document.createElement('div');
        centerLine.className = 'domino-center-line';
        
        const bottomHalf = createHalfBlock(tile.bottom);

        tileElement.appendChild(topHalf);
        tileElement.appendChild(centerLine);
        tileElement.appendChild(bottomHalf);

        rotationContainer.appendChild(tileElement);
        wrapper.appendChild(rotationContainer);
        dominoesLayer.appendChild(wrapper);
    });
}
