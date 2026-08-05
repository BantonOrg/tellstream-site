const SUPABASE_URL = "https://vegwferwmyuunwvfqpsf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZ3dmZXJ3bXl1dW53dmZxcHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzODU5NDQsImV4cCI6MjA5Nzk2MTk0NH0.7F3HUEY59BGE5phlD9AukhZzRa3Ied_ZT43j8YZeIy8";
const supabase_db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let isCurrentUserVerified = false;

const chatBox = document.getElementById('chatBox');
const usernameInput = document.getElementById('usernameInput');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const audioPlayer = document.getElementById('radioPlayer');
const flyerContainer = document.getElementById('flyerContainer');
const timetableContainer = document.getElementById('timetableContainer');
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

const imgBaseUrl = "src/assets/smilies/";

let profilesCache = {};
let bannedWordsCache = [];
let bannedUsersCache = {};
let isNoticeBoardActive = false;

let pendingLogoTargetName = "";
let pendingFlyerTargetName = "";

let currentChatMode = 'lounge';
let activeDMTabs = [];
let presenceTracker = null;
let onlineUsers = {};
let relationshipMap = {};
let myProfile = null;
let activePrivateSub = null;

const helpInstructions = [
    { title: "Choose a Temporary Chat Name", text: "Before you start chatting, enter your name in the \"Chat Name\" box at the bottom right of the sidebar. This sets your temporary identity for the duration of your chat session. Close or reload the page, and the name can be claimed by anyone else unless you lock it permanently." },
    { title: "Securing Your Chat Name (Locking Names)", text: "Click the padlock button or chat name block to open the profile drawer. Enter a secret Passkey, a key reminder hint, and a recovery Email. Once locked, no one else can chat using your chat name without entering your passkey." },
    { title: "Chatting", text: "Simply type your message in the chat input box and press \"Enter\" on your keyboard (or click the \"Send\" button)." },
    { title: "Emojis & Sounds", text: "Click any emoji box underneath the chat to quickly add it to your message. Click the [See All Codes] link to open the full library of emojis." },
    { title: "Swearing & Strike Rules", text: "Swearing and bad language are automatically blocked and tracked:\n- 3 Strikes: You will be locked out of the chat for 24 hours.\n- 4+ Strikes: You will be permanently banned.\n- Apologizing: If you have strikes, type the word \"sorry\" in the chat to remove 1 strike (limited to once per day)." },
    { title: "Managing Profiles, Fambily & Blocks", text: "Inside your profile drawer, use the tabs to:\n- Profile: Upload a profile picture (max 500KB), add your location/socials, and write a bio. You can set visibility to Public/Fambily-Only, or hide your status (invisible mode).\n- Fambily & Requests: Add friends to your Fambily list to chat privately, and manage incoming/outgoing requests.\n- Blocked: Block or unblock users if they are bothering you." },
    { title: "Noticeboard View Notice", text: "When you open the Noticeboard, the Lounge Chat panel and chat input field are completely hidden. You cannot chat or view active messages while the Noticeboard is open. You must close the Noticeboard to return to the chat." }
];

const noticeboardHelpInstructions = [
    { title: "Noticeboard Rules", text: "Keep all posts friendly, helpful, and respectful. Station Admins will immediately delete any abusive or hostile noticeboard posts." },
    { title: "Posting to the Noticeboard (Listeners)", text: "Once verified with your passkey in the profile drawer, you can post updates to the board. As a listener, your posts are restricted to the \"Fambily\" column, so you do not need to specify a target column—it defaults to Fambily automatically." },
    { title: "Noticeboard Bans", text: "Posting swearing or blocked words on the noticeboard will increase your strikes, leading to temporary or permanent bans, just like in the chat." }
];

const djHelpInstructions = [
    { title: "⚠️ Important Advice", text: "If you are not sure how to use these commands, please ask management or another admin for help first. It is very simple once you know how, but typing the wrong command can mess up the schedule." },
    { title: "📝 Command Format Guidelines", text: "Dates: Must be numbers only (exactly 6 digits). E.g., 10th July 2026 is 100726.\nTimes: Must be numbers only (exactly 4 digits in 24-hour format). E.g., 8:00 PM is 2000.\nPresenter Names: If specifying a different DJ, separate it at the end with a single space." },
    { title: "🎙️ Going On-Air (Live)", text: "Type: /show live\nWhat it does: Updates the banner to show your name and logo live on air." },
    { title: "🔄 Going Off-Air (Autopilot)", text: "Type: /show tellstream\nWhat it does: Resets the stream banner to autopilot when you finish your broadcast. Only type this if you are the last presenter of the day." },
    { title: "🚨 One-Off / Temporary Show", text: "Type: /schedule temp [DDMMYY] [24-Hour Start] [24-Hour End] [TimeZone] [optional: Presenter Name]\nExample: /schedule temp 100726 2000 2200 BST Cruss\nWhat it does: Adds a one-time show slot for a specific date (defaults to you if name is left blank)." },
    { title: "📋 Posting to the Noticeboard (DJs)", text: "DJs/Presenters can post noticeboard updates in 2 columns: \"Selectors\" and \"Fambily\". You must specify which of these columns you want your post to appear in when submitting." },
    { title: "⚔️ Word Filter Moderation", text: "Type: /add [word] to block a word.\nType: /del [word] to unblock a word.\nType: /listwords to see currently blocked words." }
];

const adminHelpInstructions = [
    { title: "👑 Station Admin Rules (Level 2)", text: "Station Admins (Level 2) have full control over the website. They can upload logos, manage event flyers, promote users, edit the filter, and unban players." },
    { title: "🗓️ Permanent Timetable Slot", text: "Type: /schedule perm [Day] [24-Hour Start] [24-Hour End] [TimeZone] [optional: Presenter Name]\nExample: /schedule perm Friday 2000 2200 BST Cruss\nWhat it does: Sets a repeating weekly show slot in the schedule (defaults to you if name is left blank)." },
    { title: "❌ Cancelling a Scheduled Show", text: "Type: /schedule cancel [DDMMYY] [24-Hour Start]\nExample: /schedule cancel 100726 2000\nWhat it does: Removes a permanent or temporary show from the schedule." },
    { title: "📋 Posting to the Noticeboard (Admins)", text: "Station Admins can post updates to all 3 columns: \"Boss\", \"Selectors\", and \"Fambily\". You must specify which of these columns your post should appear in before submitting." },
    { title: "🖼️ Presenter Logo Management", text: "Type: /upload [Presenter Name] - Opens a file picker to upload a transparent PNG logo.\nType: /delete [Presenter Name] - Removes a presenter's logo from storage." },
    { title: "🔥 Event Flyer Management", text: "Type: /uploadflyer [DDMMYY] [Name] - Opens a file picker to upload a flyer image. Note: The name MUST start with the 6-digit date (DDMMYY) followed by a space and the flyer name.\nType: /deleteflyer [DDMMYY] [Name] - Removes a flyer image from storage." },
    { title: "👑 User Role Management (Set Level)", text: "Type: /setlevel [username] [Level] - Sets the access level for a registered user. Levels are: 0 (Normal User), 1 (DJ Selector), or 2 (Station Admin)." },
    { title: "⚔️ Blocklist & Profanity Management", text: "Type: /add [word] - Adds a bad word to the blocked list.\nType: /del [word] - Removes a word from the blocked list.\nType: /listwords - Lists all currently blocked words." },
    { title: "🚫 Unbanning Users", text: "Type: /unban [username]\nWhat it does: Clears all strikes and restores chat/noticeboard access instantly for locked or banned users." }
];

// CELL-LEFT ISOLATED ENGINE (DYNAMIC BOUNDS & AUTOMATED MODE SWITCH)
function renderStreamHeader(showName) {
    const cellLeft = document.querySelector('.cell-left');
    const wrapper = document.querySelector('.cell-left .tagline-wrapper');
    if (!cellLeft) return;

    let display = document.getElementById('stream-name-display');
    let logoImg = document.getElementById('stream-logo-display');

    // 1. Structural Setup: Build components if they don't exist yet
    if (!logoImg) {
        logoImg = document.createElement('img');
        logoImg.id = 'stream-logo-display';
        logoImg.style.width = '100%';
        logoImg.style.height = 'auto'; // Fluid scaling allows image aspect ratio to dictate cell height
        logoImg.style.display = 'none';
        cellLeft.appendChild(logoImg);
    }

    if (!display) {
        display = document.createElement('p');
        display.id = 'stream-name-display';
        display.style.fontFamily = "'Orbitron', sans-serif";
        display.style.color = '#ffffff';
        display.style.fontSize = '1.25rem';
        display.style.fontWeight = '900'; // Changed from 'bold' to ultra-heavy '900'
        display.style.webkitTextStroke = '1.2px #000000'; // Thickened black outline edge definition
        display.style.textShadow = '0 2px 4px #000000, 0 4px 10px rgba(0, 0, 0, 0.95), 0 0 15px rgba(0, 0, 0, 0.9)';
        display.style.textTransform = 'uppercase';
        display.style.lineHeight = '1.2';
        display.style.maxWidth = '95%';
        display.style.textAlign = 'center';
        cellLeft.appendChild(display);
    }

    if (showName) {
        const cleanName = showName.trim();
        const safeFileName = cleanName.toLowerCase().replace(/\s+/g, '_') + '.png';

        const { data } = supabase_db.storage.from('dj-logos').getPublicUrl(safeFileName);
        const imgCloudUrl = data.publicUrl + '?v=' + Date.now();

        const imageProbe = new Image();

        imageProbe.onload = function () {
            // STATE B: IMAGE FOUND -> Switch to image-driven physics matching the middle cell
            if (wrapper) {
                wrapper.querySelectorAll('h1, p').forEach(el => el.style.display = 'none');
            }

            // Strip text absolute constraints; let the natural image flow control the container height
            cellLeft.style.position = 'relative';
            cellLeft.style.height = 'auto';

            logoImg.src = imgCloudUrl;
            logoImg.style.position = 'relative'; // Removes absolute locking
            logoImg.style.display = 'block';

            // Pin text overlay absolutely over the natural fluid image background
            display.style.position = 'absolute';
            display.style.left = '50%';
            display.style.transform = 'translateX(-50%)';
            display.style.width = '100%';
            display.style.bottom = '12px';
            display.style.zIndex = '9999';

            if (cleanName.toLowerCase() === 'tellstream') {
                display.innerText = "TELLSTREAM NON STOP";
            } else {
                display.innerText = `${cleanName} - LIVE`;
            }
        };

        imageProbe.onerror = function () {
            // STATE A: NO IMAGE FOUND -> Fallback completely to structural text parameters
            logoImg.style.display = 'none';
            logoImg.style.position = 'absolute';

            cellLeft.style.height = ''; // Clear forced rules, return to base CSS flow

            if (wrapper) {
                wrapper.querySelectorAll('h1, p').forEach(el => el.style.display = 'block');
                if (display.parentElement !== wrapper) {
                    wrapper.appendChild(display);
                }
                // Normalize text behavior for normal text boxes
                display.style.position = 'static';
                display.style.transform = 'none';
                display.style.marginTop = '4px';
                display.style.width = 'auto';
                display.style.textAlign = 'left';
                display.style.zIndex = 'auto';
            }

            if (cleanName.toLowerCase() === 'tellstream') {
                display.innerText = "TELLSTREAM NONE STOP";
            } else {
                display.innerText = `${cleanName} - LIVE`;
            }
        };

        imageProbe.src = imgCloudUrl; // Set source last to avoid race conditions
    }
}

async function updateDatabaseStreamStatus(showName) {
    try {
        await supabase_db.from('stream_status').upsert([{ id: 1, current_show: showName }]);
    } catch (err) {
        console.error("Database stream status write execution failed:", err);
    }
}

async function loadInitialStreamStatus() {
    try {
        const { data, error } = await supabase_db.from('stream_status').select('current_show').eq('id', 1).single();
        if (!error && data) {
            renderStreamHeader(data.current_show);
        }
    } catch (err) {
        console.error("Failed loading baseline header stream text state parameter:", err);
    }
}

if (usernameInput) {
    const savedName = localStorage.getItem('tellstream_saved_username');
    if (savedName) usernameInput.value = savedName;

    let verificationTimeout = null;
    usernameInput.addEventListener('input', () => {
        localStorage.setItem('tellstream_saved_username', usernameInput.value.trim());
        syncDrawerName();

        clearTimeout(verificationTimeout);
        verificationTimeout = setTimeout(async () => {
            await verifyCurrentSession();
            if (isNoticeBoardActive) evaluateNoticeBoardForms();
            renderHelpContent(isNoticeBoardActive);
        }, 500);
    });
}

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
            const pLevel = parseInt(profile.power_level || 0);
            if (pLevel >= 2) {
                nameClass = "user-admin";
            } else if (pLevel === 1) {
                nameClass = "user-selector";
            } else {
                nameClass = "user-registered";
            }
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

