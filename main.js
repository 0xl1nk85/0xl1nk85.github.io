// =============================================================================
// GLOBAL CONFIGURATION & GAME STATE
// =============================================================================

// --- GAME STATE ---
let score = 0;
let lives = 3;
let level = 1;
let highScore = localStorage.getItem('highScore') || 0;

// --- CENTRALIZED GAME CONSTANTS FOR EASY TUNING ---
const CONSTANTS = {
    TILE_SIZE: 50,
    HUD_OFFSET_Y: 100,
    CHARACTER_DISPLAY_SIZE: 40, 
	ITEM_DISPLAY_SIZE: 25,

    PLAYER: {
        ACCELERATION: 1200,
        MAX_SPEED: 250,
        DRAG: 800
    },
    ENEMIES: {
        BASE_SPEED: 100,
        SPEED_INCREMENT_PER_LEVEL: 20,
        MAX_SPEED: 300,
        GRUMPY_CHARGE_DELAY: 400,
        GRUMPY_CHARGE_MULTIPLIER: 1.6,
    },
    POWERUPS: {
        POWER_MODE_DURATION: 6000,
        SPEED_BOOST_DURATION: 5000,
        SUPER_SNACK_DURATION: 10000,
        SUPER_SNACK_SPEED_MULTIPLIER: 1.25,
    },
    SCORING: {
        DOT: 10,
        DOT_CHAIN_BONUS: 5,
        STEAK: 50,
        GOLD_STEAK: 500,
        ENEMY_DEFEATED: 200,
        LEVEL_COMPLETE_BONUS: 1000,
        DOT_CHAIN_RESET: 2000,
    },
    MAZE: {
        BASE_WIDTH: 15,
        BASE_HEIGHT: 11,
        SIZE_INCREASE_INTERVAL: 5,
        LOOP_CREATION_CHANCE: 0.25,
    }
};

const INITIAL_PLAYER_POS = { 
    x: CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2, 
    y: CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2 + CONSTANTS.HUD_OFFSET_Y 
};

// --- COLOR PALETTE ---
const COLOR_PALETTE = {
    BACKGROUND: #FFFFFF, 
	WALL: 0x4a4a4a, 
	PLAYER: 0x4287f5,
	PLAYER_POWER_MODE: 0xffff00, 
	PLAYER_SPEED_BOOST: 0x00ff00,
    DOT: 0xffffff, 
	STEAK: 0xff0000, 
	GOLD_STEAK: 0xffff00, 
	BONE: 0xcccccc, 
	SPEED_BOOST_ITEM: 0x00ff00,
    SUPER_SNACK_ITEM: 0x00e5ff, 
	ENEMY_DEFAULT_TINT_POWER_MODE: 0x8888ff, 
	TEXT_DEFAULT: 0xffffff, 
	TEXT_HIGHLIGHT: 0x0f0,
    TEXT_WARNING: 0xff0000, 
	TEXT_INFO: 0x00ffff, 
	TEXT_SCORE_ENEMY: 0xffa500, TEXT_MENU_TITLE: 0xffffff,
    TEXT_MENU_BUTTON: 0x0f0, 
	TEXT_MENU_BUTTON_BACK: 0xff0, 
	TEXT_GAME_OVER_TITLE: 0xffffff, 
	TEXT_WIN_TITLE: 0xffffff,
};

// Telegram Haptic Feedback Placeholder
function triggerHapticFeedback(type = 'light') { /* Unchanged */ }

// =============================================================================
// MAZE GENERATOR (OPTIMIZED FOR LOOPS)
// =============================================================================
function generateMaze(width, height) {
    let maze = Array.from({ length: height }, () => Array.from({ length: width }, () => '#'));
    function carve(x, y) {
        const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]].sort(() => Math.random() - 0.5);
        for (let [dx, dy] of dirs) {
            let nx = x + dx, ny = y + dy;
            if (ny > 0 && ny < height - 1 && nx > 0 && nx < width - 1 && maze[ny][nx] === '#') {
                maze[ny - dy / 2][nx - dx / 2] = '.'; maze[ny][nx] = '.'; carve(nx, ny);
            }
        }
    }
    maze[1][1] = '.'; carve(1, 1);
    for (let i = 0; i < (width * height) * CONSTANTS.MAZE.LOOP_CREATION_CHANCE; i++) {
        let x = Phaser.Math.Between(1, width - 2);
        let y = Phaser.Math.Between(1, height - 2);
        if (maze[y][x] === '#') {
            let openNeighbors = 0;
            if (maze[y - 1][x] === '.') openNeighbors++; if (maze[y + 1][x] === '.') openNeighbors++;
            if (maze[y][x - 1] === '.') openNeighbors++; if (maze[y][x + 1] === '.') openNeighbors++;
            if (openNeighbors >= 2) maze[y][x] = '.';
        }
    }
    return maze;
}

