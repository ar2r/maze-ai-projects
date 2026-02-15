import { describe, it, expect } from 'vitest';
import { generateMaze, isMazeSolvable, findPathLength } from '../src/maze/MazeGenerator';
import { RNG } from '../src/maze/RNG';
import { Wall } from '../src/utils/types';

describe('RNG', () => {
  it('should produce deterministic results with same seed', () => {
    const rng1 = new RNG(12345);
    const rng2 = new RNG(12345);

    for (let i = 0; i < 100; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });

  it('should produce different results with different seeds', () => {
    const rng1 = new RNG(12345);
    const rng2 = new RNG(54321);

    let same = 0;
    for (let i = 0; i < 100; i++) {
      if (rng1.next() === rng2.next()) same++;
    }
    // Extremely unlikely to have many matches
    expect(same).toBeLessThan(5);
  });

  it('should produce values in [0, 1) range', () => {
    const rng = new RNG(42);
    for (let i = 0; i < 1000; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('should produce integers in specified range', () => {
    const rng = new RNG(42);
    for (let i = 0; i < 1000; i++) {
      const val = rng.nextInt(5, 10);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(10);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('should shuffle arrays in place', () => {
    const rng = new RNG(42);
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const original = [...arr];
    rng.shuffle(arr);

    expect(arr.length).toBe(original.length);
    expect(arr.sort()).toEqual(original.sort());
  });
});

describe('Maze Generation', () => {
  it('should generate a maze of correct dimensions', () => {
    const maze = generateMaze(10, 8, 12345);

    expect(maze.width).toBe(10);
    expect(maze.height).toBe(8);
    expect(maze.cells.length).toBe(8);
    expect(maze.cells[0].length).toBe(10);
  });

  it('should be deterministic with same seed', () => {
    const maze1 = generateMaze(10, 10, 42);
    const maze2 = generateMaze(10, 10, 42);

    for (let y = 0; y < maze1.height; y++) {
      for (let x = 0; x < maze1.width; x++) {
        expect(maze1.cells[y][x].walls).toBe(maze2.cells[y][x].walls);
      }
    }
  });

  it('should always be solvable', () => {
    // Test multiple random mazes
    for (let i = 0; i < 20; i++) {
      const seed = RNG.seedWithTimestamp(i);
      const width = 5 + (i % 15);
      const height = 5 + (i % 15);
      const maze = generateMaze(width, height, seed);

      expect(isMazeSolvable(maze)).toBe(true);
    }
  });

  it('should have start at (0,0) and end at (width-1, height-1)', () => {
    const maze = generateMaze(15, 12, 99);

    expect(maze.start.x).toBe(0);
    expect(maze.start.y).toBe(0);
    expect(maze.end.x).toBe(14);
    expect(maze.end.y).toBe(11);
  });

  it('should have outer boundary walls', () => {
    const maze = generateMaze(10, 10, 42);

    // Check top row has north walls
    for (let x = 0; x < maze.width; x++) {
      expect(maze.cells[0][x].walls & Wall.NORTH).toBeTruthy();
    }

    // Check bottom row has south walls
    for (let x = 0; x < maze.width; x++) {
      expect(maze.cells[maze.height - 1][x].walls & Wall.SOUTH).toBeTruthy();
    }

    // Check left column has west walls
    for (let y = 0; y < maze.height; y++) {
      expect(maze.cells[y][0].walls & Wall.WEST).toBeTruthy();
    }

    // Check right column has east walls
    for (let y = 0; y < maze.height; y++) {
      expect(maze.cells[y][maze.width - 1].walls & Wall.EAST).toBeTruthy();
    }
  });

  it('should produce a perfect maze (one path between cells)', () => {
    const maze = generateMaze(10, 10, 42);

    // Count total passages
    let passages = 0;
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const cell = maze.cells[y][x];
        // Count open walls (passages)
        if (!(cell.walls & Wall.NORTH) && y > 0) passages++;
        if (!(cell.walls & Wall.EAST) && x < maze.width - 1) passages++;
      }
    }

    // Perfect maze has exactly (width * height - 1) passages
    const expectedPassages = maze.width * maze.height - 1;
    expect(passages).toBe(expectedPassages);
  });

  it('should have consistent wall pairs (no holes)', () => {
    const maze = generateMaze(10, 10, 42);

    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const cell = maze.cells[y][x];

        // If cell has no north wall, neighbor must have no south wall
        if (y > 0) {
          const north = maze.cells[y - 1][x];
          const cellHasNorth = !!(cell.walls & Wall.NORTH);
          const northHasSouth = !!(north.walls & Wall.SOUTH);
          expect(cellHasNorth).toBe(northHasSouth);
        }

        // If cell has no east wall, neighbor must have no west wall
        if (x < maze.width - 1) {
          const east = maze.cells[y][x + 1];
          const cellHasEast = !!(cell.walls & Wall.EAST);
          const eastHasWest = !!(east.walls & Wall.WEST);
          expect(cellHasEast).toBe(eastHasWest);
        }
      }
    }
  });

  it('should find correct path length', () => {
    const maze = generateMaze(5, 5, 42);
    const pathLength = findPathLength(maze);

    // Path length must be at least manhattan distance
    const minPath = (maze.width - 1) + (maze.height - 1);
    expect(pathLength).toBeGreaterThanOrEqual(minPath);

    // Path length must be less than total cells (no cycles in perfect maze)
    expect(pathLength).toBeLessThan(maze.width * maze.height);
  });
});
