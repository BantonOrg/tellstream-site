/* ==========================================================================
   GAME.JS - Pure Physics, Placement, & Rotation Logic Engine
   ========================================================================== */

// Global Game State Tracker
const GameEngine = {
    activeTiles: [],
    boardOrientation: 0, // Degrees: 0, 90, 180, 270
    isDragging: false
};

/**
 * Core Tile Factory - Generates a flat container box with zero layout lines/dots
 */
function createDominoBone(tileId, skinClass, isBackFace = false) {
    const bone = document.createElement('div');
    
    // Assign pure identity classes
    bone.className = `domino-bone-interactive ${skinClass}`;
    if (isBackFace) {
        bone.classList.add('back-face');
    }
    
    bone.dataset.id = tileId;
    bone.dataset.rotation = "0";

    // Attach basic drag-and-drop mechanics directly to the flat box
    initDragPhysics(bone);

    return bone;
}

/**
 * Pure Spatial Placement Mechanics
 */
function placeTileOnTable(tileElement, x, y) {
    tileElement.style.position = 'absolute';
    tileElement.style.left = `${x}px`;
    tileElement.style.top = `${y}px`;
    
    const table = document.getElementById('game-table');
    if (table) {
        table.appendChild(tileElement);
    }
}

/**
 * Pure Rotation Mechanics - Spins the full container element without warping images
 */
function rotateTile(tileElement, degrees) {
    let currentRotation = parseInt(tileElement.dataset.rotation) || 0;
    let newRotation = (currentRotation + degrees) % 360;
    
    tileElement.dataset.rotation = newRotation;
    tileElement.style.transform = `rotate(${newRotation}deg)`;
}

/**
 * Core Mouse & Touch Event Attachment Rules
 */
function initDragPhysics(element) {
    let offsetX = 0, offsetY = 0;

    element.addEventListener('mousedown', (e) => {
        GameEngine.isDragging = true;
        element.classList.add('dragging');
        offsetX = e.clientX - element.getBoundingClientRect().left;
        offsetY = e.clientY - element.getBoundingClientRect().top;
        
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    });

    function mouseMoveHandler(e) {
        if (!GameEngine.isDragging) return;
        const table = document.getElementById('game-table');
        const rect = table.getBoundingClientRect();
        
        let x = e.clientX - rect.left - offsetX;
        let y = e.clientY - rect.top - offsetY;
        
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
    }

    function mouseUpHandler() {
        GameEngine.isDragging = false;
        element.classList.remove('dragging');
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    }

    // Touch support for mobile interaction
    element.addEventListener('touchstart', (e) => {
        GameEngine.isDragging = true;
        element.classList.add('dragging');
        const touch = e.touches[0];
        offsetX = touch.clientX - element.getBoundingClientRect().left;
        offsetY = touch.clientY - element.getBoundingClientRect().top;
    }, { passive: true });

    element.addEventListener('touchmove', (e) => {
        if (!GameEngine.isDragging) return;
        const table = document.getElementById('game-table');
        const rect = table.getBoundingClientRect();
        const touch = e.touches[0];
        
        let x = touch.clientX - rect.left - offsetX;
        let y = touch.clientY - rect.top - offsetY;
        
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
    }, { passive: true });

    element.addEventListener('touchend', () => {
        GameEngine.isDragging = false;
        element.classList.remove('dragging');
    });
}

// Global Device Landscape Rotation Overlay Enforcer
window.addEventListener("orientationchange", () => {
    const overlay = document.getElementById("rotation-overlay");
    if (window.orientation === 90 || window.orientation === -90) {
        if (overlay) overlay.style.display = "none";
    } else {
        if (overlay) overlay.style.display = "flex";
    }
});
