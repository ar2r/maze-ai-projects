// Maze validation: connectivity check and path length calculation

import type { Maze, Position } from '../types';

interface QueueItem {
  row: number;
  col: number;
  distance: number;
}

export function validateMaze(maze: Maze): {
  isConnected: boolean;
  pathLength: number;
} {
  // BFS from start to end to check connectivity and find shortest path
  const startCell = worldToCell(maze.start, maze.cellSize);
  const endCell = worldToCell(maze.end, maze.cellSize);

  const visited = new Set<string>();
  const queue: QueueItem[] = [{ ...startCell, distance: 0 }];
  visited.add(cellKey(startCell.row, startCell.col));

  let maxDistance = 0;

  while (queue.length > 0) {
    const current = queue.shift()!;
    maxDistance = Math.max(maxDistance, current.distance);

    // Check if we reached the end
    if (current.row === endCell.row && current.col === endCell.col) {
      return { isConnected: true, pathLength: current.distance };
    }

    // Explore neighbors (only through open passages)
    const cell = maze.cells[current.row][current.col];
    const neighbors: Array<{ row: number; col: number }> = [];

    if (!cell.walls.top && current.row > 0) {
      neighbors.push({ row: current.row - 1, col: current.col });
    }
    if (!cell.walls.right && current.col < maze.width - 1) {
      neighbors.push({ row: current.row, col: current.col + 1 });
    }
    if (!cell.walls.bottom && current.row < maze.height - 1) {
      neighbors.push({ row: current.row + 1, col: current.col });
    }
    if (!cell.walls.left && current.col > 0) {
      neighbors.push({ row: current.row, col: current.col - 1 });
    }

    for (const neighbor of neighbors) {
      const key = cellKey(neighbor.row, neighbor.col);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ ...neighbor, distance: current.distance + 1 });
      }
    }
  }

  // If we get here, end is not reachable
  return { isConnected: false, pathLength: 0 };
}

export function worldToCell(pos: Position, cellSize: number): { row: number; col: number } {
  return {
    row: Math.floor(pos.y / cellSize),
    col: Math.floor(pos.x / cellSize),
  };
}

export function cellToWorld(row: number, col: number, cellSize: number): Position {
  return {
    x: (col + 0.5) * cellSize,
    y: (row + 0.5) * cellSize,
  };
}

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}
