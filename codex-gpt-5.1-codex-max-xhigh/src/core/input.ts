export type ControlScheme = 'mouse-follow' | 'drag' | 'joystick';

export type InputSnapshot = {
  dirX: number;
  dirY: number;
  engaged: boolean;
};

type Mapper = (px: number, py: number) => { x: number; y: number };

export class InputManager {
  private canvas: HTMLCanvasElement;
  private scheme: ControlScheme;
  private pointerActive = false;
  private pointerId: number | null = null;
  private pointerScreen = { x: 0, y: 0 };
  private joystickOrigin = { x: 0, y: 0 };
  private joystickCurrent = { x: 0, y: 0 };
  private joystickActive = false;
  private keyState: Record<string, boolean> = {};
  private screenToWorld: Mapper;

  constructor(canvas: HTMLCanvasElement, initial: ControlScheme, mapper: Mapper) {
    this.canvas = canvas;
    this.scheme = initial;
    this.screenToWorld = mapper;
    this.bindEvents();
  }

  setControlScheme(scheme: ControlScheme) {
    this.scheme = scheme;
  }

  setMapper(mapper: Mapper) {
    this.screenToWorld = mapper;
  }

  private bindEvents() {
    this.canvas.addEventListener('pointerdown', (e) => {
      this.pointerActive = true;
      this.pointerId = e.pointerId;
      this.pointerScreen = { x: e.clientX, y: e.clientY };
      this.canvas.setPointerCapture(e.pointerId);
      if (this.scheme === 'joystick') {
        this.joystickOrigin = { x: e.clientX, y: e.clientY };
        this.joystickActive = true;
      }
      e.preventDefault();
    });

    this.canvas.addEventListener('pointermove', (e) => {
      if (this.pointerId !== null && e.pointerId !== this.pointerId) return;
      this.pointerScreen = { x: e.clientX, y: e.clientY };
      this.joystickCurrent = { ...this.pointerScreen };
      if (this.pointerActive) e.preventDefault();
    });

    const endPointer = (e: PointerEvent) => {
      if (this.pointerId !== null && e.pointerId !== this.pointerId) return;
      this.pointerActive = false;
      this.pointerId = null;
      this.joystickActive = false;
      this.joystickCurrent = { ...this.joystickOrigin };
      e.preventDefault();
    };

    this.canvas.addEventListener('pointerup', endPointer);
    this.canvas.addEventListener('pointercancel', endPointer);
    this.canvas.addEventListener('pointerleave', endPointer);

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        this.keyState[e.key.toLowerCase()] = true;
      }
    });
    window.addEventListener('keyup', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        this.keyState[e.key.toLowerCase()] = false;
      }
    });
  }

  snapshot(playerWorld: { x: number; y: number }): InputSnapshot {
    const result = { dirX: 0, dirY: 0, engaged: false } satisfies InputSnapshot;

    const push = (dx: number, dy: number) => {
      result.dirX += dx;
      result.dirY += dy;
      result.engaged = true;
    };

    // keyboard always allowed
    if (this.keyState['arrowup'] || this.keyState['w']) push(0, -1);
    if (this.keyState['arrowdown'] || this.keyState['s']) push(0, 1);
    if (this.keyState['arrowleft'] || this.keyState['a']) push(-1, 0);
    if (this.keyState['arrowright'] || this.keyState['d']) push(1, 0);

    const pointerWorld = this.screenToWorld(this.pointerScreen.x, this.pointerScreen.y);

    if (this.scheme === 'mouse-follow') {
      const dx = pointerWorld.x - playerWorld.x;
      const dy = pointerWorld.y - playerWorld.y;
      const len = Math.hypot(dx, dy);
      if (len > 0.001) push(dx / len, dy / len);
    } else if (this.scheme === 'drag' && this.pointerActive) {
      const dx = pointerWorld.x - playerWorld.x;
      const dy = pointerWorld.y - playerWorld.y;
      const len = Math.hypot(dx, dy);
      if (len > 0.001) push(dx / len, dy / len);
    } else if (this.scheme === 'joystick' && this.joystickActive) {
      const dx = this.joystickCurrent.x - this.joystickOrigin.x;
      const dy = this.joystickCurrent.y - this.joystickOrigin.y;
      const mag = Math.min(1, Math.hypot(dx, dy) / 50);
      if (mag > 0.02) {
        const norm = Math.hypot(dx, dy) || 1;
        push((dx / norm) * mag, (dy / norm) * mag);
      }
    }

    return result;
  }

  getJoystickState() {
    return {
      origin: { ...this.joystickOrigin },
      current: { ...this.joystickCurrent },
      active: this.joystickActive && this.scheme === 'joystick'
    };
  }
}
