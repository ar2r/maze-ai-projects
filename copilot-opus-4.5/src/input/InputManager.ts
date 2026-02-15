import { InputState } from '../utils/types';
import { JOYSTICK_MAX_DISTANCE, JOYSTICK_DEAD_ZONE } from '../utils/constants';

/**
 * Unified input manager that handles keyboard, mouse, and touch input
 */
export class InputManager {
  private inputState: InputState = { dx: 0, dy: 0, active: false };
  private canvas: HTMLCanvasElement;
  private canvasRect: DOMRect;

  // Keyboard state
  private keys: Set<string> = new Set();

  // Mouse state
  private mouseActive: boolean = false;
  private mouseX: number = 0;
  private mouseY: number = 0;

  // Touch/Joystick state
  private joystickElement: HTMLElement | null = null;
  private joystickKnob: HTMLElement | null = null;
  private joystickActive: boolean = false;
  private joystickTouchId: number | null = null;
  private joystickBaseX: number = 0;
  private joystickBaseY: number = 0;

  // Player position for mouse following
  private playerX: number = 0;
  private playerY: number = 0;
  private canvasOffsetX: number = 0;
  private canvasOffsetY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.canvasRect = canvas.getBoundingClientRect();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard events
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    // Mouse events
    this.canvas.addEventListener('mouseenter', this.onMouseEnter);
    this.canvas.addEventListener('mouseleave', this.onMouseLeave);
    this.canvas.addEventListener('mousemove', this.onMouseMove);

    // Touch events for joystick
    this.joystickElement = document.getElementById('joystick');
    this.joystickKnob = document.getElementById('joystick-knob');

    if (this.joystickElement) {
      this.joystickElement.addEventListener('touchstart', this.onJoystickStart, { passive: false });
      this.joystickElement.addEventListener('touchmove', this.onJoystickMove, { passive: false });
      this.joystickElement.addEventListener('touchend', this.onJoystickEnd);
      this.joystickElement.addEventListener('touchcancel', this.onJoystickEnd);
    }

    // Handle resize
    window.addEventListener('resize', this.onResize);

    // Prevent context menu on canvas
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
      e.preventDefault();
      this.keys.add(e.key.toLowerCase());
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.key.toLowerCase());
  };

  private onMouseEnter = (): void => {
    this.mouseActive = true;
  };

  private onMouseLeave = (): void => {
    this.mouseActive = false;
  };

  private onMouseMove = (e: MouseEvent): void => {
    this.canvasRect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - this.canvasRect.left;
    this.mouseY = e.clientY - this.canvasRect.top;
    this.mouseActive = true;
  };

  private onJoystickStart = (e: TouchEvent): void => {
    e.preventDefault();
    if (this.joystickTouchId !== null) return;

    const touch = e.touches[0];
    this.joystickTouchId = touch.identifier;
    this.joystickActive = true;

    const rect = this.joystickElement!.getBoundingClientRect();
    this.joystickBaseX = rect.left + rect.width / 2;
    this.joystickBaseY = rect.top + rect.height / 2;

    this.updateJoystick(touch.clientX, touch.clientY);
  };

  private onJoystickMove = (e: TouchEvent): void => {
    e.preventDefault();
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.identifier === this.joystickTouchId) {
        this.updateJoystick(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  private onJoystickEnd = (e: TouchEvent): void => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.joystickTouchId) {
        this.joystickTouchId = null;
        this.joystickActive = false;
        this.inputState.dx = 0;
        this.inputState.dy = 0;
        this.inputState.active = false;

        // Reset knob position
        if (this.joystickKnob) {
          this.joystickKnob.style.transform = 'translate(0, 0)';
        }
        break;
      }
    }
  };

  private updateJoystick(touchX: number, touchY: number): void {
    let dx = touchX - this.joystickBaseX;
    let dy = touchY - this.joystickBaseY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Clamp to max distance
    if (dist > JOYSTICK_MAX_DISTANCE) {
      dx = (dx / dist) * JOYSTICK_MAX_DISTANCE;
      dy = (dy / dist) * JOYSTICK_MAX_DISTANCE;
    }

    // Update knob visual position
    if (this.joystickKnob) {
      this.joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    }

    // Normalize to -1 to 1 range
    const normalizedDist = Math.min(dist / JOYSTICK_MAX_DISTANCE, 1);

    if (normalizedDist < JOYSTICK_DEAD_ZONE) {
      this.inputState.dx = 0;
      this.inputState.dy = 0;
      this.inputState.active = false;
    } else {
      this.inputState.dx = dx / JOYSTICK_MAX_DISTANCE;
      this.inputState.dy = dy / JOYSTICK_MAX_DISTANCE;
      this.inputState.active = true;
    }
  }

  private onResize = (): void => {
    this.canvasRect = this.canvas.getBoundingClientRect();
  };

  /** Update player position for mouse-following calculation */
  setPlayerPosition(x: number, y: number, offsetX: number, offsetY: number): void {
    this.playerX = x;
    this.playerY = y;
    this.canvasOffsetX = offsetX;
    this.canvasOffsetY = offsetY;
  }

  /** Get current input state */
  getInput(): InputState {
    // Priority: Joystick > Keyboard > Mouse

    // Joystick input (already updated via touch events)
    if (this.joystickActive && this.inputState.active) {
      return { ...this.inputState };
    }

    // Keyboard input
    let kbDx = 0;
    let kbDy = 0;

    if (this.keys.has('arrowup') || this.keys.has('w')) kbDy -= 1;
    if (this.keys.has('arrowdown') || this.keys.has('s')) kbDy += 1;
    if (this.keys.has('arrowleft') || this.keys.has('a')) kbDx -= 1;
    if (this.keys.has('arrowright') || this.keys.has('d')) kbDx += 1;

    if (kbDx !== 0 || kbDy !== 0) {
      return { dx: kbDx, dy: kbDy, active: true };
    }

    // Mouse following
    if (this.mouseActive) {
      const dpr = window.devicePixelRatio || 1;
      const targetX = this.mouseX * dpr - this.canvasOffsetX;
      const targetY = this.mouseY * dpr - this.canvasOffsetY;

      const dx = targetX - this.playerX;
      const dy = targetY - this.playerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Dead zone to prevent jitter
      if (dist > 5) {
        return {
          dx: dx / dist,
          dy: dy / dist,
          active: true,
        };
      }
    }

    return { dx: 0, dy: 0, active: false };
  }

  /** Show/hide joystick */
  setJoystickVisible(visible: boolean): void {
    if (this.joystickElement) {
      this.joystickElement.classList.toggle('hidden', !visible);
    }
  }

  /** Clean up event listeners */
  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.onResize);

    this.canvas.removeEventListener('mouseenter', this.onMouseEnter);
    this.canvas.removeEventListener('mouseleave', this.onMouseLeave);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);

    if (this.joystickElement) {
      this.joystickElement.removeEventListener('touchstart', this.onJoystickStart);
      this.joystickElement.removeEventListener('touchmove', this.onJoystickMove);
      this.joystickElement.removeEventListener('touchend', this.onJoystickEnd);
      this.joystickElement.removeEventListener('touchcancel', this.onJoystickEnd);
    }
  }

  /** Reset all input state */
  reset(): void {
    this.keys.clear();
    this.mouseActive = false;
    this.joystickActive = false;
    this.inputState = { dx: 0, dy: 0, active: false };
  }
}
