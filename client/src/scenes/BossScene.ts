import Phaser from 'phaser';
import { GAME_WIDTH } from '../config';
import { Boss } from '../entities/Boss';

export class BossScene extends Phaser.Scene {
  private boss!: Boss;
  private healthBar!: Phaser.GameObjects.Graphics;
  private nameText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'BossScene' });
  }

  init(data: { boss: Boss }): void {
    this.boss = data.boss;
  }

  create(): void {
    this.healthBar = this.add.graphics().setScrollFactor(0).setDepth(52);

    this.nameText = this.add.text(GAME_WIDTH / 2, 296, this.boss.config.name, {
      fontSize: '10px',
      color: '#ff4444',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(53);

    this.phaseText = this.add.text(GAME_WIDTH / 2, 308, '', {
      fontSize: '8px',
      color: '#cccccc',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(53);

    const introText = this.add.text(GAME_WIDTH / 2, 150, this.boss.config.name.toUpperCase(), {
      fontSize: '20px',
      color: '#ff4444',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(60);

    this.tweens.add({
      targets: introText,
      alpha: 0,
      y: 130,
      duration: 2000,
      delay: 500,
      onComplete: () => introText.destroy(),
    });

    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('boss-defeated', () => {
      this.showVictory();
    });
  }

  update(): void {
    if (!this.boss || this.boss.currentPhase === 'defeated') {
      this.healthBar?.clear();
      return;
    }
    this.drawHealthBar();
    this.updatePhaseText();
  }

  private drawHealthBar(): void {
    const barW = GAME_WIDTH * 0.6;
    const barH = 6;
    const x = (GAME_WIDTH - barW) / 2;
    const y = 288;
    const pct = this.boss.getHealthPercent();

    this.healthBar.clear();
    this.healthBar.fillStyle(0x333344, 0.8);
    this.healthBar.fillRect(x - 1, y - 1, barW + 2, barH + 2);

    const color = pct > 0.5 ? 0xcc4444 : pct > 0.25 ? 0xcc8844 : 0xffcc44;
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(x, y, barW * pct, barH);
  }

  private updatePhaseText(): void {
    const phase = this.boss.currentPhase;
    if (phase === 'intro') {
      this.phaseText.setText('Preparing...');
    } else {
      this.phaseText.setText('');
    }
  }

  private showVictory(): void {
    this.healthBar.clear();
    this.nameText.setText('');
    this.phaseText.setText('');

    const victoryText = this.add.text(GAME_WIDTH / 2, 150, 'BOSS DEFEATED!', {
      fontSize: '18px',
      color: '#ffcc44',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(60);

    const scoreText = this.add.text(GAME_WIDTH / 2, 175, `+${this.boss.config.scoreValue.toLocaleString()}`, {
      fontSize: '14px',
      color: '#44ff88',
    }).setOrigin(0.5).setDepth(60);

    this.tweens.add({
      targets: [victoryText, scoreText],
      alpha: 0,
      duration: 2000,
      delay: 2000,
      onComplete: () => {
        this.scene.stop();
      },
    });
  }
}
