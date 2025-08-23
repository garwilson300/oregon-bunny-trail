// Game Canvas and Context
const canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');

// Theme Management
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const htmlElement = document.documentElement;

// Check for saved theme preference or default to dark mode (better for gaming)
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    htmlElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

// Update theme icon based on current theme
function updateThemeIcon(theme) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Check if dark mode is active
function isDarkMode() {
    return htmlElement.getAttribute('data-theme') === 'dark';
}

// Toggle theme
function toggleTheme() {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    
    // Redraw canvas with new theme if game is not running
    if (!game.running) {
        drawBackground();
        bunny.draw();
        if (game.multiplayer) {
            orangeCat.draw();
        }
    }
}

// Add event listener for theme toggle
themeToggle.addEventListener('click', toggleTheme);

// Character Management System
const CharacterSystem = {
    // Check if a character can perform actions (move, collect items, etc)
    canAct(character, stats) {
        return stats.energy > 0 && (character.active === undefined || character.active);
    },
    
    // Check if a character can collect items
    canCollect(character, stats) {
        return this.canAct(character, stats) && !character.invulnerable;
    },
    
    // Check if character should be drawn
    shouldDraw(character, stats) {
        return stats.energy > 0 && (character.active === undefined || character.active);
    },
    
    // Check if character is in invulnerable flash state
    isFlashing(character, stats) {
        return character.invulnerable && stats.energy > 0 && 
               Math.floor(character.invulnerableTimer / 5) % 2 === 0;
    },
    
    // Handle taking damage for any character
    takeDamage(character, stats, amount, resetX, resetY) {
        if (stats.energy <= 0 || character.invulnerable) return false;
        
        const newEnergy = Math.max(0, stats.energy - amount);
        
        // Only reset position if still alive after damage
        if (newEnergy > 0) {
            character.x = resetX;
            character.y = resetY;
            character.targetX = resetX;
            character.targetY = resetY;
        }
        
        stats.energy = newEnergy;
        character.invulnerable = true;
        character.invulnerableTimer = 60;
        
        return true;
    },
    
    // Handle collecting items for any character
    collectItem(character, stats, itemType, energyRestore = 20) {
        if (!this.canCollect(character, stats)) return false;
        
        stats[itemType]++;
        stats.energy = Math.min(100, stats.energy + energyRestore);
        return true;
    },
    
    // Update invulnerability timer
    updateInvulnerability(character, stats) {
        if (character.invulnerable && character.invulnerableTimer > 0 && stats.energy > 0) {
            character.invulnerableTimer--;
            if (character.invulnerableTimer <= 0) {
                character.invulnerable = false;
            }
        }
    }
};

// Difficulty Settings
const difficultySettings = {
    beginner: {
        speed: 1.5,
        spawnMultiplier: 1.5, // Higher = slower spawns
        energyDrainMultiplier: 0.7,
        label: '🌱 Beginner'
    },
    intermediate: {
        speed: 2,
        spawnMultiplier: 1,
        energyDrainMultiplier: 1,
        label: '🌿 Intermediate'
    },
    expert: {
        speed: 3,
        spawnMultiplier: 0.75,
        energyDrainMultiplier: 1.3,
        label: '🔥 Expert'
    },
    berserker: {
        speed: 4,
        spawnMultiplier: 0.5,
        energyDrainMultiplier: 1.6,
        label: '💀 Berserker'
    }
};

