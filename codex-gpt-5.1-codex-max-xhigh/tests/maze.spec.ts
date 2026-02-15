import { describe, it, expect } from 'vitest';
import { generateMaze, isConnected, shortestPathLength } from '../src/core/maze';

describe('maze generation', () => {
  it('produces connected maze', () => {
    const maze = generateMaze({ width: 10, height: 8, addLoops: 0.1, seed: 12345 });
    expect(isConnected(maze)).toBe(true);
  });

  it('is deterministic for the same seed', () => {
    const a = generateMaze({ width: 6, height: 6, addLoops: 0.05, seed: 99 });
    const b = generateMaze({ width: 6, height: 6, addLoops: 0.05, seed: 99 });
    expect(a.verticalWalls).toEqual(b.verticalWalls);
    expect(a.horizontalWalls).toEqual(b.horizontalWalls);
  });

  it('longer mazes produce longer shortest paths on average', () => {
    const small = generateMaze({ width: 6, height: 6, addLoops: 0, seed: 1 });
    const big = generateMaze({ width: 12, height: 12, addLoops: 0, seed: 1 });
    expect(shortestPathLength(big)).toBeGreaterThan(shortestPathLength(small));
  });
});
