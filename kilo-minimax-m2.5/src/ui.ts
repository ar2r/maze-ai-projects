import { Vector2 } from './engine';

type InputCallback = (input: Vector2) => void;

export class InputManager {
  private inputCallback: InputCallback;
  private keys: Set<string> = new Set();
  private joystickActive = false;
  private joystickInput: Vector2 = { x: 0, y: 0 };

  constructor(callback: InputCallback) {
    this.inputCallback = callback;
    this.setupKeyboard();
    this.setupTouch();
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      this.emitInput();
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      this.emitInput();
    });
  }

  private setupTouch(): void {
    const joystickZone = document.getElementById('joystick-zone');
    const joystickBase = document.getElementById('joystick-base');
    const joystickStick = document.getElementById('joystick-stick');

    if (!joystickZone || !joystickBase || !joystickStick) return;

    let touchId: number | null = null;
    let baseRect: DOMRect | null = null;
    const maxDistance = 35;

    const handleTouchStart = (e: TouchEvent) => {
      if (touchId !== null) return;
      e.preventDefault();

      const touch = e.changedTouches[0];
      touchId = touch.identifier;
      baseRect = joystickBase.getBoundingClientRect();

      joystickZone.classList.remove('hidden');
      this.joystickActive = true;
      this.updateJoystick(touch.clientX, touch.clientY, baseRect, maxDistance, joystickStick);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchId === null) return;
      e.preventDefault();

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId && baseRect) {
          this.updateJoystick(touch.clientX, touch.clientY, baseRect, maxDistance, joystickStick);
          break;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          touchId = null;
          this.joystickActive = false;
          this.joystickInput = { x: 0, y: 0 };
          joystickStick.style.transform = 'translate(-50%, -50%)';
          joystickZone.classList.add('hidden');
          this.emitInput();
          break;
        }
      }
    };

    joystickZone.addEventListener('touchstart', handleTouchStart, { passive: false });
    joystickZone.addEventListener('touchmove', handleTouchMove, { passive: false });
    joystickZone.addEventListener('touchend', handleTouchEnd, { passive: false });
    joystickZone.addEventListener('touchcancel', handleTouchEnd, { passive: false });
  }

  private updateJoystick(
    clientX: number,
    clientY: number,
    baseRect: DOMRect,
    maxDistance: number,
    stick: HTMLElement
  ): void {
    const centerX = baseRect.left + baseRect.width / 2;
    const centerY = baseRect.top + baseRect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;

    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > maxDistance) {
      dx = (dx / distance) * maxDistance;
      dy = (dy / distance) * maxDistance;
    }

    stick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

    this.joystickInput = {
      x: dx / maxDistance,
      y: dy / maxDistance
    };

    this.emitInput();
  }

  private emitInput(): void {
    let x = 0;
    let y = 0;

    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) y -= 1;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) y += 1;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) x -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) x += 1;

    if (this.joystickActive) {
      x = this.joystickInput.x;
      y = this.joystickInput.y;
    }

    if (x !== 0 && y !== 0) {
      const len = Math.sqrt(x * x + y * y);
      x /= len;
      y /= len;
    }

    this.inputCallback({ x, y });
  }
}

export class UIManager {
  private screens: Map<string, HTMLElement> = new Map();

  constructor() {
    document.querySelectorAll('.screen').forEach((screen) => {
      this.screens.set(screen.id, screen as HTMLElement);
    });
  }

  showScreen(id: string): void {
    this.screens.forEach((screen) => {
      screen.classList.remove('active');
    });
    const screen = this.screens.get(id);
    if (screen) {
      screen.classList.add('active');
    }
  }

  hideScreen(id: string): void {
    const screen = this.screens.get(id);
    if (screen) {
      screen.classList.remove('active');
    }
  }

  updateElement(id: string, text: string): void {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = text;
    }
  }

  setBestLevel(level: number): void {
    this.updateElement('best-level', level.toString());
  }

  setContinueVisible(visible: boolean): void {
    const btn = document.getElementById('continue-btn');
    if (btn) {
      btn.classList.toggle('hidden', !visible);
    }
  }
}
