import Phaser from 'phaser';
import { Boss, BossConfig } from '../Boss';

const CONFIG: BossConfig = {
  key: 'boss_katherine',
  name: 'Katherine',
  maxHealth: 300,
  damage: 20,
  speed: 100,
  scoreValue: 20000,
  phaseThresholds: [0.6, 0.25],
};

export class Katherine extends Boss {
  private jumpTimer = 0;

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

    this.jumpTimer = Math.max(0, this.jumpTimer - delta);

    body.setVelocityX(dir * this.config.speed);

    if (this.jumpTimer <= 0 && body.blocked.down) {
      body.setVelocityY(-400);
      this.jumpTimer = this.currentPhase === 'phase3' ? 1000 : 1800;
    }

    if (this.attackTimer <= 0 && dist < 50) {
      this.scene.events.emit('boss-attack', this, 'melee');
      this.attackTimer = 800;
    }

    if (this.currentPhase !== 'phase1' && this.attackTimer <= 0 && dist > 80 && dist < 200) {
      this.scene.events.emit('boss-attack', this, 'ranged');
      this.attackTimer = this.currentPhase === 'phase3' ? 1200 : 2000;
    }
  }
}