// Game State
const game = {
    running: false,
    gameOver: false,
    distance: 0,
    speed: 2,
    gravity: 0.5,
    backgroundX: 0,
    multiplayer: false,
    difficulty: 'intermediate', // Current difficulty setting
    carrotSpawnTimer: 0,
    carrotSpawnInterval: 120, // frames between carrot spawns
    fishSpawnTimer: 60, // offset fish spawning
    fishSpawnInterval: 120,
    vehicleSpawnTimer: 0,
    vehicleSpawnInterval: 90, // frames between vehicle spawns
    sootSpriteSpawnTimer: 0,
    sootSpriteSpawnInterval: 600, // Very rare - about every 10 seconds at 60fps
    clouds: [], // Persistent cloud data
    groundPatches: [], // Persistent ground texture patches
    grassPatches: [], // Persistent grass patches
    flowers: [], // Persistent flower data
    stars: [] // Persistent star data for dark mode
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
const sootSprites = [];

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
        // Use CharacterSystem to check if should draw
        if (!CharacterSystem.shouldDraw(this, player1Stats)) return;
        
        // Flash when invulnerable using CharacterSystem
        if (CharacterSystem.isFlashing(this, player1Stats)) {
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
        // Handle invulnerability timer using CharacterSystem
        CharacterSystem.updateInvulnerability(this, player1Stats);
        
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
        
        // Use CharacterSystem to check if should draw
        if (!CharacterSystem.shouldDraw(this, player2Stats)) return;
        
        // Flash when invulnerable using CharacterSystem
        if (CharacterSystem.isFlashing(this, player2Stats)) {
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
        
        // Handle invulnerability timer using CharacterSystem
        CharacterSystem.updateInvulnerability(this, player2Stats);
        
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
                if (CharacterSystem.canAct(bunny, player1Stats)) bunny.hop('up');
                break;
            case 'ArrowDown':
                if (CharacterSystem.canAct(bunny, player1Stats)) bunny.hop('down');
                break;
            case 'ArrowLeft':
                if (CharacterSystem.canAct(bunny, player1Stats)) bunny.hop('left');
                break;
            case 'ArrowRight':
                if (CharacterSystem.canAct(bunny, player1Stats)) bunny.hop('right');
                break;
            // WASD controls for Orange Cat (Player 2)
            case 'w':
            case 'W':
                if (game.multiplayer && CharacterSystem.canAct(orangeCat, player2Stats)) {
                    orangeCat.hop('up');
                }
                break;
            case 's':
            case 'S':
                if (game.multiplayer && CharacterSystem.canAct(orangeCat, player2Stats)) {
                    orangeCat.hop('down');
                }
                break;
            case 'a':
            case 'A':
                if (game.multiplayer && CharacterSystem.canAct(orangeCat, player2Stats)) {
                    orangeCat.hop('left');
                }
                break;
            case 'd':
            case 'D':
                if (game.multiplayer && CharacterSystem.canAct(orangeCat, player2Stats)) {
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
        this.width = 18;  // Smaller size
        this.height = 20; // Smaller size
        this.collected = false;
        this.bobOffset = Math.random() * Math.PI * 2; // Random starting position for bobbing
        this.rotateAngle = 0; // For cute rotation animation
    }
    
    update() {
        // Move left with the game speed
        this.x -= game.speed;
        
        // Gentle bobbing motion
        this.y += Math.sin(Date.now() * 0.003 + this.bobOffset) * 0.5;
        
        // Cute rotation animation
        this.rotateAngle = Math.sin(Date.now() * 0.002 + this.bobOffset) * 0.1;
    }
    
    draw() {
        ctx.save();
        
        // Apply cute rotation
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotateAngle);
        ctx.translate(-(this.x + this.width/2), -(this.y + this.height/2));
        
        // Cute carrot body (rounded cone shape)
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#FF8C42');
        gradient.addColorStop(1, '#FF6B35');
        ctx.fillStyle = gradient;
        
        // Draw rounded carrot shape
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + 8, this.width/2.5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Tapered bottom part
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2 - 6, this.y + 8);
        ctx.quadraticCurveTo(this.x + this.width/2 - 4, this.y + 12, this.x + this.width/2, this.y + this.height);
        ctx.quadraticCurveTo(this.x + this.width/2 + 4, this.y + 12, this.x + this.width/2 + 6, this.y + 8);
        ctx.fill();
        
        // Cute detail lines
        ctx.strokeStyle = 'rgba(229, 81, 0, 0.5)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2 - 2, this.y + 10);
        ctx.lineTo(this.x + this.width/2 - 1, this.y + 14);
        ctx.moveTo(this.x + this.width/2 + 2, this.y + 10);
        ctx.lineTo(this.x + this.width/2 + 1, this.y + 14);
        ctx.stroke();
        
        // Cute green leaves (smaller and more stylized)
        ctx.fillStyle = '#4CAF50';
        // Center leaf
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + 4, 2, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Left leaf
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2 - 3, this.y + 5, 2, 4, -0.4, 0, Math.PI * 2);
        ctx.fill();
        // Right leaf
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2 + 3, this.y + 5, 2, 4, 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Add a tiny highlight for cuteness
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2 - 2, this.y + 9, 1.5, 2, -0.2, 0, Math.PI * 2);
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

