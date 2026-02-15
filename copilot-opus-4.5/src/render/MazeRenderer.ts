import { MazeData, Wall } from '../utils/types';
import {
  WALL_COLOR,
  FLOOR_COLOR,
  START_COLOR,
  END_COLOR,
  WALL_THICKNESS,
} from '../utils/constants';

/**
 * Renders the static maze to an offscreen canvas
 * This is done once per level and then composited onto the main canvas
 */
export class MazeRenderer {
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private cellSize: number = 0;
  private maze: MazeData | null = null;

  constructor() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
  }

  /** Render maze to offscreen buffer */
  render(maze: MazeData, cellSize: number, dpr: number = 1): void {
    this.maze = maze;
    this.cellSize = cellSize;

    const width = maze.width * cellSize;
    const height = maze.height * cellSize;

    // Set canvas size with DPR scaling
    this.offscreenCanvas.width = width * dpr;
    this.offscreenCanvas.height = height * dpr;
    this.offscreenCtx.scale(dpr, dpr);

    const ctx = this.offscreenCtx;

    // Clear with floor color
    ctx.fillStyle = FLOOR_COLOR;
    ctx.fillRect(0, 0, width, height);

    // Draw start zone
    ctx.fillStyle = START_COLOR;
    ctx.fillRect(0, 0, cellSize, cellSize);

    // Draw end zone
    ctx.fillStyle = END_COLOR;
    ctx.fillRect(
      (maze.width - 1) * cellSize,
      (maze.height - 1) * cellSize,
      cellSize,
      cellSize
    );

    // Draw walls
    ctx.strokeStyle = WALL_COLOR;
    ctx.lineWidth = WALL_THICKNESS;
    ctx.lineCap = 'square';

    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const cell = maze.cells[y][x];
        const px = x * cellSize;
        const py = y * cellSize;

        // Draw north wall
        if (cell.walls & Wall.NORTH) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + cellSize, py);
          ctx.stroke();
        }

        // Draw east wall
        if (cell.walls & Wall.EAST) {
          ctx.beginPath();
          ctx.moveTo(px + cellSize, py);
          ctx.lineTo(px + cellSize, py + cellSize);
          ctx.stroke();
        }

        // Draw south wall
        if (cell.walls & Wall.SOUTH) {
          ctx.beginPath();
          ctx.moveTo(px, py + cellSize);
          ctx.lineTo(px + cellSize, py + cellSize);
          ctx.stroke();
        }

        // Draw west wall
        if (cell.walls & Wall.WEST) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px, py + cellSize);
          ctx.stroke();
        }
      }
    }

    // Draw outer border
    ctx.lineWidth = WALL_THICKNESS * 2;
    ctx.strokeRect(0, 0, width, height);

    // Reset scale for next render
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /** Get the offscreen canvas for compositing */
  getCanvas(): HTMLCanvasElement {
    return this.offscreenCanvas;
  }

  /** Get current cell size */
  getCellSize(): number {
    return this.cellSize;
  }

  /** Get current maze data */
  getMaze(): MazeData | null {
    return this.maze;
  }
}
