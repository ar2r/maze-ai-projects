import type { Cell, CellWalls, Maze, RngFn, Vec2 } from '../types';

/**
 * Create an empty grid with all walls present.
 */
export function createGrid(cols: number, rows: number): Cell[][] {
  const grid: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r,
        col: c,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
      });
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Remove the wall between two adjacent cells.
 * Maintains wall consistency (both sides updated).
 */
function removeWallBetween(a: Cell, b: Cell): void {
  const dr = b.row - a.row;
  const dc = b.col - a.col;

  if (dc === 1) {
    // b is to the right of a
    a.walls.right = false;
    b.walls.left = false;
  } else if (dc === -1) {
    // b is to the left of a
    a.walls.left = false;
    b.walls.right = false;
  } else if (dr === 1) {
    // b is below a
    a.walls.bottom = false;
    b.walls.top = false;
  } else if (dr === -1) {
    // b is above a
    a.walls.top = false;
    b.walls.bottom = false;
  }
}

/**
 * Get unvisited neighbors of a cell.
 */
function getUnvisitedNeighbors(
  grid: Cell[][],
  cell: Cell,
  cols: number,
  rows: number,
): Cell[] {
  const neighbors: Cell[] = [];
  const { row, col } = cell;

  if (row > 0 && !grid[row - 1][col].visited) neighbors.push(grid[row - 1][col]);
  if (row < rows - 1 && !grid[row + 1][col].visited) neighbors.push(grid[row + 1][col]);
  if (col > 0 && !grid[row][col - 1].visited) neighbors.push(grid[row][col - 1]);
  if (col < cols - 1 && !grid[row][col + 1].visited) neighbors.push(grid[row][col + 1]);

  return neighbors;
}

/**
 * DFS Backtracker maze generation.
 * Produces a "perfect" maze (exactly one path between any two cells).
 */
function dfsBacktracker(grid: Cell[][], cols: number, rows: number, rng: RngFn): void {
  // Start from top-left corner
  const stack: Cell[] = [];
  const start = grid[0][0];
  start.visited = true;
  stack.push(start);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(grid, current, cols, rows);

    if (neighbors.length === 0) {
      // Backtrack
      stack.pop();
    } else {
      // Choose random unvisited neighbor
      const idx = Math.floor(rng() * neighbors.length);
      const next = neighbors[idx];
      removeWallBetween(current, next);
      next.visited = true;
      stack.push(next);
    }
  }
}

/**
 * BFS to find the cell farthest from `start`.
 * Returns {x: col, y: row} of the farthest cell and the distance.
 */
function bfsFarthest(
  grid: Cell[][],
  cols: number,
  rows: number,
  startRow: number,
  startCol: number,
): { pos: Vec2; dist: number } {
  const dist = Array.from({ length: rows }, () => new Array(cols).fill(-1));
  dist[startRow][startCol] = 0;
  const queue: [number, number][] = [[startRow, startCol]];
  let farthestPos: Vec2 = { x: startCol, y: startRow };
  let maxDist = 0;

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const cell = grid[r][c];
    const d = dist[r][c];

    if (d > maxDist) {
      maxDist = d;
      farthestPos = { x: c, y: r };
    }

    // Explore connected neighbors
    if (!cell.walls.top && r > 0 && dist[r - 1][c] === -1) {
      dist[r - 1][c] = d + 1;
      queue.push([r - 1, c]);
    }
    if (!cell.walls.right && c < cols - 1 && dist[r][c + 1] === -1) {
      dist[r][c + 1] = d + 1;
      queue.push([r, c + 1]);
    }
    if (!cell.walls.bottom && r < rows - 1 && dist[r + 1][c] === -1) {
      dist[r + 1][c] = d + 1;
      queue.push([r + 1, c]);
    }
    if (!cell.walls.left && c > 0 && dist[r][c - 1] === -1) {
      dist[r][c - 1] = d + 1;
      queue.push([r, c - 1]);
    }
  }

  return { pos: farthestPos, dist: maxDist };
}

/**
 * Add extra openings (false loops) to make the maze harder to mentally "solve"
 * by removing random internal walls.
 */
function addExtraOpenings(
  grid: Cell[][],
  cols: number,
  rows: number,
  count: number,
  rng: RngFn,
): void {
  // Collect all internal walls that are still present
  interface WallCandidate {
    r: number;
    c: number;
    dir: 'right' | 'bottom';
  }

  const candidates: WallCandidate[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (c < cols - 1 && grid[r][c].walls.right) {
        candidates.push({ r, c, dir: 'right' });
      }
      if (r < rows - 1 && grid[r][c].walls.bottom) {
        candidates.push({ r, c, dir: 'bottom' });
      }
    }
  }

  // Shuffle candidates using Fisher-Yates
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  // Remove up to `count` walls
  const toRemove = Math.min(count, candidates.length);
  for (let i = 0; i < toRemove; i++) {
    const { r, c, dir } = candidates[i];
    if (dir === 'right') {
      grid[r][c].walls.right = false;
      grid[r][c + 1].walls.left = false;
    } else {
      grid[r][c].walls.bottom = false;
      grid[r + 1][c].walls.top = false;
    }
  }
}

/**
 * Generate a maze using DFS Backtracker.
 *
 * @param cols - Number of columns
 * @param rows - Number of rows
 * @param rng - Seedable RNG function
 * @param extraOpenings - Number of extra wall removals for false loops (default 0)
 * @returns Complete Maze object with start/end positions and solution length
 */
export function generateMaze(
  cols: number,
  rows: number,
  rng: RngFn,
  extraOpenings: number = 0,
): Maze {
  const grid = createGrid(cols, rows);

  // Generate perfect maze
  dfsBacktracker(grid, cols, rows, rng);

  // Find optimal start/end: BFS from corner (0,0) to find farthest point,
  // then BFS from that point to find the actual farthest point (diameter endpoints).
  const firstPass = bfsFarthest(grid, cols, rows, 0, 0);
  const secondPass = bfsFarthest(grid, cols, rows, firstPass.pos.y, firstPass.pos.x);

  const start = firstPass.pos;
  const end = secondPass.pos;
  const solutionLength = secondPass.dist;

  // Add extra openings (false loops) after determining start/end
  if (extraOpenings > 0) {
    addExtraOpenings(grid, cols, rows, extraOpenings, rng);
  }

  return {
    cols,
    rows,
    cells: grid,
    start,
    end,
    seed: 0, // will be set by caller
    solutionLength,
  };
}
