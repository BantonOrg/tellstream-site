const SUPABASE_URL = "https://vegwferwmyuunwvfqpsf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZ3dmZXJ3bXl1dW53dmZxcHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzODU5NDQsImV4cCI6MjA5Nzk2MTk0NH0.7F3HUEY59BGE5phlD9AukhZzRa3Ied_ZT43j8YZeIy8";
const supabase_db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const urlParams = new URLSearchParams(window.location.search);
const targetUser = urlParams.get('user') ? urlParams.get('user').trim() : '';

if (!targetUser) {
    window.location.href = 'index.html';
}

let isCurrentUserVerified = false;
let myProfile = null;
let targetUserProfile = null;
let viewerUser = '';
let relationshipMap = {};
let bannedWordsCache = [];
let bannedUsersCache = {};
let currentChatMode = 'lounge';

// BroadcastChannel setup for cross-tab radio syncing
const radioChannel = new BroadcastChannel('tellstream_radio_control');
let isHomepageActive = false;
const audioPlayer = document.getElementById('radioPlayer');
const customPlayBtn = document.getElementById('player-play-btn');
const customVolSlider = document.getElementById('player-volume-slider');

// DOM Elements references
const chatBox = document.getElementById('chatBox');
const usernameInput = document.getElementById('usernameInput');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const securityDrawer = document.getElementById('securityDrawer');
const regNameInput = document.getElementById('regNameInput');
const regPasskeyInput = document.getElementById('regPasskeyInput');
const regReminderInput = document.getElementById('regReminderInput');
const regEmailInput = document.getElementById('regEmailInput');
const drawerSubmitBtn = document.getElementById('drawerSubmitBtn');
const reminderHintDisplay = document.getElementById('reminderHintDisplay');
const lockStatusBtn = document.getElementById('lockStatusBtn');
const fambilyDrawerBtn = document.getElementById('fambilyDrawerBtn');

// Emojis mapping logic
const imgBaseUrl = "src/assets/smilies/";
let emojiMapping = {};

// 1. PAGE INITIALIZATION
window.addEventListener('DOMContentLoaded', async () => {
    // Read emoji mappings if loaded
    if (window.emojiMapping) {
        emojiMapping = window.emojiMapping;
    }
    
    viewerUser = localStorage.getItem('tellstream_saved_username') || '';
    if (viewerUser) {
        usernameInput.value = viewerUser;
    }
    
    try { updateWebVersionFooter(); } catch(e){}
    await verifyCurrentSession();
    await syncBannedWordsMap();
    await syncBannedUsersMap();
    
    // Check homepage player presence via ping
    radioChannel.postMessage({ action: 'ping' });
    
    // Fallback if no homepage answers in 500ms
    setTimeout(() => {
        if (!isHomepageActive) {
            console.log("[Profile Player] Homepage player not detected. Local streaming enabled.");
            initLocalPlayerEvents();
        }
    }, 500);

    // Visibility Check and Webpage content load
    await loadTargetUserProfile();
});

// BroadcastChannel Message Receiver
radioChannel.onmessage = (event) => {
    if (event.data.action === 'pong') {
        isHomepageActive = true;
        console.log("[Profile Player] Homepage player detected. Operating in REMOTE CONTROL mode.");
        syncRemotePlayerState(event.data);
    } else if (event.data.state) {
        // State update from home player
        isHomepageActive = true;
        if (customPlayBtn) customPlayBtn.innerText = event.data.state === 'playing' ? '⏸️' : '▶️';
        if (customVolSlider) customVolSlider.value = event.data.volume;
    }
};

function syncRemotePlayerState(data) {
    if (customPlayBtn) customPlayBtn.innerText = data.state === 'playing' ? '⏸️' : '▶️';
    if (customVolSlider) customVolSlider.value = data.volume;
}

function initLocalPlayerEvents() {
    if (audioPlayer) {
        updateLocalPlayerUI();
        audioPlayer.addEventListener('play', updateLocalPlayerUI);
        audioPlayer.addEventListener('pause', updateLocalPlayerUI);
        audioPlayer.addEventListener('volumechange', updateLocalPlayerUI);
    }
}

function updateLocalPlayerUI() {
    if (!audioPlayer) return;
    if (customPlayBtn) customPlayBtn.innerText = audioPlayer.paused ? '▶️' : '⏸️';
    if (customVolSlider) customVolSlider.value = audioPlayer.volume;
}

