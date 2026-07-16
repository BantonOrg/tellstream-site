# Walkthrough: Level 2 Moderation Help & Rules

This document outlines the modifications made to add a dedicated, visible set of moderation help cards and rules specifically for Level 2 (Station Admins) on the site.

## Changes Made

### 1. Help Guide Content
- Added a new `adminHelpInstructions` array in [main.js](file:///c:/PROJECT%20FOLDER%201/main.js) containing specific rules, commands, and workflows for Level 2 administrators.
- Refactored the existing `djHelpInstructions` to remove Level 2 restricted upload/delete command details, ensuring Level 1 (DJs/Selectors) see only their allowed commands.

### 2. Conditional Rendering for Level 2
- Updated `renderHelpContent` in [main.js](file:///c:/PROJECT%20FOLDER%201/main.js) to resolve the active user's power level.
- When an authorized Level 2 user (e.g. `Banton`, `Big John`, `Perfectionist`) is logged in, their specific administration and moderation help items render at the very top of the help sidebar, styled with a distinct **crimson admin border** (`#ff3333`) and background.

### 3. Drawer Login State Synchronisation
- Modified `handleSecuritySubmit` in [main.js](file:///c:/PROJECT%20FOLDER%201/main.js) to call `syncDrawerName()` immediately upon successful login/authentication. This guarantees that the layout updates instantly and presents the correct Level 1/Level 2 help guides right after log in.

### 4. Promotion & Demotion Commands (Level 2)
- Added support for `/promote [username] [1 or 2]` and `/demote [username] [0 or 1]` commands in [main.js](file:///c:/PROJECT%20FOLDER%201/main.js).
- Restructured input validation to parse multi-word usernames robustly (e.g. `Big John`) and restrict execution exclusively to Level 2 (Station Admin) users.
- Linked these commands to update the `power_level` and corresponding `hover_title` fields in the `secured_profiles` table, syncing automatically with all open tabs via Supabase's realtime subscription.
- Documented these commands in the Level 2 administrator help guide.

---

## Verification Plan

### Automated Verification
The code structure and syntax were checked and verified. The JavaScript is clean and executes standard DOM manipulation.

### Manual Verification
1. Open the Live Lounge site.
2. In the "Nickname" input, type a standard user or empty name. Observe the default "Chat help and emoji codes" list.
3. Type a Level 1 user nickname and log in (e.g., DJ Selector accounts). Observe that the **Selector (Level 1) Help** cards show up styled in gold.
4. Type a Level 2 user nickname (e.g., `Banton` or `Big John`) and log in. Verify that:
   - The **Station Admin Rules (Level 2) Help** cards show up at the very top styled in crimson (red).
   - The Selector (Level 1) Help cards show up right underneath the admin cards.
   - The default help instructions show below them.

---

## Game Consolidation & Cross-Tab Remote Controls

### 1. Consolidation & URL Cleaning
- Overwrote the entry index pages:
  - [dominoes/index.html](file:///c:/PROJECT%20FOLDER%201/dominoes/index.html) (now contains the full Dominoes lobby/table layout).
  - [ludo/index.html](file:///c:/PROJECT%20FOLDER%201/ludo/index.html) (now contains the full Ludo lobby/table layout).
- Cleaned up link navigation on the homepage to point directly to the folder roots (`/dominoes/` and `/ludo/`) opening in new tabs (`target="_blank"`), allowing the homepage stream to keep playing in the background.

### 2. Security Gating & Session Controls
- Implemented immediate `<script>` load gates on both game pages to redirect unauthenticated users back to the Lounge homepage.
- Updated the game engines to set `tellstream_active_game` status inside `localStorage` when joining or hosting a game room. 
- Integrated check logic: if a player tries to open a second game tab while they are already active in another game's room, they are blocked and redirected.

### 3. Cross-Tab Remote Music Controls
- Integrated BroadcastChannel `tellstream_radio_control` on the homepage ([main.js](file:///c:/PROJECT%20FOLDER%201/main.js)) and game pages ([dominoes/index.html](file:///c:/PROJECT%20FOLDER%201/dominoes/index.html) and [ludo/index.html](file:///c:/PROJECT%20FOLDER%201/ludo/index.html)).
- Placed clean remote controls (Play/Pause toggles and Volume sliders) at the top of the game windows:
  - Dominoes: Centered in the top felt status bar.
  - Ludo: Next to the Settings and Exit button block.
- Clicking these controls sends silent events to the homepage player to play, pause, or set volume. State changes on the homepage player broadcast back to synchronize the button icons and volume level in real-time across tabs.
- Added a Ludo settings menu exit handler inside [ludo/game.js](file:///c:/PROJECT%20FOLDER%201/ludo/game.js) to clean up inactive room seats when closing.

### 4. Boneyard Controls & Hand Width Expansion
- Relocated the **DRAW TILE** button and the **Player Capsule** from the bottom hand container to the left side of the Boneyard deck info in [dominoes/index.html](file:///c:/PROJECT%20FOLDER%201/dominoes/index.html#L253-L262).
- Designed a premium glassmorphic theme for the DRAW TILE button in [dominoes/dominoes.css](file:///c:/PROJECT%20FOLDER%201/dominoes/dominoes.css#L1035-L1061):
  - **Active state (when drawing is allowed)**: Shows a dark-glass style with a vibrant cyan border/glow.
  - **Disabled state**: Fades to a sleek dark gray that matches the felt table.
- Styled the Player Capsule card to stack vertically, align center, and feature a clean cyan border and a soft glow.
- Moved the dealt hand container position back up to **`bottom: 196px`** in [dominoes/dominoes.css](file:///c:/PROJECT%20FOLDER%201/dominoes/dominoes.css#L977-L987) to prevent the scrollbar and container boundaries from overlapping played dominoes on the board line.
- Expanded the horizontal size limit of the hand row to **`max-width: 524px`**, allowing it to fit exactly **8 tiles** side-by-side before the horizontal scrollbar triggers.

### 5. Same-Tab Fullscreen Iframe Overlay
- Implemented a 100% fullscreen iframe overlay container (`#game-overlay-container`) inside [index.html](file:///c:/PROJECT%20FOLDER%201/index.html#L201-L208) that covers the entire tab.
- Integrated parent window functions `launchFullscreenGame` and `closeFullscreenGame` in [main.js](file:///c:/PROJECT%20FOLDER%201/main.js#L650-L685) to manage loading the games in the overlay.
- Re-routed the public buttons on the homepage to launch the games inside this same-tab overlay rather than opening a new tab.
- Added a **Back to Lounge** exit button to the lobby view of [dominoes/index.html](file:///c:/PROJECT%20FOLDER%201/dominoes/index.html#L40-L50) and configured both games to invoke the parent overlay closing function when exiting.
- Added a **Smart Fallback Player** in both games to check for homepage presence. If the game is loaded standalone, the controls activate a local hidden audio player so they still get music. If loaded in the Lounge overlay, it falls back to remote control, preventing double-streaming.

---

## Game Lounge Header Updates, Green Accent Theme & Ludo Gameplay Fixes

### 1. Game Lounge Header Buttons Consolidation
- Removed "🔊 Listener Lounge" text span from the chat header and replaced it with a matching row (`#headerGamesRow`) of Dominoes and Ludo buttons in [index.html](file:///c:/PROJECT%20FOLDER%201/index.html).
- Removed the old Ludo/Dominoes buttons from the main column 3 title bar in [index.html](file:///c:/PROJECT%20FOLDER%201/index.html).
- Unified button styles in the chat header using the new `.chat-header-btn` class with a modern translucent style and vibrant green hover glows in [style.css](file:///c:/PROJECT%20FOLDER%201/style.css).
- Configured `toggleNoticeBoardView` in [main.js](file:///c:/PROJECT%20FOLDER%201/main.js) to dynamically hide the game buttons and show the "📋 Noticeboard" title when active, restoring the game buttons once noticeboard is closed.

### 2. Green Accent Theme
- Swapped the website's primary light blue accent color (`#00adb5`) and its hover shade (`#008c94` / `#008f96`) to green (`#22e532` and `#1cb528` respectively) across:
  - Homepage: [style.css](file:///c:/PROJECT%20FOLDER%201/style.css), [index.html](file:///c:/PROJECT%20FOLDER%201/index.html), and [main.js](file:///c:/PROJECT%20FOLDER%201/main.js)
  - Admin Portal: [admin.html](file:///c:/PROJECT%20FOLDER%201/admin.html)
  - Timetable simulation: [scheduletest.html](file:///c:/PROJECT%20FOLDER%201/scheduletest.html)
  - Dominoes: [dominoes/dominoes.css](file:///c:/PROJECT%20FOLDER%201/dominoes/dominoes.css) and [dominoes/index.html](file:///c:/PROJECT%20FOLDER%201/dominoes/index.html)
  - Ludo: [ludo/style.css](file:///c:/PROJECT%20FOLDER%201/ludo/style.css) and [ludo/index.html](file:///c:/PROJECT%20FOLDER%201/ludo/index.html)
- Preserved Ludo's Blue seat card as a standard blue (`#0088ff` / `rgba(0, 136, 255, 0.05)`) in [ludo/index.html](file:///c:/PROJECT%20FOLDER%201/ludo/index.html) to keep the blue player visually distinct from the green player.

### 3. Removed :unknown: Emoji
- Removed the broken `"unknown": "unknown.gif"` entry from `window.emojiMapping` in [emojis.js](file:///c:/PROJECT%20FOLDER%201/src/assets/emojis.js) to prevent loading a blank/missing emoji box.

### 4. Ludo Logic Lock & Step-by-Step Animation
- Added a global `isProcessing` lock inside [ludo/game.js](file:///c:/PROJECT%20FOLDER%201/ludo/game.js) to ignore token and roll clicks during database operations and movements. This prevents double-clicks from double-moving pieces or allowing turn skips and erratic jumping.
- Introduced `localTokenPositions` cache in [ludo/game.js](file:///c:/PROJECT%20FOLDER%201/ludo/game.js) to decouple visual board positions from real-time database state coordinates.
- Implemented `runMovementAnimation` inside [ludo/game.js](file:///c:/PROJECT%20FOLDER%201/ludo/game.js) to walk tokens step-by-step (1 space at a time) with a 250ms delay and walking sound effect on each step.
- Synchronized capture logic to wait until the movement animation is complete before playing the capture sound and sending the opponent token back to the yard.
