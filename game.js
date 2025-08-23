// Game Canvas and Context
const canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');

// Game State
const game = {
    running: false,
    gameOver: false,
    distance: 0,
    speed: 2,
    gravity: 0.5,
    backgroundX: 0,
    multiplayer: false,
    carrotSpawnTimer: 0,
    carrotSpawnInterval: 120, // frames between carrot spawns
    fishSpawnTimer: 60, // offset fish spawning
    fishSpawnInterval: 120,
    vehicleSpawnTimer: 0,
    vehicleSpawnInterval: 90 // frames between vehicle spawns
};

// Player stats
const player1Stats = {
    carrots: 0,
    energy: 100
};

const player2Stats = {
    fish: 0,
    energy: 100
};

// Items arrays
const carrots = [];
const fish = [];
const vehicles = [];

// Oregon Bunny Character
const bunny = {
    x: 100,
    y: 260,
    width: 30,
    height: 35,
    velocityY: 0,
    jumping: false,
    color: '#D8BFD8', // Light lavender purple like Oregon Bunny
    earColor: '#E6D6E6', // Even lighter purple for inner ears
    earAngle: 0, // For floppy ear animation
    targetX: 100, // Initialize target position
    targetY: 260,
    invulnerable: false, // Temporary invulnerability after being hit
    invulnerableTimer: 0,
    
    draw() {
        // Don't draw if energy is depleted
        if (player1Stats.energy <= 0) return;
        
        // Flash when invulnerable (but only if still has energy)
        if (this.invulnerable && player1Stats.energy > 0 && Math.floor(this.invulnerableTimer / 5) % 2 === 0) {
            return; // Skip drawing every 5 frames for flashing effect
        }
        
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
        ctx.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2.2, this.height/2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Bunny head (rounder to match Oregon Bunny)
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + 10, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Long floppy ears
        ctx.fillStyle = this.color;
        // Left ear
        ctx.save();
        ctx.translate(this.x + 11, this.y + 3);
        ctx.rotate(-0.5 + this.earAngle);
        ctx.beginPath();
        ctx.ellipse(0, -8, 5, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        // Inner left ear
        ctx.fillStyle = this.earColor;
        ctx.beginPath();
        ctx.ellipse(0, -8, 3, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Right ear
        ctx.save();
        ctx.translate(this.x + 19, this.y + 3);
        ctx.rotate(0.5 - this.earAngle);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, -8, 5, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        // Inner right ear
        ctx.fillStyle = this.earColor;
        ctx.beginPath();
        ctx.ellipse(0, -8, 3, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Eyes (smaller and closer together like Oregon Bunny)
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + 12, this.y + 10, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 18, this.y + 10, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Pink nose (triangular like Oregon Bunny)
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.moveTo(this.x + 15, this.y + 15);
        ctx.lineTo(this.x + 13, this.y + 13);
        ctx.lineTo(this.x + 17, this.y + 13);
        ctx.closePath();
        ctx.fill();
        
        // Small fluffy tail
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x - 2, this.y + this.height/2, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },
    
    update() {
        // Handle invulnerability timer (only if still has energy)
        if (this.invulnerable && this.invulnerableTimer > 0 && player1Stats.energy > 0) {
            this.invulnerableTimer--;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
            }
        }
        
        // No gravity for Frogger-style movement
        // Smooth transition to target position
        let movementComplete = true;
        
        if (this.targetX !== undefined) {
            const dx = this.targetX - this.x;
            if (Math.abs(dx) > 1) {
                this.x += dx * 0.3; // Smooth hopping motion
                movementComplete = false;
            } else {
                this.x = this.targetX;
            }
        }
        
        if (this.targetY !== undefined) {
            const dy = this.targetY - this.y;
            if (Math.abs(dy) > 1) {
                this.y += dy * 0.3; // Smooth hopping motion
                movementComplete = false;
            } else {
                this.y = this.targetY;
            }
        }
        
        // Reset jumping flag when movement is complete
        if (movementComplete && this.jumping) {
            this.jumping = false;
        }
    },
    
    hop(direction) {
        const hopDistance = 50; // Grid-based hop distance
        
        switch(direction) {
            case 'up':
                if (this.y > 160 && !this.jumping) {
                    this.targetY = this.y - hopDistance;
                    this.jumping = true;
                }
                break;
            case 'down':
                if (this.y < 310 && !this.jumping) {
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
                if (this.x < 800 - this.width && !this.jumping) {
                    this.targetX = Math.min(800 - this.width, this.x + hopDistance);
                    this.jumping = true;
                }
                break;
        }
    }
};

// Orange Cat Character (Player 2)
const orangeCat = {
    x: 100,
    y: 210,
    width: 35,
    height: 30,
    active: false,
    jumping: false,
    tailWag: 0,
    targetX: 100, // Initialize target position
    targetY: 210,
    invulnerable: false, // Temporary invulnerability after being hit
    invulnerableTimer: 0,
    
    draw() {
        if (!this.active) return;
        
        // Don't draw if energy is depleted
        if (player2Stats.energy <= 0) return;
        
        // Flash when invulnerable (but only if still has energy)
        if (this.invulnerable && player2Stats.energy > 0 && Math.floor(this.invulnerableTimer / 5) % 2 === 0) {
            return; // Skip drawing every 5 frames for flashing effect
        }
        
        ctx.save();
        
        // Animate tail while moving
        const isMoving = (this.targetX !== undefined && Math.abs(this.targetX - this.x) > 1) ||
                        (this.targetY !== undefined && Math.abs(this.targetY - this.y) > 1);
        
        if (isMoving || this.jumping) {
            this.tailWag = Math.sin(Date.now() * 0.01) * 0.2;
        } else {
            this.tailWag *= 0.9;
        }
        
        // Cat tail (drawn first so it appears behind)
        ctx.save();
        ctx.translate(this.x - 3, this.y + this.height/2);
        ctx.rotate(this.tailWag);
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 5, -0.3, 0, Math.PI * 2);
        ctx.fill();
        // Tail stripes
        ctx.fillStyle = '#D2691E';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.ellipse(-6 + i * 6, 0, 3, 4, -0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        
        // Cat body
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2.2, this.height/3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body stripes
        ctx.fillStyle = '#D2691E';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.rect(this.x + 8 + i * 7, this.y + 8, 2, this.height - 12);
            ctx.fill();
        }
        
        // Cat head
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + 10, 11, 0, Math.PI * 2);
        ctx.fill();
        
        // Head stripes
        ctx.fillStyle = '#D2691E';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2 - 6, this.y + 6, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + this.width/2 + 6, this.y + 6, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + 3, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Cat ears (triangular)
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y + 3);
        ctx.lineTo(this.x + 7, this.y - 3);
        ctx.lineTo(this.x + 13, this.y);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.x + 25, this.y + 3);
        ctx.lineTo(this.x + 28, this.y - 3);
        ctx.lineTo(this.x + 22, this.y);
        ctx.closePath();
        ctx.fill();
        
        // Inner ears
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y + 1);
        ctx.lineTo(this.x + 9, this.y - 1);
        ctx.lineTo(this.x + 11, this.y);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.x + 25, this.y + 1);
        ctx.lineTo(this.x + 26, this.y - 1);
        ctx.lineTo(this.x + 24, this.y);
        ctx.closePath();
        ctx.fill();
        
        // Green eyes
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(this.x + 13, this.y + 10, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 22, this.y + 10, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye pupils
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + 13, this.y + 10, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 22, this.y + 10, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Pink nose
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.moveTo(this.x + 17.5, this.y + 13);
        ctx.lineTo(this.x + 16, this.y + 11.5);
        ctx.lineTo(this.x + 19, this.y + 11.5);
        ctx.closePath();
        ctx.fill();
        
        // Whiskers
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(this.x + 7, this.y + 12);
        ctx.lineTo(this.x + 2, this.y + 11);
        ctx.moveTo(this.x + 7, this.y + 14);
        ctx.lineTo(this.x + 2, this.y + 14);
        ctx.moveTo(this.x + 28, this.y + 12);
        ctx.lineTo(this.x + 33, this.y + 11);
        ctx.moveTo(this.x + 28, this.y + 14);
        ctx.lineTo(this.x + 33, this.y + 14);
        ctx.stroke();
        
        ctx.restore();
    },
    
    update() {
        if (!this.active) return;
        
        // Handle invulnerability timer (only if still has energy)
        if (this.invulnerable && this.invulnerableTimer > 0 && player2Stats.energy > 0) {
            this.invulnerableTimer--;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
            }
        }
        
        // Same movement system as bunny
        let movementComplete = true;
        
        if (this.targetX !== undefined) {
            const dx = this.targetX - this.x;
            if (Math.abs(dx) > 1) {
                this.x += dx * 0.3;
                movementComplete = false;
            } else {
                this.x = this.targetX;
            }
        }
        
        if (this.targetY !== undefined) {
            const dy = this.targetY - this.y;
            if (Math.abs(dy) > 1) {
                this.y += dy * 0.3;
                movementComplete = false;
            } else {
                this.y = this.targetY;
            }
        }
        
        // Reset jumping flag when movement is complete
        if (movementComplete && this.jumping) {
            this.jumping = false;
        }
    },
    
    hop(direction) {
        const hopDistance = 50;
        
        switch(direction) {
            case 'up':
                if (this.y > 160 && !this.jumping) {
                    this.targetY = this.y - hopDistance;
                    this.jumping = true;
                }
                break;
            case 'down':
                if (this.y < 310 && !this.jumping) {
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
                if (this.x < 800 - this.width && !this.jumping) {
                    this.targetX = Math.min(800 - this.width, this.x + hopDistance);
                    this.jumping = true;
                }
                break;
        }
    }
};

