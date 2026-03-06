import Phaser from 'phaser';
import { Boss, BossConfig } from '../Boss';

const CONFIG: BossConfig = {
  key: 'boss_le_rauxe',
  name: 'Le Rauxe',
  maxHealth: 200,
  damage: 15,
  speed: 80,
  scoreValue: 10000,
  phaseThresholds: [0.5, 0.2],
};

export class LeRauxe extends Boss {
  private dashCooldown = 0;
  private dashDuration = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, CONFIG);
  }

  protected doIntro(_time: number, _delta: number): void {
    if (this.phaseTimer > 1500) {
      this.currentPhase = 'phase1';
      this.phaseTimer = 0;
    }
  }

  protected doBehavior(_time: number, delta: number, playerX: number, _playerY: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dist = Math.abs(this.x - playerX);
    const dir = playerX < this.x ? -1 : 1;

    this.dashCooldown = Math.max(0, this.dashCooldown - delta);
    this.dashDuration = Math.max(0, this.dashDuration - delta);

    const speed = this.currentPhase === 'phase3' ? this.config.speed * 1.8 :
                  this.currentPhase === 'phase2' ? this.config.speed * 1.4 :
                  this.config.speed;

    if (this.dashDuration > 0) {
      // Currently dashing -- don't override velocity
    } else if (dist > 40) {
      body.setVelocityX(dir * speed);
    } else {
      body.setVelocityX(0);
    }

    if (this.attackTimer <= 0 && dist < 60) {
      this.scene.events.emit('boss-attack', this, 'melee');
      this.attackTimer = this.currentPhase === 'phase3' ? 600 : 1000;
    }

    if (this.dashCooldown <= 0 && this.dashDuration <= 0 && dist > 100 && dist < 250) {
      body.setVelocityX(dir * speed * 3);
      this.dashDuration = 300;
      this.dashCooldown = this.currentPhase === 'phase3' ? 2000 : 3000;
    }
  }
}
