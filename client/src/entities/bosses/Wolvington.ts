import Phaser from 'phaser';
import { Boss, BossConfig } from '../Boss';

const CONFIG: BossConfig = {
  key: 'boss_wolvington',
  name: 'Wolvington',
  maxHealth: 400,
  damage: 25,
  speed: 90,
  scoreValue: 30000,
  phaseThresholds: [0.55, 0.2],
};

export class Wolvington extends Boss {
  private teleportTimer = 0;

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

    this.teleportTimer = Math.max(0, this.teleportTimer - delta);

    body.setVelocityX(dir * this.config.speed);

    if (this.attackTimer <= 0 && dist < 50) {
      this.scene.events.emit('boss-attack', this, 'melee');
      this.attackTimer = 700;
    }

    if (this.currentPhase !== 'phase1') {
      if (this.attackTimer <= 0 && dist < 250) {
        this.scene.events.emit('boss-attack', this, 'magic');
        this.attackTimer = this.currentPhase === 'phase3' ? 1000 : 1500;
      }
    }

    if (this.teleportTimer <= 0 && this.currentPhase === 'phase3') {
      this.setAlpha(0);
      this.scene.time.delayedCall(300, () => {
        this.setPosition(playerX + (Phaser.Math.Between(0, 1) ? 80 : -80), this.y);
        this.setAlpha(1);
      });
      this.teleportTimer = 4000;
    }
  }
}
