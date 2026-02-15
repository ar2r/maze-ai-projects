import { describe, expect, it } from 'vitest';
import {
  WALL_E,
  WALL_N,
  WALL_S,
  WALL_W,
  countOpenEdges,
  generateMaze,
  isMazeConnected,
  isReachable
} from '../src/game/maze';

describe('maze generation', () => {
  it('is deterministic for the same seed', () => {
    const a = generateMaze({ cols: 12, rows: 10, seed: 123456 });
    const b = generateMaze({ cols: 12, rows: 10, seed: 123456 });

    expect(a.cols).toBe(b.cols);
    expect(a.rows).toBe(b.rows);
    expect(Array.from(a.cells)).toEqual(Array.from(b.cells));
    expect(a.finish).toEqual(b.finish);
    expect(a.shortestPath).toBe(b.shortestPath);
  });

  it('builds a connected and reachable maze', () => {
    const maze = generateMaze({ cols: 16, rows: 14, seed: 9991 });

    expect(isMazeConnected(maze)).toBe(true);
    expect(isReachable(maze, maze.start, maze.finish)).toBe(true);
  });

  it('perfect maze has exactly cells - 1 passages', () => {
    const maze = generateMaze({ cols: 9, rows: 11, seed: 12001, extraOpenings: 0 });
    const openEdges = countOpenEdges(maze);

    expect(openEdges).toBe(maze.cols * maze.rows - 1);
  });

  it('keeps outer borders closed', () => {
    const maze = generateMaze({ cols: 10, rows: 8, seed: 77 });

    for (let x = 0; x < maze.cols; x++) {
      expect(maze.cells[x] & WALL_N).not.toBe(0);
      const bottom = (maze.rows - 1) * maze.cols + x;
      expect(maze.cells[bottom] & WALL_S).not.toBe(0);
    }

    for (let y = 0; y < maze.rows; y++) {
      const left = y * maze.cols;
      const right = y * maze.cols + (maze.cols - 1);
      expect(maze.cells[left] & WALL_W).not.toBe(0);
      expect(maze.cells[right] & WALL_E).not.toBe(0);
    }
  });
});
