import Phaser from 'phaser';
import { GameInput } from '../utils/InputManager';
import { TILE_SIZE } from '../config';

export interface PlayerState {
  health: number;
  maxHealth: number;
  lives: number;
  score: number;
  ammo: { pistol: number; dynamite: number; magic: number };
  currentWeapon: 'sword' | 'pistol' | 'dynamite' | 'magic';
  invincible: boolean;
  canDoubleJump: boolean;
  hasDoubleJumped: boolean;
  facing: 'left' | 'right';
  isAttacking: boolean;
  isDead: boolean;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  pState: PlayerState;

  private readonly SPEED = 160;
  private readonly JUMP_VELOCITY = -350;
  private readonly DOUBLE_JUMP_VELOCITY = -300;
  private invincibleTimer = 0;
  private attackTimer = 0;
  private attackCooldown = 300;
  private readonly COYOTE_TIME = 80;
  private lastOnFloor = 0;
  private readonly attackRect = new Phaser.Geom.Rectangle(0, 0, 24, 24);

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player', 0);

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as unknown as Phaser.GameObjects.GameObject);

    this.setSize(18, 28);
    this.setOffset(7, 4);
    this.setCollideWorldBounds(false);
    this.setDepth(10);

    this.pState = {
      health: 100,
      maxHealth: 100,
      lives: 3,
      score: 0,
      ammo: { pistol: 10, dynamite: 5, magic: 3 },
      currentWeapon: 'sword',
      invincible: false,
      canDoubleJump: true,
      hasDoubleJumped: false,
      facing: 'right',
      isAttacking: false,
      isDead: false,
    };
  }

  update(time: number, delta: number, input: GameInput): void {
    if (this.pState.isDead) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const onFloor = body.blocked.down;

    if (onFloor) {
      this.lastOnFloor = time;
      this.pState.hasDoubleJumped = false;
    }

    if (this.pState.invincible) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.pState.invincible = false;
        this.clearTint();
        this.setAlpha(1);
      } else {
        this.setAlpha(Math.sin(time * 0.02) > 0 ? 1 : 0.4);
      }
    }

    if (this.pState.isAttacking) {
      this.attackTimer -= delta;
      if (this.attackTimer <= 0) {
        this.pState.isAttacking = false;
      }
    }

    if (input.left) {
      body.setVelocityX(-this.SPEED);
      this.pState.facing = 'left';
      this.setFlipX(true);
    } else if (input.right) {
      body.setVelocityX(this.SPEED);
      this.pState.facing = 'right';
      this.setFlipX(false);
    } else {
      body.setVelocityX(0);
    }

    const canCoyoteJump = (time - this.lastOnFloor) < this.COYOTE_TIME;
    if (input.jumpJustPressed) {
      if (onFloor || canCoyoteJump) {
        body.setVelocityY(this.JUMP_VELOCITY);
        this.lastOnFloor = 0;
        this.scene.events.emit('player-jump');
      } else if (this.pState.canDoubleJump && !this.pState.hasDoubleJumped) {
        body.setVelocityY(this.DOUBLE_JUMP_VELOCITY);
        this.pState.hasDoubleJumped = true;
        this.scene.events.emit('player-jump');
      }
    }

    if (input.attackJustPressed && !this.pState.isAttacking) {
      this.pState.isAttacking = true;
      this.attackTimer = this.attackCooldown;
      this.scene.events.emit('player-attack', this.pState.currentWeapon, this.pState.facing);
    }

    this.playAnimations(onFloor, body.velocity);
  }

  private playAnimations(onFloor: boolean, velocity: Phaser.Math.Vector2): void {
    if (this.pState.isAttacking) {
      this.playAnim('player-attack');
    } else if (!onFloor) {
      this.playAnim(velocity.y < 0 ? 'player-jump' : 'player-fall');
    } else if (velocity.x !== 0) {
      this.playAnim('player-run');
    } else {
      this.playAnim('player-idle');
    }
  }

  private playAnim(key: string): void {
    if (this.anims.currentAnim?.key !== key) {
      this.play(key, true);
    }
  }

  takeDamage(amount: number, knockbackDir: number = 0): void {
    if (this.pState.invincible || this.pState.isDead) return;

    this.pState.health -= amount;
    this.pState.invincible = true;
    this.invincibleTimer = 1500;
    this.setTint(0xff0000);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(knockbackDir * 200, -200);

    this.scene.events.emit('player-hurt');

    if (this.pState.health <= 0) {
      this.die();
    }
  }

  die(): void {
    this.pState.isDead = true;
    this.pState.lives--;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, -300);
    body.enable = false;
    this.play('player-die');
    this.scene.events.emit('player-died');
  }

  respawn(x: number, y: number): void {
    this.pState.isDead = false;
    this.pState.health = this.pState.maxHealth;
    this.pState.invincible = true;
    this.invincibleTimer = 2000;
    this.pState.hasDoubleJumped = false;
    this.pState.isAttacking = false;
    this.attackTimer = 0;
    this.setPosition(x, y);
    this.setAlpha(1);
    this.clearTint();
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setVelocity(0, 0);
  }

  addScore(points: number): void {
    const oldScore = this.pState.score;
    this.pState.score += points;
    if (Math.floor(this.pState.score / 1_000_000) > Math.floor(oldScore / 1_000_000)) {
      this.pState.lives++;
      this.scene.events.emit('extra-life');
    }
    this.scene.events.emit('score-changed', this.pState.score);
  }

  heal(amount: number): void {
    this.pState.health = Math.min(this.pState.health + amount, this.pState.maxHealth);
  }

  activateCatnip(duration: number = 10000): void {
    this.pState.invincible = true;
    this.invincibleTimer = duration;
    this.setTint(0xffff00);
  }

  getAttackBounds(): Phaser.Geom.Rectangle | null {
    if (!this.pState.isAttacking || this.pState.currentWeapon !== 'sword') return null;
    const offsetX = this.pState.facing === 'right' ? TILE_SIZE : -TILE_SIZE;
    this.attackRect.setPosition(this.x + offsetX - 12, this.y - 10);
    return this.attackRect;
  }
}
