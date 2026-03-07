// Mouse input handler - player follows cursor

import { InputHandler, MovementInput } from './input';

export class MouseInput implements InputHandler {
  private canvas: HTMLCanvasElement;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private enabled: boolean = true;

  // Transformation parameters (set by game engine)
  private scale: number = 1;
  private offsetX: number = 0;
  private offsetY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.bindEvents();
  }

  setTransform(scale: number, offsetX: number, offsetY: number): void {
    this.scale = scale;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }

  private bindEvents(): void {
    // Track mouse position on the entire window
    window.addEventListener('mousemove', this.handleMouseMove);
  }

  private handleMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();

    // Mouse position in CSS pixels relative to canvas
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
  };

  // Convert screen position to world position
  private screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    // The game renders with: translate(offsetX * scale, offsetY * scale), then scale(scale)
    // So world position = (screenPos - offset * scale) / scale = screenPos / scale - offset
    return {
      x: screenX / this.scale - this.offsetX,
      y: screenY / this.scale - this.offsetY
    };
  }

  getMovement(): MovementInput {
    if (!this.enabled) {
      return { x: 0, y: 0 };
    }

    // Get current player position from global state
    const playerPos = (window as any).__playerPosition;
    if (!playerPos) {
      return { x: 0, y: 0 };
    }

    // If mouse hasn't moved yet, use player position (no movement)
    if (this.mouseX === 0 && this.mouseY === 0) {
      return { x: 0, y: 0 };
    }

    // Convert mouse screen position to world position
    const mouseWorld = this.screenToWorld(this.mouseX, this.mouseY);

    const dx = mouseWorld.x - playerPos.x;
    const dy = mouseWorld.y - playerPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Debug output (remove after testing)
    if (distance > 5) {
      console.log('Mouse:', this.mouseX.toFixed(0), this.mouseY.toFixed(0),
        '-> World:', mouseWorld.x.toFixed(1), mouseWorld.y.toFixed(1),
        'Player:', playerPos.x.toFixed(1), playerPos.y.toFixed(1),
        'Scale:', this.scale.toFixed(2), 'Offset:', this.offsetX.toFixed(1), this.offsetY.toFixed(1));
    }

    // Stop if close enough
    if (distance < 3) {
      return { x: 0, y: 0 };
    }

    // Normalize direction
    const nx = dx / distance;
    const ny = dy / distance;

    // Speed scales with distance (capped at max)
    const maxSpeed = 1;
    const speedFactor = Math.min(distance / 50, maxSpeed);

    return {
      x: nx * speedFactor,
      y: ny * speedFactor
    };
  }

  destroy(): void {
    window.removeEventListener('mousemove', this.handleMouseMove);
  }

  reset(): void {
    // Keep mouseX/mouseY - don't reset
  }
}