// ==========================================================================
// Tellstream Dominoes - Game Lifecycle & Loader Logic
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
    initLoader();
});

/**
 * Runs a genuine 10-second loading meter countdown
 */
function initLoader() {
    const progressBar = document.getElementById("progress-bar-inner");
    const progressText = document.getElementById("progress-text");
    const actionBtn = document.getElementById("action-btn");
    
    let percentage = 0;
    const totalDuration = 10000; // 10 seconds total
    const intervalTime = 100;   // Update every 100ms
    const step = 100 / (totalDuration / intervalTime);

    const loaderInterval = setInterval(() => {
        percentage += step;
        if (percentage >= 100) {
            percentage = 100;
            clearInterval(loaderInterval);
            
            // Loading complete: Swap meter out for the custom action button
            progressText.innerText = "Lounge Ready.";
            progressBar.parentElement.style.display = "none"; 
            
            // Reveal and update the button text exactly as requested
            actionBtn.innerText = "Hold a seat when you ready !";
            actionBtn.classList.remove("hidden-btn");
            
            // Listen for the seat selection click
            actionBtn.addEventListener("click", enterGameLobby);
        } else {
            progressText.innerText = `Loading Lounge... ${Math.floor(percentage)}%`;
            progressBar.style.width = `${percentage}%`;
        }
    }, intervalTime);
}

/**
 * Transition from the splash screen into the live multiplayer lobby
 */
function enterGameLobby() {
    const loadingScreen = document.getElementById("loading-screen");
    const gameContainer = document.getElementById("game-container");

    // Smoothly fade out the loading splash screen
    loadingScreen.style.opacity = "0";
    
    setTimeout(() => {
        loadingScreen.style.display = "none";
        gameContainer.classList.remove("hidden-layout");
        
        // Initialize the network connection layer
        if (typeof initNetwork === "function") {
            initNetwork();
        }
    }, 800); // Matches the 0.8s CSS transition opacity time
}