async function handleSetLevelCommand(text) {
    const rawBody = text.substring(9).trim(); // length of "/setlevel "
    if (!rawBody) {
        alert("Usage:\n/setlevel [username] [level]\n(0 = Listener, 1 = DJ Selector, 2 = Station Admin)");
        return;
    }

    const lastSpaceIndex = rawBody.lastIndexOf(' ');
    if (lastSpaceIndex === -1) {
        alert("Usage:\n/setlevel [username] [level]\n(0 = Listener, 1 = DJ Selector, 2 = Station Admin)");
        return;
    }

    const targetUsername = rawBody.substring(0, lastSpaceIndex).trim();
    const targetLevelStr = rawBody.substring(lastSpaceIndex + 1).trim();
    const targetLevel = parseInt(targetLevelStr);

    if (isNaN(targetLevel) || targetLevel < 0 || targetLevel > 2) {
        alert("Invalid level. /setlevel target level must be 0 (Listener), 1 (DJ Selector), or 2 (Station Admin).");
        return;
    }

    const targetProfile = Object.values(profilesCache).find(p => p.username.toLowerCase() === targetUsername.toLowerCase());
    if (!targetProfile) {
        alert(`User "${targetUsername}" does not have a secured profile (not registered).`);
        return;
    }

    let newHoverTitle = "Tella Fambily";
    if (targetLevel === 2) {
        newHoverTitle = "Station Admin";
    } else if (targetLevel === 1) {
        newHoverTitle = "DJ Selector";
    }

    const adminUser = localStorage.getItem('tellstream_saved_username') || "";
    const adminPasskey = localStorage.getItem('tellstream_key_' + adminUser) || "";
    try {
        const { error } = await supabase_db.rpc('secure_promote_demote', {
            p_admin_username: adminUser,
            p_admin_passkey: adminPasskey,
            p_target_username: targetProfile.username,
            p_target_level: targetLevel,
            p_new_hover_title: newHoverTitle
        });

        if (error) throw error;
        alert(`Success: "${targetProfile.username}" has been set to Level ${targetLevel} (${newHoverTitle}).`);
    } catch (err) {
        alert("Database Update Failure: " + err.message);
    }
}

async function renderSiteNewsFeed() {
    const ticker = document.getElementById('newsTickerContent');
    if (!ticker) return;
    try {
        // Fetch the single newest record from the notice_board (either boss or selectors)
        const { data: records, error } = await supabase_db
            .from('notice_board')
            .select('*')
            .in('board_type', ['boss', 'selectors'])
            .order('created_at', { ascending: false })
            .limit(1);

        if (error || !records || records.length === 0) {
            ticker.innerText = "Welcome to Tellstream Lounge! | Enjoy the music and chat | No current announcements posted.";
            return;
        }

        const item = records[0];
        const isBoss = item.board_type === 'boss';
        const prefix = isBoss ? "👑 ADMIN NOTICE" : "🎙️ DJ BULLETIN";

        // Flatten text for horizontal marquee scrolling
        const flatNotice = item.notice_text.replace(/\s+/g, ' ').trim();
        ticker.innerText = `🔥 ${prefix} (${item.username}): ${flatNotice} ★★★ Welcome to the Lounge! Enjoy the great vibes all day every day! ★★★`;
    } catch (e) { console.error("Error rendering site news:", e); }
}

