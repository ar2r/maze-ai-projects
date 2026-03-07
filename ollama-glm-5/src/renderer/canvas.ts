// Canvas management with HiDPI support

export class CanvasManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private dpr: number;
  private mazeCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;
  private mazeCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2d context');
    this.ctx = context;
    this.dpr = window.devicePixelRatio || 1;
    this.resize();
  }

  resize(): void {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;

    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(this.dpr, this.dpr);
  }

  createMazeCanvas(width: number, height: number): void {
    // Use OffscreenCanvas if available, otherwise regular canvas
    if (typeof OffscreenCanvas !== 'undefined') {
      this.mazeCanvas = new OffscreenCanvas(width * this.dpr, height * this.dpr);
    } else {
      this.mazeCanvas = document.createElement('canvas');
      this.mazeCanvas.width = width * this.dpr;
      this.mazeCanvas.height = height * this.dpr;
    }

    this.mazeCtx = this.mazeCanvas.getContext('2d');
    if (this.mazeCtx) {
      this.mazeCtx.scale(this.dpr, this.dpr);
    }
  }

  getMazeContext(): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null {
    return this.mazeCtx;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawMazeBackground(offsetX: number, offsetY: number): void {
    if (this.mazeCanvas) {
      this.ctx.drawImage(
        this.mazeCanvas,
        offsetX * this.dpr,
        offsetY * this.dpr,
        this.mazeCanvas.width,
        this.mazeCanvas.height,
        0,
        0,
        this.mazeCanvas.width / this.dpr,
        this.mazeCanvas.height / this.dpr
      );
    }
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  getDpr(): number {
    return this.dpr;
  }

  getMazeCanvasWidth(): number {
    return this.mazeCanvas ? this.mazeCanvas.width / this.dpr : 0;
  }

  getMazeCanvasHeight(): number {
    return this.mazeCanvas ? this.mazeCanvas.height / this.dpr : 0;
  }
}