// =============================================================================
// SCENES
// =============================================================================

class Preloader extends Phaser.Scene {
    constructor() { super('Preloader'); }
    preload() {
        this.cameras.main.setBackgroundColor(COLOR_PALETTE.BACKGROUND);
        const onAssetLoadError = (fileObj) => console.warn(`Asset failed to load: ${fileObj.key}. Using fallback.`);
        this.load.image('xiaobai', 'assets/xiaobai_sprite.png').on('loaderror', onAssetLoadError);
        this.load.image('wall', 'assets/wall_texture.png').on('loaderror', onAssetLoadError);
        this.load.image('doge_sprite', 'assets/doge_sprite.png').on('loaderror', onAssetLoadError);
        this.load.image('cheems_sprite', 'assets/cheems_sprite.png').on('loaderror', onAssetLoadError);
        this.load.image('pepe_sprite', 'assets/pepe_sprite.png').on('loaderror', onAssetLoadError);
        this.load.image('grumpy_sprite', 'assets/grumpy_sprite.png').on('loaderror', onAssetLoadError);
		
		this.load.image('dot_asset', 'assets/dot.png').on('loaderror', onAssetLoadError);
        this.load.image('steak_asset', 'assets/steak.png').on('loaderror', onAssetLoadError);
        this.load.image('bone_asset', 'assets/bone.png').on('loaderror', onAssetLoadError);
        this.load.image('speed_boost_asset', 'assets/speed_boost.png').on('loaderror', onAssetLoadError);
        this.load.image('gold_steak_asset', 'assets/gold_steak.png').on('loaderror', onAssetLoadError);
        this.load.image('super_snack_asset', 'assets/super_snack.png').on('loaderror', onAssetLoadError);
    }
    create() { this.scene.start('MainMenu'); }
}

class MainMenu extends Phaser.Scene {
    constructor() { super('MainMenu'); }
    create() {
        this.cameras.main.setBackgroundColor(COLOR_PALETTE.BACKGROUND);
        let centerX = this.cameras.main.centerX;
        this.add.text(centerX, 150, "🐶 XIAOBAI MAZE RUN 🐶", { fontSize: '40px', fill: '#' + COLOR_PALETTE.TEXT_MENU_TITLE.toString(16) }).setOrigin(0.5);
        if (this.textures.exists('xiaobai')) this.add.image(centerX + 150, 150, 'xiaobai').setScale(0.5).setAngle(10);
        let startBtn = this.add.text(centerX, 300, "Start Game", { fontSize: '32px', fill: '#' + COLOR_PALETTE.TEXT_MENU_BUTTON.toString(16) }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        let howBtn = this.add.text(centerX, 400, "How to Play", { fontSize: '32px', fill: '#' + COLOR_PALETTE.TEXT_MENU_BUTTON.toString(16) }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.add.text(centerX, 500, `High Score: ${highScore}`, { fontSize: '24px', fill: '#' + COLOR_PALETTE.TEXT_DEFAULT.toString(16) }).setOrigin(0.5);
        startBtn.on('pointerdown', () => { triggerHapticFeedback('light'); this.scene.start('GameScene'); });
        howBtn.on('pointerdown', () => { triggerHapticFeedback('light'); this.scene.start('HowToPlay'); });
    }
}

class HowToPlay extends Phaser.Scene {
    constructor() { super('HowToPlay'); }
    create() {
        this.cameras.main.setBackgroundColor(COLOR_PALETTE.BACKGROUND);
        let centerX = this.cameras.main.centerX;
        this.add.text(centerX, 100, "📜 HOW TO PLAY", { fontSize: '32px', fill: '#' + COLOR_PALETTE.TEXT_DEFAULT.toString(16) }).setOrigin(0.5);
        this.add.text(centerX, 270, `Controls:\nUse WASD or Arrow Keys to move.\n\nCollectibles:\n🎯 Dots = +${CONSTANTS.SCORING.DOT}\n🍖 Steak = Power Mode\n🦴 Bone = Extra Life\n⚡ Speed Boost = Go Faster\n💎 Gold Steak = +${CONSTANTS.SCORING.GOLD_STEAK}\n\nSuper Power-Up:\n✨ Super Snack = Eat enemies AND go faster!`, { fontSize: '20px', fill: '#' + COLOR_PALETTE.TEXT_DEFAULT.toString(16), align: 'center', lineHeight: '1.5' }).setOrigin(0.5);
        let backText = this.add.text(centerX, 550, "⬅️ Back to Menu", { fontSize: '24px', fill: '#' + COLOR_PALETTE.TEXT_MENU_BUTTON_BACK.toString(16) }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        backText.on('pointerdown', () => { triggerHapticFeedback('light'); this.scene.start('MainMenu'); });
    }
}

class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }
    create() {
        score = 0; lives = 3; level = 1;
        highScore = localStorage.getItem('highScore') || 0;
        this.scene.start('PlayLevel', { level: 1 });
    }
}

class PlayLevel extends Phaser.Scene {
    constructor() { super('PlayLevel'); }