if (customPlayBtn) {
    customPlayBtn.addEventListener('click', () => {
        if (isHomepageActive) {
            // REMOTE mode
            const nextAction = customPlayBtn.innerText === '▶️' ? 'play' : 'pause';
            radioChannel.postMessage({ action: nextAction });
            customPlayBtn.innerText = nextAction === 'play' ? '⏸️' : '▶️';
        } else {
            // LOCAL mode
            if (!audioPlayer) return;
            if (audioPlayer.paused) {
                if (!audioPlayer.src || audioPlayer.src === window.location.href || !audioPlayer.src.includes('radio.mp3')) {
                    audioPlayer.src = "https://a3.asurahosting.com/listen/tellstream/radio.mp3";
                }
                audioPlayer.load();
                audioPlayer.play().catch(e => console.log("Local play blocked:", e));
            } else {
                audioPlayer.pause();
                audioPlayer.removeAttribute('src');
                audioPlayer.load();
            }
        }
    });
}

if (customVolSlider) {
    customVolSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (isHomepageActive) {
            radioChannel.postMessage({ action: 'volume', value: val });
        } else {
            if (audioPlayer) audioPlayer.volume = val;
        }
    });
}

// 2. PROFILE DATA LOADING AND PRIVACY
async function loadTargetUserProfile() {
    try {
        const { data, error } = await supabase_db
            .from('secured_profiles')
            .select('*')
            .eq('username', targetUser)
            .single();

        if (error || !data) {
            showLockedProfileView("🔒 User profile not found.", "The requested webpage does not exist on Tellstream.");
            return;
        }

        targetUserProfile = data;
        document.title = `Tellstream - ${targetUser}'s Webpage`;

        // Run Visibility Check
        const visibility = targetUserProfile.profile_visibility || 'everyone';
        const isOwner = (viewerUser && viewerUser.toLowerCase() === targetUser.toLowerCase() && isCurrentUserVerified);
        
        let visibilityPassed = false;
        
        if (isOwner || visibility === 'everyone') {
            visibilityPassed = true;
        }

        if (!visibilityPassed) {
            showLockedProfileView("🔒 This webpage is private.", "Only the owner can view this profile webpage.");
            return;
        }

        // Render Page Layout
        renderProfileHeader(data);
        
        if (isOwner) {
            document.querySelectorAll('.owner-tip').forEach(el => el.style.display = 'block');
        }
        await Promise.all([
            loadMemberVideos(),
            loadMemberPhotos(),
            loadMemberStatuses()
        ]);

        // Connect chat sidebar
        await initSidebarChat();

    } catch (e) {
        console.error("Error loading profile:", e);
        showLockedProfileView("Error loading profile webpage.", "Connection to server failed.");
    }
}

function showLockedProfileView(message, subtext) {
    document.getElementById('lockedProfileView').style.display = 'block';
    document.getElementById('lockedProfileMessage').innerText = message;
    document.getElementById('lockedProfileView').querySelector('p').innerText = subtext;
    document.getElementById('profileColumnsArea').style.display = 'none';
}

function isUserVip(profile) {
    if (!profile) return false;
    const pLevel = parseInt(profile.power_level || 0);
    if (pLevel >= 1) return true;
    const hover = profile.hover_title;
    if (!hover) return false;
    if (hover === 'VIP' || hover.toUpperCase() === 'VIP') return true;
    if (hover.toUpperCase().startsWith('VIP|')) {
        const expiryStr = hover.substring(4);
        if (expiryStr === 'permanent') return true;
        const expiryTime = Date.parse(expiryStr);
        if (!isNaN(expiryTime)) {
            return Date.now() < expiryTime;
        }
    }
    return false;
}

function getDisplayName(username, profile) {
    if (profile && isUserVip(profile)) {
        return "VIP-" + username;
    }
    return username;
}

function renderProfileHeader(profile) {
    document.getElementById('profileUsername').innerText = getDisplayName(profile.username, profile);
    
    // Level Badge styling
    const levelSpan = document.getElementById('profileBadgeLevel');
    const pLevel = parseInt(profile.power_level || 0);
    if (pLevel >= 2) {
        levelSpan.innerText = "Station Admin";
        levelSpan.style = "background:rgba(255,51,83,0.15); color:#ff3353; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase;";
    } else if (pLevel === 1) {
        levelSpan.innerText = "DJ / Selector";
        levelSpan.style = "background:rgba(255,221,26,0.15); color:#ffdd1a; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase;";
    } else {
        levelSpan.innerText = "Member";
        levelSpan.style = "background:rgba(34,229,50,0.15); color:#22e532; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase;";
    }

    // Avatar
    if (profile.avatar_url) {
        document.getElementById('profileAvatar').src = profile.avatar_url;
    }

    // VIP Badge
    const vipBadge = document.getElementById('profileVipBadge');
    if (vipBadge && isUserVip(profile)) {
        vipBadge.style.display = 'inline-block';
        if (profile.hover_title && profile.hover_title.toUpperCase().startsWith('VIP|')) {
            const expiryStr = profile.hover_title.substring(4);
            vipBadge.title = (expiryStr === 'permanent') ? "Permanent VIP" : "Expires: " + new Date(expiryStr).toLocaleDateString();
        } else {
            vipBadge.title = (pLevel >= 1) ? "VIP by Default" : "Permanent VIP";
        }
    }

    // Location & Socials
    document.getElementById('profileLocation').innerText = profile.location || 'Not Specified';
    document.getElementById('profileSocials').innerText = profile.socials || 'Not Specified';
    document.getElementById('profileBio').innerText = profile.bio || '';
}

