/**
 * Keyboard input handler.
 *
 * Listens to keydown/keyup events for WASD and Arrow keys.
 * Exposes a getDirection() method returning a normalised InputVector.
 */

import type { InputVector } from '../types';

const KEY_MAP: Record<string, string> = {
  ArrowUp:    'up',
  ArrowDown:  'down',
  ArrowLeft:  'left',
  ArrowRight: 'right',
  w: 'up', W: 'up',
  s: 'down', S: 'down',
  a: 'left', A: 'left',
  d: 'right', D: 'right',
};

export class KeyboardInput {
  private held = new Set<string>();
  private active = false;

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    const dir = KEY_MAP[e.key];
    if (dir) {
      this.held.add(dir);
      e.preventDefault();
    }
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    const dir = KEY_MAP[e.key];
    if (dir) this.held.delete(dir);
  };

  enable(): void {
    if (this.active) return;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup',   this.onKeyUp);
    this.active = true;
  }

  disable(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup',   this.onKeyUp);
    this.held.clear();
    this.active = false;
  }

  getDirection(): InputVector {
    let x = 0, y = 0;
    if (this.held.has('left'))  x -= 1;
    if (this.held.has('right')) x += 1;
    if (this.held.has('up'))    y -= 1;
    if (this.held.has('down'))  y += 1;
    return { x, y };
  }

  isAnyKeyHeld(): boolean {
    return this.held.size > 0;
  }
}
