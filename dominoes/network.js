// ==========================================================================
// Tellstream Dominoes - Automated Local Test Harness Sandbox Layer
// ==========================================================================

function initNetwork() {
    console.log("Network layer offline. Direct Sandbox initialization running.");
    
    const localSampleHand = [
        { id: 'b1', top: 5, bottom: 5, isDouble: true },
        { id: 'b2', top: 6, bottom: 1, isDouble: false },
        { id: 'b3', top: 4, bottom: 3, isDouble: false },
        { id: 'b4', top: 3, bottom: 1, isDouble: false },
        { id: 'b5', top: 2, bottom: 2, isDouble: true },
        { id: 'b6', top: 5, bottom: 4, isDouble: false },
        { id: 'b7', top: 0, bottom: 6, isDouble: false }
    ];

    const localSampleTrack = [
        { top: 5, bottom: 6, displayTop: 5, displayBottom: 6 },
        { top: 6, bottom: 6, displayTop: 6, displayBottom: 6 },
        { top: 6, bottom: 1, displayTop: 6, displayBottom: 1 }
    ];

    // ATTACH SAFELY TO GLOBAL WINDOW SCOPE FOR CROSS-FILE SANITY
    window.localGameState = {
        room_code: "SANDBOX",
        game_state: 'playing',
        board_line: localSampleTrack,
        active_turn: 1,
        players: {
            player1: { seat: 1, hand: localSampleHand, name: "Banton" }
        }
    };

    const lobbyView = document.getElementById("lobby-view");
    const tableView = document.getElementById("table-view");
    if (lobbyView) lobbyView.style.display = "none";
    if (tableView) tableView.classList.remove("hidden-layout");

    renderLiveTable(window.localGameState.board_line);
}
