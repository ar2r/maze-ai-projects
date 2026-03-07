// Touch input with virtual joystick

import { InputHandler, MovementInput } from './input';

export class TouchInput implements InputHandler {
  private joystickBase: HTMLElement;
  private joystickStick: HTMLElement;
  private container: HTMLElement;
  private active: boolean = false;
  private stickX: number = 0;
  private stickY: number = 0;
  private baseX: number = 0;
  private baseY: number = 0;
  private maxDistance: number = 50;

  constructor(container: HTMLElement, joystickBase: HTMLElement, joystickStick: HTMLElement) {
    this.container = container;
    this.joystickBase = joystickBase;
    this.joystickStick = joystickStick;
    this.bindEvents();
  }

  private bindEvents(): void {
    // Show joystick on touch start
    this.container.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.container.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.container.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    this.container.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });
  }

  private handleTouchStart = (e: TouchEvent): void => {
    e.preventDefault();

    const touch = e.touches[0];
    const rect = this.container.getBoundingClientRect();

    // Position joystick at touch location
    this.baseX = touch.clientX - rect.left;
    this.baseY = touch.clientY - rect.top;

    this.joystickBase.style.left = `${this.baseX - 60}px`;
    this.joystickBase.style.top = `${this.baseY - 60}px`;
    this.joystickBase.classList.remove('hidden');

    this.active = true;
    this.stickX = 0;
    this.stickY = 0;

    this.updateStickPosition();
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (!this.active) return;
    e.preventDefault();

    const touch = e.touches[0];
    const dx = touch.clientX - this.baseX;
    const dy = touch.clientY - this.baseY;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this.maxDistance) {
      this.stickX = (dx / distance) * this.maxDistance;
      this.stickY = (dy / distance) * this.maxDistance;
    } else {
      this.stickX = dx;
      this.stickY = dy;
    }

    this.updateStickPosition();
  };

  private handleTouchEnd = (e: TouchEvent): void => {
    e.preventDefault();
    this.active = false;
    this.stickX = 0;
    this.stickY = 0;
    this.joystickBase.classList.add('hidden');
  };

  private updateStickPosition(): void {
    this.joystickStick.style.transform = `translate(${this.stickX}px, ${this.stickY}px)`;
  }

  getMovement(): MovementInput {
    if (!this.active) {
      return { x: 0, y: 0 };
    }

    // Normalize to -1 to 1
    return {
      x: this.stickX / this.maxDistance,
      y: this.stickY / this.maxDistance
    };
  }

  destroy(): void {
    this.container.removeEventListener('touchstart', this.handleTouchStart);
    this.container.removeEventListener('touchmove', this.handleTouchMove);
    this.container.removeEventListener('touchend', this.handleTouchEnd);
    this.container.removeEventListener('touchcancel', this.handleTouchEnd);
  }

  reset(): void {
    this.active = false;
    this.stickX = 0;
    this.stickY = 0;
    this.joystickBase.classList.add('hidden');
  }
}