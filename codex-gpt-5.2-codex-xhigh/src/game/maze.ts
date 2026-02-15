import type { Cell, Maze, Point, LevelConfig } from './types';
import type { Rng } from './rng';

const DIRS = [
  { dx: 0, dy: -1, wall: 0 as const, opp: 2 as const },
  { dx: 1, dy: 0, wall: 1 as const, opp: 3 as const },
  { dx: 0, dy: 1, wall: 2 as const, opp: 0 as const },
  { dx: -1, dy: 0, wall: 3 as const, opp: 1 as const }
];

export function makeLevelConfig(level: number): LevelConfig {
  const base = 6;
  const growth = Math.floor(level * 0.75);
  const cols = clamp(base + growth, 6, 32);
  const rows = clamp(base + Math.floor(level * 0.6), 6, 28);
  const wallThickness = clamp(0.18 + level * 0.006, 0.18, 0.32);
  const loopChance = clamp(0.06 + level * 0.004, 0.06, 0.18);
  return { cols, rows, wallThickness, loopChance };
}

export function generateMaze(cols: number, rows: number, rng: Rng, seed: number, loopChance: number): Maze {
  const cells: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ walls: [true, true, true, true], visited: false }))
  );

  const start = pickEdgeStart(cols, rows, rng);
  const stack: Point[] = [start];
  cells[start.y][start.x].visited = true;

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors: { x: number; y: number; dir: typeof DIRS[number] }[] = [];

    for (const dir of DIRS) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      if (!cells[ny][nx].visited) neighbors.push({ x: nx, y: ny, dir });
    }

    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }

    const chosen = neighbors[rng.int(0, neighbors.length - 1)];
    const currentCell = cells[current.y][current.x];
    const nextCell = cells[chosen.y][chosen.x];
    currentCell.walls[chosen.dir.wall] = false;
    nextCell.walls[chosen.dir.opp] = false;
    nextCell.visited = true;
    stack.push({ x: chosen.x, y: chosen.y });
  }

  if (loopChance > 0) {
    addLoops(cells, cols, rows, rng, loopChance);
  }

  const distances = computeDistances(cells, cols, rows, start);
  const finish = findFarthestCell(distances, cols, rows);

  return {
    cols,
    rows,
    cells,
    start,
    finish,
    seed,
    loopChance
  };
}

export function computeDistances(cells: Cell[][], cols: number, rows: number, start: Point): number[][] {
  const dist: number[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => -1));
  const queue: Point[] = [start];
  let head = 0;
  dist[start.y][start.x] = 0;

  while (head < queue.length) {
    const current = queue[head++] as Point;
    const currentCell = cells[current.y][current.x];
    for (const dir of DIRS) {
      if (currentCell.walls[dir.wall]) continue;
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      if (dist[ny][nx] !== -1) continue;
      dist[ny][nx] = dist[current.y][current.x] + 1;
      queue.push({ x: nx, y: ny });
    }
  }

  return dist;
}

export function validateMazeConnectivity(maze: Maze): boolean {
  const dist = computeDistances(maze.cells, maze.cols, maze.rows, maze.start);
  for (let y = 0; y < maze.rows; y++) {
    for (let x = 0; x < maze.cols; x++) {
      if (dist[y][x] === -1) return false;
    }
  }
  return true;
}

export function validateMazeBoundaries(maze: Maze): boolean {
  const { cols, rows, cells } = maze;
  for (let x = 0; x < cols; x++) {
    if (!cells[0][x].walls[0]) return false;
    if (!cells[rows - 1][x].walls[2]) return false;
  }
  for (let y = 0; y < rows; y++) {
    if (!cells[y][0].walls[3]) return false;
    if (!cells[y][cols - 1].walls[1]) return false;
  }
  return true;
}

function addLoops(cells: Cell[][], cols: number, rows: number, rng: Rng, loopChance: number): void {
  const attempts = Math.floor(cols * rows * loopChance);
  for (let i = 0; i < attempts; i++) {
    const x = rng.int(0, cols - 1);
    const y = rng.int(0, rows - 1);
    const dir = DIRS[rng.int(0, DIRS.length - 1)];
    const nx = x + dir.dx;
    const ny = y + dir.dy;
    if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
    if (!cells[y][x].walls[dir.wall]) continue;
    cells[y][x].walls[dir.wall] = false;
    cells[ny][nx].walls[dir.opp] = false;
  }
}

function findFarthestCell(dist: number[][], cols: number, rows: number): Point {
  let best: Point = { x: 0, y: 0 };
  let bestDist = -1;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (dist[y][x] > bestDist) {
        bestDist = dist[y][x];
        best = { x, y };
      }
    }
  }
  return best;
}

function pickEdgeStart(cols: number, rows: number, rng: Rng): Point {
  const edges: Point[] = [];
  for (let x = 0; x < cols; x++) {
    edges.push({ x, y: 0 });
    edges.push({ x, y: rows - 1 });
  }
  for (let y = 1; y < rows - 1; y++) {
    edges.push({ x: 0, y });
    edges.push({ x: cols - 1, y });
  }
  return edges[rng.int(0, edges.length - 1)];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
