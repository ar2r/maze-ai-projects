import type { MazeData, LevelConfig, Vec2 } from '../types';

/**
 * Renders maze walls to an offscreen canvas (drawn once per level).
 */
export class MazeRenderer {
  private offscreen: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  width = 0;
  height = 0;
  offsetX = 0;
  offsetY = 0;

  constructor() {
    this.offscreen = document.createElement('canvas');
    this.ctx = this.offscreen.getContext('2d')!;
  }

  /**
   * Render maze to offscreen buffer. Returns offset used.
   */
  render(maze: MazeData, config: LevelConfig, canvasW: number, canvasH: number, dpr: number): void {
    const { cellSize } = config;
    const mazeW = maze.cols * cellSize;
    const mazeH = maze.rows * cellSize;

    // Center maze on screen
    this.offsetX = Math.floor((canvasW / dpr - mazeW) / 2);
    this.offsetY = Math.floor((canvasH / dpr - mazeH) / 2);

    this.width = canvasW;
    this.height = canvasH;
    this.offscreen.width = canvasW;
    this.offscreen.height = canvasH;

    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvasW / dpr, canvasH / dpr);

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvasW / dpr, canvasH / dpr);

    // Maze floor
    ctx.fillStyle = '#16213e';
    ctx.fillRect(this.offsetX, this.offsetY, mazeW, mazeH);

    // Start cell highlight
    ctx.fillStyle = 'rgba(22, 199, 154, 0.25)';
    ctx.fillRect(this.offsetX, this.offsetY, cellSize, cellSize);

    // End cell highlight
    ctx.fillStyle = 'rgba(255, 107, 107, 0.25)';
    ctx.fillRect(
      this.offsetX + (maze.cols - 1) * cellSize,
      this.offsetY + (maze.rows - 1) * cellSize,
      cellSize, cellSize
    );

    // Start/end labels
    ctx.font = `${Math.max(10, cellSize * 0.4)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#16c79a';
    ctx.fillText('S', this.offsetX + cellSize / 2, this.offsetY + cellSize / 2);
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText('F',
      this.offsetX + (maze.cols - 1) * cellSize + cellSize / 2,
      this.offsetY + (maze.rows - 1) * cellSize + cellSize / 2
    );

    // Draw walls
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    for (let r = 0; r < maze.rows; r++) {
      for (let c = 0; c < maze.cols; c++) {
        const cell = maze.cells[r][c];
        const x = this.offsetX + c * cellSize;
        const y = this.offsetY + r * cellSize;

        if (cell.walls.top) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + cellSize, y);
          ctx.stroke();
        }
        if (cell.walls.right) {
          ctx.beginPath();
          ctx.moveTo(x + cellSize, y);
          ctx.lineTo(x + cellSize, y + cellSize);
          ctx.stroke();
        }
        if (cell.walls.bottom) {
          ctx.beginPath();
          ctx.moveTo(x, y + cellSize);
          ctx.lineTo(x + cellSize, y + cellSize);
          ctx.stroke();
        }
        if (cell.walls.left) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + cellSize);
          ctx.stroke();
        }
      }
    }
  }

  drawTo(targetCtx: CanvasRenderingContext2D): void {
    targetCtx.drawImage(this.offscreen, 0, 0);
  }
}

/**
 * Renders the player ball on the player canvas layer.
 */
export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  pos: Vec2,
  radius: number,
  dpr: number,
  canvasW: number,
  canvasH: number
): void {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, canvasW / dpr, canvasH / dpr);

  // Glow
  const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius * 2.5);
  gradient.addColorStop(0, 'rgba(22, 199, 154, 0.4)');
  gradient.addColorStop(1, 'rgba(22, 199, 154, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius * 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Ball
  ctx.fillStyle = '#16c79a';
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.arc(pos.x - radius * 0.25, pos.y - radius * 0.25, radius * 0.4, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Debug overlay rendering.
 */
export class DebugOverlay {
  private el: HTMLDivElement | null = null;
  private fps = 0;
  private frameCount = 0;
  private lastFpsTime = 0;

  show(): void {
    if (!this.el) {
      this.el = document.createElement('div');
      this.el.id = 'debug-overlay';
      document.body.appendChild(this.el);
    }
    this.el.style.display = 'block';
  }

  hide(): void {
    if (this.el) this.el.style.display = 'none';
  }

  tick(now: number): void {
    this.frameCount++;
    if (now - this.lastFpsTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = now;
    }
  }

  update(data: {
    seed: number;
    gridSize: string;
    playerPos: string;
    wallHits: number;
    level: number;
    solutionLen: number;
  }): void {
    if (!this.el) return;
    this.el.innerHTML = [
      `FPS: ${this.fps}`,
      `Level: ${data.level}`,
      `Seed: ${data.seed}`,
      `Grid: ${data.gridSize}`,
      `Player: ${data.playerPos}`,
      `Hits: ${data.wallHits}`,
      `Solution: ${data.solutionLen} steps`,
    ].join('<br>');
  }
}
