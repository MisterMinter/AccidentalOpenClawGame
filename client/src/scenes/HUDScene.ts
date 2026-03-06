import Phaser from 'phaser';
import { GAME_WIDTH } from '../config';
import { Player } from '../entities/Player';
import { WeaponSystem } from '../systems/WeaponSystem';
import { LevelDef } from '../levels/LevelManager';

export class HUDScene extends Phaser.Scene {
  private player!: Player;
  private weaponSystem!: WeaponSystem;
  private levelDef!: LevelDef;

  private healthBar!: Phaser.GameObjects.Graphics;
  private healthText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private weaponText!: Phaser.GameObjects.Text;
  private ammoText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'HUDScene' });
  }

  init(data: { player: Player; levelDef: LevelDef; weaponSystem: WeaponSystem }): void {
    this.player = data.player;
    this.levelDef = data.levelDef;
    this.weaponSystem = data.weaponSystem;
  }

  create(): void {
    this.healthBar = this.add.graphics().setScrollFactor(0).setDepth(50);

    this.healthText = this.add.text(40, 6, '100', {
      fontSize: '10px', color: '#ffffff',
    }).setScrollFactor(0).setDepth(51);

    this.scoreText = this.add.text(GAME_WIDTH / 2, 6, 'SCORE: 0', {
      fontSize: '10px', color: '#ffcc44', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(51);

    this.livesText = this.add.text(GAME_WIDTH - 8, 6, '', {
      fontSize: '10px', color: '#ff4466',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(51);

    this.weaponText = this.add.text(8, 22, '', {
      fontSize: '9px', color: '#aaaacc',
    }).setScrollFactor(0).setDepth(51);

    this.ammoText = this.add.text(70, 22, '', {
      fontSize: '9px', color: '#ccccaa',
    }).setScrollFactor(0).setDepth(51);

    this.levelText = this.add.text(GAME_WIDTH - 8, 22, '', {
      fontSize: '9px', color: '#8888aa',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(51);
    this.levelText.setText(`${this.levelDef.id}. ${this.levelDef.name}`);

    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('score-changed', () => this.updateScore());
    gameScene.events.on('weapon-changed', () => this.updateWeapon());
    gameScene.events.on('extra-life', () => {
      this.updateLives();
      this.flashExtraLife();
    });
    gameScene.events.on('player-hurt', () => {
      this.updateHealthBar();
      this.updateLives();
    });
    gameScene.events.on('player-died', () => {
      this.updateHealthBar();
      this.updateLives();
    });

    this.updateHealthBar();
    this.updateScore();
    this.updateLives();
    this.updateWeapon();
  }

  update(): void {
    if (!this.player || this.player.pState.isDead) return;
    this.updateHealthBar();
  }

  private updateHealthBar(): void {
    const hp = this.player.pState.health;
    const maxHp = this.player.pState.maxHealth;
    const pct = hp / maxHp;
    const barW = 60;
    const barH = 8;

    this.healthBar.clear();
    this.healthBar.fillStyle(0x333344, 0.8);
    this.healthBar.fillRect(6, 6, barW + 2, barH + 2);

    const color = pct > 0.5 ? 0x44cc44 : pct > 0.25 ? 0xcccc44 : 0xcc4444;
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(7, 7, barW * pct, barH);

    this.healthText.setText(`${hp}`);
    this.healthText.setX(10 + barW + 4);
  }

  private updateScore(): void {
    this.scoreText.setText(`SCORE: ${this.player.pState.score.toLocaleString()}`);
  }

  private updateLives(): void {
    const hearts = '♥'.repeat(Math.max(0, this.player.pState.lives));
    this.livesText.setText(hearts);
  }

  private updateWeapon(): void {
    const weapon = this.weaponSystem.getCurrentWeapon();
    this.weaponText.setText(`[${weapon.toUpperCase()}]`);

    const ammo = this.weaponSystem.getAmmoCount();
    this.ammoText.setText(ammo === Infinity ? '' : `x${ammo}`);
  }

  private flashExtraLife(): void {
    const text = this.add.text(GAME_WIDTH / 2, 60, '+1 LIFE!', {
      fontSize: '16px', color: '#44ff88', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(60);

    this.tweens.add({
      targets: text,
      y: 40,
      alpha: 0,
      duration: 1500,
      onComplete: () => text.destroy(),
    });
  }
}
