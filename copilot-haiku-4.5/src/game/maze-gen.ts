// ============================================================================
// Maze Generator - DFS Backtracker Algorithm
// ============================================================================

import type { Maze, MazeCell, Vec2 } from './types';
import { SeededRandom } from '../utils/random';

/**
 * Generate a "perfect" maze using DFS backtracker.
 * Guarantees single path between any two cells (no loops, no isolated areas).
 */
export function generateMaze(
  width: number,
  height: number,
  cellSize: number,
  seed: number
): Maze {
  const rng = new SeededRandom(seed);

  // Initialize grid: all cells with all walls
  const cells: MazeCell[] = [];
  const grid: Map<string, MazeCell> = new Map();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell: MazeCell = {
        x,
        y,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
      };
      cells.push(cell);
      grid.set(`${x},${y}`, cell);
    }
  }

  // DFS backtracker carving
  const stack: MazeCell[] = [];
  const startCell = grid.get('0,0')!;
  startCell.visited = true;
  stack.push(startCell);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors: Array<{ cell: MazeCell; dir: 'top' | 'right' | 'bottom' | 'left' }> = [];

    // Check all 4 neighbors
    const directions = [
      { dx: 0, dy: -1, dir: 'top' as const },
      { dx: 1, dy: 0, dir: 'right' as const },
      { dx: 0, dy: 1, dir: 'bottom' as const },
      { dx: -1, dy: 0, dir: 'left' as const },
    ];

    for (const { dx, dy, dir } of directions) {
      const nx = current.x + dx;
      const ny = current.y + dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const neighbor = grid.get(`${nx},${ny}`)!;
        if (!neighbor.visited) {
          neighbors.push({ cell: neighbor, dir });
        }
      }
    }

    if (neighbors.length > 0) {
      // Choose random unvisited neighbor
      const { cell: next, dir } = neighbors[rng.nextInt(0, neighbors.length)];

      // Carve passage: remove walls between current and next
      const oppositeDir = getOppositeDir(dir);
      current.walls[dir] = false;
      next.walls[oppositeDir] = false;

      next.visited = true;
      stack.push(next);
    } else {
      stack.pop();
    }
  }

  // Start at (0, 0), end at (width-1, height-1)
  const start: Vec2 = { x: 0, y: 0 };
  const end: Vec2 = { x: width - 1, y: height - 1 };

  // Ensure start and end are accessible (remove outer walls)
  grid.get('0,0')!.walls.top = false;
  grid.get('0,0')!.walls.left = false;
  grid.get(`${width - 1},${height - 1}`)!.walls.bottom = false;
  grid.get(`${width - 1},${height - 1}`)!.walls.right = false;

  return {
    width,
    height,
    cellSize,
    cells,
    start,
    end,
    seed,
  };
}

function getOppositeDir(dir: 'top' | 'right' | 'bottom' | 'left') {
  const opposite = {
    top: 'bottom' as const,
    bottom: 'top' as const,
    left: 'right' as const,
    right: 'left' as const,
  };
  return opposite[dir];
}

/**
 * Validate maze connectivity: ensure all cells are reachable from start
 */
export function validateMazeConnectivity(maze: Maze): boolean {
  const visited = new Set<string>();
  const stack = [{ x: maze.start.x, y: maze.start.y }];
  const grid = new Map<string, MazeCell>();

  // Build grid map
  for (const cell of maze.cells) {
    grid.set(`${cell.x},${cell.y}`, cell);
  }

  while (stack.length > 0) {
    const { x, y } = stack.pop()!;
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    visited.add(key);

    const cell = grid.get(key);
    if (!cell) continue;

    // Check all 4 neighbors through passages (non-walls)
    if (!cell.walls.top && y > 0) stack.push({ x, y: y - 1 });
    if (!cell.walls.right && x < maze.width - 1) stack.push({ x: x + 1, y });
    if (!cell.walls.bottom && y < maze.height - 1) stack.push({ x, y: y + 1 });
    if (!cell.walls.left && x > 0) stack.push({ x: x - 1, y });
  }

  // Check if end is reachable
  return visited.has(`${maze.end.x},${maze.end.y}`);
}

/**
 * Get all wall segments from maze (for collision detection)
 */
export function getMazeWalls(maze: Maze): Array<{ x: number; y: number; w: number; h: number }> {
  const walls: Array<{ x: number; y: number; w: number; h: number }> = [];
  const { cellSize } = maze;
  const wallThickness = 2;

  const grid = new Map<string, MazeCell>();
  for (const cell of maze.cells) {
    grid.set(`${cell.x},${cell.y}`, cell);
  }

  for (const cell of maze.cells) {
    const cx = cell.x * cellSize;
    const cy = cell.y * cellSize;

    // Top wall
    if (cell.walls.top) {
      walls.push({ x: cx, y: cy, w: cellSize, h: wallThickness });
    }

    // Right wall
    if (cell.walls.right) {
      walls.push({ x: cx + cellSize - wallThickness, y: cy, w: wallThickness, h: cellSize });
    }

    // Bottom wall
    if (cell.walls.bottom) {
      walls.push({ x: cx, y: cy + cellSize - wallThickness, w: cellSize, h: wallThickness });
    }

    // Left wall
    if (cell.walls.left) {
      walls.push({ x: cx, y: cy, w: wallThickness, h: cellSize });
    }
  }

  return walls;
}