    create(data) {
        this.level = data.level || 1;
        this.enemySpeed = Math.min(CONSTANTS.ENEMIES.BASE_SPEED + (this.level - 1) * CONSTANTS.ENEMIES.SPEED_INCREMENT_PER_LEVEL, CONSTANTS.ENEMIES.MAX_SPEED);
        this.powerMode = false; this.superSnackActive = false; this.speedBoostActive = false;
        this.comboMultiplier = 1; this.dotChain = 0; this.chainTimer = null;
        let mazeMultiplier = Math.floor((this.level - 1) / CONSTANTS.MAZE.SIZE_INCREASE_INTERVAL);
        let mazeWidth = CONSTANTS.MAZE.BASE_WIDTH + mazeMultiplier * 2;
        let mazeHeight = CONSTANTS.MAZE.BASE_HEIGHT + mazeMultiplier * 2;
        this.maze = generateMaze(mazeWidth, mazeHeight);

        let gameWidth = mazeWidth * CONSTANTS.TILE_SIZE;
        let gameHeight = mazeHeight * CONSTANTS.TILE_SIZE + CONSTANTS.HUD_OFFSET_Y;
        this.scale.resize(gameWidth, gameHeight);
        this.cameras.main.setBounds(0, 0, gameWidth, gameHeight);
        this.physics.world.setBounds(0, 0, gameWidth, gameHeight);

        this.dots = this.physics.add.group();
        this.walls = this.physics.add.staticGroup();
        this.enemies = this.physics.add.group();
        this.steaks = this.physics.add.group();
        this.specials = this.physics.add.group();

for (let row = 0; row < this.maze.length; row++) {
    for (let col = 0; col < this.maze[row].length; col++) {
        let x = col * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2;
        let y = row * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2 + CONSTANTS.HUD_OFFSET_Y;
        
        // This 'if' block creates the visual wall objects
        if (this.maze[row][col] === '#') {
            let wall = this.textures.exists('wall') 
                ? this.add.image(x, y, 'wall').setDisplaySize(CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE) 
                : this.add.rectangle(x, y, CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE, COLOR_PALETTE.WALL);
            
            this.physics.add.existing(wall, true);
            this.walls.add(wall);

        // This 'else if' block creates the items in the empty spaces
        } else if (this.maze[row][col] === '.') {
            let rand = Math.random();

            if (rand < 0.015) { // SUPER SNACK
                this.createItem(x, y, 'super_snack', 'super_snack_asset', 15, COLOR_PALETTE.SUPER_SNACK_ITEM, this.specials);
            } else if (rand < 0.04) { // STEAK
                this.createItem(x, y, null, 'steak_asset', 15, COLOR_PALETTE.STEAK, this.steaks);
            } else if (rand < 0.055) { // BONE
                this.createItem(x, y, 'bone', 'bone_asset', 15, COLOR_PALETTE.BONE, this.specials);
            } else if (rand < 0.07) { // GOLD STEAK
                this.createItem(x, y, 'goldsteak', 'gold_steak_asset', 15, COLOR_PALETTE.GOLD_STEAK, this.specials);
            } else if (rand < 0.085) { // SPEED BOOST
                this.createItem(x, y, 'speed', 'speed_boost_asset', 15, COLOR_PALETTE.SPEED_BOOST_ITEM, this.specials);
            } else { // DOT
                this.createItem(x, y, null, 'dot_asset', 7.5, COLOR_PALETTE.DOT, this.dots);
            }
        }
    }
}
        
        this.player = this.textures.exists('xiaobai') ? this.physics.add.sprite(INITIAL_PLAYER_POS.x, INITIAL_PLAYER_POS.y, 'xiaobai') : this.physics.add.existing(this.add.circle(INITIAL_PLAYER_POS.x, INITIAL_PLAYER_POS.y, CONSTANTS.CHARACTER_DISPLAY_SIZE / 2, COLOR_PALETTE.PLAYER));
        this.player.setScale(CONSTANTS.CHARACTER_DISPLAY_SIZE / this.player.width);
        this.player.body.updateFromGameObject();
        this.player.body.setCollideWorldBounds(true).setDrag(CONSTANTS.PLAYER.DRAG).setMaxVelocity(CONSTANTS.PLAYER.MAX_SPEED);
        this.player.setDepth(1);

        const enemyConfig = { 'doge': { sprite: 'doge_sprite', color: COLOR_PALETTE.ENEMY_DOGE }, 'cheems': { sprite: 'cheems_sprite', color: COLOR_PALETTE.ENEMY_CHEEMS }, 'pepe': { sprite: 'pepe_sprite', color: COLOR_PALETTE.ENEMY_PEPE }, 'grumpy': { sprite: 'grumpy_sprite', color: COLOR_PALETTE.ENEMY_GRUMPY } };
        const enemyNames = Object.keys(enemyConfig);
        const enemyStartPositions = [{ x: gameWidth - CONSTANTS.TILE_SIZE * 1.5, y: CONSTANTS.HUD_OFFSET_Y + CONSTANTS.TILE_SIZE * 1.5 }, { x: CONSTANTS.TILE_SIZE * 1.5, y: gameHeight - CONSTANTS.TILE_SIZE * 1.5 }, { x: gameWidth - CONSTANTS.TILE_SIZE * 1.5, y: gameHeight - CONSTANTS.TILE_SIZE * 1.5 }, { x: gameWidth / 2, y: gameHeight / 2 + CONSTANTS.HUD_OFFSET_Y / 2 }];
        let enemyCount = 4 + Math.floor(this.level / CONSTANTS.MAZE.SIZE_INCREASE_INTERVAL);
        for (let i = 0; i < enemyCount; i++) {
            let enemyType = enemyNames[i % enemyNames.length]; let typeConfig = enemyConfig[enemyType]; let pos = enemyStartPositions[i % enemyStartPositions.length];
            let enemyEntity = this.textures.exists(typeConfig.sprite) ? this.physics.add.sprite(pos.x, pos.y, typeConfig.sprite) : this.physics.add.existing(this.add.circle(pos.x, pos.y, CONSTANTS.CHARACTER_DISPLAY_SIZE / 2, typeConfig.color));
            enemyEntity.setScale(CONSTANTS.CHARACTER_DISPLAY_SIZE / enemyEntity.width);
            enemyEntity.body.updateFromGameObject();
            enemyEntity.body.setCollideWorldBounds(true);
            enemyEntity.type = enemyType; enemyEntity.originalColor = typeConfig.color;
            this.enemies.add(enemyEntity);
        }

        this.scoreText = this.add.text(16, 16, '', { fontSize: '20px', fill: '#' + COLOR_PALETTE.TEXT_DEFAULT.toString(16) }).setScrollFactor(0);
        this.livesText = this.add.text(gameWidth / 2, 16, '', { fontSize: '20px', fill: '#' + COLOR_PALETTE.TEXT_DEFAULT.toString(16) }).setOrigin(0.5, 0).setScrollFactor(0);
        this.levelText = this.add.text(gameWidth - 16, 16, '', { fontSize: '20px', fill: '#' + COLOR_PALETTE.TEXT_DEFAULT.toString(16) }).setOrigin(1, 0).setScrollFactor(0);
        this.updateHUD();
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.overlap(this.player, this.dots, this.eatDot, null, this);
        this.physics.add.overlap(this.player, this.steaks, this.eatSteak, null, this);
        this.physics.add.overlap(this.player, this.specials, this.eatSpecial, null, this);
        this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);
        this.aiTimer = this.time.addEvent({ delay: 500, loop: true, callback: this.enemyAI, callbackScope: this });
        this.displayMessage(`Level ${this.level}`, COLOR_PALETTE.TEXT_HIGHLIGHT);
    }

createItem(x, y, itemType, assetKey, fallbackRadius, fallbackColor, group) {
        let item;
        // Check if your image asset was successfully loaded
        if (this.textures.exists(assetKey)) {
            item = this.physics.add.sprite(x, y, assetKey);
            // Scale the image to a consistent size
            item.setScale(CONSTANTS.ITEM_DISPLAY_SIZE / item.width);
            // Sync the physics body to the scaled sprite size
            item.body.updateFromGameObject();
            // Use a circular physics body for smoother collection
            item.body.setCircle(item.displayWidth / 2);
        } else {
            // Fallback to a colored circle if the asset is missing
            item = this.add.circle(x, y, fallbackRadius, fallbackColor);
            this.physics.add.existing(item);
            item.body.setCircle(fallbackRadius);
        }
        // Assign its type for the collection logic
        if (itemType) {
            item.itemType = itemType;
        }
        // Add it to the correct physics group
        group.add(item);
    }


