// ==========================================================================
// Tellstream Dominoes - Complete Backend & Network Synced Layer
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

// Global Match State Properties Variables
let currentRoomCode = null;
let playerSeatNumber = null; 
let roomSubscription = null;
let localGameState = {
    room_code: null,
    game_state: 'waiting', // waiting, playing, blocked, finished
    board_line: [],       // Shared layout track chain array
    active_turn: 1,       // Seat turn tracker (1-4)
    players: {}           // Dynamic map matching seat details & hand bone arrays
};

function initNetwork() {
    showLobbyUI();
}

function showLobbyUI() {
    const lobbyView = document.getElementById("lobby-view");
    if (!lobbyView) return;
    
    lobbyView.innerHTML = `
        <div class="lobby-panel" style="z-index: 1000; position: relative; padding: 40px; text-align: center;">
            <h2 style="color: #66fcf1; font-size: 3rem; margin-bottom: 20px; font-weight: bold; letter-spacing: 2px;">TELLSTREAM LOUNGE MATCH</h2>
            <p style="color: #c5c6c7; font-size: 1.4rem; margin-bottom: 40px; letter-spacing: 1px;">Create a new table or enter a 4-digit code to join a live match.</p>
            
            <div class="lobby-actions">
                <button id="create-room-btn" class="lobby-btn primary" style="margin-bottom: 15px; padding: 12px 30px; font-size: 1.2rem; cursor: pointer;">Create New Table</button>
                
                <div class="join-input-group" style="margin-top: 20px;">
                    <input type="text" id="room-code-input" placeholder="ENTER CODE" maxlength="4" style="padding: 12px; font-size: 1.2rem; text-align: center; text-transform: uppercase;">
                    <button id="join-room-btn" class="lobby-btn" style="padding: 12px 25px; font-size: 1.2rem; cursor: pointer;">Join Match</button>
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

/**
 * Generates standard double-six set array (28 bones)
 */
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

/**
 * Shuffles deck securely using Fisher-Yates algorithm
 */
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

    // Backend Execution: Shuffling & Dealing Loop Logic
    const fullDeck = shuffleBones(generateFullDominoSet());
    const assignedPlayersObject = {
        player1: { seat: 1, hand: fullDeck.slice(0, 7), name: "Table Host" },
        player2: { seat: 2, hand: fullDeck.slice(7, 14), name: "Waiting..." },
        player3: { seat: 3, hand: fullDeck.slice(14, 21), name: "Waiting..." },
        player4: { seat: 4, hand: fullDeck.slice(21, 28), name: "Waiting..." }
    };

    // Locate starting turn option (Whoever owns highest double starts down)
    let startingSeat = 1;
    let highestDouble = -1;
    for (let s = 1; s <= 4; s++) {
        const playerHand = assignedPlayersObject[`player${s}`].hand;
        playerHand.forEach(tile => {
            if (tile.isDouble && tile.top > highestDouble) {
                highestDouble = tile.top;
                startingSeat = s;
            }
        });
    }

    localGameState = {
        room_code: generatedCode,
        game_state: 'waiting',
        board_line: [],
        active_turn: startingSeat,
        players: assignedPlayersObject
    };

    if (!supabaseClient) {
        playerSeatNumber = 1;
        currentRoomCode = generatedCode;
        switchToGameTableView();
        renderLiveTable(localGameState.board_line);
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('domino_rooms')
            .insert([localGameState])
            .select();

        if (error) throw error;

        playerSeatNumber = 1; 
        currentRoomCode = generatedCode;
        subscribeToRoom(currentRoomCode);
    } catch (err) {
        console.error("Database connection fault fallback triggered:", err);
        playerSeatNumber = 1;
        currentRoomCode = generatedCode;
        switchToGameTableView();
        renderLiveTable(localGameState.board_line);
    }
}

async function joinRoom(code) {
    if (!supabaseClient) {
        alert("Running local match simulator mode. Click 'Create New Table' instead.");
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('domino_rooms')
            .select('*')
            .eq('room_code', code)
            .single();

        if (error || !data) {
            alert("Table not found! Check your room code.");
            return;
        }

        let assignedSeat = null;
        const currentPlayers = data.players;

        // Auto-assign open player seat vectors cleanly
        for (let i = 2; i <= 4; i++) {
            if (currentPlayers[`player${i}`].name === "Waiting...") {
                assignedSeat = i;
                currentPlayers[`player${i}`].name = `Player ${i}`;
                break;
            }
        }

        if (!assignedSeat) {
            alert("This table session is completely full up!");
            return;
        }

        // Push seat registry updates to database
        const { error: updateError } = await supabaseClient
            .from('domino_rooms')
            .update({ players: currentPlayers })
            .eq('room_code', code);

        if (updateError) throw updateError;

        playerSeatNumber = assignedSeat;
        currentRoomCode = code;
        subscribeToRoom(currentRoomCode);
    } catch (err) {
        console.error("Error joining remote table session:", err);
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
            localGameState = payload.new;
            handleRoomUpdate(localGameState);
        })
        .subscribe();

    switchToGameTableView();
}

function switchToGameTableView() {
    const lobbyView = document.getElementById("lobby-view");
    const tableView = document.getElementById("table-view");
    
    if (lobbyView) lobbyView.style.display = "none";
    if (tableView) tableView.classList.remove("hidden-layout");
}

/**
 * Core dynamic action: Dispatches state modifications straight to Supabase data layer
 */
async function pushMoveToDatabase(updatedBoardLine, nextTurnSeatNumber, updatedPlayersMap) {
    localGameState.board_line = updatedBoardLine;
    localGameState.active_turn = nextTurnSeatNumber;
    localGameState.players = updatedPlayersMap;

    // Evaluate if anyone completely ran out of bones (Domino win state)
    let winnerDeclared = null;
    for (let i = 1; i <= 4; i++) {
        if (localGameState.players[`player${i}`].hand.length === 0) {
            winnerDeclared = i;
            localGameState.game_state = 'finished';
        }
    }

    if (!supabaseClient) {
        handleRoomUpdate(localGameState);
        return;
    }

    try {
        await supabaseClient
            .from('domino_rooms')
            .update({
                board_line: localGameState.board_line,
                active_turn: localGameState.active_turn,
                players: localGameState.players,
                game_state: localGameState.game_state
            })
            .eq('room_code', currentRoomCode);
    } catch (err) {
        console.error("Failed syncing engine parameters data sequence:", err);
    }
}

function handleRoomUpdate(updatedRoomState) {
    if (typeof renderLiveTable === 'function') {
        // Redraws the horseshoe path with the true updated array from the server
        renderLiveTable(updatedRoomState.board_line);
    }
    
    // Developer validation debugging tracker hook layout
    console.log(`Match Lounge Synchronized. Active Turn Seat: Player ${updatedRoomState.active_turn}`);
}
