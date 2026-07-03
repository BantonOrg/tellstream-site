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

let pendingLogoTargetName = "";

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

const djHelpInstructions = [
    { title: "⚠️ Notice", text: "If you are unsure how to use these controls, ask management for guidance before typing them. It is easy once you understand, but you need to know what you are doing so it stays simple for everyone." },
    { title: "🎛️ /show live", text: "Example: /show live \nWhat it does: Shows that YOU are now live on air." },
    { title: "🔄 /show tellstream", text: "Example: /show tellstream \nWhat it does: Shows Tellstream Autopilot as Live again. Only do this if you are last for the day." },
    { title: "🗓️ /schedule perm [Day] [Start Time] [End Time] [Time Zone]", text: "Example: /schedule perm Friday 2000 2200 BST \nWhat it does: Locks weekly show detail in permanently." },
    { title: "🚨 /schedule temp [ddmmyy] [Start Time] [End Time] [Time Zone]", text: "Example: /schedule temp 100726 2000 2200 BST \nWhat it does: Adds a one-off temporary change for a specific date." },
    { title: "❌ /schedule cancel [ddmmyy] [Start Time]", text: "Example: /schedule cancel 100726 2000 \nWhat it does: Cancels a show already added (perm or temp)." },
    { title: "🖼️ /upload [Name] & /delete [Name]", text: "Example: /upload Big John \nWhat it does: Manages transparent PNG logo assets in the cloud." },
    { title: "⚔️ Moderation Shortcuts", text: "/add [word], /del [word], /unban [username], or /listwords to manage filters live." }
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
        logoImg.style.height = 'auto'; 
        logoImg.style.display = 'none';      
        cellLeft.appendChild(logoImg);
    }

    if (!display) {
        display = document.createElement('p');
        display.id = 'stream-name-display';
        display.style.color = '#ffffff'; 
        display.style.fontSize = '1.1rem';
        display.style.fontWeight = '900'; 
        display.style.webkitTextStroke = '1.8px #000000'; 
        display.style.textShadow = '3px 3px 6px rgba(0, 0, 0, 0.95), -2px -2px 4px rgba(0, 0, 0, 0.8)';        display.style.textTransform = 'uppercase';
        display.style.lineHeight = '1.2';
        display.style.maxWidth = '95%';
        display.style.textAlign = 'center';
        cellLeft.appendChild(display);
    }
    
    if (showName) {
        const cleanName = showName.trim();
        const safeFileName = cleanName.toLowerCase().replace(/\s+/g, '_') + '.png';
        
        const { data } = supabase_db.storage.from('dj-logos').getPublicUrl(safeFileName);
        const imgCloudUrl = data.publicUrl;

        const imageProbe = new Image();
        imageProbe.src = imgCloudUrl;

        imageProbe.onload = function() {
            if (wrapper) {
                wrapper.querySelectorAll('h1, p').forEach(el => el.style.display = 'none');
            }
            cellLeft.style.position = 'relative';
            cellLeft.style.height = 'auto'; 
            
            logoImg.src = imgCloudUrl;
            logoImg.style.position = 'relative'; 
            logoImg.style.display = 'block';

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

        imageProbe.onerror = function() {
            logoImg.style.display = 'none';
            logoImg.style.position = 'absolute';
            cellLeft.style.height = ''; 
            
            if (wrapper) {
                wrapper.querySelectorAll('h1, p').forEach(el => el.style.display = 'block');
                if (display.parentElement !== wrapper) {
                    wrapper.appendChild(display);
                }
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
    
    usernameInput.addEventListener('input', () => {
        localStorage.setItem('tellstream_saved_username', usernameInput.value.trim());
        syncDrawerName();
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

async function renderSiteNewsFeed() {
    if (!fbFeedContainer) return;
    try {
        const colHeader = fbFeedContainer.previousElementSibling;
        if (colHeader && (colHeader.innerText.includes("Facebook") || colHeader.querySelector('a'))) {
            colHeader.style.display = 'flex';
            colHeader.style.justifyContent = 'space-between';
            colHeader.style.alignItems = 'center';
            colHeader.style.width = '100%';
            colHeader.innerHTML = `
                <span>📰 Site News</span>
                <a href="https://www.facebook.com/tellstream.dem" target="_blank" style="display: flex; align-items: center; transition: opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2" style="display: block;">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                </a>
            `;
        }
        
        const { data: records, error } = await supabase_db
            .from('notice_board')
            .select('*')
            .in('board_type', ['boss', 'selectors'])
            .order('created_at', { ascending: false })
            .limit(12);

        if (error || !records || records.length === 0) {
            fbFeedContainer.innerHTML = `
                <p style="color:#666; text-align:center; padding-top:20px; font-style:italic;">No station notices posted.</p>
                <div class="fb-post-card" style="text-align:center; margin-top:15px; cursor:pointer; border-left:4px solid #ffdd1a;" onclick="toggleNoticeBoardView();">
                    <div class="fb-post-text" style="font-weight:bold; color:#ffdd1a;">📋 OPEN NOTICEBOARD HISTORY</div>
                </div>
            `;
            return;
        }

        let html = records.map(item => {
            const isBoss = item.board_type === 'boss';
            const badgeColor = isBoss ? '#ff3333' : '#ffdd1a';
            const badgeText = isBoss ? 'STATION ADMIN' : 'DJ SELECTOR';
            return `
                <div class="fb-post-card" style="border-left: 4px solid ${badgeColor}; margin-bottom: 12px;">
                    <div class="fb-post-meta" style="color: ${badgeColor}; font-weight: bold;">
                        👑 ${escapeHTML(item.username)} • <span style="font-size:0.75rem; opacity:0.8;">${badgeText}</span>
                    </div>
                    <div class="fb-post-text" style="color: #e0f2f1; margin-top: 5px; line-height: 1.4;">
                        ${escapeHTML(item.notice_text)}
                    </div>
                </div>
            `;
        }).join('');

        html += `
            <div class="fb-post-card" style="text-align:center; margin-top:20px; cursor:pointer; background: rgba(255,221,26,0.05); border: 1px dashed #ffdd1a;" onclick="toggleNoticeBoardView();">
                <div class="fb-post-text" style="font-weight:bold; color:#ffdd1a; font-size:0.9rem;">
                    📋 VIEW FULL NOTICEBOARD HISTORY
                </div>
            </div>
        `;
        fbFeedContainer.innerHTML = html;
    } catch (e) { console.error(e); }
}

// CENTRALIZED PARSER FOR ZERO-SLASH STAFF TRANSMISSION SCHEDULE ACTIONS
async function processScheduleConsoleInjections(text, djUser) {
    const args = text.trim().split(/\s+/);
    const action = args[1]?.toLowerCase();

    if (action === 'perm') {
        const dayName = args[2];
        const startTime = args[3];
        const endTime = args[4];
        const timeZone = args[5];

        if (!dayName || !startTime || !endTime || !timeZone) {
            alert("Format missing. Use: /schedule perm [Day] [Start Time] [End Time] [Time Zone]");
            return;
        }

        const { error } = await supabase_db.from('master_schedule').upsert([{
            day_of_week: dayName.toLowerCase(),
            start_time: startTime,
            end_time: endTime,
            time_zone: timeZone.toUpperCase(),
            dj_name: djUser
        }], { onConflict: 'day_of_week,start_time' });

        if (error) console.error("Database master schedule record failure:", error.message);
    } 
    else if (action === 'temp') {
        const dateBlock = args[2]; 
        const startTime = args[3];
        const endTime = args[4];
        const timeZone = args[5];

        if (!dateBlock || !startTime || !endTime || !timeZone || dateBlock.length !== 6) {
            alert("Format missing. Use a strict 6-digit date: /schedule temp [ddmmyy] [Start Time] [End Time] [Time Zone]");
            return;
        }

        const { error } = await supabase_db.from('temporary_overrides').upsert([{
            specific_date: dateBlock,
            start_time: startTime,
            end_time: endTime,
            time_zone: timeZone.toUpperCase(),
            dj_name: djUser,
            is_cancelled: false
        }], { onConflict: 'specific_date,start_time' });

        if (error) console.error("Database temporary override record failure:", error.message);
    } 
    else if (action === 'cancel') {
        const dateBlock = args[2];
        const startTime = args[3];

        if (!dateBlock || !startTime || dateBlock.length !== 6) {
            alert("Format missing. Use: /schedule cancel [ddmmyy] [Start Time]");
            return;
        }

        const { error } = await supabase_db.from('temporary_overrides').upsert([{
            specific_date: dateBlock,
            start_time: startTime,
            is_cancelled: true,
            dj_name: 'tellstream'
        }], { onConflict: 'specific_date,start_time' });

        if (error) console.error("Database cancel action sync failure:", error.message);
    }
}

// REALTIME TRANSMISSION DIRECTORY GRAPHICS LISTENER SYNCS
async function fetchAndRenderWeeklyTimetable() {
    if (!flyerContainer) return;
    try {
        const { data: masterData, error: masterErr } = await supabase_db.from('master_schedule').select('*');
        const { data: tempOverrides, error: tempErr } = await supabase_db.from('temporary_overrides').select('*');

        if (masterErr || !masterData || masterData.length === 0) {
            flyerContainer.innerHTML = `<p style="color:#666; text-align:center; padding-top:20px; font-style:italic;">Weekly Transmission Timetable under construction.</p>`;
            return;
        }

        const dayOrder = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
        masterData.sort((a, b) => {
            if (dayOrder[a.day_of_week] !== dayOrder[b.day_of_week]) {
                return dayOrder[a.day_of_week] - dayOrder[b.day_of_week];
            }
            return a.start_time.localeCompare(b.start_time);
        });

        let htmlOutput = masterData.map(item => {
            let currentDJ = item.dj_name;
            let noteLabel = "";

            if (tempOverrides) {
                const matchOverride = tempOverrides.find(o => o.start_time === item.start_time);
                if (matchOverride) {
                    if (matchOverride.is_cancelled) {
                        currentDJ = "tellstream";
                        noteLabel = `<span style="color:#ff3333; font-size:0.75rem; margin-left:8px;">[CANCELLED]</span>`;
                    } else {
                        currentDJ = matchOverride.dj_name;
                        noteLabel = `<span style="color:#ffdd1a; font-size:0.75rem; margin-left:8px;">[COVER SET]</span>`;
                    }
                }
            }

            return `
                <div class="fb-post-card" style="border-left: 4px solid #00adb5; margin-bottom: 10px; background: rgba(0, 173, 181, 0.02);">
                    <div style="font-weight: bold; color: #00adb5; text-transform: uppercase; font-size: 0.88rem;">
                        📅 ${item.day_of_week}
                    </div>
                    <div style="color: #e0f2f1; margin-top: 4px; font-size: 0.95rem;">
                        ⏰ ${item.start_time} - ${item.end_time} <span style="color:#ffdd1a; font-size:0.8rem; font-weight:bold;">${item.time_zone}</span>
                    </div>
                    <div style="color: #888; font-size: 0.85rem; margin-top: 2px;">
                        👤 Presenter: <strong style="color:#fff;">${currentDJ}</strong> ${noteLabel}
                    </div>
                </div>
            `;
        }).join('');

        flyerContainer.innerHTML = htmlOutput;
    } catch (e) {
        console.error("Timetable parse error:", e);
        flyerContainer.innerHTML = `<p style="color:#666; text-align:center; padding-top:20px; font-style:italic;">Weekly Transmission Timetable under construction.</p>`;
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

try {
    supabase_db.channel('public:master_schedule').on('postgres_changes', { event: '*', pattern: 'public', table: 'master_schedule' }, () => { fetchAndRenderWeeklyTimetable(); }).subscribe();
    supabase_db.channel('public:temporary_overrides').on('postgres_changes', { event: '*', pattern: 'public', table: 'temporary_overrides' }, () => { fetchAndRenderWeeklyTimetable(); }).subscribe();
} catch (e) { console.log("Realtime schedule subscription delayed:", e.message); }

async function sendMessage() {
    const user = usernameInput.value.trim() || 'Listener';
    let text = messageInput.value.trim();
    if (!text) return;

    if (text.startsWith('/')) {
        const profile = profilesCache[user];
        const userPowerLevel = parseInt(profile?.power_level || 0);
        
        if (profile && userPowerLevel >= 1) { 
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
        if (localStorage.getItem('tellstream_key_' + user) !== profilesCache[user].passkey) {
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
    await supabase_db.from('messages').insert([{ username: user, message: text }]);
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });

(async function initSystem() {
    await renderSiteNewsFeed();
    await fetchAndRenderWeeklyTimetable(); 
    
    try { await syncProfilesMap(); } catch(e){}
    try { await syncBannedWordsMap(); } catch(e){}
    try { await syncBannedUsersMap(); } catch(e){}
    try { await loadMessages(); } catch(e){}
    try { await loadInitialStreamStatus(); } catch(e){}
    
    renderHelpContent(false);
    setTimeout(initQuickEmojiCloud, 500);
    
    const hiddenInputFileTag = document.createElement('input');
    hiddenInputFileTag.type = 'file';
    hiddenInputFileTag.id = 'studioLogoHiddenFilePicker';
    hiddenInputFileTag.accept = 'image/png';
    hiddenInputFileTag.style.display = 'none';
    document.body.appendChild(hiddenInputFileTag);

    hiddenInputFileTag.addEventListener('change', async function(e) {
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
