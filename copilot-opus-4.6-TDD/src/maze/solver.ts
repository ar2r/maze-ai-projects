import type { Maze, Vec2 } from '../types';

/**
 * BFS shortest path from maze.start to maze.end.
 * Returns array of cell positions (x=col, y=row) from start to end,
 * or null if no path exists.
 */
export function solveMaze(maze: Maze): Vec2[] | null {
  const { cols, rows, cells, start, end } = maze;

  // Distance array, -1 = not visited
  const dist: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(-1));
  // Parent tracking for path reconstruction
  const parent: (Vec2 | null)[][] = Array.from({ length: rows }, () =>
    new Array<Vec2 | null>(cols).fill(null),
  );

  dist[start.y][start.x] = 0;
  const queue: Vec2[] = [{ x: start.x, y: start.y }];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const r = cur.y;
    const c = cur.x;
    const d = dist[r][c];

    // Found the end?
    if (r === end.y && c === end.x) {
      // Reconstruct path
      return reconstructPath(parent, start, end);
    }

    const cell = cells[r][c];

    // Explore neighbors through open walls
    if (!cell.walls.top && r > 0 && dist[r - 1][c] === -1) {
      dist[r - 1][c] = d + 1;
      parent[r - 1][c] = cur;
      queue.push({ x: c, y: r - 1 });
    }
    if (!cell.walls.right && c < cols - 1 && dist[r][c + 1] === -1) {
      dist[r][c + 1] = d + 1;
      parent[r][c + 1] = cur;
      queue.push({ x: c + 1, y: r });
    }
    if (!cell.walls.bottom && r < rows - 1 && dist[r + 1][c] === -1) {
      dist[r + 1][c] = d + 1;
      parent[r + 1][c] = cur;
      queue.push({ x: c, y: r + 1 });
    }
    if (!cell.walls.left && c > 0 && dist[r][c - 1] === -1) {
      dist[r][c - 1] = d + 1;
      parent[r][c - 1] = cur;
      queue.push({ x: c - 1, y: r });
    }
  }

  return null; // No path found
}

/**
 * Reconstruct path from parent array.
 */
function reconstructPath(
  parent: (Vec2 | null)[][],
  start: Vec2,
  end: Vec2,
): Vec2[] {
  const path: Vec2[] = [];
  let current: Vec2 | null = end;

  while (current !== null) {
    path.push({ x: current.x, y: current.y });
    if (current.x === start.x && current.y === start.y) break;
    current = parent[current.y][current.x];
  }

  path.reverse();
  return path;
}

/**
 * Check if all cells in the maze are reachable from (0,0) via open walls.
 * Returns true if the maze is fully connected.
 */
export function isMazeConnected(maze: Maze): boolean {
  const { cols, rows, cells } = maze;
  const visited = new Set<string>();
  const queue: [number, number][] = [[0, 0]];
  visited.add('0,0');

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const cell = cells[r][c];

    if (!cell.walls.top && r > 0 && !visited.has(`${r - 1},${c}`)) {
      visited.add(`${r - 1},${c}`);
      queue.push([r - 1, c]);
    }
    if (!cell.walls.right && c < cols - 1 && !visited.has(`${r},${c + 1}`)) {
      visited.add(`${r},${c + 1}`);
      queue.push([r, c + 1]);
    }
    if (!cell.walls.bottom && r < rows - 1 && !visited.has(`${r + 1},${c}`)) {
      visited.add(`${r + 1},${c}`);
      queue.push([r + 1, c]);
    }
    if (!cell.walls.left && c > 0 && !visited.has(`${r},${c - 1}`)) {
      visited.add(`${r},${c - 1}`);
      queue.push([r, c - 1]);
    }
  }

  return visited.size === cols * rows;
}
