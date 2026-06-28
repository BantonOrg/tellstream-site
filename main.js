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
let isNoticeBoardActive = false;

const facebookPosts = [
    { id: 1, date: "Just now", text: "Big John is locked and loaded live in the studio! Lock into tellstream.banton.org right now and fire up the lounge chat! 🎚️🔥", link: "https://www.facebook.com/tellstream.dem" },
    { id: 2, date: "Yesterday", text: "Big respect to all the listeners locking in from around the globe. Drop your shoutouts and tell-a-wheel selectors directly inside the main chat line! 🔊🎧", link: "https://www.facebook.com/tellstream.dem" },
    { id: 3, date: "2 days ago", text: "Weekend scheduling updates coming soon. Keep your locked eyes locked onto the central flyer board for upcoming live dance clashes.", link: "https://www.facebook.com/tellstream.dem" }
];

const helpInstructions = [
    { title: "Setting Nickname", text: "Fill in the Nickname block before typing to claim your handle in the Lounge panel." },
    { title: "Sending Text Lines", text: "Type your query inside the input field box and tap Send or hit your keyboard Enter button." },
    { title: "Firing Emojis & Sounds", text: "Tap any active shorthand key code block inside the selection layout panel below to append it to your message. Click [See All Codes] for more." }
];

const noticeboardHelpInstructions = [
    { title: "Noticeboard Rules", text: "Stay respectful. Unauthorized or hostile comments will be flagged and removed instantly." },
    { title: "Authority Levels", text: "The Boss panel is restricted to Station Admins. Selectors manage the central schedule log." },
    { title: "Adding Updates", text: "Once verified via your secure local passkey profile drawer, choose a column target form to submit notifications directly." }
];

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
    if (fsTitleNode && fsTitleNode.classList.contains('col-title')) {
        fsTitleNode.innerHTML = currentTitle;
    }
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
    if (isNoticeBoardActive) {
        toggleNoticeBoardView();
    }
    const isFullscreen = document.body.classList.toggle('chat-is-fullscreen');
    fsToggleBtn.innerText = isFullscreen ? "Exit Fullscreen" : "Maximize Chat";
    chatBox.scrollTop = chatBox.scrollHeight;
}

function initQuickEmojiCloud() {
    if (!window.emojiMapping) return;
    const items = Object.keys(window.emojiMapping);
    
    const html = items.slice(0, 32).map(key => `
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
    const emojiSectionFS = quickEmojiListFS.parentElement; // Finds the emoji wrap panel

    if (!isNoticeBoardActive) {
        document.body.classList.add('chat-is-fullscreen');
        
        streamChat.style.display = 'none';
        inputContainer.style.display = 'none'; 
        securityDrawer.classList.remove('open'); 
        noticePanel.style.display = 'flex';
        mainTitle.innerText = "📋 Noticeboard";
        toggleBtn.innerText = "❌ Exit Noticeboard";
        isNoticeBoardActive = true;
        
        // Hide the emoji block completely on fullscreen noticeboard view
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
        
        // Restore the emoji block when returning to lounge chat
        if (emojiSectionFS) emojiSectionFS.style.display = 'block';
        
        renderHelpContent(false);
        chatBox.scrollTop = chatBox.scrollHeight;
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
    const { data: records, error } = await supabase_db
        .from('notice_board')
        .select('*')
        .order('created_at', { ascending: false });

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
    const textContent = inputField.value.trim();
    
    if (!textContent) return;

    const profile = profilesCache[currentUser];
    const authorizedKey = localStorage.getItem('tellstream_key_' + currentUser);
    if (!profile || profile.passkey !== authorizedKey) return;

    const pLevel = parseInt(profile.power_level || 0);
    if (boardType === 'boss' && pLevel < 2) return;
    if (boardType === 'selectors' && pLevel < 1) return;

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
    const isOpen = securityDrawer.classList.toggle('open');
    if (isOpen) {
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
            alert("Identity checked and authorized! Locked to this device memory successfully.");
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

        if (currentName === "Banton") {
            assignedLevel = 2;
            assignedHover = "banton.org";
        } else if (currentName === "BIG JOHN NEW000") {
            assignedLevel = 2;
            assignedHover = "the boss";
        } else if (currentName === "Perfection") {
            assignedLevel = 2;
            assignedHover = "You done know";
        }

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
            alert("Registration complete! Handle status successfully upgraded.");
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
    if (data) {
        data.forEach(p => {
            profilesCache[p.username] = p;
        });
    }
    syncDrawerName();
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

    const codeRegex = /:([a-zA-Z0-9_-]+):/g;
    messageContent = messageContent.replace(codeRegex, (match, code) => {
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
        if (profile.power_level >= 1) {
            nameClass = "user-admin"; 
        } else {
            nameClass = "user-registered"; 
        }
        if (profile.hover_title) {
            hoverAttribute = `title="${escapeHTML(profile.hover_title)}"`;
        }
    }

    msgDiv.innerHTML = `<div class="user ${nameClass}" ${hoverAttribute}>${escapeHTML(data.username)}</div><div>${messageContent}</div>`;
    chatBox.appendChild(msgDiv);
    if (!isNoticeBoardActive) chatBox.scrollTop = chatBox.scrollHeight;
    
    while (chatBox.children.length > 50) {
        chatBox.removeChild(chatBox.firstChild);
    }
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

async function loadMessages() {
    const { data } = await supabase_db.from('messages').select('*').order('id', { ascending: true }).limit(40);
    if (data) data.forEach(appendMessage);
}

supabase_db.channel('public:messages')
    .on('postgres_changes', { event: 'INSERT', pattern: 'public', table: 'messages' }, payload => {
        appendMessage(payload.new);
    }).subscribe();

supabase_db.channel('public:secured_profiles')
    .on('postgres_changes', { event: '*', pattern: 'public', table: 'secured_profiles' }, async () => {
        await syncProfilesMap();
    }).subscribe();

supabase_db.channel('public:notice_board')
    .on('postgres_changes', { event: 'INSERT', pattern: 'public', table: 'notice_board' }, payload => {
        if (isNoticeBoardActive) fetchNoticeBoardRecords();
    }).subscribe();

async function sendMessage() {
    const user = usernameInput.value.trim() || 'Listener';
    const text = messageInput.value.trim();
    if (!text) return;

    if (profilesCache[user]) {
        const authorizedKey = localStorage.getItem('tellstream_key_' + user);
        if (profilesCache[user].passkey !== authorizedKey) {
            alert("This handle name has been secured! Please open the identity panel lock box to authorize this machine device layout.");
            toggleSecurityDrawer();
            return;
        }
    }

    messageInput.value = '';
    await supabase_db.from('messages').insert([{ username: user, message: text }]);
}

sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => { 
    if (e.key === 'Enter' && !e.shiftKey) { 
        e.preventDefault(); 
        sendMessage(); 
    } 
});

(async function initSystem() {
    renderFacebookFeed();
    renderActiveFlyers();
    renderHelpContent(false);
    setTimeout(initQuickEmojiCloud, 500);
    await syncProfilesMap();
    loadMessages();
})();