// 3. MEMBER WEBPAGE CONTENT RENDERING
async function loadMemberVideos() {
    const container = document.getElementById('videosFeed');
    try {
        const { data, error } = await supabase_db
            .from('member_embeds')
            .select('*')
            .eq('username', targetUser)
            .order('created_at', { ascending: false });

        if (error) throw error;
        container.innerHTML = "";
        
        if (!data || data.length === 0) {
            container.innerHTML = `<p style="font-size: 0.8rem; color: #666; text-align: center; padding: 20px;">No embeds loaded yet.</p>`;
            return;
        }

        const isOwner = (viewerUser && viewerUser.toLowerCase() === targetUser.toLowerCase() && isCurrentUserVerified);

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = "media-embed-card";
            
            const embedSrc = getEmbedPlayerUrl(item.url);
            if (embedSrc) {
                card.innerHTML = `<iframe src="${embedSrc}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
            } else {
                card.innerHTML = `<div style="padding:20px; font-size:0.75rem; color:#aaa; text-align:center;">Unresolvable Media Link: <a href="${escapeHTML(item.url)}" target="_blank" style="color:#22e532;">${escapeHTML(item.url)}</a></div>`;
            }

            if (isOwner) {
                const delBtn = document.createElement('button');
                delBtn.className = "delete-btn-overlay";
                delBtn.innerText = "🗑️ Delete";
                delBtn.onclick = () => deleteVideo(item.id, card);
                card.appendChild(delBtn);
            }

            container.appendChild(card);
        });

    } catch (e) {
        container.innerHTML = `<p style="font-size: 0.8rem; color: #ff3353; text-align: center; padding: 20px;">Error loading videos.</p>`;
    }
}

async function loadMemberPhotos() {
    const grid = document.getElementById('photoGrid');
    const msg = document.getElementById('noPhotosMsg');
    try {
        const { data, error } = await supabase_db
            .from('member_photos')
            .select('*')
            .eq('username', targetUser)
            .order('created_at', { ascending: false });

        if (error) throw error;
        grid.innerHTML = "";

        if (!data || data.length === 0) {
            msg.style.display = "block";
            return;
        }
        msg.style.display = "none";

        const isOwner = (viewerUser && viewerUser.toLowerCase() === targetUser.toLowerCase() && isCurrentUserVerified);

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = "photo-card";
            card.innerHTML = `<img src="${item.public_url}" alt="User Photo">`;
            card.onclick = () => openLightbox(item.public_url);

            if (isOwner) {
                const delBtn = document.createElement('button');
                delBtn.className = "delete-btn-overlay";
                delBtn.innerText = "🗑️ Delete";
                delBtn.onclick = (e) => {
                    e.stopPropagation(); // Avoid triggering lightbox click
                    deletePhoto(item.id, item.file_name, card);
                };
                card.appendChild(delBtn);
            }

            grid.appendChild(card);
        });

    } catch (e) {
        msg.innerText = "Error loading photos.";
        msg.style.color = "#ff3353";
    }
}

async function loadMemberStatuses() {
    const container = document.getElementById('statusesFeed');
    try {
        const { data, error } = await supabase_db
            .from('member_statuses')
            .select('*')
            .eq('username', targetUser)
            .order('created_at', { ascending: false });

        if (error) throw error;
        container.innerHTML = "";

        if (!data || data.length === 0) {
            container.innerHTML = `<p style="font-size: 0.8rem; color: #666; text-align: center; padding: 20px;">No statuses timeline updates.</p>`;
            return;
        }

        const isOwner = (viewerUser && viewerUser.toLowerCase() === targetUser.toLowerCase() && isCurrentUserVerified);

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = "status-timeline-card";
            
            const timeStr = new Date(item.created_at).toLocaleString();
            card.innerHTML = `
                <div style="font-size:0.85rem; color:#fff; word-break:break-word; line-height:1.4;">${escapeHTML(item.message)}</div>
                <span class="status-time">${timeStr}</span>
            `;

            if (isOwner) {
                const delBtn = document.createElement('button');
                delBtn.className = "delete-btn-overlay";
                delBtn.innerText = "🗑️ Delete";
                delBtn.onclick = () => deleteStatus(item.id, card);
                card.appendChild(delBtn);
            }

            container.appendChild(card);
        });

    } catch (e) {
        container.innerHTML = `<p style="font-size: 0.8rem; color: #ff3353; text-align: center; padding: 20px;">Error loading statuses.</p>`;
    }
}

// 4. DELETION FLOWS FOR OWNER
async function deleteVideo(id, element) {
    if (!confirm("Are you sure you want to delete this embed player?")) return;
    try {
        const { error } = await supabase_db.from('member_embeds').delete().eq('id', id);
        if (error) throw error;
        element.remove();
        alert("Video embed deleted successfully.");
        // If empty, re-render notice
        const container = document.getElementById('videosFeed');
        if (container.children.length === 0) {
            container.innerHTML = `<p style="font-size: 0.8rem; color: #666; text-align: center; padding: 20px;">No embeds loaded yet.</p>`;
        }
    } catch (err) {
        alert("Delete failed: " + err.message);
    }
}

async function deletePhoto(id, fileName, element) {
    if (!confirm("Are you sure you want to delete this photo from your gallery?")) return;
    try {
        // Remove from Storage
        const { error: storageErr } = await supabase_db.storage.from('member-photos').remove([fileName]);
        if (storageErr) console.warn("Storage deletion warning:", storageErr.message);

        // Remove from DB
        const { error: dbErr } = await supabase_db.from('member_photos').delete().eq('id', id);
        if (dbErr) throw dbErr;

        element.remove();
        alert("Photo deleted successfully.");
        
        // If empty grid, re-render notice
        const grid = document.getElementById('photoGrid');
        if (grid.children.length === 0) {
            document.getElementById('noPhotosMsg').style.display = "block";
        }
    } catch (err) {
        alert("Delete failed: " + err.message);
    }
}

async function deleteStatus(id, element) {
    if (!confirm("Are you sure you want to delete this status timeline post?")) return;
    try {
        const { error } = await supabase_db.from('member_statuses').delete().eq('id', id);
        if (error) throw error;
        element.remove();
        alert("Status post deleted successfully.");
        // If empty, re-render notice
        const container = document.getElementById('statusesFeed');
        if (container.children.length === 0) {
            container.innerHTML = `<p style="font-size: 0.8rem; color: #666; text-align: center; padding: 20px;">No statuses timeline updates.</p>`;
        }
    } catch (err) {
        alert("Delete failed: " + err.message);
    }
}

// Helper to parse media URLs into Supabase dynamic iframe urls
function getEmbedPlayerUrl(url) {
    let cleanUrl = url.trim();
    
    // YouTube
    if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
        let videoId = '';
        if (cleanUrl.includes('youtu.be/')) {
            videoId = cleanUrl.split('youtu.be/')[1].split(/[?#]/)[0];
        } else if (cleanUrl.includes('v=')) {
            videoId = cleanUrl.split('v=')[1].split(/[&#]/)[0];
        } else if (cleanUrl.includes('embed/')) {
            videoId = cleanUrl.split('embed/')[1].split(/[?#]/)[0];
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    }
    
    // Mixcloud
    if (cleanUrl.includes('mixcloud.com')) {
        // Embed mixcloud URL needs to be encoded
        const encodedUrl = encodeURIComponent(cleanUrl);
        return `https://www.mixcloud.com/widget/iframe/?feed=${encodedUrl}&hide_cover=1&mini=1`;
    }
    
    // SoundCloud
    if (cleanUrl.includes('soundcloud.com')) {
        const encodedUrl = encodeURIComponent(cleanUrl);
        return `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%2322e532&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
    }

    // Spotify
    if (cleanUrl.includes('spotify.com')) {
        let path = '';
        if (cleanUrl.includes('open.spotify.com/')) {
            path = cleanUrl.split('open.spotify.com/')[1].split(/[?#]/)[0];
        }
        return path ? `https://open.spotify.com/embed/${path}` : '';
    }

    // Twitch
    if (cleanUrl.includes('twitch.tv')) {
        let channel = '';
        if (cleanUrl.includes('twitch.tv/')) {
            channel = cleanUrl.split('twitch.tv/')[1].split(/[?#]/)[0];
        }
        // Requires parent domain. Fallback dynamically
        const parentDomain = window.location.hostname;
        return channel ? `https://player.twitch.tv/?channel=${channel}&parent=${parentDomain}&autoplay=false` : '';
    }

    return '';
}

// Lightbox Open/Close
window.openLightbox = function(src) {
    const modal = document.getElementById('photoLightbox');
    const target = document.getElementById('lightboxTargetImg');
    if (modal && target) {
        target.src = src;
        modal.style.display = "flex";
    }
};

window.closeLightbox = function() {
    const modal = document.getElementById('photoLightbox');
    if (modal) modal.style.display = "none";
};

// 5. RIGHT SIDEBAR CHAT ENGINE
let profilesMap = {};

async function initSidebarChat() {
    await syncProfilesMap();
    await loadMessages();

    // Subscribe to messages changes
    supabase_db.channel('public:messages').on('postgres_changes', { event: 'INSERT', pattern: 'public', table: 'messages' }, payload => { 
        appendMessage(payload.new); 
    }).subscribe();

    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter' && !e.shiftKey) { 
            e.preventDefault(); 
            sendMessage(); 
        } 
    });
}

