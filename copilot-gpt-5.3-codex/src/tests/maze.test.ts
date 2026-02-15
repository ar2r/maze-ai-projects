import { describe, expect, it } from 'vitest';
import { generatePerfectMaze, shortestPathLength } from '../core/maze';
import { isMazeConnected, validateMazeReachable } from '../core/validate';

describe('maze generation', () => {
  it('creates a reachable connected maze', () => {
    const maze = generatePerfectMaze(16, 12, 'seed-a');
    expect(isMazeConnected(maze)).toBe(true);
    expect(validateMazeReachable(maze)).toBe(true);
  });

  it('is deterministic for same seed', () => {
    const mazeA = generatePerfectMaze(10, 8, 'same-seed');
    const mazeB = generatePerfectMaze(10, 8, 'same-seed');
    expect([...mazeA.cells]).toEqual([...mazeB.cells]);
  });

  it('has valid path length to exit', () => {
    const maze = generatePerfectMaze(20, 16, 'path-seed');
    const path = shortestPathLength(maze, { x: 0, y: 0 }, { x: maze.width - 1, y: maze.height - 1 });
    expect(path).toBeGreaterThan(10);
  });
});
