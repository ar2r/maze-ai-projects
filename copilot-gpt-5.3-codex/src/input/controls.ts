import type { ControlMode, Vec2 } from '../core/types';

const DEAD_ZONE = 0.1;

export interface InputState {
  direction: Vec2;
  intensity: number;
}

interface PointerVecState {
  active: boolean;
  pointerId: number | null;
  lastX: number;
  lastY: number;
  vector: Vec2;
  intensity: number;
  followX: number;
  followY: number;
  hasFollowTarget: boolean;
}

interface JoystickState {
  active: boolean;
  pointerId: number | null;
  originX: number;
  originY: number;
  currentX: number;
  currentY: number;
}

export class InputController {
  private canvas: HTMLCanvasElement;
  private joystickArea: HTMLElement;
  private joystickThumb: HTMLElement;
  private mode: ControlMode;
  private keyboard: Set<string> = new Set();
  private pointer: PointerVecState = {
    active: false,
    pointerId: null,
    lastX: 0,
    lastY: 0,
    vector: { x: 0, y: 0 },
    intensity: 0,
    followX: 0,
    followY: 0,
    hasFollowTarget: false
  };
  private joystick: JoystickState = {
    active: false,
    pointerId: null,
    originX: 0,
    originY: 0,
    currentX: 0,
    currentY: 0
  };

  constructor(canvas: HTMLCanvasElement, joystickArea: HTMLElement, joystickThumb: HTMLElement, mode: ControlMode) {
    this.canvas = canvas;
    this.joystickArea = joystickArea;
    this.joystickThumb = joystickThumb;
    this.mode = mode;
    this.bind();
  }

  setMode(mode: ControlMode): void {
    this.mode = mode;
    this.joystickArea.hidden = mode !== 'joystick';
    if (mode !== 'joystick') this.resetJoystick();
  }

  getInput(playerX: number, playerY: number): InputState {
    const keyboardVec = this.keyboardVector();
    if (keyboardVec.intensity > DEAD_ZONE) return keyboardVec;

    if (this.mode === 'joystick') return this.joystickVector();

    const p = this.pointer;
    if (p.active) {
      return { direction: p.vector, intensity: p.intensity };
    }

    if (p.hasFollowTarget) {
      const dx = p.followX - playerX;
      const dy = p.followY - playerY;
      const len = Math.hypot(dx, dy);
      if (len <= 2) return { direction: { x: 0, y: 0 }, intensity: 0 };
      return {
        direction: { x: dx / len, y: dy / len },
        intensity: Math.min(1, len / 80)
      };
    }

    return { direction: { x: 0, y: 0 }, intensity: 0 };
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.joystickArea.removeEventListener('pointerdown', this.onJoystickDown);
    window.removeEventListener('pointermove', this.onJoystickMove);
    window.removeEventListener('pointerup', this.onJoystickUp);
    window.removeEventListener('pointercancel', this.onJoystickUp);
  }

  private bind(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.canvas.addEventListener('pointerdown', this.onPointerDown, { passive: false });
    this.canvas.addEventListener('pointermove', this.onPointerMove, { passive: false });
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);

    this.joystickArea.addEventListener('pointerdown', this.onJoystickDown, { passive: false });
    window.addEventListener('pointermove', this.onJoystickMove, { passive: false });
    window.addEventListener('pointerup', this.onJoystickUp);
    window.addEventListener('pointercancel', this.onJoystickUp);

