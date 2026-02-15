import type { InputState, Vec2, ControlMode } from '../types';
import { normalize, sub, length, vec2 } from '../utils/rng';

type InputCallback = (state: InputState) => void;

export class InputManager {
  private keys = new Set<string>();
  private pointerPos: Vec2 | null = null;
  private pointerDown = false;
  private joystickDir: Vec2 = { x: 0, y: 0 };
  private joystickActive = false;
  private callback: InputCallback = () => {};
  private controlMode: ControlMode = 'auto';
  private isTouchDevice = false;

  // Joystick DOM elements
  private joystickZone: HTMLElement | null = null;
  private joystickBase: HTMLElement | null = null;
  private joystickThumb: HTMLElement | null = null;
  private joystickOrigin: Vec2 | null = null;
  private joystickTouchId: number | null = null;

  // Player world position — set by engine so mouse input can compute direction
  playerWorldPos: Vec2 = { x: 0, y: 0 };

  constructor() {
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  init(callback: InputCallback, controlMode: ControlMode): void {
    this.callback = callback;
    this.controlMode = controlMode;
    this.bindKeyboard();
    this.bindPointer();
    this.setupJoystick();
  }

  private useKeyboard(): boolean {
    return this.controlMode === 'keyboard' ||
      (this.controlMode === 'auto' && !this.isTouchDevice) ||
      this.controlMode === 'mouse';
  }

  private useMouse(): boolean {
    return this.controlMode === 'mouse' ||
      (this.controlMode === 'auto' && !this.isTouchDevice);
  }

  private useJoystick(): boolean {
    return this.controlMode === 'joystick' ||
      (this.controlMode === 'auto' && this.isTouchDevice);
  }

  getInput(): InputState {
    let dir: Vec2 = { x: 0, y: 0 };

    // Keyboard input
    if (this.useKeyboard()) {
      if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) dir.y -= 1;
      if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) dir.y += 1;
      if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) dir.x -= 1;
      if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) dir.x += 1;
      if (length(dir) > 0) {
        return { direction: normalize(dir), active: true };
      }
    }

    // Mouse follow (direction toward cursor)
    if (this.useMouse() && this.pointerDown && this.pointerPos) {
      const diff = sub(this.pointerPos, this.playerWorldPos);
      const d = length(diff);
      if (d > 3) {
        return { direction: normalize(diff), active: true };
      }
    }

    // Joystick
    if (this.useJoystick() && this.joystickActive) {
      const len = length(this.joystickDir);
      if (len > 0.15) {
        return { direction: normalize(this.joystickDir), active: true };
      }
    }

    return { direction: { x: 0, y: 0 }, active: false };
  }

  private bindKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
    });
  }

  private bindPointer(): void {
    const canvas = document.getElementById('canvas-maze') as HTMLCanvasElement;
    if (!canvas) return;

    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return; // joystick handles touch
      this.pointerDown = true;
      this.pointerPos = vec2(e.clientX, e.clientY);
      e.preventDefault();
    });

    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      if (this.pointerDown) {
        this.pointerPos = vec2(e.clientX, e.clientY);
      }
    });

    window.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'touch') return;
      this.pointerDown = false;
      this.pointerPos = null;
    });
  }

  private setupJoystick(): void {
    this.joystickZone = document.getElementById('joystick-zone');
    this.joystickBase = document.getElementById('joystick-base');
    this.joystickThumb = document.getElementById('joystick-thumb');

    if (!this.joystickZone || !this.joystickBase || !this.joystickThumb) return;

    this.joystickZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.joystickTouchId !== null) return;
      const touch = e.changedTouches[0];
      this.joystickTouchId = touch.identifier;
      this.joystickOrigin = vec2(touch.clientX, touch.clientY);

      // Position base at touch point
      this.joystickBase!.style.display = 'flex';
      this.joystickBase!.style.left = `${touch.clientX - 60}px`;
      this.joystickBase!.style.top = `${touch.clientY - 60}px`;
      this.joystickThumb!.style.transform = 'translate(0, 0)';
      this.joystickActive = true;
    }, { passive: false });

    this.joystickZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier !== this.joystickTouchId || !this.joystickOrigin) continue;

        const dx = touch.clientX - this.joystickOrigin.x;
        const dy = touch.clientY - this.joystickOrigin.y;
        const maxRadius = 50;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clamped = Math.min(dist, maxRadius);
        const angle = Math.atan2(dy, dx);

        const cx = Math.cos(angle) * clamped;
        const cy = Math.sin(angle) * clamped;

        this.joystickThumb!.style.transform = `translate(${cx}px, ${cy}px)`;
        this.joystickDir = { x: cx / maxRadius, y: cy / maxRadius };
      }
    }, { passive: false });

    const endTouch = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.joystickTouchId) {
          this.joystickTouchId = null;
          this.joystickOrigin = null;
          this.joystickActive = false;
          this.joystickDir = { x: 0, y: 0 };
          this.joystickBase!.style.display = 'none';
        }
      }
    };

    this.joystickZone.addEventListener('touchend', endTouch, { passive: false });
    this.joystickZone.addEventListener('touchcancel', endTouch, { passive: false });
  }

  showJoystick(show: boolean): void {
    if (this.joystickZone) {
      this.joystickZone.style.display = show ? 'block' : 'none';
    }
  }

  /** Convert screen coords to world for mouse follow */
  setScreenToWorld(fn: (sx: number, sy: number) => Vec2): void {
    this._screenToWorld = fn;
  }

  private _screenToWorld: (sx: number, sy: number) => Vec2 = (sx, sy) => vec2(sx, sy);

  getWorldPointerPos(): Vec2 | null {
    if (this.pointerPos) {
      return this._screenToWorld(this.pointerPos.x, this.pointerPos.y);
    }
    return null;
  }

  destroy(): void {
    this.keys.clear();
    this.pointerDown = false;
    this.pointerPos = null;
    this.joystickActive = false;
  }
}