async function syncProfilesMap() {
    const { data } = await supabase_db
        .from('secured_profiles')
        .select('username, power_level, hover_title, key_reminder');
    if (data) {
        profilesMap = {};
        data.forEach(p => {
            profilesMap[p.username] = p;
        });
    }
}

async function loadMessages() {
    const { data } = await supabase_db
        .from('messages')
        .select('*')
        .order('id', { ascending: false })
        .limit(40);
        
    if (data) {
        chatBox.innerHTML = "";
        data.reverse().forEach(appendMessage);
        anchorChatToBottom();
    }
}

function appendMessage(msg) {
    if (msg.recipient && msg.recipient !== viewerUser && msg.username !== viewerUser) return;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg-row';
    
    const senderProfile = profilesMap[msg.username];
    let nameClass = 'default-user';
    let hoverAttribute = '';
    
    if (senderProfile) {
        const pLevel = parseInt(senderProfile.power_level || 0);
        if (pLevel >= 2) nameClass = 'level-admin';
        else if (pLevel === 1) nameClass = 'level-dj';
        else if (isUserVip(senderProfile)) nameClass = 'level-vip';
        
        if (senderProfile.hover_title) {
            hoverAttribute = `title="${escapeHTML(senderProfile.hover_title)}"`;
        }
    }
    
    const cleanMsgText = escapeHTML(msg.message);
    const textWithEmojis = replaceEmojiCodes(cleanMsgText);
    
    msgDiv.innerHTML = `
        <div class="user ${nameClass}" ${hoverAttribute} style="cursor:pointer;" onclick="openProfileCard('${escapeHTML(msg.username)}')">
            ${escapeHTML(getDisplayName(msg.username, senderProfile))}
        </div>
        <div>${textWithEmojis}</div>
    `;
    
    chatBox.appendChild(msgDiv);
    anchorChatToBottom();
}

