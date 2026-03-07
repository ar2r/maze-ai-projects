// Maze generation using DFS Backtracker algorithm

import { Cell, Maze } from './types';
import { SeededRNG } from './rng';

export class MazeGenerator {
  private rng: SeededRNG = new SeededRNG(0);

  generate(width: number, height: number, seed: number, cellSize: number, loops: number = 0): Maze {
    this.rng = new SeededRNG(seed);

    // Initialize cells with all walls
    const cells: Cell[][] = [];
    for (let y = 0; y < height; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < width; x++) {
        row.push({
          x,
          y,
          walls: { north: true, south: true, east: true, west: true },
          visited: false
        });
      }
      cells.push(row);
    }

    // DFS Backtracker
    const stack: Cell[] = [];
    const startCell = cells[0][0];
    startCell.visited = true;
    stack.push(startCell);

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = this.getUnvisitedNeighbors(current, cells, width, height);

      if (neighbors.length === 0) {
        stack.pop();
      } else {
        const next = neighbors[this.rng.nextInt(0, neighbors.length - 1)];
        this.removeWall(current, next);
        next.visited = true;
        stack.push(next);
      }
    }

    // Add loops for higher difficulties
    for (let i = 0; i < loops; i++) {
      this.addRandomLoop(cells, width, height);
    }

    return {
      width,
      height,
      cells,
      cellSize,
      startX: cellSize / 2,
      startY: cellSize / 2,
      endX: (width - 1) * cellSize + cellSize / 2,
      endY: (height - 1) * cellSize + cellSize / 2
    };
  }

  private getUnvisitedNeighbors(cell: Cell, cells: Cell[][], width: number, height: number): Cell[] {
    const neighbors: Cell[] = [];
    const { x, y } = cell;

    if (y > 0 && !cells[y - 1][x].visited) neighbors.push(cells[y - 1][x]);
    if (y < height - 1 && !cells[y + 1][x].visited) neighbors.push(cells[y + 1][x]);
    if (x > 0 && !cells[y][x - 1].visited) neighbors.push(cells[y][x - 1]);
    if (x < width - 1 && !cells[y][x + 1].visited) neighbors.push(cells[y][x + 1]);

    return neighbors;
  }

  private removeWall(current: Cell, next: Cell): void {
    const dx = next.x - current.x;
    const dy = next.y - current.y;

    if (dx === 1) {
      current.walls.east = false;
      next.walls.west = false;
    } else if (dx === -1) {
      current.walls.west = false;
      next.walls.east = false;
    } else if (dy === 1) {
      current.walls.south = false;
      next.walls.north = false;
    } else if (dy === -1) {
      current.walls.north = false;
      next.walls.south = false;
    }
  }

  private addRandomLoop(cells: Cell[][], width: number, height: number): void {
    const x = this.rng.nextInt(0, width - 1);
    const y = this.rng.nextInt(0, height - 1);
    const cell = cells[y][x];

    const directions: Array<{ dir: string; dx: number; dy: number }> = [
      { dir: 'north', dx: 0, dy: -1 },
      { dir: 'south', dx: 0, dy: 1 },
      { dir: 'east', dx: 1, dy: 0 },
      { dir: 'west', dx: -1, dy: 0 }
    ];

    const validDirs = directions.filter(d => {
      const nx = x + d.dx;
      const ny = y + d.dy;
      return nx >= 0 && nx < width && ny >= 0 && ny < height;
    });

    if (validDirs.length > 0) {
      const chosen = validDirs[this.rng.nextInt(0, validDirs.length - 1)];
      const nx = x + chosen.dx;
      const ny = y + chosen.dy;
      const next = cells[ny][nx];

      // Create a passage (add a loop)
      if (chosen.dir === 'north') {
        cell.walls.north = false;
        next.walls.south = false;
      } else if (chosen.dir === 'south') {
        cell.walls.south = false;
        next.walls.north = false;
      } else if (chosen.dir === 'east') {
        cell.walls.east = false;
        next.walls.west = false;
      } else if (chosen.dir === 'west') {
        cell.walls.west = false;
        next.walls.east = false;
      }
    }
  }
}

export function isWallAt(maze: Maze, worldX: number, worldY: number, wallThickness: number = 4): boolean {
  const cellX = Math.floor(worldX / maze.cellSize);
  const cellY = Math.floor(worldY / maze.cellSize);

  if (cellX < 0 || cellX >= maze.width || cellY < 0 || cellY >= maze.height) {
    return true; // Outside maze bounds
  }

  const cell = maze.cells[cellY][cellX];
  const localX = worldX - cellX * maze.cellSize;
  const localY = worldY - cellY * maze.cellSize;

  // Check walls within cell
  if (localY < wallThickness && cell.walls.north) return true;
  if (localY > maze.cellSize - wallThickness && cell.walls.south) return true;
  if (localX < wallThickness && cell.walls.west) return true;
  if (localX > maze.cellSize - wallThickness && cell.walls.east) return true;

  return false;
}