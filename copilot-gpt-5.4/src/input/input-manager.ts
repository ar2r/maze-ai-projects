import type { ControlMode, Vector2, ViewportTransform } from '../types';

const ZERO_VECTOR: Vector2 = { x: 0, y: 0 };

function normalize(vector: Vector2): Vector2 {
  const magnitude = Math.hypot(vector.x, vector.y);
  if (magnitude <= 0.0001) {
    return ZERO_VECTOR;
  }

  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export class InputManager {
  private viewport: ViewportTransform | null = null;
  private controlMode: ControlMode = 'auto';
  private keyboardState = {
    up: false,
    right: false,
    down: false,
    left: false,
  };
  private pointerTarget: Vector2 | null = null;
  private pointerActive = false;
  private activePointerId: number | null = null;
  private joystickVector: Vector2 = ZERO_VECTOR;
  private joystickPointerId: number | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private joystickBase: HTMLElement | null = null;
  private joystickKnob: HTMLElement | null = null;
  private readonly coarsePointerQuery = window.matchMedia('(pointer: coarse)');

  attach(canvas: HTMLCanvasElement, joystickBase: HTMLElement, joystickKnob: HTMLElement): void {
    this.canvas = canvas;
    this.joystickBase = joystickBase;
    this.joystickKnob = joystickKnob;

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    canvas.addEventListener('pointerdown', this.handleCanvasPointerDown, { passive: false });
    canvas.addEventListener('pointermove', this.handleCanvasPointerMove, { passive: false });
    canvas.addEventListener('pointerup', this.handleCanvasPointerUp, { passive: false });
    canvas.addEventListener('pointercancel', this.handleCanvasPointerUp, { passive: false });
    canvas.addEventListener('pointerleave', this.handleCanvasPointerLeave);

    joystickBase.addEventListener('pointerdown', this.handleJoystickPointerDown, { passive: false });
    joystickBase.addEventListener('pointermove', this.handleJoystickPointerMove, { passive: false });
    joystickBase.addEventListener('pointerup', this.handleJoystickPointerUp, { passive: false });
    joystickBase.addEventListener('pointercancel', this.handleJoystickPointerUp, { passive: false });
  }

  setViewport(viewport: ViewportTransform): void {
    this.viewport = viewport;
  }

  setControlMode(controlMode: ControlMode): void {
    this.controlMode = controlMode;
    if (this.resolveControlMode() !== 'joystick') {
      this.resetJoystick();
    }
  }

  resetTransientInputs(): void {
    this.pointerActive = false;
    this.activePointerId = null;
    this.pointerTarget = null;
    this.resetJoystick();
  }

  isJoystickVisible(): boolean {
    return this.resolveControlMode() === 'joystick';
  }

  getResolvedControlMode(): ControlMode {
    return this.resolveControlMode();
  }

  getHelpText(): string {
    const resolved = this.resolveControlMode();

    if (resolved === 'joystick') {
      return 'Mobile: virtual joystick. Desktop: WASD / arrows are always available.';
    }

    if (resolved === 'drag') {
      return 'Drag on the maze surface to steer. Keyboard controls stay enabled.';
    }

    return 'Desktop: move with mouse follow or hold-to-drag. Keyboard: WASD / arrows.';
  }

  getMovementIntent(playerPosition: Vector2): Vector2 {
    const keyboardVector = this.getKeyboardVector();
    if (keyboardVector.x !== 0 || keyboardVector.y !== 0) {
      return keyboardVector;
    }

    const resolved = this.resolveControlMode();

    if (resolved === 'joystick' && (this.joystickVector.x !== 0 || this.joystickVector.y !== 0)) {
      return this.joystickVector;
    }

    if ((resolved === 'mouse' || resolved === 'drag') && this.pointerTarget) {
      if (resolved === 'drag' && !this.pointerActive) {
        return ZERO_VECTOR;
      }

      const delta = {
        x: this.pointerTarget.x - playerPosition.x,
        y: this.pointerTarget.y - playerPosition.y,
      };
      const distance = Math.hypot(delta.x, delta.y);
      if (distance < 0.04) {
        return ZERO_VECTOR;
      }

      const normalized = normalize(delta);
      const strength = clamp(distance / 0.75, 0.2, 1);
      return {
        x: normalized.x * strength,
        y: normalized.y * strength,
      };
    }

    return ZERO_VECTOR;
  }

  private resolveControlMode(): ControlMode {
    if (this.controlMode === 'auto') {
      return this.coarsePointerQuery.matches ? 'joystick' : 'mouse';
    }

    return this.controlMode;
  }

  private getKeyboardVector(): Vector2 {
    const horizontal = (this.keyboardState.right ? 1 : 0) - (this.keyboardState.left ? 1 : 0);
    const vertical = (this.keyboardState.down ? 1 : 0) - (this.keyboardState.up ? 1 : 0);

    if (horizontal === 0 && vertical === 0) {
      return ZERO_VECTOR;
    }

    return normalize({ x: horizontal, y: vertical });
  }

  private clientToWorld(clientX: number, clientY: number): Vector2 | null {
    if (!this.canvas || !this.viewport) {
      return null;
    }

    const rect = this.canvas.getBoundingClientRect();
    const pixelX = (clientX - rect.left) * this.viewport.dpr;
    const pixelY = (clientY - rect.top) * this.viewport.dpr;

    return {
      x: (pixelX - this.viewport.offsetX) / this.viewport.scale,
      y: (pixelY - this.viewport.offsetY) / this.viewport.scale,
    };
  }

  private updateJoystickFromClient(clientX: number, clientY: number): void {
    if (!this.joystickBase || !this.joystickKnob) {
      return;
    }

    const bounds = this.joystickBase.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const radius = bounds.width * 0.34;
    const rawX = clientX - centerX;
    const rawY = clientY - centerY;
    const distance = Math.hypot(rawX, rawY);
    const limitedDistance = Math.min(radius, distance);
    const angle = Math.atan2(rawY, rawX);
    const knobX = Math.cos(angle) * limitedDistance;
    const knobY = Math.sin(angle) * limitedDistance;
    const normalized = distance > 0 ? { x: knobX / radius, y: knobY / radius } : ZERO_VECTOR;

    this.joystickVector = distance > 0 ? normalized : ZERO_VECTOR;
    this.joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
  }

  private resetJoystick(): void {
    this.joystickVector = ZERO_VECTOR;
    this.joystickPointerId = null;
    if (this.joystickKnob) {
      this.joystickKnob.style.transform = 'translate(0px, 0px)';
    }
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    switch (event.key.toLowerCase()) {
      case 'arrowup':
      case 'w':
        this.keyboardState.up = true;
        break;
      case 'arrowright':
      case 'd':
        this.keyboardState.right = true;
        break;
      case 'arrowdown':
      case 's':
        this.keyboardState.down = true;
        break;
      case 'arrowleft':
      case 'a':
        this.keyboardState.left = true;
        break;
      default:
        break;
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    switch (event.key.toLowerCase()) {
      case 'arrowup':
      case 'w':
        this.keyboardState.up = false;
        break;
      case 'arrowright':
      case 'd':
        this.keyboardState.right = false;
        break;
      case 'arrowdown':
      case 's':
        this.keyboardState.down = false;
        break;
      case 'arrowleft':
      case 'a':
        this.keyboardState.left = false;
        break;
      default:
        break;
    }
  };

  private readonly handleCanvasPointerDown = (event: PointerEvent): void => {
    if (!this.canvas) {
      return;
    }

    const resolved = this.resolveControlMode();
    if (resolved === 'joystick') {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    this.pointerActive = true;
    this.activePointerId = event.pointerId;
    this.canvas.setPointerCapture(event.pointerId);
    this.pointerTarget = this.clientToWorld(event.clientX, event.clientY);
  };

  private readonly handleCanvasPointerMove = (event: PointerEvent): void => {
    const resolved = this.resolveControlMode();
    if (resolved === 'joystick') {
      return;
    }

    if (event.pointerType === 'mouse' && resolved === 'mouse') {
      this.pointerTarget = this.clientToWorld(event.clientX, event.clientY);
      return;
    }

    if (this.activePointerId !== event.pointerId) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    this.pointerTarget = this.clientToWorld(event.clientX, event.clientY);
  };

  private readonly handleCanvasPointerUp = (event: PointerEvent): void => {
    if (this.activePointerId !== event.pointerId) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    this.pointerActive = false;
    this.activePointerId = null;
    if (this.resolveControlMode() === 'drag') {
      this.pointerTarget = null;
    }
  };

  private readonly handleCanvasPointerLeave = (): void => {
    if (this.resolveControlMode() === 'mouse') {
      this.pointerTarget = null;
    }
  };

  private readonly handleJoystickPointerDown = (event: PointerEvent): void => {
    if (this.resolveControlMode() !== 'joystick' || !this.joystickBase) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    this.joystickPointerId = event.pointerId;
    this.joystickBase.setPointerCapture(event.pointerId);
    this.updateJoystickFromClient(event.clientX, event.clientY);
  };

  private readonly handleJoystickPointerMove = (event: PointerEvent): void => {
    if (this.joystickPointerId !== event.pointerId) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    this.updateJoystickFromClient(event.clientX, event.clientY);
  };

  private readonly handleJoystickPointerUp = (event: PointerEvent): void => {
    if (this.joystickPointerId !== event.pointerId) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    this.resetJoystick();
  };
}