async function renderActiveFlyers() {
    const today = new Date();
    today.setDate(today.getDate() - 1);
    today.setHours(0, 0, 0, 0);

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

function toggleAccordion(target) {
    // Accordion styling removed in favor of static column structures
}

function renderHelpContent(useNoticeboardGuide = false) {
    const activeDataset = useNoticeboardGuide ? noticeboardHelpInstructions : helpInstructions;
    let html = activeDataset.map(item => `
        <div class="help-item-card">
            <h5>${item.title}</h5>
            <p>${item.text}</p>
        </div>
    `).join('');

    const currentUser = usernameInput.value.trim();
    const profile = profilesCache[currentUser];
    const savedUser = localStorage.getItem('tellstream_saved_username');
    const isVerified = profile && isCurrentUserVerified && currentUser === savedUser;

    const powerLevel = isVerified ? parseInt(profile.power_level || 0) : 0;
    const isVerifiedDJ = powerLevel >= 1;
    const isVerifiedAdmin = powerLevel >= 2;

    if (isVerifiedDJ && !useNoticeboardGuide) {
        const djHtml = djHelpInstructions.map(item => `
            <div class="help-item-card" style="border-left: 4px solid #ffdd1a; background: rgba(255, 221, 26, 0.05);">
                <h5 style="color: #ffdd1a; font-weight: bold;">${item.title}</h5>
                <p style="color: #fffbdf; white-space: pre-line;">${item.text}</p>
            </div>
        `).join('');
        html = djHtml + html;
    }

    if (isVerifiedAdmin && !useNoticeboardGuide) {
        const adminHtml = adminHelpInstructions.map(item => `
            <div class="help-item-card" style="border-left: 4px solid #ff3333; background: rgba(255, 51, 51, 0.05);">
                <h5 style="color: #ff3333; font-weight: bold;">${item.title}</h5>
                <p style="color: #fffbdf; white-space: pre-line;">${item.text}</p>
            </div>
        `).join('');
        html = adminHtml + html;
    }

    helpCardsContainer.innerHTML = html;
    helpCardsContainerFS.innerHTML = html;
    const currentTitle = useNoticeboardGuide ? "📋 Noticeboard Help Guide" : "💡 Chat help and emoji codes";
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
    const fsToggleBtn = document.getElementById('fsToggleBtn');
    if (fsToggleBtn) {
        fsToggleBtn.innerText = document.body.classList.contains('chat-is-fullscreen') ? "Exit Fullscreen" : "Maximize Chat";
    }
    const tabMaximize = document.getElementById('tab-maximize');
    if (tabMaximize) {
        tabMaximize.innerText = document.body.classList.contains('chat-is-fullscreen') ? "Exit Fullscreen" : "Maximize Chat";
    }
    anchorChatToBottom();
}

function initQuickEmojiCloud() {
    if (!window.emojiMapping) return;

    // 1. Get all available emoji shorthand keys from your mapping file
    const allKeys = Object.keys(window.emojiMapping);

    // 2. Shuffle the entire array randomly
    const shuffledKeys = allKeys.sort(() => 0.5 - Math.random());

    // 3. Take the first 32 random keys out of the shuffled deck
    const randomSelection = shuffledKeys.slice(0, 32);

    // 4. Render the grid items
    const html = randomSelection.map(key => `
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
    const gamesRow = document.getElementById('headerGamesRow');

    if (!isNoticeBoardActive) {
        document.body.classList.add('chat-is-fullscreen');
        document.body.classList.add('noticeboard-active');
        securityDrawer.classList.remove('open');
        noticePanel.style.display = 'flex';
        if (mainTitle) {
            mainTitle.innerText = "📋 Noticeboard";
            mainTitle.style.display = 'block';
        }
        // Mockup: Keep games row visible
        if (gamesRow) {
            gamesRow.style.display = 'flex';
        }
        if (toggleBtn) {
            toggleBtn.innerText = "❌ Exit Noticeboard";
        }
        isNoticeBoardActive = true;
        if (emojiSectionFS) emojiSectionFS.style.display = 'block';
        renderHelpContent(true);
        evaluateNoticeBoardForms();
        fetchNoticeBoardRecords();
    } else {
        document.body.classList.remove('chat-is-fullscreen');
        document.body.classList.remove('noticeboard-active');
        noticePanel.style.display = 'none';
        if (mainTitle) {
            mainTitle.style.display = 'none';
        }
        if (gamesRow) {
            gamesRow.style.display = 'flex';
        }
        if (toggleBtn) {
            toggleBtn.innerText = "📋 Noticeboard";
        }
        isNoticeBoardActive = false;
        if (emojiSectionFS) emojiSectionFS.style.display = 'block';
        renderHelpContent(false);
        anchorChatToBottom();
    }
}

// Setup cross-tab BroadcastChannel for remote radio controls
const radioChannel = new BroadcastChannel('tellstream_radio_control');

const customPlayBtn = document.getElementById('player-play-btn');
const customVolSlider = document.getElementById('player-volume-slider');

function updatePlayerUI(player) {
    if (customPlayBtn) {
        customPlayBtn.innerText = player.paused ? '▶️' : '⏸️';
    }
    if (customVolSlider) {
        customVolSlider.value = player.volume;
    }
}

if (customPlayBtn) {
    customPlayBtn.addEventListener('click', () => {
        const player = document.getElementById('radioPlayer');
        if (!player) return;
        if (player.paused) {
            if (!player.src || player.src === window.location.href || !player.src.includes('radio.mp3')) {
                player.src = "https://a3.asurahosting.com/listen/tellstream/radio.mp3";
            }
            player.load();
            player.play().catch(e => console.log("Play blocked:", e));
        } else {
            player.pause();
            player.removeAttribute('src');
            player.load();
        }
    });
}

if (customVolSlider) {
    customVolSlider.addEventListener('input', (e) => {
        const player = document.getElementById('radioPlayer');
        if (!player) return;
        player.volume = parseFloat(e.target.value);
    });
}

radioChannel.onmessage = (event) => {
    const player = document.getElementById('radioPlayer');
    if (!player) return;

    if (event.data.action === 'play') {
        if (!player.src || player.src === window.location.href || !player.src.includes('radio.mp3')) {
            player.src = "https://a3.asurahosting.com/listen/tellstream/radio.mp3";
            player.load();
        }
        player.play().catch(e => console.log("Play blocked:", e));
    } else if (event.data.action === 'pause') {
        player.pause();
        player.removeAttribute('src');
        player.load();
    } else if (event.data.action === 'volume') {
        player.volume = event.data.value;
    } else if (event.data.action === 'ping') {
        radioChannel.postMessage({
            action: 'pong',
            state: (player.paused || !player.src || !player.src.includes('radio.mp3')) ? 'paused' : 'playing',
            volume: player.volume
        });
    }
};

// Sync player state changes back to game tabs and update custom UI
setTimeout(() => {
    const player = document.getElementById('radioPlayer');
    if (player) {
        updatePlayerUI(player);

        player.addEventListener('play', () => {
            updatePlayerUI(player);
            radioChannel.postMessage({ state: 'playing', volume: player.volume });
        });
        player.addEventListener('pause', () => {
            updatePlayerUI(player);
            radioChannel.postMessage({ state: 'paused', volume: player.volume });
        });
        player.addEventListener('volumechange', () => {
            updatePlayerUI(player);
            radioChannel.postMessage({ state: (player.paused || !player.src || !player.src.includes('radio.mp3')) ? 'paused' : 'playing', volume: player.volume });
        });
    }
}, 1000);

function launchFullscreenGame(gameName) {
    const activeGame = localStorage.getItem('tellstream_active_game');
    if (activeGame && activeGame !== gameName) {
        alert(`🔒 You are currently in an active ${activeGame === 'ludo' ? 'Ludo' : 'Dominoes'} game. Please exit the ${activeGame === 'ludo' ? 'Ludo' : 'Dominoes'} table first before switching!`);
        return;
    }

    const overlay = document.getElementById('game-overlay-container');
    const frame = document.getElementById('game-overlay-frame');
    if (overlay && frame) {
        frame.src = gameName === 'dominoes' ? '/dominoes/' : '/ludo/';
        overlay.style.display = 'block';
    }
}

function closeFullscreenGame() {
    const activeGame = localStorage.getItem('tellstream_active_game');
    if (activeGame) {
        alert(`⚠️ Please leave the game table inside the board first before exiting!`);
        return;
    }

    const overlay = document.getElementById('game-overlay-container');
    const frame = document.getElementById('game-overlay-frame');
    if (overlay && frame) {
        frame.src = '';
        overlay.style.display = 'none';
    }
}

window.launchFullscreenGame = launchFullscreenGame;
window.closeFullscreenGame = closeFullscreenGame;

function evaluateNoticeBoardForms() {
    const currentUser = usernameInput.value.trim();
    const warningBanner = document.getElementById('notice-footer-warning');
    const profile = profilesCache[currentUser];
    const savedUser = localStorage.getItem('tellstream_saved_username');
    const isVerified = profile && isCurrentUserVerified && currentUser === savedUser;

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
    const savedUser = localStorage.getItem('tellstream_saved_username');
    const isVerified = profile && isCurrentUserVerified && currentUser === savedUser;
    if (!isVerified) return;

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

// 1.5 EMAILJS CONFIGURATION (FOR PASSWORD RESET SELF-SERVICE)
// Populate these with your EmailJS credentials
const EMAILJS_SERVICE_ID = "service_qqn3spd";
const EMAILJS_TEMPLATE_ID = "template_mhk0398";
const EMAILJS_PUBLIC_KEY = "DsoGYxn2vGdYMBK7Y";

function syncDrawerName() {
    const currentName = usernameInput.value.trim();
    regNameInput.value = currentName;
    reminderHintDisplay.style.display = "none";

    // Hide forgot passkey buttons/forms by default and reset state
    const forgotLink = document.getElementById('forgotPasskeyLink');
    if (forgotLink) forgotLink.style.display = "none";
    toggleForgotPasskeyForm('login');

    if (profilesCache[currentName]) {
        lockStatusBtn.innerText = "🔒";
        drawerTitle.innerText = "Name is Secured: Log In";
        regReminderInput.style.display = "none";
        regEmailInput.style.display = "none";

        // Only show "Forgot Passkey?" link if the user is NOT already logged in on this browser
        const loggedInUser = localStorage.getItem('tellstream_saved_username');
        const isSelfLoggedIn = currentName === loggedInUser && isCurrentUserVerified;
        if (!isSelfLoggedIn && forgotLink) {
            forgotLink.style.display = "block";
        }

        drawerSubmitBtn.innerText = "Log In";
    } else {
        lockStatusBtn.innerText = "🔓";
        drawerTitle.innerText = "Secure Current Handle";
        regReminderInput.style.display = "block";
        regEmailInput.style.display = "block";
        drawerSubmitBtn.innerText = "Lock Name Globally";
    }
    if (isNoticeBoardActive) evaluateNoticeBoardForms();
    renderHelpContent(isNoticeBoardActive);
}

function toggleForgotPasskeyForm(step) {
    const link = document.getElementById('forgotPasskeyLink');
    const reqForm = document.getElementById('forgotPasskeyRequestForm');
    const verifyForm = document.getElementById('forgotPasskeyVerifyForm');

    const regPasskey = document.getElementById('regPasskeyInput');
    const drawerSubmit = document.getElementById('drawerSubmitBtn');

    if (!link || !reqForm || !verifyForm || !regPasskey || !drawerSubmit) return;

    if (step === 'request') {
        // Step 2: Show recovery email form, hide everything else
        link.style.display = "none";
        reqForm.style.display = "flex";
        verifyForm.style.display = "none";
        regPasskey.style.display = "none";
        drawerSubmit.style.display = "none";
    } else if (step === 'verify') {
        // Step 3: Show verification code entry form, hide everything else
        link.style.display = "none";
        reqForm.style.display = "none";
        verifyForm.style.display = "flex";
        regPasskey.style.display = "none";
        drawerSubmit.style.display = "none";
    } else {
        // Step 1: Default Login Drawer state
        const currentName = usernameInput.value.trim();
        const loggedInUser = localStorage.getItem('tellstream_saved_username');
        const isSelfLoggedIn = currentName === loggedInUser && isCurrentUserVerified;

        link.style.display = (profilesCache[currentName] && !isSelfLoggedIn) ? "block" : "none";
        reqForm.style.display = "none";
        verifyForm.style.display = "none";
        regPasskey.style.display = "block";
        drawerSubmit.style.display = "block";
    }
}

async function sendResetVerificationCode() {
    const currentName = usernameInput.value.trim();
    const emailInputVal = document.getElementById('resetRecoveryEmailInput').value.trim();
    const sendBtn = document.getElementById('sendCodeBtn');

    if (!currentName) {
        alert("Please enter a username.");
        return;
    }
    if (!emailInputVal) {
        alert("Please enter your recovery email.");
        return;
    }

    // Generate a 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now

    sendBtn.disabled = true;
    sendBtn.innerText = "Sending...";

    try {
        // Save the code & expiry timestamp using secure RPC
        const { data: setSuccess, error } = await supabase_db.rpc('set_reset_code', {
            p_username: currentName,
            p_email: emailInputVal,
            p_code: code,
            p_expires_at: expiresAt
        });

        if (error || !setSuccess) {
            throw new Error("Could not verify recovery details. Ensure the email is correct.");
        }

        // Dispatch the email via EmailJS
        if (EMAILJS_SERVICE_ID === "service_xxxxxx" || EMAILJS_PUBLIC_KEY === "your_public_key") {
            // If they haven't configured EmailJS yet, alert the code locally for testing
            console.log(`[TEST MODE] Reset code for ${currentName}: ${code}`);
            alert(`[TEST MODE] Reset code is: ${code}\n\n(Configure your EmailJS credentials at the top of main.js to send actual emails.)`);
        } else {
            // Initialize EmailJS
            emailjs.init(EMAILJS_PUBLIC_KEY);

            // Send email
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                to_name: currentName,
                to_email: emailInputVal,
                reset_code: code
            });
        }

        alert("Verification code sent to your email!");
        toggleForgotPasskeyForm('verify');
    } catch (err) {
        alert("Could not send verification code: " + err.message);
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerText = "Send Code";
    }
}

async function verifyAndResetPasskey() {
    const currentName = usernameInput.value.trim();
    const enteredCode = document.getElementById('resetCodeInput').value.trim();
    const newPasskey = document.getElementById('resetNewPasskeyInput').value.trim();
    const newReminder = document.getElementById('resetNewReminderInput').value.trim();
    const confirmBtn = document.getElementById('confirmResetBtn');

    if (!enteredCode || !newPasskey) {
        alert("Please enter the verification code and your new passkey.");
        return;
    }

    confirmBtn.disabled = true;
    confirmBtn.innerText = "Resetting...";

    try {
        // Reset passkey and reminder, clear code fields via secure RPC
        const { data: resetSuccess, error: updateError } = await supabase_db.rpc('reset_passkey_with_code', {
            p_username: currentName,
            p_code: enteredCode,
            p_new_passkey: newPasskey,
            p_new_reminder: newReminder
        });

        if (updateError || !resetSuccess) {
            throw new Error("Invalid or expired verification code.");
        }

        // Save new passkey locally to log in the user
        localStorage.setItem('tellstream_key_' + currentName, newPasskey);
        localStorage.setItem('tellstream_saved_username', currentName);
        localStorage.setItem('tellstream_active_user', currentName);

        alert("Passkey successfully reset! You are now logged in.");

        // Clean up inputs and close drawer
        document.getElementById('resetCodeInput').value = "";
        document.getElementById('resetNewPasskeyInput').value = "";
        document.getElementById('resetNewReminderInput').value = "";

        await syncProfilesMap();
        securityDrawer.classList.remove('open');
    } catch (err) {
        alert("Reset failed: " + err.message);
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerText = "Reset Passkey";
    }
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
        const { data: isValid, error: rpcErr } = await supabase_db.rpc('verify_user_passkey', {
            p_username: currentName,
            p_passkey: passkey
        });
        if (isValid && !rpcErr) {
            localStorage.setItem('tellstream_key_' + currentName, passkey);
            localStorage.setItem('tellstream_saved_username', currentName);
            localStorage.setItem('tellstream_active_user', currentName);
            isCurrentUserVerified = true;
            alert("Identity checked and authorized!");
            securityDrawer.classList.remove('open');
            chatBox.innerHTML = "";
            syncDrawerName();
            loadMessages();
            if (isNoticeBoardActive) evaluateNoticeBoardForms();
            renderHelpContent(isNoticeBoardActive);
            onUserVerifiedSuccess(currentName);
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
        else if (currentName === "Big John") { assignedLevel = 2; assignedHover = "the boss"; }
        else if (currentName === "Perfectionist") { assignedLevel = 2; assignedHover = "You done know"; }


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
            localStorage.setItem('tellstream_active_user', currentName);
            isCurrentUserVerified = true;
            alert("Registration complete!");
            await syncProfilesMap();
            securityDrawer.classList.remove('open');
            chatBox.innerHTML = "";
            if (isNoticeBoardActive) evaluateNoticeBoardForms();
            loadMessages();
            onUserVerifiedSuccess(currentName);
        }
    }
}

async function verifyCurrentSession() {
    const currentUser = usernameInput.value.trim();
    const authorizedKey = localStorage.getItem('tellstream_key_' + currentUser);
    if (currentUser && authorizedKey) {
        try {
            const { data, error } = await supabase_db.rpc('verify_user_passkey', {
                p_username: currentUser,
                p_passkey: authorizedKey
            });
            isCurrentUserVerified = !error && data;
            if (isCurrentUserVerified) {
                localStorage.setItem('tellstream_active_user', currentUser);
                onUserVerifiedSuccess(currentUser);
            } else {
                localStorage.removeItem('tellstream_active_user');
                clearUserSession();
            }
        } catch (e) {
            isCurrentUserVerified = false;
            localStorage.removeItem('tellstream_active_user');
            clearUserSession();
        }
    } else {
        isCurrentUserVerified = false;
        localStorage.removeItem('tellstream_active_user');
        clearUserSession();
    }
}

async function syncProfilesMap() {
    const { data } = await supabase_db.from('secured_profiles').select('username, power_level, key_reminder, hover_title');
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
    if (data) data.forEach(u => { bannedUsersCache[u.username.toLowerCase()] = u; });
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
        const pLevel = parseInt(profile.power_level || 0);
        if (pLevel >= 2) {
            nameClass = "user-admin";
        } else if (pLevel === 1) {
            nameClass = "user-selector";
        } else {
            nameClass = "user-registered";
        }
        if (profile.hover_title) hoverAttribute = `title="${escapeHTML(profile.hover_title)}"`;
    }

    msgDiv.innerHTML = `<div class="user ${nameClass}" ${hoverAttribute} style="cursor:pointer;" onclick="openProfileCard('${escapeHTML(data.username)}')">${escapeHTML(data.username)}</div><div>${messageContent}</div>`;
    chatBox.appendChild(msgDiv);
    anchorChatToBottom();
    while (chatBox.children.length > 50) chatBox.removeChild(chatBox.firstChild);
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

async function loadMessages() {
    const { data } = await supabase_db.from('messages').select('*').order('id', { ascending: false }).limit(40);
    if (data) {
        data.reverse().forEach(appendMessage);
        anchorChatToBottom();
    }
}

supabase_db.channel('public:messages').on('postgres_changes', { event: 'INSERT', pattern: 'public', table: 'messages' }, payload => { appendMessage(payload.new); }).subscribe();
supabase_db.channel('public:secured_profiles').on('postgres_changes', { event: '*', pattern: 'public', table: 'secured_profiles' }, async () => { await syncProfilesMap(); }).subscribe();

supabase_db.channel('public:notice_board').on('postgres_changes', { event: '*', pattern: 'public', table: 'notice_board' }, payload => {
    renderSiteNewsFeed();
    if (isNoticeBoardActive) fetchNoticeBoardRecords();
}).subscribe();

supabase_db.channel('public:banned_words').on('postgres_changes', { event: '*', pattern: 'public', table: 'banned_words' }, async () => { await syncBannedWordsMap(); }).subscribe();
supabase_db.channel('public:banned_users').on('postgres_changes', { event: '*', pattern: 'public', table: 'banned_users' }, async () => { await syncBannedUsersMap(); }).subscribe();

supabase_db.channel('public:stream_status').on('postgres_changes', { event: '*', pattern: 'public', table: 'stream_status' }, payload => {
    if (payload.new && payload.new.current_show) { renderStreamHeader(payload.new.current_show); }
}).subscribe();

async function sendMessage() {
    const user = usernameInput.value.trim() || 'Listener';
    let text = messageInput.value.trim();
    if (!text) return;

    if (text.startsWith('/')) {
        const profile = profilesCache[user];
        const userPowerLevel = parseInt(profile?.power_level || 0);

        const savedUser = localStorage.getItem('tellstream_saved_username');
        const isVerified = user === savedUser && isCurrentUserVerified;
        if (profile && isVerified && userPowerLevel >= 1) {

            // CONSOLE INJECTION INTERCEPTOR FOR ZERO-SLASH SCHEDULE SYSTEM
            if (text.startsWith('/schedule ')) {
                messageInput.value = '';
                await processScheduleConsoleInjections(text, user);
                return;
            }

            if (text.startsWith('/show')) {
                let showNameInput = "";
                if (text.trim() === '/show live') {
                    showNameInput = user;
                } else if (text.startsWith('/show ')) {
                    showNameInput = text.substring(6).trim().substring(0, 50);
                }

                if (showNameInput) {
                    messageInput.value = '';
                    await updateDatabaseStreamStatus(showNameInput);
                    return;
                }
            }

            if (text.startsWith('/setlevel ')) {
                if (userPowerLevel < 2) {
                    messageInput.value = '';
                    alert("🔒 Access Denied: Only Station Admins (Level 2) have authorization to change user levels.");
                    return;
                }
                messageInput.value = '';
                await handleSetLevelCommand(text);
                return;
            }

            if (text.startsWith('/upload ') || text.startsWith('/delete ')) {
                if (userPowerLevel < 2) {
                    messageInput.value = '';
                    alert("🔒 Access Denied: Only Station Admins (Level 2) have authorization to manage cloud image assets.");
                    return;
                }

                if (text.startsWith('/upload ')) {
                    const uploadNameInput = text.substring(8).trim().substring(0, 50);
                    if (uploadNameInput) {
                        messageInput.value = '';
                        pendingLogoTargetName = uploadNameInput.toLowerCase().replace(/\s+/g, '_');
                        const hiddenUploader = document.getElementById('studioLogoHiddenFilePicker');
                        if (hiddenUploader) hiddenUploader.click();
                        return;
                    }
                }

                if (text.startsWith('/delete ')) {
                    const deleteNameInput = text.substring(8).trim().substring(0, 50);
                    if (deleteNameInput) {
                        messageInput.value = '';
                        const targetFileName = deleteNameInput.toLowerCase().replace(/\s+/g, '_') + '.png';
                        try {
                            const { error } = await supabase_db.storage.from('dj-logos').remove([targetFileName]);
                            if (error) throw error;
                            alert(`🗑️ Logo successfully deleted for: "${deleteNameInput}"`);
                            await loadInitialStreamStatus();
                        } catch (err) {
                            alert("Cloud Deletion Failure: " + err.message);
                        }
                        return;
                    }
                }
            }

            if (text.startsWith('/uploadflyer ') || text.startsWith('/deleteflyer ')) {
                if (userPowerLevel < 2) {
                    messageInput.value = '';
                    alert("🔒 Access Denied: Only Station Admins (Level 2) have authorization to manage event flyer assets.");
                    return;
                }

                if (text.startsWith('/uploadflyer ')) {
                    const uploadNameInput = text.substring(13).trim().substring(0, 50);
                    if (uploadNameInput) {
                        const filenameClean = uploadNameInput.toLowerCase().replace(/\s+/g, '_');
                        const datePrefix = filenameClean.substring(0, 6);
                        if (!/^\d{6}$/.test(datePrefix)) {
                            alert("Error Name format! Must start with 6 digits (DDMMYY).");
                            return;
                        }
                        messageInput.value = '';
                        pendingFlyerTargetName = filenameClean;
                        const hiddenUploader = document.getElementById('studioFlyerHiddenFilePicker');
                        if (hiddenUploader) hiddenUploader.click();
                        return;
                    }
                }

                if (text.startsWith('/deleteflyer ')) {
                    const deleteNameInput = text.substring(13).trim().substring(0, 50);
                    if (deleteNameInput) {
                        const filenameClean = deleteNameInput.toLowerCase().replace(/\s+/g, '_');
                        messageInput.value = '';
                        try {
                            const { data: files, error: listError } = await supabase_db.storage.from('flyers').list('', { limit: 100 });
                            if (listError) throw listError;

                            const targetFile = files.find(f => {
                                const lowerName = f.name.toLowerCase();
                                return lowerName === filenameClean || lowerName.startsWith(filenameClean + '.');
                            });
                            if (!targetFile) {
                                alert(`❓ Flyer matching "${deleteNameInput}" not found in storage.`);
                                return;
                            }

                            const { error } = await supabase_db.storage.from('flyers').remove([targetFile.name]);
                            if (error) throw error;
                            alert(`🗑️ Flyer successfully deleted: "${targetFile.name}"`);
                            await renderActiveFlyers();
                        } catch (err) {
                            alert("Cloud Deletion Failure: " + err.message);
                        }
                        return;
                    }
                }
            }

            if (text.startsWith('/add ') || text.startsWith('/del ') || text.startsWith('/unban ') || text === '/listwords') {
                messageInput.value = '';
                await handleAdminFilterCommand(text);
                return;
            }

            messageInput.value = '';
            alert("❓ Unknown Command: That command does not exist. Use /show live to switch banners.");
            return;
        } else {
            messageInput.value = '';
            alert("🔒 Access Denied: Only Station Admins and Authorized DJs can run command scripts.");
            return;
        }
    }

    if (profilesCache[user]) {
        const loggedInUser = localStorage.getItem('tellstream_saved_username');
        const isVerified = user === loggedInUser && isCurrentUserVerified;
        if (!isVerified) {
            alert("This handle name has been secured! Please unlock the identity box.");
            toggleSecurityDrawer();
            return;
        }
    }

    const banCheck = checkBanStatus(user);
    if (banCheck.isBanned) { alert(banCheck.message); return; }

    if (containsSwearWords(text)) {
        messageInput.value = '';
        await handleUserStrike(user, text);
        return;
    }

    const wasApology = await checkAndProcessApology(user, text);
    if (wasApology) { messageInput.value = ''; return; }

    messageInput.value = '';
    if (currentChatMode.startsWith('dm:')) {
        const receiver = currentChatMode.substring(3);
        const rel = relationshipMap[receiver];
        if (rel && rel.status === 'blocked') {
            alert("You have blocked this user. Unblock them in your Fambily settings to chat.");
            return;
        }
        const checkBlocked = await checkBlockedStatus(user, receiver);
        if (checkBlocked) {
            alert("Unable to send message to this user.");
            return;
        }
        await supabase_db.from('private_messages').insert([{
            sender: user,
            receiver: receiver,
            message: text
        }]);
        if (!activeDMTabs.includes(receiver)) {
            activeDMTabs.push(receiver);
            renderChatTabs();
        }
    } else {
        await supabase_db.from('messages').insert([{ username: user, message: text }]);
    }
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });

// ISOLATED INJECTIONS RUNNERS (BUILT ASYNC SO THEY CANNOT BLOCK CORE GREETINGS OR LOGINS)
async function processScheduleConsoleInjections(text, djUser) {
    const args = text.trim().split(/\s+/);
    const action = args[1]?.toLowerCase();
    const passkey = localStorage.getItem('tellstream_key_' + djUser) || "";

    if (action === 'perm') {
        const profile = profilesCache[djUser];
        const userPowerLevel = parseInt(profile?.power_level || 0);
        if (userPowerLevel < 2) {
            alert("Permission denied. Only Station Admins (Level 2) can modify permanent timetable slots.");
            return;
        }
        const dayName = args[2];
        const startTime = args[3];
        const endTime = args[4];
        const timeZone = args[5];
        const targetDJ = args[6] || djUser;

        if (!dayName || !startTime || !endTime || !timeZone) {
            alert("Format missing. Use: /schedule perm [Day] [Start Time] [End Time] [Time Zone] [optional: Presenter_Name]");
            return;
        }

        const { error } = await supabase_db.rpc('secure_upsert_master_schedule', {
            p_auth_username: djUser,
            p_auth_passkey: passkey,
            p_day_of_week: dayName.toLowerCase(),
            p_start_time: startTime,
            p_end_time: endTime,
            p_time_zone: timeZone.toUpperCase(),
            p_dj_name: targetDJ
        });

        if (error) console.error("Database master schedule record failure:", error.message);
    }
    else if (action === 'temp') {
        const dateBlock = args[2];
        const startTime = args[3];
        const endTime = args[4];
        const timeZone = args[5];
        const targetDJ = args[6] || djUser;

        if (!dateBlock || !startTime || !endTime || !timeZone || dateBlock.length !== 6) {
            alert("Format missing. Use: /schedule temp [ddmmyy] [Start Time] [End Time] [Time Zone] [optional: Presenter_Name]");
            return;
        }

        const { error } = await supabase_db.rpc('secure_upsert_temporary_override', {
            p_auth_username: djUser,
            p_auth_passkey: passkey,
            p_specific_date: dateBlock,
            p_start_time: startTime,
            p_end_time: endTime,
            p_time_zone: timeZone.toUpperCase(),
            p_dj_name: targetDJ,
            p_is_cancelled: false
        });

        if (error) console.error("Database temporary override record failure:", error.message);
    }
    else if (action === 'cancel') {
        const profile = profilesCache[djUser];
        const userPowerLevel = parseInt(profile?.power_level || 0);
        if (userPowerLevel < 2) {
            alert("Permission denied. Only Station Admins (Level 2) can cancel scheduled shows.");
            return;
        }
        const dateBlock = args[2];
        const startTime = args[3];

        if (!dateBlock || !startTime || dateBlock.length !== 6) {
            alert("Format missing. Use: /schedule cancel [ddmmyy] [Start Time]");
            return;
        }

        const { error } = await supabase_db.rpc('secure_upsert_temporary_override', {
            p_auth_username: djUser,
            p_auth_passkey: passkey,
            p_specific_date: dateBlock,
            p_start_time: startTime,
            p_end_time: null,
            p_time_zone: 'UTC',
            p_dj_name: 'tellstream',
            p_is_cancelled: true
        });

        if (error) console.error("Database cancel action sync failure:", error.message);
    }
}

async function fetchAndRenderWeeklyTimetable() {
    if (!timetableContainer) return;
    try {
        const { data: masterData, error: masterErr } = await supabase_db.from('master_schedule').select('*');
        const { data: tempOverrides, error: tempErr } = await supabase_db.from('temporary_overrides').select('*');

        if (masterErr || !masterData || masterData.length === 0) {
            timetableContainer.innerHTML = `<p style="color:#666; text-align:center; padding-top:20px; font-style:italic;">Today's schedule under construction.</p>`;
            return;
        }

        const dayOrder = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        // Grab the viewer's native system time zone city
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Initialize grouped schedule lists
        const groupedByDay = {
            sunday: [], monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: []
        };

        masterData.forEach(item => {
            if (!item.day_of_week || dayOrder[item.day_of_week.toLowerCase()] === undefined) {
                console.warn("Skipping invalid schedule day:", item.day_of_week);
                return;
            }
            if (item.dj_name === "tellstream") return;

            let currentDJ = item.dj_name;
            let noteLabel = "";

            if (tempOverrides) {
                const matchOverride = tempOverrides.find(o => o.start_time === item.start_time);
                if (matchOverride) {
                    if (matchOverride.is_cancelled) {
                        currentDJ = "tellstream";
                        noteLabel = `<span style="color:#ff3333; font-size:0.7rem; font-weight:bold; background:rgba(255,51,51,0.1); padding:2px 6px; border-radius:3px; margin-left:8px;">[CANCELLED]</span>`;
                    } else {
                        currentDJ = matchOverride.dj_name;
                        noteLabel = `<span style="color:#ffdd1a; font-size:0.7rem; font-weight:bold; background:rgba(255,221,26,0.1); padding:2px 6px; border-radius:3px; margin-left:8px;">[COVER SET]</span>`;
                    }
                }
            }

            // Break raw database values ('2000') into numbers
            const startHours = parseInt(item.start_time.substring(0, 2), 10);
            const startMins = parseInt(item.start_time.substring(2, 4), 10);
            const endHours = parseInt(item.end_time.substring(0, 2), 10);
            const endMins = parseInt(item.end_time.substring(2, 4), 10);

            // Establish dates pinned to Europe/London
            const baseDate = new Date();
            const currentDayIndex = baseDate.getDay();
            const targetDayIndex = dayOrder[item.day_of_week.toLowerCase()];
            let dayDiff = targetDayIndex - currentDayIndex;

            baseDate.setDate(baseDate.getDate() + dayDiff);

            const ukStart = new Date(baseDate.toLocaleString('en-US', { timeZone: 'Europe/London' }));
            ukStart.setHours(startHours, startMins, 0, 0);

            const ukEnd = new Date(baseDate.toLocaleString('en-US', { timeZone: 'Europe/London' }));
            ukEnd.setHours(endHours, endMins, 0, 0);

            // Shift everything cleanly to the user's local zone
            const localDayStr = ukStart.toLocaleDateString('en-US', { timeZone: userTimeZone, weekday: 'long' });
            const localStartStr = ukStart.toLocaleTimeString('en-GB', { timeZone: userTimeZone, hour: '2-digit', minute: '2-digit', hour12: false });
            const localEndStr = ukEnd.toLocaleTimeString('en-GB', { timeZone: userTimeZone, hour: '2-digit', minute: '2-digit', hour12: false });

            const localDayLower = localDayStr.toLowerCase();
            if (groupedByDay[localDayLower]) {
                groupedByDay[localDayLower].push({
                    start: localStartStr,
                    end: localEndStr,
                    dj: currentDJ,
                    badge: noteLabel,
                    sortTime: localStartStr
                });
            }
        });

        // 1. RENDER TODAY'S TIMETABLE IN COLUMN 2
        const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const todayShows = groupedByDay[todayName] || [];
        todayShows.sort((a, b) => a.sortTime.localeCompare(b.sortTime));

        if (todayShows.length === 0) {
            timetableContainer.innerHTML = `
                <div class="fb-post-card" style="border-left: 4px solid #555; background: rgba(255, 255, 255, 0.02); padding: 14px; border-radius: 4px; text-align: center;">
                    <p style="color:#666; font-style:italic; margin:0;">No transmissions scheduled for today.</p>
                </div>
            `;
        } else {
            timetableContainer.innerHTML = todayShows.map(show => `
                <div class="fb-post-card" style="border-left: 4px solid #22e532; margin-bottom: 12px; background: rgba(34, 229, 50, 0.03); padding: 14px; border-radius: 4px;">
                    <div style="font-weight: 900; color: #22e532; text-transform: uppercase; font-size: 0.95rem; letter-spacing: 1px; display: flex; justify-content: space-between;">
                        <span>📅 Today</span>
                        <span style="color: #555; font-size: 0.75rem; text-transform: none; font-weight: normal;">📍 Auto-Translated</span>
                    </div>
                    <div style="color: #ffffff; margin-top: 6px; font-size: 1.25rem; font-weight: 900; letter-spacing: 0.5px;">
                        ⏰ ${show.start} - ${show.end}
                    </div>
                    <div style="color: #a0a0a0; font-size: 0.88rem; margin-top: 8px; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 8px; display: flex; align-items: center;">
                        🎙️ <span style="margin-left: 6px;">Presenter: <strong style="color:#fff; font-weight:800;">${show.dj}</strong></span> ${show.badge}
                    </div>
                </div>
            `).join('');
        }

        // 2. RENDER THE 2x3 REST OF THE WEEK GRID IN THE MODAL
        const gridContainer = document.getElementById('scheduleGridContainer');
        if (gridContainer) {
            const todayIndex = new Date().getDay(); // 0 (Sunday) to 6 (Saturday)
            let otherDaysHtml = "";

            for (let i = 1; i <= 6; i++) {
                const idx = (todayIndex + i) % 7;
                const dayName = dayNames[idx];
                const dayShows = groupedByDay[dayName] || [];
                dayShows.sort((a, b) => a.sortTime.localeCompare(b.sortTime));

                let showsHtml = "";
                if (dayShows.length === 0) {
                    showsHtml = `<p style="color:#555; text-align:center; font-style:italic; font-size:0.85rem; margin-top:20px;">No shows scheduled.</p>`;
                } else {
                    showsHtml = dayShows.map(show => `
                        <div style="border-left: 3px solid #22e532; background: rgba(34, 229, 50, 0.02); padding: 10px 12px; border-radius: 6px; font-size: 0.85rem; display: flex; flex-direction: column; gap: 4px;">
                            <div style="color: #ffffff; font-weight: 800; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center;">
                                <span>⏰ ${show.start} - ${show.end}</span>
                                ${show.badge}
                            </div>
                            <div style="color: #aaa; display: flex; align-items: center; gap: 6px; font-size: 0.8rem; margin-top: 2px;">
                                🎙️ <span>Presenter: <strong style="color: #fff;">${show.dj}</strong></span>
                            </div>
                        </div>
                    `).join('');
                }

                const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
                otherDaysHtml += `
                    <div class="schedule-day-card">
                        <div class="schedule-day-header">📅 ${capitalizedDay}</div>
                        <div class="schedule-day-list">
                            ${showsHtml}
                        </div>
                    </div>
                `;
            }

            gridContainer.innerHTML = otherDaysHtml;
        }

    } catch (e) {
        console.error("Timetable translation engine fault:", e);
        timetableContainer.innerHTML = `<p style="color:#666; text-align:center; padding-top:20px; font-style:italic;">Timetable load error.</p>`;
    }
}

