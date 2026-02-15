import { neighborsFromCell, shortestPathLength } from './maze';
import type { Maze } from './types';

function idx(x: number, y: number, width: number): number {
  return y * width + x;
}

export function isMazeConnected(maze: Maze): boolean {
  const seen = new Uint8Array(maze.width * maze.height);
  const stack = [{ x: 0, y: 0 }];
  seen[0] = 1;

  while (stack.length > 0) {
    const cur = stack.pop()!;
    for (const next of neighborsFromCell(maze, cur.x, cur.y)) {
      const nextIdx = idx(next.x, next.y, maze.width);
      if (seen[nextIdx] === 1) continue;
      seen[nextIdx] = 1;
      stack.push(next);
    }
  }

  return seen.every((value) => value === 1);
}

export function validateMazeReachable(maze: Maze): boolean {
  return shortestPathLength(maze, { x: 0, y: 0 }, { x: maze.width - 1, y: maze.height - 1 }) > -1;
}

export function hasGrowingPath(maze: Maze, minPathLength: number): boolean {
  return shortestPathLength(maze, { x: 0, y: 0 }, { x: maze.width - 1, y: maze.height - 1 }) >= minPathLength;
}
