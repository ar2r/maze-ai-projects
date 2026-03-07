import { MazeData, Wall } from '../utils/types';
import {
  WALL_COLOR,
  FLOOR_COLOR,
  START_COLOR,
  END_COLOR,
  WALL_THICKNESS,
  PASSAGE_HIGHLIGHT_COLOR,
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

    // Highlight open passages to make them more visible
    ctx.fillStyle = PASSAGE_HIGHLIGHT_COLOR;
    const passageWidth = cellSize * 0.4;  // Width of the passage highlight
    
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const cell = maze.cells[y][x];
        const px = x * cellSize;
        const py = y * cellSize;
        const centerX = px + cellSize / 2;
        const centerY = py + cellSize / 2;

        // Draw highlight strip for open passages (no wall)
        // East passage
        if (!(cell.walls & Wall.EAST) && x < maze.width - 1) {
          ctx.fillRect(
            centerX,
            centerY - passageWidth / 2,
            cellSize,
            passageWidth
          );
        }
        // South passage
        if (!(cell.walls & Wall.SOUTH) && y < maze.height - 1) {
          ctx.fillRect(
            centerX - passageWidth / 2,
            centerY,
            passageWidth,
            cellSize
          );
        }
      }
    }

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

  /** Render pulsating goal effect on main canvas */
  renderGoalPulse(
    ctx: CanvasRenderingContext2D,
    offsetX: number,
    offsetY: number,
    time: number
  ): void {
    if (!this.maze) return;

    const endX = this.maze.end.x * this.cellSize + offsetX;
    const endY = this.maze.end.y * this.cellSize + offsetY;
    const centerX = endX + this.cellSize / 2;
    const centerY = endY + this.cellSize / 2;

    // Pulsating effect using sine wave
    const pulse = Math.sin(time * 0.003) * 0.3 + 0.7; // 0.4 to 1.0
    const glowRadius = this.cellSize * 0.8 * pulse;

    // Draw outer glow
    const gradient = ctx.createRadialGradient(
      centerX, centerY, this.cellSize * 0.2,
      centerX, centerY, glowRadius
    );
    gradient.addColorStop(0, `rgba(74, 222, 128, ${0.6 * pulse})`);
    gradient.addColorStop(0.5, `rgba(74, 222, 128, ${0.3 * pulse})`);
    gradient.addColorStop(1, 'rgba(74, 222, 128, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(
      endX - this.cellSize * 0.3,
      endY - this.cellSize * 0.3,
      this.cellSize * 1.6,
      this.cellSize * 1.6
    );
  }

  /** Render hint arrow pointing toward the goal */
  renderHintArrow(
    ctx: CanvasRenderingContext2D,
    playerX: number,
    playerY: number,
    offsetX: number,
    offsetY: number,
    time: number
  ): void {
    if (!this.maze) return;

    // Find the next open direction from player's current cell
    const cellX = Math.floor(playerX / this.cellSize);
    const cellY = Math.floor(playerY / this.cellSize);
    
    if (cellX < 0 || cellX >= this.maze.width || cellY < 0 || cellY >= this.maze.height) {
      return;
    }

    // BFS to find next step toward goal
    const direction = this.findNextStepToGoal(cellX, cellY);
    if (!direction) return;

    const screenX = playerX + offsetX;
    const screenY = playerY + offsetY;

    // Calculate arrow direction
    const arrowLength = this.cellSize * 0.6;
    const arrowEndX = screenX + direction.dx * arrowLength;
    const arrowEndY = screenY + direction.dy * arrowLength;

    // Pulsating opacity
    const pulse = Math.sin(time * 0.005) * 0.3 + 0.7;

    ctx.save();
    ctx.strokeStyle = `rgba(255, 200, 100, ${pulse})`;
    ctx.fillStyle = `rgba(255, 200, 100, ${pulse})`;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    // Draw arrow line
    ctx.beginPath();
    ctx.moveTo(screenX, screenY);
    ctx.lineTo(arrowEndX, arrowEndY);
    ctx.stroke();

    // Draw arrowhead
    const headLength = 10;
    const angle = Math.atan2(direction.dy, direction.dx);
    ctx.beginPath();
    ctx.moveTo(arrowEndX, arrowEndY);
    ctx.lineTo(
      arrowEndX - headLength * Math.cos(angle - Math.PI / 6),
      arrowEndY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      arrowEndX - headLength * Math.cos(angle + Math.PI / 6),
      arrowEndY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /** Find direction to take toward goal using BFS */
  private findNextStepToGoal(startX: number, startY: number): { dx: number; dy: number } | null {
    if (!this.maze) return null;

    const DIRECTIONS = [
      { dx: 0, dy: -1, wall: Wall.NORTH },
      { dx: 1, dy: 0, wall: Wall.EAST },
      { dx: 0, dy: 1, wall: Wall.SOUTH },
      { dx: -1, dy: 0, wall: Wall.WEST },
    ];

    const visited = new Set<string>();
    const queue: { x: number; y: number; firstDir: { dx: number; dy: number } | null }[] = [
      { x: startX, y: startY, firstDir: null }
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.x},${current.y}`;

      if (current.x === this.maze.end.x && current.y === this.maze.end.y) {
        return current.firstDir;
      }

      if (visited.has(key)) continue;
      visited.add(key);

      const cell = this.maze.cells[current.y][current.x];

      for (const dir of DIRECTIONS) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;

        if (nx >= 0 && nx < this.maze.width && ny >= 0 && ny < this.maze.height) {
          if ((cell.walls & dir.wall) === 0) {
            const firstDir = current.firstDir || { dx: dir.dx, dy: dir.dy };
            queue.push({ x: nx, y: ny, firstDir });
          }
        }
      }
    }

    return null;
  }
}
