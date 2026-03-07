import { DIR_E, DIR_N, DIR_S, DIR_W, type LevelConfig, type MazeCell, type MazeData, type WallSegment } from './types';
import { createRng, randomInt } from './rng';
import { findFarthestCell, validateMaze } from './mazeValidation';

const DIRECTIONS = [
  { bit: DIR_N, dx: 0, dy: -1, opposite: DIR_S },
  { bit: DIR_E, dx: 1, dy: 0, opposite: DIR_W },
  { bit: DIR_S, dx: 0, dy: 1, opposite: DIR_N },
  { bit: DIR_W, dx: -1, dy: 0, opposite: DIR_E }
] as const;

function indexFor(width: number, x: number, y: number): number {
  return y * width + x;
}

function buildWallSegments(width: number, height: number, cells: MazeCell[]): WallSegment[] {
  const segments: WallSegment[] = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const cell = cells[indexFor(width, x, y)];
      if ((cell.passages & DIR_N) === 0) {
        segments.push({ x1: x, y1: y, x2: x + 1, y2: y, orientation: 'horizontal' });
      }
      if ((cell.passages & DIR_W) === 0) {
        segments.push({ x1: x, y1: y, x2: x, y2: y + 1, orientation: 'vertical' });
      }
      if (y === height - 1 && (cell.passages & DIR_S) === 0) {
        segments.push({ x1: x, y1: y + 1, x2: x + 1, y2: y + 1, orientation: 'horizontal' });
      }
      if (x === width - 1 && (cell.passages & DIR_E) === 0) {
        segments.push({ x1: x + 1, y1: y, x2: x + 1, y2: y + 1, orientation: 'vertical' });
      }
    }
  }

  return segments;
}

export function generateMaze(config: LevelConfig): MazeData {
  const { gridWidth: width, gridHeight: height, seed } = config;
  const cells: MazeCell[] = Array.from({ length: width * height }, () => ({ passages: 0 }));
  const visited = new Uint8Array(width * height);
  const stack = new Uint16Array(width * height);
  const rng = createRng(seed);
  const startX = randomInt(rng, 0, Math.max(0, Math.min(width - 1, 1)));
  const startY = randomInt(rng, 0, Math.max(0, Math.min(height - 1, 1)));
  let stackSize = 0;
  let currentIndex = indexFor(width, startX, startY);

  visited[currentIndex] = 1;
  stack[stackSize++] = currentIndex;

  while (stackSize > 0) {
    currentIndex = stack[stackSize - 1];
    const currentX = currentIndex % width;
    const currentY = Math.floor(currentIndex / width);
    const candidates: number[] = [];

    for (let directionIndex = 0; directionIndex < DIRECTIONS.length; directionIndex += 1) {
      const direction = DIRECTIONS[directionIndex];
      const nextX = currentX + direction.dx;
      const nextY = currentY + direction.dy;

      if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
        continue;
      }

      const nextIndex = indexFor(width, nextX, nextY);
      if (visited[nextIndex] === 1) {
        continue;
      }

      candidates.push(directionIndex);
    }

    if (candidates.length === 0) {
      stackSize -= 1;
      continue;
    }

    const choice = DIRECTIONS[candidates[randomInt(rng, 0, candidates.length - 1)]];
    const nextX = currentX + choice.dx;
    const nextY = currentY + choice.dy;
    const nextIndex = indexFor(width, nextX, nextY);

    cells[currentIndex].passages |= choice.bit;
    cells[nextIndex].passages |= choice.opposite;
    visited[nextIndex] = 1;
    stack[stackSize++] = nextIndex;
  }

  const provisionalMaze: MazeData = {
    width,
    height,
    cells,
    wallSegments: [],
    startCell: { x: startX, y: startY },
    finishCell: { x: width - 1, y: height - 1 },
    seed,
    optimalPathLength: 0
  };

  provisionalMaze.finishCell = findFarthestCell(provisionalMaze, provisionalMaze.startCell).point;
  provisionalMaze.wallSegments = buildWallSegments(width, height, cells);
  provisionalMaze.optimalPathLength = validateMaze(provisionalMaze).optimalPathLength;

  return provisionalMaze;
}
