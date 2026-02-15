// Input manager for mouse, keyboard, and touch

import { Game } from '../engine/game';

export class InputManager {
  private game: Game;
  private canvas: HTMLCanvasElement;
  private joystickElement: HTMLElement | null;
  private joystickActive: boolean = false;
  private joystickCenter: { x: number; y: number } = { x: 0, y: 0 };

  constructor(game: Game, canvas: HTMLCanvasElement) {
    this.game = game;
    this.canvas = canvas;
    this.joystickElement = document.getElementById('virtual-joystick');
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Mouse/Pointer events
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointerleave', this.handlePointerUp);

    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Touch events for virtual joystick
    if (this.joystickElement) {
      this.joystickElement.addEventListener('touchstart', this.handleJoystickStart, { passive: false });
      this.joystickElement.addEventListener('touchmove', this.handleJoystickMove, { passive: false });
      this.joystickElement.addEventListener('touchend', this.handleJoystickEnd, { passive: false });
    }

    // Prevent default behaviors
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('gesturestart', (e) => e.preventDefault());
  }

  private handlePointerDown = (e: PointerEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.game.input.mouse.x = x;
    this.game.input.mouse.y = y;
    this.game.input.mouse.isDown = true;
  };

  private handlePointerMove = (e: PointerEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.game.input.mouse.x = x;
    this.game.input.mouse.y = y;
  };

  private handlePointerUp = (): void => {
    this.game.input.mouse.isDown = false;
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase();
    
    switch (key) {
      case 'w':
      case 'arrowup':
        this.game.input.keyboard.up = true;
        e.preventDefault();
        break;
      case 's':
      case 'arrowdown':
        this.game.input.keyboard.down = true;
        e.preventDefault();
        break;
      case 'a':
      case 'arrowleft':
        this.game.input.keyboard.left = true;
        e.preventDefault();
        break;
      case 'd':
      case 'arrowright':
        this.game.input.keyboard.right = true;
        e.preventDefault();
        break;
      case 'escape':
        if (this.game.getState() === 'PLAYING') {
          this.game.pause();
        }
        break;
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase();
    
    switch (key) {
      case 'w':
      case 'arrowup':
        this.game.input.keyboard.up = false;
        break;
      case 's':
      case 'arrowdown':
        this.game.input.keyboard.down = false;
        break;
      case 'a':
      case 'arrowleft':
        this.game.input.keyboard.left = false;
        break;
      case 'd':
      case 'arrowright':
        this.game.input.keyboard.right = false;
        break;
    }
  };

  private handleJoystickStart = (e: TouchEvent): void => {
    e.preventDefault();
    if (!this.joystickElement) return;

    const touch = e.touches[0];
    const rect = this.joystickElement.getBoundingClientRect();
    this.joystickCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    this.joystickActive = true;
    this.updateJoystick(touch.clientX, touch.clientY);
  };

  private handleJoystickMove = (e: TouchEvent): void => {
    e.preventDefault();
    if (!this.joystickActive) return;

    const touch = e.touches[0];
    this.updateJoystick(touch.clientX, touch.clientY);
  };

  private handleJoystickEnd = (e: TouchEvent): void => {
    e.preventDefault();
    this.joystickActive = false;
    this.game.input.touch.active = false;
    
    if (this.joystickElement) {
      const knob = this.joystickElement.querySelector('::after') as HTMLElement;
      if (knob) {
        this.joystickElement.style.setProperty('--knob-x', '50%');
        this.joystickElement.style.setProperty('--knob-y', '50%');
      }
    }
  };

  private updateJoystick(clientX: number, clientY: number): void {
    const dx = clientX - this.joystickCenter.x;
    const dy = clientY - this.joystickCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 50;

    const clampedDistance = Math.min(distance, maxDistance);
    const angle = Math.atan2(dy, dx);

    const x = Math.cos(angle) * clampedDistance;
    const y = Math.sin(angle) * clampedDistance;

    // Update touch input
    this.game.input.touch.active = distance > 10;
    this.game.input.touch.currentX = this.canvas.width / 2 + x * 10;
    this.game.input.touch.currentY = this.canvas.height / 2 + y * 10;

    // Update visual knob position
    if (this.joystickElement) {
      const knobX = 50 + (x / 60) * 50;
      const knobY = 50 + (y / 60) * 50;
      this.joystickElement.style.setProperty('--knob-x', `${knobX}%`);
      this.joystickElement.style.setProperty('--knob-y', `${knobY}%`);
    }
  }

  public destroy(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    
    if (this.joystickElement) {
      this.joystickElement.removeEventListener('touchstart', this.handleJoystickStart);
      this.joystickElement.removeEventListener('touchmove', this.handleJoystickMove);
      this.joystickElement.removeEventListener('touchend', this.handleJoystickEnd);
    }
  }
}
