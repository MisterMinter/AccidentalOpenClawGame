import Phaser from 'phaser';
import { Boss, BossConfig } from '../Boss';

const CONFIG: BossConfig = {
  key: 'boss_omar',
  name: 'Omar',
  maxHealth: 1000,
  damage: 35,
  speed: 80,
  scoreValue: 100000,
  phaseThresholds: [0.6, 0.3],
};

export class Omar extends Boss {
  private specialTimer = 0;
  private comboCount = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, CONFIG);
  }

  protected doIntro(_time: number, _delta: number): void {
    if (this.phaseTimer > 3000) {
      this.currentPhase = 'phase1';
      this.phaseTimer = 0;
    }
  }

  protected doBehavior(_time: number, delta: number, playerX: number, playerY: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    const dir = playerX < this.x ? -1 : 1;

    this.specialTimer = Math.max(0, this.specialTimer - delta);

    const speed = this.config.speed * (this.currentPhase === 'phase3' ? 1.5 : 1);
    body.setVelocityX(dir * speed);

    if (this.attackTimer <= 0 && dist < 60) {
      this.comboCount++;
      this.scene.events.emit('boss-attack', this, 'melee');
      this.attackTimer = this.comboCount < 3 ? 300 : 1200;
      if (this.comboCount >= 3) this.comboCount = 0;
    }

    if (this.attackTimer <= 0 && dist > 80) {
      this.scene.events.emit('boss-attack', this, 'magic');
      this.attackTimer = this.currentPhase === 'phase3' ? 600 : 1000;
    }

    if (this.specialTimer <= 0) {
      if (this.currentPhase === 'phase2') {
        this.scene.events.emit('boss-summon', this);
        this.specialTimer = 8000;
      } else if (this.currentPhase === 'phase3') {
        this.invulnerable = true;
        this.invulnTimer = 2000;
        this.scene.events.emit('boss-rage', this);
        this.specialTimer = 6000;
      }
    }
  }
}
