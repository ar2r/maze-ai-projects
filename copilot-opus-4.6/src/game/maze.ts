import type { Cell, MazeData, LevelConfig } from '../types';
import { mulberry32, levelSeed } from '../utils/rng';

/** Direction offsets: [dRow, dCol] */
const DIRS: [number, number, keyof Cell['walls'], keyof Cell['walls']][] = [
  [-1, 0, 'top', 'bottom'],    // up
  [0, 1, 'right', 'left'],     // right
  [1, 0, 'bottom', 'top'],     // down
  [0, -1, 'left', 'right'],    // left
];

function createGrid(rows: number, cols: number): Cell[][] {
  const grid: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      grid[r][c] = {
        row: r, col: c,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
      };
    }
  }
  return grid;
}

/**
 * Generates a perfect maze using randomized DFS (backtracker).
 * Seeded PRNG ensures determinism.
 */
function carveMaze(grid: Cell[][], rows: number, cols: number, rng: () => number): void {
  const stack: Cell[] = [];
  const start = grid[0][0];
  start.visited = true;
  stack.push(start);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    // Find unvisited neighbors
    const neighbors: [number, number, keyof Cell['walls'], keyof Cell['walls']][] = [];
    for (const [dr, dc, wall, opposite] of DIRS) {
      const nr = current.row + dr;
      const nc = current.col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc].visited) {
        neighbors.push([nr, nc, wall, opposite]);
      }
    }

    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }

    // Pick random neighbor (seeded)
    const idx = Math.floor(rng() * neighbors.length);
    const [nr, nc, wall, opposite] = neighbors[idx];
    const next = grid[nr][nc];

    // Remove walls between current and next
    current.walls[wall] = false;
    next.walls[opposite] = false;

    next.visited = true;
    stack.push(next);
  }
}

/**
 * BFS to find shortest path length from start to end.
 */
export function bfsSolve(grid: Cell[][], start: [number, number], end: [number, number]): number {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const queue: [number, number, number][] = [[start[0], start[1], 0]];
  visited[start[0]][start[1]] = true;

  while (queue.length > 0) {
    const [r, c, d] = queue.shift()!;
    if (r === end[0] && c === end[1]) return d;

    for (const [dr, dc, wall] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
        // Check if wall is open
        if (!grid[r][c].walls[wall]) {
          visited[nr][nc] = true;
          queue.push([nr, nc, d + 1]);
        }
      }
    }
  }
  return -1; // unreachable (should never happen in perfect maze)
}

/**
 * Check connectivity: every cell reachable from (0,0).
 */
export function isFullyConnected(grid: Cell[][]): boolean {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const stack: [number, number][] = [[0, 0]];
  visited[0][0] = true;
  let count = 0;

  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    count++;
    for (const [dr, dc, wall] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && !grid[r][c].walls[wall]) {
        visited[nr][nc] = true;
        stack.push([nr, nc]);
      }
    }
  }

  return count === rows * cols;
}

/**
 * Main entry: generate a maze for a given level config.
 */
export function generateMaze(config: LevelConfig): MazeData {
  const { cols, rows, level } = config;
  const seed = levelSeed(level);
  const rng = mulberry32(seed);

  const cells = createGrid(rows, cols);
  carveMaze(cells, rows, cols, rng);

  // Start = top-left, End = bottom-right
  const start = { x: 0, y: 0 };
  const end = { x: cols - 1, y: rows - 1 };

  const solutionLength = bfsSolve(cells, [0, 0], [rows - 1, cols - 1]);

  return { cols, rows, cells, start, end, seed, solutionLength };
}
