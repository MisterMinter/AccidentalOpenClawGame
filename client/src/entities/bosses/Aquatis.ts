import Phaser from 'phaser';
import { Boss, BossConfig } from '../Boss';

const CONFIG: BossConfig = {
  key: 'boss_aquatis',
  name: 'Aquatis',
  maxHealth: 700,
  damage: 30,
  speed: 50,
  scoreValue: 60000,
  phaseThresholds: [0.5, 0.2],
};

export class Aquatis extends Boss {
  private waveTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, CONFIG);
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
  }

  protected doIntro(_time: number, _delta: number): void {
    if (this.phaseTimer > 2500) {
      this.currentPhase = 'phase1';
      this.phaseTimer = 0;
    }
  }

  protected doBehavior(time: number, delta: number, playerX: number, _playerY: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dir = playerX < this.x ? -1 : 1;

    this.waveTimer = Math.max(0, this.waveTimer - delta);

    // Sinusoidal movement
    body.setVelocityX(dir * this.config.speed);
    body.setVelocityY(Math.sin(time * 0.003) * 80);

    if (this.attackTimer <= 0) {
      const numProjectiles = this.currentPhase === 'phase3' ? 5 :
                             this.currentPhase === 'phase2' ? 3 : 1;
      for (let i = 0; i < numProjectiles; i++) {
        this.scene.events.emit('boss-attack', this, 'ranged');
      }
      this.attackTimer = this.currentPhase === 'phase3' ? 1000 : 1800;
    }

    if (this.waveTimer <= 0 && this.currentPhase !== 'phase1') {
      this.scene.events.emit('boss-wave', this);
      this.waveTimer = 5000;
    }
  }
}
