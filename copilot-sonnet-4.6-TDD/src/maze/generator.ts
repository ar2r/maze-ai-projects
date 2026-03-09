/**
 * Maze generator — DFS Backtracker (Recursive Backtracking) algorithm.
 *
 * Algorithm:
 *  1. Start with all walls present (every cell is a separate room).
 *  2. Pick start cell (0,0), mark visited.
 *  3. Push onto stack. While stack not empty:
 *     a. Peek current cell.
 *     b. Find unvisited neighbours in random order.
 *     c. If neighbour found: carve wall between current and neighbour, push neighbour.
 *     d. Else: pop stack (backtrack).
 *  4. This guarantees a "perfect maze" — exactly one path between any two cells.
 *  5. Optionally carve `loops` extra random walls to create false paths.
 *
 * Iterative implementation avoids call-stack overflow on large grids.
 */

import { createRNG, shuffle } from '../rng';
import type { Cell, MazeData } from '../types';
import { solveMaze } from './solver';

// ─── Internal types ───────────────────────────────────────────────────────────

type Direction = 'N' | 'E' | 'S' | 'W';

interface Neighbour {
  x: number;
  y: number;
  dir: Direction;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Create a fresh cell with all walls intact */
function makeCell(x: number, y: number): Cell {
  return { x, y, wallN: true, wallE: true, wallS: true, wallW: true, visited: false };
}

/** Carve the passage between two adjacent cells */
function carvePassage(a: Cell, b: Cell, dir: Direction): void {
  switch (dir) {
    case 'N': a.wallN = false; b.wallS = false; break;
    case 'E': a.wallE = false; b.wallW = false; break;
    case 'S': a.wallS = false; b.wallN = false; break;
    case 'W': a.wallW = false; b.wallE = false; break;
  }
}

/** Get all 4 potential neighbours (may include out-of-bounds) */
function getNeighbours(x: number, y: number, w: number, h: number): Neighbour[] {
  const result: Neighbour[] = [];
  if (y > 0)     result.push({ x, y: y - 1, dir: 'N' });
  if (x < w - 1) result.push({ x: x + 1, y, dir: 'E' });
  if (y < h - 1) result.push({ x, y: y + 1, dir: 'S' });
  if (x > 0)     result.push({ x: x - 1, y, dir: 'W' });
  return result;
}

// ─── Main generator ───────────────────────────────────────────────────────────

/**
 * Generate a maze using DFS backtracker algorithm.
 *
 * @param width        Number of cells horizontally
 * @param height       Number of cells vertically
 * @param seed         Seed for the PRNG (determines the maze layout)
 * @param cellSize     Visual size in px per cell
 * @param wallThickness Visual wall thickness in px
 * @param loops        Number of extra passages to carve after generation (0 = perfect maze)
 * @returns Fully constructed MazeData
 */
export function generateMaze(
  width: number,
  height: number,
  seed: number,
  cellSize: number,
  wallThickness: number,
  loops = 0,
): MazeData {
  const rng = createRNG(seed);

  // ── 1. Initialise grid ────────────────────────────────────────────────────
  const cells: Cell[][] = [];
  for (let y = 0; y < height; y++) {
    cells.push([]);
    for (let x = 0; x < width; x++) {
      cells[y].push(makeCell(x, y));
    }
  }

  // ── 2. DFS backtracker ────────────────────────────────────────────────────
  const stack: [number, number][] = [[0, 0]];
  cells[0][0].visited = true;

  while (stack.length > 0) {
    const [cx, cy] = stack[stack.length - 1];

    // Find unvisited neighbours
    const neighbours = getNeighbours(cx, cy, width, height)
      .filter(n => !cells[n.y][n.x].visited);

    if (neighbours.length === 0) {
      // Backtrack
      stack.pop();
    } else {
      // Shuffle and pick one (using our seeded RNG)
      shuffle(neighbours, rng);
      const chosen = neighbours[0];
      carvePassage(cells[cy][cx], cells[chosen.y][chosen.x], chosen.dir);
      cells[chosen.y][chosen.x].visited = true;
      stack.push([chosen.x, chosen.y]);
    }
  }

  // ── 3. Reset visited flags (they're an implementation detail) ────────────
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      cells[y][x].visited = false;
    }
  }

  // ── 4. Loop injection ─────────────────────────────────────────────────────
  // Randomly remove interior walls to create extra paths (false loops).
  // We collect all "removable" internal walls and pick `loops` of them.
  if (loops > 0) {
    injectLoops(cells, width, height, loops, rng);
  }

  // ── 5. Assemble MazeData ──────────────────────────────────────────────────
  const maze: MazeData = {
    width,
    height,
    cells,
    seed,
    cellSize,
    wallThickness,
    optimalPathLength: 0, // filled in below
  };

  // Solve to get optimal path length
  const path = solveMaze(maze);
  maze.optimalPathLength = path ? path.length - 1 : 0;

  return maze;
}

// ─── Loop injection ───────────────────────────────────────────────────────────

/**
 * Remove up to `count` random interior walls to add loops/false-paths.
 * Only horizontal or vertical interior walls are eligible.
 */
function injectLoops(
  cells: Cell[][],
  width: number,
  height: number,
  count: number,
  rng: () => number,
): void {
  // Collect candidate walls: interior east-facing walls
  const candidates: Array<() => void> = [];

  // Horizontal passages (remove east wall of cell → west wall of neighbour)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      if (cells[y][x].wallE) { // wall exists → can carve
        const cy = y, cx = x;
        candidates.push(() => {
          cells[cy][cx].wallE = false;
          cells[cy][cx + 1].wallW = false;
        });
      }
    }
  }
  // Vertical passages (remove south wall)
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width; x++) {
      if (cells[y][x].wallS) {
        const cy = y, cx = x;
        candidates.push(() => {
          cells[cy][cx].wallS = false;
          cells[cy + 1][cx].wallN = false;
        });
      }
    }
  }

  shuffle(candidates, rng);
  const toCarve = Math.min(count, candidates.length);
  for (let i = 0; i < toCarve; i++) {
    candidates[i]();
  }
}
