import type { MazeCell, MazeData } from '../types';

function indexFor(cols: number, x: number, y: number): number {
  return y * cols + x;
}

function getOpenNeighborIndexes(maze: MazeData, cellIndex: number): number[] {
  const cell = maze.cells[cellIndex] as MazeCell;
  const neighbors: number[] = [];

  if (!cell.walls.north && cell.y > 0) {
    neighbors.push(indexFor(maze.cols, cell.x, cell.y - 1));
  }

  if (!cell.walls.east && cell.x < maze.cols - 1) {
    neighbors.push(indexFor(maze.cols, cell.x + 1, cell.y));
  }

  if (!cell.walls.south && cell.y < maze.rows - 1) {
    neighbors.push(indexFor(maze.cols, cell.x, cell.y + 1));
  }

  if (!cell.walls.west && cell.x > 0) {
    neighbors.push(indexFor(maze.cols, cell.x - 1, cell.y));
  }

  return neighbors;
}

export function getReachableCellCount(maze: MazeData): number {
  const queue = [maze.startIndex];
  const visited = new Set<number>(queue);

  while (queue.length > 0) {
    const current = queue.shift() as number;
    const nextIndexes = getOpenNeighborIndexes(maze, current);

    for (const nextIndex of nextIndexes) {
      if (!visited.has(nextIndex)) {
        visited.add(nextIndex);
        queue.push(nextIndex);
      }
    }
  }

  return visited.size;
}

export function getShortestPathLength(
  maze: MazeData,
  startIndex = maze.startIndex,
  finishIndex = maze.finishIndex,
): number {
  const queue: Array<{ index: number; distance: number }> = [{ index: startIndex, distance: 0 }];
  const visited = new Set<number>([startIndex]);

  while (queue.length > 0) {
    const current = queue.shift() as { index: number; distance: number };
    if (current.index === finishIndex) {
      return current.distance;
    }

    for (const neighborIndex of getOpenNeighborIndexes(maze, current.index)) {
      if (!visited.has(neighborIndex)) {
        visited.add(neighborIndex);
        queue.push({ index: neighborIndex, distance: current.distance + 1 });
      }
    }
  }

  return Number.POSITIVE_INFINITY;
}

export function hasIntactOuterWalls(maze: MazeData): boolean {
  for (let x = 0; x < maze.cols; x += 1) {
    if (!maze.cells[indexFor(maze.cols, x, 0)]?.walls.north) {
      return false;
    }

    if (!maze.cells[indexFor(maze.cols, x, maze.rows - 1)]?.walls.south) {
      return false;
    }
  }

  for (let y = 0; y < maze.rows; y += 1) {
    if (!maze.cells[indexFor(maze.cols, 0, y)]?.walls.west) {
      return false;
    }

    if (!maze.cells[indexFor(maze.cols, maze.cols - 1, y)]?.walls.east) {
      return false;
    }
  }

  return true;
}

export function validateMaze(maze: MazeData): {
  connected: boolean;
  reachableFinish: boolean;
  intactOuterWalls: boolean;
  valid: boolean;
} {
  const connected = getReachableCellCount(maze) === maze.cells.length;
  const reachableFinish = Number.isFinite(getShortestPathLength(maze));
  const intactOuterWalls = hasIntactOuterWalls(maze);

  return {
    connected,
    reachableFinish,
    intactOuterWalls,
    valid: connected && reachableFinish && intactOuterWalls,
  };
}