// Keyboard controls - Frogger style (one hop per keypress)
let keyPressed = {};

document.addEventListener('keydown', (e) => {
    // Always prevent default for arrow keys to avoid scrolling
    if (e.key.startsWith('Arrow')) {
        e.preventDefault();
    }
    
    if (!keyPressed[e.key] && game.running && !game.gameOver) {
        keyPressed[e.key] = true;
        
        switch(e.key) {
            case 'ArrowUp':
                if (player1Stats.energy > 0) bunny.hop('up');
                break;
            case 'ArrowDown':
                if (player1Stats.energy > 0) bunny.hop('down');
                break;
            case 'ArrowLeft':
                if (player1Stats.energy > 0) bunny.hop('left');
                break;
            case 'ArrowRight':
                if (player1Stats.energy > 0) bunny.hop('right');
                break;
            // WASD controls for Orange Cat (Player 2)
            case 'w':
            case 'W':
                if (game.multiplayer && orangeCat.active && player2Stats.energy > 0) {
                    orangeCat.hop('up');
                }
                break;
            case 's':
            case 'S':
                if (game.multiplayer && orangeCat.active && player2Stats.energy > 0) {
                    orangeCat.hop('down');
                }
                break;
            case 'a':
            case 'A':
                if (game.multiplayer && orangeCat.active && player2Stats.energy > 0) {
                    orangeCat.hop('left');
                }
                break;
            case 'd':
            case 'D':
                if (game.multiplayer && orangeCat.active && player2Stats.energy > 0) {
                    orangeCat.hop('right');
                }
                break;
        }
    }
});

