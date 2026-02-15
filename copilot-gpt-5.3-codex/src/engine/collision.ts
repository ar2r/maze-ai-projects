import { WALL_E, WALL_N, WALL_S, WALL_W, type Maze } from '../core/types';

export interface CollisionResult {
  x: number;
  y: number;
  collided: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function cellIndex(x: number, y: number, width: number): number {
  return y * width + x;
}

function resolveAtPosition(
  maze: Maze,
  x: number,
  y: number,
  radius: number,
  cellSize: number
): CollisionResult {
  const maxX = maze.width * cellSize;
  const maxY = maze.height * cellSize;
  let px = clamp(x, radius, maxX - radius);
  let py = clamp(y, radius, maxY - radius);
  let collided = px !== x || py !== y;

  const cx = clamp(Math.floor(px / cellSize), 0, maze.width - 1);
  const cy = clamp(Math.floor(py / cellSize), 0, maze.height - 1);
  const walls = maze.cells[cellIndex(cx, cy, maze.width)];

  const left = cx * cellSize;
  const right = (cx + 1) * cellSize;
  const top = cy * cellSize;
  const bottom = (cy + 1) * cellSize;

  if ((walls & WALL_W) !== 0 && px - radius < left) {
    px = left + radius;
    collided = true;
  }
  if ((walls & WALL_E) !== 0 && px + radius > right) {
    px = right - radius;
    collided = true;
  }
  if ((walls & WALL_N) !== 0 && py - radius < top) {
    py = top + radius;
    collided = true;
  }
  if ((walls & WALL_S) !== 0 && py + radius > bottom) {
    py = bottom - radius;
    collided = true;
  }

  // Guard against precision glitches at corners.
  px = clamp(px, radius, maxX - radius);
  py = clamp(py, radius, maxY - radius);

  return { x: px, y: py, collided };
}

export function moveWithCollision(
  maze: Maze,
  x: number,
  y: number,
  dx: number,
  dy: number,
  radius: number,
  cellSize: number
): CollisionResult {
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return { x, y, collided: false };

  const step = Math.max(1, radius * 0.5);
  const steps = Math.max(1, Math.ceil(distance / step));
  let px = x;
  let py = y;
  let collided = false;

  for (let i = 0; i < steps; i += 1) {
    const ix = dx / steps;
    const iy = dy / steps;

    const tryX = resolveAtPosition(maze, px + ix, py, radius, cellSize);
    px = tryX.x;
    collided = collided || tryX.collided;

    const tryY = resolveAtPosition(maze, px, py + iy, radius, cellSize);
    py = tryY.y;
    collided = collided || tryY.collided;
  }

  return { x: px, y: py, collided };
}
