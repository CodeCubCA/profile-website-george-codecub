// Building Shooting Game
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('game2DCanvas');
    const ctx = canvas.getContext('2d');

    // Game state
    let gameStarted = false;
    let gameRunning = false;
    let score = 0;
    let buildingsDestroyed = 0;
    let ammo = 100;
    let money = 500; // Starting money
    let keys = {};

    // Weapon system
    let currentWeapon = 'basic';
    let weaponShopOpen = false;

    const weapons = {
        basic: {
            name: 'Basic Cannon',
            damage: 1,
            speed: 8,
            size: 4,
            cost: 0,
            color: '#FF0000',
            fireRate: 1,
            owned: true
        },
        rapid: {
            name: 'Rapid Fire',
            damage: 1,
            speed: 10,
            size: 3,
            cost: 200,
            color: '#00FF00',
            fireRate: 0.3,
            owned: false
        },
        heavy: {
            name: 'Heavy Cannon',
            damage: 3,
            speed: 6,
            size: 8,
            cost: 400,
            color: '#FF6600',
            fireRate: 2,
            owned: false
        },
        explosive: {
            name: 'Explosive Rounds',
            damage: 2,
            speed: 8,
            size: 6,
            cost: 600,
            color: '#FFFF00',
            fireRate: 1.5,
            explosive: true,
            owned: false
        },
        laser: {
            name: 'Laser Cannon',
            damage: 4,
            speed: 15,
            size: 2,
            cost: 1000,
            color: '#FF00FF',
            fireRate: 0.5,
            owned: false
        }
    };

    let lastShotTime = 0;

    // Player (tank/shooter)
    let player = {
        x: 50,
        y: 320,
        width: 40,
        height: 30,
        angle: 0, // Tank rotation
        turretAngle: 0, // Turret rotation
        speed: 2,
        color: '#4A90E2'
    };

    // Camera system
    let camera = {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        smoothing: 0.08
    };

    // Game objects
    let buildings = [];
    let projectiles = [];
    let explosions = [];
    let debris = [];
    let particles = [];
    let powerUps = [];
    let gameTime = 0;
    let mouse = { x: 0, y: 0 };

    // Game settings
    const GROUND_Y = 350;
    const mapWidth = 1600;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 400;

    // Initialize buildings
    function initBuildings() {
        buildings = [];
        const buildingTypes = [
            {
                name: 'residential',
                color: '#8B4513',
                health: 3,
                points: 100,
                style: 'apartment'
            },
            {
                name: 'office',
                color: '#696969',
                health: 5,
                points: 200,
                style: 'modern'
            },
            {
                name: 'commercial',
                color: '#2F4F4F',
                health: 7,
                points: 300,
                style: 'complex'
            },
            {
                name: 'skyscraper',
                color: '#1C1C1C',
                health: 10,
                points: 500,
                style: 'tower'
            },
            {
                name: 'factory',
                color: '#8B0000',
                health: 8,
                points: 400,
                style: 'industrial'
            },
            {
                name: 'mall',
                color: '#4B0082',
                health: 6,
                points: 350,
                style: 'wide'
            }
        ];

        // Create diverse city skyline
        for (let i = 0; i < 18; i++) {
            const x = 200 + (i * 70) + Math.random() * 30;
            const type = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];

            let width, height, shape;

            // Different building dimensions based on type
            switch(type.style) {
                case 'tower':
                    width = 30 + Math.random() * 25;
                    height = 150 + Math.random() * 80;
                    shape = 'tower';
                    break;
                case 'wide':
                    width = 80 + Math.random() * 40;
                    height = 60 + Math.random() * 40;
                    shape = 'wide';
                    break;
                case 'industrial':
                    width = 60 + Math.random() * 30;
                    height = 50 + Math.random() * 30;
                    shape = 'industrial';
                    break;
                case 'complex':
                    width = 45 + Math.random() * 35;
                    height = 90 + Math.random() * 60;
                    shape = 'stepped';
                    break;
                case 'apartment':
                    width = 35 + Math.random() * 25;
                    height = 70 + Math.random() * 50;
                    shape = 'simple';
                    break;
                default: // modern
                    width = 40 + Math.random() * 30;
                    height = 80 + Math.random() * 70;
                    shape = 'modern';
                    break;
            }

            const y = GROUND_Y - height;

            buildings.push({
                x: x,
                y: y,
                width: width,
                height: height,
                maxHealth: type.health,
                health: type.health,
                color: type.color,
                points: type.points,
                destroyed: false,
                type: type.name,
                style: type.style,
                shape: shape,
                windows: generateWindows(x, y, width, height, type.style),
                details: generateBuildingDetails(x, y, width, height, type.style)
            });
        }
    }

    // Generate windows for buildings
    function generateWindows(buildingX, buildingY, buildingWidth, buildingHeight, style) {
        const windows = [];
        let windowSize, spacing, pattern;

        // Different window patterns based on building style
        switch(style) {
            case 'tower':
                windowSize = 6;
                spacing = 8;
                pattern = 'grid';
                break;
            case 'industrial':
                windowSize = 12;
                spacing = 18;
                pattern = 'sparse';
                break;
            case 'wide':
                windowSize = 10;
                spacing = 15;
                pattern = 'horizontal';
                break;
            case 'apartment':
                windowSize = 8;
                spacing = 12;
                pattern = 'regular';
                break;
            default:
                windowSize = 8;
                spacing = 12;
                pattern = 'grid';
        }

        if (pattern === 'horizontal') {
            // Horizontal strips of windows
            for (let y = buildingY + 15; y < buildingY + buildingHeight - windowSize; y += spacing * 2) {
                for (let x = buildingX + 8; x < buildingX + buildingWidth - windowSize; x += spacing) {
                    if (Math.random() > 0.2) {
                        windows.push({
                            x: x,
                            y: y,
                            size: windowSize,
                            lit: Math.random() > 0.4,
                            type: 'standard'
                        });
                    }
                }
            }
        } else if (pattern === 'sparse') {
            // Few large windows for industrial
            for (let x = buildingX + 15; x < buildingX + buildingWidth - windowSize; x += spacing * 2) {
                for (let y = buildingY + 15; y < buildingY + buildingHeight - windowSize; y += spacing * 2) {
                    if (Math.random() > 0.6) {
                        windows.push({
                            x: x,
                            y: y,
                            size: windowSize,
                            lit: Math.random() > 0.7,
                            type: 'industrial'
                        });
                    }
                }
            }
        } else {
            // Regular grid pattern
            for (let x = buildingX + 8; x < buildingX + buildingWidth - windowSize; x += spacing) {
                for (let y = buildingY + 8; y < buildingY + buildingHeight - windowSize; y += spacing) {
                    if (Math.random() > 0.3) {
                        windows.push({
                            x: x,
                            y: y,
                            size: windowSize,
                            lit: Math.random() > 0.5,
                            type: 'standard'
                        });
                    }
                }
            }
        }
        return windows;
    }

    // Generate building details
    function generateBuildingDetails(buildingX, buildingY, buildingWidth, buildingHeight, style) {
        const details = [];

        switch(style) {
            case 'tower':
                // Antenna on top
                details.push({
                    type: 'antenna',
                    x: buildingX + buildingWidth/2 - 1,
                    y: buildingY - 20,
                    width: 2,
                    height: 20
                });
                break;
            case 'industrial':
                // Smokestack
                details.push({
                    type: 'smokestack',
                    x: buildingX + buildingWidth - 15,
                    y: buildingY - 30,
                    width: 8,
                    height: 30
                });
                break;
            case 'wide':
                // Roof sign
                details.push({
                    type: 'sign',
                    x: buildingX + 10,
                    y: buildingY - 15,
                    width: buildingWidth - 20,
                    height: 10
                });
                break;
            case 'complex':
                // Air conditioning units
                for (let i = 0; i < 3; i++) {
                    details.push({
                        type: 'ac_unit',
                        x: buildingX + 10 + i * 15,
                        y: buildingY - 8,
                        width: 8,
                        height: 6
                    });
                }
                break;
        }

        return details;
    }

    // Initialize projectiles and particles
    function createProjectile(x, y, angle) {
        const weapon = weapons[currentWeapon];
        projectiles.push({
            x: x,
            y: y,
            velX: Math.cos(angle) * weapon.speed,
            velY: Math.sin(angle) * weapon.speed,
            size: weapon.size,
            damage: weapon.damage,
            color: weapon.color,
            explosive: weapon.explosive || false,
            trail: []
        });
        ammo--;
        playShootSound();
    }

    // Create explosion effect
    function createExplosion(x, y, size = 30) {
        explosions.push({
            x: x,
            y: y,
            size: 0,
            maxSize: size,
            life: 30
        });

        // Create debris particles
        for (let i = 0; i < 8; i++) {
            debris.push({
                x: x,
                y: y,
                velX: (Math.random() - 0.5) * 10,
                velY: Math.random() * -8 - 2,
                life: 60,
                size: 2 + Math.random() * 4,
                color: `hsl(${Math.random() * 60 + 15}, 70%, 50%)`
            });
        }

        playExplosionSound();
    }

    // Update camera to follow player
    function updateCamera() {
        camera.targetX = player.x + player.width/2 - canvas.width/2;
        camera.targetY = player.y + player.height/2 - canvas.height/2;

        // Keep camera within bounds
        camera.targetX = Math.max(0, Math.min(camera.targetX, mapWidth - canvas.width));
        camera.targetY = Math.max(-50, Math.min(camera.targetY, GROUND_Y - canvas.height + 100));

        // Smooth camera movement
        camera.x += (camera.targetX - camera.x) * camera.smoothing;
        camera.y += (camera.targetY - camera.y) * camera.smoothing;
    }

    // Check collision with buildings
    function checkBuildingCollision(newX, newY) {
        for (let building of buildings) {
            if (!building.destroyed &&
                newX < building.x + building.width &&
                newX + player.width > building.x &&
                newY < building.y + building.height &&
                newY + player.height > building.y) {
                return true; // Collision detected
            }
        }
        return false; // No collision
    }

    // Update player
    function updatePlayer() {
        // Store current position
        const oldX = player.x;
        const oldY = player.y;
        let newX = oldX;
        let newY = oldY;

        // Tank movement with collision checking
        if (keys['a'] || keys['arrowleft']) {
            newX = player.x - player.speed;
            player.angle = Math.PI; // Face left
        }
        if (keys['d'] || keys['arrowright']) {
            newX = player.x + player.speed;
            player.angle = 0; // Face right
        }
        if (keys['w'] || keys['arrowup']) {
            newY = player.y - player.speed;
        }
        if (keys['s'] || keys['arrowdown']) {
            newY = player.y + player.speed;
        }

        // Check boundaries first
        newX = Math.max(0, Math.min(newX, mapWidth - player.width));
        newY = Math.max(0, Math.min(newY, GROUND_Y - player.height));

        // Check building collision for X movement
        if (!checkBuildingCollision(newX, oldY)) {
            player.x = newX;
        }

        // Check building collision for Y movement
        if (!checkBuildingCollision(player.x, newY)) {
            player.y = newY;
        }

        // Calculate turret angle based on mouse position
        const mouseWorldX = mouse.x + camera.x;
        const mouseWorldY = mouse.y + camera.y;
        const playerCenterX = player.x + player.width/2;
        const playerCenterY = player.y + player.height/2;

        player.turretAngle = Math.atan2(mouseWorldY - playerCenterY, mouseWorldX - playerCenterX);
    }

    // Update projectiles
    function updateProjectiles() {
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const proj = projectiles[i];

            // Add to trail
            proj.trail.push({ x: proj.x, y: proj.y });
            if (proj.trail.length > 5) proj.trail.shift();

            // Move projectile
            proj.x += proj.velX;
            proj.y += proj.velY;

            // Check building collisions
            let hit = false;
            for (let building of buildings) {
                if (!building.destroyed &&
                    proj.x > building.x && proj.x < building.x + building.width &&
                    proj.y > building.y && proj.y < building.y + building.height) {

                    // Damage building
                    building.health -= proj.damage;
                    createExplosion(proj.x, proj.y, proj.explosive ? 40 : 20);

                    if (building.health <= 0) {
                        building.destroyed = true;
                        buildingsDestroyed++;
                        score += building.points;
                        money += Math.floor(building.points / 5); // Earn money based on points
                        createExplosion(building.x + building.width/2, building.y + building.height/2, 50);
                        show2DGameMessage(`Building Destroyed! +${building.points} points, +$${Math.floor(building.points / 5)}`, 'success');
                    }

                    hit = true;
                    break;
                }
            }

            // Remove projectile if hit or out of bounds
            if (hit || proj.x < -50 || proj.x > mapWidth + 50 || proj.y < -50 || proj.y > GROUND_Y + 50) {
                projectiles.splice(i, 1);
            }
        }
    }

    // Update explosions
    function updateExplosions() {
        for (let i = explosions.length - 1; i >= 0; i--) {
            const explosion = explosions[i];
            explosion.size += explosion.maxSize / 30;
            explosion.life--;

            if (explosion.life <= 0) {
                explosions.splice(i, 1);
            }
        }
    }

    // Update debris
    function updateDebris() {
        for (let i = debris.length - 1; i >= 0; i--) {
            const piece = debris[i];
            piece.x += piece.velX;
            piece.y += piece.velY;
            piece.velY += 0.3; // Gravity
            piece.velX *= 0.98; // Air resistance
            piece.life--;

            if (piece.life <= 0 || piece.y > GROUND_Y) {
                debris.splice(i, 1);
            }
        }
    }

    // Spawn ammo crates occasionally
    function spawnAmmoCrate() {
        if (Math.random() < 0.01 && ammo < 50) {
            powerUps.push({
                x: Math.random() * (mapWidth - 100) + 50,
                y: GROUND_Y - 20,
                width: 20,
                height: 20,
                type: 'ammo',
                color: '#FFD700',
                collected: false
            });
        }
    }

    // Update power-ups
    function updatePowerUps() {
        for (let i = powerUps.length - 1; i >= 0; i--) {
            const powerUp = powerUps[i];

            // Check collection
            if (player.x < powerUp.x + powerUp.width &&
                player.x + player.width > powerUp.x &&
                player.y < powerUp.y + powerUp.height &&
                player.y + player.height > powerUp.y) {

                if (powerUp.type === 'ammo') {
                    ammo += 25;
                    score += 50;
                    show2DGameMessage('Ammo Refill! +25 rounds', 'info');
                }

                powerUps.splice(i, 1);
                playPowerUpSound();
            }
        }
    }

    // Drawing functions
    function drawGame() {
        // Clear canvas with sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#FFA07A');
        gradient.addColorStop(1, '#98FB98');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Apply camera transformation
        ctx.save();
        ctx.translate(-camera.x, -camera.y);

        // Draw ground
        ctx.fillStyle = '#654321';
        ctx.fillRect(0, GROUND_Y, mapWidth, canvas.height - GROUND_Y);

        // Draw buildings
        buildings.forEach(building => {
            if (!building.destroyed) {
                // Building shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.fillRect(building.x + 3, building.y + 3, building.width, building.height);

                // Building body with gradient based on type
                let gradient;
                if (building.shape === 'tower') {
                    gradient = ctx.createLinearGradient(building.x, building.y, building.x + building.width, building.y);
                    gradient.addColorStop(0, building.color);
                    gradient.addColorStop(0.5, '#000');
                    gradient.addColorStop(1, building.color);
                } else if (building.shape === 'industrial') {
                    gradient = ctx.createLinearGradient(building.x, building.y, building.x, building.y + building.height);
                    gradient.addColorStop(0, building.color);
                    gradient.addColorStop(1, '#444');
                } else {
                    gradient = ctx.createLinearGradient(building.x, building.y, building.x + building.width, building.y + building.height);
                    gradient.addColorStop(0, building.color);
                    gradient.addColorStop(1, '#222');
                }

                ctx.fillStyle = gradient;
                if (building.health < building.maxHealth) {
                    ctx.globalAlpha = building.health / building.maxHealth;
                }
                ctx.fillRect(building.x, building.y, building.width, building.height);
                ctx.globalAlpha = 1;

                // Building shape variations
                if (building.shape === 'stepped') {
                    // Draw stepped sections
                    const sections = 3;
                    const sectionHeight = building.height / sections;
                    for (let i = 0; i < sections; i++) {
                        const sectionWidth = building.width * (1 - i * 0.15);
                        const sectionX = building.x + (building.width - sectionWidth) / 2;
                        const sectionY = building.y + i * sectionHeight;

                        ctx.fillStyle = `rgba(${parseInt(building.color.slice(1, 3), 16) + i * 20}, ${parseInt(building.color.slice(3, 5), 16) + i * 20}, ${parseInt(building.color.slice(5, 7), 16) + i * 20}, 1)`;
                        ctx.fillRect(sectionX, sectionY, sectionWidth, sectionHeight);
                        ctx.strokeStyle = '#000';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(sectionX, sectionY, sectionWidth, sectionHeight);
                    }
                } else {
                    // Regular building outline
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(building.x, building.y, building.width, building.height);
                }

                // Building details (antennas, smokestacks, etc.)
                building.details.forEach(detail => {
                    switch(detail.type) {
                        case 'antenna':
                            ctx.strokeStyle = '#888';
                            ctx.lineWidth = 2;
                            ctx.beginPath();
                            ctx.moveTo(detail.x, detail.y + detail.height);
                            ctx.lineTo(detail.x, detail.y);
                            ctx.stroke();
                            // Blinking light
                            if (gameTime % 60 < 30) {
                                ctx.fillStyle = '#FF0000';
                                ctx.beginPath();
                                ctx.arc(detail.x, detail.y, 2, 0, Math.PI * 2);
                                ctx.fill();
                            }
                            break;
                        case 'smokestack':
                            ctx.fillStyle = '#666';
                            ctx.fillRect(detail.x, detail.y, detail.width, detail.height);
                            ctx.strokeStyle = '#000';
                            ctx.strokeRect(detail.x, detail.y, detail.width, detail.height);
                            // Smoke
                            for (let i = 0; i < 3; i++) {
                                ctx.fillStyle = `rgba(150, 150, 150, ${0.4 - i * 0.1})`;
                                ctx.beginPath();
                                ctx.arc(detail.x + detail.width/2 + (Math.random() - 0.5) * 10, detail.y - 5 - i * 8, 3 + i, 0, Math.PI * 2);
                                ctx.fill();
                            }
                            break;
                        case 'sign':
                            ctx.fillStyle = '#FF6600';
                            ctx.fillRect(detail.x, detail.y, detail.width, detail.height);
                            ctx.strokeStyle = '#000';
                            ctx.strokeRect(detail.x, detail.y, detail.width, detail.height);
                            break;
                        case 'ac_unit':
                            ctx.fillStyle = '#AAA';
                            ctx.fillRect(detail.x, detail.y, detail.width, detail.height);
                            ctx.strokeStyle = '#666';
                            ctx.strokeRect(detail.x, detail.y, detail.width, detail.height);
                            break;
                    }
                });

                // Windows with different styles
                building.windows.forEach(window => {
                    if (window.type === 'industrial') {
                        ctx.fillStyle = window.lit ? '#FFAA00' : '#222';
                        ctx.fillRect(window.x, window.y, window.size, window.size);
                        ctx.strokeStyle = '#000';
                        ctx.strokeRect(window.x, window.y, window.size, window.size);
                    } else {
                        ctx.fillStyle = window.lit ? '#FFFF99' : '#333';
                        ctx.fillRect(window.x, window.y, window.size, window.size);
                        // Window frame
                        ctx.strokeStyle = '#666';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(window.x, window.y, window.size, window.size);
                    }
                });

                // Health bar
                if (building.health < building.maxHealth) {
                    const barWidth = building.width;
                    const barHeight = 4;
                    const barX = building.x;
                    const barY = building.y - 8;

                    ctx.fillStyle = '#FF0000';
                    ctx.fillRect(barX, barY, barWidth, barHeight);
                    ctx.fillStyle = '#00FF00';
                    ctx.fillRect(barX, barY, (building.health / building.maxHealth) * barWidth, barHeight);
                }

                // Building type label (for variety)
                if (building.health < building.maxHealth) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.font = '10px Arial';
                    ctx.fillText(building.type.toUpperCase(), building.x + 2, building.y - 12);
                }
            }
        });

        // Draw debris
        debris.forEach(piece => {
            ctx.fillStyle = piece.color;
            ctx.fillRect(piece.x - piece.size/2, piece.y - piece.size/2, piece.size, piece.size);
        });

        // Draw explosions
        explosions.forEach(explosion => {
            const alpha = explosion.life / 30;
            ctx.globalAlpha = alpha;

            // Outer ring
            ctx.fillStyle = '#FF4500';
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.size, 0, Math.PI * 2);
            ctx.fill();

            // Inner ring
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.size * 0.6, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1;
        });

        // Draw projectiles
        projectiles.forEach(proj => {
            // Trail
            ctx.strokeStyle = proj.color;
            ctx.lineWidth = proj.size / 2;
            ctx.beginPath();
            for (let i = 0; i < proj.trail.length; i++) {
                const alpha = (i + 1) / proj.trail.length;
                ctx.globalAlpha = alpha * 0.6;
                if (i === 0) {
                    ctx.moveTo(proj.trail[i].x, proj.trail[i].y);
                } else {
                    ctx.lineTo(proj.trail[i].x, proj.trail[i].y);
                }
            }
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Projectile
            ctx.fillStyle = proj.color;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
            ctx.fill();

            // Special effects for explosive rounds
            if (proj.explosive) {
                ctx.strokeStyle = '#FFA500';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, proj.size + 2, 0, Math.PI * 2);
                ctx.stroke();
            }
        });

        // Draw power-ups
        powerUps.forEach(powerUp => {
            ctx.fillStyle = powerUp.color;
            ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);

            // Ammo symbol
            if (powerUp.type === 'ammo') {
                ctx.fillStyle = '#000';
                ctx.font = '12px Arial';
                ctx.fillText('A', powerUp.x + 6, powerUp.y + 14);
            }
        });

        // Draw player (tank)
        ctx.save();
        ctx.translate(player.x + player.width/2, player.y + player.height/2);

        // Tank shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-player.width/2 + 2, -player.height/2 + 2, player.width, player.height);

        // Tank tracks
        ctx.fillStyle = '#333';
        ctx.fillRect(-player.width/2 - 2, -player.height/2 - 2, 6, player.height + 4);
        ctx.fillRect(player.width/2 - 4, -player.height/2 - 2, 6, player.height + 4);

        // Tank body (main hull)
        ctx.rotate(player.angle);

        // Main body gradient
        const bodyGradient = ctx.createLinearGradient(0, -player.height/2, 0, player.height/2);
        bodyGradient.addColorStop(0, '#5A7D8C');
        bodyGradient.addColorStop(0.3, '#4A90E2');
        bodyGradient.addColorStop(0.7, '#357ABD');
        bodyGradient.addColorStop(1, '#2E5C8A');
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(-player.width/2, -player.height/2, player.width, player.height);

        // Tank body details
        ctx.strokeStyle = '#1C3A52';
        ctx.lineWidth = 2;
        ctx.strokeRect(-player.width/2, -player.height/2, player.width, player.height);

        // Tank armor lines
        ctx.strokeStyle = '#6B94B8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-player.width/2 + 5, -player.height/2 + 5);
        ctx.lineTo(player.width/2 - 5, -player.height/2 + 5);
        ctx.moveTo(-player.width/2 + 5, player.height/2 - 5);
        ctx.lineTo(player.width/2 - 5, player.height/2 - 5);
        ctx.stroke();

        // Tank front indicator
        if (player.angle === 0) { // Facing right
            ctx.fillStyle = '#FF4444';
            ctx.fillRect(player.width/2 - 3, -3, 6, 6);
        } else { // Facing left
            ctx.fillStyle = '#FF4444';
            ctx.fillRect(-player.width/2 - 3, -3, 6, 6);
        }

        ctx.restore();

        // Tank turret (separate rotation)
        ctx.save();
        ctx.translate(player.x + player.width/2, player.y + player.height/2);
        ctx.rotate(player.turretAngle);

        // Turret base
        ctx.fillStyle = '#2C5F2D';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1A3B1F';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Turret barrel with gradient
        const barrelGradient = ctx.createLinearGradient(0, -8, 0, 8);
        barrelGradient.addColorStop(0, '#4A4A4A');
        barrelGradient.addColorStop(0.5, '#2C5F2D');
        barrelGradient.addColorStop(1, '#1A3B1F');
        ctx.fillStyle = barrelGradient;
        ctx.fillRect(0, -6, 30, 12);

        // Barrel tip
        ctx.fillStyle = '#666';
        ctx.fillRect(28, -4, 4, 8);

        // Barrel details
        ctx.strokeStyle = '#1A3B1F';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, -6, 30, 12);

        // Barrel rings
        for (let i = 5; i < 25; i += 8) {
            ctx.beginPath();
            ctx.moveTo(i, -6);
            ctx.lineTo(i, 6);
            ctx.stroke();
        }

        ctx.restore();

        // Tank engine exhaust when moving
        if (keys['w'] || keys['a'] || keys['s'] || keys['d']) {
            ctx.save();
            ctx.translate(player.x + player.width/2, player.y + player.height/2);
            ctx.rotate(player.angle + Math.PI); // Opposite direction

            // Exhaust smoke
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = `rgba(100, 100, 100, ${0.3 - i * 0.1})`;
                ctx.beginPath();
                ctx.arc(15 + i * 5, (Math.random() - 0.5) * 6, 2 + i, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Muzzle flash when shooting
        if (gameTime % 3 === 0 && projectiles.length > 0) {
            ctx.save();
            ctx.translate(player.x + player.width/2, player.y + player.height/2);
            ctx.rotate(player.turretAngle);

            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(32, 0, 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FF6600';
            ctx.beginPath();
            ctx.arc(32, 0, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        // Restore camera transformation
        ctx.restore();

        // Draw weapon shop if open
        if (weaponShopOpen) {
            drawWeaponShop();
        }

        // Draw money and weapon info (always visible)
        drawHUD();
    }

    // Draw weapon shop
    function drawWeaponShop() {
        // Semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Shop background
        ctx.fillStyle = '#2C3E50';
        ctx.fillRect(50, 50, canvas.width - 100, canvas.height - 100);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);

        // Shop title
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('WEAPON SHOP', 70, 85);

        // Your money
        ctx.fillStyle = '#00FF00';
        ctx.font = '16px Arial';
        ctx.fillText(`Money: $${money}`, 70, 110);

        // Current weapon
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`Current: ${weapons[currentWeapon].name}`, 300, 110);

        // Weapon list
        let y = 140;
        Object.keys(weapons).forEach((key, index) => {
            const weapon = weapons[key];
            const selected = currentWeapon === key;

            // Weapon background
            ctx.fillStyle = selected ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(70, y - 15, canvas.width - 160, 30);

            // Weapon info
            ctx.fillStyle = weapon.owned ? '#00FF00' : '#FFFFFF';
            ctx.font = '14px Arial';
            ctx.fillText(`${index + 1}. ${weapon.name}`, 80, y);

            ctx.fillStyle = '#CCCCCC';
            ctx.font = '11px Arial';
            ctx.fillText(`DMG: ${weapon.damage} | SPD: ${weapon.speed} | Rate: ${weapon.fireRate}`, 80, y + 12);

            if (!weapon.owned) {
                ctx.fillStyle = money >= weapon.cost ? '#00FF00' : '#FF0000';
                ctx.font = '12px Arial';
                ctx.fillText(`$${weapon.cost} - Press ${index + 1}`, 420, y);
            } else if (selected) {
                ctx.fillStyle = '#FFD700';
                ctx.font = '12px Arial';
                ctx.fillText('EQUIPPED', 420, y);
            } else {
                ctx.fillStyle = '#00FF00';
                ctx.font = '12px Arial';
                ctx.fillText(`Press ${index + 1}`, 420, y);
            }

            y += 38;
        });

        // Instructions at bottom
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Arial';
        ctx.fillText('Press B to close shop', 70, canvas.height - 70);
    }

    // Draw HUD (money, weapon info)
    function drawHUD() {
        // Money display (top left)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 150, 60);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 150, 60);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`$${money}`, 20, 30);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.fillText(`${weapons[currentWeapon].name}`, 20, 50);
        ctx.fillText(`Press B for shop`, 20, 62);

        // Ammo display (top right)
        const ammoWidth = 120;
        const ammoHeight = 50;
        const ammoX = canvas.width - ammoWidth - 10;
        const ammoY = 10;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(ammoX, ammoY, ammoWidth, ammoHeight);

        // Color-coded border based on ammo level
        let borderColor = '#00FF00'; // Green for plenty
        if (ammo <= 20) borderColor = '#FF0000'; // Red for low
        else if (ammo <= 50) borderColor = '#FFA500'; // Orange for medium

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(ammoX, ammoY, ammoWidth, ammoHeight);

        // Ammo text
        ctx.fillStyle = borderColor;
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`${ammo}`, ammoX + 10, ammoY + 25);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.fillText('AMMO', ammoX + 10, ammoY + 45);

        // Ammo icon/bullets
        ctx.fillStyle = ammo > 0 ? '#FFD700' : '#666';
        for (let i = 0; i < Math.min(5, Math.ceil(ammo / 20)); i++) {
            ctx.beginPath();
            ctx.arc(ammoX + 60 + i * 8, ammoY + 20, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Audio functions
    function playShootSound() {
        if (!window.audioContext) return;
        const oscillator = window.audioContext.createOscillator();
        const gainNode = window.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(window.audioContext.destination);

        oscillator.frequency.setValueAtTime(300, window.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(150, window.audioContext.currentTime + 0.1);
        oscillator.type = 'square';

        gainNode.gain.setValueAtTime(0.1, window.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, window.audioContext.currentTime + 0.1);

        oscillator.start(window.audioContext.currentTime);
        oscillator.stop(window.audioContext.currentTime + 0.1);
    }

    function playExplosionSound() {
        if (!window.audioContext) return;
        const oscillator = window.audioContext.createOscillator();
        const gainNode = window.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(window.audioContext.destination);

        oscillator.frequency.setValueAtTime(100, window.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, window.audioContext.currentTime + 0.3);
        oscillator.type = 'sawtooth';

        gainNode.gain.setValueAtTime(0.2, window.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, window.audioContext.currentTime + 0.3);

        oscillator.start(window.audioContext.currentTime);
        oscillator.stop(window.audioContext.currentTime + 0.3);
    }

    function playPowerUpSound() {
        if (!window.audioContext) return;
        const frequencies = [400, 500, 600];
        frequencies.forEach((freq, i) => {
            const oscillator = window.audioContext.createOscillator();
            const gainNode = window.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(window.audioContext.destination);

            oscillator.frequency.setValueAtTime(freq, window.audioContext.currentTime + i * 0.05);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, window.audioContext.currentTime + i * 0.05);
            gainNode.gain.linearRampToValueAtTime(0.05, window.audioContext.currentTime + i * 0.05 + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, window.audioContext.currentTime + i * 0.05 + 0.15);

            oscillator.start(window.audioContext.currentTime + i * 0.05);
            oscillator.stop(window.audioContext.currentTime + i * 0.05 + 0.15);
        });
    }

    // Game control functions
    function startGame() {
        if (!gameStarted) {
            gameStarted = true;
            gameRunning = true;
            initBuildings();
            gameLoop();
        }
    }

    function restartGame() {
        gameStarted = false;
        gameRunning = false;
        score = 0;
        buildingsDestroyed = 0;
        ammo = 100;
        gameTime = 0;
        projectiles = [];
        explosions = [];
        debris = [];
        powerUps = [];
        weaponShopOpen = false;
        player.x = 50;
        player.y = 320;
        player.angle = 0;
        player.turretAngle = 0;
        initBuildings();
        updateUI();
        drawGame();
        show2DGameMessage('Click Start Game to play again!', 'info');
    }

    function gameOver() {
        gameRunning = false;
        show2DGameMessage(`Game Over! Final Score: ${score}`, 'error');
        setTimeout(() => {
            show2DGameMessage('Click Restart to play again!', 'info');
        }, 3000);
    }

    function updateUI() {
        document.getElementById('score').textContent = score;
        document.getElementById('stars').textContent = buildingsDestroyed;
        document.getElementById('lives').textContent = ammo;
    }

    // Event listeners
    function setupEventListeners() {
        // Start button
        const startBtn = document.getElementById('start2DGameBtn');
        if (startBtn) {
            startBtn.addEventListener('click', startGame);
        }

        // Restart button
        const restartBtn = document.getElementById('restart2DGameBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', restartGame);
        }

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            keys[e.key.toLowerCase()] = true;
            keys[e.code.toLowerCase()] = true;

            // Shop controls
            if (e.key.toLowerCase() === 'b') {
                weaponShopOpen = !weaponShopOpen;
            }

            // Weapon selection/purchase
            if (weaponShopOpen) {
                const num = parseInt(e.key);
                if (num >= 1 && num <= 5) {
                    const weaponKeys = Object.keys(weapons);
                    const weaponKey = weaponKeys[num - 1];
                    const weapon = weapons[weaponKey];

                    if (!weapon.owned) {
                        // Try to buy weapon
                        if (money >= weapon.cost) {
                            money -= weapon.cost;
                            weapon.owned = true;
                            currentWeapon = weaponKey;
                            show2DGameMessage(`Purchased ${weapon.name}!`, 'success');
                        } else {
                            show2DGameMessage(`Not enough money! Need $${weapon.cost}`, 'error');
                        }
                    } else {
                        // Equip weapon
                        currentWeapon = weaponKey;
                        show2DGameMessage(`Equipped ${weapon.name}!`, 'info');
                    }
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            keys[e.key.toLowerCase()] = false;
            keys[e.code.toLowerCase()] = false;
        });

        // Mouse events
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });

        canvas.addEventListener('click', (e) => {
            if (gameRunning && ammo > 0 && !weaponShopOpen) {
                const currentTime = Date.now();
                const weapon = weapons[currentWeapon];
                const fireDelay = weapon.fireRate * 1000 / 60; // Convert to frame time

                if (currentTime - lastShotTime >= fireDelay) {
                    const playerCenterX = player.x + player.width/2;
                    const playerCenterY = player.y + player.height/2;
                    createProjectile(playerCenterX, playerCenterY, player.turretAngle);
                    lastShotTime = currentTime;
                }
            }
        });
    }

    // Game loop
    function gameLoop() {
        if (!gameRunning) return;

        gameTime++;

        updatePlayer();
        updateCamera();
        updateProjectiles();
        updateExplosions();
        updateDebris();
        updatePowerUps();
        spawnAmmoCrate();

        // Check win condition
        const aliveBuildings = buildings.filter(b => !b.destroyed).length;
        if (aliveBuildings === 0) {
            score += 1000;
            show2DGameMessage('All Buildings Destroyed! Bonus: +1000 points', 'success');
            setTimeout(() => {
                restartGame();
            }, 3000);
            return;
        }

        // Check game over condition
        if (ammo <= 0 && projectiles.length === 0) {
            gameOver();
            return;
        }

        drawGame();
        updateUI();

        requestAnimationFrame(gameLoop);
    }

    // Message system
    function show2DGameMessage(message, type) {
        const messageDiv = document.getElementById('game2DMessage');
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = `game-message ${type}`;
            messageDiv.style.display = 'block';
        }
    }

    function hide2DGameMessage() {
        const messageDiv = document.getElementById('game2DMessage');
        if (messageDiv) {
            messageDiv.style.display = 'none';
        }
    }

    // Initialize audio context
    function initAudio() {
        if (!window.audioContext) {
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    // Initialize everything
    initAudio();
    setupEventListeners();
    initBuildings();
    updateCamera();
    drawGame();
    updateUI();
    show2DGameMessage('🎯 Building Shooter Game! Click to aim and shoot!', 'info');
});

// Navigation and other page scripts remain the same
function initNavbar() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }));
    }

    // Update active nav link on scroll
    window.addEventListener('scroll', updateActiveNavLink);
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    let current = '';
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// Initialize navbar
initNavbar();

// Other page functionality
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});