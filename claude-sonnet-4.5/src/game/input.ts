// === Input Manager - Mouse, Keyboard, Touch, Joystick ===

import type { InputState, Position, GameSettings } from '../types';
import { CONFIG } from '../config';

export class InputManager {
  private state: InputState = {
    keyboard: { up: false, down: false, left: false, right: false },
    mouse: { active: false, target: { x: 0, y: 0 } },
    joystick: { active: false, angle: 0, magnitude: 0 },
  };

  private canvas: HTMLCanvasElement;
  private settings: GameSettings;
  private joystickElement: HTMLElement | null = null;
  private joystickBase: HTMLElement | null = null;
  private joystickStick: HTMLElement | null = null;
  private joystickTouchId: number | null = null;

  constructor(canvas: HTMLCanvasElement, settings: GameSettings) {
    this.canvas = canvas;
    this.settings = settings;
    this.setupEventListeners();
    this.setupJoystick();
  }

  private setupEventListeners(): void {
    // Keyboard
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Pointer (unified mouse/touch)
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerUp);

    // Prevent context menu on long press
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private setupJoystick(): void {
    this.joystickElement = document.getElementById('joystick-container');
    this.joystickBase = document.getElementById('joystick-base');
    this.joystickStick = document.getElementById('joystick-stick');

    if (this.joystickBase && this.joystickStick) {
      this.joystickBase.addEventListener('pointerdown', this.handleJoystickStart);
      this.joystickBase.addEventListener('pointermove', this.handleJoystickMove);
      this.joystickBase.addEventListener('pointerup', this.handleJoystickEnd);
      this.joystickBase.addEventListener('pointercancel', this.handleJoystickEnd);
    }
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.state.keyboard.up = true;
        e.preventDefault();
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.state.keyboard.down = true;
        e.preventDefault();
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.state.keyboard.left = true;
        e.preventDefault();
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.state.keyboard.right = true;
        e.preventDefault();
        break;
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.state.keyboard.up = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.state.keyboard.down = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.state.keyboard.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.state.keyboard.right = false;
        break;
    }
  };

  private getCanvasRelativePosition(e: PointerEvent): Position {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  private handlePointerDown = (e: PointerEvent): void => {
    if (this.shouldUseMouse()) {
      this.state.mouse.active = true;
      this.state.mouse.target = this.getCanvasRelativePosition(e);
      e.preventDefault();
    }
  };

  private handlePointerMove = (e: PointerEvent): void => {
    if (this.shouldUseMouse() && this.state.mouse.active) {
      this.state.mouse.target = this.getCanvasRelativePosition(e);
      e.preventDefault();
    }
  };

  private handlePointerUp = (): void => {
    if (this.shouldUseMouse()) {
      this.state.mouse.active = false;
    }
  };

  private handleJoystickStart = (e: PointerEvent): void => {
    if (!this.shouldUseJoystick()) return;

    this.joystickTouchId = e.pointerId;
    this.state.joystick.active = true;
    this.updateJoystick(e);
    e.preventDefault();
  };

  private handleJoystickMove = (e: PointerEvent): void => {
    if (!this.shouldUseJoystick() || e.pointerId !== this.joystickTouchId) return;

    this.updateJoystick(e);
    e.preventDefault();
  };

  private handleJoystickEnd = (e: PointerEvent): void => {
    if (!this.shouldUseJoystick() || e.pointerId !== this.joystickTouchId) return;

    this.joystickTouchId = null;
    this.state.joystick.active = false;
    this.state.joystick.angle = 0;
    this.state.joystick.magnitude = 0;

    if (this.joystickStick) {
      this.joystickStick.style.transform = 'translate(-50%, -50%)';
    }
  };

  private updateJoystick(e: PointerEvent): void {
    if (!this.joystickBase || !this.joystickStick) return;

    const rect = this.joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;

    const distance = Math.hypot(deltaX, deltaY);
    const maxDistance = CONFIG.INPUT.JOYSTICK_RADIUS;

    const magnitude = Math.min(distance / maxDistance, 1);
    const angle = Math.atan2(deltaY, deltaX);

    // Apply dead zone
    if (magnitude < CONFIG.INPUT.JOYSTICK_DEAD_ZONE) {
      this.state.joystick.magnitude = 0;
      this.joystickStick.style.transform = 'translate(-50%, -50%)';
    } else {
      this.state.joystick.magnitude = magnitude;
      this.state.joystick.angle = angle;

      // Visual feedback
      const clampedX = Math.cos(angle) * Math.min(distance, maxDistance);
      const clampedY = Math.sin(angle) * Math.min(distance, maxDistance);
      this.joystickStick.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;
    }
  }

  private shouldUseMouse(): boolean {
    return (
      this.settings.controlMode === 'mouse' ||
      (this.settings.controlMode === 'auto' && !this.isMobile())
    );
  }

  private shouldUseJoystick(): boolean {
    return (
      this.settings.controlMode === 'joystick' ||
      (this.settings.controlMode === 'auto' && this.isMobile())
    );
  }

  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.matchMedia('(max-width: 768px)').matches;
  }

  getState(): InputState {
    return { ...this.state };
  }

  updateSettings(settings: GameSettings): void {
    this.settings = settings;
    this.updateJoystickVisibility();
  }

  updateJoystickVisibility(): void {
    if (this.joystickElement) {
      if (this.shouldUseJoystick()) {
        this.joystickElement.classList.remove('hidden');
      } else {
        this.joystickElement.classList.add('hidden');
      }
    }
  }

  reset(): void {
    this.state = {
      keyboard: { up: false, down: false, left: false, right: false },
      mouse: { active: false, target: { x: 0, y: 0 } },
      joystick: { active: false, angle: 0, magnitude: 0 },
    };
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUp);

    if (this.joystickBase) {
      this.joystickBase.removeEventListener('pointerdown', this.handleJoystickStart);
      this.joystickBase.removeEventListener('pointermove', this.handleJoystickMove);
      this.joystickBase.removeEventListener('pointerup', this.handleJoystickEnd);
      this.joystickBase.removeEventListener('pointercancel', this.handleJoystickEnd);
    }
  }
}