    update() {
        if (!this.player || !this.player.body) return;
        const accel = new Phaser.Math.Vector2(0, 0);
        if (this.cursors.left.isDown || this.wasd.A.isDown) accel.x = -CONSTANTS.PLAYER.ACCELERATION;
        else if (this.cursors.right.isDown || this.wasd.D.isDown) accel.x = CONSTANTS.PLAYER.ACCELERATION;
        if (this.cursors.up.isDown || this.wasd.W.isDown) accel.y = -CONSTANTS.PLAYER.ACCELERATION;
        else if (this.cursors.down.isDown || this.wasd.S.isDown) accel.y = CONSTANTS.PLAYER.ACCELERATION;
        if (accel.length() > 0) accel.normalize().scale(CONSTANTS.PLAYER.ACCELERATION);
        this.player.body.setAcceleration(accel.x, accel.y);
        
        if (this.dots.countActive(true) === 0 && this.steaks.countActive(true) === 0 && this.specials.countActive(true) === 0) {
            score += CONSTANTS.SCORING.LEVEL_COMPLETE_BONUS; triggerHapticFeedback('success');
            if (this.level >= 10) this.scene.start('WinScene');
            else this.displayMessage(`Level ${this.level} Complete!`, COLOR_PALETTE.TEXT_INFO, () => this.scene.start('PlayLevel', { level: this.level + 1 }));
        }
    }
    
