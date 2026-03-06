import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config';
import { Player } from '../entities/Player';
import { Enemy, EnemyConfig } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { Collectible, CollectibleType } from '../entities/Collectible';
import { Projectile } from '../entities/Projectile';
import { InputManager } from '../utils/InputManager';
import { CombatSystem } from '../systems/CombatSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { CheckpointSystem } from '../systems/CheckpointSystem';
import { PowerUpSystem } from '../systems/PowerUpSystem';
import { LevelManager, LevelDef, LEVELS } from '../levels/LevelManager';
import { ParticleSystem } from '../systems/ParticleSystem';
import { telegram } from '../utils/TelegramBridge';
import { LeRauxe } from '../entities/bosses/LeRauxe';
import { Katherine } from '../entities/bosses/Katherine';
import { Wolvington } from '../entities/bosses/Wolvington';
import { Gabriel } from '../entities/bosses/Gabriel';
import { Marrow } from '../entities/bosses/Marrow';
import { Aquatis } from '../entities/bosses/Aquatis';
import { Omar } from '../entities/bosses/Omar';

interface LevelData {
  width: number;
  height: number;
  platforms: { x: number; y: number; w: number; tileId: number }[];
  enemies: { x: number; y: number; type: string }[];
  collectibles: { x: number; y: number; type: CollectibleType; frame: number }[];
  checkpoints: { x: number; y: number; id: string }[];
  spawnX: number;
  spawnY: number;
  exitX: number;
  exitY: number;
  hazards: { x: number; y: number; w: number }[];
  decorations: { x: number; y: number; tileId: number }[];
}

