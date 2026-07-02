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
const drawerTitle = document.getElementById('drawerTitle');
const regNameInput = document.getElementById('regNameInput');
const regPasskeyInput = document.getElementById('regPasskeyInput');
const regReminderInput = document.getElementById('regReminderInput');
const regEmailInput = document.getElementById('regEmailInput');
const drawerSubmitBtn = document.getElementById('drawerSubmitBtn');
const reminderHintDisplay = document.getElementById('reminderHintDisplay');
const lockStatusBtn = document.getElementById('lockStatusBtn');

const imgBaseUrl = "https://tellstream-emojis.pages.dev/";

let profilesCache = {};
let bannedWordsCache = [];
let bannedUsersCache = {}; 
let isNoticeBoardActive = false;

// Direct Header Logic
async function updateHeaderIdentity() {
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
        const identityMap = {
            "Tellstream": "header-bg1.jpg",
            "BIGJOHN NU 000": "header-bg-bigjohn.jpg"
        };
        const leftCell = document.querySelector('.cell-left');
        if (leftCell && identityMap[streamName]) {
            leftCell.style.backgroundImage = `url('/${identityMap[streamName]}')`;
        }
    } catch (error) { console.log("Header update skip"); }
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

function checkBanStatus(username) {
    const userBan = bannedUsersCache[username.toLowerCase()];
    if (!userBan) return { isBanned: false };
    if (userBan.is_permanent) return { isBanned: true, message: "You have been permanently banned." };
    if (userBan.ban_expires_at) {
        const expiration = new Date(userBan.ban_expires_at);
        if (expiration > new Date()) return { isBanned: true, message: "You are temporarily banned." };
    }
    return { isBanned: false };
}

function appendPrivateWelcomeGreeting(compiledMessageText) {
    if (!chatBox) return;
    const systemDiv = document.createElement('div');
    systemDiv.className = 'msg';
    systemDiv.style.borderLeft = '4px solid #00E676'; 
    systemDiv.style.background = 'rgba(0, 230, 118, 0.05)';
    systemDiv.innerHTML = `<div class="user" style="color: #00E676; font-weight: 900;">TELLA SECURITY</div><div style="color: #e0f2f1; font-size: 0.88rem; line-height: 1.4;">${compiledMessageText} <br><span style="opacity: 0.4; font-size: 0.75rem; font-style: italic;">(Only you can see this message)</span></div>`;
    chatBox.appendChild(systemDiv);
    anchorChatToBottom();
}

function appendPrivateWarning(user, text, strikeCount, customMessage = null) {
    if (!chatBox) return;
    let warningMsg = customMessage || `⚠️ PRIVATE WARNING: Strike ${strikeCount}/3. Bad language detected.`;
    const systemDiv = document.createElement('div');
    systemDiv.className = 'msg';
    systemDiv.style.borderLeft = '4px solid #ff3333';
    systemDiv.style.background = 'rgba(255, 51, 51, 0.08)';
    systemDiv.innerHTML = `<div class="user" style="color: #ff3333; font-weight: 900;">TELLA SECURITY</div><div style="color: #ffdddd; font-style: italic; font-size: 0.85rem;">${warningMsg} <br><span style="opacity: 0.6;">(Only you can see this message)</span></div>`;
    chatBox.appendChild(systemDiv);
    if (text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'msg';
        msgDiv.innerHTML = `<div class="user"> ${escapeHTML(user)}</div><div>${escapeHTML(cleanSwearWords(text))}</div>`;
        chatBox.appendChild(msgDiv);
    }
    anchorChatToBottom();
}

async function handleUserStrike(username, originalText) {
    const lowerUser = username.toLowerCase();
    const existingRecord = bannedUsersCache[lowerUser];
    let currentStrikes = (existingRecord ? existingRecord.strikes : 0) + 1;
    let banExpiresAt = (currentStrikes === 3) ? new Date(Date.now() + 86400000).toISOString() : null;
    await supabase_db.from('banned_users').upsert({ username: lowerUser, strikes: currentStrikes, ban_expires_at: banExpiresAt, is_permanent: (currentStrikes > 3) });
    appendPrivateWarning(username, originalText, currentStrikes);
}

