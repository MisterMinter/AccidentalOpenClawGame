import { Player } from '../entities/Player';

const WEAPONS = ['sword', 'pistol', 'dynamite', 'magic'] as const;

export class WeaponSystem {
  private player: Player;

  constructor(player: Player) {
    this.player = player;
  }

  cycleWeapon(): void {
    const idx = WEAPONS.indexOf(this.player.pState.currentWeapon);
    const next = (idx + 1) % WEAPONS.length;
    this.player.pState.currentWeapon = WEAPONS[next];
  }

  getCurrentWeapon(): string {
    return this.player.pState.currentWeapon;
  }

  hasAmmo(): boolean {
    const weapon = this.player.pState.currentWeapon;
    if (weapon === 'sword') return true;
    return this.player.pState.ammo[weapon] > 0;
  }

  getAmmoCount(): number {
    const weapon = this.player.pState.currentWeapon;
    if (weapon === 'sword') return Infinity;
    return this.player.pState.ammo[weapon];
  }

  addAmmo(type: 'pistol' | 'dynamite' | 'magic', amount: number): void {
    this.player.pState.ammo[type] += amount;
  }
}