    updateEnemyVisuals(isVulnerable) {
        const vulnerableColor = COLOR_PALETTE.ENEMY_DEFAULT_TINT_POWER_MODE;
        this.enemies.children.iterate(e => {
            if (!e.active) return;
            if (e.hasOwnProperty('tint')) {
                if (isVulnerable) e.setTint(vulnerableColor);
                else e.clearTint();
            } else if (e.hasOwnProperty('fillColor')) {
                if (isVulnerable) e.fillColor = vulnerableColor;
                else e.fillColor = e.originalColor;
            }
        });
    }

    eatDot(player, dot) {
        dot.destroy(); triggerHapticFeedback('light'); this.dotChain++;
        score += CONSTANTS.SCORING.DOT + (this.dotChain > 1 ? CONSTANTS.SCORING.DOT_CHAIN_BONUS * (this.dotChain - 1) : 0);
        this.updateHUD(); this.showScorePopup(dot.x, dot.y, `+${CONSTANTS.SCORING.DOT}`);
        if (this.chainTimer) this.chainTimer.destroy();
        this.chainTimer = this.time.delayedCall(CONSTANTS.SCORING.DOT_CHAIN_RESET, () => this.dotChain = 0);
    }

    eatSteak(player, steak) {
        steak.destroy(); triggerHapticFeedback('medium'); score += CONSTANTS.SCORING.STEAK;
        this.showScorePopup(steak.x, steak.y, `+${CONSTANTS.SCORING.STEAK}`);
        this.powerMode = true; this.comboMultiplier = 1;
        this.updatePlayerTint();
        this.updateEnemyVisuals(true);
        this.time.delayedCall(CONSTANTS.POWERUPS.POWER_MODE_DURATION, () => {
            this.powerMode = false; 
            this.updatePlayerTint();
            this.updateEnemyVisuals(false);
        });
        this.updateHUD();
    }

