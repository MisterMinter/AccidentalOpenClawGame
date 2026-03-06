import Phaser from 'phaser';
import { telegram } from './TelegramBridge';

export interface GameInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  jumpJustPressed: boolean;
  attack: boolean;
  attackJustPressed: boolean;
  weaponSwitch: boolean;
}

export class InputManager {
  private scene: Phaser.Scene;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
    Z: Phaser.Input.Keyboard.Key;
    X: Phaser.Input.Keyboard.Key;
  };

  private touchState = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    jumpJustPressed: false,
    attack: false,
    attackJustPressed: false,
    weaponSwitch: false,
  };

  private dpadPointerId = -1;
  private jumpPointerId = -1;
  private attackPointerId = -1;

  private touchElements: Phaser.GameObjects.GameObject[] = [];
  private showTouch: boolean;
  private hudScene: Phaser.Scene | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const isDesktop = scene.sys.game.device.os.desktop;
    this.showTouch = !isDesktop || telegram.isTelegram;
  }

  create(): void {
    if (this.scene.input.keyboard) {
      this.cursors = this.scene.input.keyboard.createCursorKeys();
      this.keys = {
        W: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        SPACE: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        Z: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
        X: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
      };
    }

    if (this.showTouch) {
      this.createTouchControls();
    }
  }

  private createTouchControls(): void {
    this.hudScene = this.scene.scene.get('HUDScene');
    if (!this.hudScene) return;

    const cam = this.hudScene.cameras.main;
    const w = cam.width;
    const h = cam.height;

    const btnR = Math.max(28, Math.min(44, h * 0.11));
    const margin = Math.max(8, btnR * 0.35);
    const dpadX = margin + btnR * 1.2;
    const dpadY = h - margin - btnR * 1.2;
    const alpha = 0.3;

    // --- Left side: simplified left/right buttons ---
    const leftBtnG = this.hudScene.add.graphics();
    leftBtnG.fillStyle(0xffffff, alpha);
    this.roundedRect(leftBtnG, dpadX - btnR * 2.2, dpadY - btnR * 0.7, btnR * 1.8, btnR * 1.4, 8);
    leftBtnG.setScrollFactor(0).setDepth(100);
    this.touchElements.push(leftBtnG);

    const rightBtnG = this.hudScene.add.graphics();
    rightBtnG.fillStyle(0xffffff, alpha);
    this.roundedRect(rightBtnG, dpadX + btnR * 0.4, dpadY - btnR * 0.7, btnR * 1.8, btnR * 1.4, 8);
    rightBtnG.setScrollFactor(0).setDepth(100);
    this.touchElements.push(rightBtnG);

    const lbl = (x: number, y: number, txt: string, size: number) => {
      const t = this.hudScene!.add.text(x, y, txt, {
        fontSize: `${size}px`, color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setAlpha(0.6);
      this.touchElements.push(t);
      return t;
    };

    lbl(dpadX - btnR * 1.3, dpadY, '\u25C0', btnR * 0.5);
    lbl(dpadX + btnR * 1.3, dpadY, '\u25B6', btnR * 0.5);

    // --- Right side: Jump (big), Attack, Weapon switch ---
    const jumpCX = w - margin - btnR * 1.2;
    const jumpCY = dpadY - btnR * 0.5;
    const jumpG = this.hudScene.add.graphics();
    jumpG.fillStyle(0x44cc44, alpha);
    jumpG.fillCircle(jumpCX, jumpCY, btnR * 1.1);
    jumpG.setScrollFactor(0).setDepth(100);
    this.touchElements.push(jumpG);
    lbl(jumpCX, jumpCY, '\u25B2', btnR * 0.55);

    const atkCX = w - margin - btnR * 3.2;
    const atkCY = dpadY;
    const atkG = this.hudScene.add.graphics();
    atkG.fillStyle(0xcc4444, alpha);
    atkG.fillCircle(atkCX, atkCY, btnR * 0.9);
    atkG.setScrollFactor(0).setDepth(100);
    this.touchElements.push(atkG);
    lbl(atkCX, atkCY, '\u2694', btnR * 0.5);

    const swCX = w - margin - btnR * 2;
    const swCY = dpadY - btnR * 2.4;
    const swG = this.hudScene.add.graphics();
    swG.fillStyle(0x4488cc, alpha * 0.8);
    swG.fillCircle(swCX, swCY, btnR * 0.6);
    swG.setScrollFactor(0).setDepth(100);
    this.touchElements.push(swG);
    lbl(swCX, swCY, 'W', btnR * 0.35);

    this.setupTouchInput(dpadX, dpadY, btnR, jumpCX, jumpCY, atkCX, atkCY, swCX, swCY);
  }

  private roundedRect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, r: number): void {
    g.fillRoundedRect(x, y, w, h, r);
  }

  private setupTouchInput(
    dpadX: number, dpadY: number, btnR: number,
    jumpCX: number, jumpCY: number,
    atkCX: number, atkCY: number,
    swCX: number, swCY: number
  ): void {
    if (!this.hudScene) return;

    const leftZone = { x: dpadX - btnR * 1.3, y: dpadY, r: btnR * 1.4 };
    const rightZone = { x: dpadX + btnR * 1.3, y: dpadY, r: btnR * 1.4 };

    this.hudScene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.processTouch(pointer, leftZone, rightZone, jumpCX, jumpCY, btnR, atkCX, atkCY, swCX, swCY, true);
    });
    this.hudScene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        this.processTouch(pointer, leftZone, rightZone, jumpCX, jumpCY, btnR, atkCX, atkCY, swCX, swCY, false);
      }
    });
    this.hudScene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const pid = pointer.id;
      if (pid === this.dpadPointerId) {
        this.touchState.left = false;
        this.touchState.right = false;
        this.dpadPointerId = -1;
      }
      if (pid === this.jumpPointerId) {
        this.touchState.jump = false;
        this.jumpPointerId = -1;
      }
      if (pid === this.attackPointerId) {
        this.touchState.attack = false;
        this.attackPointerId = -1;
      }
    });
  }

  private processTouch(
    pointer: Phaser.Input.Pointer,
    leftZone: { x: number; y: number; r: number },
    rightZone: { x: number; y: number; r: number },
    jumpCX: number, jumpCY: number, btnR: number,
    atkCX: number, atkCY: number,
    swCX: number, swCY: number,
    isDown: boolean
  ): void {
    const px = pointer.x;
    const py = pointer.y;
    const pid = pointer.id;

    if (Phaser.Math.Distance.Between(px, py, leftZone.x, leftZone.y) < leftZone.r) {
      this.dpadPointerId = pid;
      this.touchState.left = true;
      this.touchState.right = false;
      return;
    }
    if (Phaser.Math.Distance.Between(px, py, rightZone.x, rightZone.y) < rightZone.r) {
      this.dpadPointerId = pid;
      this.touchState.right = true;
      this.touchState.left = false;
      return;
    }

    if (Phaser.Math.Distance.Between(px, py, jumpCX, jumpCY) < btnR * 1.4) {
      this.jumpPointerId = pid;
      this.touchState.jump = true;
      if (isDown) this.touchState.jumpJustPressed = true;
      return;
    }

    if (Phaser.Math.Distance.Between(px, py, atkCX, atkCY) < btnR * 1.2) {
      this.attackPointerId = pid;
      this.touchState.attack = true;
      if (isDown) this.touchState.attackJustPressed = true;
      return;
    }

    if (isDown && Phaser.Math.Distance.Between(px, py, swCX, swCY) < btnR * 0.9) {
      this.touchState.weaponSwitch = true;
      return;
    }
  }

  getInput(): GameInput {
    const kLeft = this.cursors?.left?.isDown || this.keys?.A?.isDown || false;
    const kRight = this.cursors?.right?.isDown || this.keys?.D?.isDown || false;
    const kUp = this.cursors?.up?.isDown || this.keys?.W?.isDown || false;
    const kDown = this.cursors?.down?.isDown || this.keys?.S?.isDown || false;
    const kJump = this.keys?.SPACE?.isDown || kUp || false;

    let kJumpJust = false;
    try {
      kJumpJust = !!(this.keys?.SPACE && Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) ||
                  !!(this.cursors?.up && Phaser.Input.Keyboard.JustDown(this.cursors.up)) ||
                  !!(this.keys?.W && Phaser.Input.Keyboard.JustDown(this.keys.W));
    } catch { /* keyboard not ready */ }

    const kAttack = this.keys?.Z?.isDown || this.keys?.X?.isDown || false;
    let kAttackJust = false;
    try {
      kAttackJust = !!(this.keys?.Z && Phaser.Input.Keyboard.JustDown(this.keys.Z)) ||
                    !!(this.keys?.X && Phaser.Input.Keyboard.JustDown(this.keys.X));
    } catch { /* keyboard not ready */ }

    const result: GameInput = {
      left: kLeft || this.touchState.left,
      right: kRight || this.touchState.right,
      up: kUp || this.touchState.up,
      down: kDown || this.touchState.down,
      jump: kJump || this.touchState.jump,
      jumpJustPressed: kJumpJust || this.touchState.jumpJustPressed,
      attack: kAttack || this.touchState.attack,
      attackJustPressed: kAttackJust || this.touchState.attackJustPressed,
      weaponSwitch: this.touchState.weaponSwitch,
    };

    this.touchState.jumpJustPressed = false;
    this.touchState.attackJustPressed = false;
    this.touchState.weaponSwitch = false;

    return result;
  }

  destroy(): void {
    for (const el of this.touchElements) {
      el.destroy();
    }
    this.touchElements = [];
  }
}