function openScheduleGrid() {
    const modal = document.getElementById('schedule-overlay-modal');
    if (modal) {
        modal.style.display = 'flex';
        // Trigger reflow to start transition
        modal.offsetHeight;
        modal.classList.add('active');
    }
}

function closeScheduleGrid() {
    const modal = document.getElementById('schedule-overlay-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            if (!modal.classList.contains('active')) {
                modal.style.display = 'none';
            }
        }, 250);
    }
}

// ==========================================================================
// 💚 FAMBILY & PRIVATE CHAT SYSTEM LOGIC
// ==========================================================================

async function onUserVerifiedSuccess(username) {
    try {
        const { data, error } = await supabase_db.from('secured_profiles')
            .select('location, socials, bio, profile_visibility, avatar_url, status_invisible')
            .eq('username', username)
            .single();
        if (data && !error) {
            myProfile = data;
            document.getElementById('profileLocationInput').value = data.location || '';
            document.getElementById('profileSocialsInput').value = data.socials || '';
            document.getElementById('profileBioInput').value = data.bio || '';
            document.getElementById('profileVisibilitySelect').value = data.profile_visibility || 'fambily';
            document.getElementById('profileInvisibleCheckbox').checked = !!data.status_invisible;
            if (data.avatar_url) {
                document.getElementById('myAvatarImg').src = data.avatar_url;
            } else {
                document.getElementById('myAvatarImg').src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23444'/><text x='50' y='60' font-size='30' font-family='sans-serif' text-anchor='middle' fill='%23fff'>?</text></svg>";
            }
        } else {
            myProfile = {
                location: '',
                socials: '',
                bio: '',
                profile_visibility: 'fambily',
                avatar_url: '',
                status_invisible: false
            };
        }
    } catch(e) {
        console.error("Error loading profile:", e);
    }

    await initPresenceTracking(username);
    await loadRelationships(username);
    initRealtimePrivateSubscriptions(username);
}

