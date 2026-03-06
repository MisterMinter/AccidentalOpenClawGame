import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { HUDScene } from './scenes/HUDScene';
import { BossScene } from './scenes/BossScene';
import { PauseScene } from './scenes/PauseScene';

export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 400;
export const TILE_SIZE = 32;

export const PHYSICS_CONFIG: Phaser.Types.Physics.Arcade.ArcadeWorldConfig = {
  gravity: { x: 0, y: 900 },
  debug: false,
};

export function createGameConfig(): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: document.body,
    backgroundColor: '#1a1a2e',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: PHYSICS_CONFIG,
    },
    scene: [BootScene, MenuScene, GameScene, HUDScene, BossScene, PauseScene],
    pixelArt: true,
    roundPixels: true,
    input: {
      keyboard: true,
      activePointers: 3,
    },
  };
}
