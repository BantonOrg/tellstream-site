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

// --- DYNAMIC HEADER IDENTITY LOGIC ---
async function updateHeaderIdentity() {
    try {
        const response = await fetch('https://a3.asurahosting.com/listen/tellstream/stats.xml');
        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        const streamName = xmlDoc.getElementsByTagName("STREAMNAME")[0]?.textContent;
        
        const identityMap = {
            "Tellstream": "header-bg1.jpg",
            "BIGJOHN NU 000": "header-bg-bigjohn.jpg" 
        };

        const targetImage = identityMap[streamName] || "header-bg1.jpg";
        const leftCell = document.querySelector('.cell-left');
        if (leftCell) {
            leftCell.style.backgroundImage = `url('${targetImage}')`;
        }
    } catch (error) {
        console.log("Header update skipped:", error);
    }
}

// --- EXISTING CHAT LOGIC ---
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
    { title: "⚠️ Chat Moderation Rules", text: "Profanity and abusive language are automatically blocked. Swearing triggers an automated strike track system: 3 strikes results in a 24-hour temporary lockout. A repeat offense after lockout leads to an instant, permanent handle ban. Genuine apologies can restore one lost strike." }
];

const noticeboardHelpInstructions = [
    { title: "Noticeboard Rules", text: "Stay respectful. Unauthorized, abusive, or hostile comments will be flagged and removed instantly by Station Admins." },
    { title: "Authority Levels", text: "The Boss panel is restricted to Station Admins. Selectors manage the central schedule log." },
    { title: "Adding Updates", text: "Once verified via your secure local passkey profile drawer, choose a column target form to submit notifications directly." },
    { title: "⚠️ Noticeboard Enforcement", text: "The dynamic global blocklist active in the Lounge chat applies directly to noticeboard columns. Posting restricted keywords increments your profile strikes and can lead to an automated 24-hour column ban or permanent lifetime removal." }
];

