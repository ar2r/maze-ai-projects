import type { Maze } from '../types';

/**
 * Retro color palette for the pixel maze.
 */
export const COLORS = {
  bg: '#1a1a2e',        // dark blue background
  wall: '#e94560',      // red-pink walls
  corridor: '#16213e',  // dark blue corridors
  player: '#0fff50',    // neon green player
  playerTrail: '#0a8a30',
  exit: '#f5d442',      // golden exit
  start: '#4cc9f0',     // cyan start
  text: '#eaeaea',      // light gray text
  joystickBase: 'rgba(76, 201, 240, 0.25)',
  joystickKnob: 'rgba(76, 201, 240, 0.6)',
  wallHit: '#ff2040',   // bright red flash on collision
};

/**
 * Render the maze to an offscreen canvas (called once per level).
 * Uses pixel-art style with thick walls.
 */
export function createMazeBuffer(
  maze: Maze,
  cellSize: number,
): HTMLCanvasElement {
  const bufferW = maze.cols * cellSize;
  const bufferH = maze.rows * cellSize;

  const buffer = document.createElement('canvas');
  buffer.width = bufferW;
  buffer.height = bufferH;
  const ctx = buffer.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // Fill with corridor color
  ctx.fillStyle = COLORS.corridor;
  ctx.fillRect(0, 0, bufferW, bufferH);

  // Wall thickness: ~2px minimum, scales slightly with cell size
  const wallThickness = Math.max(2, Math.floor(cellSize * 0.08));

  ctx.strokeStyle = COLORS.wall;
  ctx.lineWidth = wallThickness;
  ctx.lineCap = 'square';

  // Draw walls
  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      const x = c * cellSize;
      const y = r * cellSize;
      const cell = maze.cells[r][c];

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

  // Draw start cell highlight
  const sx = maze.start.x * cellSize;
  const sy = maze.start.y * cellSize;
  ctx.fillStyle = COLORS.start;
  ctx.globalAlpha = 0.25;
  ctx.fillRect(sx + wallThickness, sy + wallThickness,
    cellSize - wallThickness * 2, cellSize - wallThickness * 2);
  ctx.globalAlpha = 1;

  // Draw exit cell highlight (pulsing will be done in main render loop)
  const ex = maze.end.x * cellSize;
  const ey = maze.end.y * cellSize;
  ctx.fillStyle = COLORS.exit;
  ctx.globalAlpha = 0.3;
  ctx.fillRect(ex + wallThickness, ey + wallThickness,
    cellSize - wallThickness * 2, cellSize - wallThickness * 2);
  ctx.globalAlpha = 1;

  return buffer;
}

/**
 * Render the maze buffer to the main canvas with camera offset.
 */
export function renderMazeBuffer(
  ctx: CanvasRenderingContext2D,
  buffer: HTMLCanvasElement,
  cameraX: number,
  cameraY: number,
  dpr: number,
): void {
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.drawImage(buffer, -cameraX, -cameraY);
  ctx.restore();
}
