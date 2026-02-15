import { RNG } from './random';

export type Maze = {
  width: number;
  height: number;
  verticalWalls: boolean[]; // (width + 1) * height
  horizontalWalls: boolean[]; // width * (height + 1)
  seed: number;
};

export type MazeConfig = {
  width: number;
  height: number;
  addLoops: number; // 0..1 probability per edge to remove after generation
  seed: number;
};

function indexV(x: number, y: number, width: number): number {
  return x + y * (width + 1);
}

function indexH(x: number, y: number, width: number): number {
  return x + y * width;
}

export function generateMaze(config: MazeConfig): Maze {
  const { width, height, seed, addLoops } = config;
  const rng = new RNG(seed);
  const total = width * height;
  const visited = new Array<boolean>(total).fill(false);
  const stack: number[] = [];

  const vWalls = new Array<boolean>((width + 1) * height).fill(true);
  const hWalls = new Array<boolean>(width * (height + 1)).fill(true);

  const start = 0;
  stack.push(start);
  visited[start] = true;

  while (stack.length) {
    const current = stack[stack.length - 1];
    const cx = current % width;
    const cy = Math.floor(current / width);

    const neighbors: Array<{ id: number; dir: 'N' | 'S' | 'E' | 'W' }> = [];
    if (cy > 0 && !visited[current - width]) neighbors.push({ id: current - width, dir: 'N' });
    if (cy < height - 1 && !visited[current + width]) neighbors.push({ id: current + width, dir: 'S' });
    if (cx > 0 && !visited[current - 1]) neighbors.push({ id: current - 1, dir: 'W' });
    if (cx < width - 1 && !visited[current + 1]) neighbors.push({ id: current + 1, dir: 'E' });

    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }

    const next = neighbors[rng.nextInt(neighbors.length)];
    switch (next.dir) {
      case 'N':
        hWalls[indexH(cx, cy, width)] = false;
        break;
      case 'S':
        hWalls[indexH(cx, cy + 1, width)] = false;
        break;
      case 'W':
        vWalls[indexV(cx, cy, width)] = false;
        break;
      case 'E':
        vWalls[indexV(cx + 1, cy, width)] = false;
        break;
    }
    visited[next.id] = true;
    stack.push(next.id);
  }

  // Optional loops: randomly knock down some walls (not borders)
  const candidateWalls: Array<{ kind: 'H' | 'V'; x: number; y: number }> = [];
  for (let y = 0; y < height; y++) {
    for (let x = 1; x < width; x++) {
      if (vWalls[indexV(x, y, width)]) candidateWalls.push({ kind: 'V', x, y });
    }
  }
  for (let y = 1; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (hWalls[indexH(x, y, width)]) candidateWalls.push({ kind: 'H', x, y });
    }
  }
  rng.shuffle(candidateWalls).forEach((wall) => {
    if (rng.next() > addLoops) return;
    if (wall.kind === 'V') {
      vWalls[indexV(wall.x, wall.y, width)] = false;
    } else {
      hWalls[indexH(wall.x, wall.y, width)] = false;
    }
  });

  return { width, height, verticalWalls: vWalls, horizontalWalls: hWalls, seed };
}

export function isConnected(maze: Maze): boolean {
  const { width, height, verticalWalls, horizontalWalls } = maze;
  const visited = new Array<boolean>(width * height).fill(false);
  const queue: number[] = [0];
  visited[0] = true;

  while (queue.length) {
    const current = queue.shift()!;
    const cx = current % width;
    const cy = Math.floor(current / width);
    const idx = current;
    const tryPush = (nx: number, ny: number) => {
      const id = nx + ny * width;
      if (!visited[id]) {
        visited[id] = true;
        queue.push(id);
      }
    };

    // north
    if (cy > 0 && !horizontalWalls[indexH(cx, cy, width)]) tryPush(cx, cy - 1);
    // south
    if (cy < height - 1 && !horizontalWalls[indexH(cx, cy + 1, width)]) tryPush(cx, cy + 1);
    // west
    if (cx > 0 && !verticalWalls[indexV(cx, cy, width)]) tryPush(cx - 1, cy);
    // east
    if (cx < width - 1 && !verticalWalls[indexV(cx + 1, cy, width)]) tryPush(cx + 1, cy);

    if (idx === width * height - 1 && visited[idx]) {
      // early exit once goal reached
      break;
    }
  }

  return visited[width * height - 1] === true;
}

export function shortestPathLength(maze: Maze): number {
  const { width, height, verticalWalls, horizontalWalls } = maze;
  const dist = new Array<number>(width * height).fill(-1);
  const queue: number[] = [0];
  dist[0] = 0;

  while (queue.length) {
    const current = queue.shift()!;
    const cx = current % width;
    const cy = Math.floor(current / width);
    const base = dist[current];

    const push = (nx: number, ny: number) => {
      const id = nx + ny * width;
      if (dist[id] === -1) {
        dist[id] = base + 1;
        queue.push(id);
      }
    };

    if (cy > 0 && !horizontalWalls[indexH(cx, cy, width)]) push(cx, cy - 1);
    if (cy < height - 1 && !horizontalWalls[indexH(cx, cy + 1, width)]) push(cx, cy + 1);
    if (cx > 0 && !verticalWalls[indexV(cx, cy, width)]) push(cx - 1, cy);
    if (cx < width - 1 && !verticalWalls[indexV(cx + 1, cy, width)]) push(cx + 1, cy);
  }

  return dist[width * height - 1];
}

export function wallAt(maze: Maze, kind: 'V' | 'H', x: number, y: number): boolean {
  if (kind === 'V') return maze.verticalWalls[indexV(x, y, maze.width)];
  return maze.horizontalWalls[indexH(x, y, maze.width)];
}
