import { Cell, MazeData, Vec2, Wall } from '../utils/types';
import { RNG } from './RNG';

/** Direction vectors for maze generation */
const DIRECTIONS: { dx: number; dy: number; wall: Wall; opposite: Wall }[] = [
  { dx: 0, dy: -1, wall: Wall.NORTH, opposite: Wall.SOUTH },
  { dx: 1, dy: 0, wall: Wall.EAST, opposite: Wall.WEST },
  { dx: 0, dy: 1, wall: Wall.SOUTH, opposite: Wall.NORTH },
  { dx: -1, dy: 0, wall: Wall.WEST, opposite: Wall.EAST },
];

/**
 * Generate a perfect maze using DFS backtracker algorithm
 * A perfect maze has exactly one path between any two cells
 */
export function generateMaze(width: number, height: number, seed: number): MazeData {
  const rng = new RNG(seed);

  // Initialize grid with all walls
  const cells: Cell[][] = [];
  for (let y = 0; y < height; y++) {
    cells[y] = [];
    for (let x = 0; x < width; x++) {
      cells[y][x] = {
        x,
        y,
        walls: Wall.ALL,
        visited: false,
      };
    }
  }

  // DFS backtracker
  const stack: Vec2[] = [];
  const startX = 0;
  const startY = 0;

  cells[startY][startX].visited = true;
  stack.push({ x: startX, y: startY });

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(cells, current.x, current.y, width, height);

    if (neighbors.length === 0) {
      stack.pop();
    } else {
      // Pick random neighbor
      const dir = neighbors[rng.nextInt(0, neighbors.length - 1)];
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;

      // Remove walls between current and neighbor
      cells[current.y][current.x].walls &= ~dir.wall;
      cells[ny][nx].walls &= ~dir.opposite;

      cells[ny][nx].visited = true;
      stack.push({ x: nx, y: ny });
    }
  }

  // Reset visited flags (used for pathfinding later)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      cells[y][x].visited = false;
    }
  }

  // Place start at top-left, end at bottom-right
  const start: Vec2 = { x: 0, y: 0 };
  const end: Vec2 = { x: width - 1, y: height - 1 };

  return { width, height, cells, start, end, seed };
}

/** Get unvisited neighboring cells */
function getUnvisitedNeighbors(
  cells: Cell[][],
  x: number,
  y: number,
  width: number,
  height: number
): typeof DIRECTIONS {
  return DIRECTIONS.filter((dir) => {
    const nx = x + dir.dx;
    const ny = y + dir.dy;
    return nx >= 0 && nx < width && ny >= 0 && ny < height && !cells[ny][nx].visited;
  });
}

/** Check if maze is solvable (BFS from start to end) */
export function isMazeSolvable(maze: MazeData): boolean {
  const { width, height, cells, start, end } = maze;
  const visited = new Set<string>();
  const queue: Vec2[] = [{ x: start.x, y: start.y }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.x},${current.y}`;

    if (current.x === end.x && current.y === end.y) {
      return true;
    }

    if (visited.has(key)) continue;
    visited.add(key);

    const cell = cells[current.y][current.x];

    // Check each direction
    for (const dir of DIRECTIONS) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;

      // Check bounds and wall
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if ((cell.walls & dir.wall) === 0) {
          queue.push({ x: nx, y: ny });
        }
      }
    }
  }

  return false;
}

/** Find shortest path length using BFS */
export function findPathLength(maze: MazeData): number {
  const { width, height, cells, start, end } = maze;
  const visited = new Set<string>();
  const queue: { x: number; y: number; dist: number }[] = [{ x: start.x, y: start.y, dist: 0 }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.x},${current.y}`;

    if (current.x === end.x && current.y === end.y) {
      return current.dist;
    }

    if (visited.has(key)) continue;
    visited.add(key);

    const cell = cells[current.y][current.x];

    for (const dir of DIRECTIONS) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if ((cell.walls & dir.wall) === 0) {
          queue.push({ x: nx, y: ny, dist: current.dist + 1 });
        }
      }
    }
  }

  return -1; // Unreachable
}

/** Check if a point is within the playable area (not inside a wall) */
export function isPointInPlayableArea(
  maze: MazeData,
  px: number,
  py: number,
  cellSize: number,
  wallThickness: number
): boolean {
  const cellX = Math.floor(px / cellSize);
  const cellY = Math.floor(py / cellSize);

  if (cellX < 0 || cellX >= maze.width || cellY < 0 || cellY >= maze.height) {
    return false;
  }

  // Check if point is too close to walls
  const localX = px - cellX * cellSize;
  const localY = py - cellY * cellSize;
  const cell = maze.cells[cellY][cellX];
  const halfWall = wallThickness / 2;

  // Check north wall
  if ((cell.walls & Wall.NORTH) && localY < halfWall) return false;
  // Check south wall
  if ((cell.walls & Wall.SOUTH) && localY > cellSize - halfWall) return false;
  // Check west wall
  if ((cell.walls & Wall.WEST) && localX < halfWall) return false;
  // Check east wall
  if ((cell.walls & Wall.EAST) && localX > cellSize - halfWall) return false;

  return true;
}
