// ==========================================================================
// Tellstream Dominoes - Complete Seating & Network Synced Layer
// ==========================================================================

const SUPABASE_URL = 'https://vegwferwmyuunwvfqpsf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZ3dmZXJ3bXl1dW53dmZxcHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzODU5NDQsImV4cCI6MjA5Nzk2MTk0NH0.7F3HUEY59BGE5phlD9AukhZzRa3Ied_ZT43j8YZeIy8';
let supabaseClient = null;

try {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (e) {
    console.warn("Supabase initialization error. Core engine running offline mode.");
}

const urlParams = new URLSearchParams(window.location.search);
const localPlayerName = urlParams.get('name') || 'Banton';

let currentRoomCode = null;
let playerSeatNumber = null; // null = Spectator, 1 = Host, 2-4 = Joined Players
let roomSubscription = null;
let localGameState = {
    room_code: null,
    game_state: 'waiting', 
    board_line: [],       
    active_turn: 1,       
    players: {},
    boneyard: [],
    connected_spectators: []
};

function initNetwork() {
    showLobbyUI();
}

function showLobbyUI() {
    const lobbyView = document.getElementById("lobby-view");
    if (!lobbyView) return;
    
    lobbyView.innerHTML = `
        <div class="lobby-panel" style="z-index: 1000; position: relative; padding: 40px; text-align: center;">
            <h2 style="color: #66fcf1; font-size: 3rem; margin-bottom: 10px; font-weight: bold; letter-spacing: 2px;">TELLSTREAM LOUNGE</h2>
            <p style="color: #66fcf1; font-size: 1.1rem; margin-bottom: 30px; letter-spacing: 1px; text-transform: uppercase;">Logged in as: <span style="color: #fff; font-weight: bold;">${localPlayerName}</span></p>
            <p style="color: #c5c6c7; font-size: 1.3rem; margin-bottom: 40px; letter-spacing: 1px;">Create a table or enter a lounge room code to watch a live match.</p>
            
            <div class="lobby-actions">
                <button id="create-room-btn" class="lobby-btn primary" style="margin-bottom: 15px; padding: 12px 30px; font-size: 1.2rem; cursor: pointer;">Create New Table</button>
                
                <div class="join-input-group" style="margin-top: 20px;">
                    <input type="text" id="room-code-input" placeholder="ENTER CODE" maxlength="4" style="padding: 12px; font-size: 1.2rem; text-align: center; text-transform: uppercase;">
                    <button id="join-room-btn" class="lobby-btn" style="padding: 12px 25px; font-size: 1.2rem; cursor: pointer;">Enter Room</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById("create-room-btn").addEventListener("click", createRoom);
    document.getElementById("join-room-btn").addEventListener("click", () => {
        const code = document.getElementById("room-code-input").value.toUpperCase().trim();
        if (code.length === 4) joinRoom(code);
    });
}

function generateFullDominoSet() {
    const bones = [];
    let idCounter = 1;
    for (let i = 0; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
            bones.push({
                id: `b${idCounter++}`,
                top: i,
                bottom: j,
                isDouble: (i === j)
            });
        }
    }
    return bones;
}

function shuffleBones(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

async function createRoom() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
    let generatedCode = '';
    for (let i = 0; i < 4; i++) {
        generatedCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    localGameState = {
        room_code: generatedCode,
        game_state: 'waiting',
        board_line: [],
        active_turn: 1, 
        players: {
            player1: { seat: 1, hand: [], name: localPlayerName }
        },
        boneyard: [],
        connected_spectators: [localPlayerName] // Host starts in list
    };

    if (!supabaseClient) {
        playerSeatNumber = 1;
        currentRoomCode = generatedCode;
        switchToGameTableView();
        renderLiveTable(localGameState.board_line);
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('domino_rooms')
            .insert([localGameState]);

        if (error) throw error;

        playerSeatNumber = 1; 
        currentRoomCode = generatedCode;
        subscribeToRoom(currentRoomCode);
    } catch (err) {
        console.error("Database fault:", err);
        playerSeatNumber = 1;
        currentRoomCode = generatedCode;
        switchToGameTableView();
        renderLiveTable(localGameState.board_line);
    }
}

async function joinRoom(code) {
    if (!supabaseClient) return;

    try {
        const { data, error } = await supabaseClient
            .from('domino_rooms')
            .select('*')
            .eq('room_code', code)
            .single();

        if (error || !data) {
            alert("Room session not found!");
            return;
        }

        let spectatorsList = data.connected_spectators || [];
        if (!spectatorsList.includes(localPlayerName)) {
            spectatorsList.push(localPlayerName);
        }

        const { error: updateError } = await supabaseClient
            .from('domino_rooms')
            .update({ connected_spectators: spectatorsList })
            .eq('room_code', code);

        if (updateError) throw updateError;

        localGameState = data;
        localGameState.connected_spectators = spectatorsList;
        playerSeatNumber = null; // Always a spectator initially
        currentRoomCode = code;
        
        subscribeToRoom(currentRoomCode);
    } catch (err) {
        console.error("Error joining room:", err);
    }
}

function subscribeToRoom(code) {
    if (!supabaseClient) return;
    
    roomSubscription = supabaseClient
        .channel(`room_${code}`)
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'domino_rooms', 
            filter: `room_code=eq.${code}` 
        }, payload => {
            const updatedData = payload.new;
            
            // Check if host promoted us into a specific player seating slot
            playerSeatNumber = null; 
            if (updatedData.players.player1?.name === localPlayerName) playerSeatNumber = 1;
            else if (updatedData.players.player2?.name === localPlayerName) playerSeatNumber = 2;
            else if (updatedData.players.player3?.name === localPlayerName) playerSeatNumber = 3;
            else if (updatedData.players.player4?.name === localPlayerName) playerSeatNumber = 4;

            localGameState = updatedData;
            handleRoomUpdate(localGameState);
        })
        .subscribe();

    switchToGameTableView();
    renderLiveTable(localGameState.board_line);
}

/**
 * Triggered by the Host clicking [Start Match] in the UI list module
 */
async function triggerGameStartHandshake(chosenOpponentNames) {
    if (playerSeatNumber !== 1) return; // Safeguard

    const fullDeck = shuffleBones(generateFullDominoSet());
    
    // Automatically generate clean assignments and deal 7 bones per chosen user
    const updatedPlayers = {
        player1: { seat: 1, hand: fullDeck.slice(0, 7), name: localPlayerName }
    };

    let cardPointer = 7;
    chosenOpponentNames.forEach((name, index) => {
        const seatId = index + 2; // Converts to player2, player3, player4
        updatedPlayers[`player${seatId}`] = {
            seat: seatId,
            hand: fullDeck.slice(cardPointer, cardPointer + 7),
            name: name
        };
        cardPointer += 7;
    });

    const leftovers = fullDeck.slice(cardPointer, 28);

    localGameState.players = updatedPlayers;
    localGameState.boneyard = leftovers;
    localGameState.game_state = 'playing';
    localGameState.active_turn = 1; // Host dropped first clearance line

    try {
        await supabaseClient
            .from('domino_rooms')
            .update({
                players: localGameState.players,
                boneyard: localGameState.boneyard,
                game_state: localGameState.game_state,
                active_turn: localGameState.active_turn
            })
            .eq('room_code', currentRoomCode);
    } catch (err) {
        console.error("Failed launching match:", err);
    }
}

function switchToGameTableView() {
    const lobbyView = document.getElementById("lobby-view");
    const tableView = document.getElementById("table-view");
    if (lobbyView) lobbyView.style.display = "none";
    if (tableView) tableView.classList.remove("hidden-layout");
}

async function pushMoveToDatabase(updatedBoardLine, nextTurnSeatNumber, updatedPlayersMap) {
    localGameState.board_line = updatedBoardLine;
    localGameState.active_turn = nextTurnSeatNumber;
    localGameState.players = updatedPlayersMap;

    try {
        await supabaseClient
            .from('domino_rooms')
            .update({
                board_line: localGameState.board_line,
                active_turn: localGameState.active_turn,
                players: localGameState.players
            })
            .eq('room_code', currentRoomCode);
    } catch (err) {
        console.error("Failed syncing move sequence:", err);
    }
}

function handleRoomUpdate(updatedRoomState) {
    if (typeof renderLiveTable === 'function') {
        renderLiveTable(updatedRoomState.board_line);
    }
}
