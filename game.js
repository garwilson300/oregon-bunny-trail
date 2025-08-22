// Game Canvas and Context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
const game = {
    running: false,
    distance: 0,
    carrots: 0,
    energy: 100,
    speed: 2,
    gravity: 0.5,
    backgroundX: 0
};

// Oregon Bunny Character
const bunny = {
    x: 100,
    y: 250,
    width: 50,
    height: 60,
    velocityY: 0,
    jumping: false,
    color: '#D8BFD8', // Light lavender purple like Oregon Bunny
    earColor: '#E6D6E6', // Even lighter purple for inner ears
    earAngle: 0, // For floppy ear animation
    
    draw() {
        // Save context state
        ctx.save();
        
        // Animate ears while hopping
        const isMoving = (this.targetX !== undefined && Math.abs(this.targetX - this.x) > 1) ||
                        (this.targetY !== undefined && Math.abs(this.targetY - this.y) > 1);
        
        if (isMoving || this.jumping) {
            this.earAngle = Math.sin(Date.now() * 0.01) * 0.3;
        } else {
            this.earAngle *= 0.9; // Gradually return to rest
        }
        
        // Bunny body (round and fluffy)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2, this.height/2.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Bunny head (rounder to match Oregon Bunny)
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + 18, 22, 0, Math.PI * 2);
        ctx.fill();
        
        // Long floppy ears
        ctx.fillStyle = this.color;
        // Left ear
        ctx.save();
        ctx.translate(this.x + 18, this.y + 5);
        ctx.rotate(-0.5 + this.earAngle);
        ctx.beginPath();
        ctx.ellipse(0, -15, 10, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        // Inner left ear
        ctx.fillStyle = this.earColor;
        ctx.beginPath();
        ctx.ellipse(0, -15, 5, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Right ear
        ctx.save();
        ctx.translate(this.x + 32, this.y + 5);
        ctx.rotate(0.5 - this.earAngle);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, -15, 10, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        // Inner right ear
        ctx.fillStyle = this.earColor;
        ctx.beginPath();
        ctx.ellipse(0, -15, 5, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Eyes (smaller and closer together like Oregon Bunny)
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y + 18, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 30, this.y + 18, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Pink nose (triangular like Oregon Bunny)
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.moveTo(this.x + 25, this.y + 26);
        ctx.lineTo(this.x + 22, this.y + 23);
        ctx.lineTo(this.x + 28, this.y + 23);
        ctx.closePath();
        ctx.fill();
        
        // Small fluffy tail
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y + this.height/2, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },
    
    update() {
        // No gravity for Frogger-style movement
        // Smooth transition to target position
        if (this.targetX !== undefined) {
            const dx = this.targetX - this.x;
            if (Math.abs(dx) > 1) {
                this.x += dx * 0.3; // Smooth hopping motion
            } else {
                this.x = this.targetX;
            }
        }
        
        if (this.targetY !== undefined) {
            const dy = this.targetY - this.y;
            if (Math.abs(dy) > 1) {
                this.y += dy * 0.3; // Smooth hopping motion
            } else {
                this.y = this.targetY;
                this.jumping = false;
            }
        }
    },
    
    hop(direction) {
        const hopDistance = 50; // Grid-based hop distance
        
        switch(direction) {
            case 'up':
                if (this.y > 100 && !this.jumping) {
                    this.targetY = this.y - hopDistance;
                    this.jumping = true;
                }
                break;
            case 'down':
                if (this.y < 300 && !this.jumping) {
                    this.targetY = this.y + hopDistance;
                    this.jumping = true;
                }
                break;
            case 'left':
                if (this.x > 0 && !this.jumping) {
                    this.targetX = Math.max(0, this.x - hopDistance);
                    this.jumping = true;
                }
                break;
            case 'right':
                if (this.x < canvas.width - this.width && !this.jumping) {
                    this.targetX = Math.min(canvas.width - this.width, this.x + hopDistance);
                    this.jumping = true;
                }
                break;
        }
    }
};

// Keyboard controls - Frogger style (one hop per keypress)
let keyPressed = {};

document.addEventListener('keydown', (e) => {
    if (!keyPressed[e.key] && game.running) {
        keyPressed[e.key] = true;
        
        switch(e.key) {
            case 'ArrowUp':
                bunny.hop('up');
                break;
            case 'ArrowDown':
                bunny.hop('down');
                break;
            case 'ArrowLeft':
                bunny.hop('left');
                break;
            case 'ArrowRight':
                bunny.hop('right');
                break;
        }
    }
});

document.addEventListener('keyup', (e) => {
    keyPressed[e.key] = false;
});

// Draw background
function drawBackground() {
    // Sky
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, 250);
    
    // Ground
    ctx.fillStyle = '#8FBC8F';
    ctx.fillRect(0, 250, canvas.width, 150);
    
    // Simple moving clouds
    ctx.fillStyle = 'white';
    for (let i = 0; i < 3; i++) {
        const cloudX = (game.backgroundX + i * 300) % (canvas.width + 100) - 100;
        drawCloud(cloudX, 50 + i * 30);
    }
    
    // Road
    ctx.fillStyle = '#696969';
    ctx.fillRect(0, 340, canvas.width, 60);
    
    // Road lines
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(0, 370);
    ctx.lineTo(canvas.width, 370);
    ctx.stroke();
    ctx.setLineDash([]);
}

// Draw cloud helper
function drawCloud(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.arc(x + 25, y, 35, 0, Math.PI * 2);
    ctx.arc(x + 50, y, 25, 0, Math.PI * 2);
    ctx.fill();
}

// Update game stats display
function updateStats() {
    document.getElementById('distance').textContent = Math.floor(game.distance);
    document.getElementById('carrots').textContent = game.carrots;
    document.getElementById('energy').textContent = game.energy;
}

// Game loop
function gameLoop() {
    if (!game.running) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update game
    bunny.update();
    
    // Update distance and background
    game.distance += game.speed * 0.1;
    game.backgroundX -= game.speed;
    
    // Draw everything
    drawBackground();
    bunny.draw();
    
    // Update UI
    updateStats();
    
    // Continue loop
    requestAnimationFrame(gameLoop);
}

// Start game
document.getElementById('startBtn').addEventListener('click', () => {
    if (!game.running) {
        game.running = true;
        document.getElementById('startBtn').textContent = 'Pause';
        gameLoop();
    } else {
        game.running = false;
        document.getElementById('startBtn').textContent = 'Resume';
    }
});

// Initial draw
drawBackground();
bunny.draw();