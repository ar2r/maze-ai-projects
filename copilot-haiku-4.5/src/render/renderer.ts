// ============================================================================
// Canvas Rendering System
// ============================================================================

import type { GameStateData, Maze } from '../game/types';
import { getMazeWalls } from '../game/maze-gen';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private wallBuffer: OffscreenCanvas | null = null;
  private wallBufferCtx: OffscreenCanvasRenderingContext2D | null = null;
  private lastMazeSeed: number | null = null;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.setupHighDPI();
  }

  private setupHighDPI(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    // Use bounding rect if available, otherwise fallback to window dimensions
    const width = rect.width > 0 ? rect.width : window.innerWidth * 0.9;
    const height = rect.height > 0 ? rect.height : window.innerHeight * 0.9;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;

    this.ctx.scale(dpr, dpr);
    this.ctx.imageSmoothingEnabled = true;
  }

  private createWallBuffer(maze: Maze): void {
    const width = maze.width * maze.cellSize;
    const height = maze.height * maze.cellSize;

    if (typeof OffscreenCanvas !== 'undefined') {
      this.wallBuffer = new OffscreenCanvas(width, height);
      this.wallBufferCtx = this.wallBuffer.getContext('2d')!;
      this.drawMazeWalls(maze);
    }
  }

  private drawMazeWalls(maze: Maze): void {
    if (!this.wallBufferCtx) {
      this.drawMazeWallsOnContext(maze, this.ctx);
      return;
    }

    this.wallBufferCtx.fillStyle = '#333';
    const walls = getMazeWalls(maze);
    for (const wall of walls) {
      this.wallBufferCtx.fillRect(wall.x, wall.y, wall.w, wall.h);
    }
  }

  private drawMazeWallsOnContext(
    maze: Maze,
    ctx: CanvasRenderingContext2D
  ): void {
    ctx.fillStyle = '#333';
    const walls = getMazeWalls(maze);
    for (const wall of walls) {
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    }
  }

  render(state: GameStateData): void {
    const { maze, player } = state;

    if (!maze) {
      return;
    }

    // Clear
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(0, 0, maze.width * maze.cellSize, maze.height * maze.cellSize);

    // Recreate wall buffer if maze changed
    if (this.lastMazeSeed !== maze.seed) {
      this.wallBuffer = null;
      this.wallBufferCtx = null;
      this.lastMazeSeed = maze.seed;
    }

    // Draw maze (use wall buffer if available)
    if (!this.wallBuffer) {
      this.createWallBuffer(maze);
    }

    if (this.wallBuffer) {
      this.ctx.drawImage(
        this.wallBuffer,
        0,
        0,
        maze.width * maze.cellSize,
        maze.height * maze.cellSize
      );
    } else {
      this.drawMazeWallsOnContext(maze, this.ctx);
    }

    // Draw start position
    this.ctx.fillStyle = '#4CAF50';
    this.ctx.beginPath();
    this.ctx.arc(
      maze.start.x * maze.cellSize + maze.cellSize / 2,
      maze.start.y * maze.cellSize + maze.cellSize / 2,
      15,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    // Draw end position
    this.ctx.fillStyle = '#FF9800';
    this.ctx.beginPath();
    this.ctx.arc(
      maze.end.x * maze.cellSize + maze.cellSize / 2,
      maze.end.y * maze.cellSize + maze.cellSize / 2,
      15,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    // Draw player
    if (player) {
      this.ctx.fillStyle = '#2196F3';
      this.ctx.beginPath();
      this.ctx.arc(player.pos.x, player.pos.y, player.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Player outline
      this.ctx.strokeStyle = '#1565C0';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  clear(): void {
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(
      0,
      0,
      this.canvas.width / (window.devicePixelRatio || 1),
      this.canvas.height / (window.devicePixelRatio || 1)
    );
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}
