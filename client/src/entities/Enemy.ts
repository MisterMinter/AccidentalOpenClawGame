import Phaser from 'phaser';

export type EnemyAIState = 'idle' | 'patrol' | 'chase' | 'attack' | 'hurt' | 'dead';

export interface EnemyConfig {
  key: string;
  health: number;
  speed: number;
  damage: number;
  scoreValue: number;
  patrolDistance: number;
  chaseRange: number;
  attackRange: number;
  attackCooldown: number;
  ranged?: boolean;
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  config: EnemyConfig;
  health: number;
  aiState: EnemyAIState = 'patrol';
  facing: 'left' | 'right' = 'left';
  private patrolOriginX: number;
  private attackTimer = 0;
  private hurtTimer = 0;
  private stateTimer = 0;
  private preHurtState: EnemyAIState = 'patrol';

  constructor(scene: Phaser.Scene, x: number, y: number, config: EnemyConfig) {
    super(scene, x, y, config.key, 0);
    this.config = config;
    this.health = config.health;
    this.patrolOriginX = x;

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as unknown as Phaser.GameObjects.GameObject);

    this.setSize(20, 28);
    this.setOffset(6, 4);
    this.setDepth(8);
  }

  update(time: number, delta: number, playerX: number, playerY: number): void {
    if (this.aiState === 'dead') return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    const dirToPlayer = playerX < this.x ? -1 : 1;

    this.stateTimer += delta;
    this.attackTimer = Math.max(0, this.attackTimer - delta);

    if (this.aiState === 'hurt') {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0) {
        this.aiState = distToPlayer < this.config.chaseRange ? 'chase' : this.preHurtState;
        this.clearTint();
      }
      return;
    }

    switch (this.aiState) {
      case 'patrol':
        this.doPatrol(body);
        if (distToPlayer < this.config.chaseRange) {
          this.aiState = 'chase';
          this.stateTimer = 0;
        }
        break;

      case 'chase':
        body.setVelocityX(dirToPlayer * this.config.speed * 1.2);
        this.facing = dirToPlayer < 0 ? 'left' : 'right';
        this.setFlipX(this.facing === 'left');
        if (distToPlayer < this.config.attackRange) {
          this.aiState = 'attack';
          this.stateTimer = 0;
        } else if (distToPlayer > this.config.chaseRange * 1.5) {
          this.aiState = 'patrol';
          this.stateTimer = 0;
        }
        break;

      case 'attack':
        body.setVelocityX(0);
        if (this.attackTimer <= 0) {
          this.scene.events.emit('enemy-attack', this);
          this.attackTimer = this.config.attackCooldown;
          this.playAnim(`${this.config.key}-attack`);
        }
        if (distToPlayer > this.config.attackRange * 1.5) {
          this.aiState = 'chase';
          this.stateTimer = 0;
        }
        break;

      case 'idle':
        body.setVelocityX(0);
        if (distToPlayer < this.config.chaseRange) {
          this.aiState = 'chase';
        }
        break;
    }

    if (this.aiState !== 'attack') {
      this.playAnimations(body);
    }
  }

  private doPatrol(body: Phaser.Physics.Arcade.Body): void {
    const dist = this.x - this.patrolOriginX;
    if (Math.abs(dist) > this.config.patrolDistance) {
      this.facing = dist > 0 ? 'left' : 'right';
      this.x = this.patrolOriginX + (dist > 0 ? 1 : -1) * this.config.patrolDistance;
    } else if (body.blocked.left || body.blocked.right) {
      this.facing = this.facing === 'left' ? 'right' : 'left';
    }

    const dir = this.facing === 'left' ? -1 : 1;
    body.setVelocityX(dir * this.config.speed);
    this.setFlipX(this.facing === 'left');
  }

  private playAnimations(body: Phaser.Physics.Arcade.Body): void {
    if (body.velocity.x !== 0) {
      this.playAnim(`${this.config.key}-walk`);
    } else {
      this.playAnim(`${this.config.key}-idle`);
    }
  }

  private playAnim(key: string): void {
    if (this.anims.currentAnim?.key !== key && this.scene.anims.exists(key)) {
      this.play(key, true);
    }
  }

  takeDamage(amount: number, knockbackDir: number): void {
    if (this.aiState === 'dead') return;

    this.health -= amount;
    this.setTint(0xff0000);
    this.hurtTimer = 200;
    this.preHurtState = this.aiState;
    this.aiState = 'hurt';

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(knockbackDir * 150, -100);

    if (this.health <= 0) {
      this.die();
    }
  }

  die(): void {
    this.aiState = 'dead';
    this.setTint(0x666666);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.enable = false;

    this.scene.events.emit('enemy-killed', this);

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y - 20,
      duration: 500,
      onComplete: () => {
        this.destroy();
      },
    });
  }
}
