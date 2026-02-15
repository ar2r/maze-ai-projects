// === Maze Validator - Ensures reachability ===

import type { Maze } from '../types';

interface QueueItem {
  row: number;
  col: number;
}

// BFS to check if finish is reachable from start
export function isReachable(maze: Maze): boolean {
  const { grid, width, height, cellSize, start, finish } = maze;

  // Convert pixel positions to grid coordinates
  const startRow = Math.floor(start.y / cellSize);
  const startCol = Math.floor(start.x / cellSize);
  const finishRow = Math.floor(finish.y / cellSize);
  const finishCol = Math.floor(finish.x / cellSize);

  // Bounds check
  if (
    startRow < 0 || startRow >= height ||
    startCol < 0 || startCol >= width ||
    finishRow < 0 || finishRow >= height ||
    finishCol < 0 || finishCol >= width
  ) {
    return false;
  }

  // Reset visited flags
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      grid[row][col].visited = false;
    }
  }

  // BFS
  const queue: QueueItem[] = [{ row: startRow, col: startCol }];
  grid[startRow][startCol].visited = true;

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Check if we reached finish
    if (current.row === finishRow && current.col === finishCol) {
      return true;
    }

    const cell = grid[current.row][current.col];

    // Check all four directions
    const neighbors: Array<{ row: number; col: number; hasWall: boolean }> = [
      { row: current.row - 1, col: current.col, hasWall: cell.walls.top },
      { row: current.row, col: current.col + 1, hasWall: cell.walls.right },
      { row: current.row + 1, col: current.col, hasWall: cell.walls.bottom },
      { row: current.row, col: current.col - 1, hasWall: cell.walls.left },
    ];

    for (const neighbor of neighbors) {
      // Skip if wall exists
      if (neighbor.hasWall) continue;

      // Skip if out of bounds
      if (
        neighbor.row < 0 || neighbor.row >= height ||
        neighbor.col < 0 || neighbor.col >= width
      ) {
        continue;
      }

      // Skip if already visited
      const neighborCell = grid[neighbor.row][neighbor.col];
      if (neighborCell.visited) continue;

      neighborCell.visited = true;
      queue.push({ row: neighbor.row, col: neighbor.col });
    }
  }

  return false;
}

// Calculate shortest path length (for difficulty assessment)
export function calculatePathLength(maze: Maze): number {
  const { grid, width, height, cellSize, start, finish } = maze;

  const startRow = Math.floor(start.y / cellSize);
  const startCol = Math.floor(start.x / cellSize);
  const finishRow = Math.floor(finish.y / cellSize);
  const finishCol = Math.floor(finish.x / cellSize);

  // Reset visited and distances
  const distances: number[][] = Array(height)
    .fill(0)
    .map(() => Array(width).fill(Infinity));

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      grid[row][col].visited = false;
    }
  }

  // BFS with distance tracking
  const queue: QueueItem[] = [{ row: startRow, col: startCol }];
  grid[startRow][startCol].visited = true;
  distances[startRow][startCol] = 0;

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.row === finishRow && current.col === finishCol) {
      return distances[current.row][current.col];
    }

    const cell = grid[current.row][current.col];
    const currentDistance = distances[current.row][current.col];

    const neighbors: Array<{ row: number; col: number; hasWall: boolean }> = [
      { row: current.row - 1, col: current.col, hasWall: cell.walls.top },
      { row: current.row, col: current.col + 1, hasWall: cell.walls.right },
      { row: current.row + 1, col: current.col, hasWall: cell.walls.bottom },
      { row: current.row, col: current.col - 1, hasWall: cell.walls.left },
    ];

    for (const neighbor of neighbors) {
      if (neighbor.hasWall) continue;

      if (
        neighbor.row < 0 || neighbor.row >= height ||
        neighbor.col < 0 || neighbor.col >= width
      ) {
        continue;
      }

      const neighborCell = grid[neighbor.row][neighbor.col];
      if (neighborCell.visited) continue;

      neighborCell.visited = true;
      distances[neighbor.row][neighbor.col] = currentDistance + 1;
      queue.push({ row: neighbor.row, col: neighbor.col });
    }
  }

  return Infinity; // No path found
}