function clearUserSession() {
    isCurrentUserVerified = false;
    myProfile = null;
    relationshipMap = {};
    activeDMTabs = [];
    currentChatMode = 'lounge';
    renderChatTabs();
    if (presenceTracker) {
        presenceTracker.unsubscribe();
        presenceTracker = null;
    }
    if (activePrivateSub) {
        activePrivateSub.unsubscribe();
        activePrivateSub = null;
    }
    renderOnlineUsersList();
}

async function initPresenceTracking(username) {
    if (presenceTracker) {
        presenceTracker.unsubscribe();
    }
    
    presenceTracker = supabase_db.channel('public:presence', {
        config: {
            presence: {
                key: username,
            },
        },
    });

    presenceTracker.on('presence', { event: 'sync' }, () => {
        const state = presenceTracker.presenceState();
        onlineUsers = {};
        Object.keys(state).forEach(user => {
            const info = state[user][0] || {};
            if (!info.invisible) {
                onlineUsers[user] = info;
            }
        });
        renderOnlineUsersList();
    });

    const avatarUrl = myProfile?.avatar_url || '';
    const invisible = !!myProfile?.status_invisible;

    await presenceTracker.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            await presenceTracker.track({
                username: username,
                avatar_url: avatarUrl,
                invisible: invisible,
                online_at: new Date().toISOString()
            });
        }
    });
}

async function loadRelationships(username) {
    try {
        const { data, error } = await supabase_db.from('fambily_relations')
            .select('*')
            .or(`sender.eq.${username},receiver.eq.${username}`);
        
        relationshipMap = {};
        if (data && !error) {
            data.forEach(rel => {
                const other = (rel.sender === username) ? rel.receiver : rel.sender;
                relationshipMap[other] = {
                    id: rel.id,
                    status: rel.status,
                    sender: rel.sender,
                    receiver: rel.receiver
                };
            });
        }
    } catch(e) {
        console.error(e);
    }
}

async function checkBlockedStatus(user, receiver) {
    const rel = relationshipMap[receiver];
    if (rel && rel.status === 'blocked' && rel.sender === receiver) {
        return true;
    }
    try {
        const { data } = await supabase_db.from('fambily_relations')
            .select('status, sender')
            .or(`and(sender.eq.${user},receiver.eq.${receiver}),and(sender.eq.${receiver},receiver.eq.${user})`)
            .single();
        if (data && data.status === 'blocked' && data.sender === receiver) {
            return true;
        }
    } catch(e) {}
    return false;
}

function initRealtimePrivateSubscriptions(username) {
    if (activePrivateSub) {
        activePrivateSub.unsubscribe();
    }
    
    activePrivateSub = supabase_db.channel('public:private_channels')
        .on('postgres_changes', { event: '*', pattern: 'public', table: 'fambily_relations' }, async () => {
            await loadRelationships(username);
            renderFambilyList();
            renderRequestsList();
            renderBlockedList();
        })
        .on('postgres_changes', { event: 'INSERT', pattern: 'public', table: 'private_messages' }, payload => {
            const msg = payload.new;
            if (msg.sender === username || msg.receiver === username) {
                const other = (msg.sender === username) ? msg.receiver : msg.sender;
                if (currentChatMode === `dm:${other}`) {
                    appendPrivateMessage(msg);
                } else {
                    if (!activeDMTabs.includes(other)) {
                        activeDMTabs.push(other);
                    }
                    renderChatTabs();
                }
            }
        })
        .subscribe();
}

function toggleFambilyDrawer() {
    const currentName = usernameInput.value.trim();
    const authorizedKey = localStorage.getItem('tellstream_key_' + currentName);
    const isVerified = currentName && authorizedKey && isCurrentUserVerified;
    
    if (!isVerified) {
        alert("🔒 Please secure and verify your handle first to use the Fambily drawer.");
        toggleSecurityDrawer();
        return;
    }
    
    securityDrawer.classList.remove('open');
    
    const drawer = document.getElementById('fambilyDrawer');
    if (drawer.classList.toggle('open')) {
        onUserVerifiedSuccess(currentName);
        switchFambilyTab('profile');
    }
}

function switchFambilyTab(tabName) {
    const tabs = ['profile', 'fambily', 'requests', 'blocked'];
    tabs.forEach(t => {
        const btn = document.getElementById(`fambily-tab-btn-${t}`);
        const content = document.getElementById(`fambily-tab-${t}`);
        if (t === tabName) {
            btn.classList.add('active');
            content.style.display = 'block';
        } else {
            btn.classList.remove('active');
            content.style.display = 'none';
        }
    });
    
    if (tabName === 'fambily') {
        renderFambilyList();
    } else if (tabName === 'requests') {
        renderRequestsList();
    } else if (tabName === 'blocked') {
        hideBlockedList();
    }
}

function revealBlockedList() {
    document.getElementById('blockedRevealContainer').style.display = 'none';
    document.getElementById('blockedContentContainer').style.display = 'block';
    renderBlockedList();
}

function hideBlockedList() {
    document.getElementById('blockedRevealContainer').style.display = 'block';
    document.getElementById('blockedContentContainer').style.display = 'none';
}