const ENEMY_CONFIGS: Record<string, EnemyConfig> = {
  officer: { key: 'officer', health: 30, speed: 50, damage: 10, scoreValue: 200, patrolDistance: 80, chaseRange: 150, attackRange: 30, attackCooldown: 1200 },
  soldier: { key: 'soldier', health: 25, speed: 40, damage: 15, scoreValue: 300, patrolDistance: 60, chaseRange: 200, attackRange: 150, attackCooldown: 2000, ranged: true },
  rat: { key: 'rat', health: 10, speed: 70, damage: 5, scoreValue: 50, patrolDistance: 50, chaseRange: 100, attackRange: 20, attackCooldown: 800 },
  cutthroat: { key: 'cutthroat', health: 40, speed: 55, damage: 15, scoreValue: 350, patrolDistance: 90, chaseRange: 160, attackRange: 35, attackCooldown: 1000 },
  robber_thief: { key: 'robber_thief', health: 25, speed: 80, damage: 10, scoreValue: 250, patrolDistance: 100, chaseRange: 180, attackRange: 25, attackCooldown: 900 },
  town_guard: { key: 'town_guard', health: 50, speed: 40, damage: 15, scoreValue: 400, patrolDistance: 70, chaseRange: 170, attackRange: 40, attackCooldown: 1500 },
  seagull: { key: 'seagull', health: 15, speed: 90, damage: 8, scoreValue: 150, patrolDistance: 120, chaseRange: 200, attackRange: 30, attackCooldown: 1000 },
  guard_dog: { key: 'guard_dog', health: 35, speed: 100, damage: 12, scoreValue: 300, patrolDistance: 80, chaseRange: 200, attackRange: 25, attackCooldown: 700 },
  bear_sailor: { key: 'bear_sailor', health: 60, speed: 35, damage: 20, scoreValue: 500, patrolDistance: 60, chaseRange: 140, attackRange: 40, attackCooldown: 1800 },
  red_tail_pirate: { key: 'red_tail_pirate', health: 45, speed: 50, damage: 15, scoreValue: 400, patrolDistance: 80, chaseRange: 160, attackRange: 35, attackCooldown: 1200, ranged: true },
  crab: { key: 'crab', health: 20, speed: 30, damage: 10, scoreValue: 100, patrolDistance: 40, chaseRange: 80, attackRange: 20, attackCooldown: 600 },
  peg_leg: { key: 'peg_leg', health: 50, speed: 45, damage: 18, scoreValue: 450, patrolDistance: 70, chaseRange: 150, attackRange: 35, attackCooldown: 1400 },
  crazy_hook: { key: 'crazy_hook', health: 55, speed: 60, damage: 20, scoreValue: 500, patrolDistance: 90, chaseRange: 180, attackRange: 30, attackCooldown: 1000 },
  mercat: { key: 'mercat', health: 40, speed: 65, damage: 15, scoreValue: 400, patrolDistance: 100, chaseRange: 170, attackRange: 35, attackCooldown: 1100 },
  siren: { key: 'siren', health: 35, speed: 50, damage: 25, scoreValue: 600, patrolDistance: 80, chaseRange: 200, attackRange: 150, attackCooldown: 2500, ranged: true },
  tiger_guard: { key: 'tiger_guard', health: 70, speed: 55, damage: 25, scoreValue: 700, patrolDistance: 80, chaseRange: 180, attackRange: 40, attackCooldown: 1200 },
};

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private inputManager!: InputManager;
  private combatSystem!: CombatSystem;
  private weaponSystem!: WeaponSystem;
  private checkpointSystem!: CheckpointSystem;
  private powerUpSystem!: PowerUpSystem;
  private levelManager!: LevelManager;
  private enemies!: Phaser.Physics.Arcade.Group;
  private collectibles!: Phaser.Physics.Arcade.Group;
  private playerProjectiles!: Phaser.Physics.Arcade.Group;
  private enemyProjectiles!: Phaser.Physics.Arcade.Group;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private hazards!: Phaser.Physics.Arcade.StaticGroup;
  private currentLevelDef!: LevelDef;
  private levelComplete = false;
  private respawnTimer = 0;
  private bgParallax: Phaser.GameObjects.TileSprite[] = [];
  private boss: Boss | null = null;
  private bossSpawned = false;
  private currentLevelData!: LevelData;
  private particleSystem!: ParticleSystem;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { levelId?: number }): void {
    this.levelManager = new LevelManager();
    if (data.levelId != null && data.levelId > 0) {
      this.levelManager.setLevel(data.levelId);
    }
    this.currentLevelDef = this.levelManager.getCurrentLevel();
    this.levelComplete = false;
    this.respawnTimer = 0;
    this.boss = null;
    this.bossSpawned = false;
    this.bossHitThisSwing = false;
    this.wasPlayerAttacking = false;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(this.currentLevelDef.bgColor);

    this.platforms = this.physics.add.staticGroup();
    this.hazards = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group({ runChildUpdate: false });
    this.collectibles = this.physics.add.group({ allowGravity: false, immovable: true });
    this.playerProjectiles = this.physics.add.group({ runChildUpdate: true });
    this.enemyProjectiles = this.physics.add.group({ runChildUpdate: true });

    const levelData = this.generateLevel(this.currentLevelDef);
    this.currentLevelData = levelData;

    this.createParallaxBg();

    this.buildLevel(levelData);

    this.player = new Player(this, levelData.spawnX, levelData.spawnY);
    this.physics.add.collider(this.player, this.platforms);

    this.checkpointSystem = new CheckpointSystem();
    this.checkpointSystem.addCheckpoint(levelData.spawnX, levelData.spawnY, 'start');
    const hs = TILE_SIZE / 2;
    for (const cp of levelData.checkpoints) {
      this.checkpointSystem.addCheckpoint(cp.x + hs, cp.y + hs, cp.id);
    }

    this.weaponSystem = new WeaponSystem(this.player);
    this.powerUpSystem = new PowerUpSystem(this.player);
    this.combatSystem = new CombatSystem(
      this, this.player, this.enemies, this.playerProjectiles, this.enemyProjectiles
    );

    this.inputManager = new InputManager(this);
    this.inputManager.create();

    this.particleSystem = new ParticleSystem(this);

    this.setupCollisions(levelData);
    this.setupCamera(levelData);
    this.setupEvents();
    this.setupBoss(levelData);

    this.scene.launch('HUDScene', { player: this.player, levelDef: this.currentLevelDef, weaponSystem: this.weaponSystem });

    if (telegram.isTelegram) {
      telegram.showBackButton(() => {
        this.pauseGame();
      });
    }
  }

  private createParallaxBg(): void {
    const tilesetKey = this.currentLevelDef.tilesetKey;
    const bg1 = this.add.tileSprite(0, 0, GAME_WIDTH * 2, GAME_HEIGHT, tilesetKey)
      .setOrigin(0, 0).setScrollFactor(0.1).setDepth(-3).setAlpha(0.15).setTint(0x4444aa);
    const bg2 = this.add.tileSprite(0, 0, GAME_WIDTH * 2, GAME_HEIGHT, tilesetKey)
      .setOrigin(0, 0).setScrollFactor(0.3).setDepth(-2).setAlpha(0.1).setTint(0x6666cc);
    this.bgParallax = [bg1, bg2];
  }

  private setupCamera(levelData: LevelData): void {
    this.cameras.main.startFollow(this.player, true, 0.08, 0.1);
    this.cameras.main.setBounds(0, 0, levelData.width, levelData.height);
    this.physics.world.setBounds(0, 0, levelData.width, levelData.height + 200);
  }

  private setupCollisions(levelData: LevelData): void {
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.playerProjectiles, this.platforms, (proj) => {
      (proj as any).onHit?.();
    });
    this.physics.add.collider(this.enemyProjectiles, this.platforms, (proj) => {
      (proj as any).onHit?.();
    });

    this.physics.add.overlap(this.player, this.collectibles,
      this.onCollectItem as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);

    this.physics.add.overlap(this.player, this.hazards,
      this.onHitHazard as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
  }

  private setupEvents(): void {
    this.events.on('player-attack', (weapon: string, facing: string) => {
      if (weapon !== 'sword') {
        this.combatSystem.fireWeapon(weapon, facing);
      }
      telegram.haptic('light');
    });

    this.events.on('player-hurt', () => {
      telegram.haptic('heavy');
      this.cameras.main.shake(100, 0.005);
    });

    this.events.on('player-died', () => {
      telegram.hapticNotify('error');
      this.cameras.main.shake(200, 0.01);
      this.respawnTimer = 2000;
    });

    this.events.on('enemy-killed', (enemy: Enemy) => {
      telegram.haptic('medium');
    });

    this.events.on('extra-life', () => {
      telegram.hapticNotify('success');
    });

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ESC', () => this.pauseGame());
      this.input.keyboard.on('keydown-TAB', (e: KeyboardEvent) => {
        e.preventDefault();
        this.weaponSystem.cycleWeapon();
        this.events.emit('weapon-changed');
      });
    }
  }

  private setupBoss(levelData: LevelData): void {
    if (!this.currentLevelDef.bossId) return;
    this.bossSpawned = false;

    this.events.on('boss-attack', (boss: Boss, type: string) => {
      const dirX = boss.facing === 'left' ? -1 : 1;
      if (type === 'ranged' || type === 'magic') {
        const proj = new Projectile(this, boss.x + dirX * 20, boss.y, 'enemy_bullet', dirX);
        this.enemyProjectiles.add(proj);
      } else if (type === 'melee') {
        const dist = Phaser.Math.Distance.Between(boss.x, boss.y, this.player.x, this.player.y);
        if (dist < 60) {
          const knockDir = boss.x < this.player.x ? 1 : -1;
          this.player.takeDamage(boss.config.damage, knockDir);
        }
      }
    });

    this.events.on('boss-defeated', (boss: Boss) => {
      this.player.addScore(boss.config.scoreValue);
      this.time.delayedCall(3000, () => {
        this.completeLevel();
      });
    });

    this.events.on('boss-summon', (boss: Boss) => {
      const enemyTypes = this.currentLevelDef.enemyTypes;
      const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      const config = ENEMY_CONFIGS[type];
      if (!config) return;
      const spawnDir = boss.facing === 'left' ? -1 : 1;
      const enemy = new Enemy(this, boss.x + spawnDir * 60, boss.y, config);
      this.enemies.add(enemy as unknown as Phaser.GameObjects.GameObject);
    });

    this.events.on('boss-slam', (boss: Boss) => {
      const slamRange = TILE_SIZE * 5;
      const dist = Math.abs(this.player.x - boss.x);
      if (dist < slamRange && !this.player.pState.invincible && !this.player.pState.isDead) {
        const knockDir = boss.x < this.player.x ? 1 : -1;
        this.player.takeDamage(boss.config.damage, knockDir);
      }
    });

    this.events.on('boss-wave', (boss: Boss) => {
      for (let i = -2; i <= 2; i++) {
        const proj = new Projectile(this, boss.x + i * 30, boss.y, 'enemy_bullet', i < 0 ? -1 : 1, i * 0.3);
        this.enemyProjectiles.add(proj);
      }
    });

    this.events.on('boss-rage', (boss: Boss) => {
      this.cameras.main.shake(500, 0.012);
      const body = boss.body as Phaser.Physics.Arcade.Body;
      body.setVelocityX((boss.facing === 'left' ? -1 : 1) * boss.config.speed * 2.5);
    });
  }

  private spawnBoss(levelData: LevelData): void {
    if (this.bossSpawned || !this.currentLevelDef.bossId) return;
    this.bossSpawned = true;

    const bx = levelData.exitX;
    const by = levelData.exitY;

    const bossMap: Record<string, new (scene: Phaser.Scene, x: number, y: number) => Boss> = {
      le_rauxe: LeRauxe,
      katherine: Katherine,
      wolvington: Wolvington,
      gabriel: Gabriel,
      marrow: Marrow,
      aquatis: Aquatis,
      omar: Omar,
    };

    const BossClass = bossMap[this.currentLevelDef.bossId];
    if (!BossClass) return;

    this.boss = new BossClass(this, bx, by);
    this.physics.add.collider(this.boss, this.platforms);

    this.physics.add.overlap(
      this.boss, this.playerProjectiles,
      (_bossObj, projObj) => {
        if (!this.boss || this.boss.currentPhase === 'defeated') return;
        const proj = projObj as unknown as Projectile;
        const knockDir = proj.x < this.boss.x ? 1 : -1;
        this.boss.takeDamage(proj.damage, knockDir);
        proj.onHit();
      }
    );

    this.scene.launch('BossScene', { boss: this.boss });
    this.cameras.main.shake(300, 0.005);
    telegram.haptic('heavy');
  }

  update(time: number, delta: number): void {
    if (this.levelComplete) return;

    if (this.player.pState.isDead) {
      this.respawnTimer -= delta;
      if (this.respawnTimer <= 0) {
        if (this.player.pState.lives > 0) {
          const spawn = this.checkpointSystem.getSpawnPoint();
          this.player.respawn(spawn.x, spawn.y);
        } else {
          this.gameOver();
        }
      }
      return;
    }

    const input = this.inputManager.getInput();
    if (input.weaponSwitch) {
      this.weaponSystem.cycleWeapon();
      this.events.emit('weapon-changed');
    }
    this.player.update(time, delta, input);
    this.combatSystem.update(time, delta);
    this.powerUpSystem.update(delta);

    const enemyList = this.enemies.getChildren();
    for (let i = enemyList.length - 1; i >= 0; i--) {
      const enemy = enemyList[i] as unknown as Enemy;
      if (enemy.active) enemy.update(time, delta, this.player.x, this.player.y);
    }

    if (this.boss && this.boss.currentPhase !== 'defeated') {
      this.boss.update(time, delta, this.player.x, this.player.y);
      this.checkBossMelee();
    }

    if (!this.bossSpawned && this.currentLevelDef.bossId) {
      const distToEnd = Math.abs(this.player.x - this.currentLevelData.exitX);
      if (distToEnd < TILE_SIZE * 10) {
        this.spawnBoss(this.currentLevelData);
      }
    }

    this.checkCheckpoints();
    this.checkFallDeath();

    const lookAhead = this.player.pState.facing === 'right' ? -60 : 60;
    this.cameras.main.setFollowOffset(lookAhead, -20);

    const scrollX = this.cameras.main.scrollX;
    if (this.bgParallax[0]) this.bgParallax[0].tilePositionX = scrollX * 0.1;
    if (this.bgParallax[1]) this.bgParallax[1].tilePositionX = scrollX * 0.3;
  }

  private bossHitThisSwing = false;
  private wasPlayerAttacking = false;

  private checkBossMelee(): void {
    if (!this.boss || this.boss.currentPhase === 'defeated') return;

    if (!this.player.pState.isAttacking && this.wasPlayerAttacking) {
      this.bossHitThisSwing = false;
    }
    this.wasPlayerAttacking = this.player.pState.isAttacking;

    if (this.bossHitThisSwing) return;

    const attackBounds = this.player.getAttackBounds();
    if (!attackBounds) return;
    const bossBounds = this.boss.getBounds();
    if (Phaser.Geom.Rectangle.Overlaps(attackBounds, bossBounds)) {
      this.bossHitThisSwing = true;
      const knockDir = this.player.pState.facing === 'right' ? 1 : -1;
      this.boss.takeDamage(20, knockDir);
    }
  }

  private checkpointPositions: { x: number; y: number; id: string }[] = [];

  private checkCheckpoints(): void {
    for (const cp of this.checkpointPositions) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, cp.x, cp.y);
      if (dist < TILE_SIZE * 1.5) {
        if (this.checkpointSystem.activateCheckpoint(cp.id)) {
          this.showCheckpointText(cp.x, cp.y);
          telegram.haptic('medium');
        }
      }
    }
  }

  private showCheckpointText(x: number, y: number): void {
    const text = this.add.text(x, y - 30, 'CHECKPOINT', {
      fontSize: '10px', color: '#44ff88', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(50);
    this.tweens.add({
      targets: text, y: y - 60, alpha: 0, duration: 1200,
      onComplete: () => text.destroy(),
    });
  }

  private checkFallDeath(): void {
    if (this.player.y > this.physics.world.bounds.height - 50) {
      this.player.die();
    }
  }

  private onCollectItem(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    item: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ): void {
    const collectible = item as unknown as Collectible;
    const result = collectible.collect();
    if (!result) return;
    telegram.haptic('light');

    switch (result.type) {
      case 'gem_red':
      case 'gem_green':
      case 'gem_blue':
      case 'gem_purple':
      case 'treasure':
        this.player.addScore(result.value);
        break;
      case 'health':
        this.player.heal(result.value);
        break;
      case 'ammo_pistol':
        this.weaponSystem.addAmmo('pistol', result.value);
        break;
      case 'ammo_dynamite':
        this.weaponSystem.addAmmo('dynamite', result.value);
        break;
      case 'ammo_magic':
        this.weaponSystem.addAmmo('magic', result.value);
        break;
      case 'extra_life':
        this.player.pState.lives++;
        this.events.emit('extra-life');
        break;
      case 'catnip':
        this.powerUpSystem.activate('catnip');
        break;
      case 'gem_piece':
        this.completeLevel();
        break;
    }
  }

  private onHitHazard(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    _hazard: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ): void {
    if (this.player.pState.invincible || this.player.pState.isDead) return;
    this.player.takeDamage(20);
  }

  private completeLevel(): void {
    if (this.levelComplete) return;
    this.levelComplete = true;
    telegram.hapticNotify('success');

    this.showLevelTally(() => {
      const nextLevel = this.levelManager.completeLevel();
      this.scene.stop('HUDScene');
      this.scene.stop('BossScene');
      if (nextLevel) {
        this.scene.restart({ levelId: nextLevel });
      } else {
        this.showGameComplete();
      }
    });
  }

  private showLevelTally(onDone: () => void): void {
    const cx = this.cameras.main.scrollX + GAME_WIDTH / 2;
    const cy = this.cameras.main.scrollY + GAME_HEIGHT / 2;

    const bg = this.add.graphics().setDepth(90);
    bg.fillStyle(0x000000, 0.8);
    bg.fillRect(cx - 120, cy - 60, 240, 120);

    this.add.text(cx, cy - 45, 'LEVEL COMPLETE!', {
      fontSize: '16px', color: '#ffcc44', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(91);

    this.add.text(cx, cy - 20, `${this.currentLevelDef.name}`, {
      fontSize: '12px', color: '#aaaacc',
    }).setOrigin(0.5).setDepth(91);

    this.add.text(cx, cy + 5, `Score: ${this.player.pState.score.toLocaleString()}`, {
      fontSize: '14px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(91);

    this.add.text(cx, cy + 25, `Lives: ${this.player.pState.lives}`, {
      fontSize: '12px', color: '#ff4466',
    }).setOrigin(0.5).setDepth(91);

    this.time.delayedCall(2500, () => {
      this.cameras.main.fade(500, 0, 0, 0, false, (_cam: any, progress: number) => {
        if (progress >= 1) onDone();
      });
    });
  }

  private showGameComplete(): void {
    this.scene.start('MenuScene');
  }

  pauseGame(): void {
    this.scene.launch('PauseScene');
    this.scene.pause();
  }

  shutdown(): void {
    this.inputManager?.destroy();
    this.events.removeAllListeners();
  }

  private gameOver(): void {
    this.scene.stop('HUDScene');
    this.scene.stop('BossScene');

    this.cameras.main.fade(500, 0, 0, 0, false, (_cam: any, progress: number) => {
      if (progress >= 1) {
        this.scene.start('MenuScene');
      }
    });
  }

  private generateLevel(levelDef: LevelDef): LevelData {
    const levelId = levelDef.id;
    const seed = levelId * 12345;
    const rng = new Phaser.Math.RandomDataGenerator([seed.toString()]);

    const mapWidth = 120 + levelId * 20;
    const mapHeight = 20;
    const tileW = TILE_SIZE;
    const pixelWidth = mapWidth * tileW;
    const pixelHeight = mapHeight * tileW;

    const groundRow = mapHeight - 1;
    const groundTopRow = mapHeight - 2;
    const playerRow = mapHeight - 3;

    const data: LevelData = {
      width: pixelWidth,
      height: pixelHeight,
      platforms: [],
      enemies: [],
      collectibles: [],
      checkpoints: [],
      spawnX: tileW * 3,
      spawnY: playerRow * tileW,
      exitX: (mapWidth - 5) * tileW,
      exitY: playerRow * tileW,
      hazards: [],
      decorations: [],
    };

    // -- Ground layer with gaps --
    const groundGaps: { start: number; end: number }[] = [];

    for (let x = 0; x < mapWidth; x++) {
      if (x > 8 && x < mapWidth - 10 && rng.frac() < 0.07) {
        const gapW = rng.between(2, 3);
        if (rng.frac() < 0.3) {
          data.hazards.push({ x: x * tileW, y: groundRow * tileW, w: gapW });
        }
        groundGaps.push({ start: x, end: x + gapW - 1 });
        x += gapW - 1;
        continue;
      }
      data.platforms.push({ x: x * tileW, y: groundRow * tileW, w: 1, tileId: 1 });
      data.platforms.push({ x: x * tileW, y: groundTopRow * tileW, w: 1, tileId: 2 });
    }

    // -- End-of-level wall (prevents running off the edge) --
    for (let wy = 0; wy < mapHeight; wy++) {
      data.platforms.push({ x: (mapWidth - 1) * tileW, y: wy * tileW, w: 1, tileId: 1 });
    }

    const isOverGap = (tileX: number): boolean =>
      groundGaps.some(g => tileX >= g.start && tileX <= g.end);

    const usedCollectibleTiles = new Set<string>();
    const placeCollectible = (tx: number, ty: number, type: CollectibleType, frame: number): boolean => {
      const key = `${tx},${ty}`;
      if (usedCollectibleTiles.has(key)) return false;
      usedCollectibleTiles.add(key);
      data.collectibles.push({ x: tx, y: ty, type, frame });
      return true;
    };

    // Jump physics: single jump = 68px (~2 tiles), double jump = 118px (~3 tiles) from
    // any surface. Platforms must be reachable through connected chains from ground.
    // Ground surface is at groundTopRow (row 18). Player can double-jump to row 15.
    const MAX_STEP_UP = 3; // max rows upward per double jump

    const numBasePlatforms = 10 + levelId * 2;
    const sectionWidth = Math.floor((mapWidth - 16) / numBasePlatforms);

    const addPlatformTiles = (col: number, row: number, w: number) => {
      const clamped = Math.max(0, Math.min(col, mapWidth - w - 2));
      for (let dx = 0; dx < w; dx++) {
        data.platforms.push({
          x: (clamped + dx) * tileW,
          y: row * tileW,
          w: 1,
          tileId: dx === 0 ? 8 : dx === w - 1 ? 9 : 2,
        });
      }
      if (rng.frac() < 0.6) {
        const gemTypes: CollectibleType[] = ['gem_red', 'gem_green', 'gem_blue', 'gem_purple'];
        const gemFrames = [0, 1, 2, 3];
        const gi = rng.between(0, 3);
        const cx = (clamped + Math.floor(w / 2)) * tileW + tileW / 2;
        const cy = (row - 1) * tileW;
        placeCollectible(cx, cy, gemTypes[gi], gemFrames[gi]);
      }
    };

    for (let i = 0; i < numBasePlatforms; i++) {
      const sectionStart = 6 + i * sectionWidth;
      const px = rng.between(sectionStart, Math.min(sectionStart + sectionWidth - 2, mapWidth - 6));
      const pw = rng.between(2, Math.min(5, mapWidth - px - 1));

      // Tier 1: rows 15-16, always reachable from ground via double jump
      const baseRow = rng.between(15, 16);
      addPlatformTiles(px, baseRow, pw);

      // 40% chance to extend upward with a connected tier 2 platform
      if (rng.frac() < 0.4) {
        const t2Step = rng.between(2, MAX_STEP_UP);
        const t2Row = baseRow - t2Step;
        const t2Col = px + rng.between(-2, 2);
        const t2W = rng.between(2, 4);
        addPlatformTiles(t2Col, t2Row, t2W);

        // 30% chance to add tier 3 on top of tier 2
        if (rng.frac() < 0.3) {
          const t3Step = rng.between(2, MAX_STEP_UP);
          const t3Row = t2Row - t3Step;
          if (t3Row >= 5) {
            const t3Col = t2Col + rng.between(-2, 2);
            const t3W = rng.between(2, 3);
            addPlatformTiles(t3Col, t3Row, t3W);
          }
        }
      }
    }

    const availableEnemyTypes = levelDef.enemyTypes;
    const numEnemies = 8 + levelId * 2;
    for (let i = 0; i < numEnemies; i++) {
      const ex = rng.between(10, mapWidth - 12);
      if (isOverGap(ex)) continue;
      data.enemies.push({ x: ex * tileW, y: playerRow * tileW, type: rng.pick(availableEnemyTypes) });
    }

    for (let i = 0; i < 20 + levelId * 5; i++) {
      const cx = rng.between(5, mapWidth - 8);
      if (isOverGap(cx)) continue;

      const r = rng.frac();
      let type: CollectibleType;
      let frame: number;
      if (r < 0.4) { type = 'gem_red'; frame = 0; }
      else if (r < 0.65) { type = 'gem_green'; frame = 1; }
      else if (r < 0.8) { type = 'gem_blue'; frame = 2; }
      else if (r < 0.88) { type = 'gem_purple'; frame = 3; }
      else if (r < 0.92) { type = 'treasure'; frame = 4; }
      else if (r < 0.96) { type = 'health'; frame = 5; }
      else { type = 'ammo_pistol'; frame = 6; }

      placeCollectible(cx * tileW + tileW / 2, playerRow * tileW, type, frame);
    }

    // -- Checkpoints --
    const cpInterval = Math.floor(mapWidth / 4);
    for (let i = 1; i < 4; i++) {
      const cpx = cpInterval * i;
      data.checkpoints.push({
        x: cpx * tileW,
        y: playerRow * tileW,
        id: `cp_${i}`,
      });
    }

    // -- Exit gem piece (or boss handles level completion) --
    if (!levelDef.bossId) {
      placeCollectible(data.exitX, data.exitY - tileW, 'gem_piece', 11);
    }

    // -- Hazard spikes on ground surface --
    for (let i = 0; i < 3 + levelId; i++) {
      const hx = rng.between(10, mapWidth - 12);
      if (isOverGap(hx)) continue;
      data.hazards.push({ x: hx * tileW, y: (groundTopRow - 1) * tileW, w: rng.between(1, 3) });
    }

    return data;
  }

  private buildLevel(data: LevelData): void {
    const tilesetKey = this.currentLevelDef.tilesetKey;
    const hs = TILE_SIZE / 2;

    for (const p of data.platforms) {
      const tile = this.platforms.create(
        p.x + hs, p.y + hs, tilesetKey, p.tileId
      ) as Phaser.Physics.Arcade.Image;
      tile.setDepth(0).refreshBody();
    }

    for (const h of data.hazards) {
      for (let dx = 0; dx < (h.w || 1); dx++) {
        const spike = this.hazards.create(
          h.x + dx * TILE_SIZE + hs, h.y + hs, tilesetKey, 6
        ) as Phaser.Physics.Arcade.Image;
        spike.setDepth(0).refreshBody();
      }
    }

    this.checkpointPositions = [];
    for (const cp of data.checkpoints) {
      this.add.image(cp.x + hs, cp.y + hs, tilesetKey, 7).setDepth(1);
      this.checkpointPositions.push({ x: cp.x + hs, y: cp.y + hs, id: cp.id });
    }

    // Exit gate marker
    this.buildExitMarker(data);

    for (const e of data.enemies) {
      const config = ENEMY_CONFIGS[e.type];
      if (config) {
        const enemy = new Enemy(this, e.x, e.y, config);
        this.enemies.add(enemy as unknown as Phaser.GameObjects.GameObject);
      }
    }

    for (const c of data.collectibles) {
      const collectible = new Collectible(this, c.x, c.y, c.type, c.frame);
      this.collectibles.add(collectible as unknown as Phaser.GameObjects.GameObject);
    }
  }

  private buildExitMarker(data: LevelData): void {
    const ex = data.exitX;
    const ey = data.exitY;
    const gateColor = this.currentLevelDef.bossId ? 0xff4444 : 0x44ff88;

    const gate = this.add.graphics().setDepth(2);
    gate.fillStyle(gateColor, 0.15);
    gate.fillRect(ex - TILE_SIZE, ey - TILE_SIZE * 3, TILE_SIZE * 2, TILE_SIZE * 3);
    gate.lineStyle(2, gateColor, 0.6);
    gate.strokeRect(ex - TILE_SIZE, ey - TILE_SIZE * 3, TILE_SIZE * 2, TILE_SIZE * 3);

    const pillarL = this.add.graphics().setDepth(2);
    pillarL.fillStyle(gateColor, 0.4);
    pillarL.fillRect(ex - TILE_SIZE - 4, ey - TILE_SIZE * 3.5, 6, TILE_SIZE * 3.5);

    const pillarR = this.add.graphics().setDepth(2);
    pillarR.fillStyle(gateColor, 0.4);
    pillarR.fillRect(ex + TILE_SIZE - 2, ey - TILE_SIZE * 3.5, 6, TILE_SIZE * 3.5);

    const label = this.currentLevelDef.bossId ? 'BOSS' : 'EXIT';
    this.add.text(ex, ey - TILE_SIZE * 3.5, label, {
      fontSize: '10px', color: gateColor === 0xff4444 ? '#ff6666' : '#66ffaa',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(3);

    const arrow = this.add.text(ex, ey - TILE_SIZE * 2, '\u25BC', {
      fontSize: '14px', color: gateColor === 0xff4444 ? '#ff6666' : '#66ffaa',
    }).setOrigin(0.5).setDepth(3);
    this.tweens.add({
      targets: arrow, y: arrow.y + 8,
      yoyo: true, repeat: -1, duration: 600, ease: 'Sine.easeInOut',
    });
  }
}
