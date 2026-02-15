import type { Point, Layout } from './types';
import type { JoystickVector } from '../ui/joystick';

export type ControlMode = 'joystick' | 'drag';

interface KeyState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export class InputController {
  private target: HTMLElement;
  private mode: ControlMode = 'joystick';
  private pointerId: number | null = null;
  private pointerScreen: Point = { x: 0, y: 0 };
  private dragging = false;
  private keys: KeyState = { up: false, down: false, left: false, right: false };
  private layout: Layout | null = null;
  private joystick: { getVector: () => JoystickVector; setEnabled: (v: boolean) => void };

  constructor(target: HTMLElement, joystick: { getVector: () => JoystickVector; setEnabled: (v: boolean) => void }) {
    this.target = target;
    this.joystick = joystick;

    this.target.addEventListener('pointerdown', (event) => this.onPointerDown(event));
    this.target.addEventListener('pointermove', (event) => this.onPointerMove(event));
    this.target.addEventListener('pointerup', (event) => this.onPointerUp(event));
    this.target.addEventListener('pointercancel', (event) => this.onPointerUp(event));

    window.addEventListener('keydown', (event) => this.onKey(event, true));
    window.addEventListener('keyup', (event) => this.onKey(event, false));
  }

  setMode(mode: ControlMode): void {
    this.mode = mode;
    this.joystick.setEnabled(mode === 'joystick');
    if (mode !== 'drag') {
      this.dragging = false;
      this.pointerId = null;
    }
  }

  updateLayout(layout: Layout): void {
    this.layout = layout;
  }

  getMoveVector(playerPos: Point): Point {
    const keyVec = this.getKeyboardVector();
    if (keyVec.x !== 0 || keyVec.y !== 0) return keyVec;

    if (this.mode === 'joystick') {
      const joy = this.joystick.getVector();
      if (!joy.active) return { x: 0, y: 0 };
      return { x: joy.x, y: joy.y };
    }

    if (!this.dragging || !this.layout) return { x: 0, y: 0 };

    const target = this.screenToWorld(this.pointerScreen);
    const dx = target.x - playerPos.x;
    const dy = target.y - playerPos.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.001) return { x: 0, y: 0 };
    const maxDist = 1.5;
    const mag = Math.min(dist / maxDist, 1);
    return { x: (dx / dist) * mag, y: (dy / dist) * mag };
  }

  private onPointerDown(event: PointerEvent): void {
    if (this.mode !== 'drag') return;
    this.pointerId = event.pointerId;
    this.dragging = true;
    this.pointerScreen = { x: event.clientX, y: event.clientY };
    this.target.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.dragging || this.pointerId !== event.pointerId) return;
    this.pointerScreen = { x: event.clientX, y: event.clientY };
    event.preventDefault();
  }

  private onPointerUp(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId) return;
    this.dragging = false;
    this.pointerId = null;
  }

  private onKey(event: KeyboardEvent, pressed: boolean): void {
    const code = event.code;
    if (code === 'ArrowUp' || code === 'KeyW') this.keys.up = pressed;
    if (code === 'ArrowDown' || code === 'KeyS') this.keys.down = pressed;
    if (code === 'ArrowLeft' || code === 'KeyA') this.keys.left = pressed;
    if (code === 'ArrowRight' || code === 'KeyD') this.keys.right = pressed;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(code)) {
      event.preventDefault();
    }
  }

  private getKeyboardVector(): Point {
    const x = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
    const y = (this.keys.down ? 1 : 0) - (this.keys.up ? 1 : 0);
    if (x === 0 && y === 0) return { x: 0, y: 0 };
    const len = Math.hypot(x, y);
    return { x: x / len, y: y / len };
  }

  private screenToWorld(screen: Point): Point {
    const layout = this.layout as Layout;
    return {
      x: (screen.x - layout.offsetX) / layout.cellSizePx,
      y: (screen.y - layout.offsetY) / layout.cellSizePx
    };
  }
}
