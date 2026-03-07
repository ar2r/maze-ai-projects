// Keyboard input handler

import { InputHandler, MovementInput } from './input';

export class KeyboardInput implements InputHandler {
  private keys: Set<string> = new Set();

  constructor() {
    this.bindEvents();
  }

  private bindEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.code);
    // Prevent default for arrow keys and WASD to avoid page scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
      e.preventDefault();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  getMovement(): MovementInput {
    let x = 0;
    let y = 0;

    // WASD
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;

    // Normalize diagonal movement
    if (x !== 0 && y !== 0) {
      const factor = 1 / Math.sqrt(2);
      x *= factor;
      y *= factor;
    }

    return { x, y };
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.keys.clear();
  }

  reset(): void {
    this.keys.clear();
  }
}