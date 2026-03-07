import type { InputState, ViewportInfo } from './types';
import { clamp } from '../utils/math';

interface InputCallbacks {
  onPauseToggle: () => void;
  onRestart: () => void;
}

export class InputController {
  public readonly state: InputState = {
    pointerActive: false,
    pointerWorld: { x: 0, y: 0 },
    keyboardX: 0,
    keyboardY: 0
  };

  private activePointerId: number | null = null;
  private viewport: ViewportInfo = { widthPx: 1, heightPx: 1, scale: 1, offsetX: 0, offsetY: 0 };
  private readonly keyState = new Set<string>();

  constructor(
    private readonly element: HTMLElement,
    private worldSize: { width: number; height: number },
    private readonly callbacks: InputCallbacks
  ) {
    this.bind();
  }

  updateViewport(viewport: ViewportInfo, worldSize: { width: number; height: number }): void {
    this.viewport = viewport;
    this.worldSize = worldSize;
  }

  dispose(): void {
    this.element.removeEventListener('pointerdown', this.onPointerDown);
    this.element.removeEventListener('pointermove', this.onPointerMove);
    this.element.removeEventListener('pointerup', this.onPointerUp);
    this.element.removeEventListener('pointercancel', this.onPointerUp);
    this.element.removeEventListener('lostpointercapture', this.onPointerUp);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  cancelPointer(): void {
    this.state.pointerActive = false;
    this.activePointerId = null;
  }

  private bind(): void {
    this.element.addEventListener('pointerdown', this.onPointerDown);
    this.element.addEventListener('pointermove', this.onPointerMove);
    this.element.addEventListener('pointerup', this.onPointerUp);
    this.element.addEventListener('pointercancel', this.onPointerUp);
    this.element.addEventListener('lostpointercapture', this.onPointerUp);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private onPointerDown = (event: PointerEvent): void => {
    this.activePointerId = event.pointerId;
    this.state.pointerActive = true;
    this.element.setPointerCapture(event.pointerId);
    this.writePointer(event);
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (this.activePointerId !== event.pointerId) {
      return;
    }

    this.writePointer(event);
  };

  private onPointerUp = (event: Event): void => {
    if ('pointerId' in event && this.activePointerId !== null && event.pointerId !== this.activePointerId) {
      return;
    }

    this.cancelPointer();
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === ' ' || event.key === 'Escape') {
      event.preventDefault();
      this.callbacks.onPauseToggle();
      return;
    }

    if (event.key.toLowerCase() === 'r') {
      event.preventDefault();
      this.callbacks.onRestart();
      return;
    }

    this.keyState.add(event.key.toLowerCase());
    this.recomputeKeyboard();
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    this.keyState.delete(event.key.toLowerCase());
    this.recomputeKeyboard();
  };

  private recomputeKeyboard(): void {
    const left = this.keyState.has('a') || this.keyState.has('arrowleft');
    const right = this.keyState.has('d') || this.keyState.has('arrowright');
    const up = this.keyState.has('w') || this.keyState.has('arrowup');
    const down = this.keyState.has('s') || this.keyState.has('arrowdown');

    this.state.keyboardX = (right ? 1 : 0) - (left ? 1 : 0);
    this.state.keyboardY = (down ? 1 : 0) - (up ? 1 : 0);
  }

  private writePointer(event: PointerEvent): void {
    const bounds = this.element.getBoundingClientRect();
    const localX = event.clientX - bounds.left;
    const localY = event.clientY - bounds.top;
    this.state.pointerWorld.x = clamp((localX - this.viewport.offsetX) / this.viewport.scale, 0, this.worldSize.width);
    this.state.pointerWorld.y = clamp((localY - this.viewport.offsetY) / this.viewport.scale, 0, this.worldSize.height);
  }
}
