import { Boss, BossConfig } from '../Boss';

const CONFIG: BossConfig = {
  key: 'boss_gabriel',
  name: 'Gabriel',
  maxHealth: 500,
  damage: 25,
  speed: 70,
  scoreValue: 40000,
  phaseThresholds: [0.5, 0.2],
};

export class Gabriel extends Boss {
  private summonTimer = 0;

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

    this.summonTimer = Math.max(0, this.summonTimer - delta);

    body.setVelocityX(dir * this.config.speed);

    if (this.attackTimer <= 0 && dist < 60) {
      this.scene.events.emit('boss-attack', this, 'melee');
      this.attackTimer = 900;
    }

    if (this.attackTimer <= 0 && dist > 80) {
      this.scene.events.emit('boss-attack', this, 'ranged');
      this.attackTimer = this.currentPhase === 'phase3' ? 800 : 1500;
    }

    if (this.summonTimer <= 0 && this.currentPhase !== 'phase1') {
      this.scene.events.emit('boss-summon', this);
      this.summonTimer = this.currentPhase === 'phase3' ? 6000 : 10000;
    }
  }
}
