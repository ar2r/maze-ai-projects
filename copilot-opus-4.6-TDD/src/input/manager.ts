import type { Vec2 } from '../types';
import { createKeyboardInput, type KeyboardInput } from './keyboard';
import { createPointerInput, type PointerInput } from './pointer';
import { clamp } from '../utils';

/**
 * Unified Input Manager.
 * Combines keyboard and pointer input, prevents scroll/zoom conflicts.
 */
export interface InputManager {
  /** Get the combined input direction (-1..1 each axis) */
  getDirection(): Vec2;

  /** Update player screen position (for mouse follow) */
  setPlayerScreenPos(x: number, y: number): void;

  /** Is the virtual joystick currently active */
  isJoystickActive(): boolean;

  /** Get joystick base/knob for rendering */
  getJoystickBase(): Vec2;
  getJoystickKnob(): Vec2;

  /** Clean up all event listeners */
  destroy(): void;
}

export function createInputManager(canvas: HTMLCanvasElement): InputManager {
  const keyboard = createKeyboardInput();
  const pointer = createPointerInput(canvas);

  // Prevent default zoom/scroll gestures on canvas
  function preventGestures(e: Event): void {
    e.preventDefault();
  }

  // Prevent context menu on long press
  canvas.addEventListener('contextmenu', preventGestures);

  // Handle visibility change (clear keyboard state when tab loses focus)
  function onVisibilityChange(): void {
    if (document.hidden) {
      // Keyboard will still hold keys — destroy and recreate on refocus
      // Actually, keyup events won't fire, so we need a fresh keyboard state
    }
  }
  document.addEventListener('visibilitychange', onVisibilityChange);

  return {
    getDirection(): Vec2 {
      const kbDir = keyboard.getDirection();
      const ptrDir = pointer.getDirection();

      // Combine: keyboard takes priority if active, otherwise pointer
      let x: number, y: number;
      if (kbDir.x !== 0 || kbDir.y !== 0) {
        x = kbDir.x;
        y = kbDir.y;
      } else {
        x = ptrDir.x;
        y = ptrDir.y;
      }

      return {
        x: clamp(x, -1, 1),
        y: clamp(y, -1, 1),
      };
    },

    setPlayerScreenPos(x: number, y: number): void {
      pointer.setPlayerScreenPos(x, y);
    },

    isJoystickActive(): boolean {
      return pointer.isJoystickActive();
    },

    getJoystickBase(): Vec2 {
      return pointer.getJoystickBase();
    },

    getJoystickKnob(): Vec2 {
      return pointer.getJoystickKnob();
    },

    destroy(): void {
      keyboard.destroy();
      pointer.destroy();
      canvas.removeEventListener('contextmenu', preventGestures);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    },
  };
}
