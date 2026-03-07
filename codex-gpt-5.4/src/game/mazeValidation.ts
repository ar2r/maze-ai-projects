import { DIR_E, DIR_N, DIR_S, DIR_W, type MazeData, type MazeValidationResult, type Point } from './types';

const DIRECTIONS = [
  { bit: DIR_N, dx: 0, dy: -1, opposite: DIR_S },
  { bit: DIR_E, dx: 1, dy: 0, opposite: DIR_W },
  { bit: DIR_S, dx: 0, dy: 1, opposite: DIR_N },
  { bit: DIR_W, dx: -1, dy: 0, opposite: DIR_E }
];

function indexFor(width: number, x: number, y: number): number {
  return y * width + x;
}

export function findFarthestCell(maze: MazeData, from: Point): { point: Point; distance: number } {
  const visited = new Uint8Array(maze.width * maze.height);
  const distance = new Int16Array(maze.width * maze.height);
  const queue = new Uint16Array(maze.width * maze.height);
  let head = 0;
  let tail = 0;
  let farthest = from;
  let farthestDistance = 0;

  const startIndex = indexFor(maze.width, from.x, from.y);
  queue[tail++] = startIndex;
  visited[startIndex] = 1;

  while (head < tail) {
    const index = queue[head++];
    const x = index % maze.width;
    const y = Math.floor(index / maze.width);
    const cell = maze.cells[index];

    if (distance[index] > farthestDistance) {
      farthestDistance = distance[index];
      farthest = { x, y };
    }

    for (const direction of DIRECTIONS) {
      if ((cell.passages & direction.bit) === 0) {
        continue;
      }

      const nextX = x + direction.dx;
      const nextY = y + direction.dy;
      const nextIndex = indexFor(maze.width, nextX, nextY);
      if (visited[nextIndex] === 1) {
        continue;
      }

      visited[nextIndex] = 1;
      distance[nextIndex] = distance[index] + 1;
      queue[tail++] = nextIndex;
    }
  }

  return { point: farthest, distance: farthestDistance };
}

export function validateMaze(maze: MazeData): MazeValidationResult {
  const totalCells = maze.width * maze.height;
  const visited = new Uint8Array(totalCells);
  const queue = new Uint16Array(totalCells);
  let head = 0;
  let tail = 0;

  const startIndex = indexFor(maze.width, maze.startCell.x, maze.startCell.y);
  const finishIndex = indexFor(maze.width, maze.finishCell.x, maze.finishCell.y);
  const distance = new Int16Array(totalCells);
  let isPerimeterClosed = true;

  queue[tail++] = startIndex;
  visited[startIndex] = 1;

  while (head < tail) {
    const index = queue[head++];
    const x = index % maze.width;
    const y = Math.floor(index / maze.width);
    const cell = maze.cells[index];

    for (const direction of DIRECTIONS) {
      const nextX = x + direction.dx;
      const nextY = y + direction.dy;
      const hasPassage = (cell.passages & direction.bit) !== 0;

      if (nextX < 0 || nextX >= maze.width || nextY < 0 || nextY >= maze.height) {
        if (hasPassage) {
          isPerimeterClosed = false;
        }
        continue;
      }

      const nextIndex = indexFor(maze.width, nextX, nextY);
      const nextCell = maze.cells[nextIndex];
      if (hasPassage !== ((nextCell.passages & direction.opposite) !== 0)) {
        isPerimeterClosed = false;
      }

      if (!hasPassage || visited[nextIndex] === 1) {
        continue;
      }

      visited[nextIndex] = 1;
      distance[nextIndex] = distance[index] + 1;
      queue[tail++] = nextIndex;
    }
  }

  return {
    isConnected: visited.every((value) => value === 1),
    hasClosedPerimeter: isPerimeterClosed,
    reachableCells: visited.reduce((count, value) => count + value, 0),
    optimalPathLength: distance[finishIndex]
  };
}
