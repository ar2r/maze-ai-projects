import { describe, it, expect } from 'vitest';
import { resolveMovement } from '../src/core/collision';
import type { Maze } from '../src/core/maze';

const baseMaze: Maze = {
  width: 2,
  height: 1,
  verticalWalls: [true, true, true],
  horizontalWalls: [true, true, true, true],
  seed: 1
};

describe('collision resolution', () => {
  it('prevents passing through vertical wall', () => {
    const maze: Maze = { ...baseMaze, verticalWalls: [true, true, true] };
    const res = resolveMovement(0.5, 0.5, 0.9, 0, maze, 0.2, 0.2);
    expect(res.x).toBeLessThan(1 - 0.2);
    expect(res.collided).toBe(true);
  });

  it('allows passage when wall removed', () => {
    const maze: Maze = { ...baseMaze, verticalWalls: [true, false, true] };
    const res = resolveMovement(0.5, 0.5, 0.8, 0, maze, 0.2, 0.2);
    expect(res.x).toBeGreaterThan(1.0);
    expect(res.collided).toBe(false);
  });
});
