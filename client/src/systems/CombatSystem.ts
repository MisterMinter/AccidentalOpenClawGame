import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';

export class CombatSystem {
  private scene: Phaser.Scene;
  private player: Player;
  private enemies: Phaser.Physics.Arcade.Group;
  private playerProjectiles: Phaser.Physics.Arcade.Group;
  private enemyProjectiles: Phaser.Physics.Arcade.Group;
  private meleeHitThisSwing: Set<Enemy> = new Set();
  private wasAttacking = false;

  constructor(
    scene: Phaser.Scene,
    player: Player,
    enemies: Phaser.Physics.Arcade.Group,
    playerProjectiles: Phaser.Physics.Arcade.Group,
    enemyProjectiles: Phaser.Physics.Arcade.Group
  ) {
    this.scene = scene;
    this.player = player;
    this.enemies = enemies;
    this.playerProjectiles = playerProjectiles;
    this.enemyProjectiles = enemyProjectiles;

    this.setupCollisions();
    this.setupEvents();
  }

  private setupCollisions(): void {
    this.scene.physics.add.overlap(
      this.player,
      this.enemyProjectiles,
      this.onPlayerHitByProjectile as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.scene.physics.add.overlap(
      this.playerProjectiles,
      this.enemies,
      this.onEnemyHitByProjectile as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.scene.physics.add.overlap(
      this.player,
      this.enemies,
      this.onPlayerTouchEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
  }

  private setupEvents(): void {
    this.scene.events.on('enemy-attack', (enemy: Enemy) => {
      const dirX = enemy.facing === 'left' ? -1 : 1;
      const proj = new Projectile(
        this.scene, enemy.x + dirX * 16, enemy.y, 'enemy_bullet', dirX
      );
      this.enemyProjectiles.add(proj);
    });
  }

  update(time: number, delta: number): void {
    if (!this.player.pState.isAttacking && this.wasAttacking) {
      this.meleeHitThisSwing.clear();
    }
    this.wasAttacking = this.player.pState.isAttacking;

    this.checkMeleeHits();
  }

  private checkMeleeHits(): void {
    const attackBounds = this.player.getAttackBounds();
    if (!attackBounds) return;

    const enemies = [...this.enemies.getChildren()] as Enemy[];
    for (const enemy of enemies) {
      if (enemy.aiState === 'dead') continue;
      if (this.meleeHitThisSwing.has(enemy)) continue;
      const enemyBounds = enemy.getBounds();
      if (Phaser.Geom.Rectangle.Overlaps(attackBounds, enemyBounds)) {
        this.meleeHitThisSwing.add(enemy);
        const knockDir = this.player.pState.facing === 'right' ? 1 : -1;
        enemy.takeDamage(20, knockDir);
        if (enemy.health <= 0) {
          this.player.addScore(enemy.config.scoreValue);
        }
      }
    }
  }

  private onPlayerHitByProjectile(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    proj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ): void {
    if (this.player.pState.invincible || this.player.pState.isDead) return;
    const projectile = proj as unknown as Projectile;
    const knockDir = projectile.x < this.player.x ? 1 : -1;
    this.player.takeDamage(projectile.damage, knockDir);
    projectile.onHit();
  }

  private onEnemyHitByProjectile(
    proj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ): void {
    const projectile = proj as unknown as Projectile;
    const enemy = enemyObj as unknown as Enemy;
    if (enemy.aiState === 'dead') return;
    const knockDir = projectile.x < enemy.x ? 1 : -1;
    enemy.takeDamage(projectile.damage, knockDir);
    if (enemy.health <= 0) {
      this.player.addScore(enemy.config.scoreValue);
    }
    projectile.onHit();
  }

  private onPlayerTouchEnemy(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ): void {
    if (this.player.pState.invincible || this.player.pState.isDead) return;
    const enemy = enemyObj as unknown as Enemy;
    if (enemy.aiState === 'dead') return;
    const knockDir = enemy.x < this.player.x ? 1 : -1;
    this.player.takeDamage(enemy.config.damage, knockDir);
  }

  fireWeapon(weapon: string, facing: string): void {
    const dirX = facing === 'right' ? 1 : -1;
    const offsetX = dirX * 20;

    switch (weapon) {
      case 'pistol':
        if (this.player.pState.ammo.pistol > 0) {
          this.player.pState.ammo.pistol--;
          const bullet = new Projectile(this.scene, this.player.x + offsetX, this.player.y, 'pistol', dirX);
          this.playerProjectiles.add(bullet);
        }
        break;
      case 'dynamite':
        if (this.player.pState.ammo.dynamite > 0) {
          this.player.pState.ammo.dynamite--;
          const dyn = new Projectile(this.scene, this.player.x + offsetX, this.player.y - 8, 'dynamite', dirX);
          this.playerProjectiles.add(dyn);
        }
        break;
      case 'magic':
        if (this.player.pState.ammo.magic > 0) {
          this.player.pState.ammo.magic--;
          const mag = new Projectile(this.scene, this.player.x + offsetX, this.player.y, 'magic', dirX);
          this.playerProjectiles.add(mag);
        }
        break;
    }
  }
}