async function checkAndProcessApology(username, text) {
    const lowerUser = username.toLowerCase();
    const existingRecord = bannedUsersCache[lowerUser];
    if (existingRecord && existingRecord.strikes > 0 && !existingRecord.apology_used && /\b(sorry|apologise|apologize)\b/i.test(text)) {
        await supabase_db.from('banned_users').upsert({ username: lowerUser, strikes: existingRecord.strikes - 1, apology_used: true });
        appendPrivateWarning(username, null, existingRecord.strikes - 1, "✅ APOLOGY ACCEPTED: One strike removed!");
        return true;
    }
    return false;
}

async function handleAdminFilterCommand(text) {
    if (text.startsWith('/add ')) { await supabase_db.from('banned_words').insert([{ word: text.substring(5).trim().toLowerCase() }]); }
    else if (text.startsWith('/del ')) { await supabase_db.from('banned_words').delete().eq('word', text.substring(5).trim().toLowerCase()); }
    else if (text.startsWith('/unban ')) { await supabase_db.from('banned_users').delete().eq('username', text.substring(7).trim().toLowerCase()); }
}

function renderFacebookFeed() { fbFeedContainer.innerHTML = facebookPosts.map(post => `<div class="fb-post-card" onclick="window.open('${post.link}', '_blank');"><div class="fb-post-meta">Tellstream Page • ${post.date}</div><div class="fb-post-text">${post.text}</div></div>`).join(''); }

async function renderActiveFlyers() {
    const { data: files } = await supabase_db.storage.from('flyers').list('', { limit: 100 });
    if (!files) return;
    let renderedHtml = "";
    for (let file of files) {
        if (file.name === ".emptyFolderPlaceholder") continue;
        const { data: urlData } = supabase_db.storage.from('flyers').getPublicUrl(file.name);
        renderedHtml += `<div class="flyer-item" onclick="launchFlyerLightbox('${urlData.publicUrl}')"><img src="${urlData.publicUrl}"><h4 style="text-transform: capitalize;">${file.name.substring(7).replace(/_/g, ' ')}</h4></div>`;
    }
    flyerContainer.innerHTML = renderedHtml || `<p style="color:#666; text-align:center;">No current event flyers.</p>`;
}

function renderHelpContent(useNoticeboardGuide = false) {
    const dataset = useNoticeboardGuide ? noticeboardHelpInstructions : helpInstructions;
    const html = dataset.map(item => `<div class="help-item-card"><h5>${item.title}</h5><p>${item.text}</p></div>`).join('');
    helpCardsContainer.innerHTML = html;
    helpCardsContainerFS.innerHTML = html;
}

function launchFlyerLightbox(imgSrc) { modalTargetImg.src = imgSrc; flyerModal.classList.add('active'); }
function closeFlyerLightbox() { flyerModal.classList.remove('active'); }

function toggleChatFullscreen() {
    if (isNoticeBoardActive) toggleNoticeBoardView();
    document.body.classList.toggle('chat-is-fullscreen');
    fsToggleBtn.innerText = document.body.classList.contains('chat-is-fullscreen') ? "Exit Fullscreen" : "Maximize Chat";
    anchorChatToBottom();
}

function initQuickEmojiCloud() {
    if (!window.emojiMapping) return;
    const html = Object.keys(window.emojiMapping).slice(0, 32).map(key => `<div class="emoji-grid-item" onclick="insertEmojiCode('${key}')">:${key}:</div>`).join('');
    quickEmojiList.innerHTML = html;
    quickEmojiListFS.innerHTML = html;
}

function insertEmojiCode(code) { messageInput.value += ` :${code}: `; messageInput.focus(); }

