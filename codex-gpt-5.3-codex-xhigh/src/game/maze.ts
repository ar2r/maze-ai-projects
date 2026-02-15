import type { MazeCell, MazeData } from './types';
import { SeededRng } from './rng';

export const WALL_N = 1;
export const WALL_E = 2;
export const WALL_S = 4;
export const WALL_W = 8;
export const ALL_WALLS = WALL_N | WALL_E | WALL_S | WALL_W;

type DirectionIndex = 0 | 1 | 2 | 3;

const DX: ReadonlyArray<number> = [0, 1, 0, -1];
const DY: ReadonlyArray<number> = [-1, 0, 1, 0];
const WALL_MASK: ReadonlyArray<number> = [WALL_N, WALL_E, WALL_S, WALL_W];
const OPPOSITE_WALL: ReadonlyArray<number> = [WALL_S, WALL_W, WALL_N, WALL_E];

export interface MazeGenerationOptions {
  cols: number;
  rows: number;
  seed: number;
  extraOpenings?: number;
}

export function generateMaze(options: MazeGenerationOptions): MazeData {
  const { cols, rows, seed } = options;
  const extraOpenings = Math.max(0, options.extraOpenings ?? 0);

  if (cols < 2 || rows < 2) {
    throw new Error('Maze dimensions must be at least 2x2');
  }

  const rng = new SeededRng(seed);
  const total = cols * rows;
  const cells = new Uint8Array(total);
  cells.fill(ALL_WALLS);

  const visited = new Uint8Array(total);
  const stack = new Int32Array(total);
  let stackLength = 0;
  const neighborIndex = new Int32Array(4);
  const neighborDir = new Int8Array(4);

  const startIndex = 0;
  visited[startIndex] = 1;
  stack[stackLength++] = startIndex;

  while (stackLength > 0) {
    const current = stack[stackLength - 1];
    const x = current % cols;
    const y = (current / cols) | 0;
    let count = 0;

    for (let dir = 0 as DirectionIndex; dir < 4; dir = (dir + 1) as DirectionIndex) {
      const nx = x + DX[dir];
      const ny = y + DY[dir];
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) {
        continue;
      }
      const next = indexOf(nx, ny, cols);
      if (visited[next] === 1) {
        continue;
      }
      neighborIndex[count] = next;
      neighborDir[count] = dir;
      count++;
    }

    if (count === 0) {
      stackLength--;
      continue;
    }

    const picked = rng.int(count);
    const next = neighborIndex[picked];
    const dir = neighborDir[picked] as DirectionIndex;

    cells[current] &= ~WALL_MASK[dir];
    cells[next] &= ~OPPOSITE_WALL[dir];

    visited[next] = 1;
    stack[stackLength++] = next;
  }

  if (extraOpenings > 0) {
    carveExtraOpenings(cells, cols, rows, extraOpenings, rng);
  }

  const start: MazeCell = { x: 0, y: 0 };
  const distancesFromStart = buildDistanceMap(cells, cols, rows, start);

  let farthestIndex = startIndex;
  let farthestDistance = 0;
  for (let i = 0; i < total; i++) {
    const distance = distancesFromStart[i];
    if (distance > farthestDistance) {
      farthestDistance = distance;
      farthestIndex = i;
    }
  }

  const finish: MazeCell = {
    x: farthestIndex % cols,
    y: (farthestIndex / cols) | 0
  };

  return {
    cols,
    rows,
    cells,
    start,
    finish,
    seed,
    shortestPath: farthestDistance,
    distancesFromStart
  };
}

export function isReachable(maze: MazeData, from: MazeCell, to: MazeCell): boolean {
  const distances = buildDistanceMap(maze.cells, maze.cols, maze.rows, from);
  const target = indexOf(to.x, to.y, maze.cols);
  return distances[target] >= 0;
}

export function isMazeConnected(maze: MazeData): boolean {
  const distances = buildDistanceMap(maze.cells, maze.cols, maze.rows, maze.start);
  for (let i = 0; i < distances.length; i++) {
    if (distances[i] < 0) {
      return false;
    }
  }
  return true;
}

export function countOpenEdges(maze: MazeData): number {
  let open = 0;
  for (let y = 0; y < maze.rows; y++) {
    for (let x = 0; x < maze.cols; x++) {
      const index = indexOf(x, y, maze.cols);
      const mask = maze.cells[index];
      if (x < maze.cols - 1 && (mask & WALL_E) === 0) {
        open++;
      }
      if (y < maze.rows - 1 && (mask & WALL_S) === 0) {
        open++;
      }
    }
  }
  return open;
}

export function indexOf(x: number, y: number, cols: number): number {
  return y * cols + x;
}

function buildDistanceMap(cells: Uint8Array, cols: number, rows: number, start: MazeCell): Int32Array {
  const total = cols * rows;
  const distances = new Int32Array(total);
  distances.fill(-1);

  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const startIndex = indexOf(start.x, start.y, cols);
  distances[startIndex] = 0;
  queue[tail++] = startIndex;

  while (head < tail) {
    const current = queue[head++];
    const x = current % cols;
    const y = (current / cols) | 0;
    const nextDistance = distances[current] + 1;
    const mask = cells[current];

    if ((mask & WALL_N) === 0 && y > 0) {
      const next = current - cols;
      if (distances[next] < 0) {
        distances[next] = nextDistance;
        queue[tail++] = next;
      }
    }

    if ((mask & WALL_E) === 0 && x < cols - 1) {
      const next = current + 1;
      if (distances[next] < 0) {
        distances[next] = nextDistance;
        queue[tail++] = next;
      }
    }

    if ((mask & WALL_S) === 0 && y < rows - 1) {
      const next = current + cols;
      if (distances[next] < 0) {
        distances[next] = nextDistance;
        queue[tail++] = next;
      }
    }

    if ((mask & WALL_W) === 0 && x > 0) {
      const next = current - 1;
      if (distances[next] < 0) {
        distances[next] = nextDistance;
        queue[tail++] = next;
      }
    }
  }

  return distances;
}

function carveExtraOpenings(
  cells: Uint8Array,
  cols: number,
  rows: number,
  requestedOpenings: number,
  rng: SeededRng
): void {
  const total = cols * rows;
  const maxAttempts = requestedOpenings * 8;
  let created = 0;

  for (let attempt = 0; attempt < maxAttempts && created < requestedOpenings; attempt++) {
    const index = rng.int(total);
    const x = index % cols;
    const y = (index / cols) | 0;

    const dir = rng.int(4) as DirectionIndex;
    const nx = x + DX[dir];
    const ny = y + DY[dir];

    if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) {
      continue;
    }

    const neighbor = indexOf(nx, ny, cols);
    if ((cells[index] & WALL_MASK[dir]) === 0) {
      continue;
    }

    cells[index] &= ~WALL_MASK[dir];
    cells[neighbor] &= ~OPPOSITE_WALL[dir];
    created++;
  }
}
