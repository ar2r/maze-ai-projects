import { SeededRng } from './rng';
import { WALL_E, WALL_N, WALL_S, WALL_W, type Maze } from './types';

const ALL_WALLS = WALL_N | WALL_E | WALL_S | WALL_W;

interface CellRef {
  x: number;
  y: number;
}

interface Neighbor extends CellRef {
  wall: number;
  opposite: number;
}

function toIndex(x: number, y: number, width: number): number {
  return y * width + x;
}

function getNeighbors(x: number, y: number, width: number, height: number): Neighbor[] {
  const result: Neighbor[] = [];
  if (y > 0) result.push({ x, y: y - 1, wall: WALL_N, opposite: WALL_S });
  if (x < width - 1) result.push({ x: x + 1, y, wall: WALL_E, opposite: WALL_W });
  if (y < height - 1) result.push({ x, y: y + 1, wall: WALL_S, opposite: WALL_N });
  if (x > 0) result.push({ x: x - 1, y, wall: WALL_W, opposite: WALL_E });
  return result;
}

export function generatePerfectMaze(
  width: number,
  height: number,
  seed: string,
  extraLoopChance = 0,
  roomChance = 0
): Maze {
  const rng = new SeededRng(seed);
  const cells = new Uint8Array(width * height).fill(ALL_WALLS);
  const visited = new Uint8Array(width * height);
  const stack: CellRef[] = [{ x: 0, y: 0 }];
  visited[0] = 1;

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const currentIdx = toIndex(current.x, current.y, width);
    const choices = getNeighbors(current.x, current.y, width, height).filter(
      (n) => visited[toIndex(n.x, n.y, width)] === 0
    );

    if (choices.length === 0) {
      stack.pop();
      continue;
    }

    const next = rng.pick(choices);
    const nextIdx = toIndex(next.x, next.y, width);
    cells[currentIdx] &= ~next.wall;
    cells[nextIdx] &= ~next.opposite;
    visited[nextIdx] = 1;
    stack.push({ x: next.x, y: next.y });
  }

  // Add optional loops and micro-rooms after perfect maze generation.
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = toIndex(x, y, width);
      for (const n of getNeighbors(x, y, width, height)) {
        const nIdx = toIndex(n.x, n.y, width);
        if (nIdx <= idx) continue;

        if ((cells[idx] & n.wall) !== 0 && rng.next() < extraLoopChance) {
          cells[idx] &= ~n.wall;
          cells[nIdx] &= ~n.opposite;
        }
      }

      if (rng.next() < roomChance && x < width - 1 && y < height - 1) {
        const right = toIndex(x + 1, y, width);
        const bottom = toIndex(x, y + 1, width);
        const bottomRight = toIndex(x + 1, y + 1, width);

        cells[idx] &= ~WALL_E;
        cells[right] &= ~WALL_W;
        cells[idx] &= ~WALL_S;
        cells[bottom] &= ~WALL_N;
        cells[right] &= ~WALL_S;
        cells[bottomRight] &= ~WALL_N;
        cells[bottom] &= ~WALL_E;
        cells[bottomRight] &= ~WALL_W;
      }
    }
  }

  return { width, height, cells, seed };
}

export function neighborsFromCell(maze: Maze, x: number, y: number): CellRef[] {
  const idx = toIndex(x, y, maze.width);
  const walls = maze.cells[idx];
  const result: CellRef[] = [];
  if (y > 0 && (walls & WALL_N) === 0) result.push({ x, y: y - 1 });
  if (x < maze.width - 1 && (walls & WALL_E) === 0) result.push({ x: x + 1, y });
  if (y < maze.height - 1 && (walls & WALL_S) === 0) result.push({ x, y: y + 1 });
  if (x > 0 && (walls & WALL_W) === 0) result.push({ x: x - 1, y });
  return result;
}

export function shortestPathLength(maze: Maze, start: CellRef, goal: CellRef): number {
  const queue: CellRef[] = [start];
  const dist = new Int32Array(maze.width * maze.height).fill(-1);
  dist[toIndex(start.x, start.y, maze.width)] = 0;

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDist = dist[toIndex(current.x, current.y, maze.width)];
    if (current.x === goal.x && current.y === goal.y) return currentDist;

    for (const next of neighborsFromCell(maze, current.x, current.y)) {
      const idx = toIndex(next.x, next.y, maze.width);
      if (dist[idx] !== -1) continue;
      dist[idx] = currentDist + 1;
      queue.push(next);
    }
  }

  return -1;
}