    eatSpecial(player, item) {
        const key = item.itemType; item.destroy(); triggerHapticFeedback('medium');
        if (key === 'bone') { lives++; this.displayMessage('Extra Life!', COLOR_PALETTE.BONE); }
        else if (key === 'goldsteak') { score += CONSTANTS.SCORING.GOLD_STEAK; this.showScorePopup(item.x, item.y, `+${CONSTANTS.SCORING.GOLD_STEAK}`, COLOR_PALETTE.GOLD_STEAK); this.displayMessage('Gold Steak!', COLOR_PALETTE.GOLD_STEAK); }
        else if (key === 'speed') {
            this.speedBoostActive = true;
            this.player.body.setMaxVelocity(CONSTANTS.PLAYER.MAX_SPEED * 1.5);
            this.displayMessage('Speed Boost!', COLOR_PALETTE.SPEED_BOOST_ITEM);
            this.updatePlayerTint();
            this.time.delayedCall(CONSTANTS.POWERUPS.SPEED_BOOST_DURATION, () => { 
                this.speedBoostActive = false;
                if (!this.superSnackActive) this.player.body.setMaxVelocity(CONSTANTS.PLAYER.MAX_SPEED);
                this.updatePlayerTint();
            });
        }
        else if (key === 'super_snack') {
            this.superSnackActive = true; this.powerMode = true; this.comboMultiplier = 1;
            this.player.body.setMaxVelocity(CONSTANTS.PLAYER.MAX_SPEED * CONSTANTS.POWERUPS.SUPER_SNACK_SPEED_MULTIPLIER);
            this.displayMessage('SUPER SNACK!', COLOR_PALETTE.SUPER_SNACK_ITEM);
            this.updatePlayerTint();
            this.updateEnemyVisuals(true);
            this.tweens.add({ targets: this.player, alpha: 0.5, duration: 200, yoyo: true, repeat: CONSTANTS.POWERUPS.SUPER_SNACK_DURATION / 400 });
            this.time.delayedCall(CONSTANTS.POWERUPS.SUPER_SNACK_DURATION, () => { 
                this.superSnackActive = false; this.powerMode = false;
                if (!this.speedBoostActive) this.player.body.setMaxVelocity(CONSTANTS.PLAYER.MAX_SPEED);
                this.updatePlayerTint();
                this.updateEnemyVisuals(false);
            });
        }
        this.updateHUD();
    }
    
    updatePlayerTint() {
        const useTint = this.player.hasOwnProperty('tint');
        if (useTint) this.player.clearTint();
        else this.player.fillColor = COLOR_PALETTE.PLAYER;
        if (this.superSnackActive) {} 
        if (this.powerMode) {
             if(useTint) this.player.setTint(COLOR_PALETTE.PLAYER_POWER_MODE);
             else this.player.fillColor = COLOR_PALETTE.PLAYER_POWER_MODE;
        } else if (this.speedBoostActive) {
            if(useTint) this.player.setTint(COLOR_PALETTE.PLAYER_SPEED_BOOST);
            else this.player.fillColor = COLOR_PALETTE.PLAYER_SPEED_BOOST;
        }
    }