document.addEventListener('keyup', (e) => {
    keyPressed[e.key] = false;
});

// Safeguard: Clear all key states when window loses focus
window.addEventListener('blur', () => {
    keyPressed = {};
});

// Safeguard: Reset key states periodically to prevent stuck keys
setInterval(() => {
    // Only reset if game is not running to avoid interfering with active gameplay
    if (!game.running) {
        keyPressed = {};
    }
}, 1000);

// Carrot class
class Carrot {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 35;
        this.collected = false;
        this.bobOffset = Math.random() * Math.PI * 2; // Random starting position for bobbing
    }
    
    update() {
        // Move left with the game speed
        this.x -= game.speed;
        
        // Gentle bobbing motion
        this.y += Math.sin(Date.now() * 0.003 + this.bobOffset) * 0.5;
    }
    
    draw() {
        ctx.save();
        
        // Carrot body (orange triangle)
        ctx.fillStyle = '#FF6B35';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2, this.y + this.height);
        ctx.lineTo(this.x + 5, this.y + 10);
        ctx.lineTo(this.x + this.width - 5, this.y + 10);
        ctx.closePath();
        ctx.fill();
        
        // Carrot top (wider part)
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + 10, this.width/2 - 2, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Carrot lines
        ctx.strokeStyle = '#E55100';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y + 15);
        ctx.lineTo(this.x + 12, this.y + 25);
        ctx.moveTo(this.x + 20, this.y + 15);
        ctx.lineTo(this.x + 18, this.y + 25);
        ctx.stroke();
        
        // Green leaves
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        // Leaf 1
        ctx.ellipse(this.x + this.width/2 - 5, this.y + 5, 3, 8, -0.3, 0, Math.PI * 2);
        ctx.fill();
        // Leaf 2
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + 3, 3, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        // Leaf 3
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2 + 5, this.y + 5, 3, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    checkCollision(character) {
        // Simple box collision
        return character.x < this.x + this.width &&
               character.x + character.width > this.x &&
               character.y < this.y + this.height &&
               character.y + character.height > this.y;
    }
}

// Fish class
class Fish {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 35;
        this.height = 25;
        this.collected = false;
        this.swimOffset = Math.random() * Math.PI * 2;
    }
    
    update() {
        // Move left with the game speed
        this.x -= game.speed;
        
        // Swimming motion
        this.y += Math.sin(Date.now() * 0.004 + this.swimOffset) * 0.8;
    }
    
    draw() {
        ctx.save();
        
        // Fish body
        ctx.fillStyle = '#4682B4';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2.5, this.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Fish tail
        ctx.beginPath();
        ctx.moveTo(this.x + this.width - 10, this.y + this.height/2);
        ctx.lineTo(this.x + this.width, this.y + 5);
        ctx.lineTo(this.x + this.width, this.y + this.height - 5);
        ctx.closePath();
        ctx.fill();
        
        // Fish scales pattern
        ctx.strokeStyle = '#5F9EA0';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(this.x + 10 + i * 6, this.y + this.height/2, 3, 0, Math.PI);
            ctx.stroke();
        }
        
        // Fish eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x + 8, this.y + this.height/2 - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + 8, this.y + this.height/2 - 3, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Fish fin
        ctx.fillStyle = '#4682B4';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2, this.y);
        ctx.lineTo(this.x + this.width/2 - 5, this.y - 5);
        ctx.lineTo(this.x + this.width/2 + 5, this.y - 5);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    checkCollision(character) {
        return character.x < this.x + this.width &&
               character.x + character.width > this.x &&
               character.y < this.y + this.height &&
               character.y + character.height > this.y;
    }
}

// Vehicle classes
class Vehicle {
    constructor(x, y, lane, type) {
        this.x = x;
        this.y = y;
        this.lane = lane; // 0-3 (top to bottom)
        this.type = type; // 'car', 'truck', 'semi'
        
        // Set dimensions based on type
        switch(type) {
            case 'car':
                this.width = 40;
                this.height = 30;
                this.speed = 3;
                this.color = this.randomCarColor();
                break;
            case 'truck':
                this.width = 50;
                this.height = 35;
                this.speed = 2.5;
                this.color = '#8B4513'; // Brown
                break;
            case 'semi':
                this.width = 70;
                this.height = 40;
                this.speed = 2;
                this.color = '#4169E1'; // Royal blue
                break;
        }
        
        // Top 2 lanes go right to left, bottom 2 go left to right
        if (lane < 2) {
            this.direction = -1; // Moving left
        } else {
            this.direction = 1; // Moving right
        }
    }
    
    randomCarColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    update(allVehicles) {
        // Check for vehicles ahead in the same lane
        let canMove = true;
        const safeDistance = 10; // Minimum gap between vehicles
        
        for (let other of allVehicles) {
            if (other === this || other.lane !== this.lane) continue;
            
            // Check if another vehicle is blocking our path
            if (this.direction > 0) { // Moving right
                // Check if there's a vehicle ahead to the right
                if (other.x > this.x && other.x < this.x + this.width + safeDistance + this.speed) {
                    canMove = false;
                    break;
                }
            } else { // Moving left
                // Check if there's a vehicle ahead to the left
                if (other.x < this.x && other.x + other.width > this.x - safeDistance - this.speed) {
                    canMove = false;
                    break;
                }
            }
        }
        
        // Only move if path is clear
        if (canMove) {
            this.x += this.speed * this.direction;
        }
    }
    
