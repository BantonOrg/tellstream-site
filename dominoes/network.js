// ==========================================================================
// Tellstream Dominoes - Supabase Realtime & Network Layer
// ==========================================================================

const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_KEY = 'your-public-anon-key';
let supabaseClient = null; // Renamed to prevent matching conflicts

try {
    // If the CDN injected the global object successfully, use it safely
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        if (!SUPABASE_URL.includes('your-project-id')) {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        }
    }
} catch (e) {
    console.warn("Supabase library initialization skipped. Using local demo fallback.");
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

    const createBtn = document.getElementById("create-room-btn");
    const joinBtn = document.getElementById("join-room-btn");

    if (createBtn) createBtn.addEventListener("click", createRoom);
    if (joinBtn) {
        joinBtn.addEventListener("click", () => {
            const inputNode = document.getElementById("room-code-input");
            const code = inputNode ? inputNode.value.toUpperCase().trim() : "";
            if (code.length === 4) joinRoom(code);
        });
    }
}

async function createRoom() {
    if (!supabaseClient) {
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
        const { data, error } = await supabaseClient
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
        console.error("Database table creation failure:", err);
        switchToGameTableView();
        if (typeof renderLiveTable === 'function') renderLiveTable(null);
    }
}

async function joinRoom(code) {
    if (!supabaseClient) {
        switchToGameTableView();
        if (typeof renderLiveTable === 'function') renderLiveTable(null);
        return;
    }

    try {
        const { data, error } = await supabaseClient
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
        console.error("Database join error:", err);
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
    if (updatedRoomState.board_line && typeof renderLiveTable === 'function') {
        renderLiveTable(updatedRoomState.board_line);
    }
}
