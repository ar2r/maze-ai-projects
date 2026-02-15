// === Maze Generator using DFS Backtracking ===

import type { Cell, Maze } from '../types';
import { SeededRandom } from '../utils/random';
import { getMazeSizeForLevel, calculateCellSize } from '../config';

type Direction = 'top' | 'right' | 'bottom' | 'left';

const DIRECTIONS: Direction[] = ['top', 'right', 'bottom', 'left'];

const DIRECTION_DELTAS: Record<Direction, { dr: number; dc: number }> = {
  top: { dr: -1, dc: 0 },
  right: { dr: 0, dc: 1 },
  bottom: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
};

const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

// Initialize empty grid with all walls
function createGrid(width: number, height: number): Cell[][] {
  const grid: Cell[][] = [];

  for (let row = 0; row < height; row++) {
    grid[row] = [];
    for (let col = 0; col < width; col++) {
      grid[row][col] = {
        row,
        col,
        walls: {
          top: true,
          right: true,
          bottom: true,
          left: true,
        },
        visited: false,
      };
    }
  }

  return grid;
}

// DFS Backtracking algorithm
function generateMazeDFS(
  grid: Cell[][],
  startRow: number,
  startCol: number,
  rng: SeededRandom
): void {
  const stack: Cell[] = [];
  const height = grid.length;
  const width = grid[0].length;

  const startCell = grid[startRow][startCol];
  startCell.visited = true;
  stack.push(startCell);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const unvisitedNeighbors: Array<{ cell: Cell; direction: Direction }> = [];

    // Find unvisited neighbors
    for (const direction of DIRECTIONS) {
      const delta = DIRECTION_DELTAS[direction];
      const newRow = current.row + delta.dr;
      const newCol = current.col + delta.dc;

      if (
        newRow >= 0 &&
        newRow < height &&
        newCol >= 0 &&
        newCol < width &&
        !grid[newRow][newCol].visited
      ) {
        unvisitedNeighbors.push({
          cell: grid[newRow][newCol],
          direction,
        });
      }
    }

    if (unvisitedNeighbors.length > 0) {
      // Choose random unvisited neighbor
      const chosen = rng.choice(unvisitedNeighbors);
      const nextCell = chosen.cell;
      const direction = chosen.direction;

      // Remove walls between current and chosen cell
      current.walls[direction] = false;
      nextCell.walls[OPPOSITE_DIRECTION[direction]] = false;

      // Mark as visited and push to stack
      nextCell.visited = true;
      stack.push(nextCell);
    } else {
      // Backtrack
      stack.pop();
    }
  }
}

// Add some loops to make maze less "perfect" (increases difficulty)
function addComplexity(
  grid: Cell[][],
  complexity: number,
  rng: SeededRandom
): void {
  const height = grid.length;
  const width = grid[0].length;

  // Number of walls to remove = complexity * total cells / 100
  const wallsToRemove = Math.floor((width * height * complexity) / 100);

  for (let i = 0; i < wallsToRemove; i++) {
    const row = rng.nextInt(0, height);
    const col = rng.nextInt(0, width);
    const cell = grid[row][col];

    const availableWalls = DIRECTIONS.filter((dir) => {
      const delta = DIRECTION_DELTAS[dir];
      const newRow = row + delta.dr;
      const newCol = col + delta.dc;

      // Can only remove wall if neighbor exists and wall exists
      return (
        newRow >= 0 &&
        newRow < height &&
        newCol >= 0 &&
        newCol < width &&
        cell.walls[dir]
      );
    });

    if (availableWalls.length > 0) {
      const direction = rng.choice(availableWalls);
      const delta = DIRECTION_DELTAS[direction];
      const neighborRow = row + delta.dr;
      const neighborCol = col + delta.dc;

      cell.walls[direction] = false;
      grid[neighborRow][neighborCol].walls[OPPOSITE_DIRECTION[direction]] = false;
    }
  }
}

// Main generation function
export function generateMaze(
  level: number,
  seed: number,
  screenWidth: number,
  screenHeight: number
): Maze {
  const rng = new SeededRandom(seed);

  // Calculate maze dimensions based on level
  const size = getMazeSizeForLevel(level);
  const width = size;
  const height = size;

  // Calculate cell size to fit screen
  const cellSize = calculateCellSize(screenWidth, screenHeight, width, height);

  // Create grid
  const grid = createGrid(width, height);

  // Generate maze using DFS
  const startRow = rng.nextInt(0, height);
  const startCol = rng.nextInt(0, width);
  generateMazeDFS(grid, startRow, startCol, rng);

  // Add complexity for higher levels (creates loops)
  const complexity = Math.min(level - 1, 10); // 0-10% extra paths
  if (complexity > 0) {
    addComplexity(grid, complexity, rng);
  }

  // Reset visited flags (used for pathfinding later)
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      grid[row][col].visited = false;
    }
  }

  // Define start and finish positions
  // Start: top-left area, Finish: bottom-right area
  const startCell = grid[0][0];
  const finishCell = grid[height - 1][width - 1];

  const start = {
    x: startCell.col * cellSize + cellSize / 2,
    y: startCell.row * cellSize + cellSize / 2,
  };

  const finish = {
    x: finishCell.col * cellSize + cellSize / 2,
    y: finishCell.row * cellSize + cellSize / 2,
  };

  return {
    grid,
    width,
    height,
    cellSize,
    start,
    finish,
    seed,
  };
}
