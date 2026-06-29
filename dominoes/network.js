// ==========================================================================
// Tellstream Dominoes - Supabase Realtime & Network Layer
// ==========================================================================

// Initialize Supabase Client (Replace with your actual project credentials)
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_KEY = 'your-public-anon-key';
const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentRoomCode = null;
let playerSeatNumber = null; // 1, 2, 3, or 4
let roomSubscription = null;

/**
 * Triggered automatically when "Hold a seat when you ready !" is clicked
 */
function initNetwork() {
    showLobbyUI();
}

/**
 * Builds the initial Room Join/Create interface dynamically inside the lobby view
 */
function showLobbyUI() {
    const lobbyView = document.getElementById("lobby-view");
    
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
    // Generate a random 4-character alpha-numeric code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omitted confusing characters like 0/O/1/I
    let generatedCode = '';
    for (let i = 0; i < 4; i++) {
        generatedCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Insert the initial game state structure into your Supabase table
    const { data, error } = await supabase
        .from('domino_rooms')
        .insert([{ 
            room_code: generatedCode, 
            game_state: 'waiting', 
            board_line: [], 
            active_turn: 1,
            players: {} // Keeps track of names and occupied seats
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
    // Next logic step will evaluate open seats (2, 3, or 4) and assign one here
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
            // Realtime Update payload received from another player!
            handleRoomUpdate(payload.new);
        })
        .subscribe();

    // Hide lobby selection, reveal the physical game table
    document.getElementById("lobby-view").style.display = "none";
    document.getElementById("table-view").classList.remove("hidden-layout");
}

/**
 * Fires whenever a change is made by any player at the table
 */
function handleRoomUpdate(updatedRoomState) {
    console.log("Table State Updated:", updatedRoomState);
    // This connects to game.js to update the glowing tiles, handle pips, and trigger clacks!
}