function handleAvatarSelected(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 500 * 1024) {
        alert("Image file size exceeds 500KB limit.");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            const size = Math.min(img.width, img.height);
            const xOffset = (img.width - size) / 2;
            const yOffset = (img.height - size) / 2;
            ctx.drawImage(img, xOffset, yOffset, size, size, 0, 0, 128, 128);
            document.getElementById('myAvatarImg').src = canvas.toDataURL('image/png');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function saveProfileChanges() {
    const currentUser = usernameInput.value.trim();
    if (!isCurrentUserVerified) return;
    
    const location = document.getElementById('profileLocationInput').value.trim();
    const socials = document.getElementById('profileSocialsInput').value.trim();
    const bio = document.getElementById('profileBioInput').value.trim();
    const visibility = document.getElementById('profileVisibilitySelect').value;
    const invisible = document.getElementById('profileInvisibleCheckbox').checked;
    
    let avatarUrl = myProfile?.avatar_url || '';
    const preview = document.getElementById('myAvatarImg');
    
    if (preview.src.startsWith('data:image/')) {
        try {
            const response = await fetch(preview.src);
            const blob = await response.blob();
            const filename = `avatars_${currentUser}.png`;
            
            const { error: uploadError } = await supabase_db.storage.from('flyers').upload(filename, blob, {
                cacheControl: '3600',
                upsert: true
            });
            if (uploadError) throw uploadError;
            
            const { data } = supabase_db.storage.from('flyers').getPublicUrl(filename);
            avatarUrl = data.publicUrl;
        } catch (uploadErr) {
            alert("Failed to upload profile photo: " + uploadErr.message);
            return;
        }
    }
    
    try {
        const { error } = await supabase_db.from('secured_profiles')
            .update({
                location: location,
                socials: socials,
                bio: bio,
                profile_visibility: visibility,
                avatar_url: avatarUrl,
                status_invisible: invisible
            })
            .eq('username', currentUser);
            
        if (error) throw error;
        
        myProfile = {
            location,
            socials,
            bio,
            profile_visibility: visibility,
            avatar_url: avatarUrl,
            status_invisible: invisible
        };
        
        await initPresenceTracking(currentUser);
        alert("Profile saved successfully!");
        const drawer = document.getElementById('fambilyDrawer');
        drawer.classList.remove('open');
    } catch(err) {
        alert("Failed to save profile: " + err.message);
    }
}

async function sendFambilyRequest() {
    const inputVal = document.getElementById('addFambilyInput').value.trim();
    if (!inputVal) return;
    
    const currentUser = usernameInput.value.trim();
    if (inputVal === currentUser) {
        alert("You cannot add yourself to Fambily.");
        return;
    }
    
    if (!profilesCache[inputVal]) {
        alert(`User "${inputVal}" is not registered on the site.`);
        return;
    }
    
    const rel = relationshipMap[inputVal];
    if (rel) {
        if (rel.status === 'blocked') {
            alert(`You have blocked "${inputVal}". Unblock them first.`);
        } else if (rel.status === 'fambily') {
            alert(`"${inputVal}" is already in your Fambily list.`);
        } else {
            alert("Fambily request already pending.");
        }
        return;
    }
    
    try {
        const { error } = await supabase_db.from('fambily_relations').insert([{
            sender: currentUser,
            receiver: inputVal,
            status: 'request'
        }]);
        if (error) throw error;
        
        document.getElementById('addFambilyInput').value = "";
        alert(`Fambily request sent to "${inputVal}"!`);
        await loadRelationships(currentUser);
        renderRequestsList();
    } catch(err) {
        alert("Failed to send request: " + err.message);
    }
}

async function sendFambilyRequestTo(target) {
    const currentUser = usernameInput.value.trim();
    try {
        await supabase_db.from('fambily_relations').insert([{
            sender: currentUser,
            receiver: target,
            status: 'request'
        }]);
        await loadRelationships(currentUser);
    } catch(e) {
        console.error(e);
    }
}

async function acceptFambilyRequestFrom(otherUser) {
    const currentUser = usernameInput.value.trim();
    const rel = relationshipMap[otherUser];
    if (!rel) return;
    
    try {
        const { error } = await supabase_db.from('fambily_relations')
            .update({ status: 'fambily' })
            .eq('id', rel.id);
        if (error) throw error;
        
        await loadRelationships(currentUser);
        renderRequestsList();
        renderFambilyList();
    } catch(err) {
        alert("Failed to accept request: " + err.message);
    }
}

async function ignoreFambilyRequestFrom(otherUser) {
    await removeRelationship(otherUser);
}

async function cancelFambilyRequestTo(otherUser) {
    await removeRelationship(otherUser);
}

async function removeRelationship(otherUser) {
    const currentUser = usernameInput.value.trim();
    const rel = relationshipMap[otherUser];
    if (!rel) return;
    
    try {
        const { error } = await supabase_db.from('fambily_relations')
            .delete()
            .eq('id', rel.id);
        if (error) throw error;
        
        await loadRelationships(currentUser);
        renderRequestsList();
        renderFambilyList();
        renderBlockedList();
    } catch(err) {
        alert("Failed to update status: " + err.message);
    }
}

async function removeRelationshipAndRefresh(otherUser) {
    await removeRelationship(otherUser);
}

async function blockUserAndRelationship(otherUser) {
    const currentUser = usernameInput.value.trim();
    const rel = relationshipMap[otherUser];
    
    try {
        if (rel) {
            const { error } = await supabase_db.from('fambily_relations')
                .update({
                    status: 'blocked',
                    sender: currentUser,
                    receiver: otherUser
                })
                .eq('id', rel.id);
            if (error) throw error;
        } else {
            const { error } = await supabase_db.from('fambily_relations')
                .insert([{
                    sender: currentUser,
                    receiver: otherUser,
                    status: 'blocked'
                }]);
            if (error) throw error;
        }
        await loadRelationships(currentUser);
        renderRequestsList();
        renderFambilyList();
        renderBlockedList();
    } catch(err) {
        alert("Failed to block user: " + err.message);
    }
}

async function unblockUserAndRefresh(otherUser) {
    await removeRelationship(otherUser);
}

async function openProfileCard(targetUsername) {
    const modal = document.getElementById('profileCardModal');
    if (!modal) return;
    
    const currentUser = usernameInput.value.trim();
    
    // Set loading/default values
    document.getElementById('profileCardUsername').innerText = targetUsername;
    const avatarImg = document.getElementById('profileCardAvatar');
    avatarImg.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23444'/><text x='50' y='60' font-size='30' font-family='sans-serif' text-anchor='middle' fill='%23fff'>?</text></svg>";
    
    const levelSpan = document.getElementById('profileCardLevel');
    const profile = profilesCache[targetUsername];
    let levelText = "Registered Member";
    let levelStyle = "background:rgba(34,229,50,0.15); color:#22e532;";
    
    if (profile) {
        const pLevel = parseInt(profile.power_level || 0);
        if (pLevel >= 2) {
            levelText = "Station Admin";
            levelStyle = "background:rgba(255,51,83,0.15); color:#ff3353;";
        } else if (pLevel === 1) {
            levelText = "DJ / Selector";
            levelStyle = "background:rgba(255,221,26,0.15); color:#ffdd1a;";
        }
    }
    levelSpan.innerText = levelText;
    levelSpan.style = levelStyle;
    
    // Clear details first
    document.getElementById('profileCardLocation').innerText = "Hidden";
    document.getElementById('profileCardSocials').innerText = "Hidden";
    document.getElementById('profileCardBio').innerText = "This user hasn't written a bio yet.";
    
    const actionsDiv = document.getElementById('profileCardActions');
    actionsDiv.innerHTML = ""; // Clear actions

    // Show modal
    modal.style.display = "flex";

    // Query profile details from DB
    try {
        const { data, error } = await supabase_db.from('secured_profiles')
            .select('location, socials, bio, profile_visibility, avatar_url')
            .eq('username', targetUsername)
            .single();
            
        if (data && !error) {
            if (data.avatar_url) avatarImg.src = data.avatar_url;
            
            // Check visibility
            const visibility = data.profile_visibility || 'fambily';
            let allowedToSee = false;
            
            if (visibility === 'everyone' || targetUsername === currentUser) {
                allowedToSee = true;
            } else if (visibility === 'fambily') {
                const rel = relationshipMap[targetUsername];
                if (rel && rel.status === 'fambily') {
                    allowedToSee = true;
                }
            }
            
            if (allowedToSee) {
                document.getElementById('profileCardLocation').innerText = data.location || "Not specified";
                document.getElementById('profileCardSocials').innerText = data.socials || "Not specified";
                document.getElementById('profileCardBio').innerText = data.bio || "No bio written.";
            } else {
                document.getElementById('profileCardLocation').innerText = "Fambily Only";
                document.getElementById('profileCardSocials').innerText = "Fambily Only";
                document.getElementById('profileCardBio').innerText = "Fambily Only details.";
            }
        }
    } catch(e) {
        console.error(e);
    }

    // Insert actions based on relationship
    if (targetUsername !== currentUser && isCurrentUserVerified) {
        const rel = relationshipMap[targetUsername];
        const isBlocked = rel && rel.status === 'blocked';
        
        if (!isBlocked) {
            const weAreBlocked = await checkBlockedStatus(currentUser, targetUsername);
            if (!weAreBlocked) {
                const dmBtn = document.createElement('button');
                dmBtn.className = "drawer-action-inline-btn btn-green";
                dmBtn.innerText = "Message";
                dmBtn.onclick = () => {
                    closeProfileCard();
                    openPrivateChatTab(targetUsername);
                };
                actionsDiv.appendChild(dmBtn);
            }
        }
        
        // Fambily status button
        if (!rel) {
            const addBtn = document.createElement('button');
            addBtn.className = "drawer-action-inline-btn btn-green";
            addBtn.innerText = "Add Fambily";
            addBtn.onclick = async () => {
                await sendFambilyRequestTo(targetUsername);
                openProfileCard(targetUsername);
            };
            actionsDiv.appendChild(addBtn);
        } else if (rel.status === 'request') {
            if (rel.receiver === currentUser) {
                const acceptBtn = document.createElement('button');
                acceptBtn.className = "drawer-action-inline-btn btn-green";
                acceptBtn.innerText = "Accept Fambily";
                acceptBtn.onclick = async () => {
                    await acceptFambilyRequestFrom(targetUsername);
                    openProfileCard(targetUsername);
                };
                actionsDiv.appendChild(acceptBtn);
                
                const ignoreBtn = document.createElement('button');
                ignoreBtn.className = "drawer-action-inline-btn btn-red";
                ignoreBtn.innerText = "Ignore";
                ignoreBtn.onclick = async () => {
                    await ignoreFambilyRequestFrom(targetUsername);
                    openProfileCard(targetUsername);
                };
                actionsDiv.appendChild(ignoreBtn);
            } else {
                const pendingBtn = document.createElement('button');
                pendingBtn.className = "drawer-action-inline-btn";
                pendingBtn.innerText = "Request Pending";
                pendingBtn.disabled = true;
                actionsDiv.appendChild(pendingBtn);
            }
        } else if (rel.status === 'fambily') {
            const removeBtn = document.createElement('button');
            removeBtn.className = "drawer-action-inline-btn btn-red";
            removeBtn.innerText = "Remove Fambily";
            removeBtn.onclick = async () => {
                if (confirm(`Remove ${targetUsername} from your Fambily list?`)) {
                    await removeRelationship(targetUsername);
                    openProfileCard(targetUsername);
                }
            };
            actionsDiv.appendChild(removeBtn);
        }
        
        // Block button
        if (rel && rel.status === 'blocked' && rel.sender === currentUser) {
            const unblockBtn = document.createElement('button');
            unblockBtn.className = "drawer-action-inline-btn btn-green";
            unblockBtn.innerText = "Unblock";
            unblockBtn.onclick = async () => {
                await removeRelationship(targetUsername);
                openProfileCard(targetUsername);
            };
            actionsDiv.appendChild(unblockBtn);
        } else {
            const blockBtn = document.createElement('button');
            blockBtn.className = "drawer-action-inline-btn btn-red";
            blockBtn.innerText = "Block";
            blockBtn.onclick = async () => {
                if (confirm(`Block ${targetUsername}? They will not be able to send you messages or requests.`)) {
                    await blockUserAndRelationship(targetUsername);
                    openProfileCard(targetUsername);
                }
            };
            actionsDiv.appendChild(blockBtn);
        }
    }
}

function closeProfileCard() {
    const modal = document.getElementById('profileCardModal');
    if (modal) modal.style.display = "none";
}

function switchChatMode(mode) {
    if (mode !== 'noticeboard' && isNoticeBoardActive) {
        toggleNoticeBoardView();
    }
    currentChatMode = mode;
    const tabs = document.querySelectorAll('.chat-tab-btn');
    tabs.forEach(tab => {
        if (tab.id === `tab-${mode.replace(':', '-')}`) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    if (mode === 'lounge') {
        chatBox.innerHTML = "";
        loadMessages();
    } else if (mode.startsWith('dm:')) {
        const otherUser = mode.substring(3);
        loadPrivateMessages(otherUser);
    }
    renderChatTabs();
}

function openPrivateChatTab(username) {
    if (!activeDMTabs.includes(username)) {
        activeDMTabs.push(username);
    }
    renderChatTabs();
    switchChatMode(`dm:${username}`);
}

function closeChatTab(username, event) {
    if (event) event.stopPropagation();
    activeDMTabs = activeDMTabs.filter(u => u !== username);
    renderChatTabs();
    if (currentChatMode === `dm:${username}`) {
        switchChatMode('lounge');
    }
}

function togglePasskeyVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = (input.type === "password") ? "text" : "password";
}

function renderChatTabs() {
    const tabsBar = document.getElementById('chatTabsBar');
    if (!tabsBar) return;
    
    const isLounge = currentChatMode === 'lounge' && !isNoticeBoardActive && !document.body.classList.contains('chat-is-fullscreen');
    const isNotice = isNoticeBoardActive;
    const isFS = document.body.classList.contains('chat-is-fullscreen') && !isNoticeBoardActive;
    const fsText = document.body.classList.contains('chat-is-fullscreen') ? "Exit Fullscreen" : "Maximize Chat";
    
    tabsBar.innerHTML = `
        <div class="chat-tab-btn ${isLounge ? 'active' : ''}" id="tab-lounge" onclick="handleLoungeTab()">Lounge</div>
        <div class="chat-tab-btn ${isNotice ? 'active' : ''}" id="tab-noticeboard" onclick="handleNoticeboardTab()">Noticeboard</div>
        <div class="chat-tab-btn ${isFS ? 'active' : ''}" id="tab-maximize" onclick="handleMaximizeTab()">${fsText}</div>
    `;
    
    activeDMTabs.forEach(username => {
        const isActive = currentChatMode === `dm:${username}`;
        tabsBar.innerHTML += `
            <div class="chat-tab-btn ${isActive ? 'active' : ''}" id="tab-dm-${username}" onclick="switchChatMode('dm:${username}')">
                @${username}
                <span class="close-tab" onclick="closeChatTab('${username}', event)">×</span>
            </div>
        `;
    });
}

function handleLoungeTab() {
    if (isNoticeBoardActive) {
        toggleNoticeBoardView();
    }
    if (document.body.classList.contains('chat-is-fullscreen')) {
        document.body.classList.remove('chat-is-fullscreen');
        anchorChatToBottom();
    }
    switchChatMode('lounge');
    renderChatTabs();
}

function handleNoticeboardTab() {
    if (!isNoticeBoardActive) {
        toggleNoticeBoardView();
    }
    renderChatTabs();
}

function handleMaximizeTab() {
    if (isNoticeBoardActive) {
        toggleNoticeBoardView();
    }
    toggleChatFullscreen();
    renderChatTabs();
}

function openPrivacyModal() {
    const modal = document.getElementById('privacy-overlay');
    if (modal) modal.classList.add('active');
}

function closePrivacyModal() {
    const modal = document.getElementById('privacy-overlay');
    if (modal) modal.classList.remove('active');
}

function acceptCookieConsent() {
    localStorage.setItem('tellstream_cookie_consent', 'true');
    const banner = document.getElementById('cookie-consent-banner');
    if (banner) banner.classList.remove('active');
}

function renderFambilyList() {
    const container = document.getElementById('fambilyListContainer');
    if (!container) return;
    
    container.innerHTML = "";
    
    const fambilyKeys = Object.keys(relationshipMap).filter(u => relationshipMap[u].status === 'fambily');
    if (fambilyKeys.length === 0) {
        container.innerHTML = `<p style="font-size:0.75rem; color:#666; text-align:center; padding:10px;">No Fambily members added yet.</p>`;
        return;
    }
    
    fambilyKeys.forEach(user => {
        const isOnline = !!onlineUsers[user];
        const avatarUrl = profilesCache[user]?.avatar_url || '';
        const avatarSrc = avatarUrl || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23444'/><text x='50' y='60' font-size='30' font-family='sans-serif' text-anchor='middle' fill='%23fff'>?</text></svg>";
        
        const profile = profilesCache[user];
        let nameClass = "user-unregistered";
        if (profile) {
            const pLevel = parseInt(profile.power_level || 0);
            if (pLevel >= 2) nameClass = "user-admin";
            else if (pLevel === 1) nameClass = "user-selector";
            else nameClass = "user-registered";
        }
        
        const item = document.createElement('div');
        item.className = "drawer-list-item";
        item.innerHTML = `
            <div class="drawer-item-left" style="cursor:pointer;" onclick="openProfileCard('${user}')">
                <div class="online-user-avatar-wrapper">
                    <img src="${avatarSrc}" class="drawer-item-avatar">
                    \${isOnline ? '<span class="status-badge online"></span>' : ''}
                </div>
                <span class="\${nameClass}">\${user}</span>
            </div>
            <div class="drawer-item-actions">
                <button class="drawer-action-inline-btn btn-green" onclick="openPrivateChatTab('\${user}')">Message</button>
                <button class="drawer-action-inline-btn btn-red" onclick="removeRelationshipAndRefresh('\${user}')">Remove</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function renderRequestsList() {
    const incomingContainer = document.getElementById('incomingReqsContainer');
    const outgoingContainer = document.getElementById('outgoingReqsContainer');
    if (!incomingContainer || !outgoingContainer) return;
    
    incomingContainer.innerHTML = "";
    outgoingContainer.innerHTML = "";
    
    const incoming = [];
    const outgoing = [];
    const currentUser = usernameInput.value.trim();
    
    Object.keys(relationshipMap).forEach(user => {
        const rel = relationshipMap[user];
        if (rel.status === 'request') {
            if (rel.receiver === currentUser) incoming.push(user);
            else outgoing.push(user);
        }
    });
    
    if (incoming.length === 0) {
        incomingContainer.innerHTML = `<p style="font-size:0.75rem; color:#666; text-align:center; padding:5px;">No incoming requests.</p>`;
    } else {
        incoming.forEach(user => {
            const item = document.createElement('div');
            item.className = "drawer-list-item";
            item.innerHTML = `
                <span>\${user}</span>
                <div class="drawer-item-actions">
                    <button class="drawer-action-inline-btn btn-green" onclick="acceptFambilyRequestFrom('\${user}')">Accept</button>
                    <button class="drawer-action-inline-btn btn-red" onclick="ignoreFambilyRequestFrom('\${user}')">Ignore</button>
                </div>
            `;
            incomingContainer.appendChild(item);
        });
    }
    
    if (outgoing.length === 0) {
        outgoingContainer.innerHTML = `<p style="font-size:0.75rem; color:#666; text-align:center; padding:5px;">No sent requests.</p>`;
    } else {
        outgoing.forEach(user => {
            const item = document.createElement('div');
            item.className = "drawer-list-item";
            item.innerHTML = `
                <span>\${user}</span>
                <div class="drawer-item-actions">
                    <button class="drawer-action-inline-btn btn-red" onclick="cancelFambilyRequestTo('\${user}')">Cancel</button>
                </div>
            `;
            outgoingContainer.appendChild(item);
        });
    }
}

function renderBlockedList() {
    const container = document.getElementById('blockedListContainer');
    if (!container) return;
    
    container.innerHTML = "";
    const currentUser = usernameInput.value.trim();
    const blockedKeys = Object.keys(relationshipMap).filter(u => relationshipMap[u].status === 'blocked' && relationshipMap[u].sender === currentUser);
    
    if (blockedKeys.length === 0) {
        container.innerHTML = `<p style="font-size:0.75rem; color:#666; text-align:center; padding:10px;">No blocked users.</p>`;
        return;
    }
    
    blockedKeys.forEach(user => {
        const item = document.createElement('div');
        item.className = "drawer-list-item";
        item.innerHTML = `
            <span>\${user}</span>
            <div class="drawer-item-actions">
                <button class="drawer-action-inline-btn btn-green" onclick="unblockUserAndRefresh('\${user}')">Unblock</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function renderOnlineUsersList() {
    const container = document.getElementById('onlineUsersList');
    if (!container) return;
    
    container.innerHTML = "";
    
    const users = Object.keys(onlineUsers);
    const currentUser = usernameInput.value.trim();
    
    const visibleUsers = users.filter(user => {
        if (user === currentUser) return false;
        const rel = relationshipMap[user];
        if (rel && rel.status === 'blocked') return false;
        return true;
    });
    
    if (visibleUsers.length === 0) {
        container.innerHTML = `<p style="font-size:0.75rem; color:#666; text-align:center; padding:10px;">No other users online.</p>`;
        return;
    }
    
    visibleUsers.forEach(user => {
        const info = onlineUsers[user];
        const avatarUrl = info.avatar_url || profilesCache[user]?.avatar_url || '';
        const avatarSrc = avatarUrl || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23444'/><text x='50' y='60' font-size='30' font-family='sans-serif' text-anchor='middle' fill='%23fff'>?</text></svg>";
        
        const profile = profilesCache[user];
        let nameClass = "user-unregistered";
        if (profile) {
            const pLevel = parseInt(profile.power_level || 0);
            if (pLevel >= 2) nameClass = "user-admin";
            else if (pLevel === 1) nameClass = "user-selector";
            else nameClass = "user-registered";
        }
        
        const item = document.createElement('div');
        item.className = "online-user-item";
        item.onclick = () => openProfileCard(user);
        item.innerHTML = `
            <div class="drawer-item-left">
                <div class="online-user-avatar-wrapper">
                    <img src="\${avatarSrc}" class="online-user-avatar">
                    <span class="status-badge online"></span>
                </div>
                <span class="\${nameClass}">\${user}</span>
            </div>
        `;
        container.appendChild(item);
    });
}

async function loadPrivateMessages(otherUser) {
    const currentUser = usernameInput.value.trim();
    chatBox.innerHTML = "";
    
    const rel = relationshipMap[otherUser];
    const checkBlocked = await checkBlockedStatus(currentUser, otherUser);
    
    if (checkBlocked) {
        const systemDiv = document.createElement('div');
        systemDiv.className = 'msg-system';
        systemDiv.innerText = "⚠️ Unable to load chat history. You have been blocked or have blocked this user.";
        chatBox.appendChild(systemDiv);
        return;
    }

    if (!rel || rel.status === 'request') {
        const requestDiv = document.createElement('div');
        requestDiv.style = "background:rgba(34,229,50,0.05); border:1px solid rgba(34,229,50,0.2); border-radius:8px; padding:15px; text-align:center; margin:15px; color:#ccc; font-size:0.8rem;";
        
        if (rel && rel.receiver === currentUser) {
            requestDiv.innerHTML = `
                <p style="margin-bottom:10px;"><b>\${otherUser}</b> sent you a Fambily request to chat privately.</p>
                <div style="display:flex; gap:6px; justify-content:center;">
                    <button class="drawer-action-inline-btn btn-green" onclick="acceptFambilyRequestFrom('\${otherUser}')">Accept & Chat</button>
                    <button class="drawer-action-inline-btn btn-red" onclick="ignoreFambilyRequestFrom('\${otherUser}')">Ignore</button>
                </div>
            `;
        } else {
            requestDiv.innerHTML = `
                <p>Waiting for <b>\${otherUser}</b> to accept your Fambily request...</p>
                <button class="drawer-action-inline-btn btn-red" style="margin-top:6px;" onclick="cancelFambilyRequestTo('\${otherUser}')">Cancel Request</button>
            `;
        }
        chatBox.appendChild(requestDiv);
        return;
    }

    try {
        const { data, error } = await supabase_db.from('private_messages')
            .select('*')
            .or(`and(sender.eq.\${currentUser},receiver.eq.\${otherUser}),and(sender.eq.\${otherUser},receiver.eq.\${currentUser})`)
            .order('id', { ascending: false })
            .limit(40);
            
        if (data && !error) {
            data.reverse().forEach(appendPrivateMessage);
            anchorChatToBottom();
        }
    } catch(e) {
        console.error(e);
    }
}

function appendPrivateMessage(msg) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg';
    let messageContent = escapeHTML(msg.message);

    messageContent = messageContent.replace(/:([a-zA-Z0-9_-]+):/g, (match, code) => {
        const lowerCode = code.toLowerCase();
        if (window.emojiMapping && window.emojiMapping[lowerCode]) {
            return `<img src="\${imgBaseUrl}\${window.emojiMapping[lowerCode]}" alt="\${code}" style="max-height: 48px; vertical-align: middle; margin: 2px; border-radius: 4px;">`;
        }
        return match;
    });

    const profile = profilesCache[msg.sender];
    let nameClass = "user-unregistered";
    let hoverAttribute = "";

    if (profile) {
        const pLevel = parseInt(profile.power_level || 0);
        if (pLevel >= 2) nameClass = "user-admin";
        else if (pLevel === 1) nameClass = "user-selector";
        else nameClass = "user-registered";
        if (profile.hover_title) hoverAttribute = `title="\${escapeHTML(profile.hover_title)}"`;
    }

    msgDiv.innerHTML = `<div class="user \${nameClass}" \${hoverAttribute} style="cursor:pointer;" onclick="openProfileCard('\${escapeHTML(msg.sender)}')">\${escapeHTML(msg.sender)}</div><div>\${messageContent}</div>`;
    chatBox.appendChild(msgDiv);
    anchorChatToBottom();
    while (chatBox.children.length > 50) chatBox.removeChild(chatBox.firstChild);
}

// SECURE TIMETABLE REALTIME EVENT LISTENERS
try {
    supabase_db.channel('public:master_schedule').on('postgres_changes', { event: '*', pattern: 'public', table: 'master_schedule' }, () => { fetchAndRenderWeeklyTimetable(); }).subscribe();
    supabase_db.channel('public:temporary_overrides').on('postgres_changes', { event: '*', pattern: 'public', table: 'temporary_overrides' }, () => { fetchAndRenderWeeklyTimetable(); }).subscribe();
} catch (e) { console.log("Realtime schedule subscription delayed:", e.message); }

// Emoji modal overlay functions & pagination
let currentEmojiPage = 1;
const EMOJIS_PER_PAGE = 100;

function openEmojiModal() {
    const modal = document.getElementById('emoji-overlay-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.offsetHeight; // force reflow
        modal.classList.add('active');
        
        const searchInput = document.getElementById('emojiSearchInput');
        if (searchInput) {
            searchInput.value = '';
            setTimeout(() => searchInput.focus(), 100);
        }
        
        currentEmojiPage = 1;
        renderEmojiModalGrid('');
    }
}

function closeEmojiModal() {
    const modal = document.getElementById('emoji-overlay-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            if (!modal.classList.contains('active')) {
                modal.style.display = 'none';
            }
        }, 250);
    }
}

function renderEmojiModalGrid(searchTerm = '') {
    const gridContainer = document.getElementById('emojiModalGridContainer');
    const paginationContainer = document.getElementById('emojiModalPagination');
    if (!gridContainer || !window.emojiMapping) return;
    
    const allKeys = Object.keys(window.emojiMapping);
    const normalizedSearch = searchTerm.toLowerCase().trim();
    
    const filteredKeys = allKeys.filter(key => key.toLowerCase().includes(normalizedSearch));
    const totalItems = filteredKeys.length;
    
    if (totalItems === 0) {
        gridContainer.innerHTML = `<div style="grid-column: 1 / -1; color: #666; font-size: 0.95rem; text-align: center; margin-top: 40px; font-weight: 500;">No emojis found matching "${escapeHTML(searchTerm)}"</div>`;
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    const totalPages = Math.ceil(totalItems / EMOJIS_PER_PAGE);
    // Clamp current page to valid bounds
    if (currentEmojiPage > totalPages) currentEmojiPage = totalPages;
    if (currentEmojiPage < 1) currentEmojiPage = 1;
    
    const startIndex = (currentEmojiPage - 1) * EMOJIS_PER_PAGE;
    const endIndex = Math.min(startIndex + EMOJIS_PER_PAGE, totalItems);
    const pageKeys = filteredKeys.slice(startIndex, endIndex);
    
    const html = pageKeys.map(key => {
        const filename = window.emojiMapping[key];
        return `
            <div class="emoji-modal-card" onclick="insertEmojiCodeFromModal('${key}')">
                <img src="${imgBaseUrl}${filename}" alt="${key}" loading="lazy">
                <span>:${key}:</span>
            </div>
        `;
    }).join('');
    
    gridContainer.innerHTML = html;
    
    // Render pagination controls
    if (paginationContainer) {
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
        } else {
            paginationContainer.innerHTML = `
                <button onclick="changeEmojiPage(-1)" ${currentEmojiPage === 1 ? 'disabled' : ''} 
                    class="emoji-page-btn">← Previous</button>
                <span style="font-size: 0.9rem; color: #aaa; font-weight: 500;">Page <strong>${currentEmojiPage}</strong> of <strong>${totalPages}</strong></span>
                <button onclick="changeEmojiPage(1)" ${currentEmojiPage === totalPages ? 'disabled' : ''} 
                    class="emoji-page-btn">Next →</button>
            `;
        }
    }
}

function changeEmojiPage(direction) {
    currentEmojiPage += direction;
    const searchInput = document.getElementById('emojiSearchInput');
    const searchTerm = searchInput ? searchInput.value : '';
    renderEmojiModalGrid(searchTerm);
    
    // Scroll modal grid back to top when page changes
    const gridContainer = document.getElementById('emojiModalGridContainer');
    if (gridContainer) gridContainer.scrollTop = 0;
}

function filterEmojiModal() {
    const searchInput = document.getElementById('emojiSearchInput');
    currentEmojiPage = 1;
    if (searchInput) {
        renderEmojiModalGrid(searchInput.value);
    }
}

function insertEmojiCodeFromModal(code) {
    if (typeof insertEmojiCode === 'function') {
        insertEmojiCode(code);
    } else {
        messageInput.value += ` :${code}: `;
        messageInput.focus();
    }
}

// Expose functions to global window scope for inline onclick/oninput event handlers in index.html
window.toggleAccordion = toggleAccordion;
window.openScheduleGrid = openScheduleGrid;
window.closeScheduleGrid = closeScheduleGrid;
window.openEmojiModal = openEmojiModal;
window.closeEmojiModal = closeEmojiModal;
window.filterEmojiModal = filterEmojiModal;
window.insertEmojiCodeFromModal = insertEmojiCodeFromModal;
window.changeEmojiPage = changeEmojiPage;

window.toggleNoticeBoardView = toggleNoticeBoardView;
window.toggleChatFullscreen = toggleChatFullscreen;
window.handleSecuritySubmit = handleSecuritySubmit;
window.toggleForgotPasskeyForm = toggleForgotPasskeyForm;
window.sendResetVerificationCode = sendResetVerificationCode;
window.verifyAndResetPasskey = verifyAndResetPasskey;
window.submitNoticeUpdate = submitNoticeUpdate;
window.toggleSecurityDrawer = toggleSecurityDrawer;
window.closeFlyerLightbox = closeFlyerLightbox;
window.launchFlyerLightbox = launchFlyerLightbox;
window.insertEmojiCode = insertEmojiCode;
window.syncDrawerName = syncDrawerName;

window.toggleFambilyDrawer = toggleFambilyDrawer;
window.switchFambilyTab = switchFambilyTab;
window.saveProfileChanges = saveProfileChanges;
window.sendFambilyRequest = sendFambilyRequest;
window.acceptFambilyRequestFrom = acceptFambilyRequestFrom;
window.ignoreFambilyRequestFrom = ignoreFambilyRequestFrom;
window.cancelFambilyRequestTo = cancelFambilyRequestTo;
window.removeRelationshipAndRefresh = removeRelationshipAndRefresh;
window.unblockUserAndRefresh = unblockUserAndRefresh;
window.revealBlockedList = revealBlockedList;
window.hideBlockedList = hideBlockedList;
window.openProfileCard = openProfileCard;
window.closeProfileCard = closeProfileCard;
window.handleAvatarSelected = handleAvatarSelected;
window.switchChatMode = switchChatMode;
window.closeChatTab = closeChatTab;
window.togglePasskeyVisibility = togglePasskeyVisibility;
window.openPrivacyModal = openPrivacyModal;
window.closePrivacyModal = closePrivacyModal;
window.acceptCookieConsent = acceptCookieConsent;
window.handleLoungeTab = handleLoungeTab;
window.handleNoticeboardTab = handleNoticeboardTab;
window.handleMaximizeTab = handleMaximizeTab;

function initLogoAnimation() {
    const minFrame = 25;
    const maxFrame = 74;
    const pathPrefix = "src/assets/logo_anim/1_0100";
    const pathSuffix = ".png";
    const imgElement = document.getElementById("headerLogoAnim");
    if (!imgElement) return;

    // Helper to format frame path
    function getFramePath(frameNum) {
        return `${pathPrefix}${frameNum}${pathSuffix}`;
    }

    // Pick a random starting frame between 40 and 51
    let currentFrame = Math.floor(Math.random() * (51 - 40 + 1)) + 40;
    imgElement.src = getFramePath(currentFrame);

    // Keep references in a persistent array to prevent garbage collection of decoded images
    const preloadedImages = [];
    
    // Track animation references to clean up timers/intervals
    let animationFrameId = null;
    let timeoutId = null;

    function runAnimationSequence() {
        // Pick a random target stop frame between 40 and 51
        const targetFrame = Math.floor(Math.random() * (51 - 40 + 1)) + 40;
        
        // Pre-calculate the exact number of frames to play
        // We run 3 full rotations (3 * 50 frames) plus the offset frames to targetFrame
        const totalFramesPerRotation = (maxFrame - minFrame + 1); // 50 frames
        
        let stepsToTarget = 0;
        let tempFrame = currentFrame;
        while (tempFrame !== targetFrame || stepsToTarget < (3 * totalFramesPerRotation)) {
            tempFrame++;
            if (tempFrame > maxFrame) {
                tempFrame = minFrame;
            }
            stepsToTarget++;
        }

        const totalSteps = stepsToTarget;
        let stepsPlayed = 0;
        let lastFrameTime = performance.now();
        const frameInterval = 1000 / 30; // ~33.33ms per frame (30 FPS)

        function tick(now) {
            const elapsed = now - lastFrameTime;

            if (elapsed >= frameInterval) {
                // Adjust lastFrameTime for potential drift
                lastFrameTime = now - (elapsed % frameInterval);

                currentFrame++;
                if (currentFrame > maxFrame) {
                    currentFrame = minFrame;
                }
                
                // Swap image source (uses the cached/referenced image if available)
                const cachedImg = preloadedImages[currentFrame - minFrame];
                imgElement.src = cachedImg ? cachedImg.src : getFramePath(currentFrame);
                stepsPlayed++;

                if (stepsPlayed >= totalSteps) {
                    // Stop animation and schedule next run
                    if (animationFrameId) {
                        cancelAnimationFrame(animationFrameId);
                        animationFrameId = null;
                    }
                    timeoutId = setTimeout(runAnimationSequence, 3000);
                    return;
                }
            }

            animationFrameId = requestAnimationFrame(tick);
        }

        // Cancel any existing animation frame just in case
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(tick);
    }

    // Preload all frames to memory using Promises, keeping references
    const loadPromises = [];
    for (let i = minFrame; i <= maxFrame; i++) {
        const p = new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = getFramePath(i);
            preloadedImages[i - minFrame] = img; // Hold reference permanently in correct index order
        });
        loadPromises.push(p);
    }

    Promise.all(loadPromises).then(() => {
        console.log("All logo animation frames preloaded successfully.");
        // Initial pause of 3 seconds on the starting frame starts *after* preloading is complete
        timeoutId = setTimeout(runAnimationSequence, 3000);
    });
}

