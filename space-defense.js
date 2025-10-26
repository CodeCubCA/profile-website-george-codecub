// Space Tower Defense Game
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('spaceGameCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Game state
    let gameStarted = false;
    let gameRunning = false;
    let gamePaused = false;
    let waveInProgress = false;
    let wave = 1;
    let aliensKilled = 0;
    let shield = 100;
    let credits = 200;
    let selectedTowerType = 'plasma';
    let keys = {};
    let waveStartTime = 0;
    let showingWaveAnnouncement = false;
    let allAliensSpawned = false;
    let unlockedTowers = ['plasma', 'laser', 'missile', 'freezer'];
    let showingTowerChoice = false;
    let specialTowerChoice = null;
    let shopVisible = true;
    let shopSlideOffset = 0; // 0 = fully visible, 130 = fully hidden
    const MAX_TOWERS = 20;
    let bossesDefeated = 0; // Track number of boss waves completed

    // Game objects
    let towers = [];
    let aliens = [];
    let projectiles = [];
    let particles = [];
    let stars = [];
    let gameTime = 0;
    let mouse = { x: 0, y: 0 };
    let hoveredCell = { x: -1, y: -1 };

    // Game settings
    const GRID_SIZE = 50;
    const GRID_WIDTH = Math.floor(800 / GRID_SIZE);
    const GRID_HEIGHT = Math.floor(500 / GRID_SIZE);

    // Set canvas size
    canvas.width = 800;
    canvas.height = 500;

    // Game grid for tower placement
    let grid = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
        grid[x] = [];
        for (let y = 0; y < GRID_HEIGHT; y++) {
            grid[x][y] = {
                occupied: false,
                isPath: false,
                tower: null
            };
        }
    }

    // Define the alien path (long winding space route ending at right edge)
    const alienPath = [
        { x: -1, y: 2 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 },
        { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 3 }, { x: 6, y: 4 },
        { x: 7, y: 5 }, { x: 8, y: 5 }, { x: 9, y: 5 }, { x: 10, y: 4 },
        { x: 11, y: 3 }, { x: 12, y: 2 }, { x: 13, y: 1 }, { x: 14, y: 1 },
        { x: 15, y: 2 }, { x: 15, y: 3 }, { x: 14, y: 4 }, { x: 13, y: 5 },
        { x: 12, y: 6 }, { x: 11, y: 6 }, { x: 10, y: 6 }, { x: 9, y: 7 },
        { x: 8, y: 7 }, { x: 7, y: 7 }, { x: 6, y: 6 }, { x: 5, y: 5 },
        { x: 4, y: 5 }, { x: 3, y: 6 }, { x: 2, y: 7 }, { x: 1, y: 7 },
        { x: 1, y: 6 }, { x: 2, y: 5 }, { x: 3, y: 4 }, { x: 4, y: 3 },
        { x: 5, y: 3 }, { x: 6, y: 3 }, { x: 7, y: 3 }, { x: 8, y: 3 },
        { x: 9, y: 3 }, { x: 10, y: 3 }, { x: 11, y: 3 }, { x: 12, y: 3 },
        { x: 13, y: 3 }, { x: 14, y: 3 }, { x: 15, y: 3 }, { x: 16, y: 3 }
    ];

    // Mark path cells
    alienPath.forEach(cell => {
        if (cell.x >= 0 && cell.x < GRID_WIDTH && cell.y < GRID_HEIGHT) {
            grid[cell.x][cell.y].isPath = true;
            grid[cell.x][cell.y].occupied = true;
        }
    });

    // Tower types with unique space theme
    const towerTypes = {
        plasma: {
            name: 'Plasma Cannon',
            cost: 150,
            damage: 15,
            range: 100,
            fireRate: 15,
            color: '#00FFFF',
            size: 16
        },
        laser: {
            name: 'Laser Beam',
            cost: 300,
            damage: 4,
            range: 200,
            fireRate: 10,
            color: '#FF0000',
            size: 14,
            continuous: true
        },
        missile: {
            name: 'Missile Launcher',
            cost: 450,
            damage: 60,
            range: 120,
            fireRate: 50,
            color: '#FFD700',
            size: 18,
            explosive: true,
            aoe: 60
        },
        freezer: {
            name: 'Cryo Tower',
            cost: 350,
            damage: 5,
            range: 90,
            fireRate: 20,
            color: '#87CEEB',
            size: 16,
            slow: true,
            slowAmount: 0.5
        },
        lightning: {
            name: 'Tesla Coil',
            cost: 600,
            damage: 25,
            range: 110,
            fireRate: 25,
            color: '#FFFF00',
            size: 16,
            chain: true,
            chainCount: 3,
            chainRange: 80
        },
        sniper: {
            name: 'Rail Gun',
            cost: 600,
            damage: 100,
            range: 300,
            fireRate: 60,
            color: '#00FF00',
            size: 16,
            piercing: true,
            pierceCount: 3
        }
    };

    // Alien types - multiple shape variations
    const alienTypes = {
        scout: {
            health: 80,
            speed: 1.5,
            reward: 12,
            color: '#90EE90',
            size: 10,
            shapes: ['arrow', 'dart', 'vshape']
        },
        fighter: {
            health: 150,
            speed: 1,
            reward: 20,
            color: '#FF6347',
            size: 14,
            shapes: ['diamond', 'cross', 'wings']
        },
        cruiser: {
            health: 400,
            speed: 0.6,
            reward: 40,
            color: '#9370DB',
            size: 18,
            shapes: ['star', 'octagon', 'triangle']
        },
        mothership: {
            health: 3000,
            speed: 0.6,
            reward: 200,
            color: '#FF1493',
            size: 32,
            shapes: ['hexagon']
        }
    };

    // Create starfield background
    function createStars() {
        stars = [];
        for (let i = 0; i < 100; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.5 + 0.1
            });
        }
    }

    // Initialize game
    function initGame() {
        towers = [];
        aliens = [];
        projectiles = [];
        particles = [];
        wave = 1;
        aliensKilled = 0;
        shield = 100;
        credits = 200;
        gameTime = 0;
        allAliensSpawned = false;
        unlockedTowers = ['plasma', 'laser', 'missile', 'freezer'];
        showingTowerChoice = false;
        specialTowerChoice = null;
        selectedTowerType = 'plasma';
        bossesDefeated = 0;
        createStars();
    }

    // Tower creation
    function createTower(gridX, gridY, type) {
        if (grid[gridX][gridY].occupied) return false;

        // Check tower limit
        if (towers.length >= MAX_TOWERS) {
            showSpaceGameMessage(`Maximum ${MAX_TOWERS} towers reached! Sell towers to build more.`, 'error');
            return false;
        }

        const towerData = towerTypes[type];
        if (credits < towerData.cost) return false;

        const tower = {
            x: gridX * GRID_SIZE + GRID_SIZE / 2,
            y: gridY * GRID_SIZE + GRID_SIZE / 2,
            gridX: gridX,
            gridY: gridY,
            type: type,
            ...towerData,
            lastShot: 0,
            target: null,
            angle: 0,
            level: 1
        };

        towers.push(tower);
        grid[gridX][gridY].occupied = true;
        grid[gridX][gridY].tower = tower;
        credits -= towerData.cost;
        return true;
    }

    // Alien spawning
    function spawnAlien(type = 'scout') {
        const alienData = alienTypes[type];
        const startPath = alienPath[0];

        // Progressive difficulty scaling
        let healthMultiplier = 1 + (wave - 1) * 0.20;
        let speedMultiplier = 1 + (wave - 1) * 0.06;
        let rewardMultiplier = 1 + (wave - 1) * 0.12;

        // Apply boss buff - 1.5x health for each boss defeated
        healthMultiplier *= Math.pow(1.5, bossesDefeated);

        // Extra scaling for mothership bosses - gets MUCH harder each boss wave
        if (type === 'mothership') {
            const bossWaveNumber = wave / 10; // Wave 10 = 1st boss, Wave 20 = 2nd boss, etc.
            healthMultiplier *= 1 + (bossWaveNumber - 1) * 0.8; // 80% more health per boss wave!
            speedMultiplier *= 1 + (bossWaveNumber - 1) * 0.15; // 15% faster per boss wave
            rewardMultiplier *= 1 + (bossWaveNumber - 1) * 0.5; // 50% more reward per boss wave
        }

        // Select shape based on wave level - unlock more shapes as waves progress
        // After boss waves (10+), prefer harder/later shapes
        let shapeIndex = 0;
        const shapeCount = alienData.shapes.length;

        if (wave <= 3) {
            shapeIndex = 0; // Only first shape
        } else if (wave <= 6) {
            shapeIndex = Math.floor(Math.random() * 2); // First 2 shapes
        } else if (wave <= 9) {
            shapeIndex = Math.floor(Math.random() * shapeCount); // All shapes
        } else {
            // After boss wave - favor later/harder shapes (last 2/3 of shape array)
            const startIndex = Math.floor(shapeCount / 3);
            shapeIndex = startIndex + Math.floor(Math.random() * (shapeCount - startIndex));
        }
        const selectedShape = alienData.shapes[shapeIndex];

        const alien = {
            x: startPath.x * GRID_SIZE + GRID_SIZE / 2,
            y: startPath.y * GRID_SIZE + GRID_SIZE / 2,
            pathIndex: 0,
            health: Math.floor(alienData.health * healthMultiplier),
            maxHealth: Math.floor(alienData.health * healthMultiplier),
            speed: alienData.speed * speedMultiplier,
            baseSpeed: alienData.speed * speedMultiplier,
            reward: Math.floor(alienData.reward * rewardMultiplier),
            color: alienData.color,
            size: alienData.size,
            shape: selectedShape,
            type: type,
            slowTimer: 0,
            rotation: 0
        };

        aliens.push(alien);
    }

    // Wave management
    function startWave() {
        waveInProgress = true;
        showingWaveAnnouncement = true;
        waveStartTime = gameTime;
        allAliensSpawned = false;

        // Shorter waves with fewer aliens
        const alienCount = Math.floor(8 + wave * 1.5);
        let spawnedCount = 0;

        // Show wave announcement for 3 seconds
        setTimeout(() => {
            showingWaveAnnouncement = false;

            // Special message for boss waves
            if (wave % 10 === 0) {
                showSpaceGameMessage(`⚠️ BOSS WAVE ${wave} - MOTHERSHIP DETECTED! ${alienCount} ships total!`, 'error');
            } else {
                showSpaceGameMessage(`Wave ${wave} - ${alienCount} alien ships incoming!`, 'info');
            }

            const spawnInterval = setInterval(() => {
                if (!gamePaused && gameRunning && !showingWaveAnnouncement && spawnedCount < alienCount) {
                    let alienType = 'scout';
                    const rand = Math.random();

                    // Wave 1: Only scouts
                    if (wave === 1) {
                        alienType = 'scout';
                    }
                    // Wave 2-3: Mostly scouts, some fighters
                    else if (wave <= 3) {
                        if (rand < 0.25) alienType = 'fighter';
                        else alienType = 'scout';
                    }
                    // Wave 4-6: Mix of scouts and fighters
                    else if (wave <= 6) {
                        if (rand < 0.45) alienType = 'fighter';
                        else alienType = 'scout';
                    }
                    // Wave 7-9: Introduce cruisers
                    else if (wave <= 9) {
                        if (rand < 0.35) alienType = 'fighter';
                        else if (rand < 0.50) alienType = 'scout';
                        else if (rand < 0.15) alienType = 'cruiser';
                    }
                    // Wave 10+: All types (but no random motherships on boss waves)
                    else {
                        // On boss waves (10, 20, 30), don't randomly spawn motherships
                        if (wave % 10 === 0) {
                            if (rand < 0.35) alienType = 'fighter';
                            else if (rand < 0.60) alienType = 'scout';
                            else alienType = 'cruiser';
                        } else {
                            // Normal waves can have random motherships
                            if (rand < 0.30) alienType = 'fighter';
                            else if (rand < 0.50) alienType = 'scout';
                            else if (rand < 0.30) alienType = 'cruiser';
                            else if (rand < 0.08) alienType = 'mothership';
                        }
                    }

                    // Boss wave every 10 waves (wave 10, 20, 30, etc.)
                    // Spawn boss at the beginning so it's more visible
                    if (wave % 10 === 0 && spawnedCount === 0) {
                        alienType = 'mothership';
                    }

                    spawnAlien(alienType);
                    spawnedCount++;
                } else if (spawnedCount >= alienCount) {
                    allAliensSpawned = true;
                    clearInterval(spawnInterval);
                }
            }, Math.max(1000, 1500 - wave * 20)); // Faster spawn rate - aliens closer together
        }, 3000); // 3 second announcement delay
    }

    // Update aliens
    function updateAliens() {
        for (let i = aliens.length - 1; i >= 0; i--) {
            const alien = aliens[i];

            // Apply slow effect
            if (alien.slowTimer > 0) {
                alien.slowTimer--;
                alien.speed = alien.baseSpeed * 0.5;
            } else {
                alien.speed = alien.baseSpeed;
            }

            // Rotate alien
            alien.rotation += 0.02;

            // Move alien along path
            if (alien.pathIndex < alienPath.length - 1) {
                const currentTarget = alienPath[alien.pathIndex + 1];
                const targetX = currentTarget.x * GRID_SIZE + GRID_SIZE / 2;
                const targetY = currentTarget.y * GRID_SIZE + GRID_SIZE / 2;

                const dx = targetX - alien.x;
                const dy = targetY - alien.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 5) {
                    alien.pathIndex++;
                } else {
                    alien.x += (dx / distance) * alien.speed;
                    alien.y += (dy / distance) * alien.speed;
                }
            } else {
                // Alien reached the station
                shield -= 10;
                aliens.splice(i, 1);
                createExplosionParticles(alien.x, alien.y, '#FF0000', 15);
                if (shield <= 0) {
                    gameOver();
                }
                continue;
            }

            // Remove dead aliens
            if (alien.health <= 0) {
                credits += alien.reward;
                aliensKilled++;
                createExplosionParticles(alien.x, alien.y, alien.color, 12);
                playAlienDeathSound();

                // Mothership bursts into smaller aliens when destroyed
                if (alien.type === 'mothership') {
                    const burstCount = 4; // Spawn 4 fighters
                    for (let b = 0; b < burstCount; b++) {
                        const angle = (Math.PI * 2 * b) / burstCount;
                        const offsetX = Math.cos(angle) * 40;
                        const offsetY = Math.sin(angle) * 40;

                        // Spawn fighter at mothership position
                        const fighterData = alienTypes['fighter'];
                        const healthMultiplier = 1 + (wave - 1) * 0.20;
                        const speedMultiplier = 1 + (wave - 1) * 0.06;
                        const rewardMultiplier = 1 + (wave - 1) * 0.12;

                        // Find closest path index to current position
                        let closestIndex = 0;
                        let closestDist = Infinity;
                        for (let p = 0; p < alienPath.length; p++) {
                            const pathX = alienPath[p].x * GRID_SIZE + GRID_SIZE / 2;
                            const pathY = alienPath[p].y * GRID_SIZE + GRID_SIZE / 2;
                            const dist = Math.sqrt(Math.pow(alien.x - pathX, 2) + Math.pow(alien.y - pathY, 2));
                            if (dist < closestDist) {
                                closestDist = dist;
                                closestIndex = p;
                            }
                        }

                        // Select shape for burst alien
                        const shapeCount = fighterData.shapes.length;
                        let shapeIndex = Math.floor(Math.random() * shapeCount);
                        const selectedShape = fighterData.shapes[shapeIndex];

                        const burstAlien = {
                            x: alien.x + offsetX,
                            y: alien.y + offsetY,
                            pathIndex: Math.min(closestIndex, alienPath.length - 1),
                            health: Math.floor(fighterData.health * healthMultiplier * Math.pow(1.5, bossesDefeated)),
                            maxHealth: Math.floor(fighterData.health * healthMultiplier * Math.pow(1.5, bossesDefeated)),
                            speed: fighterData.speed * speedMultiplier,
                            baseSpeed: fighterData.speed * speedMultiplier,
                            reward: Math.floor(fighterData.reward * rewardMultiplier),
                            color: fighterData.color,
                            size: fighterData.size,
                            shape: selectedShape,
                            type: 'fighter',
                            slowTimer: 0,
                            rotation: 0
                        };

                        aliens.push(burstAlien);
                    }

                    showSpaceGameMessage('Mothership destroyed! Fighters deployed!', 'error');
                }

                aliens.splice(i, 1);
            }
        }

        // Check if wave is complete - only when ALL aliens spawned AND all are dead
        if (aliens.length === 0 && gameRunning && waveInProgress && !showingWaveAnnouncement && allAliensSpawned) {
            waveInProgress = false;
            const completedWave = wave;
            const waveBonus = 60 + (completedWave * 15);
            credits += waveBonus;
            shield = Math.min(100, shield + 10); // Restore 10% shield

            // Check if boss wave was completed
            if (completedWave % 10 === 0) {
                bossesDefeated++;
                showSpaceGameMessage(`🎉 BOSS DEFEATED! All aliens now have 1.5x more health!`, 'error');
            }

            wave++;

            // Show tower choice at wave 10
            if (completedWave === 9 && !specialTowerChoice) {
                showingTowerChoice = true;
                gamePaused = true;
                showSpaceGameMessage(`🎉 Wave ${completedWave} Complete! +${waveBonus} credits | SPECIAL UNLOCK AVAILABLE!`, 'success');
                return; // Don't start next wave yet
            }

            // Calculate next wave info
            const nextWaveAlienCount = Math.floor(12 + wave * 2);
            const isBossWave = wave % 10 === 0;

            // Show completion message
            if (isBossWave) {
                showSpaceGameMessage(`🎉 Wave ${completedWave} Complete! +${waveBonus} credits | ⚠️ BOSS WAVE ${wave} STARTING NOW!`, 'error');
            } else {
                showSpaceGameMessage(`🎉 Wave ${completedWave} Complete! +${waveBonus} credits | Wave ${wave} starting now!`, 'success');
            }

            // Start next wave immediately
            if (gameRunning) startWave();
        }
    }

    // Update towers
    function updateTowers() {
        towers.forEach(tower => {
            // Find target
            tower.target = null;
            let closestDistance = tower.range;

            aliens.forEach(alien => {
                const dx = alien.x - tower.x;
                const dy = alien.y - tower.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < closestDistance) {
                    tower.target = alien;
                    closestDistance = distance;
                }
            });

            // Shoot at target
            if (tower.target && gameTime - tower.lastShot >= tower.fireRate) {
                const dx = tower.target.x - tower.x;
                const dy = tower.target.y - tower.y;
                tower.angle = Math.atan2(dy, dx);

                if (tower.continuous) {
                    // Continuous laser damage
                    tower.target.health -= tower.damage;
                    createLaserBeam(tower.x, tower.y, tower.target.x, tower.target.y, tower.color);
                    playLaserSound();
                } else if (tower.slow) {
                    // Slow projectile
                    createProjectile(tower.x, tower.y, tower.target, tower.damage, tower);
                    tower.target.slowTimer = 60; // 60 frames of slow
                    playFreezeSound();
                } else if (tower.chain) {
                    // Chain lightning attack
                    createChainLightning(tower.x, tower.y, tower.target, tower.damage, tower);
                    playLightningSound();
                } else if (tower.piercing) {
                    // Piercing rail gun shot
                    createPiercingShot(tower.x, tower.y, tower.angle, tower.damage, tower);
                    playRailGunSound();
                } else {
                    // Regular projectile
                    createProjectile(tower.x, tower.y, tower.target, tower.damage, tower);
                    if (tower.explosive) {
                        playMissileSound();
                    } else {
                        playPlasmaSound();
                    }
                }

                tower.lastShot = gameTime;
            }
        });
    }

    // Create projectile
    function createProjectile(x, y, target, damage, tower) {
        const dx = target.x - x;
        const dy = target.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = tower.explosive ? 6 : 10;

        projectiles.push({
            x: x,
            y: y,
            velX: (dx / distance) * speed,
            velY: (dy / distance) * speed,
            damage: damage,
            explosive: tower.explosive || false,
            aoe: tower.aoe || 0,
            slow: tower.slow || false,
            size: tower.explosive ? 8 : 5,
            color: tower.color,
            trail: []
        });
    }

    // Create chain lightning effect
    function createChainLightning(x, y, target, damage, tower) {
        // Damage first target
        target.health -= damage;

        // Create lightning visual
        particles.push({
            type: 'lightning',
            x1: x,
            y1: y,
            x2: target.x,
            y2: target.y,
            life: 12,
            color: tower.color
        });

        // Find chain targets
        let currentTarget = target;
        let chainedTargets = [target];

        for (let i = 0; i < tower.chainCount - 1; i++) {
            let nextTarget = null;
            let closestDistance = tower.chainRange;

            aliens.forEach(alien => {
                if (chainedTargets.includes(alien)) return;

                const dx = alien.x - currentTarget.x;
                const dy = alien.y - currentTarget.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < closestDistance) {
                    nextTarget = alien;
                    closestDistance = distance;
                }
            });

            if (nextTarget) {
                nextTarget.health -= damage * 0.7; // Reduced damage on chain
                chainedTargets.push(nextTarget);

                particles.push({
                    type: 'lightning',
                    x1: currentTarget.x,
                    y1: currentTarget.y,
                    x2: nextTarget.x,
                    y2: nextTarget.y,
                    life: 12,
                    color: tower.color
                });

                currentTarget = nextTarget;
            } else {
                break;
            }
        }
    }

    // Create piercing shot
    function createPiercingShot(x, y, angle, damage, tower) {
        projectiles.push({
            x: x,
            y: y,
            velX: Math.cos(angle) * 15,
            velY: Math.sin(angle) * 15,
            damage: damage,
            piercing: true,
            pierceCount: tower.pierceCount,
            piercedAliens: [],
            size: 6,
            color: tower.color,
            trail: []
        });
    }

    // Update projectiles
    function updateProjectiles() {
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const proj = projectiles[i];

            // Add trail effect
            proj.trail.push({ x: proj.x, y: proj.y, life: 10 });
            proj.trail = proj.trail.filter(t => t.life-- > 0);

            proj.x += proj.velX;
            proj.y += proj.velY;

            // Check collision with aliens
            let hit = false;
            for (let j = 0; j < aliens.length; j++) {
                const alien = aliens[j];
                const dx = proj.x - alien.x;
                const dy = proj.y - alien.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < alien.size) {
                    // Piercing projectiles can hit multiple enemies
                    if (proj.piercing && !proj.piercedAliens.includes(alien)) {
                        alien.health -= proj.damage;
                        proj.piercedAliens.push(alien);
                        createExplosionParticles(alien.x, alien.y, proj.color, 6);

                        // Stop piercing after max count
                        if (proj.piercedAliens.length >= proj.pierceCount) {
                            hit = true;
                            break;
                        }
                        continue; // Keep going through aliens
                    } else if (!proj.piercing) {
                        alien.health -= proj.damage;

                        if (proj.explosive) {
                            createExplosion(proj.x, proj.y, proj.aoe);
                            playExplosionSound();
                            // AOE damage
                            aliens.forEach(nearbyAlien => {
                                const nearDx = proj.x - nearbyAlien.x;
                                const nearDy = proj.y - nearbyAlien.y;
                                const nearDistance = Math.sqrt(nearDx * nearDx + nearDy * nearDy);
                                if (nearDistance < proj.aoe && nearbyAlien !== alien) {
                                    nearbyAlien.health -= proj.damage * 0.6;
                                }
                            });
                        }

                        if (proj.slow) {
                            alien.slowTimer = 60;
                        }

                        hit = true;
                        break;
                    }
                }
            }

            // Remove projectile if hit or out of bounds
            if (hit || proj.x < 0 || proj.x > canvas.width || proj.y < 0 || proj.y > canvas.height) {
                projectiles.splice(i, 1);
            }
        }
    }

    // Create laser beam effect
    function createLaserBeam(x1, y1, x2, y2, color) {
        particles.push({
            type: 'laser',
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            life: 8,
            color: color
        });
    }

    // Create explosion
    function createExplosion(x, y, radius) {
        particles.push({
            type: 'explosion',
            x: x,
            y: y,
            size: 0,
            maxSize: radius,
            life: 25,
            color: '#FFD700'
        });
    }

    // Create explosion particles
    function createExplosionParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            particles.push({
                type: 'debris',
                x: x,
                y: y,
                velX: Math.cos(angle) * (Math.random() * 3 + 2),
                velY: Math.sin(angle) * (Math.random() * 3 + 2),
                life: 40,
                color: color,
                size: Math.random() * 3 + 2
            });
        }
    }

    // Update particles
    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            particle.life--;

            if (particle.type === 'explosion') {
                particle.size += particle.maxSize / 25;
            } else if (particle.type === 'debris') {
                particle.x += particle.velX;
                particle.y += particle.velY;
                particle.velX *= 0.97;
                particle.velY *= 0.97;
            }

            if (particle.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    // Update stars
    function updateStars() {
        stars.forEach(star => {
            star.y += star.speed;
            if (star.y > canvas.height) {
                star.y = 0;
                star.x = Math.random() * canvas.width;
            }
        });
    }

    // Drawing functions
    function drawGame() {
        // Space background
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw stars
        stars.forEach(star => {
            ctx.fillStyle = `rgba(255, 255, 255, ${star.size / 3})`;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });

        // Draw portal at the end of the track FIRST (so path doesn't cover it)
        const lastCell = alienPath[alienPath.length - 1];
        // Position portal very close to right edge
        const portalX = 780;
        const portalY = lastCell.y * GRID_SIZE + GRID_SIZE / 2;

        // Animated portal effect using Date.now() so it always animates
        const currentTime = Date.now() * 0.001; // Convert to seconds
        const portalPulse = Math.sin(currentTime * 2) * 10 + 50;
        const portalRotation = currentTime * 0.5;

        // Outer glow
        const outerGlow = ctx.createRadialGradient(portalX, portalY, 0, portalX, portalY, portalPulse + 20);
        outerGlow.addColorStop(0, 'rgba(0, 150, 255, 0.6)');
        outerGlow.addColorStop(0.5, 'rgba(0, 100, 255, 0.4)');
        outerGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(portalX, portalY, portalPulse + 20, 0, Math.PI * 2);
        ctx.fill();

        // Portal rings
        ctx.save();
        ctx.translate(portalX, portalY);
        ctx.rotate(portalRotation);

        for (let i = 3; i >= 1; i--) {
            const ringSize = portalPulse * (i / 3);
            const ringGradient = ctx.createRadialGradient(0, 0, ringSize - 10, 0, 0, ringSize);
            ringGradient.addColorStop(0, 'rgba(0, 200, 255, 0)');
            ringGradient.addColorStop(0.7, `rgba(0, 150, 255, ${0.5 * (i / 3)})`);
            ringGradient.addColorStop(1, 'rgba(0, 180, 255, 0.8)');

            ctx.strokeStyle = ringGradient;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, ringSize, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Portal swirl effect
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
        ctx.lineWidth = 3;
        for (let s = 0; s < 4; s++) {
            const spiralAngle = (Math.PI * 2 * s) / 4;
            ctx.beginPath();
            for (let r = 0; r < portalPulse; r += 5) {
                const angle = spiralAngle + (r / portalPulse) * Math.PI * 4;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                if (r === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }

        // Inner black hole
        const blackHole = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
        blackHole.addColorStop(0, '#000000');
        blackHole.addColorStop(0.7, '#001a33');
        blackHole.addColorStop(1, 'rgba(0, 100, 180, 0.5)');
        ctx.fillStyle = blackHole;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Draw grid
        ctx.strokeStyle = 'rgba(100, 100, 255, 0.15)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= GRID_WIDTH; x++) {
            ctx.beginPath();
            ctx.moveTo(x * GRID_SIZE, 0);
            ctx.lineTo(x * GRID_SIZE, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= GRID_HEIGHT; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * GRID_SIZE);
            ctx.lineTo(canvas.width, y * GRID_SIZE);
            ctx.stroke();
        }

        // Draw path (drawn after portal so it doesn't cover portal completely)
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
        ctx.lineWidth = 30;
        ctx.beginPath();
        alienPath.forEach((cell, index) => {
            const x = cell.x * GRID_SIZE + GRID_SIZE / 2;
            const y = cell.y * GRID_SIZE + GRID_SIZE / 2;
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // Highlight hovered cell
        if (hoveredCell.x >= 0 && hoveredCell.y >= 0) {
            const canBuild = !grid[hoveredCell.x][hoveredCell.y].occupied && credits >= towerTypes[selectedTowerType].cost;
            ctx.fillStyle = canBuild ? 'rgba(0, 255, 100, 0.3)' : 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(hoveredCell.x * GRID_SIZE, hoveredCell.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        }

        // Draw towers
        towers.forEach(tower => {
            // Tower range when hovering
            if (hoveredCell.x === tower.gridX && hoveredCell.y === tower.gridY) {
                ctx.strokeStyle = 'rgba(100, 200, 255, 0.4)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
                ctx.stroke();

                // Tower info popup
                const infoX = Math.min(tower.x + 30, canvas.width - 140);
                const infoY = Math.max(tower.y - 40, 10);
                ctx.fillStyle = 'rgba(10, 10, 40, 0.9)';
                ctx.fillRect(infoX, infoY, 130, 90);
                ctx.strokeStyle = tower.color;
                ctx.lineWidth = 2;
                ctx.strokeRect(infoX, infoY, 130, 90);

                ctx.fillStyle = tower.color;
                ctx.font = 'bold 12px Arial';
                ctx.fillText(tower.name, infoX + 5, infoY + 15);
                ctx.fillText(`DMG: ${Math.floor(tower.damage)}`, infoX + 5, infoY + 32);
                ctx.fillText(`Range: ${tower.range}`, infoX + 5, infoY + 47);
                ctx.fillText(`Level: ${tower.level}/3`, infoX + 5, infoY + 62);

                // Only show upgrade cost if not max level
                if (tower.level < 3) {
                    const upgradeCost = Math.floor(tower.cost * 0.8 * tower.level);
                    ctx.fillText(`↑ $${upgradeCost}`, infoX + 75, infoY + 62);
                } else {
                    ctx.fillStyle = '#FFD700';
                    ctx.fillText(`MAX`, infoX + 75, infoY + 62);
                    ctx.fillStyle = tower.color;
                }

                // Sell value
                let totalInvestment = tower.cost;
                for (let i = 1; i < tower.level; i++) {
                    totalInvestment += Math.floor(tower.cost * 0.8 * i);
                }
                const sellValue = Math.floor(totalInvestment * 0.5);
                ctx.fillStyle = '#FFD700';
                ctx.fillText(`[F] Sell $${sellValue}`, infoX + 5, infoY + 80);
            }

            // Tower glow
            const gradient = ctx.createRadialGradient(tower.x, tower.y, 0, tower.x, tower.y, tower.size + 8);
            gradient.addColorStop(0, tower.color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(tower.x, tower.y, tower.size + 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.save();
            ctx.translate(tower.x, tower.y);

            // Different designs based on tower type
            if (tower.type === 'plasma') {
                // Plasma Cannon - hexagonal base with energy core
                ctx.fillStyle = '#1a3a4a';
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 * i) / 6;
                    const x = Math.cos(angle) * tower.size;
                    const y = Math.sin(angle) * tower.size;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = tower.color;
                ctx.lineWidth = 3;
                ctx.stroke();

                // Energy core
                ctx.fillStyle = tower.color;
                ctx.beginPath();
                ctx.arc(0, 0, tower.size * 0.5, 0, Math.PI * 2);
                ctx.fill();

                // Barrel
                ctx.rotate(tower.angle);
                ctx.fillStyle = tower.color;
                ctx.fillRect(0, -3, tower.size + 10, 6);
                ctx.fillStyle = '#FFF';
                ctx.fillRect(tower.size + 6, -2, 4, 4);
            }
            else if (tower.type === 'laser') {
                // Laser Beam - crystalline structure
                ctx.fillStyle = '#4a0000';
                ctx.fillRect(-tower.size, -tower.size, tower.size * 2, tower.size * 2);

                ctx.strokeStyle = tower.color;
                ctx.lineWidth = 3;
                ctx.strokeRect(-tower.size, -tower.size, tower.size * 2, tower.size * 2);

                // Crystal
                ctx.fillStyle = tower.color;
                ctx.beginPath();
                ctx.moveTo(0, -tower.size * 0.8);
                ctx.lineTo(tower.size * 0.6, 0);
                ctx.lineTo(0, tower.size * 0.8);
                ctx.lineTo(-tower.size * 0.6, 0);
                ctx.closePath();
                ctx.fill();

                // Laser emitter
                ctx.rotate(tower.angle);
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(0, -2, tower.size + 12, 4);
            }
            else if (tower.type === 'missile') {
                // Missile Launcher - platform with missiles
                ctx.fillStyle = '#3a3a1a';
                ctx.fillRect(-tower.size, -tower.size * 0.7, tower.size * 2, tower.size * 1.4);
                ctx.strokeStyle = tower.color;
                ctx.lineWidth = 3;
                ctx.strokeRect(-tower.size, -tower.size * 0.7, tower.size * 2, tower.size * 1.4);

                // Missile pods
                ctx.rotate(tower.angle);
                ctx.fillStyle = tower.color;
                ctx.fillRect(0, -6, tower.size + 8, 5);
                ctx.fillRect(0, 1, tower.size + 8, 5);

                // Missile tips
                ctx.fillStyle = '#FF4444';
                ctx.beginPath();
                ctx.moveTo(tower.size + 8, -6);
                ctx.lineTo(tower.size + 12, -3.5);
                ctx.lineTo(tower.size + 8, -1);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(tower.size + 8, 1);
                ctx.lineTo(tower.size + 12, 3.5);
                ctx.lineTo(tower.size + 8, 6);
                ctx.fill();
            }
            else if (tower.type === 'freezer') {
                // Cryo Tower - snowflake design
                ctx.fillStyle = '#1a2a3a';
                ctx.beginPath();
                ctx.arc(0, 0, tower.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = tower.color;
                ctx.lineWidth = 3;
                ctx.stroke();

                // Snowflake pattern
                ctx.strokeStyle = tower.color;
                ctx.lineWidth = 2;
                for (let i = 0; i < 6; i++) {
                    ctx.rotate(Math.PI / 3);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(0, -tower.size * 0.8);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(0, -tower.size * 0.5);
                    ctx.lineTo(-3, -tower.size * 0.6);
                    ctx.lineTo(3, -tower.size * 0.6);
                    ctx.stroke();
                }

                // Cryo emitter
                ctx.rotate(tower.angle);
                ctx.fillStyle = tower.color;
                ctx.fillRect(0, -4, tower.size + 6, 8);
            }
            else if (tower.type === 'lightning') {
                // Tesla Coil - vertical coil with electricity
                ctx.fillStyle = '#3a3a00';
                ctx.fillRect(-tower.size * 0.6, -tower.size, tower.size * 1.2, tower.size * 2);
                ctx.strokeStyle = tower.color;
                ctx.lineWidth = 3;
                ctx.strokeRect(-tower.size * 0.6, -tower.size, tower.size * 1.2, tower.size * 2);

                // Coil rings
                ctx.strokeStyle = tower.color;
                ctx.lineWidth = 2;
                for (let i = -0.8; i <= 0.8; i += 0.4) {
                    ctx.beginPath();
                    ctx.arc(0, tower.size * i, tower.size * 0.5, 0, Math.PI * 2);
                    ctx.stroke();
                }

                // Electric spark at top
                ctx.fillStyle = tower.color;
                ctx.beginPath();
                ctx.arc(0, -tower.size, tower.size * 0.4, 0, Math.PI * 2);
                ctx.fill();

                // Electric arcs
                if (tower.target) {
                    ctx.strokeStyle = tower.color;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(0, -tower.size);
                    ctx.lineTo(tower.size * 0.5, -tower.size * 1.2);
                    ctx.lineTo(-tower.size * 0.3, -tower.size * 1.3);
                    ctx.stroke();
                }
            }
            else if (tower.type === 'sniper') {
                // Rail Gun - long barrel sniper
                ctx.fillStyle = '#0a3a0a';
                ctx.fillRect(-tower.size * 0.8, -tower.size * 0.5, tower.size * 1.6, tower.size);
                ctx.strokeStyle = tower.color;
                ctx.lineWidth = 3;
                ctx.strokeRect(-tower.size * 0.8, -tower.size * 0.5, tower.size * 1.6, tower.size);

                // Scope
                ctx.fillStyle = tower.color;
                ctx.beginPath();
                ctx.arc(0, 0, tower.size * 0.6, 0, Math.PI * 2);
                ctx.fill();

                // Barrel
                ctx.rotate(tower.angle);
                ctx.fillStyle = '#00FF00';
                ctx.fillRect(0, -3, tower.size * 2, 6);
                ctx.strokeStyle = tower.color;
                ctx.lineWidth = 2;
                ctx.strokeRect(0, -3, tower.size * 2, 6);

                // Barrel tip
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(tower.size * 2, -2, 4, 4);
            }

            ctx.restore();

            // Level indicator
            if (tower.level > 1) {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`L${tower.level}`, tower.x, tower.y - tower.size - 5);
                ctx.textAlign = 'left';
            }
        });

        // Draw aliens
        aliens.forEach(alien => {
            ctx.save();
            ctx.translate(alien.x, alien.y);
            ctx.rotate(alien.rotation);

            // Alien glow
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, alien.size + 3);
            gradient.addColorStop(0, alien.color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, alien.size + 3, 0, Math.PI * 2);
            ctx.fill();

            // Draw based on shape
            ctx.fillStyle = alien.color;
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            ctx.beginPath();

            if (alien.shape === 'arrow') {
                // Scout - Arrow/wedge shape (fast attacker)
                ctx.moveTo(0, -alien.size * 1.3);
                ctx.lineTo(alien.size * 0.8, alien.size * 0.5);
                ctx.lineTo(0, alien.size * 0.2);
                ctx.lineTo(-alien.size * 0.8, alien.size * 0.5);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Engine glow
                ctx.fillStyle = '#FFFF00';
                ctx.beginPath();
                ctx.arc(0, alien.size * 0.2, alien.size * 0.3, 0, Math.PI * 2);
                ctx.fill();
            } else if (alien.shape === 'diamond') {
                // Fighter - Sleek dual-blade fighter
                // Main body
                ctx.moveTo(0, -alien.size * 1.1);
                ctx.lineTo(alien.size * 0.4, -alien.size * 0.2);
                ctx.lineTo(alien.size * 0.4, alien.size * 0.8);
                ctx.lineTo(0, alien.size * 0.5);
                ctx.lineTo(-alien.size * 0.4, alien.size * 0.8);
                ctx.lineTo(-alien.size * 0.4, -alien.size * 0.2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Energy blades
                ctx.fillStyle = '#FF8800';
                ctx.beginPath();
                ctx.moveTo(-alien.size * 0.4, -alien.size * 0.1);
                ctx.lineTo(-alien.size * 1.3, -alien.size * 0.4);
                ctx.lineTo(-alien.size * 1.3, alien.size * 0.2);
                ctx.lineTo(-alien.size * 0.4, alien.size * 0.5);
                ctx.closePath();
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(alien.size * 0.4, -alien.size * 0.1);
                ctx.lineTo(alien.size * 1.3, -alien.size * 0.4);
                ctx.lineTo(alien.size * 1.3, alien.size * 0.2);
                ctx.lineTo(alien.size * 0.4, alien.size * 0.5);
                ctx.closePath();
                ctx.fill();

                // Cockpit
                ctx.fillStyle = '#00FFFF';
                ctx.beginPath();
                ctx.arc(0, 0, alien.size * 0.25, 0, Math.PI * 2);
                ctx.fill();
            } else if (alien.shape === 'star') {
                // Cruiser - 5-pointed star
                for (let i = 0; i < 5; i++) {
                    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                    const x = Math.cos(angle) * alien.size;
                    const y = Math.sin(angle) * alien.size;

                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);

                    // Inner point
                    const innerAngle = angle + Math.PI / 5;
                    const innerX = Math.cos(innerAngle) * alien.size * 0.4;
                    const innerY = Math.sin(innerAngle) * alien.size * 0.4;
                    ctx.lineTo(innerX, innerY);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Center core
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(0, 0, alien.size * 0.25, 0, Math.PI * 2);
                ctx.fill();
            } else if (alien.shape === 'dart') {
                // Scout variant - Dart shape
                ctx.moveTo(0, -alien.size * 1.5);
                ctx.lineTo(alien.size * 0.5, alien.size * 0.3);
                ctx.lineTo(alien.size * 0.3, alien.size * 0.8);
                ctx.lineTo(-alien.size * 0.3, alien.size * 0.8);
                ctx.lineTo(-alien.size * 0.5, alien.size * 0.3);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else if (alien.shape === 'vshape') {
                // Scout variant - V-Shape boomerang
                ctx.moveTo(0, -alien.size);
                ctx.lineTo(alien.size * 1.2, alien.size * 0.5);
                ctx.lineTo(alien.size * 0.7, alien.size * 0.7);
                ctx.lineTo(0, alien.size * 0.3);
                ctx.lineTo(-alien.size * 0.7, alien.size * 0.7);
                ctx.lineTo(-alien.size * 1.2, alien.size * 0.5);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else if (alien.shape === 'cross') {
                // Fighter variant - X-wing style fighter
                // Main body
                ctx.fillRect(-alien.size * 0.3, -alien.size * 0.8, alien.size * 0.6, alien.size * 1.6);
                ctx.strokeRect(-alien.size * 0.3, -alien.size * 0.8, alien.size * 0.6, alien.size * 1.6);

                // Four wings in X pattern
                ctx.fillStyle = '#FF4444';

                // Top-left wing
                ctx.beginPath();
                ctx.moveTo(-alien.size * 0.3, -alien.size * 0.5);
                ctx.lineTo(-alien.size * 1.1, -alien.size * 1.2);
                ctx.lineTo(-alien.size * 0.8, -alien.size * 0.3);
                ctx.closePath();
                ctx.fill();

                // Top-right wing
                ctx.beginPath();
                ctx.moveTo(alien.size * 0.3, -alien.size * 0.5);
                ctx.lineTo(alien.size * 1.1, -alien.size * 1.2);
                ctx.lineTo(alien.size * 0.8, -alien.size * 0.3);
                ctx.closePath();
                ctx.fill();

                // Bottom-left wing
                ctx.beginPath();
                ctx.moveTo(-alien.size * 0.3, alien.size * 0.5);
                ctx.lineTo(-alien.size * 1.1, alien.size * 1.2);
                ctx.lineTo(-alien.size * 0.8, alien.size * 0.3);
                ctx.closePath();
                ctx.fill();

                // Bottom-right wing
                ctx.beginPath();
                ctx.moveTo(alien.size * 0.3, alien.size * 0.5);
                ctx.lineTo(alien.size * 1.1, alien.size * 1.2);
                ctx.lineTo(alien.size * 0.8, alien.size * 0.3);
                ctx.closePath();
                ctx.fill();

                // Cockpit
                ctx.fillStyle = '#FFFF00';
                ctx.beginPath();
                ctx.arc(0, -alien.size * 0.3, alien.size * 0.2, 0, Math.PI * 2);
                ctx.fill();
            } else if (alien.shape === 'wings') {
                // Fighter variant - Wide wings
                ctx.moveTo(0, -alien.size * 0.5);
                ctx.lineTo(alien.size * 1.5, 0);
                ctx.lineTo(alien.size * 0.5, alien.size * 0.8);
                ctx.lineTo(0, alien.size * 0.5);
                ctx.lineTo(-alien.size * 0.5, alien.size * 0.8);
                ctx.lineTo(-alien.size * 1.5, 0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Cockpit
                ctx.fillStyle = '#00FFFF';
                ctx.beginPath();
                ctx.arc(0, -alien.size * 0.2, alien.size * 0.3, 0, Math.PI * 2);
                ctx.fill();
            } else if (alien.shape === 'octagon') {
                // Cruiser variant - Octagon
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 * i) / 8;
                    const x = Math.cos(angle) * alien.size;
                    const y = Math.sin(angle) * alien.size;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Inner square
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(-alien.size * 0.4, -alien.size * 0.4, alien.size * 0.8, alien.size * 0.8);
            } else if (alien.shape === 'triangle') {
                // Cruiser variant - Large triangle
                ctx.moveTo(0, -alien.size * 1.2);
                ctx.lineTo(alien.size * 1.1, alien.size * 0.8);
                ctx.lineTo(-alien.size * 1.1, alien.size * 0.8);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Engine cores
                ctx.fillStyle = '#00FFFF';
                ctx.beginPath();
                ctx.arc(alien.size * 0.6, alien.size * 0.5, alien.size * 0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(-alien.size * 0.6, alien.size * 0.5, alien.size * 0.2, 0, Math.PI * 2);
                ctx.fill();
            } else if (alien.shape === 'hexagon') {
                // Mothership - large hexagon with extra details
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 * i) / 6;
                    const x = Math.cos(angle) * alien.size;
                    const y = Math.sin(angle) * alien.size;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.lineWidth = 3;
                ctx.stroke();

                // Inner hexagon detail
                ctx.strokeStyle = '#FFF';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 * i) / 6;
                    const x = Math.cos(angle) * alien.size * 0.6;
                    const y = Math.sin(angle) * alien.size * 0.6;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.stroke();

                // Central core
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(0, 0, alien.size * 0.3, 0, Math.PI * 2);
                ctx.fill();

                // Warning stripes for mothership
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 * i) / 6;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * alien.size * 0.5, Math.sin(angle) * alien.size * 0.5);
                    ctx.stroke();
                }
                ctx.lineWidth = 1;
            }

            // Slow indicator
            if (alien.slowTimer > 0) {
                ctx.fillStyle = 'rgba(135, 206, 235, 0.5)';
                ctx.beginPath();
                ctx.arc(0, 0, alien.size + 5, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();

            // Health bar
            if (alien.health < alien.maxHealth) {
                const barWidth = alien.size * 2.5;
                const barHeight = 5;
                const barX = alien.x - barWidth / 2;
                const barY = alien.y - alien.size - 12;

                ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                ctx.fillRect(barX, barY, barWidth, barHeight);
                ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
                ctx.fillRect(barX, barY, (alien.health / alien.maxHealth) * barWidth, barHeight);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.strokeRect(barX, barY, barWidth, barHeight);
            }
        });

        // Draw projectiles with trails
        projectiles.forEach(proj => {
            // Draw trail
            proj.trail.forEach((t, index) => {
                const alpha = (t.life / 10) * 0.6;
                const size = proj.size * (index / proj.trail.length);
                ctx.fillStyle = `rgba(${hexToRgb(proj.color)}, ${alpha})`;
                ctx.beginPath();
                ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw projectile
            const gradient = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, proj.size);
            gradient.addColorStop(0, '#FFF');
            gradient.addColorStop(0.5, proj.color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw particles
        particles.forEach(particle => {
            const alpha = particle.life / 40;
            ctx.globalAlpha = alpha;

            if (particle.type === 'laser') {
                ctx.strokeStyle = particle.color;
                ctx.lineWidth = 4;
                ctx.shadowColor = particle.color;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(particle.x1, particle.y1);
                ctx.lineTo(particle.x2, particle.y2);
                ctx.stroke();
                ctx.shadowBlur = 0;
            } else if (particle.type === 'lightning') {
                // Draw jagged lightning bolt
                ctx.strokeStyle = particle.color;
                ctx.lineWidth = 3;
                ctx.shadowColor = particle.color;
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.moveTo(particle.x1, particle.y1);

                // Add zigzag effect
                const segments = 3;
                for (let i = 1; i <= segments; i++) {
                    const t = i / segments;
                    const x = particle.x1 + (particle.x2 - particle.x1) * t + (Math.random() - 0.5) * 20;
                    const y = particle.y1 + (particle.y2 - particle.y1) * t + (Math.random() - 0.5) * 20;
                    ctx.lineTo(x, y);
                }
                ctx.lineTo(particle.x2, particle.y2);
                ctx.stroke();
                ctx.shadowBlur = 0;
            } else if (particle.type === 'explosion') {
                const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size);
                gradient.addColorStop(0, '#FFF');
                gradient.addColorStop(0.5, particle.color);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (particle.type === 'debris') {
                ctx.fillStyle = particle.color;
                ctx.fillRect(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, particle.size);
            }

            ctx.globalAlpha = 1;
        });

        // Draw HUD
        drawHUD();
        drawTowerSelector();

        // Draw tower choice UI if active
        if (showingTowerChoice) {
            drawTowerChoice();
        }
    }

    // Draw HUD
    function drawHUD() {
        // Stats background
        ctx.fillStyle = 'rgba(10, 10, 40, 0.85)';
        ctx.fillRect(10, 10, 220, 110);
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 220, 110);

        // Stats text
        ctx.fillStyle = '#00FFFF';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`Credits: ${credits}`, 20, 32);
        ctx.fillText(`Wave: ${wave}`, 20, 55);

        // Tower count
        const towerColor = towers.length >= MAX_TOWERS ? '#FF0000' : '#00FFFF';
        ctx.fillStyle = towerColor;
        ctx.fillText(`Towers: ${towers.length}/${MAX_TOWERS}`, 20, 78);

        // Shield bar
        ctx.fillStyle = '#00FFFF';
        ctx.fillText(`Shield:`, 20, 93);
        const shieldBarX = 95;
        const shieldBarY = 80;
        const shieldBarWidth = 120;
        const shieldBarHeight = 18;

        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(shieldBarX, shieldBarY, shieldBarWidth, shieldBarHeight);

        const shieldColor = shield > 50 ? '#00FF00' : shield > 25 ? '#FFFF00' : '#FF0000';
        ctx.fillStyle = shieldColor;
        ctx.fillRect(shieldBarX, shieldBarY, (shield / 100) * shieldBarWidth, shieldBarHeight);

        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(shieldBarX, shieldBarY, shieldBarWidth, shieldBarHeight);

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${shield}%`, shieldBarX + shieldBarWidth / 2, shieldBarY + 13);
        ctx.textAlign = 'left';

        ctx.fillStyle = '#00FFFF';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`Destroyed: ${aliensKilled}`, 20, 108);
    }

    // Update shop slide animation
    function updateShopSlide() {
        if (shopVisible) {
            // Slide in
            if (shopSlideOffset > 0) {
                shopSlideOffset -= 8;
                if (shopSlideOffset < 0) shopSlideOffset = 0;
            }
        } else {
            // Slide out
            if (shopSlideOffset < 130) {
                shopSlideOffset += 8;
                if (shopSlideOffset > 130) shopSlideOffset = 130;
            }
        }
    }

    // Draw tower selector
    function drawTowerSelector() {
        const selectorY = canvas.height - 130 + shopSlideOffset;

        // Background
        ctx.fillStyle = 'rgba(10, 10, 40, 0.9)';
        ctx.fillRect(10, selectorY, canvas.width - 20, 120);
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, selectorY, canvas.width - 20, 120);

        // Title
        ctx.fillStyle = '#00FFFF';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('DEFENSE SYSTEMS - Select tower then click to deploy', 20, selectorY + 20);

        // Hide hint in bottom right corner
        ctx.fillStyle = '#FFD700';
        ctx.font = '11px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('[H] Hide Shop', canvas.width - 20, selectorY + 20);
        ctx.textAlign = 'left';

        // Tower options - only show unlocked towers
        let x = 20;
        let displayIndex = 0;
        Object.keys(towerTypes).forEach((key) => {
            const tower = towerTypes[key];

            // Skip locked towers
            if (!unlockedTowers.includes(key)) return;

            const selected = selectedTowerType === key;
            const canAfford = credits >= tower.cost;

            // Tower preview
            ctx.fillStyle = selected ? 'rgba(0, 255, 255, 0.3)' : 'rgba(100, 100, 255, 0.1)';
            ctx.fillRect(x, selectorY + 30, 140, 80);
            if (selected) {
                ctx.strokeStyle = '#00FFFF';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, selectorY + 30, 140, 80);
            }

            // Tower icon
            const gradient = ctx.createRadialGradient(x + 25, selectorY + 60, 0, x + 25, selectorY + 60, 14);
            gradient.addColorStop(0, tower.color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x + 25, selectorY + 60, 14, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = tower.color;
            ctx.beginPath();
            ctx.arc(x + 25, selectorY + 60, 10, 0, Math.PI * 2);
            ctx.fill();

            // Tower info
            ctx.fillStyle = canAfford ? '#FFFFFF' : '#666666';
            ctx.font = 'bold 11px Arial';
            ctx.fillText(tower.name, x + 48, selectorY + 50);
            ctx.font = '10px Arial';
            ctx.fillText(`Cost: ${tower.cost}`, x + 48, selectorY + 65);
            ctx.fillText(`DMG: ${tower.damage}`, x + 48, selectorY + 78);
            ctx.fillText(`Range: ${tower.range}`, x + 48, selectorY + 91);

            // Hotkey
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(`[${displayIndex + 1}]`, x + 5, selectorY + 50);

            displayIndex++;
            x += 148;
        });
    }

    // Draw tower choice UI
    function drawTowerChoice() {
        if (!showingTowerChoice) return;

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Title
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
        ctx.fillText('WAVE 10 REACHED!', canvas.width / 2, 80);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#00FFFF';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('Choose Your Special Defense System', canvas.width / 2, 130);

        // Tesla Coil option (left)
        const leftX = canvas.width / 2 - 220;
        const centerY = canvas.height / 2;

        ctx.fillStyle = 'rgba(255, 255, 0, 0.15)';
        ctx.fillRect(leftX - 10, centerY - 140, 200, 280);
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 3;
        ctx.strokeRect(leftX - 10, centerY - 140, 200, 280);

        // Tesla tower icon
        const gradient1 = ctx.createRadialGradient(leftX + 90, centerY - 80, 0, leftX + 90, centerY - 80, 40);
        gradient1.addColorStop(0, '#FFFF00');
        gradient1.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient1;
        ctx.beginPath();
        ctx.arc(leftX + 90, centerY - 80, 40, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFF00';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('TESLA COIL', leftX + 90, centerY + 10);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Arial';
        ctx.fillText('Chain Lightning', leftX + 90, centerY + 35);
        ctx.fillText('Hits 3 enemies', leftX + 90, centerY + 55);
        ctx.fillText('25 damage per hit', leftX + 90, centerY + 75);
        ctx.fillText('Cost: 600', leftX + 90, centerY + 95);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('[1] SELECT', leftX + 90, centerY + 120);

        // Rail Gun option (right)
        const rightX = canvas.width / 2 + 20;

        ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
        ctx.fillRect(rightX - 10, centerY - 140, 200, 280);
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 3;
        ctx.strokeRect(rightX - 10, centerY - 140, 200, 280);

        // Rail gun icon
        const gradient2 = ctx.createRadialGradient(rightX + 90, centerY - 80, 0, rightX + 90, centerY - 80, 40);
        gradient2.addColorStop(0, '#00FF00');
        gradient2.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient2;
        ctx.beginPath();
        ctx.arc(rightX + 90, centerY - 80, 40, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('RAIL GUN', rightX + 90, centerY + 10);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Arial';
        ctx.fillText('Piercing Shot', rightX + 90, centerY + 35);
        ctx.fillText('Pierces 3 enemies', rightX + 90, centerY + 55);
        ctx.fillText('100 damage', rightX + 90, centerY + 75);
        ctx.fillText('Cost: 600', rightX + 90, centerY + 95);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('[2] SELECT', rightX + 90, centerY + 120);

        // Instructions
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '18px Arial';
        ctx.fillText('Press 1 or 2 to choose, or click on a tower', canvas.width / 2, canvas.height - 40);

        ctx.textAlign = 'left';
    }

    // Tower upgrade function
    function upgradeTower(tower) {
        // Max level is 3
        if (tower.level >= 3) {
            showSpaceGameMessage(`${tower.name} is already max level (3)!`, 'error');
            return false;
        }

        const upgradeCost = Math.floor(tower.cost * 0.8 * tower.level);
        if (credits >= upgradeCost) {
            credits -= upgradeCost;
            tower.level++;
            tower.damage = Math.floor(tower.damage * 1.4);
            tower.range += 15;
            showSpaceGameMessage(`${tower.name} upgraded to Level ${tower.level}!`, 'success');
            return true;
        }
        return false;
    }

    // Tower sell function
    function sellTower(tower, gridX, gridY) {
        // Calculate sell value (50% of total investment)
        let totalInvestment = tower.cost;
        for (let i = 1; i < tower.level; i++) {
            totalInvestment += Math.floor(tower.cost * 0.8 * i);
        }
        const sellValue = Math.floor(totalInvestment * 0.5);

        // Remove tower
        towers = towers.filter(t => t !== tower);
        grid[gridX][gridY].occupied = false;
        grid[gridX][gridY].tower = null;
        credits += sellValue;

        playSellSound();
        showSpaceGameMessage(`${tower.name} sold for ${sellValue} credits!`, 'info');
    }

    // Helper function to convert hex to RGB
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ?
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
            '255, 255, 255';
    }

    // Select special tower
    function selectSpecialTower(towerType) {
        specialTowerChoice = towerType;
        unlockedTowers.push(towerType);
        selectedTowerType = towerType;
        showingTowerChoice = false;
        gamePaused = false;
        showSpaceGameMessage(`${towerTypes[towerType].name} unlocked! Wave 10 starting now!`, 'success');

        // Start wave 10
        if (gameRunning) startWave();
    }

    // Input handling
    function handleClick(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;

        // Tower choice selection
        if (showingTowerChoice) {
            const centerY = canvas.height / 2;
            const leftX = canvas.width / 2 - 220;
            const rightX = canvas.width / 2 + 20;

            // Check Tesla Coil (left)
            if (clickX >= leftX - 10 && clickX <= leftX + 190 && clickY >= centerY - 140 && clickY <= centerY + 140) {
                selectSpecialTower('lightning');
                return;
            }
            // Check Rail Gun (right)
            if (clickX >= rightX - 10 && clickX <= rightX + 190 && clickY >= centerY - 140 && clickY <= centerY + 140) {
                selectSpecialTower('sniper');
                return;
            }
        }

        // Check tower selector
        const selectorY = canvas.height - 130 + shopSlideOffset;
        if (clickY >= selectorY + 30 && clickY <= selectorY + 110) {
            const towerIndex = Math.floor((clickX - 20) / 148);
            const unlockedKeys = unlockedTowers.filter(key => towerTypes[key]);
            if (towerIndex >= 0 && towerIndex < unlockedKeys.length) {
                selectedTowerType = unlockedKeys[towerIndex];
                return;
            }
        }

        // Place tower or upgrade existing
        if (gameRunning) {
            const gridX = Math.floor(clickX / GRID_SIZE);
            const gridY = Math.floor(clickY / GRID_SIZE);

            if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
                const existingTower = grid[gridX][gridY].tower;

                // Upgrade existing tower with Shift+Click
                if (existingTower && e.shiftKey) {
                    if (upgradeTower(existingTower)) {
                        // Tower upgraded successfully
                    } else {
                        showSpaceGameMessage('Insufficient credits for upgrade!', 'error');
                    }
                    return;
                }

                // Place new tower
                if (createTower(gridX, gridY, selectedTowerType)) {
                    showSpaceGameMessage(`${towerTypes[selectedTowerType].name} deployed!`, 'success');
                } else if (grid[gridX][gridY].occupied) {
                    showSpaceGameMessage('Cannot deploy here! Shift+Click to upgrade towers', 'error');
                } else {
                    showSpaceGameMessage('Insufficient credits!', 'error');
                }
            }
        }
    }

    function handleMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        mouse.x = (e.clientX - rect.left) * scaleX;
        mouse.y = (e.clientY - rect.top) * scaleY;

        hoveredCell.x = Math.floor(mouse.x / GRID_SIZE);
        hoveredCell.y = Math.floor(mouse.y / GRID_SIZE);

        if (hoveredCell.x < 0 || hoveredCell.x >= GRID_WIDTH ||
            hoveredCell.y < 0 || hoveredCell.y >= GRID_HEIGHT) {
            hoveredCell.x = -1;
            hoveredCell.y = -1;
        }
    }

    // Game control functions
    function startGame() {
        if (!gameStarted) {
            gameStarted = true;
            gameRunning = true;
            initGame();
            startWave();
            gameLoop();
        }
    }

    function restartGame() {
        gameStarted = false;
        gameRunning = false;
        initGame();
        updateUI();
        drawGame();
        showSpaceGameMessage('Launch Defense to protect the space station!', 'info');
    }

    function gameOver() {
        gameRunning = false;
        showSpaceGameMessage(`Station Destroyed! Survived ${wave - 1} waves. ${aliensKilled} aliens destroyed!`, 'error');
        setTimeout(() => {
            showSpaceGameMessage('Click Restart to defend again!', 'info');
        }, 3000);
    }

    function toggleFullscreen() {
        const container = document.querySelector('.game-canvas-container');

        if (!document.fullscreenElement) {
            // Enter fullscreen
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    function updateUI() {
        document.getElementById('spaceCredits').textContent = credits;
        document.getElementById('spaceWave').textContent = wave;
        document.getElementById('spaceShield').textContent = shield;
    }

    // Event listeners
    function setupEventListeners() {
        const startBtn = document.getElementById('startSpaceGameBtn');
        if (startBtn) {
            startBtn.addEventListener('click', startGame);
        }

        const restartBtn = document.getElementById('restartSpaceGameBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', restartGame);
        }

        const fullscreenBtn = document.getElementById('fullscreenSpaceGameBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', toggleFullscreen);
        }

        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('mousemove', handleMouseMove);

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Tower choice selection
            if (showingTowerChoice) {
                if (e.key === '1') {
                    selectSpecialTower('lightning');
                } else if (e.key === '2') {
                    selectSpecialTower('sniper');
                }
                return;
            }

            const num = parseInt(e.key);
            if (num >= 1 && num <= 6) {
                const unlockedKeys = unlockedTowers.filter(key => towerTypes[key]);
                if (num - 1 < unlockedKeys.length) {
                    selectedTowerType = unlockedKeys[num - 1];
                }
            }

            // Upgrade tower with 'E' key
            if ((e.key === 'e' || e.key === 'E') && gameRunning && hoveredCell.x >= 0 && hoveredCell.y >= 0) {
                const tower = grid[hoveredCell.x][hoveredCell.y].tower;
                if (tower) {
                    if (upgradeTower(tower)) {
                        // Tower upgraded successfully
                    } else {
                        showSpaceGameMessage('Insufficient credits for upgrade!', 'error');
                    }
                } else {
                    showSpaceGameMessage('Hover over a tower to upgrade with E key', 'info');
                }
            }

            // Sell tower with 'F' key
            if ((e.key === 'f' || e.key === 'F') && gameRunning && hoveredCell.x >= 0 && hoveredCell.y >= 0) {
                const tower = grid[hoveredCell.x][hoveredCell.y].tower;
                if (tower) {
                    sellTower(tower, hoveredCell.x, hoveredCell.y);
                } else {
                    showSpaceGameMessage('Hover over a tower to sell with F key', 'info');
                }
            }

            // Pause/Resume with spacebar
            if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                if (gameStarted && gameRunning) {
                    gamePaused = !gamePaused;
                    showSpaceGameMessage(gamePaused ? 'System Paused - Press Space' : 'System Active', 'info');
                }
            }

            // Toggle shop with 'H' key (Hide)
            if ((e.key === 'h' || e.key === 'H') && gameRunning) {
                shopVisible = !shopVisible;
                showSpaceGameMessage(shopVisible ? 'Shop Visible' : 'Shop Hidden', 'info');
            }
        });
    }

    // Game loop
    function gameLoop() {
        if (!gameRunning) return;

        if (!gamePaused) {
            gameTime++;
            updateStars();
            updateAliens();
            updateTowers();
            updateProjectiles();
            updateParticles();
        }

        // Always update shop animation even when paused
        updateShopSlide();

        drawGame();
        updateUI();

        // Show wave announcement overlay
        if (showingWaveAnnouncement && gameRunning) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Animated glow effect
            const glowSize = 20 + Math.sin(gameTime * 0.1) * 5;
            const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2 - 50, 0, canvas.width / 2, canvas.height / 2 - 50, glowSize * 10);
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Wave number
            ctx.fillStyle = '#00FFFF';
            ctx.font = 'bold 72px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#00FFFF';
            ctx.shadowBlur = 20;
            ctx.fillText(`WAVE ${wave}`, canvas.width / 2, canvas.height / 2 - 30);
            ctx.shadowBlur = 0;

            // Wave type message
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 28px Arial';
            let waveMessage = 'Get Ready!';
            if (wave % 10 === 0) {
                waveMessage = '⚠️ BOSS WAVE - MOTHERSHIP INCOMING ⚠️';
                ctx.fillStyle = '#FF0000';
            } else if (wave === 1) {
                waveMessage = 'Tutorial Wave - Only Scouts';
            } else if (wave <= 3) {
                waveMessage = 'Scouts & Fighters Incoming';
            } else if (wave <= 6) {
                waveMessage = 'Mixed Forces Approaching';
            } else if (wave <= 9) {
                waveMessage = 'Heavy Units Detected';
            } else {
                waveMessage = 'Full Alien Fleet Incoming!';
            }
            ctx.fillText(waveMessage, canvas.width / 2, canvas.height / 2 + 40);

            // Countdown or instruction
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '20px Arial';
            ctx.fillText('Prepare your defenses...', canvas.width / 2, canvas.height / 2 + 90);

            ctx.textAlign = 'left';
        }

        // Show pause overlay (but not during tower choice)
        if (gamePaused && gameRunning && !showingTowerChoice) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#00FFFF';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('SYSTEM PAUSED', canvas.width / 2, canvas.height / 2);
            ctx.font = 'bold 24px Arial';
            ctx.fillText('Press SPACE to Resume', canvas.width / 2, canvas.height / 2 + 50);
            ctx.textAlign = 'left';
        }

        requestAnimationFrame(gameLoop);
    }

    // Message system
    function showSpaceGameMessage(message, type) {
        const messageDiv = document.getElementById('spaceGameMessage');
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = `game-message ${type}`;
            messageDiv.style.display = 'block';
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 3000);
        }
    }

    // Sound effects
    function initAudio() {
        if (!window.spaceAudioContext) {
            window.spaceAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function playPlasmaSound() {
        if (!window.spaceAudioContext) return;
        const ctx = window.spaceAudioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
    }

    function playLaserSound() {
        if (!window.spaceAudioContext) return;
        const ctx = window.spaceAudioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(2000, ctx.currentTime);
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.08);
    }

    function playMissileSound() {
        if (!window.spaceAudioContext) return;
        const ctx = window.spaceAudioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(600, ctx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.2);
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
    }

    function playFreezeSound() {
        if (!window.spaceAudioContext) return;
        const ctx = window.spaceAudioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(1500, ctx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(500, ctx.currentTime + 0.15);
        oscillator.type = 'triangle';
        gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
    }

    function playExplosionSound() {
        if (!window.spaceAudioContext) return;
        const ctx = window.spaceAudioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(150, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
    }

    function playAlienDeathSound() {
        if (!window.spaceAudioContext) return;
        const ctx = window.spaceAudioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.25);
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.18, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.25);
    }

    function playLightningSound() {
        if (!window.spaceAudioContext) return;
        const ctx = window.spaceAudioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.05);
        oscillator.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.1);
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
    }

    function playRailGunSound() {
        if (!window.spaceAudioContext) return;
        const ctx = window.spaceAudioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(2500, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    }

    function playSellSound() {
        if (!window.spaceAudioContext) return;
        const ctx = window.spaceAudioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
    }

    // Initialize everything
    initAudio();
    setupEventListeners();
    initGame();
    drawGame();
    updateUI();
    showSpaceGameMessage('🚀 Space Defense! Protect the station from alien invasion!', 'info');
});