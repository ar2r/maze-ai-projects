// Maze renderer - draws static maze to offscreen canvas

import { Maze } from '../core/types';
import { CanvasManager } from './canvas';

type RenderContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export class MazeRenderer {
  private wallColor: string = '#2d4a6f';
  private pathColor: string = '#0f0f23';
  private startColor: string = '#22c55e';
  private endColor: string = '#ef4444';
  private wallThickness: number = 4;

  render(canvasManager: CanvasManager, maze: Maze): void {
    const mazePixelWidth = maze.width * maze.cellSize;
    const mazePixelHeight = maze.height * maze.cellSize;

    canvasManager.createMazeCanvas(mazePixelWidth, mazePixelHeight);

    const mazeCtx = canvasManager.getMazeContext();
    if (!mazeCtx) return;

    // Clear background
    mazeCtx.fillStyle = this.pathColor;
    mazeCtx.fillRect(0, 0, mazePixelWidth, mazePixelHeight);

    // Draw start and end markers
    this.drawCell(mazeCtx, maze, 0, 0, this.startColor);
    this.drawCell(mazeCtx, maze, maze.width - 1, maze.height - 1, this.endColor);

    // Draw walls
    mazeCtx.strokeStyle = this.wallColor;
    mazeCtx.lineWidth = this.wallThickness;
    mazeCtx.lineCap = 'square';

    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const cell = maze.cells[y][x];
        const px = x * maze.cellSize;
        const py = y * maze.cellSize;

        mazeCtx.beginPath();

        if (cell.walls.north) {
          mazeCtx.moveTo(px, py);
          mazeCtx.lineTo(px + maze.cellSize, py);
        }
        if (cell.walls.south) {
          mazeCtx.moveTo(px, py + maze.cellSize);
          mazeCtx.lineTo(px + maze.cellSize, py + maze.cellSize);
        }
        if (cell.walls.west) {
          mazeCtx.moveTo(px, py);
          mazeCtx.lineTo(px, py + maze.cellSize);
        }
        if (cell.walls.east) {
          mazeCtx.moveTo(px + maze.cellSize, py);
          mazeCtx.lineTo(px + maze.cellSize, py + maze.cellSize);
        }

        mazeCtx.stroke();
      }
    }
  }

  private drawCell(ctx: RenderContext, maze: Maze, x: number, y: number, color: string): void {
    const px = x * maze.cellSize + maze.cellSize / 2;
    const py = y * maze.cellSize + maze.cellSize / 2;
    const radius = maze.cellSize / 3;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  renderStartEnd(ctx: CanvasRenderingContext2D, maze: Maze, scale: number): void {
    // Start position
    ctx.fillStyle = this.startColor;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(maze.startX * scale, maze.startY * scale, maze.cellSize / 3 * scale, 0, Math.PI * 2);
    ctx.fill();

    // End position
    ctx.fillStyle = this.endColor;
    ctx.beginPath();
    ctx.arc(maze.endX * scale, maze.endY * scale, maze.cellSize / 3 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }
}