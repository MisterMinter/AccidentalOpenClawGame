import Phaser from 'phaser';

export class ParticleSystem {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupEvents();
  }

  private setupEvents(): void {
    this.scene.events.on('player-jump', () => {
      this.dustPuff(this.getPlayerPos().x, this.getPlayerPos().y + 14);
    });

    this.scene.events.on('player-hurt', () => {
      const pos = this.getPlayerPos();
      this.bloodSplash(pos.x, pos.y);
    });

    this.scene.events.on('enemy-killed', (enemy: any) => {
      this.deathPoof(enemy.x, enemy.y);
      this.scorePopup(enemy.x, enemy.y - 20, enemy.config?.scoreValue ?? 100);
    });

    this.scene.events.on('explosion', (x: number, y: number) => {
      this.explosion(x, y);
    });

    this.scene.events.on('boss-hurt', (boss: any) => {
      this.sparks(boss.x, boss.y);
    });

    this.scene.events.on('boss-defeated', (boss: any) => {
      this.bossExplosion(boss.x, boss.y);
    });
  }

  private getPlayerPos(): { x: number; y: number } {
    const player = (this.scene as any).player;
    return player ? { x: player.x, y: player.y } : { x: 0, y: 0 };
  }

  dustPuff(x: number, y: number): void {
    for (let i = 0; i < 4; i++) {
      const p = this.scene.add.graphics().setDepth(15);
      p.fillStyle(0x888888, 0.5);
      p.fillCircle(0, 0, Phaser.Math.Between(2, 4));
      p.setPosition(x + Phaser.Math.Between(-8, 8), y);

      this.scene.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(5, 15),
        x: p.x + Phaser.Math.Between(-10, 10),
        alpha: 0,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: Phaser.Math.Between(200, 400),
        onComplete: () => p.destroy(),
      });
    }
  }

  bloodSplash(x: number, y: number): void {
    for (let i = 0; i < 6; i++) {
      const p = this.scene.add.graphics().setDepth(15);
      p.fillStyle(0xff4444, 0.8);
      p.fillCircle(0, 0, Phaser.Math.Between(1, 3));
      p.setPosition(x, y);

      this.scene.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-30, 30),
        y: y + Phaser.Math.Between(-30, 10),
        alpha: 0,
        duration: Phaser.Math.Between(300, 600),
        onComplete: () => p.destroy(),
      });
    }
  }

  deathPoof(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const p = this.scene.add.graphics().setDepth(15);
      const color = Phaser.Math.RND.pick([0xffcc44, 0xffffff, 0x44ccff]);
      p.fillStyle(color, 0.9);
      p.fillCircle(0, 0, Phaser.Math.Between(2, 5));
      p.setPosition(x, y);

      const angle = (i / 8) * Math.PI * 2;
      const dist = Phaser.Math.Between(15, 35);

      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 500,
        onComplete: () => p.destroy(),
      });
    }
  }

  scorePopup(x: number, y: number, score: number): void {
    const text = this.scene.add.text(x, y, `+${score}`, {
      fontSize: '10px',
      color: '#ffcc44',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(20);

    this.scene.tweens.add({
      targets: text,
      y: y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy(),
    });
  }

  explosion(x: number, y: number): void {
    const flash = this.scene.add.graphics().setDepth(16);
    flash.fillStyle(0xffaa22, 0.8);
    flash.fillCircle(0, 0, 20);
    flash.setPosition(x, y);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 300,
      onComplete: () => flash.destroy(),
    });

    for (let i = 0; i < 12; i++) {
      const p = this.scene.add.graphics().setDepth(15);
      const color = Phaser.Math.RND.pick([0xff4422, 0xffaa22, 0xffcc44]);
      p.fillStyle(color, 0.9);
      p.fillCircle(0, 0, Phaser.Math.Between(2, 5));
      p.setPosition(x, y);

      const angle = (i / 12) * Math.PI * 2;
      const dist = Phaser.Math.Between(20, 50);

      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist - 10,
        alpha: 0,
        duration: Phaser.Math.Between(300, 700),
        onComplete: () => p.destroy(),
      });
    }

    this.scene.cameras.main.shake(150, 0.01);
  }

  sparks(x: number, y: number): void {
    for (let i = 0; i < 5; i++) {
      const p = this.scene.add.graphics().setDepth(15);
      p.fillStyle(0xffffff, 1);
      p.fillCircle(0, 0, 1);
      p.setPosition(x, y);

      this.scene.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-20, 20),
        y: y + Phaser.Math.Between(-20, 20),
        alpha: 0,
        duration: 200,
        onComplete: () => p.destroy(),
      });
    }
  }

  bossExplosion(x: number, y: number): void {
    let count = 0;
    const timer = this.scene.time.addEvent({
      delay: 150,
      repeat: 8,
      callback: () => {
        const ox = x + Phaser.Math.Between(-30, 30);
        const oy = y + Phaser.Math.Between(-30, 30);
        this.explosion(ox, oy);
        count++;
      },
    });
  }
}
