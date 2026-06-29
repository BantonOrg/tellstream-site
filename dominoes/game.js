// ============================================================================
// GAME.JS - CORE GAME ENGINE, RENDERING PIPELINES, AND LAYOUT CONSTANTS
// ============================================================================

// Strict structural canvas coordinate limits matching maximum pixel space rules
const TABLE_LIMITS = {
    WIDTH: 2567,
    HEIGHT: 1367
};

/**
 * Generates and appends the 4 player absolute-positioned slot templates to the table
 */
function initializeTableLayout() {
    const tableContainer = document.getElementById('domino-table-container');
    if (!tableContainer) {
        console.warn("Table container mount element missing from active DOM view tree.");
        return;
    }

    // Clear structural remnants before populating
    tableContainer.innerHTML = '';

    // Blueprint configuration arrays for the 4 corner slots
    const configurations = [
        { id: 'player-slot-1', alignment: 'bottom-left' },
        { id: 'player-slot-2', alignment: 'top-left' },
        { id: 'player-slot-3', alignment: 'top-right' },
        { id: 'player-slot-4', alignment: 'bottom-right' }
    ];

    configurations.forEach(cfg => {
        const slotElement = document.createElement('div');
        slotElement.id = cfg.id;
        slotElement.className = `player-table-slot target-alignment-${cfg.alignment}`;
        
        // Append baseline empty structure
        slotElement.innerHTML = `<span class="no-player">Empty Seat</span>`;
        tableContainer.appendChild(slotElement);
    });

    console.log("Table padded coordinates successfully mapped.");
}

/**
 * Updates UI positioning wrappers using incoming raw database player row arrays
 * @param {Array} playersArray - Seated user list matching backend row states
 */
function updateTableSeats(playersArray) {
    for (let i = 0; i < 4; i++) {
        const targetSlot = document.getElementById(`player-slot-${i + 1}`);
        if (!targetSlot) continue;

        const player = playersArray[i];

        if (player) {
            // Determine internal glyph orientations based on seat location parameters
            const isLeftSide = (i === 0 || i === 1);
            const arrowGlyph = isLeftSide ? "→" : "←";
            
            // Re-render HTML matching the text requirements
            targetSlot.innerHTML = `
                <span class="connection-state-indicator connected"></span>
                <span class="player-name">${player.display_name}</span>
                <span class="arrow-indicator">${arrowGlyph}</span>
                <span class="player-tiles">${player.tiles_left} Tiles</span>
            `;
        } else {
            targetSlot.innerHTML = `<span class="no-player">Empty Seat</span>`;
        }
    }
}

/**
 * Updates the network timer view element directly inside a player's layout slot
 */
function updateDisconnectTimerDisplay(playerIndex, countdownText) {
    const targetSlot = document.getElementById(`player-slot-${playerIndex}`);
    if (!targetSlot) return;

    const indicator = targetSlot.querySelector('.connection-state-indicator');
    if (indicator) {
        indicator.className = "connection-state-indicator disconnected-countdown";
        indicator.textContent = countdownText;
    }
}

/**
 * Restores a player slot's connection dot back to its normal green state
 */
function clearDisconnectTimerDisplay(playerIndex) {
    const targetSlot = document.getElementById(`player-slot-${playerIndex}`);
    if (!targetSlot) return;

    const indicator = targetSlot.querySelector('.connection-state-indicator');
    if (indicator) {
        indicator.className = "connection-state-indicator connected";
        indicator.textContent = "";
    }
}

/**
 * Injects a blackout overlay onto the screen to celebrate a domino win
 */
function triggerVictorySequence(winnerName) {
    const tableContainer = document.getElementById('domino-table-container');
    if (!tableContainer) return;

    const overlay = document.createElement('div');
    overlay.id = "victory-celebration-overlay";
    overlay.innerHTML = `
        <div class="victory-banner-content">
            <h1>DOMINO!</h1>
            <p>${winnerName} wins the match</p>
        </div>
    `;

    tableContainer.appendChild(overlay);

    // Strict 7-second rollover sequence trigger
    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
        console.log("Victory blackout lifted. Rolling over to room lounge parameters.");
    }, 7000);
}
