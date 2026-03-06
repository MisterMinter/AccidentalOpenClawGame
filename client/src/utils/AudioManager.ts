import Phaser from 'phaser';

export class AudioManager {
  private scene: Phaser.Scene;
  private music: Phaser.Sound.BaseSound | null = null;
  private sfxVolume = 0.6;
  private musicVolume = 0.4;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  playMusic(key: string, loop = true): void {
    if (this.music) {
      this.music.stop();
      this.music.destroy();
    }
    if (this.scene.cache.audio.exists(key)) {
      this.music = this.scene.sound.add(key, { volume: this.musicVolume, loop });
      this.music.play();
    }
  }

  stopMusic(): void {
    this.music?.stop();
    this.music = null;
  }

  playSfx(key: string, volume?: number): void {
    if (this.scene.cache.audio.exists(key)) {
      this.scene.sound.play(key, { volume: volume ?? this.sfxVolume });
    }
  }

  setMusicVolume(v: number): void {
    this.musicVolume = v;
  }

  setSfxVolume(v: number): void {
    this.sfxVolume = v;
  }
}