async function sendMessage() {
    const user = usernameInput.value.trim() || 'Listener';
    let text = messageInput.value.trim();
    if (!text) return;

    if (text.startsWith('/')) {
        messageInput.value = '';
        const profile = profilesMap[user];
        const loggedInUser = localStorage.getItem('tellstream_saved_username');
        const isVerified = (user === loggedInUser && isCurrentUserVerified);
        
        if (!profile || !isVerified) {
            alert("🔒 To unlock your member page and use these commands, you must first secure your nickname in the profile settings drawer.");
            return;
        }
        
        if (!isUserVip(profile)) {
            alert("⭐ Webpages are a Tellstream VIP & Presenter feature. To unlock your own page, contact management or become a VIP!");
            return;
        }
        
        if (text.startsWith('/status ')) {
            const msg = text.substring(8).trim();
            if (msg) {
                await handleMemberStatus(user, msg);
                await loadMemberStatuses(); // Reload statuses timeline dynamically!
            } else {
                alert("Usage: /status [message]");
            }
        } else if (text.startsWith('/embed ')) {
            const url = text.substring(7).trim();
            if (url) {
                await handleMemberEmbed(user, url);
                await loadMemberVideos(); // Reload videos/audio player dynamically!
            } else {
                alert("Usage: /embed [media url]");
            }
        } else if (text.trim() === '/upload image' || text.trim() === '/upload') {
            const picker = document.getElementById('memberPhotoFilePicker');
            if (picker) {
                picker.click();
            } else {
                alert("Upload picker unavailable.");
            }
        } else {
            alert("Invalid command usage. Use /status, /embed, or /upload.");
        }
        return;
    }

    if (profilesMap[user]) {
        const loggedInUser = localStorage.getItem('tellstream_saved_username');
        const isVerified = (user === loggedInUser && isCurrentUserVerified);
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

    messageInput.value = '';
    
    // Normal Message Insertion
    try {
        const { error } = await supabase_db.from('messages').insert([{
            username: user,
            message: text
        }]);
        if (error) throw error;
    } catch(e) {
        alert("Failed to send message: " + e.message);
    }
}

function anchorChatToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 6. UTILITY FUNCTIONS (Swear filters, Emojis, Security Drawer)
async function syncBannedWordsMap() {
    const { data } = await supabase_db.from('banned_words').select('word');
    if (data) {
        bannedWordsCache = data.map(r => r.word.toLowerCase());
    }
}

async function syncBannedUsersMap() {
    const { data } = await supabase_db.from('banned_users').select('*');
    if (data) {
        bannedUsersCache = {};
        data.forEach(u => {
            bannedUsersCache[u.username.toLowerCase()] = u;
        });
    }
}

function checkBanStatus(username) {
    const userLower = username.toLowerCase();
    const banRecord = bannedUsersCache[userLower];
    if (banRecord) {
        const now = new Date();
        const banExpiry = banRecord.banned_until ? new Date(banRecord.banned_until) : null;
        
        if (!banExpiry) {
            return { isBanned: true, message: "🔒 You have been permanently banned from the chat lounge." };
        } else if (now < banExpiry) {
            return { isBanned: true, message: `🔒 You are banned until: ${banExpiry.toLocaleString()}` };
        }
    }
    return { isBanned: false };
}

function containsSwearWords(text) {
    const textLower = text.toLowerCase();
    return bannedWordsCache.some(badWord => {
        const regex = new RegExp(`\\b${escapeRegExp(badWord)}\\b`, 'i');
        return regex.test(textLower);
    });
}

async function handleUserStrike(user, text) {
    alert("Swearing is strictly prohibited in the lounge chat.");
}

function replaceEmojiCodes(text) {
    let replaced = text;
    Object.keys(emojiMapping).forEach(code => {
        const gifFileName = emojiMapping[code];
        const escapeCode = escapeRegExp(code);
        const regex = new RegExp(`:${escapeCode}:`, 'g');
        replaced = replaced.replace(regex, `<img src="${imgBaseUrl}${gifFileName}" class="chat-smiley" alt="${code}">`);
    });
    return replaced;
}

// Security Drawer verification
async function verifyCurrentSession() {
    let savedUser = localStorage.getItem('tellstream_saved_username');
    if (savedUser) {
        const cleanName = savedUser.replace(/\s+/g, '').toLowerCase();
        const matchedKey = Object.keys(profilesMap).find(k => k.replace(/\s+/g, '').toLowerCase() === cleanName);
        if (matchedKey && matchedKey !== savedUser) {
            savedUser = matchedKey;
            localStorage.setItem('tellstream_saved_username', matchedKey);
            usernameInput.value = matchedKey;
        }
    }
    const savedKey = savedUser ? localStorage.getItem('tellstream_key_' + savedUser) : null;
    
    if (savedUser && savedKey) {
        const { data, error } = await supabase_db.rpc('verify_user_passkey', {
            p_username: savedUser,
            p_passkey: savedKey
        });
        if (data && !error) {
            isCurrentUserVerified = true;
            usernameInput.value = savedUser;
            lockStatusBtn.innerText = "🔑";
            lockStatusBtn.title = "Verified identity active";
        }
    }
}

window.toggleSecurityDrawer = function() {
    if (securityDrawer.classList.contains('open')) {
        securityDrawer.classList.remove('open');
    } else {
        const currentUser = usernameInput.value.trim() || 'Listener';
        regNameInput.value = currentUser;
        
        // Show reset link if profile exists
        const exists = profilesMap[currentUser];
        document.getElementById('forgotPasskeyLink').style.display = exists ? 'block' : 'none';
        
        securityDrawer.classList.add('open');
    }
};

window.handleSecuritySubmit = async function() {
    const currentName = regNameInput.value.trim();
    const passkey = regPasskeyInput.value.trim();
    const reminder = regReminderInput.value.trim();
    const email = regEmailInput.value.trim();

    if (!currentName || !passkey) {
        alert("Please fill in both Name and a Passkey string.");
        return;
    }

    const cleanName = currentName.replace(/\s+/g, '').toLowerCase();
    const matchedKey = Object.keys(profilesMap).find(k => k.replace(/\s+/g, '').toLowerCase() === cleanName);

    if (matchedKey) {
        const resolvedName = matchedKey;
        const { data: isValid, error: rpcErr } = await supabase_db.rpc('verify_user_passkey', {
            p_username: resolvedName,
            p_passkey: passkey
        });
        if (isValid && !rpcErr) {
            localStorage.setItem('tellstream_key_' + resolvedName, passkey);
            localStorage.setItem('tellstream_saved_username', resolvedName);
            isCurrentUserVerified = true;
            alert("Authorized!");
            securityDrawer.classList.remove('open');
            lockStatusBtn.innerText = "🔑";
            viewerUser = resolvedName;
            location.reload(); // Reload to refresh visibility & ownership details
        } else {
            alert("Invalid Passkey entry sequence.");
            if (profilesMap[resolvedName].key_reminder) {
                reminderHintDisplay.innerText = "Hint Clue: " + profilesMap[resolvedName].key_reminder;
                reminderHintDisplay.style.display = "block";
            }
        }
    } else {
        // Register new profile
        let assignedLevel = 0;
        let assignedHover = "Tella Fambily";
        if (cleanName === "banton") { assignedLevel = 2; assignedHover = "banton.org"; }
        else if (cleanName === "bigjohn") { assignedLevel = 2; assignedHover = "the boss"; }
        else if (cleanName === "perfectionist") { assignedLevel = 2; assignedHover = "You done know"; }

        const { error } = await supabase_db.from('secured_profiles').insert([{
            username: currentName,
            passkey: passkey,
            key_reminder: reminder,
            email: email,
            power_level: assignedLevel,
            hover_title: assignedHover
        }]);

        if (error) {
            alert("Could not claim this name block.");
        } else {
            localStorage.setItem('tellstream_key_' + currentName, passkey);
            localStorage.setItem('tellstream_saved_username', currentName);
            isCurrentUserVerified = true;
            alert("Registration complete!");
            securityDrawer.classList.remove('open');
            lockStatusBtn.innerText = "🔑";
            viewerUser = currentName;
            location.reload();
        }
    }
};

window.toggleFambilyDrawer = function() {
    // Redirect fambily actions to homepage to avoid duplicates
    alert("Profile settings are managed on the Lounge Homepage.");
};

window.syncDrawerName = function() {
    // Empty stub for input bindings
};

function updateWebVersionFooter() {
    const el = document.getElementById('header-copyright');
    if (!el) return;
    el.innerHTML = `© 2026 <a href="https://www.tellstream.org" target="_blank" style="color:inherit; text-decoration:none;">www.tellstream.org</a> WebVer 1.0951 | <a href="#" id="privacy-link" onclick="event.preventDefault(); openPrivacyModal();" style="color:#22e532; text-decoration:none; font-weight:bold; cursor:pointer;">Privacy Policy</a>`;
}

// User Profile Card Modal Controls inside profile tab
window.openProfileCard = async function(targetUsernameInput) {
    const modal = document.getElementById('profileCardModal');
    if (!modal) return;

    const matchedKey = Object.keys(profilesMap).find(k => k.toLowerCase() === targetUsernameInput.toLowerCase());
    const targetUsername = matchedKey || targetUsernameInput;

    document.getElementById('profileCardUsername').innerText = targetUsername;
    const avatarImg = document.getElementById('profileCardAvatar');
    avatarImg.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23444'/><text x='50' y='60' font-size='30' font-family='sans-serif' text-anchor='middle' fill='%23fff'>?</text></svg>";

    const levelSpan = document.getElementById('profileCardLevel');
    const profile = profilesMap[targetUsername];
    const vipBadge = document.getElementById('profileCardVipBadge');

    if (vipBadge) {
        if (isUserVip(profile)) {
            vipBadge.style.display = 'inline-block';
        } else {
            vipBadge.style.display = 'none';
        }
    }

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
        if (profile.avatar_url) avatarImg.src = profile.avatar_url;
    }
    
    levelSpan.innerText = levelText;
    levelSpan.style = levelStyle;

    document.getElementById('profileCardLocation').innerText = profile?.location || "Not specified";
    document.getElementById('profileCardSocials').innerText = profile?.socials || "Not specified";
    document.getElementById('profileCardBio').innerText = profile?.bio || "No bio written.";

    const actionsDiv = document.getElementById('profileCardActions');
    actionsDiv.innerHTML = "";

    // Add navigation button to webpage
    const webBtn = document.createElement('button');
    webBtn.className = "drawer-action-inline-btn btn-green";
    webBtn.innerText = "Webpage";
    webBtn.onclick = () => {
        closeProfileCard();
        if (targetUsername.toLowerCase() === targetUser.toLowerCase()) {
            // Already here!
            alert("You are already viewing this webpage.");
        } else {
            window.location.href = `profile.html?user=${encodeURIComponent(targetUsername)}`;
        }
    };
    actionsDiv.appendChild(webBtn);

    modal.style.display = "flex";
};

