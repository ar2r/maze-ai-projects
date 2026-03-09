/**
 * Maze solver — BFS (Breadth-First Search).
 *
 * Provides:
 *  - solveMaze: finds shortest path from (0,0) to (w-1, h-1)
 *  - isConnected: verifies all cells are reachable from (0,0)
 */

import type { MazeData } from '../types';

interface Point { x: number; y: number; }

/**
 * BFS from start (0,0) to finish (w-1, h-1).
 *
 * @returns Array of {x,y} points forming the path (inclusive of start & end),
 *          or null if no path exists.
 */
export function solveMaze(maze: MazeData): Point[] | null {
  const { width, height, cells } = maze;
  const target: Point = { x: width - 1, y: height - 1 };

  // BFS queue: each entry stores position and path to reach it
  const visited = Array.from({ length: height }, () => new Array<boolean>(width).fill(false));
  const parent = Array.from({ length: height }, () => new Array<Point | null>(width).fill(null));

  const queue: Point[] = [{ x: 0, y: 0 }];
  visited[0][0] = true;

  while (queue.length > 0) {
    const cur = queue.shift()!;

    if (cur.x === target.x && cur.y === target.y) {
      // Reconstruct path
      return reconstructPath(parent, target);
    }

    const cell = cells[cur.y][cur.x];

    // Try each direction if wall is absent
    const moves: Array<[boolean, Point]> = [
      [cell.wallN, { x: cur.x, y: cur.y - 1 }],
      [cell.wallE, { x: cur.x + 1, y: cur.y }],
      [cell.wallS, { x: cur.x, y: cur.y + 1 }],
      [cell.wallW, { x: cur.x - 1, y: cur.y }],
    ];

    for (const [hasWall, next] of moves) {
      if (hasWall) continue;
      if (next.x < 0 || next.x >= width || next.y < 0 || next.y >= height) continue;
      if (visited[next.y][next.x]) continue;
      visited[next.y][next.x] = true;
      parent[next.y][next.x] = cur;
      queue.push(next);
    }
  }

  return null; // No path found
}

/** Reconstruct BFS path by following parent pointers back to start */
function reconstructPath(parent: Array<Array<Point | null>>, end: Point): Point[] {
  const path: Point[] = [];
  let cur: Point | null = end;
  while (cur !== null) {
    path.unshift(cur);
    cur = parent[cur.y][cur.x];
  }
  return path;
}

/**
 * BFS connectivity check: returns true if every cell is reachable from (0,0).
 * This verifies that the maze is "perfect" (fully connected).
 */
export function isConnected(maze: MazeData): boolean {
  const { width, height, cells } = maze;
  const visited = Array.from({ length: height }, () => new Array<boolean>(width).fill(false));
  const queue: Point[] = [{ x: 0, y: 0 }];
  visited[0][0] = true;
  let count = 1;

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const cell = cells[cur.y][cur.x];

    const moves: Array<[boolean, Point]> = [
      [cell.wallN, { x: cur.x, y: cur.y - 1 }],
      [cell.wallE, { x: cur.x + 1, y: cur.y }],
      [cell.wallS, { x: cur.x, y: cur.y + 1 }],
      [cell.wallW, { x: cur.x - 1, y: cur.y }],
    ];

    for (const [hasWall, next] of moves) {
      if (hasWall) continue;
      if (next.x < 0 || next.x >= width || next.y < 0 || next.y >= height) continue;
      if (visited[next.y][next.x]) continue;
      visited[next.y][next.x] = true;
      count++;
      queue.push(next);
    }
  }

  return count === width * height;
}
