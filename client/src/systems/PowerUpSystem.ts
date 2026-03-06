import { Player } from '../entities/Player';

export type PowerUpType = 'catnip' | 'double_jump' | 'health_boost';

export class PowerUpSystem {
  private player: Player;
  private activePowerUps: Map<PowerUpType, number> = new Map();
  private originalMaxHealth = 0;

  constructor(player: Player) {
    this.player = player;
    this.originalMaxHealth = player.pState.maxHealth;
  }

  activate(type: PowerUpType, duration: number = 10000): void {
    this.activePowerUps.set(type, duration);

    switch (type) {
      case 'catnip':
        this.player.activateCatnip(duration);
        break;
      case 'double_jump':
        this.player.pState.canDoubleJump = true;
        break;
      case 'health_boost':
        if (this.player.pState.maxHealth === this.originalMaxHealth) {
          this.player.pState.maxHealth += 25;
        }
        this.player.heal(25);
        break;
    }
  }

  update(delta: number): void {
    const expired: PowerUpType[] = [];
    for (const [type, remaining] of this.activePowerUps) {
      const newRemaining = remaining - delta;
      if (newRemaining <= 0) {
        expired.push(type);
      } else {
        this.activePowerUps.set(type, newRemaining);
      }
    }
    for (const type of expired) {
      this.deactivate(type);
      this.activePowerUps.delete(type);
    }
  }

  private deactivate(type: PowerUpType): void {
    switch (type) {
      case 'catnip':
        break;
      case 'double_jump':
        break;
      case 'health_boost':
        this.player.pState.maxHealth = this.originalMaxHealth;
        if (this.player.pState.health > this.player.pState.maxHealth) {
          this.player.pState.health = this.player.pState.maxHealth;
        }
        break;
    }
  }
}
