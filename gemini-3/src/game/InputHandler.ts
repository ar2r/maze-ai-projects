export interface InputState {
  dx: number;
  dy: number;
  isDragging: boolean;
  pointerPos: { x: number; y: number };
}

export class InputHandler {
  public state: InputState = {
    dx: 0,
    dy: 0,
    isDragging: false,
    pointerPos: { x: 0, y: 0 }
  };

  private keys: Set<string> = new Set();
  private joystickActive = false;
  private joystickBase: HTMLElement | null = null;
  private joystickKnob: HTMLElement | null = null;

  constructor() {
    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    
    // Virtual Joystick logic
    this.joystickBase = document.getElementById('joystick-base');
    this.joystickKnob = document.getElementById('joystick-knob');

    if (this.joystickBase && this.joystickKnob) {
      this.joystickBase.addEventListener('touchstart', (e) => this.handleJoystickStart(e), { passive: false });
      window.addEventListener('touchmove', (e) => this.handleJoystickMove(e), { passive: false });
      window.addEventListener('touchend', () => this.handleJoystickEnd(), { passive: false });
    }

    // Pointer/Mouse following
    window.addEventListener('pointerdown', (e) => {
        this.state.isDragging = true;
        this.updatePointerPos(e);
    });
    window.addEventListener('pointermove', (e) => {
        this.updatePointerPos(e);
    });
    window.addEventListener('pointerup', () => {
        this.state.isDragging = false;
    });
  }

  private updatePointerPos(e: PointerEvent) {
    this.state.pointerPos.x = e.clientX;
    this.state.pointerPos.y = e.clientY;
  }

  private handleJoystickStart(e: TouchEvent) {
    e.preventDefault();
    this.joystickActive = true;
    this.handleJoystickMove(e);
  }

  private handleJoystickMove(e: TouchEvent) {
    if (!this.joystickActive || !this.joystickBase || !this.joystickKnob) return;
    e.preventDefault();

    const touch = e.touches[0];
    const rect = this.joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = rect.width / 2;

    if (distance > maxRadius) {
      dx = (dx / distance) * maxRadius;
      dy = (dy / distance) * maxRadius;
    }

    this.joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    
    // Normalize to -1 to 1
    this.state.dx = dx / maxRadius;
    this.state.dy = dy / maxRadius;
  }

  private handleJoystickEnd() {
    this.joystickActive = false;
    if (this.joystickKnob) {
        this.joystickKnob.style.transform = `translate(-50%, -50%)`;
    }
    this.state.dx = 0;
    this.state.dy = 0;
  }

  public update() {
    // Keyboard takes priority if any arrow keys/WASD pressed
    let kx = 0;
    let ky = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) kx -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) kx += 1;
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) ky -= 1;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) ky += 1;

    if (kx !== 0 || ky !== 0) {
      // Normalize keyboard vector
      const mag = Math.sqrt(kx * kx + ky * ky);
      this.state.dx = kx / mag;
      this.state.dy = ky / mag;
    } else if (!this.joystickActive) {
      // If no keyboard and no joystick, decay dx/dy unless using pointer drag (handled in engine)
      if (!this.state.isDragging) {
        this.state.dx = 0;
        this.state.dy = 0;
      }
    }
  }
}
