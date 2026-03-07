import { describe, expect, it } from 'vitest';
import { getLevelConfig } from '../src/core/level-config';
import { buildMazeSignature, generateMaze } from '../src/core/maze-generator';
import { getReachableCellCount, hasIntactOuterWalls, validateMaze } from '../src/core/maze-validator';

describe('maze generation', () => {
  it('is deterministic for the same seed and level', () => {
    const config = getLevelConfig(4);
    const first = generateMaze(config, 'seed-alpha');
    const second = generateMaze(config, 'seed-alpha');

    expect(buildMazeSignature(first)).toBe(buildMazeSignature(second));
  });

  it('changes layout when seed changes', () => {
    const config = getLevelConfig(4);
    const first = generateMaze(config, 'seed-alpha');
    const second = generateMaze(config, 'seed-beta');

    expect(buildMazeSignature(first)).not.toBe(buildMazeSignature(second));
  });

  it('produces a connected maze with intact boundaries', () => {
    const config = getLevelConfig(7);
    const maze = generateMaze(config, 'boundary-seed');
    const validation = validateMaze(maze);

    expect(validation.valid).toBe(true);
    expect(getReachableCellCount(maze)).toBe(maze.cells.length);
    expect(hasIntactOuterWalls(maze)).toBe(true);
    expect(maze.solutionLength).toBeGreaterThanOrEqual(config.minSolutionLength);
  });
});
