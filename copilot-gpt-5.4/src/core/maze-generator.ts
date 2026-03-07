import { deriveLevelSeed, SeededRng } from './rng';
import { getShortestPathLength } from './maze-validator';
import type { LevelConfig, MazeCell, MazeData, Rect } from '../types';

interface Direction {
  dx: number;
  dy: number;
  wall: keyof MazeCell['walls'];
  opposite: keyof MazeCell['walls'];
}

const DIRECTIONS: Direction[] = [
  { dx: 0, dy: -1, wall: 'north', opposite: 'south' },
  { dx: 1, dy: 0, wall: 'east', opposite: 'west' },
  { dx: 0, dy: 1, wall: 'south', opposite: 'north' },
  { dx: -1, dy: 0, wall: 'west', opposite: 'east' },
];

function indexFor(cols: number, x: number, y: number): number {
  return y * cols + x;
}

function createCells(cols: number, rows: number): MazeCell[] {
  const cells: MazeCell[] = [];

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      cells.push({
        x,
        y,
        walls: {
          north: true,
          east: true,
          south: true,
          west: true,
        },
      });
    }
  }

  return cells;
}

export function generateMaze(config: LevelConfig, baseSeed: string): MazeData {
  const maxAttempts = 12;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const seed = deriveLevelSeed(baseSeed, config.level, attempt);
    const rng = new SeededRng(seed);
    const cells = createCells(config.cols, config.rows);
    const visited = new Array<boolean>(cells.length).fill(false);
    const stack = [0];
    visited[0] = true;

    while (stack.length > 0) {
      const currentIndex = stack[stack.length - 1] as number;
      const currentCell = cells[currentIndex] as MazeCell;
      const candidates = DIRECTIONS.map((direction) => {
        const nextX = currentCell.x + direction.dx;
        const nextY = currentCell.y + direction.dy;

        if (nextX < 0 || nextY < 0 || nextX >= config.cols || nextY >= config.rows) {
          return null;
        }

        const nextIndex = indexFor(config.cols, nextX, nextY);
        if (visited[nextIndex]) {
          return null;
        }

        return {
          direction,
          nextIndex,
        };
      }).filter(Boolean) as Array<{ direction: Direction; nextIndex: number }>;

      if (candidates.length === 0) {
        stack.pop();
        continue;
      }

      const choice = rng.pick(candidates);
      const nextCell = cells[choice.nextIndex] as MazeCell;

      currentCell.walls[choice.direction.wall] = false;
      nextCell.walls[choice.direction.opposite] = false;
      visited[choice.nextIndex] = true;
      stack.push(choice.nextIndex);
    }

    const maze: MazeData = {
      cols: config.cols,
      rows: config.rows,
      cells,
      startIndex: 0,
      finishIndex: cells.length - 1,
      solutionLength: 0,
      seed,
    };

    maze.solutionLength = getShortestPathLength(maze);

    if (maze.solutionLength >= config.minSolutionLength || attempt === maxAttempts - 1) {
      return maze;
    }
  }

  throw new Error('Failed to generate a valid maze.');
}

export function buildWallRects(maze: MazeData, wallThickness: number): Rect[] {
  const rects: Rect[] = [];

  for (const cell of maze.cells) {
    if (cell.walls.north) {
      rects.push({ x: cell.x, y: cell.y, width: 1, height: wallThickness });
    }

    if (cell.walls.west) {
      rects.push({ x: cell.x, y: cell.y, width: wallThickness, height: 1 });
    }

    if (cell.x === maze.cols - 1 && cell.walls.east) {
      rects.push({ x: cell.x + 1 - wallThickness, y: cell.y, width: wallThickness, height: 1 });
    }

    if (cell.y === maze.rows - 1 && cell.walls.south) {
      rects.push({ x: cell.x, y: cell.y + 1 - wallThickness, width: 1, height: wallThickness });
    }
  }

  return rects;
}

export function buildMazeSignature(maze: MazeData): string {
  return maze.cells
    .map((cell) => [cell.walls.north, cell.walls.east, cell.walls.south, cell.walls.west].map((value) => (value ? '1' : '0')).join(''))
    .join('|');
}
