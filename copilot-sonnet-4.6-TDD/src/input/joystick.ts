/**
 * Virtual joystick — fixed position (bottom-left), touch-only.
 *
 * The joystick base is rendered as a DOM element (CSS circles in index.html).
 * This module handles touch events and computes a normalised direction vector.
 *
 * Design:
 *  - Fixed position: always at bottom-left of the game area.
 *  - Touch anywhere inside the base circle to start dragging.
 *  - Knob follows finger, clamped to base radius.
 *  - Direction vector: (knob offset / base radius), clamped to length 1.
 *  - touch-action: none on canvas prevents scroll conflict.
 */

import type { InputVector } from '../types';

const BASE_RADIUS = 50;  // half of the 100px base circle
const KNOB_HALF   = 22;  // half of the 44px knob circle

export class VirtualJoystick {
  private readonly container: HTMLElement;
  private readonly base:      HTMLElement;
  private readonly knob:      HTMLElement;

  private active      = false;
  private tracking    = false;
  private activeTouchId: number | null = null;

  // Base center (fixed in DOM, but we read from getBoundingClientRect)
  private direction: InputVector = { x: 0, y: 0 };

  constructor() {
    this.container = document.getElementById('joystick-container')!;
    this.base      = document.getElementById('joystick-base')!;
    this.knob      = document.getElementById('joystick-knob')!;
  }

  enable(): void {
    if (this.active) return;
    this.container.classList.add('visible');
    this.base.addEventListener('touchstart', this.onTouchStart, { passive: false });
    window.addEventListener('touchmove',  this.onTouchMove,  { passive: false });
    window.addEventListener('touchend',   this.onTouchEnd);
    window.addEventListener('touchcancel',this.onTouchEnd);
    this.active = true;
  }

  disable(): void {
    this.container.classList.remove('visible');
    this.base.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchmove',  this.onTouchMove);
    window.removeEventListener('touchend',   this.onTouchEnd);
    window.removeEventListener('touchcancel',this.onTouchEnd);
    this.resetKnob();
    this.active = false;
    this.tracking = false;
  }

  getDirection(): InputVector {
    return this.direction;
  }

  // ─── Touch handlers ───────────────────────────────────────────────────────

  private readonly onTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    if (this.tracking) return; // already tracking one touch

    const touch = e.changedTouches[0];
    this.activeTouchId = touch.identifier;
    this.tracking = true;
    this.updateKnob(touch.clientX, touch.clientY);
  };

  private readonly onTouchMove = (e: TouchEvent): void => {
    if (!this.tracking) return;
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.activeTouchId) {
        this.updateKnob(touch.clientX, touch.clientY);
        return;
      }
    }
  };

  private readonly onTouchEnd = (e: TouchEvent): void => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.activeTouchId) {
        this.resetKnob();
        this.tracking = false;
        this.activeTouchId = null;
        return;
      }
    }
  };

  // ─── Knob computation ────────────────────────────────────────────────────

  private updateKnob(clientX: number, clientY: number): void {
    const rect = this.base.getBoundingClientRect();
    const baseCx = rect.left + rect.width  / 2;
    const baseCy = rect.top  + rect.height / 2;

    let dx = clientX - baseCx;
    let dy = clientY - baseCy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Clamp knob to base radius
    if (dist > BASE_RADIUS) {
      dx = (dx / dist) * BASE_RADIUS;
      dy = (dy / dist) * BASE_RADIUS;
    }

    // Visual update
    const kx = BASE_RADIUS + dx - KNOB_HALF;
    const ky = BASE_RADIUS + dy - KNOB_HALF;
    this.knob.style.left = `${kx}px`;
    this.knob.style.top  = `${ky}px`;
    this.knob.style.transform = 'none'; // override CSS center transform

    // Direction vector (normalised)
    const effectiveDist = Math.min(dist, BASE_RADIUS);
    if (effectiveDist < 4) {
      this.direction = { x: 0, y: 0 };
    } else {
      this.direction = {
        x: dx / BASE_RADIUS,
        y: dy / BASE_RADIUS,
      };
    }
  }

  private resetKnob(): void {
    this.knob.style.left = '';
    this.knob.style.top  = '';
    this.knob.style.transform = '';
    this.direction = { x: 0, y: 0 };
  }
}
