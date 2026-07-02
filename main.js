const SUPABASE_URL = "https://vegwferwmyuunwvfqpsf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZ3dmZXJ3bXl1dW53dmZxcHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzODU5NDQsImV4cCI6MjA5Nzk2MTk0NH0.7F3HUEY59BGE5phlD9AukhZzRa3Ied_ZT43j8YZeIy8";
const supabase_db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const chatBox = document.getElementById('chatBox');
const usernameInput = document.getElementById('usernameInput');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const audioPlayer = document.getElementById('radioPlayer');
const flyerContainer = document.getElementById('flyerContainer');
const quickEmojiList = document.getElementById('quickEmojiList');
const quickEmojiListFS = document.getElementById('quickEmojiListFS');
const fbFeedContainer = document.getElementById('fbFeedContainer');
const helpCardsContainer = document.getElementById('helpCardsContainer');
const helpCardsContainerFS = document.getElementById('helpCardsContainerFS');
const fsToggleBtn = document.getElementById('fsToggleBtn');
const flyerModal = document.getElementById('flyerModal');
const modalTargetImg = document.getElementById('modalTargetImg');

const securityDrawer = document.getElementById('securityDrawer');
const regNameInput = document.getElementById('regNameInput');
const regPasskeyInput = document.getElementById('regPasskeyInput');
const lockStatusBtn = document.getElementById('lockStatusBtn');

const imgBaseUrl = "https://tellstream-emojis.pages.dev/";

let profilesCache = {};
let bannedWordsCache = [];
let bannedUsersCache = {}; 
let isNoticeBoardActive = false;

// Stream Name Display Logic
async function updateStreamDisplay() {
    try {
        const response = await fetch('https://a3.asurahosting.com/listen/tellstream/index.html?sid=1');
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        
        let streamName = "";
        const tds = doc.querySelectorAll('td');
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].innerText.includes("Stream Name:")) {
                streamName = tds[i+1].innerText.trim();
                break;
            }
        }
        
        const display = document.getElementById('stream-name-display');
        if (display && streamName) {
            display.innerText = streamName;
        }
        
        // Background image swap logic
        const identityMap = {
            "Tellstream": "header-bg1.jpg",
            "BIGJOHN NU 000": "header-bg-bigjohn.jpg"
        };
        const leftCell = document.querySelector('.cell-left');
        if (leftCell && identityMap[streamName]) {
            leftCell.style.backgroundImage = `url('/${identityMap[streamName]}')`;
        }
    } catch (error) { console.log("Stream update skip"); }
}

if (usernameInput) {
    const savedName = localStorage.getItem('tellstream_saved_username');
    if (savedName) usernameInput.value = savedName;
    usernameInput.addEventListener('input', () => {
        localStorage.setItem('tellstream_saved_username', usernameInput.value.trim());
        syncDrawerName();
    });
}

const facebookPosts = [
    { id: 1, date: "Just now", text: "Big John is locked and loaded live in the studio! Lock into tellstream.banton.org right now and fire up the lounge chat! 🎚️🔥", link: "https://www.facebook.com/tellstream.dem" },
    { id: 2, date: "Yesterday", text: "Big respect to all the listeners locking in from around the globe. Drop your shoutouts and tell-a-wheel selectors directly inside the main chat line! 🔊🎧", link: "https://www.facebook.com/tellstream.dem" },
    { id: 3, date: "2 days ago", text: "Weekend scheduling updates coming soon. Keep your locked eyes locked onto the central flyer board for upcoming live dance clashes.", link: "https://www.facebook.com/tellstream.dem" }
];

const helpInstructions = [
    { title: "Setting Nickname", text: "Fill in the Nickname block before typing to claim your handle in the Lounge panel." },
    { title: "Sending Text Lines", text: "Type your query inside the input field box and tap Send or hit your keyboard Enter button." },
    { title: "Firing Emojis & Sounds", text: "Tap any active shorthand key code block inside the selection layout panel below to append it to your message. Click [See All Codes] for more." },
    { title: "⚠️ Chat Moderation Rules", text: "Profanity and abusive language are automatically blocked. Swearing triggers an automated strike track system: 3 strikes results in a 24-hour temporary lockout." }
];

const noticeboardHelpInstructions = [
    { title: "Noticeboard Rules", text: "Stay respectful. Unauthorized, abusive, or hostile comments will be flagged and removed instantly." },
    { title: "Authority Levels", text: "The Boss panel is restricted to Station Admins. Selectors manage the central schedule log." },
    { title: "Adding Updates", text: "Once verified via your secure local passkey profile drawer, choose a column target form to submit notifications directly." },
    { title: "⚠️ Noticeboard Enforcement", text: "The dynamic global blocklist active in the Lounge chat applies directly to noticeboard columns." }
];

function anchorChatToBottom() {
    const chatContainer = document.querySelector('.chat-messages') || chatBox;
    if (chatContainer) {
        setTimeout(() => { chatContainer.scrollTop = chatContainer.scrollHeight; }, 50);
    }
}

function containsSwearWords(text) {
    if (bannedWordsCache.length === 0) return false;
    const escapedWords = bannedWordsCache.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const pattern = new RegExp(`\\b(${escapedWords})\\b`, 'gi');
    return pattern.test(text);
}

function cleanSwearWords(text) {
    if (bannedWordsCache.length === 0) return text;
    const escapedWords = bannedWordsCache.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const pattern = new RegExp(`\\b(${escapedWords})\\b`, 'gi');
    return text.replace(pattern, '****');
}

function appendMessage(data) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg';
    let msg = escapeHTML(data.message).replace(/:([a-zA-Z0-9_-]+):/g, (match, code) => (window.emojiMapping && window.emojiMapping[code.toLowerCase()]) ? `<img src="${imgBaseUrl}${window.emojiMapping[code.toLowerCase()]}" style="max-height: 48px; vertical-align: middle; margin: 2px;">` : match);
    msgDiv.innerHTML = `<div class="user">${escapeHTML(data.username)}</div><div>${msg}</div>`;
    chatBox.appendChild(msgDiv); anchorChatToBottom();
}

function escapeHTML(str) { return str.replace(/[&<>'"]/g, t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[t] || t)); }

async function loadMessages() {
    const { data } = await supabase_db.from('messages').select('*').order('id', { ascending: true }).limit(40);
    if (data) { data.forEach(appendMessage); }
}

supabase_db.channel('public:messages').on('postgres_changes', { event: 'INSERT', table: 'messages' }, p => appendMessage(p.new)).subscribe();

async function sendMessage() {
    const user = usernameInput.value.trim() || 'Listener';
    const text = messageInput.value.trim();
    if (!text) return;
    messageInput.value = '';
    await supabase_db.from('messages').insert([{ username: user, message: text }]);
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

(async function initSystem() {
    updateStreamDisplay(); 
    loadMessages();
})();
