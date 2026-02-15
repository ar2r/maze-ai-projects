// === Maze Generation Tests ===

import { describe, it, expect } from 'vitest';
import { generateMaze } from '../src/maze/generator';
import { isReachable, calculatePathLength } from '../src/maze/validator';
import { createSeed } from '../src/utils/random';

describe('Maze Generator', () => {
  it('should generate a valid maze with correct dimensions', () => {
    const level = 1;
    const seed = createSeed(level, 12345);
    const maze = generateMaze(level, seed, 800, 600);

    expect(maze).toBeDefined();
    expect(maze.width).toBeGreaterThan(0);
    expect(maze.height).toBeGreaterThan(0);
    expect(maze.grid).toHaveLength(maze.height);
    expect(maze.grid[0]).toHaveLength(maze.width);
    expect(maze.seed).toBe(seed);
  });

  it('should ensure start and finish positions are within bounds', () => {
    const level = 1;
    const seed = createSeed(level, 12345);
    const maze = generateMaze(level, seed, 800, 600);

    const maxX = maze.width * maze.cellSize;
    const maxY = maze.height * maze.cellSize;

    expect(maze.start.x).toBeGreaterThanOrEqual(0);
    expect(maze.start.x).toBeLessThanOrEqual(maxX);
    expect(maze.start.y).toBeGreaterThanOrEqual(0);
    expect(maze.start.y).toBeLessThanOrEqual(maxY);

    expect(maze.finish.x).toBeGreaterThanOrEqual(0);
    expect(maze.finish.x).toBeLessThanOrEqual(maxX);
    expect(maze.finish.y).toBeGreaterThanOrEqual(0);
    expect(maze.finish.y).toBeLessThanOrEqual(maxY);
  });

  it('should generate a reachable maze (path exists from start to finish)', () => {
    const level = 1;
    const seed = createSeed(level, 12345);
    const maze = generateMaze(level, seed, 800, 600);

    expect(isReachable(maze)).toBe(true);
  });

  it('should generate mazes with increasing size for higher levels', () => {
    const seed = 12345;

    const maze1 = generateMaze(1, seed, 1000, 1000);
    const maze2 = generateMaze(5, seed, 1000, 1000);
    const maze3 = generateMaze(10, seed, 1000, 1000);

    expect(maze1.width).toBeLessThan(maze2.width);
    expect(maze2.width).toBeLessThan(maze3.width);
  });

  it('should have all cells properly initialized with walls', () => {
    const level = 1;
    const seed = createSeed(level, 12345);
    const maze = generateMaze(level, seed, 800, 600);

    for (let row = 0; row < maze.height; row++) {
      for (let col = 0; col < maze.width; col++) {
        const cell = maze.grid[row][col];

        expect(cell.row).toBe(row);
        expect(cell.col).toBe(col);
        expect(cell.walls).toBeDefined();
        expect(typeof cell.walls.top).toBe('boolean');
        expect(typeof cell.walls.right).toBe('boolean');
        expect(typeof cell.walls.bottom).toBe('boolean');
        expect(typeof cell.walls.left).toBe('boolean');
      }
    }
  });

  it('should create different mazes for different seeds', () => {
    const level = 1;
    const maze1 = generateMaze(level, 123, 800, 600);
    const maze2 = generateMaze(level, 456, 800, 600);

    // Check if at least one cell has different walls
    let isDifferent = false;

    for (let row = 0; row < maze1.height; row++) {
      for (let col = 0; col < maze1.width; col++) {
        const cell1 = maze1.grid[row][col];
        const cell2 = maze2.grid[row][col];

        if (
          cell1.walls.top !== cell2.walls.top ||
          cell1.walls.right !== cell2.walls.right ||
          cell1.walls.bottom !== cell2.walls.bottom ||
          cell1.walls.left !== cell2.walls.left
        ) {
          isDifferent = true;
          break;
        }
      }

      if (isDifferent) break;
    }

    expect(isDifferent).toBe(true);
  });

  it('should create the same maze for the same seed', () => {
    const level = 1;
    const seed = 12345;

    const maze1 = generateMaze(level, seed, 800, 600);
    const maze2 = generateMaze(level, seed, 800, 600);

    // Check if all cells have identical walls
    for (let row = 0; row < maze1.height; row++) {
      for (let col = 0; col < maze1.width; col++) {
        const cell1 = maze1.grid[row][col];
        const cell2 = maze2.grid[row][col];

        expect(cell1.walls.top).toBe(cell2.walls.top);
        expect(cell1.walls.right).toBe(cell2.walls.right);
        expect(cell1.walls.bottom).toBe(cell2.walls.bottom);
        expect(cell1.walls.left).toBe(cell2.walls.left);
      }
    }
  });

  it('should have at least some walls removed (not all walls closed)', () => {
    const level = 1;
    const seed = createSeed(level, 12345);
    const maze = generateMaze(level, seed, 800, 600);

    let wallsRemoved = false;

    for (let row = 0; row < maze.height; row++) {
      for (let col = 0; col < maze.width; col++) {
        const cell = maze.grid[row][col];

        // Check if at least one wall is removed (not counting edges)
        if (
          (row > 0 && !cell.walls.top) ||
          (col < maze.width - 1 && !cell.walls.right) ||
          (row < maze.height - 1 && !cell.walls.bottom) ||
          (col > 0 && !cell.walls.left)
        ) {
          wallsRemoved = true;
          break;
        }
      }

      if (wallsRemoved) break;
    }

    expect(wallsRemoved).toBe(true);
  });

  it('should calculate a reasonable path length', () => {
    const level = 1;
    const seed = createSeed(level, 12345);
    const maze = generateMaze(level, seed, 800, 600);

    const pathLength = calculatePathLength(maze);

    // Path should exist and be at least the Manhattan distance
    const manhattanDistance = Math.abs(
      Math.floor(maze.finish.x / maze.cellSize) - Math.floor(maze.start.x / maze.cellSize)
    ) + Math.abs(
      Math.floor(maze.finish.y / maze.cellSize) - Math.floor(maze.start.y / maze.cellSize)
    );

    expect(pathLength).toBeGreaterThanOrEqual(manhattanDistance);
    expect(pathLength).toBeLessThan(maze.width * maze.height); // Should not visit all cells
  });
});

describe('Seeded Random', () => {
  it('should create unique seeds from different levels', () => {
    const seed1 = createSeed(1, 12345);
    const seed2 = createSeed(2, 12345);

    expect(seed1).not.toBe(seed2);
  });

  it('should create the same seed for the same inputs', () => {
    const seed1 = createSeed(5, 12345);
    const seed2 = createSeed(5, 12345);

    expect(seed1).toBe(seed2);
  });
});
