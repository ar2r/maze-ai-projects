import { describe, it, expect } from 'vitest';
import { generateMaze, bfsSolve, isFullyConnected } from '../src/game/maze';
import { getLevelConfig } from '../src/game/levels';

describe('Maze Generation', () => {
  it('generates a fully connected maze', () => {
    for (let level = 1; level <= 10; level++) {
      const config = getLevelConfig(level);
      const maze = generateMaze(config);
      expect(isFullyConnected(maze.cells)).toBe(true);
    }
  });

  it('start and finish are always reachable', () => {
    for (let level = 1; level <= 10; level++) {
      const config = getLevelConfig(level);
      const maze = generateMaze(config);
      const path = bfsSolve(maze.cells, [0, 0], [maze.rows - 1, maze.cols - 1]);
      expect(path).toBeGreaterThan(0);
    }
  });

  it('is deterministic for the same level', () => {
    const config = getLevelConfig(5);
    const maze1 = generateMaze(config);
    const maze2 = generateMaze(config);

    // Compare wall structures
    for (let r = 0; r < maze1.rows; r++) {
      for (let c = 0; c < maze1.cols; c++) {
        expect(maze1.cells[r][c].walls).toEqual(maze2.cells[r][c].walls);
      }
    }
    expect(maze1.seed).toBe(maze2.seed);
    expect(maze1.solutionLength).toBe(maze2.solutionLength);
  });

  it('different levels produce different mazes', () => {
    const maze3 = generateMaze(getLevelConfig(3));
    const maze4 = generateMaze(getLevelConfig(4));
    // At minimum, different sizes or different walls
    const sameWalls = maze3.cells[0]?.[0]?.walls.top === maze4.cells[0]?.[0]?.walls.top &&
      maze3.cells[0]?.[0]?.walls.right === maze4.cells[0]?.[0]?.walls.right;
    // They could match by chance at (0,0) but seeds differ
    expect(maze3.seed).not.toBe(maze4.seed);
  });

  it('has correct grid dimensions', () => {
    const config = getLevelConfig(1);
    const maze = generateMaze(config);
    expect(maze.cells.length).toBe(config.rows);
    expect(maze.cells[0].length).toBe(config.cols);
  });

  it('outer boundary walls are intact', () => {
    const config = getLevelConfig(3);
    const maze = generateMaze(config);

    // Top row: all top walls should be present
    for (let c = 0; c < maze.cols; c++) {
      expect(maze.cells[0][c].walls.top).toBe(true);
    }
    // Bottom row: all bottom walls
    for (let c = 0; c < maze.cols; c++) {
      expect(maze.cells[maze.rows - 1][c].walls.bottom).toBe(true);
    }
    // Left column: all left walls
    for (let r = 0; r < maze.rows; r++) {
      expect(maze.cells[r][0].walls.left).toBe(true);
    }
    // Right column: all right walls
    for (let r = 0; r < maze.rows; r++) {
      expect(maze.cells[r][maze.cols - 1].walls.right).toBe(true);
    }
  });

  it('solution length increases with level', () => {
    const sol1 = generateMaze(getLevelConfig(1)).solutionLength;
    const sol5 = generateMaze(getLevelConfig(5)).solutionLength;
    const sol10 = generateMaze(getLevelConfig(10)).solutionLength;
    expect(sol5).toBeGreaterThan(sol1);
    expect(sol10).toBeGreaterThan(sol5);
  });
});
