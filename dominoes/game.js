// ============================================================================
// GAME.JS - FULL ENGINE LAYOUT & POST-GAME FLOW MANAGEMENT
// ============================================================================

// 1. Core Structural Dimensions & 10px Absolute Inner Padding
const TABLE_LIMITS = {
    minX: 187,
    minY: 169,
    maxX: 2567,
    maxY: 1367
};
const PADDING = 10;

// Exact pre-calculated render anchor coordinates for text boundaries
const POSITIONS = {
    player1: { x: TABLE_LIMITS.minX + PADDING, y: TABLE_LIMITS.maxY - PADDING, align: 'left' },  // Bottom Left (Host)
    player2: { x: TABLE_LIMITS.minX + PADDING, y: TABLE_LIMITS.minY + PADDING, align: 'left' },  // Top Left
    player3: { x: TABLE_LIMITS.maxX - PADDING, y: TABLE_LIMITS.minY + PADDING, align: 'right' }, // Top Right
    player4: { x: TABLE_LIMITS.maxX - PADDING, y: TABLE_LIMITS.maxY - PADDING, align: 'right' }  // Bottom Right
};

/**
 * Initializes the foundational layout structural slots and overlay templates
 */
function initializeTableLayout() {
    const tableContainer = document.getElementById('domino-table-container');
    if (!tableContainer) {
        console.error("Critical Error: 'domino-table-container' element not found in DOM.");
        return;
    }

    // Reset container contents to prevent structural stacking
    tableContainer.innerHTML = '';

    // Create the 4 Corner Player Slots anchored within the layout boundaries
    Object.keys(POSITIONS).forEach((playerKey) => {
        const pos = POSITIONS[playerKey];
        const slot = document.createElement('div');
        slot.id = `table-slot-${playerKey}`;
        slot.className = `player-table-slot slot-${pos.align}`;
        
        // Apply precise visual spacing rules relative to background boundaries
        slot.style.position = 'absolute';
        slot.style.left = pos.align === 'left' ? `${pos.x}px` : 'auto';
        slot.style.right = pos.align === 'right' ? `${TABLE_LIMITS.maxX - pos.x}px` : 'auto';
        slot.style.top = `${pos.y}px`;
        
        // Correct vertical translation offset for bottom-row elements
        if (pos.y === TABLE_LIMITS.maxY - PADDING) {
            slot.style.transform = 'translateY(-100%)';
        }

        tableContainer.appendChild(slot);
    });

    // Create the 7-Second Victory Overlay Container (Hidden by default)
    const victoryOverlay = document.createElement('div');
    victoryOverlay.id = 'victory-celebration-overlay';
    victoryOverlay.className = 'hidden-overlay';
    victoryOverlay.style.display = 'none';
    
    tableContainer.appendChild(victoryOverlay);
}

/**
 * Renders or updates the mirrored data strings across the active board positions
 * @param {Array} players - Complete array of active player objects currently assigned to table seats
 */
function updateTableSeats(players) {
    // Process all 4 physical positions. Post-start, empty mid-game slots are banned.
    for (let i = 1; i <= 4; i++) {
        const slot = document.getElementById(`table-slot-player${i}`);
        if (!slot) continue;

        const player = players[i - 1];
        const pos = POSITIONS[`player${i}`];

        if (player) {
            // Build out inline visual pieces for metadata strings
            const nameSpan = `<span class="player-name">${player.display_name}</span>`;
            const tileSpan = `<span class="player-tiles">(${player.tiles_left || 7} Tiles)</span>`;
            const stateSpan = `<span id="signal-player${i}" class="connection-state-indicator connected"></span>`;

            // Enforce cultural asymmetry alignment (Left side points inward right, right side points inward left)
            if (pos.align === 'left') {
                slot.innerHTML = `${nameSpan} ${tileSpan} <span class="arrow-indicator">→</span> ${stateSpan}`;
            } else {
                slot.innerHTML = `${stateSpan} <span class="arrow-indicator">←</span> ${tileSpan} ${nameSpan}`;
            }
        } else {
            // Placeholder text rendered strictly before initial match commitment
            slot.innerHTML = `<span class="no-player">No player seated</span>`;
        }
    }
}

/**
 * Fires the 7-Second Post-Game Banner Blockade and automatic reset loop
 * @param {string} winnerName - The name of the player who completed their hand
 * @param {boolean} isHost - Boolean check asserting local user room ownership privileges
 * @param {Function} onResetCallback - Critical network dispatch to sync room transition parameters
 */
function triggerVictorySequence(winnerName, isHost, onResetCallback) {
    const overlay = document.getElementById('victory-celebration-overlay');
    if (!overlay) return;

    // Phase 1: Render Text Message & Absorb Click Captures to prevent mid-turn inputs
    overlay.innerHTML = `
        <div class="victory-banner-content">
            <h1>${winnerName.toUpperCase()} DOMINOED!</h1>
            <p>Clean Sweep</p>
        </div>
    `;
    overlay.style.display = 'flex';
    overlay.classList.add('active-overlay');

    // Phase 2: Execute hard 7000ms delay block prior to state restoration
    setTimeout(() => {
        overlay.style.display = 'none';
        overlay.classList.remove('active-overlay');

        // Hand engine control back to system loop for room cleanup/re-seating transitions
        if (onResetCallback) {
            onResetCallback();
        }
    }, 7000);
}

/**
 * Modifies an active player's connection badge locally to display remaining grace seconds
 * @param {number} playerIndex - Number index identifier of the user who dropped (1-4 base matching UI layout)
 * @param {string} timeString - Parsed text string displaying remaining minutes/seconds (e.g., "1:45")
 */
function updateDisconnectTimerDisplay(playerIndex, timeString) {
    const signalBadge = document.getElementById(`signal-player${playerIndex}`);
    if (!signalBadge) return;

    // Redraw badge style from dot to blinker and inject numeric breakdown text directly
    signalBadge.className = "connection-state-indicator disconnected-countdown";
    signalBadge.innerText = timeString;
}

/**
 * Restores a connection badge style back to safe parameters upon network recovery
 * @param {number} playerIndex - Number index identifier of the user who recovered (1-4 base matching UI layout)
 */
function clearDisconnectTimerDisplay(playerIndex) {
    const signalBadge = document.getElementById(`signal-player${playerIndex}`);
    if (!signalBadge) return;

    // Flush inline countdown data and drop class back to default green parameters
    signalBadge.className = "connection-state-indicator connected";
    signalBadge.innerText = "";
}

// Export module logic safely for structural binding access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeTableLayout,
        updateTableSeats,
        triggerVictorySequence,
        updateDisconnectTimerDisplay,
        clearDisconnectTimerDisplay
    };
}
