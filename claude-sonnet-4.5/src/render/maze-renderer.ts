// === Maze Renderer with Offscreen Buffer ===

import type { Maze } from '../types';
import { CONFIG } from '../config';

export class MazeRenderer {
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private currentMazeSeed: number | null = null;

  render(ctx: CanvasRenderingContext2D, maze: Maze): void {
    // Use offscreen buffer if enabled
    if (CONFIG.PERFORMANCE.USE_OFFSCREEN_BUFFER) {
      this.renderWithBuffer(ctx, maze);
    } else {
      this.renderDirect(ctx, maze);
    }
  }

  private renderWithBuffer(ctx: CanvasRenderingContext2D, maze: Maze): void {
    // Recreate buffer if maze changed
    if (this.currentMazeSeed !== maze.seed || !this.offscreenCanvas) {
      this.createBuffer(maze);
    }

    // Draw buffered maze
    if (this.offscreenCanvas) {
      ctx.drawImage(this.offscreenCanvas, 0, 0);
    }
  }

  private createBuffer(maze: Maze): void {
    const width = maze.width * maze.cellSize;
    const height = maze.height * maze.cellSize;

    // Create offscreen canvas
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;

    this.offscreenCtx = this.offscreenCanvas.getContext('2d');

    if (!this.offscreenCtx) {
      console.error('Failed to create offscreen context');
      return;
    }

    // Render maze to buffer
    this.renderDirect(this.offscreenCtx, maze);
    this.currentMazeSeed = maze.seed;
  }

  private renderDirect(ctx: CanvasRenderingContext2D, maze: Maze): void {
    const { grid, width, height, cellSize } = maze;

    // Fill background
    ctx.fillStyle = CONFIG.MAZE.COLORS.PATH;
    ctx.fillRect(0, 0, width * cellSize, height * cellSize);

    // Draw walls
    ctx.strokeStyle = CONFIG.MAZE.COLORS.WALL;
    ctx.lineWidth = CONFIG.MAZE.WALL_THICKNESS;
    ctx.lineCap = 'square';

    ctx.beginPath();

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const cell = grid[row][col];
        const x = col * cellSize;
        const y = row * cellSize;

        // Top wall
        if (cell.walls.top) {
          ctx.moveTo(x, y);
          ctx.lineTo(x + cellSize, y);
        }

        // Right wall
        if (cell.walls.right) {
          ctx.moveTo(x + cellSize, y);
          ctx.lineTo(x + cellSize, y + cellSize);
        }

        // Bottom wall
        if (cell.walls.bottom) {
          ctx.moveTo(x, y + cellSize);
          ctx.lineTo(x + cellSize, y + cellSize);
        }

        // Left wall
        if (cell.walls.left) {
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + cellSize);
        }
      }
    }

    ctx.stroke();

    // Draw start marker
    this.drawMarker(
      ctx,
      maze.start.x,
      maze.start.y,
      cellSize * 0.4,
      CONFIG.MAZE.COLORS.START,
      '🏁'
    );

    // Draw finish marker with glow
    this.drawFinishMarker(ctx, maze.finish.x, maze.finish.y, cellSize * 0.4);
  }

  private drawMarker(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string,
    emoji: string
  ): void {
    // Circle background
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Emoji (if supported)
    ctx.fillStyle = '#ffffff';
    ctx.font = `${radius * 1.2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x, y);
  }

  private drawFinishMarker(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number
  ): void {
    // Animated glow
    const time = Date.now() / 1000;
    const glowRadius = radius + Math.sin(time * 3) * 5;

    // Glow
    const gradient = ctx.createRadialGradient(x, y, radius, x, y, glowRadius);
    gradient.addColorStop(0, CONFIG.MAZE.COLORS.FINISH);
    gradient.addColorStop(1, CONFIG.MAZE.COLORS.FINISH_GLOW);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Inner circle
    ctx.fillStyle = CONFIG.MAZE.COLORS.FINISH;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Emoji
    ctx.fillStyle = '#ffffff';
    ctx.font = `${radius * 1.2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎯', x, y);
  }

  clearBuffer(): void {
    this.offscreenCanvas = null;
    this.offscreenCtx = null;
    this.currentMazeSeed = null;
  }
}
