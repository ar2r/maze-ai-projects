import type { Point } from './types';

type RuntimeControlMode = 'drag' | 'joystick';

export class InputController {
  private readonly canvas: HTMLCanvasElement;
  private readonly joystickBase: HTMLElement;
  private readonly joystickKnob: HTMLElement;

  private screenToWorld: (clientX: number, clientY: number) => Point;
  private mode: RuntimeControlMode = 'drag';

  private upPressed = false;
  private downPressed = false;
  private leftPressed = false;
  private rightPressed = false;

  private dragActive = false;
  private dragPointerId = -1;
  private dragTargetX = 0;
  private dragTargetY = 0;

  private joystickActive = false;
  private joystickPointerId = -1;
  private joystickVectorX = 0;
  private joystickVectorY = 0;

  private readonly outputVector: Point = { x: 0, y: 0 };

  constructor(
    canvas: HTMLCanvasElement,
    joystickBase: HTMLElement,
    joystickKnob: HTMLElement,
    screenToWorld: (clientX: number, clientY: number) => Point
  ) {
    this.canvas = canvas;
    this.joystickBase = joystickBase;
    this.joystickKnob = joystickKnob;
    this.screenToWorld = screenToWorld;

    this.bindEvents();
  }

  setMode(mode: RuntimeControlMode): void {
    this.mode = mode;
    this.joystickBase.classList.toggle('hidden', mode !== 'joystick');

    if (mode !== 'joystick') {
      this.resetJoystick();
    }
  }

  setScreenToWorldMapper(mapper: (clientX: number, clientY: number) => Point): void {
    this.screenToWorld = mapper;
  }

  getDirection(playerPosition: Point): Point {
    let x = 0;
    let y = 0;

    if (this.leftPressed) {
      x -= 1;
    }
    if (this.rightPressed) {
      x += 1;
    }
    if (this.upPressed) {
      y -= 1;
    }
    if (this.downPressed) {
      y += 1;
    }

    if (this.mode === 'joystick' && this.joystickActive) {
      x += this.joystickVectorX;
      y += this.joystickVectorY;
    }

    if (this.dragActive) {
      const dx = this.dragTargetX - playerPosition.x;
      const dy = this.dragTargetY - playerPosition.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 0.03) {
        x += dx / distance;
        y += dy / distance;
      }
    }

    const length = Math.hypot(x, y);
    if (length > 1) {
      x /= length;
      y /= length;
    }

    this.outputVector.x = x;
    this.outputVector.y = y;
    return this.outputVector;
  }

  clearTransient(): void {
    this.dragActive = false;
    this.dragPointerId = -1;
    this.resetJoystick();
  }

  private bindEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    this.canvas.addEventListener('pointerdown', this.handleCanvasPointerDown);
    this.canvas.addEventListener('pointermove', this.handleCanvasPointerMove);
    this.canvas.addEventListener('pointerup', this.handleCanvasPointerUp);
    this.canvas.addEventListener('pointercancel', this.handleCanvasPointerUp);

    this.joystickBase.addEventListener('pointerdown', this.handleJoystickPointerDown);
    this.joystickBase.addEventListener('pointermove', this.handleJoystickPointerMove);
    this.joystickBase.addEventListener('pointerup', this.handleJoystickPointerUp);
    this.joystickBase.addEventListener('pointercancel', this.handleJoystickPointerUp);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        this.upPressed = true;
        event.preventDefault();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.downPressed = true;
        event.preventDefault();
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.leftPressed = true;
        event.preventDefault();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.rightPressed = true;
        event.preventDefault();
        break;
      default:
        break;
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        this.upPressed = false;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.downPressed = false;
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.leftPressed = false;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.rightPressed = false;
        break;
      default:
        break;
    }
  };

  private readonly handleCanvasPointerDown = (event: PointerEvent): void => {
    const allowDrag = event.pointerType === 'mouse' || this.mode === 'drag';
    if (!allowDrag) {
      return;
    }

    this.dragActive = true;
    this.dragPointerId = event.pointerId;

    this.canvas.setPointerCapture(event.pointerId);
    this.updateDragTarget(event.clientX, event.clientY);
    event.preventDefault();
  };

  private readonly handleCanvasPointerMove = (event: PointerEvent): void => {
    if (!this.dragActive || event.pointerId !== this.dragPointerId) {
      return;
    }

    this.updateDragTarget(event.clientX, event.clientY);
    event.preventDefault();
  };

  private readonly handleCanvasPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.dragPointerId) {
      return;
    }

    this.dragActive = false;
    this.dragPointerId = -1;
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
  };

  private readonly handleJoystickPointerDown = (event: PointerEvent): void => {
    if (this.mode !== 'joystick') {
      return;
    }

    this.joystickActive = true;
    this.joystickPointerId = event.pointerId;
    this.joystickBase.setPointerCapture(event.pointerId);
    this.updateJoystick(event.clientX, event.clientY);
    event.preventDefault();
  };

  private readonly handleJoystickPointerMove = (event: PointerEvent): void => {
    if (!this.joystickActive || event.pointerId !== this.joystickPointerId) {
      return;
    }

    this.updateJoystick(event.clientX, event.clientY);
    event.preventDefault();
  };

  private readonly handleJoystickPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.joystickPointerId) {
      return;
    }

    if (this.joystickBase.hasPointerCapture(event.pointerId)) {
      this.joystickBase.releasePointerCapture(event.pointerId);
    }
    this.resetJoystick();
  };

  private updateDragTarget(clientX: number, clientY: number): void {
    const worldPoint = this.screenToWorld(clientX, clientY);
    this.dragTargetX = worldPoint.x;
    this.dragTargetY = worldPoint.y;
  }

  private updateJoystick(clientX: number, clientY: number): void {
    const rect = this.joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width * 0.5;
    const centerY = rect.top + rect.height * 0.5;
    const dx = clientX - centerX;
    const dy = clientY - centerY;

    const maxDistance = rect.width * 0.35;
    const distance = Math.hypot(dx, dy);
    const clampedDistance = distance > maxDistance ? maxDistance : distance;
    const scale = distance > 0 ? clampedDistance / distance : 0;

    const offsetX = dx * scale;
    const offsetY = dy * scale;

    this.joystickVectorX = offsetX / maxDistance;
    this.joystickVectorY = offsetY / maxDistance;

    this.joystickKnob.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  }

  private resetJoystick(): void {
    this.joystickActive = false;
    this.joystickPointerId = -1;
    this.joystickVectorX = 0;
    this.joystickVectorY = 0;
    this.joystickKnob.style.transform = 'translate(0px, 0px)';
  }
}
