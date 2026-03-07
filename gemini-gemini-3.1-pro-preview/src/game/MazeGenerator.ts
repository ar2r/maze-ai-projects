import { RNG } from './Utils';

export enum Wall {
  TOP = 1,
  RIGHT = 2,
  BOTTOM = 4,
  LEFT = 8
}

export interface Cell {
  x: number;
  y: number;
  walls: number; // bitmask of Wall
  visited: boolean;
}

export class Maze {
  public grid: Cell[][];
  public width: number;
  public height: number;

  constructor(width: number, height: number, seed: number) {
    this.width = width;
    this.height = height;
    this.grid = [];
    const rng = new RNG(seed);

    for (let y = 0; y < height; y++) {
      this.grid[y] = [];
      for (let x = 0; x < width; x++) {
        this.grid[y][x] = { x, y, walls: 15, visited: false };
      }
    }

    this.generate(rng);
  }

  private generate(rng: RNG) {
    const stack: Cell[] = [];
    const startCell = this.grid[0][0];
    startCell.visited = true;
    stack.push(startCell);

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = this.getUnvisitedNeighbors(current);

      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(rng.next() * neighbors.length)];
        this.removeWall(current, next);
        next.visited = true;
        stack.push(next);
      } else {
        stack.pop();
      }
    }
  }

  private getUnvisitedNeighbors(cell: Cell): Cell[] {
    const { x, y } = cell;
    const neighbors: Cell[] = [];

    if (y > 0 && !this.grid[y - 1][x].visited) neighbors.push(this.grid[y - 1][x]);
    if (x < this.width - 1 && !this.grid[y][x + 1].visited) neighbors.push(this.grid[y][x + 1]);
    if (y < this.height - 1 && !this.grid[y + 1][x].visited) neighbors.push(this.grid[y + 1][x]);
    if (x > 0 && !this.grid[y][x - 1].visited) neighbors.push(this.grid[y][x - 1]);

    return neighbors;
  }

  private removeWall(a: Cell, b: Cell) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    if (dx === 1) {
      a.walls &= ~Wall.LEFT;
      b.walls &= ~Wall.RIGHT;
    } else if (dx === -1) {
      a.walls &= ~Wall.RIGHT;
      b.walls &= ~Wall.LEFT;
    } else if (dy === 1) {
      a.walls &= ~Wall.TOP;
      b.walls &= ~Wall.BOTTOM;
    } else if (dy === -1) {
      a.walls &= ~Wall.BOTTOM;
      b.walls &= ~Wall.TOP;
    }
  }

  public isWallAt(x: number, y: number, wall: Wall): boolean {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return true;
    return (this.grid[y][x].walls & wall) !== 0;
  }
}
