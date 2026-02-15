import { WALL_E, WALL_N, WALL_S, WALL_W } from './maze';
import type { MazeData, Point } from './types';

interface Viewport {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export interface RenderState {
  player: Point;
  playerRadius: number;
  finishPulse: number;
}

export class MazeRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly staticCanvas: HTMLCanvasElement;
  private readonly staticContext: CanvasRenderingContext2D;

  private cssWidth = 1;
  private cssHeight = 1;
  private dpr = 1;

  private maze: MazeData | null = null;
  private wallThicknessPx = 4;
  private viewport: Viewport = { offsetX: 0, offsetY: 0, scale: 1 };

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('2D context is not available');
    }

    this.canvas = canvas;
    this.context = context;

    this.staticCanvas = document.createElement('canvas');
    const staticContext = this.staticCanvas.getContext('2d');
    if (!staticContext) {
      throw new Error('Static 2D context is not available');
    }
    this.staticContext = staticContext;

    this.resize();
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.cssWidth = Math.max(1, Math.floor(rect.width || 1));
    this.cssHeight = Math.max(1, Math.floor(rect.height || 1));
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.setupCanvas(this.canvas, this.context, this.cssWidth, this.cssHeight, this.dpr);
    this.setupCanvas(this.staticCanvas, this.staticContext, this.cssWidth, this.cssHeight, this.dpr);

    if (this.maze) {
      this.recomputeViewport();
      this.redrawStaticLayer();
    } else {
      this.drawIdleBackground();
    }
  }

  setMaze(maze: MazeData, wallThicknessPx: number): void {
    this.maze = maze;
    this.wallThicknessPx = wallThicknessPx;
    this.recomputeViewport();
    this.redrawStaticLayer();
  }

  render(state: RenderState): void {
    this.context.clearRect(0, 0, this.cssWidth, this.cssHeight);
    this.context.drawImage(this.staticCanvas, 0, 0, this.cssWidth, this.cssHeight);

    if (!this.maze) {
      return;
    }

    const finishCenter = this.worldToScreen(this.maze.finish.x + 0.5, this.maze.finish.y + 0.5);
    const finishRadius = this.viewport.scale * 0.28 + state.finishPulse * this.viewport.scale * 0.05;

    this.context.beginPath();
    this.context.arc(finishCenter.x, finishCenter.y, finishRadius, 0, Math.PI * 2);
    this.context.strokeStyle = 'rgba(241, 94, 65, 0.9)';
    this.context.lineWidth = 2;
    this.context.stroke();

    const playerCenter = this.worldToScreen(state.player.x, state.player.y);
    const playerRadiusPx = state.playerRadius * this.viewport.scale;

    this.context.beginPath();
    this.context.arc(playerCenter.x, playerCenter.y, playerRadiusPx, 0, Math.PI * 2);
    this.context.fillStyle = '#0b5563';
    this.context.fill();

    this.context.beginPath();
    this.context.arc(playerCenter.x - playerRadiusPx * 0.28, playerCenter.y - playerRadiusPx * 0.32, playerRadiusPx * 0.45, 0, Math.PI * 2);
    this.context.fillStyle = 'rgba(255, 255, 255, 0.38)';
    this.context.fill();
  }

  screenToWorld(clientX: number, clientY: number): Point {
    const rect = this.canvas.getBoundingClientRect();
    const xInCanvas = clientX - rect.left;
    const yInCanvas = clientY - rect.top;

    if (!this.maze) {
      return { x: 0, y: 0 };
    }

    const worldX = (xInCanvas - this.viewport.offsetX) / this.viewport.scale;
    const worldY = (yInCanvas - this.viewport.offsetY) / this.viewport.scale;

    return {
      x: clamp(worldX, 0, this.maze.cols),
      y: clamp(worldY, 0, this.maze.rows)
    };
  }

  private drawIdleBackground(): void {
    this.staticContext.clearRect(0, 0, this.cssWidth, this.cssHeight);
    const gradient = this.staticContext.createLinearGradient(0, 0, this.cssWidth, this.cssHeight);
    gradient.addColorStop(0, '#f8f4ea');
    gradient.addColorStop(1, '#f0f7f4');
    this.staticContext.fillStyle = gradient;
    this.staticContext.fillRect(0, 0, this.cssWidth, this.cssHeight);
  }

  private redrawStaticLayer(): void {
    if (!this.maze) {
      this.drawIdleBackground();
      return;
    }

    const maze = this.maze;
    const ctx = this.staticContext;

    ctx.clearRect(0, 0, this.cssWidth, this.cssHeight);

    const backgroundGradient = ctx.createLinearGradient(0, 0, this.cssWidth, this.cssHeight);
    backgroundGradient.addColorStop(0, '#f8f4ea');
    backgroundGradient.addColorStop(1, '#dceee9');
    ctx.fillStyle = backgroundGradient;
    ctx.fillRect(0, 0, this.cssWidth, this.cssHeight);

    const panelX = this.viewport.offsetX - 10;
    const panelY = this.viewport.offsetY - 10;
    const panelW = maze.cols * this.viewport.scale + 20;
    const panelH = maze.rows * this.viewport.scale + 20;

    ctx.fillStyle = '#fffef9';
    ctx.fillRect(panelX, panelY, panelW, panelH);

    const wallThickness = Math.min(this.wallThicknessPx, this.viewport.scale * 0.36);

    ctx.beginPath();
    for (let y = 0; y < maze.rows; y++) {
      for (let x = 0; x < maze.cols; x++) {
        const index = y * maze.cols + x;
        const mask = maze.cells[index];

        const sx = this.viewport.offsetX + x * this.viewport.scale;
        const sy = this.viewport.offsetY + y * this.viewport.scale;
        const ex = sx + this.viewport.scale;
        const ey = sy + this.viewport.scale;

        if ((mask & WALL_N) !== 0) {
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, sy);
        }
        if ((mask & WALL_W) !== 0) {
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx, ey);
        }
        if (x === maze.cols - 1 && (mask & WALL_E) !== 0) {
          ctx.moveTo(ex, sy);
          ctx.lineTo(ex, ey);
        }
        if (y === maze.rows - 1 && (mask & WALL_S) !== 0) {
          ctx.moveTo(sx, ey);
          ctx.lineTo(ex, ey);
        }
      }
    }

    ctx.strokeStyle = '#2f3a48';
    ctx.lineWidth = wallThickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    const startCenter = this.worldToScreen(maze.start.x + 0.5, maze.start.y + 0.5);
    const finishCenter = this.worldToScreen(maze.finish.x + 0.5, maze.finish.y + 0.5);

    ctx.beginPath();
    ctx.arc(startCenter.x, startCenter.y, this.viewport.scale * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = '#2f9e44';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(finishCenter.x, finishCenter.y, this.viewport.scale * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(241, 94, 65, 0.28)';
    ctx.fill();
  }

  private recomputeViewport(): void {
    if (!this.maze) {
      return;
    }

    const maze = this.maze;
    const padding = Math.max(14, Math.min(this.cssWidth, this.cssHeight) * 0.04);
    const scale = Math.min(
      (this.cssWidth - padding * 2) / maze.cols,
      (this.cssHeight - padding * 2) / maze.rows
    );

    this.viewport.scale = Math.max(4, scale);
    this.viewport.offsetX = (this.cssWidth - maze.cols * this.viewport.scale) * 0.5;
    this.viewport.offsetY = (this.cssHeight - maze.rows * this.viewport.scale) * 0.5;
  }

  private worldToScreen(worldX: number, worldY: number): Point {
    return {
      x: this.viewport.offsetX + worldX * this.viewport.scale,
      y: this.viewport.offsetY + worldY * this.viewport.scale
    };
  }

  private setupCanvas(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    widthCss: number,
    heightCss: number,
    dpr: number
  ): void {
    canvas.width = Math.max(1, Math.floor(widthCss * dpr));
    canvas.height = Math.max(1, Math.floor(heightCss * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}
