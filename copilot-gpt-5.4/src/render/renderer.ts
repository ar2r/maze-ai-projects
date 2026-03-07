import type { MazeData, Rect, RenderDebugData, Vector2, ViewportTransform } from '../types';

interface RenderState {
  playerPosition: Vector2 | null;
  playerRadius: number;
  finishPosition: Vector2 | null;
  debugData: RenderDebugData | null;
}

export class GameRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly staticLayer: HTMLCanvasElement;
  private readonly staticContext: CanvasRenderingContext2D;
  private maze: MazeData | null = null;
  private wallRects: readonly Rect[] = [];
  private viewport: ViewportTransform = {
    cssWidth: 1,
    cssHeight: 1,
    pixelWidth: 1,
    pixelHeight: 1,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    worldWidth: 1,
    worldHeight: 1,
    dpr: 1,
  };

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    const staticLayer = document.createElement('canvas');
    const staticContext = staticLayer.getContext('2d');

    if (!context || !staticContext) {
      throw new Error('Canvas 2D context is unavailable.');
    }

    this.canvas = canvas;
    this.context = context;
    this.staticLayer = staticLayer;
    this.staticContext = staticContext;
    this.context.imageSmoothingEnabled = true;
  }

  getViewport(): ViewportTransform {
    return this.viewport;
  }

  setScene(maze: MazeData, wallRects: readonly Rect[]): void {
    this.maze = maze;
    this.wallRects = wallRects;
    this.resize();
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const cssWidth = Math.max(1, Math.floor(rect.width));
    const cssHeight = Math.max(1, Math.floor(rect.height));
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    const pixelWidth = Math.max(1, Math.floor(cssWidth * dpr));
    const pixelHeight = Math.max(1, Math.floor(cssHeight * dpr));
    const worldWidth = this.maze?.cols ?? 1;
    const worldHeight = this.maze?.rows ?? 1;
    const scale = Math.min(pixelWidth / worldWidth, pixelHeight / worldHeight);
    const offsetX = (pixelWidth - worldWidth * scale) / 2;
    const offsetY = (pixelHeight - worldHeight * scale) / 2;

    this.canvas.width = pixelWidth;
    this.canvas.height = pixelHeight;
    this.staticLayer.width = pixelWidth;
    this.staticLayer.height = pixelHeight;

    this.viewport = {
      cssWidth,
      cssHeight,
      pixelWidth,
      pixelHeight,
      scale,
      offsetX,
      offsetY,
      worldWidth,
      worldHeight,
      dpr,
    };

    this.rebuildStaticLayer();
  }

  render(state: RenderState): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.drawImage(this.staticLayer, 0, 0);

    if (state.finishPosition) {
      this.drawFinishPulse(state.finishPosition);
    }

    if (state.playerPosition) {
      this.drawPlayer(state.playerPosition, state.playerRadius);
    }

    if (state.debugData) {
      this.drawDebugOverlay(state.debugData);
    }
  }

  private rebuildStaticLayer(): void {
    const context = this.staticContext;
    context.clearRect(0, 0, this.staticLayer.width, this.staticLayer.height);

    const gradient = context.createLinearGradient(0, 0, this.staticLayer.width, this.staticLayer.height);
    gradient.addColorStop(0, '#020617');
    gradient.addColorStop(1, '#111827');
    context.fillStyle = gradient;
    context.fillRect(0, 0, this.staticLayer.width, this.staticLayer.height);

    if (!this.maze) {
      return;
    }

    const mazeWidth = this.maze.cols * this.viewport.scale;
    const mazeHeight = this.maze.rows * this.viewport.scale;
    context.fillStyle = '#0f172a';
    context.fillRect(this.viewport.offsetX, this.viewport.offsetY, mazeWidth, mazeHeight);

    context.fillStyle = 'rgba(34, 197, 94, 0.18)';
    this.fillCell(0, 0);
    context.fillStyle = 'rgba(251, 146, 60, 0.24)';
    this.fillCell(this.maze.cols - 1, this.maze.rows - 1);

    context.fillStyle = '#e2e8f0';
    for (const rect of this.wallRects) {
      const screenRect = this.worldRectToScreenRect(rect);
      context.fillRect(screenRect.x, screenRect.y, screenRect.width, screenRect.height);
    }

    context.fillStyle = '#22c55e';
    this.drawMarker('S', 0.5, 0.5);
    context.fillStyle = '#fb923c';
    this.drawMarker('E', this.maze.cols - 0.5, this.maze.rows - 0.5);
  }

  private drawPlayer(position: Vector2, radius: number): void {
    const { x, y } = this.worldToScreen(position);
    const screenRadius = radius * this.viewport.scale;

    this.context.beginPath();
    this.context.arc(x, y, screenRadius, 0, Math.PI * 2);
    this.context.fillStyle = '#38bdf8';
    this.context.shadowColor = 'rgba(56, 189, 248, 0.45)';
    this.context.shadowBlur = Math.max(6, screenRadius * 0.8);
    this.context.fill();
    this.context.shadowBlur = 0;

    this.context.beginPath();
    this.context.arc(x - screenRadius * 0.28, y - screenRadius * 0.28, screenRadius * 0.32, 0, Math.PI * 2);
    this.context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.context.fill();
  }

  private drawFinishPulse(position: Vector2): void {
    const { x, y } = this.worldToScreen(position);
    const radius = this.viewport.scale * 0.18;
    this.context.beginPath();
    this.context.arc(x, y, radius, 0, Math.PI * 2);
    this.context.fillStyle = '#f59e0b';
    this.context.fill();
  }

  private drawDebugOverlay(debugData: RenderDebugData): void {
    const lines = [
      `FPS: ${debugData.fps.toFixed(1)}`,
      `Seed: ${debugData.seed}`,
      `Grid: ${debugData.grid}`,
      `Player: ${debugData.player}`,
      `Hits: ${debugData.wallHits}`,
      `Control: ${debugData.control}`,
    ];
    const padding = 14 * this.viewport.dpr;
    const lineHeight = 16 * this.viewport.dpr;
    const width = 260 * this.viewport.dpr;
    const height = lines.length * lineHeight + padding * 1.5;

    this.context.fillStyle = 'rgba(2, 6, 23, 0.78)';
    this.context.fillRect(padding, padding, width, height);
    this.context.fillStyle = '#cbd5e1';
    this.context.font = `${12 * this.viewport.dpr}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    this.context.textBaseline = 'top';

    lines.forEach((line, index) => {
      this.context.fillText(line, padding * 1.5, padding * 1.35 + index * lineHeight);
    });
  }

  private fillCell(cellX: number, cellY: number): void {
    const inset = this.viewport.scale * 0.08;
    this.staticContext.fillRect(
      this.viewport.offsetX + cellX * this.viewport.scale + inset,
      this.viewport.offsetY + cellY * this.viewport.scale + inset,
      this.viewport.scale - inset * 2,
      this.viewport.scale - inset * 2,
    );
  }

  private drawMarker(label: string, worldX: number, worldY: number): void {
    const { x, y } = this.worldToScreen({ x: worldX, y: worldY });
    this.staticContext.font = `${Math.max(14, this.viewport.scale * 0.3)}px Inter, system-ui, sans-serif`;
    this.staticContext.textAlign = 'center';
    this.staticContext.textBaseline = 'middle';
    this.staticContext.fillText(label, x, y);
  }

  private worldToScreen(point: Vector2): Vector2 {
    return {
      x: this.viewport.offsetX + point.x * this.viewport.scale,
      y: this.viewport.offsetY + point.y * this.viewport.scale,
    };
  }

  private worldRectToScreenRect(rect: Rect): Rect {
    return {
      x: this.viewport.offsetX + rect.x * this.viewport.scale,
      y: this.viewport.offsetY + rect.y * this.viewport.scale,
      width: rect.width * this.viewport.scale,
      height: rect.height * this.viewport.scale,
    };
  }
}
