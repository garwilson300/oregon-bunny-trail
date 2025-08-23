// Alternative Xbox detection and sizing approach
// We can use this if the current approach doesn't work

function detectXbox() {
    const userAgent = navigator.userAgent.toLowerCase();
    // Xbox Edge usually contains "xbox" in the user agent
    return userAgent.includes('xbox') || userAgent.includes('edge/');
}

function xboxCanvasResize() {
    const isXbox = detectXbox();
    
    if (isXbox) {
        // Force specific dimensions for Xbox
        const canvas = document.getElementById('gameCanvas');
        const container = document.querySelector('.game-container');
        
        // Use fixed proportions that work well on TV
        const width = Math.min(window.innerWidth * 0.75, 1400);
        const height = width / 2; // Maintain 2:1 ratio
        
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        canvas.width = width;
        canvas.height = height;
        
        // Force container to fit
        if (container) {
            container.style.maxHeight = 'none';
            container.style.height = 'auto';
        }
        
        console.log('Xbox detected, using fixed sizing:', { width, height });
        return true;
    }
    return false;
}

// Could also try removing flexbox entirely for Xbox
function xboxLayoutFix() {
    if (detectXbox()) {
        const gameArea = document.querySelector('.game-area');
        if (gameArea) {
            gameArea.style.display = 'block';
            gameArea.style.textAlign = 'center';
        }
    }
}