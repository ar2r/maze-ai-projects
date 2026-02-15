import { describe, expect, it } from 'vitest';
import { moveWithCollisions } from '../src/game/collision';
import { ALL_WALLS, WALL_E, WALL_N, WALL_S, WALL_W } from '../src/game/maze';
import type { MazeData } from '../src/game/types';

function createSolidMaze(cols: number, rows: number): MazeData {
  return {
    cols,
    rows,
    cells: new Uint8Array(cols * rows).fill(ALL_WALLS),
    start: { x: 0, y: 0 },
    finish: { x: cols - 1, y: rows - 1 },
    seed: 1,
    shortestPath: 0,
    distancesFromStart: new Int32Array(cols * rows).fill(-1)
  };
}

describe('collision solver', () => {
  it('does not allow crossing a wall', () => {
    const maze = createSolidMaze(2, 1);

    const result = moveWithCollisions(maze, 0.5, 0.5, 0.2, 1.1, 0);

    expect(result.hitWall).toBe(true);
    expect(result.x).toBeLessThanOrEqual(0.80001);
  });

  it('allows movement through an open passage', () => {
    const maze = createSolidMaze(2, 1);
    maze.cells[0] &= ~WALL_E;
    maze.cells[1] &= ~WALL_W;

    const result = moveWithCollisions(maze, 0.5, 0.5, 0.2, 0.55, 0);

    expect(result.hitWall).toBe(false);
    expect(result.x).toBeGreaterThan(1.0);
  });

  it('slides along wall when moving diagonally', () => {
    const maze = createSolidMaze(2, 2);

    // Open south passage from top-left cell so vertical sliding is possible.
    maze.cells[0] &= ~WALL_S;
    maze.cells[2] &= ~WALL_N;

    const result = moveWithCollisions(maze, 0.78, 0.5, 0.2, 0.35, 0.7);

    expect(result.hitWall).toBe(true);
    expect(result.x).toBeLessThanOrEqual(0.80001);
    expect(result.y).toBeGreaterThan(0.8);
  });
});