    draw() {
        ctx.save();
        
        // Vehicle body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add details based on type
        switch(this.type) {
            case 'car':
                // Windows
                ctx.fillStyle = '#87CEEB';
                ctx.fillRect(this.x + 10, this.y + 5, 8, 10);
                ctx.fillRect(this.x + 22, this.y + 5, 8, 10);
                // Wheels
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(this.x + 8, this.y + this.height, 4, 0, Math.PI * 2);
                ctx.arc(this.x + this.width - 8, this.y + this.height, 4, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'truck':
                // Cab window
                ctx.fillStyle = '#87CEEB';
                if (this.direction > 0) {
                    ctx.fillRect(this.x + this.width - 15, this.y + 5, 10, 12);
                } else {
                    ctx.fillRect(this.x + 5, this.y + 5, 10, 12);
                }
                // Cargo area
                ctx.fillStyle = '#654321';
                ctx.fillRect(this.x + 5, this.y + 5, this.width - 20, this.height - 10);
                // Wheels
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(this.x + 10, this.y + this.height, 5, 0, Math.PI * 2);
                ctx.arc(this.x + this.width - 10, this.y + this.height, 5, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'semi':
                // Cab
                ctx.fillStyle = '#1E3A8A';
                if (this.direction > 0) {
                    ctx.fillRect(this.x + this.width - 20, this.y, 20, this.height);
                    // Cab window
                    ctx.fillStyle = '#87CEEB';
                    ctx.fillRect(this.x + this.width - 15, this.y + 5, 10, 15);
                } else {
                    ctx.fillRect(this.x, this.y, 20, this.height);
                    // Cab window
                    ctx.fillStyle = '#87CEEB';
                    ctx.fillRect(this.x + 5, this.y + 5, 10, 15);
                }
                // Trailer
                ctx.fillStyle = '#C0C0C0';
                ctx.fillRect(this.x + (this.direction > 0 ? 0 : 20), this.y + 2, this.width - 20, this.height - 4);
                // Wheels
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(this.x + 10, this.y + this.height, 5, 0, Math.PI * 2);
                ctx.arc(this.x + 25, this.y + this.height, 5, 0, Math.PI * 2);
                ctx.arc(this.x + this.width - 25, this.y + this.height, 5, 0, Math.PI * 2);
                ctx.arc(this.x + this.width - 10, this.y + this.height, 5, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        
        ctx.restore();
    }
    
    checkCollision(character) {
        return character.x < this.x + this.width &&
               character.x + character.width > this.x &&
               character.y < this.y + this.height &&
               character.y + character.height > this.y;
    }
}

// Lane positions (Y coordinates for 4 lanes)
const LANE_Y = [150, 200, 250, 300];

// Draw background - Totoro inspired
function drawBackground() {
    // Sky gradient - soft Ghibli blue
    const skyGradient = ctx.createLinearGradient(0, 0, 0, 150);
    skyGradient.addColorStop(0, '#B8E6F5');
    skyGradient.addColorStop(1, '#E8F5E9');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, 800, 150);
    
    // Rolling hills in background (multiple layers for depth)
    // Far hills
    ctx.fillStyle = '#A8D5BA';
    ctx.beginPath();
    ctx.moveTo(0, 120);
    for (let x = 0; x <= 800; x += 50) {
        const hillOffset = (game.backgroundX * 0.05 + x) % 800;
        ctx.lineTo(x, 120 + Math.sin(hillOffset * 0.01) * 15);
    }
    ctx.lineTo(800, 150);
    ctx.lineTo(0, 150);
    ctx.closePath();
    ctx.fill();
    
    // Mid hills
    ctx.fillStyle = '#7FB069';
    ctx.beginPath();
    ctx.moveTo(0, 130);
    for (let x = 0; x <= 800; x += 30) {
        const hillOffset = (game.backgroundX * 0.08 + x) % 800;
        ctx.lineTo(x, 130 + Math.sin(hillOffset * 0.015) * 10);
    }
    ctx.lineTo(800, 150);
    ctx.lineTo(0, 150);
    ctx.closePath();
    ctx.fill();
    
    // Totoro-style giant trees in background
    for (let i = 0; i < 5; i++) {
        let treeX = ((game.backgroundX * 0.3 + i * 200) % 1000) - 100;
        if (treeX < 850 && treeX > -50) {
            drawGhibliTree(treeX, 80, 0.5 + (i % 2) * 0.2);
        }
    }
    
    // Fluffy Totoro-style clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    for (let i = 0; i < 3; i++) {
        let cloudOffset = (game.backgroundX * 0.1 + i * 300);
        let cloudX = ((cloudOffset % 900) + 900) % 900 - 100;
        drawTotoroCloud(cloudX, 20 + i * 25);
    }
    
    // Forest path instead of highway - dirt road with grass patches
    // Base dirt path
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(0, 150, 800, 200);
    
    // Add texture to path
    ctx.fillStyle = '#7A6449';
    for (let i = 0; i < 20; i++) {
        let patchX = ((game.backgroundX * 0.5 + i * 60) % 850) - 50;
        ctx.beginPath();
        ctx.ellipse(patchX, 180 + i * 15, 30, 10, Math.random(), 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Grass patches on the path
    ctx.fillStyle = '#6B8E23';
    for (let i = 0; i < 15; i++) {
        let grassX = ((game.backgroundX * 0.7 + i * 80) % 900) - 100;
        ctx.beginPath();
        ctx.ellipse(grassX, 160 + i * 20, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Path edges with wildflowers
    ctx.setLineDash([]);
    for (let side = 0; side <= 1; side++) {
        const y = side === 0 ? 150 : 350;
        // Grass edge
        ctx.fillStyle = '#4A7C2E';
        ctx.fillRect(0, y - 5, 800, 10);
        
        // Wildflowers
        for (let i = 0; i < 12; i++) {
            let flowerX = ((game.backgroundX * 0.8 + i * 70) % 850) - 50;
            drawWildflower(flowerX, y + (side === 0 ? -8 : 8), i);
        }
    }
    
    // Lush grass area after road
    const grassGradient = ctx.createLinearGradient(0, 350, 0, 400);
    grassGradient.addColorStop(0, '#5D8C3A');
    grassGradient.addColorStop(1, '#4A7C2E');
    ctx.fillStyle = grassGradient;
    ctx.fillRect(0, 350, 800, 50);
    
    // Add some soot sprites (susuwatari) occasionally
    if (Math.random() < 0.02) {
        drawSootSprite(Math.random() * 800, 100 + Math.random() * 250);
    }
}

// Draw Totoro-style fluffy cloud
function drawTotoroCloud(x, y) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    // Make clouds extra fluffy with multiple circles
    for (let i = 0; i < 5; i++) {
        const offsetX = i * 15 - 10;
        const offsetY = Math.sin(i) * 8;
        const radius = 20 + Math.random() * 10;
        ctx.beginPath();
        ctx.arc(x + offsetX, y + offsetY, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// Draw Ghibli-style giant tree
function drawGhibliTree(x, y, scale = 1) {
    ctx.save();
    
    // Tree trunk - thick and majestic
    const trunkWidth = 40 * scale;
    const trunkHeight = 80 * scale;
    
    ctx.fillStyle = '#4A3425';
    ctx.fillRect(x - trunkWidth/2, y, trunkWidth, trunkHeight);
    
    // Tree roots
    ctx.fillStyle = '#3D2B1F';
    for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * 15 * scale, y + trunkHeight);
        ctx.lineTo(x + i * 25 * scale, y + trunkHeight + 10 * scale);
        ctx.lineTo(x + i * 10 * scale, y + trunkHeight + 10 * scale);
        ctx.closePath();
        ctx.fill();
    }
    
    // Lush canopy - multiple layers
    const canopyY = y - 20 * scale;
    
    // Dark green base
    ctx.fillStyle = '#2D5016';
    for (let layer = 0; layer < 3; layer++) {
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const layerRadius = (60 - layer * 15) * scale;
            const leafX = x + Math.cos(angle) * layerRadius * 0.7;
            const leafY = canopyY - layer * 20 * scale + Math.sin(angle) * layerRadius * 0.5;
            ctx.beginPath();
            ctx.arc(leafX, leafY, 25 * scale, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Lighter green highlights
    ctx.fillStyle = '#5D8C3A';
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const leafX = x + Math.cos(angle) * 40 * scale;
        const leafY = canopyY - 30 * scale + Math.sin(angle) * 20 * scale;
        ctx.beginPath();
        ctx.arc(leafX, leafY, 20 * scale, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
}

// Draw wildflowers
function drawWildflower(x, y, index) {
    ctx.save();
    
    // Stem
    ctx.strokeStyle = '#3A5F0B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 10);
    ctx.stroke();
    
    // Flower petals - vary colors
    const colors = ['#FFB6C1', '#FFD700', '#E6E6FA', '#FFA07A', '#98FB98'];
    ctx.fillStyle = colors[index % colors.length];
    
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const petalX = x + Math.cos(angle) * 4;
        const petalY = y - 10 + Math.sin(angle) * 4;
        ctx.beginPath();
        ctx.arc(petalX, petalY, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Center
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x, y - 10, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Draw soot sprites (susuwatari)
function drawSootSprite(x, y) {
    ctx.save();
    
    // Fuzzy black body
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Fuzzy edges
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const spikeX = x + Math.cos(angle) * 10;
        const spikeY = y + Math.sin(angle) * 10;
        ctx.beginPath();
        ctx.arc(spikeX, spikeY, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Big white eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x - 3, y - 1, 3, 0, Math.PI * 2);
    ctx.arc(x + 3, y - 1, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupils
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(x - 3, y - 1, 1, 0, Math.PI * 2);
    ctx.arc(x + 3, y - 1, 1, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Draw game over screen
function drawGameOver() {
    // Use original game dimensions, not scaled canvas dimensions
    const gameWidth = 800;
    const gameHeight = 400;
    
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, gameWidth, gameHeight);
    
    // Game over text
    ctx.fillStyle = 'white';
    ctx.font = '24px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (game.multiplayer) {
        // Check which player(s) ran out of energy
        if (player1Stats.energy <= 0 && player2Stats.energy <= 0) {
            ctx.fillText('GAME OVER', gameWidth / 2, gameHeight / 2 - 40);
            ctx.font = '12px "Press Start 2P"';
            ctx.fillText('Both players ran out of energy!', gameWidth / 2, gameHeight / 2 + 10);
        } else if (player1Stats.energy <= 0) {
            ctx.fillText('GAME OVER', gameWidth / 2, gameHeight / 2 - 40);
            ctx.font = '12px "Press Start 2P"';
            ctx.fillText('Oregon Bunny ran out of energy!', gameWidth / 2, gameHeight / 2 + 10);
            ctx.fillText('Orange Cat wins!', gameWidth / 2, gameHeight / 2 + 40);
        } else if (player2Stats.energy <= 0) {
            ctx.fillText('GAME OVER', gameWidth / 2, gameHeight / 2 - 40);
            ctx.font = '12px "Press Start 2P"';
            ctx.fillText('Orange Cat ran out of energy!', gameWidth / 2, gameHeight / 2 + 10);
            ctx.fillText('Oregon Bunny wins!', gameWidth / 2, gameHeight / 2 + 40);
        }
    } else {
        ctx.fillText('GAME OVER', gameWidth / 2, gameHeight / 2 - 40);
        ctx.font = '12px "Press Start 2P"';
        ctx.fillText('Oregon Bunny ran out of energy!', gameWidth / 2, gameHeight / 2 + 10);
    }
    
    // Restart instruction
    ctx.font = '10px "Press Start 2P"';
    ctx.fillText('Click "Start Adventure" to play again', gameWidth / 2, gameHeight / 2 + 80);
}

// Update game stats display
function updateStats() {
    if (game.multiplayer) {
        // Multiplayer stats
        document.getElementById('mp-distance').textContent = Math.floor(game.distance);
        document.getElementById('p1-carrots').textContent = player1Stats.carrots;
        
        // Update player 1 energy bar
        const p1EnergyFill = document.getElementById('p1-energy-fill');
        if (p1EnergyFill) {
            p1EnergyFill.style.width = Math.max(0, player1Stats.energy) + '%';
            updateEnergyBarColor(p1EnergyFill, player1Stats.energy);
        }
        
        document.getElementById('p2-fish').textContent = player2Stats.fish;
        
        // Update player 2 energy bar
        const p2EnergyFill = document.getElementById('p2-energy-fill');
        if (p2EnergyFill) {
            p2EnergyFill.style.width = Math.max(0, player2Stats.energy) + '%';
            updateEnergyBarColor(p2EnergyFill, player2Stats.energy);
        }
    } else {
        // Single player stats
        document.getElementById('distance').textContent = Math.floor(game.distance);
        document.getElementById('carrots').textContent = player1Stats.carrots;
        
        // Update single player energy bar
        const energyFill = document.getElementById('energy-fill');
        if (energyFill) {
            energyFill.style.width = Math.max(0, player1Stats.energy) + '%';
            updateEnergyBarColor(energyFill, player1Stats.energy);
        }
    }
}

// Helper function to update energy bar colors
function updateEnergyBarColor(element, energy) {
    // Remove all color classes
    element.classList.remove('critical', 'low', 'medium', 'high', 'full');
    
    // Add appropriate color class based on energy level
    if (energy <= 10) {
        element.classList.add('critical');
    } else if (energy <= 25) {
        element.classList.add('low');
    } else if (energy <= 50) {
        element.classList.add('medium');
    } else if (energy <= 75) {
        element.classList.add('high');
    } else {
        element.classList.add('full');
    }
}

// Game loop
function gameLoop() {
    if (!game.running) return;
    
    // Ensure transform is applied at start of each frame
    // Use fallback values if not set
    const currentDpr = dpr || 1;
    const currentScale = renderScale || 1;
    ctx.setTransform(currentDpr * currentScale, 0, 0, currentDpr * currentScale, 0, 0);
    
    // Clear canvas
    ctx.clearRect(0, 0, 800, 400);
    
    // Update game
    bunny.update();
    if (game.multiplayer) {
        orangeCat.update();
    }
    
    // Decrease energy over time (hunger)
    if (player1Stats.energy > 0) {
        player1Stats.energy -= 0.05;
        player1Stats.energy = Math.max(0, player1Stats.energy);
    }
    
    if (game.multiplayer && player2Stats.energy > 0) {
        player2Stats.energy -= 0.05;
        player2Stats.energy = Math.max(0, player2Stats.energy);
    }
    
    // Check for game over
    if (game.multiplayer) {
        if (player1Stats.energy <= 0 && player2Stats.energy <= 0) {
            game.gameOver = true;
            game.running = false;
            document.getElementById('startBtn').textContent = 'Start Adventure';
        }
    } else {
        if (player1Stats.energy <= 0) {
            game.gameOver = true;
            game.running = false;
            document.getElementById('startBtn').textContent = 'Start Adventure';
        }
    }
    
    // Spawn carrots
    game.carrotSpawnTimer++;
    if (game.carrotSpawnTimer >= game.carrotSpawnInterval) {
        game.carrotSpawnTimer = 0;
        // Random Y position in the playable area
        const yPosition = 150 + Math.random() * 150;
        carrots.push(new Carrot(canvas.width + 50, yPosition));
    }
    
    // Spawn fish (only in multiplayer)
    if (game.multiplayer) {
        game.fishSpawnTimer++;
        if (game.fishSpawnTimer >= game.fishSpawnInterval) {
            game.fishSpawnTimer = 0;
            const yPosition = 150 + Math.random() * 150;
            fish.push(new Fish(canvas.width + 50, yPosition));
        }
    }
    
    // Spawn vehicles
    game.vehicleSpawnTimer++;
    if (game.vehicleSpawnTimer >= game.vehicleSpawnInterval) {
        game.vehicleSpawnTimer = 0;
        
        // Random lane (0-3)
        const lane = Math.floor(Math.random() * 4);
        
        // Random vehicle type
        const types = ['car', 'car', 'truck', 'semi']; // More cars than trucks/semis
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Create vehicle at appropriate starting position
        let startX;
        if (lane < 2) {
            // Top lanes (0,1) move right to left, start from right
            startX = canvas.width + 20;
        } else {
            // Bottom lanes (2,3) move left to right, start from left
            startX = -80;
        }
        
        const vehicle = new Vehicle(startX, LANE_Y[lane] + 5, lane, type);
        vehicles.push(vehicle);
    }
    
    // Update carrots
    for (let i = carrots.length - 1; i >= 0; i--) {
        const carrot = carrots[i];
        carrot.update();
        
        // Only bunny can collect carrots
        if (carrot.checkCollision(bunny)) {
            player1Stats.carrots++;
            player1Stats.energy = Math.min(100, player1Stats.energy + 20); // Restore 20 energy
            carrots.splice(i, 1);
            continue;
        }
        
        // Remove carrots that have gone off screen
        if (carrot.x < -carrot.width) {
            carrots.splice(i, 1);
        }
    }
    
    // Update fish (only in multiplayer)
    if (game.multiplayer) {
        for (let i = fish.length - 1; i >= 0; i--) {
            const fishItem = fish[i];
            fishItem.update();
            
            // Only orange cat can collect fish
            if (orangeCat.active && fishItem.checkCollision(orangeCat)) {
                player2Stats.fish++;
                player2Stats.energy = Math.min(100, player2Stats.energy + 20); // Restore 20 energy
                fish.splice(i, 1);
                continue;
            }
            
            // Remove fish that have gone off screen
            if (fishItem.x < -fishItem.width) {
                fish.splice(i, 1);
            }
        }
    }
    
    // Update vehicles
    for (let i = vehicles.length - 1; i >= 0; i--) {
        const vehicle = vehicles[i];
        vehicle.update(vehicles);
        
        // Check collision with bunny (only if bunny has energy and not invulnerable)
        if (player1Stats.energy > 0 && !bunny.invulnerable && vehicle.checkCollision(bunny)) {
            // Only reset position if still has energy after collision
            const newEnergy = Math.max(0, player1Stats.energy - 25);
            if (newEnergy > 0) {
                // Reset bunny position
                bunny.x = 100;
                bunny.y = 260;
                bunny.targetX = bunny.x;
                bunny.targetY = bunny.y;
            }
            player1Stats.energy = newEnergy;
            // Make bunny invulnerable for 60 frames (1 second at 60fps)
            bunny.invulnerable = true;
            bunny.invulnerableTimer = 60;
        }
        
        // Check collision with orange cat in multiplayer (only if cat has energy and not invulnerable)
        if (game.multiplayer && orangeCat.active && player2Stats.energy > 0 && !orangeCat.invulnerable && vehicle.checkCollision(orangeCat)) {
            // Only reset position if still has energy after collision
            const newEnergy = Math.max(0, player2Stats.energy - 25);
            if (newEnergy > 0) {
                // Reset orange cat position
                orangeCat.x = 100;
                orangeCat.y = 210;
                orangeCat.targetX = orangeCat.x;
                orangeCat.targetY = orangeCat.y;
            }
            player2Stats.energy = newEnergy;
            // Make orange cat invulnerable for 60 frames (1 second at 60fps)
            orangeCat.invulnerable = true;
            orangeCat.invulnerableTimer = 60;
        }
        
        // Remove vehicles that have gone off screen
        if ((vehicle.direction < 0 && vehicle.x < -vehicle.width - 50) ||
            (vehicle.direction > 0 && vehicle.x > canvas.width + 50)) {
            vehicles.splice(i, 1);
        }
    }
    
    // Update distance and background
    game.distance += game.speed * 0.1;
    game.backgroundX -= game.speed;
    
    // Draw everything
    drawBackground();
    
    // Draw vehicles
    vehicles.forEach(vehicle => vehicle.draw());
    
    // Draw carrots
    carrots.forEach(carrot => carrot.draw());
    
    // Draw fish (only in multiplayer)
    if (game.multiplayer) {
        fish.forEach(fishItem => fishItem.draw());
    }
    
    bunny.draw();
    if (game.multiplayer) {
        orangeCat.draw();
    }
    
    // Update UI
    updateStats();
    
    // Draw game over message if needed
    if (game.gameOver) {
        drawGameOver();
    }
    
    // Continue loop
    requestAnimationFrame(gameLoop);
}

// Start game
document.getElementById('startBtn').addEventListener('click', () => {
    if (!game.running || game.gameOver) {
        // If game over, reset everything
        if (game.gameOver) {
            game.gameOver = false;
            game.distance = 0;
            game.backgroundX = 0;
            player1Stats.carrots = 0;
            player1Stats.energy = 100;
            player2Stats.fish = 0;
            player2Stats.energy = 100;
            carrots.length = 0;
            fish.length = 0;
            vehicles.length = 0;
            // Reset character positions and states
            bunny.x = 100;
            bunny.y = 260;
            bunny.targetX = bunny.x;
            bunny.targetY = bunny.y;
            bunny.invulnerable = false;
            bunny.invulnerableTimer = 0;
            orangeCat.x = 100;
            orangeCat.y = 210;
            orangeCat.targetX = orangeCat.x;
            orangeCat.targetY = orangeCat.y;
            orangeCat.invulnerable = false;
            orangeCat.invulnerableTimer = 0;
        }
        
        game.running = true;
        document.getElementById('startBtn').textContent = 'Pause';
        // Reset game state for new game
        if (game.distance === 0) {
            player1Stats.carrots = 0;
            player1Stats.energy = 100;
            player2Stats.fish = 0;
            player2Stats.energy = 100;
            carrots.length = 0; // Clear all carrots
            fish.length = 0; // Clear all fish
            vehicles.length = 0; // Clear all vehicles
        }
        gameLoop();
    } else {
        game.running = false;
        document.getElementById('startBtn').textContent = 'Resume';
    }
});

// Multiplayer toggle
document.getElementById('multiplayerBtn').addEventListener('click', () => {
    game.multiplayer = !game.multiplayer;
    orangeCat.active = game.multiplayer;
    
    const btn = document.getElementById('multiplayerBtn');
    const instructions = document.getElementById('instructionText');
    const singleStats = document.getElementById('singlePlayerStats');
    const multiStats = document.getElementById('multiplayerStats');
    const distanceBar = document.querySelector('.distance-bar');
    const player2Controls = document.querySelector('.player2-controls');
    
    if (game.multiplayer) {
        btn.textContent = 'Two Players';
        instructions.innerHTML = 'Player 1 (Bunny): Arrow keys ↑ ↓ ← → | Player 2 (Cat): WASD keys';
        // Show multiplayer stats, hide single player stats and distance bar
        singleStats.style.display = 'none';
        multiStats.style.display = 'flex';
        if (distanceBar) distanceBar.style.display = 'none';
        // Show player 2 mobile controls
        if (player2Controls) player2Controls.style.display = 'block';
        // Reset Orange Cat position
        orangeCat.x = 100;
        orangeCat.y = 210;
        orangeCat.targetX = orangeCat.x;
        orangeCat.targetY = orangeCat.y;
        // Reset player 2 stats
        player2Stats.fish = 0;
        player2Stats.energy = 100;
    } else {
        btn.textContent = 'Single Player';
        instructions.innerHTML = 'Help Oregon Bunny hop to Oregon! Use arrow keys ↑ ↓ ← → to hop in any direction';
        // Show single player stats and distance bar, hide multiplayer stats
        singleStats.style.display = 'flex';
        multiStats.style.display = 'none';
        if (distanceBar) distanceBar.style.display = 'block';
        // Hide player 2 mobile controls
        if (player2Controls) player2Controls.style.display = 'none';
        // Clear fish array when switching to single player
        fish.length = 0;
    }
    
    // Update stats display
    updateStats();
    
    // Redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    bunny.draw();
    if (game.multiplayer) {
        orangeCat.draw();
    }
});

// Scale factor for rendering
let renderScale = 1;
let dpr = 1;

// Canvas resizing
function resizeCanvas() {
    const gameArea = document.querySelector('.game-area');
    const container = document.querySelector('.game-container');
    
    // Get available space
    const availableWidth = gameArea.offsetWidth - 40; // Account for padding
    const availableHeight = window.innerHeight - 300; // Account for header, controls, padding
    
    // Calculate scale to maintain aspect ratio (2:1)
    const targetAspectRatio = 2; // 800/400
    let newWidth, newHeight;
    
    if (availableWidth / availableHeight > targetAspectRatio) {
        // Height is limiting factor
        newHeight = availableHeight;
        newWidth = newHeight * targetAspectRatio;
    } else {
        // Width is limiting factor
        newWidth = availableWidth;
        newHeight = newWidth / targetAspectRatio;
    }
    
    // Get device pixel ratio for crisp rendering
    dpr = window.devicePixelRatio || 1;
    
    // Calculate render scale based on new size vs original size
    renderScale = newWidth / 800;
    
    // Set actual canvas size (accounting for device pixel ratio)
    canvas.width = newWidth * dpr;
    canvas.height = newHeight * dpr;
    
    // Re-acquire context after changing canvas dimensions
    ctx = canvas.getContext('2d');
    
    // Scale canvas context for device pixel ratio and render scale
    ctx.scale(dpr * renderScale, dpr * renderScale);
    
    // Update canvas display size (CSS)
    canvas.style.width = newWidth + 'px';
    canvas.style.height = newHeight + 'px';
    
    // Redraw if game is not running
    if (!game.running) {
        drawBackground();
        bunny.draw();
        if (game.multiplayer) {
            orangeCat.draw();
        }
    }
}

// Handle window resize with debouncing to prevent issues
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        resizeCanvas();
    }, 100);
});

// Initial setup
resizeCanvas();
drawBackground();
bunny.draw();

// Simple focus management - canvas doesn't need focus for document-level key events
// Just prevent scrolling on arrow keys which is handled in the keydown listener

// Mobile controls
const mobileButtons = document.querySelectorAll('.dpad-btn');
mobileButtons.forEach(btn => {
    // Touch start (or mouse down for testing)
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const player = btn.dataset.player;
        const direction = btn.dataset.direction;
        
        if (game.running && !game.gameOver) {
            if (player === '1' && player1Stats.energy > 0) {
                bunny.hop(direction);
            } else if (player === '2' && game.multiplayer && player2Stats.energy > 0) {
                orangeCat.hop(direction);
            }
        }
    });
    
    // Also add click for desktop testing
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const player = btn.dataset.player;
        const direction = btn.dataset.direction;
        
        if (game.running && !game.gameOver) {
            if (player === '1' && player1Stats.energy > 0) {
                bunny.hop(direction);
            } else if (player === '2' && game.multiplayer && player2Stats.energy > 0) {
                orangeCat.hop(direction);
            }
        }
    });
});