window.closeProfileCard = function() {
    const modal = document.getElementById('profileCardModal');
    if (modal) modal.style.display = "none";
};

// Privacy modal wrappers
window.openPrivacyModal = function() {
    document.getElementById('privacy-overlay').classList.add('active');
};
window.closePrivacyModal = function() {
    document.getElementById('privacy-overlay').classList.remove('active');
};
window.acceptCookieConsent = function() {
    localStorage.setItem('tellstream_cookie_consent', 'true');
    document.getElementById('cookie-consent-banner').classList.remove('active');
};

// Help helper strings
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

// Webpage Commands & Member Page Customization Controls
async function handleMemberStatus(username, message) {
    try {
        const { error } = await supabase_db.from('member_statuses').insert([{
            username: username,
            message: message
        }]);
        if (error) throw error;
        alert("✏️ Status update posted successfully to your webpage!");
    } catch (err) {
        alert("Failed to post status: " + err.message);
    }
}

async function handleMemberEmbed(username, url) {
    const isMedia = url.includes('youtube.com') || url.includes('youtu.be') || 
                    url.includes('mixcloud.com') || url.includes('twitch.tv') || 
                    url.includes('soundcloud.com') || url.includes('spotify.com');
                    
    if (!isMedia) {
        alert("Unsupported URL! We support YouTube, Mixcloud, Twitch, SoundCloud, and Spotify embeds.");
        return;
    }
    
    try {
        const { error } = await supabase_db.from('member_embeds').insert([{
            username: username,
            url: url
        }]);
        if (error) throw error;
        alert("🎬 Video embed added successfully to your webpage!");
    } catch (err) {
        alert("Failed to add video: " + err.message);
    }
}

