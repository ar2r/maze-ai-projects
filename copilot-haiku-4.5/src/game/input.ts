// ============================================================================
// Input System
// ============================================================================

import type { InputState } from './types';

export class InputSystem {
  private inputState: InputState = {
    keyboard: { up: false, down: false, left: false, right: false },
    mouse: { x: 0, y: 0 },
    mousePressed: false,
    touch: null,
    touchPressed: false,
  };

  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));

    // Mouse
    this.canvas.addEventListener('pointermove', (e) => this.handlePointerMove(e));
    this.canvas.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
    this.canvas.addEventListener('pointerup', (e) => this.handlePointerUp(e));

    // Prevent context menu on canvas
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Prevent zoom/pan on mobile
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    });
  }

  private handleKeyDown(e: KeyboardEvent): void {
    switch (e.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        this.inputState.keyboard.up = true;
        e.preventDefault();
        break;
      case 's':
      case 'arrowdown':
        this.inputState.keyboard.down = true;
        e.preventDefault();
        break;
      case 'a':
      case 'arrowleft':
        this.inputState.keyboard.left = true;
        e.preventDefault();
        break;
      case 'd':
      case 'arrowright':
        this.inputState.keyboard.right = true;
        e.preventDefault();
        break;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    switch (e.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        this.inputState.keyboard.up = false;
        break;
      case 's':
      case 'arrowdown':
        this.inputState.keyboard.down = false;
        break;
      case 'a':
      case 'arrowleft':
        this.inputState.keyboard.left = false;
        break;
      case 'd':
      case 'arrowright':
        this.inputState.keyboard.right = false;
        break;
    }
  }

  private handlePointerMove(e: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.inputState.mouse = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    // Touch position
    if (e.pointerType === 'touch') {
      this.inputState.touch = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  }

  private handlePointerDown(e: PointerEvent): void {
    if (e.pointerType === 'mouse') {
      this.inputState.mousePressed = true;
    } else if (e.pointerType === 'touch') {
      this.inputState.touchPressed = true;
    }
  }

  private handlePointerUp(e: PointerEvent): void {
    if (e.pointerType === 'mouse') {
      this.inputState.mousePressed = false;
    } else if (e.pointerType === 'touch') {
      this.inputState.touchPressed = false;
      this.inputState.touch = null;
    }
  }

  getInput(): InputState {
    return this.inputState;
  }

  reset(): void {
    this.inputState = {
      keyboard: { up: false, down: false, left: false, right: false },
      mouse: { x: 0, y: 0 },
      mousePressed: false,
      touch: null,
      touchPressed: false,
    };
  }
}