// Soot Sprite class (rare collectible)
class SootSprite {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 8 + Math.random() * 8;
        this.eyeOffset = Math.random() * 2;
        this.collected = false;
        this.floatOffset = Math.random() * Math.PI * 2;
        this.width = this.size * 2 + 4; // Account for fuzzy edges
        this.height = this.size * 2 + 4;
    }
    
    update() {
        // Move left with the game
        this.x -= game.speed * 0.5;
        
        // Gentle floating motion
        this.y += Math.sin(Date.now() * 0.002 + this.floatOffset) * 0.3;
    }
    
    draw() {
        ctx.save();
        
        // Fuzzy black body
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Fuzzy edges
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const spikeX = this.x + Math.cos(angle) * (this.size + 2);
            const spikeY = this.y + Math.sin(angle) * (this.size + 2);
            ctx.beginPath();
            ctx.arc(spikeX, spikeY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Big white eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 1, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 3, this.y - 1, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils (with animated offset)
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x - 3 + this.eyeOffset, this.y - 1, 1, 0, Math.PI * 2);
        ctx.arc(this.x + 3 + this.eyeOffset, this.y - 1, 1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    checkCollision(character) {
        // Simple circle collision for soot sprites
        const dx = character.x + character.width/2 - this.x;
        const dy = character.y + character.height/2 - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.size + Math.min(character.width, character.height)/2;
    }
}

// Sardine class (was Fish class)
class Fish {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;  // Longer and thinner
        this.height = 12; // Much flatter like a real sardine
        this.collected = false;
        this.swimOffset = Math.random() * Math.PI * 2;
    }
    
    update() {
        // Move left with the game speed
        this.x -= game.speed;
        
        // Swimming motion - more subtle for sardines
        this.y += Math.sin(Date.now() * 0.004 + this.swimOffset) * 0.5;
    }
    
    draw() {
        ctx.save();
        
        // Create gradient for silvery sardine body
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#C0C0C0');    // Silver top
        gradient.addColorStop(0.5, '#E8E8E8');  // Light silver middle
        gradient.addColorStop(1, '#A8A8A8');    // Darker silver bottom
        
        // Sardine body - elongated ellipse
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2.2, this.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Blue-green stripe along the side (characteristic of sardines)
        ctx.strokeStyle = '#4682B4';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x + 5, this.y + this.height/2 - 2);
        ctx.lineTo(this.x + this.width - 8, this.y + this.height/2 - 2);
        ctx.stroke();
        
        // Subtle scale texture
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(this.x + 8 + i * 6, this.y + this.height/2, 2, -Math.PI/3, Math.PI/3);
            ctx.stroke();
        }
        
        // Sardine tail - V-shaped and smaller
        ctx.fillStyle = '#B8B8B8';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width - 5, this.y + this.height/2);
        ctx.lineTo(this.x + this.width + 2, this.y + 2);
        ctx.lineTo(this.x + this.width, this.y + this.height/2);
        ctx.lineTo(this.x + this.width + 2, this.y + this.height - 2);
        ctx.closePath();
        ctx.fill();
        
        // Eye - smaller and more realistic
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x + 6, this.y + this.height/2 - 1, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + 6, this.y + this.height/2 - 1, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Tiny dorsal fin
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2, this.y - 1);
        ctx.lineTo(this.x + this.width/2 - 3, this.y);
        ctx.lineTo(this.x + this.width/2 + 3, this.y);
        ctx.closePath();
        ctx.fill();
        
        // Gill line
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + this.height/2, 3, Math.PI/2, 3*Math.PI/2);
        ctx.stroke();
        
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
        
        // Draw Spirited Away villains in dark mode, vehicles in light mode
        if (isDarkMode()) {
            this.drawSpiritedAwayVillain();
        } else {
            this.drawVehicle();
        }
        
        ctx.restore();
    }
    
    drawSpiritedAwayVillain() {
        switch(this.type) {
            case 'car': // No-Face
                this.drawNoFace();
                break;
            case 'truck': // Stink Spirit
                this.drawStinkSpirit();
                break;
            case 'semi': // Yubaba's bird form
                this.drawYubabaBird();
                break;
        }
    }
    
    drawNoFace() {
        const centerX = this.x + this.width/2;
        const centerY = this.y + this.height/2;
        
        // No-Face body (dark semi-transparent shadow)
        ctx.fillStyle = 'rgba(20, 10, 30, 0.8)';
        ctx.beginPath();
        // Taller, more ghost-like shape
        ctx.ellipse(centerX, centerY + 3, this.width/2.2, this.height/1.8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Darker inner shadow
        ctx.fillStyle = 'rgba(10, 5, 20, 0.6)';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 5, this.width/2.5, this.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // White mask (oval shaped)
        ctx.fillStyle = '#f8f8f8';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 3, this.width/3.2, this.height/2.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Purple/gray forehead marking (distinctive teardrop shape)
        ctx.fillStyle = '#9b8fb4';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 12, 3, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Purple cheek markings (tear-like streaks under eyes)
        ctx.fillStyle = '#a394b8';
        
        // Left cheek marking
        ctx.beginPath();
        ctx.moveTo(centerX - 7, centerY - 3);
        ctx.quadraticCurveTo(centerX - 8, centerY + 2, centerX - 6, centerY + 6);
        ctx.quadraticCurveTo(centerX - 5, centerY + 8, centerX - 4, centerY + 6);
        ctx.quadraticCurveTo(centerX - 5, centerY + 2, centerX - 7, centerY - 3);
        ctx.closePath();
        ctx.fill();
        
        // Right cheek marking
        ctx.beginPath();
        ctx.moveTo(centerX + 7, centerY - 3);
        ctx.quadraticCurveTo(centerX + 8, centerY + 2, centerX + 6, centerY + 6);
        ctx.quadraticCurveTo(centerX + 5, centerY + 8, centerX + 4, centerY + 6);
        ctx.quadraticCurveTo(centerX + 5, centerY + 2, centerX + 7, centerY - 3);
        ctx.closePath();
        ctx.fill();
        
        // Eye holes (perfect circles, deep black voids)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(centerX - 7, centerY - 6, 2.5, 0, Math.PI * 2);
        ctx.arc(centerX + 7, centerY - 6, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Mouth (thin dark gray line)
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(centerX - 4, centerY + 3);
        ctx.lineTo(centerX + 4, centerY + 3);
        ctx.stroke();
        
        // Subtle mask edge shadow for depth
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 3, this.width/3.2, this.height/2.2, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    drawStinkSpirit() {
        // Stink Spirit - massive sludge monster from the bathhouse scene
        const centerX = this.x + this.width/2;
        const centerY = this.y + this.height/2;
        
        // Main sludge body (dark brown-black with dripping effect)
        const gradient = ctx.createRadialGradient(
            centerX, centerY - 5, 0,
            centerX, centerY, this.width/2
        );
        gradient.addColorStop(0, '#2a1f1a');
        gradient.addColorStop(0.5, '#3d2f26');
        gradient.addColorStop(1, '#1a1511');
        ctx.fillStyle = gradient;
        
        // Amorphous blob shape with dripping sludge
        ctx.beginPath();
        for (let i = 0; i <= 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const wobble = Math.sin(Date.now() * 0.002 + i * 0.8) * 4;
            const drip = (i % 3 === 0) ? Math.sin(Date.now() * 0.003 + i) * 6 : 0;
            const radius = (this.width/2) + wobble + drip;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius * 0.7 + (drip > 0 ? drip : 0);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Debris and garbage sticking out (bicycle, trash, etc.)
        ctx.save();
        
        // Bicycle wheel outline
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX - this.width/4, centerY - this.height/4, 6, 0, Math.PI * 2);
        ctx.stroke();
        // Spokes
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(centerX - this.width/4, centerY - this.height/4);
            ctx.lineTo(
                centerX - this.width/4 + Math.cos(angle) * 6,
                centerY - this.height/4 + Math.sin(angle) * 6
            );
            ctx.stroke();
        }
        
        // Random debris pieces
        ctx.fillStyle = '#5a5a5a';
        // Pipe
        ctx.fillRect(centerX + this.width/5, centerY - this.height/3, 3, 12);
        // Can
        ctx.beginPath();
        ctx.arc(centerX - this.width/6, centerY + this.height/4, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Sludge drips falling
        ctx.fillStyle = '#2a1f1a';
        for (let i = 0; i < 3; i++) {
            const dripX = centerX + (i - 1) * this.width/3;
            const dripProgress = (Date.now() * 0.002 + i) % 2;
            if (dripProgress < 1) {
                const dripY = this.y + this.height + dripProgress * 10;
                ctx.beginPath();
                ctx.ellipse(dripX, dripY, 2, 4, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Murky surface texture
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        for (let i = 0; i < 5; i++) {
            const blobX = centerX + Math.sin(Date.now() * 0.001 + i) * this.width/3;
            const blobY = centerY + Math.cos(Date.now() * 0.001 + i) * this.height/4;
            ctx.beginPath();
            ctx.arc(blobX, blobY, 3 + i % 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Stench clouds (more subtle)
        ctx.strokeStyle = 'rgba(143, 124, 56, 0.2)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            const cloudX = centerX + (i - 0.5) * 20;
            const waveOffset = Math.sin(Date.now() * 0.004 + i) * 3;
            ctx.moveTo(cloudX, this.y - 3);
            ctx.quadraticCurveTo(
                cloudX + waveOffset, this.y - 8,
                cloudX - waveOffset, this.y - 12
            );
            ctx.stroke();
        }
        
        // Hidden face area (darker shadow where face might be)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(centerX, centerY - this.height/5, this.width/4, 0, Math.PI * 2);
        ctx.fill();
        
        // Glowing eyes in the darkness (barely visible)
        ctx.fillStyle = 'rgba(255, 100, 100, 0.4)';
        ctx.beginPath();
        ctx.arc(centerX - 6, centerY - this.height/5, 1.5, 0, Math.PI * 2);
        ctx.arc(centerX + 6, centerY - this.height/5, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawYubabaBird() {
        // Yubaba in bird form - large head with distinctive features
        const centerX = this.x + this.width/2;
        const centerY = this.y + this.height/2;
        
        // Wings (dark feathered, more realistic)
        const wingFlap = Math.sin(Date.now() * 0.008) * 15;
        
        // Left wing with feather details
        ctx.fillStyle = '#1a1a2e';
        ctx.save();
        ctx.translate(centerX - this.width/3, centerY);
        ctx.rotate(Math.PI/6 - wingFlap * 0.02);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-15, -wingFlap, -25, -5);
        ctx.quadraticCurveTo(-20, 5, -15, 10);
        ctx.quadraticCurveTo(-10, 8, 0, 5);
        ctx.closePath();
        ctx.fill();
        
        // Wing feather lines
        ctx.strokeStyle = '#0f0f1e';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-5 - i*5, 0);
            ctx.lineTo(-8 - i*6, 5);
            ctx.stroke();
        }
        ctx.restore();
        
        // Right wing with feather details
        ctx.save();
        ctx.translate(centerX + this.width/3, centerY);
        ctx.rotate(-Math.PI/6 + wingFlap * 0.02);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(15, -wingFlap, 25, -5);
        ctx.quadraticCurveTo(20, 5, 15, 10);
        ctx.quadraticCurveTo(10, 8, 0, 5);
        ctx.closePath();
        ctx.fill();
        
        // Wing feather lines
        ctx.strokeStyle = '#0f0f1e';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(5 + i*5, 0);
            ctx.lineTo(8 + i*6, 5);
            ctx.stroke();
        }
        ctx.restore();
        
        // Bird body (smaller, dark)
        ctx.fillStyle = '#2a2a3e';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 5, this.width/4, this.height/3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Yubaba's distinctive large head (oversized compared to bird body)
        const headSize = this.width/2.5;
        
        // Hair bun (tan/light brown like in the movie)
        ctx.fillStyle = '#d4a574';
        ctx.beginPath();
        ctx.arc(centerX, centerY - headSize/2, headSize * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        // Hair shine/highlights
        ctx.fillStyle = '#e0b584';
        ctx.beginPath();
        ctx.arc(centerX - headSize/4, centerY - headSize/2 - headSize/4, headSize * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Hair details/ornaments (darker brown lines for texture)
        ctx.strokeStyle = '#b8935f';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Spiral pattern in hair
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * headSize * 0.4;
            const y = centerY - headSize/2 + Math.sin(angle) * headSize * 0.4;
            ctx.moveTo(x, y);
            ctx.arc(x, y, 3, 0, Math.PI * 2);
        }
        ctx.stroke();
        
        // Hair pin/ornament (small blue jewel)
        ctx.fillStyle = '#4169e1';
        ctx.beginPath();
        ctx.arc(centerX + headSize/3, centerY - headSize/2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Face (pale with wrinkles)
        ctx.fillStyle = '#ffd4aa';
        ctx.beginPath();
        ctx.arc(centerX, centerY - 2, headSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Wrinkle lines
        ctx.strokeStyle = '#d4a574';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(centerX - headSize/3, centerY - 5);
        ctx.quadraticCurveTo(centerX, centerY - 3, centerX + headSize/3, centerY - 5);
        ctx.moveTo(centerX - headSize/4, centerY + 2);
        ctx.quadraticCurveTo(centerX, centerY + 4, centerX + headSize/4, centerY + 2);
        ctx.stroke();
        
        // Beak-like nose (hooked and prominent)
        ctx.fillStyle = '#ffb380';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.quadraticCurveTo(centerX - headSize/8, centerY + 3, centerX - headSize/10, centerY + 6);
        ctx.quadraticCurveTo(centerX, centerY + 8, centerX + headSize/10, centerY + 6);
        ctx.quadraticCurveTo(centerX + headSize/8, centerY + 3, centerX, centerY);
        ctx.closePath();
        ctx.fill();
        
        // Nose bridge highlight
        ctx.strokeStyle = '#ffc8a0';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX, centerY + 5);
        ctx.stroke();
        
        // Menacing eyes with heavy lids
        ctx.fillStyle = '#2a1a3e';
        ctx.beginPath();
        ctx.ellipse(centerX - headSize/4, centerY - 3, 4, 2, 0, 0, Math.PI * 2);
        ctx.ellipse(centerX + headSize/4, centerY - 3, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye pupils (small and beady)
        ctx.fillStyle = '#8b0000';
        ctx.beginPath();
        ctx.arc(centerX - headSize/4, centerY - 3, 1.5, 0, Math.PI * 2);
        ctx.arc(centerX + headSize/4, centerY - 3, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyebrows (angry)
        ctx.strokeStyle = '#4a5568';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - headSize/3, centerY - 8);
        ctx.lineTo(centerX - headSize/5, centerY - 5);
        ctx.moveTo(centerX + headSize/3, centerY - 8);
        ctx.lineTo(centerX + headSize/5, centerY - 5);
        ctx.stroke();
        
        // Mouth (grimacing)
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(centerX - headSize/5, centerY + 7);
        ctx.quadraticCurveTo(centerX, centerY + 5, centerX + headSize/5, centerY + 7);
        ctx.stroke();
        
        // Earrings (golden spheres)
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(centerX - headSize/2, centerY, 2, 0, Math.PI * 2);
        ctx.arc(centerX + headSize/2, centerY, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Add shadow under head for depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + headSize/3, headSize/3, headSize/6, 0, 0, Math.PI);
        ctx.fill();
    }
    
    drawVehicle() {
        // Original vehicle drawing code
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
    // Sky gradient - soft Ghibli blue or night sky for dark mode
    const skyGradient = ctx.createLinearGradient(0, 0, 0, 150);
    if (isDarkMode()) {
        skyGradient.addColorStop(0, '#0f1729');
        skyGradient.addColorStop(1, '#1a2544');
    } else {
        skyGradient.addColorStop(0, '#B8E6F5');
        skyGradient.addColorStop(1, '#E8F5E9');
    }
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, 800, 150);
    
    // Draw stars in dark mode (behind everything else)
    if (isDarkMode() && game.stars && game.stars.length > 0) {
        drawStars();
    }
    
    // Rolling hills in background (multiple layers for depth)
    // Far hills
    ctx.fillStyle = isDarkMode() ? '#2c4a5a' : '#A8D5BA';
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
    ctx.fillStyle = isDarkMode() ? '#1e3a4a' : '#7FB069';
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
    
    // Fluffy Totoro-style clouds (drawn BEFORE trees so they appear behind)
    ctx.fillStyle = isDarkMode() ? 'rgba(200, 200, 220, 0.3)' : 'rgba(255, 255, 255, 0.9)';
    if (game.clouds && game.clouds.length > 0) {
        for (let i = 0; i < game.clouds.length; i++) {
            let cloudOffset = (game.backgroundX * 0.1 + game.clouds[i].x);
            let cloudX = ((cloudOffset % 900) + 900) % 900 - 100;
            drawTotoroCloud(cloudX, game.clouds[i].y, game.clouds[i].circles);
        }
    }
    
    // Totoro-style giant trees in background (drawn AFTER clouds so they appear in front)
    for (let i = 0; i < 8; i++) {
        // Fixed tree positioning to prevent disappearing
        const treeSpacing = 150;
        const scrollOffset = game.backgroundX * 0.3;
        const basePosition = i * treeSpacing;
        
        // Calculate tree position with proper wrapping (add scroll offset since backgroundX is negative)
        let treeX = basePosition + scrollOffset;
        
        // Wrap trees around when they go off screen
        while (treeX < -100) {
            treeX += 8 * treeSpacing;
        }
        while (treeX > 900) {
            treeX -= 8 * treeSpacing;
        }
        
        // Only draw trees that are visible
        if (treeX > -100 && treeX < 900) {
            // Place trees at a consistent horizon line for natural look
            // Trees are rooted at ground level, with slight variation for depth
            const treeY = 105 + (i % 3) * 5; // Slight variation for depth perception
            drawGhibliTree(treeX, treeY, 0.5 + (i % 2) * 0.2);
        }
    }
    
    // Forest path instead of highway - dirt road with grass patches
    // Base dirt path
    ctx.fillStyle = isDarkMode() ? '#2a2a3a' : '#8B7355';
    ctx.fillRect(0, 150, 800, 200);
    
    // Add texture to path (use persistent patches)
    ctx.fillStyle = isDarkMode() ? '#1f1f2f' : '#7A6449';
    if (game.groundPatches && game.groundPatches.length > 0) {
        for (let patch of game.groundPatches) {
            // Scroll right to left with the background - simple modulo like trees
            let patchX = (patch.x + game.backgroundX * 0.5) % 1500;
            if (patchX < 0) patchX += 1500;
            
            if (patchX > -50 && patchX < 850) {
                ctx.beginPath();
                ctx.ellipse(patchX, patch.y, 30, 10, patch.rotation, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    // Grass patches on the path (use persistent patches)
    ctx.fillStyle = isDarkMode() ? '#2a4a3a' : '#6B8E23';
    if (game.grassPatches && game.grassPatches.length > 0) {
        for (let patch of game.grassPatches) {
            // Scroll right to left with the background - simple modulo like trees
            let grassX = (patch.x + game.backgroundX * 0.7) % 1500;
            if (grassX < 0) grassX += 1500;
            
            if (grassX > -20 && grassX < 820) {
                ctx.beginPath();
                ctx.ellipse(grassX, patch.y, 15, 8, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    // Draw top edge grass and flowers first
    ctx.setLineDash([]);
    // Top grass edge
    ctx.fillStyle = isDarkMode() ? '#1a3a2a' : '#4A7C2E';
    ctx.fillRect(0, 145, 800, 10);
    
    // Top wildflowers - place them ON the grass strip, not above it
    if (game.flowers && game.flowers.length > 0) {
        // Use half the flowers for top grass
        for (let i = 0; i < Math.floor(game.flowers.length / 2); i++) {
            const flower = game.flowers[i];
            // Scroll right to left with the background - simple modulo like trees
            let flowerX = (flower.x + game.backgroundX * 0.8) % 2000;
            if (flowerX < 0) flowerX += 2000;
            
            if (flowerX > -20 && flowerX < 820) {
                // Place flowers ON the grass strip (y: 145-155), not above it
                const yPos = 148 + (i % 2) * 3; // Slight variation but ON the grass
                drawWildflower(flowerX, yPos, flower.type, flower.petalColor);
            }
        }
    }
    
    // Lush grass area after road (draw before bottom flowers)
    const grassGradient = ctx.createLinearGradient(0, 350, 0, 400);
    if (isDarkMode()) {
        grassGradient.addColorStop(0, '#1a3a2a');
        grassGradient.addColorStop(1, '#153025');
    } else {
        grassGradient.addColorStop(0, '#5D8C3A');
        grassGradient.addColorStop(1, '#4A7C2E');
    }
    ctx.fillStyle = grassGradient;
    ctx.fillRect(0, 350, 800, 50);
    
    // Bottom grass edge
    ctx.fillStyle = isDarkMode() ? '#1a3a2a' : '#4A7C2E';
    ctx.fillRect(0, 345, 800, 10);
    
    // Bottom wildflowers (draw after grass so they're not covered)
    // Spread them across the bottom grass area
    if (game.flowers && game.flowers.length > 0) {
        // Use second half of flowers for bottom grass
        for (let i = Math.floor(game.flowers.length / 2); i < game.flowers.length; i++) {
            const flower = game.flowers[i];
            // Scroll right to left with the background - simple modulo like trees
            let flowerX = (flower.x + 35 + game.backgroundX * 0.8) % 2000;
            if (flowerX < 0) flowerX += 2000;
            
            if (flowerX > -20 && flowerX < 820) {
                // Spread flowers across the grass area (y: 350-395)
                const baseY = 355 + ((i - Math.floor(game.flowers.length / 2)) * 8) % 35; // Distribute across grass
                const yPos = baseY + (flower.yOffset || 0);
                drawWildflower(flowerX, yPos, flower.type, flower.petalColor);
            }
        }
    }
    
    // Soot sprites are now collectible items, handled in the game loop
}

// Draw stars in the night sky
function drawStars() {
    ctx.save();
    
    for (let star of game.stars) {
        // Calculate star position with parallax effect
        let starX = ((star.x - game.backgroundX * 0.02) % 800 + 800) % 800;
        
        // Twinkling effect
        const twinkle = Math.sin(Date.now() * 0.001 * star.twinkleSpeed + star.twinkleOffset) * 0.5 + 0.5;
        const opacity = star.brightness * (0.5 + twinkle * 0.5);
        
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        
        // Draw star shape
        if (star.size > 1.5) {
            // Larger stars get a sparkle effect
            const size = star.size * twinkle;
            ctx.arc(starX, star.y, size, 0, Math.PI * 2);
            ctx.fill();
            // Add sparkle cross
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.5})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(starX - size * 2, star.y);
            ctx.lineTo(starX + size * 2, star.y);
            ctx.moveTo(starX, star.y - size * 2);
            ctx.lineTo(starX, star.y + size * 2);
            ctx.stroke();
        } else {
            // Smaller stars are just circles
            ctx.arc(starX, star.y, star.size * twinkle, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    ctx.restore();
}

// Draw Totoro-style fluffy cloud
function drawTotoroCloud(x, y, circles) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    // Use persistent circle data if provided
    if (circles && circles.length > 0) {
        for (let circle of circles) {
            ctx.beginPath();
            ctx.arc(x + circle.offsetX, y + circle.offsetY, circle.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        // Fallback for old clouds
        for (let i = 0; i < 5; i++) {
            const offsetX = i * 15 - 10;
            const offsetY = Math.sin(i) * 8;
            const radius = 20 + Math.random() * 10;
            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
}

// Draw Ghibli-style giant tree
function drawGhibliTree(x, y, scale = 1) {
    ctx.save();
    
    // Tree trunk - thick and majestic
    const trunkWidth = 40 * scale;
    const trunkHeight = 80 * scale;
    
    ctx.fillStyle = isDarkMode() ? '#2a1f1a' : '#4A3425';
    ctx.fillRect(x - trunkWidth/2, y, trunkWidth, trunkHeight);
    
    // Tree roots
    ctx.fillStyle = isDarkMode() ? '#1f1510' : '#3D2B1F';
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
    ctx.fillStyle = isDarkMode() ? '#1a3010' : '#2D5016';
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
    ctx.fillStyle = isDarkMode() ? '#2a4a20' : '#5D8C3A';
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
function drawWildflower(x, y, type, petalColor) {
    ctx.save();
    
    // Stem
    ctx.strokeStyle = isDarkMode() ? '#2a4010' : '#3A5F0B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 10);
    ctx.stroke();
    
    // Flower petals - use provided color or fallback
    if (!petalColor) {
        const colors = ['#FFB6C1', '#FFD700', '#E6E6FA', '#FFA07A', '#98FB98'];
        petalColor = colors[type % colors.length];
    }
    ctx.fillStyle = petalColor;
    
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
    
    // Decrease energy over time (hunger) - affected by difficulty
    const energyDrain = 0.05 * difficultySettings[game.difficulty].energyDrainMultiplier;
    
    if (player1Stats.energy > 0) {
        player1Stats.energy -= energyDrain;
        player1Stats.energy = Math.max(0, player1Stats.energy);
    }
    
    if (game.multiplayer && player2Stats.energy > 0) {
        player2Stats.energy -= energyDrain;
        player2Stats.energy = Math.max(0, player2Stats.energy);
    }
    
    // Check for game over
    if (game.multiplayer) {
        if (player1Stats.energy <= 0 && player2Stats.energy <= 0) {
            game.gameOver = true;
            game.running = false;
            // Show difficulty buttons again
            document.getElementById('difficultyButtons').style.display = 'flex';
            document.getElementById('startBtn').style.display = 'none';
        }
    } else {
        if (player1Stats.energy <= 0) {
            game.gameOver = true;
            game.running = false;
            // Show difficulty buttons again
            document.getElementById('difficultyButtons').style.display = 'flex';
            document.getElementById('startBtn').style.display = 'none';
        }
    }
    
    // Spawn carrots (only if bunny can collect them)
    if (player1Stats.energy > 0) {
        game.carrotSpawnTimer++;
        if (game.carrotSpawnTimer >= game.carrotSpawnInterval) {
            game.carrotSpawnTimer = 0;
            // Random Y position in the playable area
            const yPosition = 150 + Math.random() * 150;
            carrots.push(new Carrot(canvas.width + 50, yPosition));
        }
    }
    
    // Spawn fish (only in multiplayer and if cat can collect them)
    if (game.multiplayer && player2Stats.energy > 0) {
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
    
    // Spawn soot sprites (very rare, only if at least one character can collect them)
    const canSpawnSootSprites = player1Stats.energy > 0 || (game.multiplayer && player2Stats.energy > 0);
    if (canSpawnSootSprites) {
        game.sootSpriteSpawnTimer++;
        if (game.sootSpriteSpawnTimer >= game.sootSpriteSpawnInterval) {
            game.sootSpriteSpawnTimer = 0;
            // Random chance to actually spawn (making them even rarer)
            if (Math.random() < 0.5) { // 50% chance when timer is up
                const yPosition = 160 + Math.random() * 140; // Spawn in playable area
                sootSprites.push(new SootSprite(canvas.width + 50, yPosition));
            }
        }
    }
    
    // Update carrots
    for (let i = carrots.length - 1; i >= 0; i--) {
        const carrot = carrots[i];
        carrot.update();
        
        // Only bunny can collect carrots (using CharacterSystem)
        if (carrot.checkCollision(bunny) && CharacterSystem.collectItem(bunny, player1Stats, 'carrots', 20)) {
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
            
            // Only orange cat can collect fish (using CharacterSystem)
            if (orangeCat.active && fishItem.checkCollision(orangeCat) && 
                CharacterSystem.collectItem(orangeCat, player2Stats, 'fish', 20)) {
                fish.splice(i, 1);
                continue;
            }
            
            // Remove fish that have gone off screen
            if (fishItem.x < -fishItem.width) {
                fish.splice(i, 1);
            }
        }
    }
    
    // Update soot sprites
    for (let i = sootSprites.length - 1; i >= 0; i--) {
        const sprite = sootSprites[i];
        sprite.update();
        
        // Soot sprites give a big energy boost and can be collected by either character
        // Check collision with bunny
        if (sprite.checkCollision(bunny) && CharacterSystem.canCollect(bunny, player1Stats)) {
            player1Stats.energy = Math.min(100, player1Stats.energy + 50); // Big energy boost!
            sootSprites.splice(i, 1);
            continue;
        }
        
        // Check collision with orange cat in multiplayer
        if (game.multiplayer && orangeCat.active && sprite.checkCollision(orangeCat) && 
            CharacterSystem.canCollect(orangeCat, player2Stats)) {
            player2Stats.energy = Math.min(100, player2Stats.energy + 50); // Big energy boost!
            sootSprites.splice(i, 1);
            continue;
        }
        
        // Remove sprites that have gone off screen
        if (sprite.x < -sprite.width) {
            sootSprites.splice(i, 1);
        }
    }
    
    // Update vehicles
    for (let i = vehicles.length - 1; i >= 0; i--) {
        const vehicle = vehicles[i];
        vehicle.update(vehicles);
        
        // Check collision with bunny (using CharacterSystem)
        if (vehicle.checkCollision(bunny)) {
            CharacterSystem.takeDamage(bunny, player1Stats, 25, 100, 260);
        }
        
        // Check collision with orange cat in multiplayer (using CharacterSystem)
        if (game.multiplayer && orangeCat.active && vehicle.checkCollision(orangeCat)) {
            CharacterSystem.takeDamage(orangeCat, player2Stats, 25, 100, 210);
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
    
    // Draw soot sprites (magical collectibles)
    sootSprites.forEach(sprite => sprite.draw());
    
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

// Old start button handler removed - now handled by difficulty buttons and stop/resume button

// Difficulty button handlers
document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const difficulty = e.target.dataset.difficulty;
        startGameWithDifficulty(difficulty);
    });
});

// Function to start game with selected difficulty
function startGameWithDifficulty(difficulty) {
    if (!game.running || game.gameOver) {
        // Set the difficulty
        game.difficulty = difficulty;
        const settings = difficultySettings[difficulty];
        
        // Apply difficulty settings
        game.speed = settings.speed;
        game.carrotSpawnInterval = Math.floor(120 * settings.spawnMultiplier);
        game.fishSpawnInterval = Math.floor(120 * settings.spawnMultiplier);
        game.vehicleSpawnInterval = Math.floor(90 * settings.spawnMultiplier);
        game.sootSpriteSpawnInterval = Math.floor(600 * settings.spawnMultiplier);
        
        // Hide difficulty buttons, show stop button
        document.getElementById('difficultyButtons').style.display = 'none';
        document.getElementById('startBtn').style.display = 'inline-block';
        document.getElementById('startBtn').textContent = 'Stop Adventure';
        
        // Reset and start the game
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
            sootSprites.length = 0;
            
            // Re-initialize all the persistent game elements (clouds, stars, etc.)
            initializeGameElements();
        }
        
        game.running = true;
        
        // Reset game state for new game
        if (game.distance === 0) {
            player1Stats.carrots = 0;
            player1Stats.energy = 100;
            player2Stats.fish = 0;
            player2Stats.energy = 100;
            bunny.x = 100;
            bunny.y = 260;
            bunny.targetX = 100;
            bunny.targetY = 260;
            orangeCat.x = 100;
            orangeCat.y = 210;
            orangeCat.targetX = 100;
            orangeCat.targetY = 210;
        }
        
        gameLoop();
    }
}

// Update the stop button handler
document.getElementById('startBtn').addEventListener('click', () => {
    if (game.running) {
        game.running = false;
        document.getElementById('startBtn').textContent = 'Resume';
    } else if (document.getElementById('startBtn').textContent === 'Resume') {
        game.running = true;
        document.getElementById('startBtn').textContent = 'Stop Adventure';
        gameLoop();
    }
});

// Function to initialize game elements
function initializeGameElements() {
    // Initialize clouds with persistent data
    game.clouds = [];
    for (let i = 0; i < 3; i++) {
        game.clouds.push({
            x: i * 300,
            y: 20 + i * 25,
            circles: []
        });
        // Generate random circles for each cloud
        for (let j = 0; j < 5; j++) {
            game.clouds[i].circles.push({
                offsetX: j * 15 - 10,
                offsetY: Math.sin(j) * 8,
                radius: 20 + Math.random() * 10
            });
        }
    }
    
    // Initialize stars for dark mode
    game.stars = [];
    for (let i = 0; i < 50; i++) {
        game.stars.push({
            x: Math.random() * 800,
            y: Math.random() * 140,
            size: Math.random() * 2 + 0.5,
            brightness: Math.random() * 0.8 + 0.2,
            twinkleSpeed: Math.random() * 2 + 0.5,
            twinkleOffset: Math.random() * Math.PI * 2
        });
    }
    
    // Initialize ground patches
    game.groundPatches = [];
    for (let i = 0; i < 20; i++) {
        game.groundPatches.push({
            x: Math.random() * 800,
            y: 150 + Math.random() * 180,
            width: 20 + Math.random() * 40,
            height: 5 + Math.random() * 10
        });
    }
    
    // Initialize grass patches
    game.grassPatches = [];
    for (let i = 0; i < 30; i++) {
        game.grassPatches.push({
            x: Math.random() * 800,
            y: 140 + Math.random() * 200,
            blades: []
        });
        for (let j = 0; j < 3 + Math.random() * 4; j++) {
            game.grassPatches[i].blades.push({
                offsetX: j * 2 - 3,
                height: 5 + Math.random() * 10,
                sway: Math.random() * Math.PI
            });
        }
    }
    
    // Initialize flowers
    game.flowers = [];
    for (let i = 0; i < 15; i++) {
        const flowerColors = ['#FFB6C1', '#FF69B4', '#FFD700', '#87CEEB', '#DDA0DD'];
        game.flowers.push({
            x: Math.random() * 800,
            y: 145 + Math.random() * 190,
            color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
            petals: 5 + Math.floor(Math.random() * 3),
            size: 3 + Math.random() * 2,
            stemHeight: 10 + Math.random() * 5
        });
    }
}

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
    
    // Get available space - using original working calculation
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

// Initialize theme on page load (must be before canvas resize)
initTheme();

// Initialize clouds on page load
game.clouds = [];
for (let i = 0; i < 3; i++) {
    game.clouds.push({
        x: i * 300,
        y: 20 + i * 25,
        circles: []
    });
    // Generate random circles for each cloud
    for (let j = 0; j < 5; j++) {
        game.clouds[i].circles.push({
            offsetX: j * 15 - 10,
            offsetY: Math.sin(j) * 8,
            radius: 20 + Math.random() * 10
        });
    }
}

// Initialize stars for dark mode
game.stars = [];
for (let i = 0; i < 50; i++) {
    game.stars.push({
        x: Math.random() * 800,
        y: Math.random() * 140, // Keep stars in the sky area
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 2 + 0.5,
        twinkleOffset: Math.random() * Math.PI * 2
    });
}


// Initialize ground patches with random distribution
game.groundPatches = [];
for (let i = 0; i < 30; i++) {
    game.groundPatches.push({
        x: Math.random() * 1500,
        y: 160 + Math.random() * 180, // Random Y within path area
        rotation: Math.random() * Math.PI
    });
}

// Initialize grass patches with random distribution
game.grassPatches = [];
for (let i = 0; i < 25; i++) {
    game.grassPatches.push({
        x: Math.random() * 1500,
        y: 155 + Math.random() * 190 // Random Y within path area
    });
}

// Initialize flowers with random distribution
game.flowers = [];
const flowerColors = ['#FF69B4', '#FFD700', '#9370DB', '#FFA07A', '#98FB98', '#DDA0DD', '#87CEEB'];
for (let i = 0; i < 40; i++) { // More flowers for better coverage
    const type = Math.floor(Math.random() * flowerColors.length);
    game.flowers.push({
        x: Math.random() * 2000, // Random position across a wide area
        type: type,
        petalColor: flowerColors[type],
        yOffset: Math.random() * 10 - 5 // Small random Y offset for natural look
    });
}

// Initial canvas setup and draw
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
            if (player === '1' && CharacterSystem.canAct(bunny, player1Stats)) {
                bunny.hop(direction);
            } else if (player === '2' && game.multiplayer && CharacterSystem.canAct(orangeCat, player2Stats)) {
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
            if (player === '1' && CharacterSystem.canAct(bunny, player1Stats)) {
                bunny.hop(direction);
            } else if (player === '2' && game.multiplayer && CharacterSystem.canAct(orangeCat, player2Stats)) {
                orangeCat.hop(direction);
            }
        }
    });
});