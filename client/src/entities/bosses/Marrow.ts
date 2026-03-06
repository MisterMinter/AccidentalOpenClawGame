import Phaser from 'phaser';
import { Boss, BossConfig } from '../Boss';

const CONFIG: BossConfig = {
  key: 'boss_marrow',
  name: 'Marrow',
  maxHealth: 600,
  damage: 30,
  speed: 60,
  scoreValue: 50000,
  phaseThresholds: [0.5, 0.2],
};

export class Marrow extends Boss {
  private slamTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, CONFIG);
  }

  protected doIntro(_time: number, _delta: number): void {
    if (this.phaseTimer > 2000) {
      this.currentPhase = 'phase1';
      this.phaseTimer = 0;
    }
  }

  protected doBehavior(_time: number, delta: number, playerX: number, _playerY: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dist = Math.abs(this.x - playerX);
    const dir = playerX < this.x ? -1 : 1;

    this.slamTimer = Math.max(0, this.slamTimer - delta);

    body.setVelocityX(dir * this.config.speed);

    if (this.attackTimer <= 0 && dist < 60) {
      this.scene.events.emit('boss-attack', this, 'melee');
      this.attackTimer = 800;
    }

    if (this.slamTimer <= 0 && body.blocked.down) {
      body.setVelocityY(-500);
      this.scene.time.delayedCall(600, () => {
        this.scene.cameras.main.shake(200, 0.015);
        this.scene.events.emit('boss-slam', this);
      });
      this.slamTimer = this.currentPhase === 'phase3' ? 2500 : 4000;
    }

    if (this.currentPhase !== 'phase1' && this.attackTimer <= 0) {
      this.scene.events.emit('boss-attack', this, 'ranged');
      this.attackTimer = 1200;
    }
  }
}
