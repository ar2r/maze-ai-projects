import { Vec2 } from '../utils/math';

export class InputManager {
  public pointerPos: Vec2 = { x: 0, y: 0 };
  public isDown: boolean = false;
  public movementVector: Vec2 = { x: 0, y: 0 }; // Normalized direction or delta
  
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupListeners();
  }

  private setupListeners() {
    // Prevent default touch actions
    this.canvas.style.touchAction = 'none';

    this.canvas.addEventListener('pointerdown', (e) => {
      this.isDown = true;
      this.updatePointer(e);
      this.canvas.setPointerCapture(e.pointerId);
    });

    this.canvas.addEventListener('pointermove', (e) => {
      if (this.isDown) {
        this.updatePointer(e);
      }
    });

    this.canvas.addEventListener('pointerup', (e) => {
      this.isDown = false;
      this.movementVector = { x: 0, y: 0 };
      this.canvas.releasePointerCapture(e.pointerId);
    });

    this.canvas.addEventListener('pointercancel', (e) => {
        this.isDown = false;
        this.movementVector = { x: 0, y: 0 };
        this.canvas.releasePointerCapture(e.pointerId);
    });
  }

  private updatePointer(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointerPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }
}
