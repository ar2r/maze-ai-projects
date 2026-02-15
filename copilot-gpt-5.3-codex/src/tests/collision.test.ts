import { describe, expect, it } from 'vitest';
import { moveWithCollision } from '../engine/collision';
import { WALL_E, WALL_N, WALL_S, WALL_W, type Maze } from '../core/types';

const ALL = WALL_N | WALL_E | WALL_S | WALL_W;

describe('collision movement', () => {
  it('blocks leaving maze bounds', () => {
    const maze: Maze = { width: 1, height: 1, seed: 'x', cells: new Uint8Array([ALL]) };
    const moved = moveWithCollision(maze, 10, 10, -30, -30, 5, 20);
    expect(moved.x).toBeGreaterThanOrEqual(5);
    expect(moved.y).toBeGreaterThanOrEqual(5);
    expect(moved.collided).toBe(true);
  });

  it('does not pass through internal east wall', () => {
    const left = WALL_N | WALL_S | WALL_W | WALL_E;
    const right = WALL_N | WALL_S | WALL_E | WALL_W;
    const maze: Maze = { width: 2, height: 1, seed: 'y', cells: new Uint8Array([left, right]) };
    const moved = moveWithCollision(maze, 10, 10, 30, 0, 4, 20);
    expect(moved.x).toBeLessThanOrEqual(16);
    expect(moved.collided).toBe(true);
  });
});