    hitEnemy(player, enemy) {
        if (this.powerMode) {
            triggerHapticFeedback('heavy'); enemy.disableBody(true, true);
            score += CONSTANTS.SCORING.ENEMY_DEFEATED * this.comboMultiplier;
            this.showScorePopup(enemy.x, enemy.y, `+${CONSTANTS.SCORING.ENEMY_DEFEATED * this.comboMultiplier}`, COLOR_PALETTE.TEXT_SCORE_ENEMY);
            this.comboMultiplier *= 2;
            this.time.delayedCall(CONSTANTS.POWERUPS.POWER_MODE_DURATION * 1.5, () => {
                if (!enemy.active) {
                    let newX, newY, validPosition = false;
                    while (!validPosition) {
                        let randCol = Phaser.Math.Between(1, this.maze[0].length-2); let randRow = Phaser.Math.Between(1, this.maze.length-2);
                        if (this.maze[randRow][randCol] === '.') {
                            newX = randCol*CONSTANTS.TILE_SIZE+CONSTANTS.TILE_SIZE/2; newY = randRow*CONSTANTS.TILE_SIZE+CONSTANTS.TILE_SIZE/2+CONSTANTS.HUD_OFFSET_Y;
                            if (this.player && this.player.body && Phaser.Math.Distance.Between(newX, newY, this.player.x, this.player.y) > CONSTANTS.TILE_SIZE * 5) validPosition = true;
                            else if (!this.player || !this.player.body) validPosition = true;
                        }
                    }
                    enemy.enableBody(true, newX, newY, true, true); 
                    this.updateSingleEnemyVisual(enemy, 'normal');
                }
            });
        } else {
            triggerHapticFeedback('error'); lives--;
            if (lives <= 0) { this.scene.start('GameOver'); return; }
            this.displayMessage('Ouch! -1 Life', COLOR_PALETTE.TEXT_WARNING); 
            player.setPosition(INITIAL_PLAYER_POS.x, INITIAL_PLAYER_POS.y);
            if (player.body) player.body.setVelocity(0, 0); 
            player.setAlpha(0.5); 
            this.time.delayedCall(1500, () => player.setAlpha(1)); 
        }
        this.updateHUD();
    }

    updateHUD() {
        this.scoreText.setText('Score: ' + score);
        this.livesText.setText('Lives: ' + '❤️'.repeat(lives > 0 ? lives : 0));
        this.levelText.setText('Level: ' + this.level);
        if (score > highScore) { highScore = score; localStorage.setItem('highScore', highScore); }
    }

    enemyAI() {
        if (!this.player || !this.player.body) return;
        this.enemies.children.iterate(enemy => {
            if (!enemy.active || !enemy.body) return;
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            if (this.powerMode) {
                const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                this.physics.velocityFromRotation(angle, this.enemySpeed, enemy.body.velocity);
                return;
            }
            switch (enemy.type) {
                case 'doge':
                    if (!enemy.nextMoveTime || this.time.now > enemy.nextMoveTime) {
                        if (enemy.body.velocity.length() > 0) {
                            enemy.body.setVelocity(0, 0);
                            enemy.nextMoveTime = this.time.now + Phaser.Math.Between(500, 2000);
                        } else {
                            const randomAngle = Phaser.Math.FloatBetween(0, 2 * Math.PI);
                            this.physics.velocityFromRotation(randomAngle, this.enemySpeed * 0.75, enemy.body.velocity);
                            enemy.nextMoveTime = this.time.now + Phaser.Math.Between(1000, 3000);
                        }
                    }
                    break;
                case 'cheems':
                    if (enemy.body.blocked.none === false) {
                        if ((enemy.body.blocked.left || enemy.body.blocked.right) && Math.abs(dy) > CONSTANTS.TILE_SIZE / 2) {
                            enemy.body.setVelocityY(this.enemySpeed * Math.sign(dy));
                        } else if ((enemy.body.blocked.up || enemy.body.blocked.down) && Math.abs(dx) > CONSTANTS.TILE_SIZE / 2) {
                            enemy.body.setVelocityX(this.enemySpeed * Math.sign(dx));
                        }
                    } else {
                       this.physics.moveToObject(enemy, this.player, this.enemySpeed);
                    }
                    break;
                case 'pepe':
                    const predictionTime = Math.min(0.4 + (this.level * 0.05), 1.2);
                    const futurePos = { x: this.player.x + this.player.body.velocity.x * predictionTime, y: this.player.y + this.player.body.velocity.y * predictionTime };
                    this.physics.moveToObject(enemy, futurePos, this.enemySpeed);
                    break;
                case 'grumpy':
                    const activationRange = CONSTANTS.TILE_SIZE * (5 + Math.floor(this.level / 5));
                    if (distance < activationRange && !enemy.isCharging) {
                         enemy.isCharging = true;
                         enemy.body.setVelocity(0, 0);
                         this.updateSingleEnemyVisual(enemy, 'warning');
                         this.time.delayedCall(CONSTANTS.ENEMIES.GRUMPY_CHARGE_DELAY, () => {
                              if(enemy.active && this.player && this.player.body) {
                                   this.updateSingleEnemyVisual(enemy, 'normal');
                                   this.physics.moveToObject(enemy, this.player, this.enemySpeed * CONSTANTS.ENEMIES.GRUMPY_CHARGE_MULTIPLIER);
                              }
                         });
                    } else if (distance >= activationRange * 1.2) {
                         enemy.isCharging = false;
                         enemy.body.setVelocity(0, 0);
                    }
                    break;
            }
        });
    }

