import { describe, expect, it } from 'vitest';
import { createRng } from '../src/game/rng';
import { generateMaze, validateMazeBoundaries, validateMazeConnectivity } from '../src/game/maze';

describe('maze generation', () => {
  it('creates a connected maze', () => {
    const rng = createRng(12345);
    const maze = generateMaze(12, 10, rng, 12345, 0);
    expect(validateMazeConnectivity(maze)).toBe(true);
  });

  it('keeps boundary walls intact', () => {
    const rng = createRng(54321);
    const maze = generateMaze(8, 8, rng, 54321, 0.1);
    expect(validateMazeBoundaries(maze)).toBe(true);
  });
});
