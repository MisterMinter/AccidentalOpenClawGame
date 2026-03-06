import Phaser from 'phaser';

export type CollectibleType = 'gem_red' | 'gem_green' | 'gem_blue' | 'gem_purple'
  | 'treasure' | 'health' | 'ammo_pistol' | 'ammo_dynamite' | 'ammo_magic'
  | 'extra_life' | 'catnip' | 'gem_piece';

export interface CollectibleConfig {
  type: CollectibleType;
  value: number;
  spriteKey: string;
  frame: number;
}

const COLLECTIBLE_VALUES: Record<CollectibleType, number> = {
  gem_red: 100,
  gem_green: 250,
  gem_blue: 500,
  gem_purple: 1000,
  treasure: 5000,
  health: 25,
  ammo_pistol: 5,
  ammo_dynamite: 3,
  ammo_magic: 1,
  extra_life: 0,
  catnip: 0,
  gem_piece: 0,
};

export class Collectible extends Phaser.Physics.Arcade.Sprite {
  collectibleType: CollectibleType;
  value: number;
  private collected = false;
  private bobTime = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, type: CollectibleType, frame: number = 0) {
    super(scene, x, y, 'collectibles', frame);
    this.collectibleType = type;
    this.value = COLLECTIBLE_VALUES[type];

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as unknown as Phaser.GameObjects.GameObject);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    this.setSize(24, 24);
    this.setDepth(5);

    if (type === 'gem_piece') {
      this.setScale(1.5);
    }

    this.bobTime = Math.random() * Math.PI * 2;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.collected) return;
    this.bobTime += delta * 0.004;
    const pulse = 1 + Math.sin(this.bobTime) * 0.15;
    this.setScale(pulse);
  }

  collect(): { type: CollectibleType; value: number } | null {
    if (this.collected) return null;
    this.collected = true;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;

    const result = { type: this.collectibleType, value: this.value };

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 300,
      onComplete: () => this.destroy(),
    });

    return result;
  }
}