function updateWebVersionFooter() {
    const el = document.getElementById('header-copyright');
    if (!el) return;
    el.innerHTML = `© 2026 <a href="https://www.tellstream.org" target="_blank" style="color:inherit; text-decoration:none;">www.tellstream.org</a> WebVer 1.0951 | <a href="#" id="privacy-link" onclick="event.preventDefault(); openPrivacyModal();" style="color:#22e532; text-decoration:none; font-weight:bold; cursor:pointer;">Privacy Policy</a>`;
}

(async function initSystem() {
    // 1. Core Lounge Operations (Cannot be affected by outside scripts)
    try { updateWebVersionFooter(); } catch (e) { }
    try { await syncProfilesMap(); } catch (e) { }
    try { await verifyCurrentSession(); } catch (e) { }
    try { await syncBannedWordsMap(); } catch (e) { }
    try { await syncBannedUsersMap(); } catch (e) { }
    try { await loadMessages(); } catch (e) { }
    try { await loadInitialStreamStatus(); } catch (e) { }
    try { initLogoAnimation(); } catch (e) { }

    renderHelpContent(false);
    try { renderChatTabs(); } catch (e) { }

    // Check Cookie Consent
    setTimeout(() => {
        if (!localStorage.getItem('tellstream_cookie_consent')) {
            const banner = document.getElementById('cookie-consent-banner');
            if (banner) banner.classList.add('active');
        }
    }, 1000);

    try { await renderActiveFlyers(); } catch (e) { }
    setTimeout(initQuickEmojiCloud, 500);

    const hiddenInputFileTag = document.createElement('input');
    hiddenInputFileTag.type = 'file';
    hiddenInputFileTag.id = 'studioLogoHiddenFilePicker';
    hiddenInputFileTag.accept = 'image/png';
    hiddenInputFileTag.style.display = 'none';
    document.body.appendChild(hiddenInputFileTag);

    hiddenInputFileTag.addEventListener('change', async function (e) {
        const file = e.target.files[0];
        if (!file || !pendingLogoTargetName) return;
        try {
            const uploadFileName = `${pendingLogoTargetName}.png`;
            const { error } = await supabase_db.storage.from('dj-logos').upload(uploadFileName, file, { upsert: true });
            if (error) throw error;
            alert(`✅ Success! Transparent logo saved for: "${pendingLogoTargetName.replace(/_/g, ' ')}"`);
            await loadInitialStreamStatus();
        } catch (err) {
            alert("Cloud Upload Failure: " + err.message);
        } finally {
            hiddenInputFileTag.value = '';
            pendingLogoTargetName = "";
        }
    });

    const hiddenFlyerInputFileTag = document.createElement('input');
    hiddenFlyerInputFileTag.type = 'file';
    hiddenFlyerInputFileTag.id = 'studioFlyerHiddenFilePicker';
    hiddenFlyerInputFileTag.accept = 'image/*';
    hiddenFlyerInputFileTag.style.display = 'none';
    document.body.appendChild(hiddenFlyerInputFileTag);

    hiddenFlyerInputFileTag.addEventListener('change', async function (e) {
        const file = e.target.files[0];
        if (!file || !pendingFlyerTargetName) return;
        try {
            const originalName = file.name;
            const extIndex = originalName.lastIndexOf('.');
            const extension = extIndex !== -1 ? originalName.substring(extIndex + 1).toLowerCase() : 'jpg';

            const uploadFileName = `${pendingFlyerTargetName}.${extension}`;
            const { error } = await supabase_db.storage.from('flyers').upload(uploadFileName, file, { cacheControl: '3600', upsert: true });
            if (error) throw error;
            alert(`✅ Success! Flyer uploaded successfully: "${uploadFileName}"`);
            await renderActiveFlyers();
        } catch (err) {
            alert("Cloud Upload Failure: " + err.message);
        } finally {
            hiddenFlyerInputFileTag.value = '';
            pendingFlyerTargetName = "";
        }
    });

    const currentUser = usernameInput.value.trim();
    syncDrawerName();

    setTimeout(async () => {
        const authorizedKey = localStorage.getItem('tellstream_key_' + currentUser);
        let isLoggedIn = false;
        if (currentUser && authorizedKey) {
            try {
                const { data, error } = await supabase_db.rpc('verify_user_passkey', {
                    p_username: currentUser,
                    p_passkey: authorizedKey
                });
                isLoggedIn = !error && data;
            } catch (e) {
                isLoggedIn = false;
            }
        }
        const mainBody = "Greetings and welcome to Tellstream Chat. Please help keep this experience a positive blessing for one and all. Remember, at any time, users may have children around them. Bad blessings will be removed. One love from Tellstream.";

        if (isLoggedIn) {
            localStorage.setItem('tellstream_active_user', currentUser);
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
            localStorage.removeItem('tellstream_active_user');
            appendPrivateWelcomeGreeting(mainBody);
        }
    }, 200);

    // ROBUST LIVE AUDIO STREAM AUTO-RECOVERY WATCHDOG
    setTimeout(() => {
        const player = document.getElementById('radioPlayer');
        if (!player) return;

        let stallCheckInterval = null;
        let lastTime = 0;
        let stalledCount = 0;

        function isStreamActive() {
            return player.src && player.src.includes('radio.mp3') && player.src !== window.location.href;
        }

        function startStallCheck() {
            if (stallCheckInterval) clearInterval(stallCheckInterval);
            lastTime = player.currentTime;
            stalledCount = 0;
            stallCheckInterval = setInterval(() => {
                if (player.paused || !isStreamActive()) return;

                if (player.currentTime === lastTime) {
                    stalledCount++;
                    console.log(`[Stream Watchdog] Stalled count: ${stalledCount}/6`);
                    if (stalledCount >= 6) { // ~6 seconds of unchanged time
                        console.log("[Stream Watchdog] Stream stalled. Triggering auto-recovery...");
                        recoverStream();
                    }
                } else {
                    stalledCount = 0;
                    lastTime = player.currentTime;
                }
            }, 1000);
        }

        function stopStallCheck() {
            if (stallCheckInterval) {
                clearInterval(stallCheckInterval);
                stallCheckInterval = null;
            }
        }

        function recoverStream() {
            if (player.paused || !isStreamActive()) return;
            const currentSrc = "https://a3.asurahosting.com/listen/tellstream/radio.mp3";
            console.log("[Stream Watchdog] Reloading stream source:", currentSrc);
            
            // Unbind pause listener temporarily to avoid state sync trigger on clear
            player.removeEventListener('pause', stopStallCheck);
            
            player.pause();
            player.removeAttribute('src');
            player.load();

            setTimeout(() => {
                if (player.paused) {
                    player.addEventListener('pause', stopStallCheck);
                    return;
                }
                player.src = currentSrc;
                player.load();
                player.play().then(() => {
                    console.log("[Stream Watchdog] Stream successfully recovered and playing.");
                    stalledCount = 0;
                    lastTime = player.currentTime;
                    player.addEventListener('pause', stopStallCheck);
                }).catch(err => {
                    console.warn("[Stream Watchdog] Playback recovery resume failed, will retry on next check:", err);
                    player.addEventListener('pause', stopStallCheck);
                });
            }, 1000);
        }

        player.addEventListener('play', startStallCheck);
        player.addEventListener('pause', stopStallCheck);

        player.addEventListener('error', (e) => {
            if (player.paused || !isStreamActive()) return;
            console.error("[Stream Watchdog] Audio element error event detected:", e);
            setTimeout(() => {
                recoverStream();
            }, 3000);
        });

        player.addEventListener('ended', () => {
            if (player.paused || !isStreamActive()) return;
            console.log("[Stream Watchdog] Audio ended event detected. Recovering...");
            recoverStream();
        });

        if (!player.paused && isStreamActive()) {
            startStallCheck();
        }
    }, 2000);

    // 2. Auxiliary column scripts load at the ultimate tail of execution
    try { await renderSiteNewsFeed(); } catch (e) { }
    try { await fetchAndRenderWeeklyTimetable(); } catch (e) { }
})();
