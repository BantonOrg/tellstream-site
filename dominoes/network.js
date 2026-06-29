// ============================================================================
// NETWORK.JS - FULL NETWORK LAYER, COUNTDOWN SYSTEMS, AND ROOM ADMINISTRATIVE FUNCTIONS
// ============================================================================

// Global Tracking State for Disconnect Windows
const activeTimers = {};

/**
 * Handles a network drop event from the WebSocket layer
 * @param {string} roomId - Identifier for the active match group
 * @param {number} droppedPlayerIndex - Position array slot of the dropped user (1-4 base matching UI layout)
 * @param {Array} currentPlayersList - Reference list of current players for local state check
 */
function handlePlayerDisconnect(roomId, droppedPlayerIndex, currentPlayersList) {
    // If a tracking clock loop is already alive for this slot, bypass duplicate allocations
    if (activeTimers[droppedPlayerIndex]) return;

    let timeRemaining = 120; // 2-Minute Grace Limit in Seconds
    
    // 1. Instant Global Freeze Loop Execution
    console.warn(`Connection lost with Player ${droppedPlayerIndex}. Freezing game actions.`);
    lockGameBoardInput(true);

    // 2. Trigger UI countdown update immediately
    updateDisconnectTimerDisplay(droppedPlayerIndex, "2:00");

    // 3. Fire ticking clock logic
    activeTimers[droppedPlayerIndex] = setInterval(() => {
        timeRemaining--;

        if (timeRemaining > 0) {
            // Parse seconds down into readable MM:SS layout
            const mins = Math.floor(timeRemaining / 60);
            const secs = timeRemaining % 60;
            const timeString = `${mins}:${secs.toString().padStart(2, '0')}`;
            
            updateDisconnectTimerDisplay(droppedPlayerIndex, timeString);
        } else {
            // Grace period expired with zero recovery
            clearInterval(activeTimers[droppedPlayerIndex]);
            delete activeTimers[droppedPlayerIndex];
            
            handleGracePeriodExpiry(roomId, droppedPlayerIndex);
        }
    }, 1000);
}

/**
 * Handles network recovery event prior to expiration windows
 * @param {number} recoveredPlayerIndex - Position array slot of the recovered user (1-4 base matching UI layout)
 */
function handlePlayerReconnect(recoveredPlayerIndex) {
    if (activeTimers[recoveredPlayerIndex]) {
        clearInterval(activeTimers[recoveredPlayerIndex]);
        delete activeTimers[recoveredPlayerIndex];
        
        // Restore standard inward visual components
        clearDisconnectTimerDisplay(recoveredPlayerIndex);
        
        // If zero other tracking alerts are alive across the remaining seats, unfreeze play
        if (Object.keys(activeTimers).length === 0) {
            lockGameBoardInput(false);
            console.log("All players stable. Unfreezing game actions.");
        }
    }
}

/**
 * Grace period closure branch if recovery limits fail
 * @param {string} roomId - Identifier for the active match group
 * @param {number} failedPlayerIndex - Position array slot of the dropped user
 */
function handleGracePeriodExpiry(roomId, failedPlayerIndex) {
    console.error(`Player ${failedPlayerIndex} failed to reconnect within the 2-minute buffer.`);
    
    // Expose unlock panels allowing surviving clients clean room teardown choices
    exposeLobbyTeardownControls(roomId);
}

/**
 * Administrative Power: Shift an active player back to a spectator slot
 * (Can only be processed post-match reset inside Lounge state parameters)
 * @param {string} roomId - Identifier for the active match group
 * @param {string} targetPlayerId - Unique identifier of user targeted for seating adjustment
 * @param {boolean} isLocalUserHost - Flag tracking room ownership validation
 */
function movePlayerToSpectator(roomId, targetPlayerId, isLocalUserHost) {
    if (!isLocalUserHost) {
        console.error("Permission Denied: Only the host can eject players to spectator slots.");
        return;
    }

    // Dispatches state update down network pipeline to shift role profiles
    // Note: This changes room parameters but safely preserves workspace connections without room deletion
    const payload = {
        action: "demote_to_spectator",
        room: roomId,
        target: targetPlayerId
    };

    sendNetworkPayload(payload);
    console.log(`Host action processed: Moving ${targetPlayerId} to spectator lounge tracking.`);
}

/**
 * Administrative Power: Seat an eligible spectator into an empty table corner
 * @param {string} roomId - Identifier for the active match group
 * @param {string} targetPlayerId - Unique identifier of spectator targeted for play slot
 * @param {number} targetedSeatSlot - Destination seat coordinate key index chosen
 * @param {boolean} isLocalUserHost - Flag tracking room ownership validation
 */
function assignSpectatorToSeat(roomId, targetPlayerId, targetedSeatSlot, isLocalUserHost) {
    if (!isLocalUserHost) {
         console.error("Permission Denied: Only the host can manage table seating configurations.");
         return;
    }

    const payload = {
        action: "assign_seat",
        room: roomId,
        target: targetPlayerId,
        seat: targetedSeatSlot
    };

    sendNetworkPayload(payload);
}

/**
 * Internal Input Anchor Lock Blocks
 * @param {boolean} shouldLock - Toggle boolean setting state parameter values
 */
function lockGameBoardInput(shouldLock) {
    const boardArea = document.getElementById('domino-table-container');
    if (!boardArea) return;

    if (shouldLock) {
        boardArea.classList.add('network-frozen-state');
        boardArea.style.pointerEvents = 'none'; // Lock active tile placement clicks entirely
    } else {
        boardArea.classList.remove('network-frozen-state');
        boardArea.style.pointerEvents = 'auto';
    }
}

/**
 * Outward pipeline transmitter dispatch skeleton wrapper
 * @param {Object} dataPacket - Formatted package settings payload
 */
function sendNetworkPayload(dataPacket) {
    if (typeof globalWebSocketClient !== 'undefined' && globalWebSocketClient.readyState === WebSocket.OPEN) {
        globalWebSocketClient.send(JSON.stringify(dataPacket));
    } else {
        console.warn("Network transmission skipped: WebSocket layer offline or uninitialized.");
    }
}

/**
 * Visual control expansion wrapper on dead connection limits
 * @param {string} roomId - Identifier for the active match group
 */
function exposeLobbyTeardownControls(roomId) {
    // Renders administrative abort menus safely onto client elements
    const controlPanel = document.getElementById('lobby-management-controls');
    if (controlPanel) {
        controlPanel.innerHTML = `
            <div class="grace-expiry-alert">
                <p>A player has left the table completely. Dissolve match and return to lounge?</p>
                <button onclick="confirmLobbyDissolve('${roomId}')">Return to Lounge</button>
            </div>
        `;
    }
}

// Export module logic safely for system loop initialization architecture
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handlePlayerDisconnect,
        handlePlayerReconnect,
        movePlayerToSpectator,
        assignSpectatorToSeat,
        lockGameBoardInput
    };
}