    displayMessage(text, color, callback) {
        let messageText=this.add.text(this.cameras.main.centerX,this.cameras.main.centerY,text,{fontSize:'36px',fill:'#'+color.toString(16),align:'center',backgroundColor:'#00000088',padding:{x:20,y:10}}).setOrigin(0.5).setScrollFactor(0).setDepth(100);this.tweens.add({targets:messageText,alpha:0,y:messageText.y-50,ease:'Power1',duration:1500,onComplete:()=>{messageText.destroy();if(callback)callback();}});
    }

    showScorePopup(x, y, text, color) {
        let scorePopup=this.add.text(x,y,text,{fontSize:'18px',fill:'#'+(color||0xffffff).toString(16),stroke:'#000000',strokeThickness:2}).setOrigin(0.5).setDepth(50);this.tweens.add({targets:scorePopup,y:y-30,alpha:0,duration:700,ease:'Sine.easeOut',onComplete:()=>scorePopup.destroy()});
    }

    updateSingleEnemyVisual(enemy, state) {
        if (!enemy.active) return;
        if (enemy.hasOwnProperty('tint')) {
             enemy.clearTint();
             if(state === 'vulnerable') enemy.setTint(COLOR_PALETTE.ENEMY_DEFAULT_TINT_POWER_MODE);
             else if(state === 'warning') enemy.setTint(COLOR_PALETTE.TEXT_WARNING);
        } else if (enemy.hasOwnProperty('fillColor')) {
             if(state === 'vulnerable') enemy.fillColor = COLOR_PALETTE.ENEMY_DEFAULT_TINT_POWER_MODE;
             else if(state === 'warning') enemy.fillColor = COLOR_PALETTE.TEXT_WARNING;
             else enemy.fillColor = enemy.originalColor;
        }
    }
}

class EndScene extends Phaser.Scene {
    constructor(config, title, titleColor) { super(config); this.title = title; this.titleColor = titleColor; }
    create() {
        this.cameras.main.setBackgroundColor(COLOR_PALETTE.BACKGROUND); let centerX = this.cameras.main.centerX; let centerY = this.cameras.main.centerY;
        this.add.text(centerX, centerY - 150, this.title, { fontSize: '40px', fill: '#' + this.titleColor.toString(16) }).setOrigin(0.5);
        this.add.text(centerX, centerY - 50, "Final Score: " + score, { fontSize: '28px', fill: '#' + COLOR_PALETTE.TEXT_MENU_BUTTON_BACK.toString(16) }).setOrigin(0.5);
        this.add.text(centerX, centerY, "High Score: " + highScore, { fontSize: '28px', fill: '#' + COLOR_PALETTE.TEXT_MENU_BUTTON_BACK.toString(16) }).setOrigin(0.5);
        let backText = this.add.text(centerX, centerY + 150, "🔁 Restart", { fontSize: '28px', fill: '#' + COLOR_PALETTE.TEXT_MENU_BUTTON.toString(16) }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        backText.on('pointerdown', () => { triggerHapticFeedback('light'); this.scene.start('MainMenu'); });
    }
}
class GameOver extends EndScene { constructor() { super('GameOver', '💀 GAME OVER 💀', COLOR_PALETTE.TEXT_GAME_OVER_TITLE); } }
class WinScene extends EndScene { constructor() { super('WinScene', '🏆 YOU WIN! 🏆', COLOR_PALETTE.TEXT_WIN_TITLE); } }

// Phaser Game Configuration
const config = {
    type: Phaser.AUTO,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 800, height: 650 },
    physics: { 
        default: 'arcade', 
        arcade: { 
            debug: true // Set to 'false' for release.
        } 
    },
    scene: [Preloader, MainMenu, HowToPlay, GameScene, PlayLevel, GameOver, WinScene]
};


new Phaser.Game(config);