    this.setMode(this.mode);
  }

  private keyboardVector(): InputState {
    let x = 0;
    let y = 0;
    if (this.keyboard.has('arrowleft') || this.keyboard.has('a')) x -= 1;
    if (this.keyboard.has('arrowright') || this.keyboard.has('d')) x += 1;
    if (this.keyboard.has('arrowup') || this.keyboard.has('w')) y -= 1;
    if (this.keyboard.has('arrowdown') || this.keyboard.has('s')) y += 1;
    const len = Math.hypot(x, y);
    if (len === 0) return { direction: { x: 0, y: 0 }, intensity: 0 };
    return { direction: { x: x / len, y: y / len }, intensity: 1 };
  }

  private joystickVector(): InputState {
    if (!this.joystick.active) return { direction: { x: 0, y: 0 }, intensity: 0 };
    const maxRadius = this.joystickArea.clientWidth * 0.36;
    const dx = this.joystick.currentX - this.joystick.originX;
    const dy = this.joystick.currentY - this.joystick.originY;
    const len = Math.hypot(dx, dy);
    if (len <= 1) return { direction: { x: 0, y: 0 }, intensity: 0 };

    const capped = Math.min(maxRadius, len);
    const nx = dx / len;
    const ny = dy / len;
    this.joystickThumb.style.transform = `translate(${nx * capped}px, ${ny * capped}px)`;

    return {
      direction: { x: nx, y: ny },
      intensity: Math.max(0, Math.min(1, capped / maxRadius))
    };
  }

  private resetJoystick(): void {
    this.joystick.active = false;
    this.joystick.pointerId = null;
    this.joystickThumb.style.transform = 'translate(0px, 0px)';
  }

  private toCanvasCoords(clientX: number, clientY: number): Vec2 {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * this.canvas.width,
      y: ((clientY - rect.top) / rect.height) * this.canvas.height
    };
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    this.keyboard.add(event.key.toLowerCase());
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    this.keyboard.delete(event.key.toLowerCase());
  };

  private onPointerDown = (event: PointerEvent): void => {
    if (this.mode !== 'drag') return;
    event.preventDefault();
    this.canvas.setPointerCapture(event.pointerId);
    this.pointer.active = true;
    this.pointer.pointerId = event.pointerId;
    this.pointer.lastX = event.clientX;
    this.pointer.lastY = event.clientY;
    this.pointer.vector = { x: 0, y: 0 };
    this.pointer.intensity = 0;
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (this.mode !== 'drag') return;

    const world = this.toCanvasCoords(event.clientX, event.clientY);
    if (event.pointerType === 'mouse' && event.buttons === 0) {
      this.pointer.followX = world.x;
      this.pointer.followY = world.y;
      this.pointer.hasFollowTarget = true;
    }

    if (!this.pointer.active || this.pointer.pointerId !== event.pointerId) return;
    event.preventDefault();

    const dx = event.clientX - this.pointer.lastX;
    const dy = event.clientY - this.pointer.lastY;
    this.pointer.lastX = event.clientX;
    this.pointer.lastY = event.clientY;

    const len = Math.hypot(dx, dy);
    if (len < 0.01) {
      this.pointer.vector = { x: 0, y: 0 };
      this.pointer.intensity = 0;
      return;
    }

    this.pointer.vector = { x: dx / len, y: dy / len };
    this.pointer.intensity = Math.min(1, len / 18);
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (this.pointer.pointerId !== event.pointerId) return;
    this.pointer.active = false;
    this.pointer.pointerId = null;
    this.pointer.vector = { x: 0, y: 0 };
    this.pointer.intensity = 0;
  };

  private onJoystickDown = (event: PointerEvent): void => {
    if (this.mode !== 'joystick') return;
    event.preventDefault();
    const rect = this.joystickArea.getBoundingClientRect();
    this.joystick.active = true;
    this.joystick.pointerId = event.pointerId;
    this.joystick.originX = rect.left + rect.width / 2;
    this.joystick.originY = rect.top + rect.height / 2;
    this.joystick.currentX = event.clientX;
    this.joystick.currentY = event.clientY;
  };

  private onJoystickMove = (event: PointerEvent): void => {
    if (!this.joystick.active || this.joystick.pointerId !== event.pointerId) return;
    event.preventDefault();
    this.joystick.currentX = event.clientX;
    this.joystick.currentY = event.clientY;
  };

  private onJoystickUp = (event: PointerEvent): void => {
    if (this.joystick.pointerId !== event.pointerId) return;
    this.resetJoystick();
  };
}
