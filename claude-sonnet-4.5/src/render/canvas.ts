// === Canvas Setup with HiDPI Support ===

import { CONFIG } from '../config';

export class CanvasManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private pixelRatio: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to get 2D context');
    }

    this.ctx = context;
    this.pixelRatio = window.devicePixelRatio || 1;

    this.setupCanvas();
    this.handleResize();

    // Listen for resize events
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('orientationchange', this.handleResize);
  }

  private setupCanvas(): void {
    // Disable image smoothing for crisp pixel art
    this.ctx.imageSmoothingEnabled = false;
  }

  private handleResize = (): void => {
    // Debounce resize
    setTimeout(() => {
      this.resize();
    }, 100);
  };

  resize(): { width: number; height: number } {
    const container = this.canvas.parentElement;
    if (!container) {
      return { width: this.canvas.width, height: this.canvas.height };
    }

    // Get container size
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Apply constraints
    const width = Math.max(CONFIG.CANVAS.MIN_WIDTH, containerWidth);
    const height = Math.max(CONFIG.CANVAS.MIN_HEIGHT, containerHeight);

    // Set display size (CSS)
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    // Set actual size (accounting for pixel ratio)
    const scaledWidth = Math.floor(width * this.pixelRatio);
    const scaledHeight = Math.floor(height * this.pixelRatio);

    // Clamp to max render size
    this.canvas.width = Math.min(scaledWidth, CONFIG.CANVAS.MAX_RENDER_SIZE);
    this.canvas.height = Math.min(scaledHeight, CONFIG.CANVAS.MAX_RENDER_SIZE);

    // Scale context to account for pixel ratio
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.pixelRatio, this.pixelRatio);

    return { width, height };
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getDisplaySize(): { width: number; height: number } {
    return {
      width: this.canvas.clientWidth,
      height: this.canvas.clientHeight,
    };
  }

  getActualSize(): { width: number; height: number } {
    return {
      width: this.canvas.width / this.pixelRatio,
      height: this.canvas.height / this.pixelRatio,
    };
  }

  clear(): void {
    const { width, height } = this.getActualSize();
    this.ctx.clearRect(0, 0, width, height);
  }

  destroy(): void {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleResize);
  }
}
