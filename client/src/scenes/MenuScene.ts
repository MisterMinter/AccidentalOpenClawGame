import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { telegram } from '../utils/TelegramBridge';
import { LevelManager, LEVELS } from '../levels/LevelManager';

export class MenuScene extends Phaser.Scene {
  private levelManager!: LevelManager;
  private showingLevelSelect = false;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.levelManager = new LevelManager();

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fillStyle(0x2a1a3e, 0.5);
    bg.fillRect(0, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT / 2);

    this.add.image(GAME_WIDTH / 2, 60, 'logo').setOrigin(0.5);

    this.createStars();
    this.showMainMenu();

    if (telegram.isTelegram) {
      telegram.hideBackButton();
    }

    // Ensure the canvas gets keyboard focus
    this.game.canvas.setAttribute('tabindex', '0');
    this.game.canvas.focus();
  }

  private createStars(): void {
    for (let i = 0; i < 20; i++) {
      const star = this.add.graphics();
      star.fillStyle(0xffcc44, Phaser.Math.FloatBetween(0.2, 0.6));
      star.fillCircle(0, 0, Phaser.Math.Between(1, 2));
      star.setPosition(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT)
      );
      this.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 0.8 },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private showMainMenu(): void {
    this.showingLevelSelect = false;
    this.clearUI();

    const startBtn = this.createButton(GAME_WIDTH / 2, 140, 'START GAME');
    startBtn.on('pointerdown', () => {
      telegram.haptic('medium');
      this.startGame(this.levelManager.getCurrentLevel().id);
    });

    const selectBtn = this.createButton(GAME_WIDTH / 2, 190, 'SELECT LEVEL');
    selectBtn.on('pointerdown', () => {
      telegram.haptic('light');
      this.showLevelSelect();
    });

    const userName = telegram.user?.first_name ?? 'Captain';
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, `Ahoy, ${userName}!`, {
      fontSize: '12px',
      color: '#8888aa',
    }).setOrigin(0.5).setName('ui');

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 22, 'Press ENTER or click START to play', {
      fontSize: '10px',
      color: '#666688',
    }).setOrigin(0.5).setName('ui');

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 10, 'v0.1.0', {
      fontSize: '9px',
      color: '#444466',
    }).setOrigin(0.5).setName('ui');

    // Keyboard shortcuts for menu
    if (this.input.keyboard) {
      this.input.keyboard.removeAllListeners();
      this.input.keyboard.on('keydown-ENTER', () => {
        if (!this.showingLevelSelect) {
          this.startGame(this.levelManager.getCurrentLevel().id);
        }
      });
      this.input.keyboard.on('keydown-SPACE', () => {
        if (!this.showingLevelSelect) {
          this.startGame(this.levelManager.getCurrentLevel().id);
        }
      });
      this.input.keyboard.on('keydown-ESC', () => {
        if (this.showingLevelSelect) {
          this.showMainMenu();
        }
      });
    }
  }

  private showLevelSelect(): void {
    this.showingLevelSelect = true;
    this.clearUI();

    if (telegram.isTelegram) {
      telegram.showBackButton(() => {
        this.showMainMenu();
        telegram.hideBackButton();
      });
    }

    this.add.text(GAME_WIDTH / 2, 100, 'SELECT LEVEL', {
      fontSize: '16px',
      color: '#ffcc44',
      fontStyle: 'bold',
    }).setOrigin(0.5).setName('ui');

    const unlocked = this.levelManager.getUnlockedLevels();
    const cols = 5;
    const startX = 60;
    const startY = 130;
    const spacingX = 75;
    const spacingY = 50;

    LEVELS.forEach((level, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * spacingX;
      const y = startY + row * spacingY;
      const locked = (i + 1) > unlocked;

      const btn = this.add.graphics().setName('ui');
      const color = locked ? 0x333344 : 0xffcc44;
      btn.fillStyle(color, locked ? 0.4 : 1);
      btn.fillRoundedRect(x - 25, y - 15, 50, 30, 6);

      this.add.text(x, y - 4, `${level.id}`, {
        fontSize: '14px',
        color: locked ? '#555566' : '#1a1a2e',
        fontStyle: 'bold',
      }).setOrigin(0.5).setName('ui');

      this.add.text(x, y + 10, locked ? '???' : level.name, {
        fontSize: '7px',
        color: locked ? '#444455' : '#cccc88',
      }).setOrigin(0.5).setName('ui');

      if (!locked) {
        btn.setInteractive(
          new Phaser.Geom.Rectangle(x - 25, y - 15, 50, 30),
          Phaser.Geom.Rectangle.Contains
        );
        btn.on('pointerdown', () => {
          telegram.haptic('medium');
          this.startGame(level.id);
        });
      }
    });

    const backBtn = this.createButton(GAME_WIDTH / 2, GAME_HEIGHT - 35, 'BACK');
    backBtn.on('pointerdown', () => {
      telegram.haptic('light');
      this.showMainMenu();
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 12, 'Press ESC to go back', {
      fontSize: '9px',
      color: '#666688',
    }).setOrigin(0.5).setName('ui');
  }

  private createButton(x: number, y: number, text: string): Phaser.GameObjects.Container {
    const bg = this.add.image(0, 0, 'button').setDisplaySize(130, 36);
    const label = this.add.text(0, 0, text, {
      fontSize: '13px',
      color: '#1a1a2e',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const container = this.add.container(x, y, [bg, label]).setName('ui');
    container.setSize(130, 36);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-65, -18, 130, 36),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerover', () => bg.setTint(0xffffaa));
    container.on('pointerout', () => bg.clearTint());

    return container;
  }

  private clearUI(): void {
    this.children.getAll()
      .filter(child => child.name === 'ui')
      .forEach(child => child.destroy());
  }

  private startGame(levelId: number): void {
    this.levelManager.setLevel(levelId);
    this.scene.start('GameScene', { levelId });
  }
}
