import Phaser from 'phaser';

export type ProjectileType = 'pistol' | 'dynamite' | 'magic' | 'enemy_bullet';

const FRAME_MAP: Record<ProjectileType, number> = {
  pistol: 0,
  dynamite: 1,
  magic: 2,
  enemy_bullet: 3,
};

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  projectileType: ProjectileType;
  damage: number;
  private lifespan: number;
  private age = 0;
  private dead = false;

  constructor(
    scene: Phaser.Scene, x: number, y: number,
    type: ProjectileType, dirX: number, dirY: number = 0
  ) {
    super(scene, x, y, 'projectiles', FRAME_MAP[type]);
    this.projectileType = type;

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as unknown as Phaser.GameObjects.GameObject);

    const body = this.body as Phaser.Physics.Arcade.Body;
    this.setDepth(9);

    switch (type) {
      case 'pistol':
        this.damage = 15;
        this.lifespan = 2000;
        body.setVelocity(dirX * 300, 0);
        body.setAllowGravity(false);
        this.setSize(8, 4);
        break;
      case 'dynamite':
        this.damage = 40;
        this.lifespan = 3000;
        body.setVelocity(dirX * 200, -250);
        body.setBounce(0.4);
        this.setSize(8, 10);
        break;
      case 'magic':
        this.damage = 60;
        this.lifespan = 1500;
        body.setVelocity(dirX * 250, dirY * 100);
        body.setAllowGravity(false);
        this.setSize(12, 12);
        break;
      case 'enemy_bullet':
        this.damage = 10;
        this.lifespan = 3000;
        body.setVelocity(dirX * 180, dirY * 50);
        body.setAllowGravity(false);
        this.setSize(6, 6);
        break;
    }
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.dead) return;
    this.age += delta;
    if (this.age >= this.lifespan) {
      this.kill();
    }
  }

  private kill(): void {
    if (this.dead) return;
    this.dead = true;
    if (this.projectileType === 'dynamite') {
      this.scene.events.emit('explosion', this.x, this.y, this.damage);
    }
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    this.setActive(false).setVisible(false);
    this.destroy();
  }

  onHit(): void {
    this.kill();
  }
}
