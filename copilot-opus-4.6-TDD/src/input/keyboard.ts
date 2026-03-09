import type { Vec2 } from '../types';

/**
 * Keyboard input handler.
 * Tracks WASD and Arrow keys, produces a direction vector.
 */
export interface KeyboardInput {
  getDirection(): Vec2;
  destroy(): void;
}

export function createKeyboardInput(): KeyboardInput {
  const keys = new Set<string>();

  function onKeyDown(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      keys.add(key);
      e.preventDefault();
    }
  }

  function onKeyUp(e: KeyboardEvent): void {
    keys.delete(e.key.toLowerCase());
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  return {
    getDirection(): Vec2 {
      let x = 0;
      let y = 0;

      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;

      // Normalize diagonal
      if (x !== 0 && y !== 0) {
        const invSqrt2 = 0.7071067811865476;
        x *= invSqrt2;
        y *= invSqrt2;
      }

      return { x, y };
    },

    destroy(): void {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      keys.clear();
    },
  };
}