function anchorChatToBottom() {
    const chatContainer = document.querySelector('.chat-messages') || chatBox;
    if (chatContainer) {
        setTimeout(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 50);
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
    if (userBan.is_permanent) {
        return { isBanned: true, message: "You have been permanently banned from the Tellstream Lounge." };
    }
    if (userBan.ban_expires_at) {
        const expiration = new Date(userBan.ban_expires_at);
        if (expiration > new Date()) {
            const remainingHours = Math.ceil((expiration - new Date()) / (1000 * 60 * 60));
            return { isBanned: true, message: `You are temporarily banned for swearing. Ban expires in ${remainingHours} hours.` };
        }
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
    let warningMsg = customMessage;
    if (!warningMsg) {
        warningMsg = `⚠️ PRIVATE WARNING: Strike ${strikeCount}/3. Bad language detected.`;
        if (strikeCount === 3) {
            warningMsg = "🛑 AUTOMATED BAN ACTION: You have used banned keywords 3 times. You are now locked out for 24 hours.";
        } else if (strikeCount > 3) {
            warningMsg = "🚫 PERMANENT LIFETIME LOCKOUT: Repeat offense detected. Your handle access is permanently revoked.";
        }
    }
    const systemDiv = document.createElement('div');
    systemDiv.className = 'msg';
    systemDiv.style.borderLeft = '4px solid #ff3333';
    systemDiv.style.background = 'rgba(255, 51, 51, 0.08)';
    systemDiv.innerHTML = `<div class="user" style="color: #ff3333; font-weight: 900;">TELLA SECURITY</div><div style="color: #ffdddd; font-style: italic; font-size: 0.85rem;">${warningMsg} <br><span style="opacity: 0.6;">(Only you can see this message)</span></div>`;
    chatBox.appendChild(systemDiv);
    if (text) {
        const maskedText = cleanSwearWords(text);
        const msgDiv = document.createElement('div');
        msgDiv.className = 'msg';
        const profile = profilesCache[user];
        let nameClass = "user-unregistered";
        let hoverAttribute = "";
        if (profile) {
            nameClass = (profile.power_level >= 1) ? "user-admin" : "user-registered";
            if (profile.hover_title) hoverAttribute = `title="${escapeHTML(profile.hover_title)}"`;
        }
        msgDiv.innerHTML = `<div class="user ${nameClass}" ${hoverAttribute}>${escapeHTML(user)}</div><div>${escapeHTML(maskedText)}</div>`;
        chatBox.appendChild(msgDiv);
    }
    anchorChatToBottom();
}

async function handleUserStrike(username, originalText) {
    const lowerUser = username.toLowerCase();
    const existingRecord = bannedUsersCache[lowerUser];
    let currentStrikes = existingRecord ? existingRecord.strikes : 0;
    let apologyUsed = existingRecord ? existingRecord.apology_used : false;
    currentStrikes += 1;
    let banExpiresAt = null;
    let isPermanent = false;
    if (currentStrikes === 3) {
        const tomorrow = new Date();
        tomorrow.setHours(tomorrow.getHours() + 24);
        banExpiresAt = tomorrow.toISOString();
    } else if (currentStrikes > 3) {
        isPermanent = true;
    }
    await supabase_db.from('banned_users').upsert({
        username: lowerUser,
        strikes: currentStrikes,
        ban_expires_at: banExpiresAt,
        is_permanent: isPermanent,
        apology_used: apologyUsed,
        updated_at: new Date().toISOString()
    });
    appendPrivateWarning(username, originalText, currentStrikes);
}

async function checkAndProcessApology(username, text) {
    const lowerUser = username.toLowerCase();
    const existingRecord = bannedUsersCache[lowerUser];
    if (!existingRecord || existingRecord.strikes === 0 || existingRecord.apology_used) return false;
    const apologyRegex = /\b(sorry|apologise|apologize)\b/i;
    if (apologyRegex.test(text)) {
        let currentStrikes = existingRecord.strikes - 1;
        await supabase_db.from('banned_users').upsert({
            username: lowerUser,
            strikes: currentStrikes,
            ban_expires_at: null,
            is_permanent: false,
            apology_used: true,
            updated_at: new Date().toISOString()
        });
        appendPrivateWarning(username, null, currentStrikes, `✅ APOLOGY ACCEPTED: Your one-time grace apology has been processed. One strike removed! Current strikes: ${currentStrikes}/3.`);
        return true;
    }
    return false;
}

async function handleAdminFilterCommand(text) {
    if (text.startsWith('/add ')) {
        const wordToAdd = text.substring(5).trim().toLowerCase();
        if (!wordToAdd) return;
        const { error } = await supabase_db.from('banned_words').insert([{ word: wordToAdd }]);
        if (!error) alert(`"${wordToAdd}" added to filter list.`);
    } 
    else if (text.startsWith('/del ')) {
        const wordToDel = text.substring(5).trim().toLowerCase();
        if (!wordToDel) return;
        const { error } = await supabase_db.from('banned_words').delete().eq('word', wordToDel);
        if (!error) alert(`"${wordToDel}" removed from filter list.`);
    } 
    else if (text.startsWith('/unban ')) {
        const userToUnban = text.substring(7).trim().toLowerCase();
        if (!userToUnban) return;
        const { error } = await supabase_db.from('banned_users').delete().eq('username', userToUnban);
        if (!error) alert(`User "${userToUnban}" has been successfully unbanned.`);
    }
    else if (text === '/listwords') {
        alert(bannedWordsCache.length === 0 ? "Filter is empty." : "Filtered Words:\n" + bannedWordsCache.join(', '));
    }
}

function renderFacebookFeed() {
    fbFeedContainer.innerHTML = facebookPosts.map(post => `
        <div class="fb-post-card" onclick="window.open('${post.link}', '_blank');">
            <div class="fb-post-meta">Tellstream Page • ${post.date}</div>
            <div class="fb-post-text">${post.text}</div>
        </div>
    `).join('');
}

async function renderActiveFlyers() {
    const today = new Date();
    today.setDate(today.getDate() - 1);
    today.setHours(0,0,0,0);
    const { data: files, error } = await supabase_db.storage.from('flyers').list('', { limit: 100 });
    if (error || !files || files.length === 0) {
        flyerContainer.innerHTML = `<p style="color:#666; text-align:center; padding-top:20px;">No current event flyers listed.</p>`;
        return;
    }
    let renderedHtml = "";
    for (let file of files) {
        if (file.name === ".emptyFolderPlaceholder") continue;
        const datePrefix = file.name.substring(0, 6);
        if (/^\d{6}$/.test(datePrefix)) {
            const day = parseInt(datePrefix.substring(0, 2), 10);
            const month = parseInt(datePrefix.substring(2, 4), 10) - 1;
            const year = 2000 + parseInt(datePrefix.substring(4, 6), 10);
            const expirationDate = new Date(year, month, day);
            if (expirationDate < today) {
                await supabase_db.storage.from('flyers').remove([file.name]);
                continue;
            }
        }
        const { data: urlData } = supabase_db.storage.from('flyers').getPublicUrl(file.name);
        const titleClean = file.name.substring(7).replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
        renderedHtml += `
            <div class="flyer-item" onclick="launchFlyerLightbox('${urlData.publicUrl}')">
                <img src="${urlData.publicUrl}" alt="${titleClean}">
                <h4 style="text-transform: capitalize;">${titleClean}</h4>
            </div>
        `;
    }
    flyerContainer.innerHTML = renderedHtml || `<p style="color:#666; text-align:center; padding-top:20px;">No current event flyers listed.</p>`;
}

function renderHelpContent(useNoticeboardGuide = false) {
    const activeDataset = useNoticeboardGuide ? noticeboardHelpInstructions : helpInstructions;
    const currentTitle = useNoticeboardGuide ? "📋 Noticeboard Help Guide" : "💡 Chat help and emoji codes";
    const html = activeDataset.map(item => `
        <div class="help-item-card">
            <h5>${item.title}</h5>
            <p>${item.text}</p>
        </div>
    `).join('');
    helpCardsContainer.innerHTML = html;
    helpCardsContainerFS.innerHTML = html;
    const fsTitleNode = helpCardsContainerFS.previousElementSibling;
    if (fsTitleNode && fsTitleNode.classList.contains('col-title')) fsTitleNode.innerHTML = currentTitle;
}

function launchFlyerLightbox(imgSrc) {
    modalTargetImg.src = imgSrc;
    flyerModal.classList.add('active');
}
function closeFlyerLightbox() {
    flyerModal.classList.remove('active');
    modalTargetImg.src = "";
}

function toggleChatFullscreen() {
    if (isNoticeBoardActive) toggleNoticeBoardView();
    document.body.classList.toggle('chat-is-fullscreen');
    fsToggleBtn.innerText = document.body.classList.contains('chat-is-fullscreen') ? "Exit Fullscreen" : "Maximize Chat";
    anchorChatToBottom();
}

function initQuickEmojiCloud() {
    if (!window.emojiMapping) return;
    const html = Object.keys(window.emojiMapping).slice(0, 32).map(key => `
        <div class="emoji-grid-item" onclick="insertEmojiCode('${key}')">:${key}:</div>
    `).join('');
    quickEmojiList.innerHTML = html;
    quickEmojiListFS.innerHTML = html;
}

function insertEmojiCode(code) {
    messageInput.value += ` :${code}: `;
    messageInput.focus();
}

function toggleNoticeBoardView() {
    const streamChat = document.getElementById('chatBox');
    const noticePanel = document.getElementById('noticeboard-view-panel');
    const inputContainer = document.getElementById('chat-input-panel-container');
    const mainTitle = document.getElementById('sidebarPanelTitle');
    const toggleBtn = document.getElementById('toggle-notice-btn');
    const emojiSectionFS = quickEmojiListFS.parentElement;
    if (!isNoticeBoardActive) {
        document.body.classList.add('chat-is-fullscreen');
        streamChat.style.display = 'none';
        inputContainer.style.display = 'none'; 
        securityDrawer.classList.remove('open'); 
        noticePanel.style.display = 'flex';
        mainTitle.innerText = "📋 Noticeboard";
        toggleBtn.innerText = "❌ Exit Noticeboard";
        isNoticeBoardActive = true;
        if (emojiSectionFS) emojiSectionFS.style.display = 'none';
        renderHelpContent(true);
        evaluateNoticeBoardForms();
        fetchNoticeBoardRecords();
    } else {
        document.body.classList.remove('chat-is-fullscreen');
        noticePanel.style.display = 'none';
        streamChat.style.display = 'flex';
        inputContainer.style.display = 'flex';
        mainTitle.innerText = "🔊 Listener Lounge";
        toggleBtn.innerText = "📋 Noticeboard";
        isNoticeBoardActive = false;
        if (emojiSectionFS) emojiSectionFS.style.display = 'block';
        renderHelpContent(false);
        anchorChatToBottom();
    }
}

function evaluateNoticeBoardForms() {
    const currentUser = usernameInput.value.trim();
    const warningBanner = document.getElementById('notice-footer-warning');
    const profile = profilesCache[currentUser];
    const authorizedKey = localStorage.getItem('tellstream_key_' + currentUser);
    const isVerified = profile && profile.passkey === authorizedKey;
    if (!isVerified) {
        warningBanner.style.display = 'block';
        document.querySelectorAll('.notice-input-form-block').forEach(form => form.style.display = 'none');
        return;
    }
    warningBanner.style.display = 'none';
    const powerLevel = parseInt(profile.power_level || 0);
    document.getElementById('form-boss').style.display = (powerLevel >= 2) ? 'block' : 'none';
    document.getElementById('form-selectors').style.display = (powerLevel >= 1) ? 'block' : 'none';
    document.getElementById('form-fambily').style.display = (powerLevel >= 0) ? 'block' : 'none';
}

async function fetchNoticeBoardRecords() {
    const { data: records, error } = await supabase_db.from('notice_board').select('*').order('created_at', { ascending: false });
    if (!error && records) {
        document.getElementById('feed-boss').innerHTML = "";
        document.getElementById('feed-selectors').innerHTML = "";
        document.getElementById('feed-fambily').innerHTML = "";
        records.forEach(item => {
            const columnTarget = document.getElementById(`feed-${item.board_type}`);
            if (columnTarget) {
                const card = document.createElement('div');
                card.className = 'notice-card-item';
                card.innerHTML = `<strong>${escapeHTML(item.username)}:</strong> <span>${escapeHTML(item.notice_text)}</span>`;
                columnTarget.appendChild(card);
            }
        });
    }
}

async function submitNoticeUpdate(boardType) {
    const currentUser = usernameInput.value.trim();
    const inputField = document.getElementById(`input-${boardType}`);
    let textContent = inputField.value.trim();
    if (!textContent) return;
    const profile = profilesCache[currentUser];
    const authorizedKey = localStorage.getItem('tellstream_key_' + currentUser);
    if (!profile || profile.passkey !== authorizedKey) return;
    const pLevel = parseInt(profile.power_level || 0);
    if (boardType === 'boss' && pLevel < 2) return;
    if (boardType === 'selectors' && pLevel < 1) return;
    const banCheck = checkBanStatus(currentUser);
    if (banCheck.isBanned) {
        alert(banCheck.message);
        return;
    }
    if (containsSwearWords(textContent)) {
        await handleUserStrike(currentUser, textContent);
        inputField.value = "";
        return; 
    }
    const wasApology = await checkAndProcessApology(currentUser, textContent);
    if (wasApology) {
        inputField.value = "";
        return;
    }
    const { error } = await supabase_db.from('notice_board').insert([{
        username: currentUser,
        notice_text: textContent,
        board_type: boardType
    }]);
    if (!error) {
        inputField.value = "";
        fetchNoticeBoardRecords();
    } else {
        alert("Notice save failed: " + error.message);
    }
}

function syncDrawerName() {
    const currentName = usernameInput.value.trim();
    regNameInput.value = currentName;
    reminderHintDisplay.style.display = "none";
    if (profilesCache[currentName]) {
        lockStatusBtn.innerText = "🔒";
        drawerTitle.innerText = "Name is Secured: Log In";
        regReminderInput.style.display = "none";
        regEmailInput.style.display = "none";
        drawerSubmitBtn.innerText = "Authorize Device Local Memory";
    } else {
        lockStatusBtn.innerText = "🔓";
        drawerTitle.innerText = "Secure Current Handle";
        regReminderInput.style.display = "block";
        regEmailInput.style.display = "block";
        drawerSubmitBtn.innerText = "Lock Name Globally";
    }
    if (isNoticeBoardActive) evaluateNoticeBoardForms();
}

async function toggleSecurityDrawer() {
    if (securityDrawer.classList.toggle('open')) {
        syncDrawerName();
        regPasskeyInput.focus();
    }
}

async function handleSecuritySubmit() {
    const currentName = usernameInput.value.trim();
    const passkey = regPasskeyInput.value.trim();
    const reminder = regReminderInput.value.trim();
    const email = regEmailInput.value.trim();
    if (!currentName || !passkey) {
        alert("Please fill in both Name and a Passkey string.");
        return;
    }
    if (profilesCache[currentName]) {
        if (profilesCache[currentName].passkey === passkey) {
            localStorage.setItem('tellstream_key_' + currentName, passkey);
            localStorage.setItem('tellstream_saved_username', currentName);
            alert("Identity checked and authorized!");
            securityDrawer.classList.remove('open');
            chatBox.innerHTML = ""; 
            if (isNoticeBoardActive) evaluateNoticeBoardForms();
            loadMessages();
        } else {
            alert("Invalid Passkey entry sequence.");
            if (profilesCache[currentName].key_reminder) {
                reminderHintDisplay.innerText = "Hint Clue: " + profilesCache[currentName].key_reminder;
                reminderHintDisplay.style.display = "block";
            }
        }
    } else {
        let assignedLevel = 0;
        let assignedHover = "Tella Fambily";
        if (currentName === "Banton") { assignedLevel = 2; assignedHover = "banton.org"; }
        else if (currentName === "BIG JOHN NEW000") { assignedLevel = 2; assignedHover = "the boss"; }
        else if (currentName === "Perfection") { assignedLevel = 2; assignedHover = "You done know"; }
        const { error } = await supabase_db.from('secured_profiles').insert([{
            username: currentName,
            passkey: passkey,
            key_reminder: reminder,
            email: email,
            power_level: assignedLevel,
            hover_title: assignedHover
        }]);
        if (error) {
            alert("Could not claim this name block profile target.");
        } else {
            localStorage.setItem('tellstream_key_' + currentName, passkey);
            localStorage.setItem('tellstream_saved_username', currentName);
            alert("Registration complete!");
            await syncProfilesMap();
            securityDrawer.classList.remove('open');
            chatBox.innerHTML = "";
            if (isNoticeBoardActive) evaluateNoticeBoardForms();
            loadMessages();
        }
    }
}

async function syncProfilesMap() {
    const { data } = await supabase_db.from('secured_profiles').select('*');
    profilesCache = {};
    if (data) data.forEach(p => { profilesCache[p.username] = p; });
    syncDrawerName();
}

async function syncBannedWordsMap() {
    const { data } = await supabase_db.from('banned_words').select('word');
    if (data) bannedWordsCache = data.map(item => item.word.toLowerCase());
}

async function syncBannedUsersMap() {
    const { data } = await supabase_db.from('banned_users').select('*');
    bannedUsersCache = {};
    if (data) {
        data.forEach(u => {
            bannedUsersCache[u.username.toLowerCase()] = u;
        });
    }
}

audioPlayer.addEventListener('stalled', () => { recoverStream(); });
audioPlayer.addEventListener('error', () => { recoverStream(); });

function recoverStream() {
    const currentSrc = audioPlayer.src;
    if (!currentSrc) return;
    audioPlayer.src = "";
    audioPlayer.load();
    audioPlayer.src = currentSrc;
    audioPlayer.play().catch(err => console.log(err));
}

function appendMessage(data) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg';
    let messageContent = escapeHTML(data.message);
    messageContent = messageContent.replace(/:([a-zA-Z0-9_-]+):/g, (match, code) => {
        const lowerCode = code.toLowerCase();
        if (window.emojiMapping && window.emojiMapping[lowerCode]) {
            return `<img src="${imgBaseUrl}${window.emojiMapping[lowerCode]}" alt="${code}" style="max-height: 48px; vertical-align: middle; margin: 2px; border-radius: 4px;">`;
        }
        return match;
    });
    const profile = profilesCache[data.username];
    let nameClass = "user-unregistered";
    let hoverAttribute = "";
    if (profile) {
        nameClass = (profile.power_level >= 1) ? "user-admin" : "user-registered";
        if (profile.hover_title) hoverAttribute = `title="${escapeHTML(profile.hover_title)}"`;
    }
    msgDiv.innerHTML = `<div class="user ${nameClass}" ${hoverAttribute}>${escapeHTML(data.username)}</div><div>${messageContent}</div>`;
    chatBox.appendChild(msgDiv);
    anchorChatToBottom();
    while (chatBox.children.length > 50) chatBox.removeChild(chatBox.firstChild);
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

async function loadMessages() {
    const { data } = await supabase_db.from('messages').select('*').order('id', { ascending: true }).limit(40);
    if (data) { data.forEach(appendMessage); anchorChatToBottom(); }
}

supabase_db.channel('public:messages').on('postgres_changes', { event: 'INSERT', pattern: 'public', table: 'messages' }, payload => { appendMessage(payload.new); }).subscribe();
supabase_db.channel('public:secured_profiles').on('postgres_changes', { event: '*', pattern: 'public', table: 'secured_profiles' }, async () => { await syncProfilesMap(); }).subscribe();
supabase_db.channel('public:notice_board').on('postgres_changes', { event: 'INSERT', pattern: 'public', table: 'notice_board' }, payload => { if (isNoticeBoardActive) fetchNoticeBoardRecords(); }).subscribe();
supabase_db.channel('public:banned_words').on('postgres_changes', { event: '*', pattern: 'public', table: 'banned_words' }, async () => { await syncBannedWordsMap(); }).subscribe();
supabase_db.channel('public:banned_users').on('postgres_changes', { event: '*', pattern: 'public', table: 'banned_users' }, async () => { await syncBannedUsersMap(); }).subscribe();

async function sendMessage() {
    const user = usernameInput.value.trim() || 'Listener';
    let text = messageInput.value.trim();
    if (!text) return;
    if (text.startsWith('/')) {
        const profile = profilesCache[user];
        if (profile && parseInt(profile.power_level || 0) >= 1) { 
            messageInput.value = '';
            await handleAdminFilterCommand(text);
            return;
        }
    }
    if (profilesCache[user]) {
        if (localStorage.getItem('tellstream_key_' + user) !== profilesCache[user].passkey) {
            alert("This handle name has been secured! Please unlock the identity box.");
            toggleSecurityDrawer();
            return;
        }
    }
    const banCheck = checkBanStatus(user);
    if (banCheck.isBanned) {
        alert(banCheck.message);
        return;
    }
    if (containsSwearWords(text)) {
        messageInput.value = '';
        await handleUserStrike(user, text);
        return; 
    }
    const wasApology = await checkAndProcessApology(user, text);
    if (wasApology) {
        messageInput.value = '';
        return;
    }
    messageInput.value = '';
    await supabase_db.from('messages').insert([{ username: user, message: text }]);
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });

(async function initSystem() {
    renderFacebookFeed();
    renderActiveFlyers();
    renderHelpContent(false);
    setTimeout(initQuickEmojiCloud, 500);
    
    // Header Identity Polling
    updateHeaderIdentity();
    setInterval(updateHeaderIdentity, 60000);

    await syncProfilesMap();
    await syncBannedWordsMap();
    await syncBannedUsersMap();
    await loadMessages();
    
    const currentUser = usernameInput.value.trim();
    syncDrawerName();

    setTimeout(() => {
        const profile = profilesCache[currentUser];
        const authorizedKey = localStorage.getItem('tellstream_key_' + currentUser);
        const isLoggedIn = profile && profile.passkey === authorizedKey;
        const mainBody = "Greetings and welcome to Tellstream Chat. Please help keep this experience a positive blessing for one and all. Remember, at any time, users may have children around them. Bad blessings will be removed. One love from Tellstream.";
        if (isLoggedIn) {
            const prefix = `Welcome back ${currentUser}, we are blessed you are here. Please continue to fulljoy the vibes. `;
            const lastSeenKey = `tellstream_greeting_${currentUser.toLowerCase()}`;
            const lastSeenDate = localStorage.getItem(lastSeenKey);
            const todayDateStr = new Date().toDateString();
            if (lastSeenDate === todayDateStr) {
                appendPrivateWelcomeGreeting(prefix);
            } else {
                appendPrivateWelcomeGreeting(prefix + mainBody);
                localStorage.setItem(lastSeenKey, todayDateStr);
            }
        } else {
            appendPrivateWelcomeGreeting(mainBody);
        }
    }, 200);
})();
