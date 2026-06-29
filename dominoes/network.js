// ==========================================================================
// Tellstream Dominoes - Supabase Realtime & Network Layer
// ==========================================================================

const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_KEY = 'your-public-anon-key';
let supabase = null;

// Safe client initialization
try {
    if (typeof Supabase !== 'undefined') {
        supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (e) {
    console.warn("Supabase is not initialized. Using local fallback mode.");
}

let currentRoomCode = null;
let playerSeatNumber = null; 
let roomSubscription = null;

function initNetwork() {
    showLobbyUI();
}

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

    document.getElementById("create-room-btn").addEventListener("click", createRoom);
    document.getElementById("join-room-btn").addEventListener("click", () => {
        const code = document.getElementById("room-code-input").value.toUpperCase().trim();
        if (code.length === 4) joinRoom(code);
    });
}

async function createRoom() {
    if (!supabase || SUPABASE_URL.includes('your-project-id')) {
        switchToGameTableView();
        if (typeof renderLiveTable === 'function') renderLiveTable(null);
        return;
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
    let generatedCode = '';
    for (let i = 0; i < 4; i++) {
        generatedCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    try {
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

        if (error) throw error;

        playerSeatNumber = 1; 
        currentRoomCode = generatedCode;
        subscribeToRoom(currentRoomCode);
    } catch (err) {
        console.error("Error creating room:", err);
        switchToGameTableView();
        if (typeof renderLiveTable === 'function') renderLiveTable(null);
    }
}

async function joinRoom(code) {
    if (!supabase || SUPABASE_URL.includes('your-project-id')) {
        switchToGameTableView();
        if (typeof renderLiveTable === 'function') renderLiveTable(null);
        return;
    }

    try {
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
    } catch (err) {
        console.error("Error joining room:", err);
    }
}

function subscribeToRoom(code) {
    if (!supabase) return;
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

function switchToGameTableView() {
    const lobbyView = document.getElementById("lobby-view");
    const tableView = document.getElementById("table-view");
    
    if (lobbyView) lobbyView.style.display = "none";
    if (tableView) tableView.classList.remove("hidden-layout");
}

function handleRoomUpdate(updatedRoomState) {
    console.log("Table State Updated:", updatedRoomState);
    if (updatedRoomState.board_line && typeof renderLiveTable === 'function') {
        renderLiveTable(updatedRoomState.board_line);
    }
}
