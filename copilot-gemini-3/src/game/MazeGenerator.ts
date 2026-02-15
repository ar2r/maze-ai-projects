import { SeededRandom } from '../utils/math';

export enum Direction {
  N = 1,
  E = 2,
  S = 4,
  W = 8,
}

export const DX: Record<Direction, number> = {
  [Direction.N]: 0,
  [Direction.E]: 1,
  [Direction.S]: 0,
  [Direction.W]: -1,
};

export const DY: Record<Direction, number> = {
  [Direction.N]: -1,
  [Direction.E]: 0,
  [Direction.S]: 1,
  [Direction.W]: 0,
};

export const OPPOSITE: Record<Direction, Direction> = {
  [Direction.N]: Direction.S,
  [Direction.E]: Direction.W,
  [Direction.S]: Direction.N,
  [Direction.W]: Direction.E,
};

export interface MazeCell {
  x: number;
  y: number;
  walls: number; // Bitmask of Direction
  visited: boolean;
}

export class Maze {
  public width: number;
  public height: number;
  public grid: MazeCell[][];
  public start: { x: number, y: number };
  public end: { x: number, y: number };
  private rng: SeededRandom;

  constructor(width: number, height: number, seed: number) {
    this.width = width;
    this.height = height;
    this.rng = new SeededRandom(seed);
    this.grid = [];
    this.start = { x: 0, y: 0 };
    this.end = { x: width - 1, y: height - 1 };
    
    this.initGrid();
    this.generate();
    this.ensureStartEnd();
  }

  private initGrid() {
    for (let y = 0; y < this.height; y++) {
      const row: MazeCell[] = [];
      for (let x = 0; x < this.width; x++) {
        row.push({
          x,
          y,
          walls: Direction.N | Direction.E | Direction.S | Direction.W,
          visited: false
        });
      }
      this.grid.push(row);
    }
  }

  private generate() {
    const stack: MazeCell[] = [];
    const startCell = this.grid[0][0];
    startCell.visited = true;
    stack.push(startCell);

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = this.getUnvisitedNeighbors(current);

      if (neighbors.length > 0) {
        // Choose random neighbor
        const next = neighbors[Math.floor(this.rng.next() * neighbors.length)];
        
        // Remove walls
        const dir = this.getDirection(current, next);
        current.walls &= ~dir;
        next.walls &= ~OPPOSITE[dir];

        next.visited = true;
        stack.push(next);
      } else {
        stack.pop();
      }
    }
    
    // Sparsify walls? (Loops) - Optional for higher difficulty
    // For now, perfect maze (Tree)
  }

  private getUnvisitedNeighbors(cell: MazeCell): MazeCell[] {
    const neighbors: MazeCell[] = [];
    const directions = [Direction.N, Direction.E, Direction.S, Direction.W];

    for (const dir of directions) {
      const nx = cell.x + DX[dir];
      const ny = cell.y + DY[dir];

      if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
        if (!this.grid[ny][nx].visited) {
          neighbors.push(this.grid[ny][nx]);
        }
      }
    }
    return neighbors;
  }

  private getDirection(from: MazeCell, to: MazeCell): Direction {
    if (to.x > from.x) return Direction.E;
    if (to.x < from.x) return Direction.W;
    if (to.y > from.y) return Direction.S;
    if (to.y < from.y) return Direction.N;
    throw new Error("Cells are not neighbors");
  }

  // Ensure start (0,0) and end (w-1, h-1) are open on the edges if needed
  // For now, the maze is enclosed by walls, but the 'path' exists between 0,0 and w-1,h-1
  private ensureStartEnd() {
    // Maybe open the "entrance" wall at 0,0 N and exit at w-1,h-1 S?
    // Let's keep walls closed and just place the player inside.
  }
}
