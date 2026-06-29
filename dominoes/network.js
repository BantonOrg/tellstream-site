// ==========================================================================
// Tellstream Dominoes - Supabase Realtime & Network Layer
// ==========================================================================

// Initialize Supabase Client (Replace with your actual project credentials when ready)
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_KEY = 'your-public-anon-key';
const supabase = window.supabase ? Supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

let currentRoomCode = null;
let playerSeatNumber = null; // 1, 2, 3, or 4
let roomSubscription = null;

/**
 * Triggered automatically when "Click to Enter Lounge" is pressed
 */
function initNetwork() {
    showLobbyUI();
}

/**
 * Builds the initial Room Join/Create interface dynamically inside the lobby view
 */
function showLobbyUI() {
    const lobbyView = document.getElementById("lobby-view");
    if (!lobbyView) return;
    
    lobbyView.innerHTML = `
        <div class="lobby-panel">
            <h2>TELLSTREAM LOUNGE MATCH</h2>
            <p>Create a new table or enter a 4-digit code to join a live match.</p>
            
            <div class="lobby-actions">
                <button id="create-room-btn" class="lobby-btn primary">Create New Table</button>
                
                <div class="join-input-group">
                    <input type="text" id="room-code-input" placeholder="ENTER CODE" maxlength="4">
                    <button id="join-room-btn" class="lobby-btn">Join Match</button>
                </div>
            </div>
        </div>
    `;

    // Add event listeners for room actions
    document.getElementById("create-room-btn").addEventListener("click", createRoom);
    document.getElementById("join-room-btn").addEventListener("click", () => {
        const code = document.getElementById("room-code-input").value.toUpperCase().trim();
        if (code.length === 4) joinRoom(code);
    });
}

/**
 * Generates a unique 4-digit room code and registers it in the Supabase database
 */
async function createRoom() {
    if (!supabase) {
        // Fallback fallback to load the table directly for testing if credentials aren't set
        switchToGameTableView();
        if (typeof renderLiveTable === 'function') renderLiveTable(null);
        return;
    }

    // Generate a random 4-character alpha-numeric code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omitted confusing characters like 0/O/1/I
    let generatedCode = '';
    for (let i = 0; i < 4; i++) {
        generatedCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const { data, error } = await supabase
        .from('domino_rooms')
        .insert([{ 
            room_code: generatedCode, 
            game_state: 'waiting', 
            board_line: [], 
            active_turn: 1,
            players: {} 
        }])
        .select();

    if (error) {
        console.error("Error creating room:", error);
        alert("Failed to open a new table. Try again!");
        return;
    }

    playerSeatNumber = 1; // Host automatically gets Seat 1
    currentRoomCode = generatedCode;
    subscribeToRoom(currentRoomCode);
}

/**
 * Connects to a room table via code and requests an open seat
 */
async function joinRoom(code) {
    if (!supabase) {
        switchToGameTableView();
        if (typeof renderLiveTable === 'function') renderLiveTable(null);
        return;
    }

    const { data, error } = await supabase
        .from('domino_rooms')
        .select('*')
        .eq('room_code', code)
        .single();

    if (error || !data) {
        alert("Match room not found! Check your code.");
        return;
    }

    currentRoomCode = code;
    subscribeToRoom(currentRoomCode);
}

/**
 * Establishes a WebSockets Realtime listener so updates from any player pop instantly
 */
function subscribeToRoom(code) {
    console.log(`Subscribing to Realtime updates for Room: ${code}`);
    
    roomSubscription = supabase
        .channel(`room_${code}`)
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'domino_rooms', 
            filter: `room_code=eq.${code}` 
        }, payload => {
            handleRoomUpdate(payload.new);
        })
        .subscribe();

    switchToGameTableView();
}

/**
 * Sweaps visibility from lobby panel over to the layout canvas
 */
function switchToGameTableView() {
    const lobbyView = document.getElementById("lobby-view");
    const tableView = document.getElementById("table-view");
    
    if (lobbyView) lobbyView.style.display = "none";
    if (tableView) tableView.classList.remove("hidden-layout");
}

/**
 * Fires whenever a change is made by any player at the table
 */
function handleRoomUpdate(updatedRoomState) {
    console.log("Table State Updated:", updatedRoomState);
    if (updatedRoomState.board_line && typeof renderLiveTable === 'function') {
        renderLiveTable(updatedRoomState.board_line);
    }
}
