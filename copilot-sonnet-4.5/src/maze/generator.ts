// Maze generation using DFS (Depth-First Search) Backtracker algorithm
// Creates "perfect" mazes with exactly one path between any two cells

import type { Maze, Cell, Position, LevelConfig } from '../types';
import { SeededRandom } from '../utils/rng';

export function generateMaze(config: LevelConfig, seed: number): Maze {
  const { gridWidth, gridHeight, cellSize, wallThickness } = config;

  // Initialize grid with all walls
  const cells: Cell[][] = [];
  for (let row = 0; row < gridHeight; row++) {
    cells[row] = [];
    for (let col = 0; col < gridWidth; col++) {
      cells[row][col] = {
        row,
        col,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
      };
    }
  }

  const rng = new SeededRandom(seed);

  // DFS Backtracker algorithm
  const stack: Cell[] = [];
  const startCell = cells[0][0];
  startCell.visited = true;
  stack.push(startCell);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(current, cells, gridWidth, gridHeight);

    if (neighbors.length > 0) {
      // Choose a random unvisited neighbor
      const next = rng.choice(neighbors);
      
      // Remove wall between current and next
      removeWall(current, next);
      
      next.visited = true;
      stack.push(next);
    } else {
      // Backtrack
      stack.pop();
    }
  }

  // Optionally add loops for higher difficulty
  if (config.addLoops) {
    addRandomLoops(cells, gridWidth, gridHeight, rng, 0.05); // Remove 5% of remaining walls
  }

  // Set start (top-left area) and end (bottom-right area)
  const start: Position = {
    x: cellSize / 2,
    y: cellSize / 2,
  };

  const end: Position = {
    x: (gridWidth - 0.5) * cellSize,
    y: (gridHeight - 0.5) * cellSize,
  };

  return {
    width: gridWidth,
    height: gridHeight,
    cells,
    start,
    end,
    seed,
    cellSize,
    wallThickness,
  };
}

function getUnvisitedNeighbors(
  cell: Cell,
  cells: Cell[][],
  width: number,
  height: number
): Cell[] {
  const { row, col } = cell;
  const neighbors: Cell[] = [];

  // Top
  if (row > 0 && !cells[row - 1][col].visited) {
    neighbors.push(cells[row - 1][col]);
  }
  // Right
  if (col < width - 1 && !cells[row][col + 1].visited) {
    neighbors.push(cells[row][col + 1]);
  }
  // Bottom
  if (row < height - 1 && !cells[row + 1][col].visited) {
    neighbors.push(cells[row + 1][col]);
  }
  // Left
  if (col > 0 && !cells[row][col - 1].visited) {
    neighbors.push(cells[row][col - 1]);
  }

  return neighbors;
}

function removeWall(current: Cell, next: Cell): void {
  const rowDiff = next.row - current.row;
  const colDiff = next.col - current.col;

  if (rowDiff === 1) {
    // Next is below
    current.walls.bottom = false;
    next.walls.top = false;
  } else if (rowDiff === -1) {
    // Next is above
    current.walls.top = false;
    next.walls.bottom = false;
  } else if (colDiff === 1) {
    // Next is to the right
    current.walls.right = false;
    next.walls.left = false;
  } else if (colDiff === -1) {
    // Next is to the left
    current.walls.left = false;
    next.walls.right = false;
  }
}

function addRandomLoops(
  cells: Cell[][],
  width: number,
  height: number,
  rng: SeededRandom,
  percentage: number
): void {
  // Count total walls
  let wallCount = 0;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (cells[row][col].walls.right && col < width - 1) wallCount++;
      if (cells[row][col].walls.bottom && row < height - 1) wallCount++;
    }
  }

  const wallsToRemove = Math.floor(wallCount * percentage);

  for (let i = 0; i < wallsToRemove; i++) {
    const row = rng.nextInt(0, height);
    const col = rng.nextInt(0, width);
    const cell = cells[row][col];

    // Try to remove a random wall
    if (rng.bool() && cell.walls.right && col < width - 1) {
      cell.walls.right = false;
      cells[row][col + 1].walls.left = false;
    } else if (cell.walls.bottom && row < height - 1) {
      cell.walls.bottom = false;
      cells[row + 1][col].walls.top = false;
    }
  }
}
