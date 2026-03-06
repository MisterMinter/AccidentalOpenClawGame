import Phaser from 'phaser';
import { createGameConfig } from './config';
import { telegram } from './utils/TelegramBridge';

telegram.init();

const game = new Phaser.Game(createGameConfig());

game.events.on('ready', () => {
  game.canvas.setAttribute('tabindex', '0');
  game.canvas.style.outline = 'none';
  game.canvas.focus();
});

window.addEventListener('resize', () => {
  game.scale.refresh();
});

document.addEventListener('click', () => {
  game.canvas.focus();
});
