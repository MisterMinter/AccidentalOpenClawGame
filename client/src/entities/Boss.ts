import Phaser from 'phaser';

export type BossPhase = 'intro' | 'phase1' | 'phase2' | 'phase3' | 'defeated';

export interface BossConfig {
  key: string;
  name: string;
  maxHealth: number;
  damage: number;
  speed: number;
  scoreValue: number;
  phaseThresholds: number[];
}

export abstract class Boss extends Phaser.Physics.Arcade.Sprite {
  config: BossConfig;
  health: number;
  maxHealth: number;
  currentPhase: BossPhase = 'intro';
  facing: 'left' | 'right' = 'left';
  protected attackTimer = 0;
  protected phaseTimer = 0;
  protected invulnerable = false;
  protected invulnTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, config: BossConfig) {
    super(scene, x, y, config.key, 0);
    this.config = config;
    this.health = config.maxHealth;
    this.maxHealth = config.maxHealth;

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as unknown as Phaser.GameObjects.GameObject);

    this.setSize(28, 32);
    this.setOffset(2, 0);
    this.setDepth(9);
  }

  update(time: number, delta: number, playerX: number, playerY: number): void {
    if (this.currentPhase === 'defeated') return;

    this.attackTimer = Math.max(0, this.attackTimer - delta);
    this.phaseTimer += delta;

    if (this.invulnerable) {
      this.invulnTimer -= delta;
      if (this.invulnTimer <= 0) {
        this.invulnerable = false;
        this.clearTint();
      }
      this.setAlpha(Math.sin(time * 0.03) > 0 ? 1 : 0.5);
    }

    this.facing = playerX < this.x ? 'left' : 'right';
    this.setFlipX(this.facing === 'left');

    if (this.currentPhase === 'intro') {
      this.doIntro(time, delta);
    } else {
      this.doBehavior(time, delta, playerX, playerY);
    }
  }

  protected abstract doIntro(time: number, delta: number): void;
  protected abstract doBehavior(time: number, delta: number, playerX: number, playerY: number): void;

  takeDamage(amount: number, knockbackDir: number): void {
    if (this.currentPhase === 'defeated' || this.invulnerable) return;

    this.health -= amount;
    this.setTint(0xff0000);
    this.invulnerable = true;
    this.invulnTimer = 500;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(knockbackDir * 80, -50);

    this.scene.events.emit('boss-hurt', this);

    this.checkPhaseTransition();

    if (this.health <= 0) {
      this.defeat();
    }
  }

  private checkPhaseTransition(): void {
    const hpPct = this.health / this.maxHealth;
    const thresholds = this.config.phaseThresholds;
    if (this.currentPhase === 'phase1' && hpPct <= thresholds[0]) {
      this.currentPhase = 'phase2';
      this.onPhaseChange('phase2');
    } else if (this.currentPhase === 'phase2' && thresholds.length > 1 && hpPct <= thresholds[1]) {
      this.currentPhase = 'phase3';
      this.onPhaseChange('phase3');
    }
  }

  protected onPhaseChange(_phase: BossPhase): void {
    this.invulnerable = true;
    this.invulnTimer = 1000;
    this.scene.cameras.main.shake(200, 0.008);
  }

  private defeat(): void {
    this.currentPhase = 'defeated';
    this.health = 0;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setAllowGravity(false);

    this.scene.cameras.main.shake(300, 0.01);

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      angle: 360,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        this.scene.events.emit('boss-defeated', this);
        this.destroy();
      },
    });
  }

  getHealthPercent(): number {
    return Math.max(0, this.health / this.maxHealth);
  }
}
