import { describe, expect, it } from 'vitest';
import { getLevelConfig } from '../src/core/level-config';
import { generateMaze } from '../src/core/maze-generator';
import { getShortestPathLength, validateMaze } from '../src/core/maze-validator';

describe('maze validation', () => {
  it('always keeps start and finish reachable', () => {
    const config = getLevelConfig(9);
    const maze = generateMaze(config, 'solvable-seed');

    expect(getShortestPathLength(maze)).toBeGreaterThan(0);
    expect(validateMaze(maze).reachableFinish).toBe(true);
  });
});