function compressImageToJpeg(file, maxDim, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(blob => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("Canvas blob generation failed"));
                    }
                }, 'image/jpeg', quality);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Dynamically create the file picker input for profile.js
(function initMemberPhotoPicker() {
    const hiddenMemberPhotoInput = document.createElement('input');
    hiddenMemberPhotoInput.type = 'file';
    hiddenMemberPhotoInput.id = 'memberPhotoFilePicker';
    hiddenMemberPhotoInput.accept = 'image/*';
    hiddenMemberPhotoInput.style.display = 'none';
    document.body.appendChild(hiddenMemberPhotoInput);

    hiddenMemberPhotoInput.addEventListener('change', async function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const currentUser = usernameInput.value.trim();
        const profile = profilesMap[currentUser];
        if (!profile || !isUserVip(profile)) {
            alert("Unauthorized upload action.");
            return;
        }

        try {
            const compressedBlob = await compressImageToJpeg(file, 1024, 0.8);
            
            const { data: existingPhotos, error: fetchErr } = await supabase_db
                .from('member_photos')
                .select('*')
                .eq('username', currentUser)
                .order('created_at', { ascending: true });
                
            if (fetchErr) throw fetchErr;
            
            if (existingPhotos && existingPhotos.length >= 9) {
                const oldest = existingPhotos[0];
                await supabase_db.storage.from('member-photos').remove([oldest.file_name]);
                await supabase_db.from('member_photos').delete().eq('id', oldest.id);
            }
            
            const timestamp = Date.now();
            const fileName = `${currentUser}/img_${timestamp}.jpg`;
            const { error: uploadError } = await supabase_db.storage
                .from('member-photos')
                .upload(fileName, compressedBlob, {
                    contentType: 'image/jpeg',
                    upsert: true
                });
                
            if (uploadError) throw uploadError;
            
            const { data: publicUrlData } = supabase_db.storage
                .from('member-photos')
                .getPublicUrl(fileName);
                
            const publicUrl = publicUrlData.publicUrl;
            
            const { error: dbErr } = await supabase_db.from('member_photos').insert([{
                username: currentUser,
                file_name: fileName,
                public_url: publicUrl
            }]);
            
            if (dbErr) throw dbErr;
            
            alert("📸 Photo uploaded successfully to your webpage!");
            await loadMemberPhotos(); // Reload photos grid dynamically!
        } catch (err) {
            alert("Upload failed: " + err.message);
        } finally {
            hiddenMemberPhotoInput.value = '';
        }
    });
})();
