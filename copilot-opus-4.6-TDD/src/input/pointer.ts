import type { Vec2 } from '../types';
import { vecLength } from '../utils';

/**
 * Pointer input handler.
 * Handles both mouse (follow cursor) and touch (virtual joystick).
 *
 * Mouse mode: player moves toward cursor position.
 * Touch mode: virtual joystick appears at touch start point.
 */
export interface PointerInput {
  /** Get current input direction (-1..1 for each axis) */
  getDirection(): Vec2;

  /** Is the joystick currently active (touch only) */
  isJoystickActive(): boolean;

  /** Get joystick base position (for rendering) */
  getJoystickBase(): Vec2;

  /** Get joystick knob position (for rendering) */
  getJoystickKnob(): Vec2;

  /** Update with player world position and camera for mouse follow mode */
  setPlayerScreenPos(x: number, y: number): void;

  destroy(): void;
}

const JOYSTICK_RADIUS = 50; // max distance from base to knob
const JOYSTICK_DEADZONE = 8; // pixels

export function createPointerInput(canvas: HTMLCanvasElement): PointerInput {
  let isTouch = false;
  let mouseActive = false;
  let mouseX = 0;
  let mouseY = 0;

  // Player screen position (for mouse follow mode)
  let playerScreenX = 0;
  let playerScreenY = 0;

  // Touch joystick state
  let joystickActive = false;
  let joystickTouchId: number | null = null;
  let baseX = 0;
  let baseY = 0;
  let knobX = 0;
  let knobY = 0;
  let touchDirX = 0;
  let touchDirY = 0;

  // Mouse direction (for follow mode)
  let mouseDirX = 0;
  let mouseDirY = 0;

  // --- Mouse Events ---
  function onMouseMove(e: MouseEvent): void {
    if (isTouch) return; // Ignore mouse events when touch is active
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    mouseActive = true;
    updateMouseDirection();
  }

  function onMouseLeave(): void {
    mouseActive = false;
    mouseDirX = 0;
    mouseDirY = 0;
  }

  function updateMouseDirection(): void {
    if (!mouseActive) {
      mouseDirX = 0;
      mouseDirY = 0;
      return;
    }

    const dx = mouseX - playerScreenX;
    const dy = mouseY - playerScreenY;
    const dist = vecLength(dx, dy);

    if (dist < JOYSTICK_DEADZONE) {
      mouseDirX = 0;
      mouseDirY = 0;
      return;
    }

    // Normalize, but scale by proximity (closer = slower)
    const scale = Math.min(dist / 60, 1);
    mouseDirX = (dx / dist) * scale;
    mouseDirY = (dy / dist) * scale;
  }

  // --- Touch Events ---
  function onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    isTouch = true;

    if (joystickActive) return; // Already tracking a touch

    const touch = e.changedTouches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    joystickTouchId = touch.identifier;
    joystickActive = true;
    baseX = x;
    baseY = y;
    knobX = x;
    knobY = y;
    touchDirX = 0;
    touchDirY = 0;
  }

  function onTouchMove(e: TouchEvent): void {
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier !== joystickTouchId) continue;

      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const dx = x - baseX;
      const dy = y - baseY;
      const dist = vecLength(dx, dy);

      if (dist < JOYSTICK_DEADZONE) {
        knobX = x;
        knobY = y;
        touchDirX = 0;
        touchDirY = 0;
      } else {
        // Clamp knob to joystick radius
        if (dist > JOYSTICK_RADIUS) {
          knobX = baseX + (dx / dist) * JOYSTICK_RADIUS;
          knobY = baseY + (dy / dist) * JOYSTICK_RADIUS;
        } else {
          knobX = x;
          knobY = y;
        }

        const scale = Math.min(dist / JOYSTICK_RADIUS, 1);
        touchDirX = (dx / dist) * scale;
        touchDirY = (dy / dist) * scale;
      }
    }
  }

  function onTouchEnd(e: TouchEvent): void {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchId) {
        joystickActive = false;
        joystickTouchId = null;
        touchDirX = 0;
        touchDirY = 0;
      }
    }
  }

  // Bind events
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseleave', onMouseLeave);
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd);
  canvas.addEventListener('touchcancel', onTouchEnd);

  return {
    getDirection(): Vec2 {
      // Touch takes priority over mouse
      if (joystickActive) {
        return { x: touchDirX, y: touchDirY };
      }
      if (mouseActive) {
        return { x: mouseDirX, y: mouseDirY };
      }
      return { x: 0, y: 0 };
    },

    isJoystickActive(): boolean {
      return joystickActive;
    },

    getJoystickBase(): Vec2 {
      return { x: baseX, y: baseY };
    },

    getJoystickKnob(): Vec2 {
      return { x: knobX, y: knobY };
    },

    setPlayerScreenPos(x: number, y: number): void {
      playerScreenX = x;
      playerScreenY = y;
      if (mouseActive) updateMouseDirection();
    },

    destroy(): void {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
    },
  };
}
