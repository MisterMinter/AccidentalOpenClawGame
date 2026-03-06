import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { telegram } from '../utils/TelegramBridge';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene' });
  }

  create(): void {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'PAUSED', {
      fontSize: '24px',
      color: '#ffcc44',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const resumeBtn = this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'RESUME');
    resumeBtn.on('pointerdown', () => {
      telegram.haptic('light');
      this.resumeGame();
    });

    const menuBtn = this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 45, 'MAIN MENU');
    menuBtn.on('pointerdown', () => {
      telegram.haptic('medium');
      this.goToMenu();
    });

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ESC', () => this.resumeGame());
    }
  }

  private createButton(x: number, y: number, text: string): Phaser.GameObjects.Container {
    const bg = this.add.image(0, 0, 'button').setDisplaySize(130, 36);
    const label = this.add.text(0, 0, text, {
      fontSize: '13px',
      color: '#1a1a2e',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const container = this.add.container(x, y, [bg, label]);
    container.setSize(130, 36);
    container.setInteractive();
    container.on('pointerover', () => bg.setTint(0xffffaa));
    container.on('pointerout', () => bg.clearTint());
    return container;
  }

  private resumeGame(): void {
    this.scene.resume('GameScene');
    this.scene.stop();
  }

  private goToMenu(): void {
    this.scene.stop('GameScene');
    this.scene.stop('HUDScene');
    this.scene.stop('BossScene');
    this.scene.stop();
    this.scene.start('MenuScene');
  }
}