function toggleNoticeBoardView() {
    const streamChat = document.getElementById('chatBox');
    const noticePanel = document.getElementById('noticeboard-view-panel');
    const inputContainer = document.getElementById('chat-input-panel-container');
    const toggleBtn = document.getElementById('toggle-notice-btn');
    if (!isNoticeBoardActive) {
        document.body.classList.add('chat-is-fullscreen');
        streamChat.style.display = 'none'; inputContainer.style.display = 'none'; noticePanel.style.display = 'flex';
        toggleBtn.innerText = "❌ Exit Noticeboard"; isNoticeBoardActive = true;
        renderHelpContent(true); fetchNoticeBoardRecords();
    } else {
        document.body.classList.remove('chat-is-fullscreen');
        noticePanel.style.display = 'none'; streamChat.style.display = 'flex'; inputContainer.style.display = 'flex';
        toggleBtn.innerText = "📋 Noticeboard"; isNoticeBoardActive = false;
        renderHelpContent(false); anchorChatToBottom();
    }
}

async function fetchNoticeBoardRecords() {
    const { data } = await supabase_db.from('notice_board').select('*').order('created_at', { ascending: false });
    if (data) {
        document.getElementById('feed-boss').innerHTML = ""; document.getElementById('feed-selectors').innerHTML = ""; document.getElementById('feed-fambily').innerHTML = "";
        data.forEach(item => {
            const col = document.getElementById(`feed-${item.board_type}`);
            if (col) col.innerHTML += `<div class="notice-card-item"><strong>${escapeHTML(item.username)}:</strong> <span>${escapeHTML(item.notice_text)}</span></div>`;
        });
    }
}

async function submitNoticeUpdate(boardType) {
    const user = usernameInput.value.trim();
    const input = document.getElementById(`input-${boardType}`);
    if (!input.value.trim()) return;
    await supabase_db.from('notice_board').insert([{ username: user, notice_text: input.value.trim(), board_type: boardType }]);
    input.value = ""; fetchNoticeBoardRecords();
}

function syncDrawerName() {
    const name = usernameInput.value.trim();
    regNameInput.value = name;
    lockStatusBtn.innerText = profilesCache[name] ? "🔒" : "🔓";
    securityDrawer.classList.remove('open');
}

async function toggleSecurityDrawer() { if (securityDrawer.classList.toggle('open')) syncDrawerName(); }

async function handleSecuritySubmit() {
    const name = usernameInput.value.trim();
    const pass = regPasskeyInput.value.trim();
    if (profilesCache[name]) {
        if (profilesCache[name].passkey === pass) {
            localStorage.setItem('tellstream_key_' + name, pass);
            alert("Authorized!"); securityDrawer.classList.remove('open'); loadMessages();
        }
    } else {
        await supabase_db.from('secured_profiles').insert([{ username: name, passkey: pass, power_level: 0 }]);
        alert("Registered!"); await syncProfilesMap(); securityDrawer.classList.remove('open');
    }
}

async function syncProfilesMap() {
    const { data } = await supabase_db.from('secured_profiles').select('*');
    if (data) data.forEach(p => { profilesCache[p.username] = p; });
}

async function syncBannedWordsMap() { const { data } = await supabase_db.from('banned_words').select('word'); if (data) bannedWordsCache = data.map(i => i.word.toLowerCase()); }

async function syncBannedUsersMap() { const { data } = await supabase_db.from('banned_users').select('*'); if (data) data.forEach(u => { bannedUsersCache[u.username.toLowerCase()] = u; }); }

audioPlayer.addEventListener('error', () => { audioPlayer.src = audioPlayer.src; audioPlayer.play(); });

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
    renderFacebookFeed(); renderActiveFlyers(); renderHelpContent(false);
    setTimeout(initQuickEmojiCloud, 500);
    updateHeaderIdentity(); // Runs the direct stream reader
    await syncProfilesMap(); await syncBannedWordsMap(); await syncBannedUsersMap(); await loadMessages();
})();
