// Game Canvas and Context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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
                if (this.x < canvas.width - this.width && !this.jumping) {
                    this.targetX = Math.min(canvas.width - this.width, this.x + hopDistance);
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
    
    draw() {
        if (!this.active) return;
        
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
        
        // Same movement system as bunny
        if (this.targetX !== undefined) {
            const dx = this.targetX - this.x;
            if (Math.abs(dx) > 1) {
                this.x += dx * 0.3;
            } else {
                this.x = this.targetX;
            }
        }
        
        if (this.targetY !== undefined) {
            const dy = this.targetY - this.y;
            if (Math.abs(dy) > 1) {
                this.y += dy * 0.3;
            } else {
                this.y = this.targetY;
                this.jumping = false;
            }
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
    if (!keyPressed[e.key] && game.running && !game.gameOver) {
        keyPressed[e.key] = true;
        
        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                if (player1Stats.energy > 0) bunny.hop('up');
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (player1Stats.energy > 0) bunny.hop('down');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (player1Stats.energy > 0) bunny.hop('left');
                break;
            case 'ArrowRight':
                e.preventDefault();
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
    
    update() {
        this.x += this.speed * this.direction;
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

// Draw background
function drawBackground() {
    // Sky
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, 150);
    
    // Grass area before road
    ctx.fillStyle = '#8FBC8F';
    ctx.fillRect(0, 100, canvas.width, 50);
    
    // Simple moving clouds
    ctx.fillStyle = 'white';
    for (let i = 0; i < 3; i++) {
        const cloudX = (game.backgroundX + i * 300) % (canvas.width + 100) - 100;
        drawCloud(cloudX, 30 + i * 20);
    }
    
    // 4-lane highway
    ctx.fillStyle = '#696969';
    ctx.fillRect(0, 150, canvas.width, 200);
    
    // Lane dividers
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 10]);
    
    // Lane lines (3 dividers for 4 lanes)
    for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 150 + i * 50);
        ctx.lineTo(canvas.width, 150 + i * 50);
        ctx.stroke();
    }
    
    // Center divider (double yellow line)
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(0, 248);
    ctx.lineTo(canvas.width, 248);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 252);
    ctx.lineTo(canvas.width, 252);
    ctx.stroke();
    
    // Grass area after road
    ctx.fillStyle = '#8FBC8F';
    ctx.fillRect(0, 350, canvas.width, 50);
}

// Draw cloud helper
function drawCloud(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.arc(x + 25, y, 35, 0, Math.PI * 2);
    ctx.arc(x + 50, y, 25, 0, Math.PI * 2);
    ctx.fill();
}

// Draw game over screen
function drawGameOver() {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Game over text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Fredoka';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (game.multiplayer) {
        // Check which player(s) ran out of energy
        if (player1Stats.energy <= 0 && player2Stats.energy <= 0) {
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);
            ctx.font = '24px Fredoka';
            ctx.fillText('Both players ran out of energy!', canvas.width / 2, canvas.height / 2 + 10);
        } else if (player1Stats.energy <= 0) {
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);
            ctx.font = '24px Fredoka';
            ctx.fillText('Oregon Bunny ran out of energy!', canvas.width / 2, canvas.height / 2 + 10);
            ctx.fillText('Orange Cat wins!', canvas.width / 2, canvas.height / 2 + 40);
        } else if (player2Stats.energy <= 0) {
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);
            ctx.font = '24px Fredoka';
            ctx.fillText('Orange Cat ran out of energy!', canvas.width / 2, canvas.height / 2 + 10);
            ctx.fillText('Oregon Bunny wins!', canvas.width / 2, canvas.height / 2 + 40);
        }
    } else {
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = '24px Fredoka';
        ctx.fillText('Oregon Bunny ran out of energy!', canvas.width / 2, canvas.height / 2 + 10);
    }
    
    // Restart instruction
    ctx.font = '20px Fredoka';
    ctx.fillText('Click "Start Adventure" to play again', canvas.width / 2, canvas.height / 2 + 80);
}

// Update game stats display
function updateStats() {
    if (game.multiplayer) {
        // Multiplayer stats
        document.getElementById('mp-distance').textContent = Math.floor(game.distance);
        document.getElementById('p1-carrots').textContent = player1Stats.carrots;
        document.getElementById('p1-energy').textContent = Math.floor(player1Stats.energy);
        document.getElementById('p2-fish').textContent = player2Stats.fish;
        document.getElementById('p2-energy').textContent = Math.floor(player2Stats.energy);
    } else {
        // Single player stats
        document.getElementById('distance').textContent = Math.floor(game.distance);
        document.getElementById('carrots').textContent = player1Stats.carrots;
        document.getElementById('energy').textContent = Math.floor(player1Stats.energy);
    }
}

// Game loop
function gameLoop() {
    if (!game.running) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
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
        vehicle.update();
        
        // Check collision with bunny
        if (vehicle.checkCollision(bunny)) {
            // Reset bunny position
            bunny.x = 100;
            bunny.y = 260;
            bunny.targetX = bunny.x;
            bunny.targetY = bunny.y;
            // Lose some energy on collision
            player1Stats.energy = Math.max(0, player1Stats.energy - 25);
        }
        
        // Check collision with orange cat in multiplayer
        if (game.multiplayer && orangeCat.active && vehicle.checkCollision(orangeCat)) {
            // Reset orange cat position
            orangeCat.x = 100;
            orangeCat.y = 210;
            orangeCat.targetX = orangeCat.x;
            orangeCat.targetY = orangeCat.y;
            // Lose some energy on collision
            player2Stats.energy = Math.max(0, player2Stats.energy - 25);
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
            // Reset character positions
            bunny.x = 100;
            bunny.y = 260;
            bunny.targetX = bunny.x;
            bunny.targetY = bunny.y;
            orangeCat.x = 100;
            orangeCat.y = 210;
            orangeCat.targetX = orangeCat.x;
            orangeCat.targetY = orangeCat.y;
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
    
    if (game.multiplayer) {
        btn.textContent = 'Two Players';
        instructions.innerHTML = 'Player 1 (Bunny): Arrow keys ↑ ↓ ← → | Player 2 (Cat): WASD keys';
        // Show multiplayer stats, hide single player stats
        singleStats.style.display = 'none';
        multiStats.style.display = 'flex';
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
        // Show single player stats, hide multiplayer stats
        singleStats.style.display = 'flex';
        multiStats.style.display = 'none';
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

// Initial draw
drawBackground();
bunny.draw();