import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.createLoadingBar();
  }

  private createLoadingBar(): void {
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;
    const barW = w * 0.6;
    const barH = 16;

    const bg = this.add.graphics();
    bg.fillStyle(0x222244, 1);
    bg.fillRect(0, 0, w, h);

    this.add.text(w / 2, h / 2 - 40, 'OPENCLAW', {
      fontSize: '28px',
      color: '#ffcc44',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x444466, 0.8);
    progressBox.fillRect(w / 2 - barW / 2, h / 2, barW, barH);
  }

  create(): void {
    this.generateAllAssets();
    this.scene.start('MenuScene');
  }

  private generateAllAssets(): void {
    this.generatePlayerSprites();
    this.generateEnemySprites();
    this.generateBossSprites();
    this.generateCollectibleSprites();
    this.generateProjectileSprites();
    this.generateTilesets();
    this.generateUIAssets();
  }

  private addFramesToCanvas(
    canvas: Phaser.Textures.CanvasTexture,
    frameW: number,
    frameH: number,
    count: number
  ): void {
    for (let i = 0; i < count; i++) {
      canvas.add(i, 0, i * frameW, 0, frameW, frameH);
    }
  }

  private addGridFramesToCanvas(
    canvas: Phaser.Textures.CanvasTexture,
    tileW: number,
    tileH: number,
    cols: number,
    rows: number
  ): void {
    let idx = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        canvas.add(idx, 0, col * tileW, row * tileH, tileW, tileH);
        idx++;
      }
    }
  }

  private generatePlayerSprites(): void {
    const fw = 32;
    const fh = 32;
    const count = 12;
    const canvas = this.textures.createCanvas('player', fw * count, fh)!;
    const ctx = canvas.getContext();

    for (let i = 0; i < count; i++) {
      const x = i * fw;

      ctx.fillStyle = '#e88833';
      ctx.fillRect(x + 8, 8, 16, 18);

      ctx.fillStyle = '#ffaa44';
      ctx.fillRect(x + 9, 2, 14, 12);

      // Cat ears
      ctx.fillStyle = '#ffaa44';
      ctx.beginPath();
      ctx.moveTo(x + 9, 4); ctx.lineTo(x + 7, 0); ctx.lineTo(x + 12, 3);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 23, 4); ctx.lineTo(x + 25, 0); ctx.lineTo(x + 20, 3);
      ctx.fill();

      ctx.fillStyle = '#111';
      ctx.fillRect(x + 12, 6, 2, 3);
      ctx.fillRect(x + 18, 6, 2, 3);

      // Pirate hat
      ctx.fillStyle = '#222';
      ctx.fillRect(x + 7, 0, 18, 4);
      ctx.fillStyle = '#cc2222';
      ctx.fillRect(x + 10, 0, 12, 2);

      // Legs with walk offset per frame
      ctx.fillStyle = '#996633';
      const legShift = Math.round(Math.sin(i * 1.2) * 2);
      ctx.fillRect(x + 10, 26 + (i >= 2 && i <= 5 ? legShift : 0), 4, 6);
      ctx.fillRect(x + 18, 26 + (i >= 2 && i <= 5 ? -legShift : 0), 4, 6);

      // Sword for attack frames
      if (i >= 8 && i <= 9) {
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(x + 24, 10, 8, 2);
        ctx.fillStyle = '#886622';
        ctx.fillRect(x + 22, 9, 3, 4);
      }

      // Hurt tint (frame 10)
      if (i === 10) {
        ctx.fillStyle = 'rgba(255,0,0,0.3)';
        ctx.fillRect(x, 0, fw, fh);
      }

      // Tail
      ctx.strokeStyle = '#e88833';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 8, 20);
      ctx.quadraticCurveTo(x + 2, 16, x + 4, 12);
      ctx.stroke();
    }

    canvas.refresh();
    this.addFramesToCanvas(canvas, fw, fh, count);

    this.anims.create({ key: 'player-idle', frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
    this.anims.create({ key: 'player-run', frames: this.anims.generateFrameNumbers('player', { start: 2, end: 5 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'player-jump', frames: this.anims.generateFrameNumbers('player', { start: 6, end: 6 }), frameRate: 1, repeat: 0 });
    this.anims.create({ key: 'player-fall', frames: this.anims.generateFrameNumbers('player', { start: 7, end: 7 }), frameRate: 1, repeat: 0 });
    this.anims.create({ key: 'player-attack', frames: this.anims.generateFrameNumbers('player', { start: 8, end: 9 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'player-hurt', frames: this.anims.generateFrameNumbers('player', { start: 10, end: 10 }), frameRate: 1, repeat: 0 });
    this.anims.create({ key: 'player-die', frames: this.anims.generateFrameNumbers('player', { start: 11, end: 11 }), frameRate: 1, repeat: 0 });
  }

  private generateSpriteSheet(
    key: string,
    bodyColor: string,
    headColor: string,
    frameCount: number,
    accentColor?: string
  ): void {
    const fw = 32;
    const fh = 32;
    const canvas = this.textures.createCanvas(key, fw * frameCount, fh)!;
    const ctx = canvas.getContext();

    for (let i = 0; i < frameCount; i++) {
      const x = i * fw;
      ctx.fillStyle = bodyColor;
      ctx.fillRect(x + 8, 10, 16, 16);
      ctx.fillStyle = headColor;
      ctx.fillRect(x + 10, 2, 12, 12);
      ctx.fillStyle = accentColor ? '#ff2222' : '#111';
      ctx.fillRect(x + 13, 6, 2, 2);
      ctx.fillRect(x + 17, 6, 2, 2);
      ctx.fillStyle = bodyColor;
      ctx.fillRect(x + 10, 26, 4, 6);
      ctx.fillRect(x + 18, 26, 4, 6);
      if (i >= 4) {
        ctx.fillStyle = accentColor || '#cccccc';
        ctx.fillRect(x + 24, 12, 6, 2);
      }
      if (accentColor) {
        ctx.fillStyle = accentColor;
        ctx.fillRect(x + 8, 0, 4, 3);
        ctx.fillRect(x + 20, 0, 4, 3);
      }
    }
    canvas.refresh();
    this.addFramesToCanvas(canvas, fw, fh, frameCount);
  }

  private generateEnemySprites(): void {
    const types = [
      { key: 'officer', body: '#4444aa', head: '#6666cc' },
      { key: 'soldier', body: '#44aa44', head: '#66cc66' },
      { key: 'rat', body: '#888866', head: '#aaaa88' },
      { key: 'cutthroat', body: '#aa4444', head: '#cc6666' },
      { key: 'robber_thief', body: '#664488', head: '#8866aa' },
      { key: 'town_guard', body: '#888888', head: '#aaaaaa' },
      { key: 'seagull', body: '#cccccc', head: '#eeeeee' },
      { key: 'guard_dog', body: '#886644', head: '#aa8866' },
      { key: 'bear_sailor', body: '#664422', head: '#886644' },
      { key: 'red_tail_pirate', body: '#cc4422', head: '#ee6644' },
      { key: 'crab', body: '#cc4444', head: '#ee6666' },
      { key: 'peg_leg', body: '#886622', head: '#aa8844' },
      { key: 'crazy_hook', body: '#664444', head: '#886666' },
      { key: 'mercat', body: '#44aaaa', head: '#66cccc' },
      { key: 'siren', body: '#aa44aa', head: '#cc66cc' },
      { key: 'tiger_guard', body: '#cc8822', head: '#eeaa44' },
    ];

    for (const e of types) {
      this.generateSpriteSheet(e.key, e.body, e.head, 6);
      this.anims.create({ key: `${e.key}-idle`, frames: this.anims.generateFrameNumbers(e.key, { start: 0, end: 1 }), frameRate: 3, repeat: -1 });
      this.anims.create({ key: `${e.key}-walk`, frames: this.anims.generateFrameNumbers(e.key, { start: 2, end: 3 }), frameRate: 6, repeat: -1 });
      this.anims.create({ key: `${e.key}-attack`, frames: this.anims.generateFrameNumbers(e.key, { start: 4, end: 5 }), frameRate: 8, repeat: 0 });
    }
  }

  private generateBossSprites(): void {
    const bosses = [
      { key: 'boss_le_rauxe', body: '#6644aa', head: '#8866cc', accent: '#ffcc44' },
      { key: 'boss_katherine', body: '#aa4466', head: '#cc6688', accent: '#44cccc' },
      { key: 'boss_wolvington', body: '#444466', head: '#666688', accent: '#cc4444' },
      { key: 'boss_gabriel', body: '#446644', head: '#668866', accent: '#ffaa44' },
      { key: 'boss_marrow', body: '#664444', head: '#886666', accent: '#ffffff' },
      { key: 'boss_aquatis', body: '#224488', head: '#4466aa', accent: '#44ffcc' },
      { key: 'boss_omar', body: '#886622', head: '#aa8844', accent: '#ff4444' },
    ];

    for (const b of bosses) {
      this.generateSpriteSheet(b.key, b.body, b.head, 6, b.accent);
      this.anims.create({ key: `${b.key}-idle`, frames: this.anims.generateFrameNumbers(b.key, { start: 0, end: 1 }), frameRate: 3, repeat: -1 });
      this.anims.create({ key: `${b.key}-walk`, frames: this.anims.generateFrameNumbers(b.key, { start: 2, end: 3 }), frameRate: 6, repeat: -1 });
      this.anims.create({ key: `${b.key}-attack`, frames: this.anims.generateFrameNumbers(b.key, { start: 4, end: 5 }), frameRate: 8, repeat: 0 });
    }
  }

  private generateCollectibleSprites(): void {
    const fw = 32;
    const fh = 32;
    const count = 12;
    const canvas = this.textures.createCanvas('collectibles', fw * count, fh)!;
    const ctx = canvas.getContext();

    const items: { color: string; glow: string; shape: 'diamond' | 'circle' | 'rect' | 'star' }[] = [
      { color: '#ff4444', glow: '#ff0000', shape: 'diamond' },   // gem_red
      { color: '#44ff44', glow: '#00ff00', shape: 'diamond' },   // gem_green
      { color: '#6666ff', glow: '#4444ff', shape: 'diamond' },   // gem_blue
      { color: '#cc66ff', glow: '#aa44ff', shape: 'diamond' },   // gem_purple
      { color: '#ffcc00', glow: '#ffaa00', shape: 'rect' },      // treasure
      { color: '#ff4488', glow: '#ff2266', shape: 'circle' },    // health
      { color: '#dddddd', glow: '#ffffff', shape: 'circle' },    // ammo_pistol
      { color: '#aa6633', glow: '#cc8844', shape: 'circle' },    // ammo_dynamite
      { color: '#aa66ff', glow: '#8844ff', shape: 'circle' },    // ammo_magic
      { color: '#44ff88', glow: '#22ff66', shape: 'circle' },    // extra_life
      { color: '#ffff44', glow: '#ffff00', shape: 'star' },      // catnip
      { color: '#ffffff', glow: '#ffff88', shape: 'star' },      // gem_piece
    ];

    items.forEach((item, i) => {
      const cx = i * fw + fw / 2;
      const cy = fh / 2;

      ctx.save();
      ctx.shadowColor = item.glow;
      ctx.shadowBlur = 6;

      ctx.fillStyle = item.color;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;

      if (item.shape === 'diamond') {
        const s = 10;
        ctx.beginPath();
        ctx.moveTo(cx, cy - s); ctx.lineTo(cx + s - 2, cy);
        ctx.lineTo(cx, cy + s); ctx.lineTo(cx - s + 2, cy);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.moveTo(cx, cy - s); ctx.lineTo(cx + s - 2, cy);
        ctx.lineTo(cx, cy); ctx.lineTo(cx - s + 2, cy);
        ctx.closePath(); ctx.fill();
      } else if (item.shape === 'circle') {
        ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath(); ctx.arc(cx - 2, cy - 2, 5, 0, Math.PI * 2); ctx.fill();
      } else if (item.shape === 'star') {
        this.drawStar(ctx, cx, cy, 5, 12, 6);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        this.drawStar(ctx, cx, cy - 1, 5, 8, 4);
        ctx.fill();
      } else {
        ctx.fillRect(cx - 8, cy - 6, 16, 12);
        ctx.strokeRect(cx - 8, cy - 6, 16, 12);
        ctx.fillStyle = '#ffee88';
        ctx.fillRect(cx - 5, cy - 3, 10, 6);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(cx - 8, cy - 6, 16, 5);
      }
      ctx.restore();
    });

    canvas.refresh();
    this.addFramesToCanvas(canvas, fw, fh, count);
  }

  private drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, points: number, outerR: number, innerR: number): void {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  private generateProjectileSprites(): void {
    const fw = 16;
    const fh = 16;
    const canvas = this.textures.createCanvas('projectiles', fw * 4, fh)!;
    const ctx = canvas.getContext();

    ctx.fillStyle = '#ffcc44';
    ctx.fillRect(4, 6, 8, 4);

    ctx.fillStyle = '#884422';
    ctx.fillRect(fw + 4, 2, 6, 10);
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(fw + 6, 0, 2, 4);

    ctx.fillStyle = '#8844ff';
    ctx.beginPath(); ctx.arc(fw * 2 + 8, 8, 5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#ff4444';
    ctx.beginPath(); ctx.arc(fw * 3 + 8, 8, 3, 0, Math.PI * 2); ctx.fill();

    canvas.refresh();
    this.addFramesToCanvas(canvas, fw, fh, 4);
  }

  private generateTilesets(): void {
    this.generateOneTileset('tiles_prison', '#4a4a5e', '#5a5a6e', '#6a6a7e', '#3a3a4e', '#2a2a3e', '#1a1a2e');
    this.generateOneTileset('tiles_woods', '#2a4a2a', '#3a5a3a', '#4a6a4a', '#1a3a1a', '#0a2a0a', '#0d2b1a');
    this.generateOneTileset('tiles_town', '#5a4a3a', '#6a5a4a', '#7a6a5a', '#4a3a2a', '#3a2a1a', '#2b1d0e');
    this.generateOneTileset('tiles_docks', '#3a4a5a', '#4a5a6a', '#5a6a7a', '#2a3a4a', '#1a2a3a', '#1a2a3e');
    this.generateOneTileset('tiles_cliffs', '#5a3a2a', '#6a4a3a', '#7a5a4a', '#4a2a1a', '#3a1a0a', '#2e1a1a');
    this.generateOneTileset('tiles_caves', '#2a2a4a', '#3a3a5a', '#4a4a6a', '#1a1a3a', '#0a0a2a', '#0a1a2e');
    this.generateOneTileset('tiles_temple', '#5a5a2a', '#6a6a3a', '#7a7a4a', '#4a4a1a', '#3a3a0a', '#2e2a0a');
  }

  private generateOneTileset(
    key: string, c1: string, c2: string, c3: string, c4: string, cDark: string, cBg: string
  ): void {
    const ts = TILE_SIZE;
    const cols = 8;
    const rows = 4;
    const canvas = this.textures.createCanvas(key, ts * cols, ts * rows)!;
    const ctx = canvas.getContext();

    // Tile 1: solid stone
    ctx.fillStyle = c1; ctx.fillRect(ts, 0, ts, ts);
    ctx.fillStyle = c4; ctx.fillRect(ts + 1, 1, ts - 2, ts - 2);
    this.drawBricks(ctx, ts, 0, ts);

    // Tile 2: platform top
    ctx.fillStyle = c2; ctx.fillRect(ts * 2, 0, ts, ts);
    ctx.fillStyle = c3; ctx.fillRect(ts * 2, 0, ts, 4);
    this.drawBricks(ctx, ts * 2, 0, ts);

    // Tile 3: dark fill
    ctx.fillStyle = cDark; ctx.fillRect(ts * 3, 0, ts, ts);

    // Tile 4: decoration chain
    ctx.fillStyle = cBg; ctx.fillRect(ts * 4, 0, ts, ts);
    ctx.fillStyle = '#888888';
    ctx.fillRect(ts * 4 + 14, 0, 4, ts);

    // Tile 5: window
    ctx.fillStyle = c1; ctx.fillRect(ts * 5, 0, ts, ts);
    ctx.fillStyle = '#1a1a4e'; ctx.fillRect(ts * 5 + 6, 4, 20, 24);
    ctx.fillStyle = c1;
    ctx.fillRect(ts * 5 + 15, 4, 2, 24);
    ctx.fillRect(ts * 5 + 6, 15, 20, 2);

    // Tile 6: spikes
    ctx.fillStyle = cBg; ctx.fillRect(ts * 6, 0, ts, ts);
    ctx.fillStyle = '#999999';
    for (let i = 0; i < 4; i++) {
      const sx = ts * 6 + i * 8 + 2;
      ctx.beginPath();
      ctx.moveTo(sx, ts); ctx.lineTo(sx + 4, ts - 12); ctx.lineTo(sx + 8, ts);
      ctx.fill();
    }

    // Tile 7: checkpoint flag
    ctx.fillStyle = cBg; ctx.fillRect(ts * 7, 0, ts, ts);
    ctx.fillStyle = '#886644'; ctx.fillRect(ts * 7 + 14, 0, 4, ts);
    ctx.fillStyle = '#ff4444'; ctx.fillRect(ts * 7 + 18, 2, 10, 8);

    // Row 2 - Tile 8: platform left edge
    ctx.fillStyle = c2; ctx.fillRect(0, ts, ts, ts);
    ctx.fillStyle = c3; ctx.fillRect(0, ts, ts, 4);
    ctx.fillStyle = c4; ctx.fillRect(0, ts, 4, ts);

    // Tile 9: platform right edge
    ctx.fillStyle = c2; ctx.fillRect(ts, ts, ts, ts);
    ctx.fillStyle = c3; ctx.fillRect(ts, ts, ts, 4);
    ctx.fillStyle = c4; ctx.fillRect(ts * 2 - 4, ts, 4, ts);

    // Tile 10: ladder
    ctx.fillStyle = '#886644';
    ctx.fillRect(ts * 2 + 4, ts, 4, ts);
    ctx.fillRect(ts * 2 + 24, ts, 4, ts);
    for (let r = 0; r < 4; r++) {
      ctx.fillRect(ts * 2 + 4, ts + r * 8 + 2, 24, 3);
    }

    // Tile 11: door/exit
    ctx.fillStyle = c1; ctx.fillRect(ts * 3, ts, ts, ts);
    ctx.fillStyle = '#886644'; ctx.fillRect(ts * 3 + 6, ts + 4, 20, 28);
    ctx.fillStyle = '#664422'; ctx.fillRect(ts * 3 + 8, ts + 6, 16, 24);
    ctx.fillStyle = '#ffcc44';
    ctx.beginPath(); ctx.arc(ts * 3 + 22, ts + 18, 2, 0, Math.PI * 2); ctx.fill();

    canvas.refresh();
    this.addGridFramesToCanvas(canvas, ts, ts, cols, rows);
  }

  private drawBricks(ctx: CanvasRenderingContext2D, ox: number, oy: number, s: number): void {
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ox, oy + s / 2); ctx.lineTo(ox + s, oy + s / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox + s / 2, oy); ctx.lineTo(ox + s / 2, oy + s / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox + s * 0.25, oy + s / 2); ctx.lineTo(ox + s * 0.25, oy + s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox + s * 0.75, oy + s / 2); ctx.lineTo(ox + s * 0.75, oy + s); ctx.stroke();
  }

  private generateUIAssets(): void {
    const heartCanvas = this.textures.createCanvas('heart', 16, 16)!;
    const hctx = heartCanvas.getContext();
    hctx.fillStyle = '#ff4466';
    hctx.beginPath();
    hctx.moveTo(8, 14);
    hctx.quadraticCurveTo(0, 8, 2, 3);
    hctx.quadraticCurveTo(5, 0, 8, 4);
    hctx.quadraticCurveTo(11, 0, 14, 3);
    hctx.quadraticCurveTo(16, 8, 8, 14);
    hctx.fill();
    heartCanvas.refresh();

    const btnCanvas = this.textures.createCanvas('button', 120, 40)!;
    const bctx = btnCanvas.getContext();
    bctx.fillStyle = '#ffcc44';
    bctx.strokeStyle = '#886622';
    bctx.lineWidth = 2;
    bctx.beginPath();
    bctx.roundRect(2, 2, 116, 36, 8);
    bctx.fill();
    bctx.stroke();
    btnCanvas.refresh();

    const logoCanvas = this.textures.createCanvas('logo', 240, 60)!;
    const lctx = logoCanvas.getContext();
    lctx.fillStyle = '#ffcc44';
    lctx.font = 'bold 36px monospace';
    lctx.textAlign = 'center';
    lctx.textBaseline = 'middle';
    lctx.fillText('OPENCLAW', 120, 30);
    lctx.strokeStyle = '#886622';
    lctx.lineWidth = 1;
    lctx.strokeText('OPENCLAW', 120, 30);
    logoCanvas.refresh();
  }
}
