import { describe, expect, it } from 'vitest';
import { moveWithCollisions } from '../src/game/collision';
import type { Maze } from '../src/game/types';

function singleCellMaze(): Maze {
  return {
    cols: 1,
    rows: 1,
    seed: 1,
    loopChance: 0,
    start: { x: 0, y: 0 },
    finish: { x: 0, y: 0 },
    cells: [[{ walls: [true, true, true, true], visited: true }]]
  };
}

function twoCellOpenMaze(): Maze {
  return {
    cols: 2,
    rows: 1,
    seed: 2,
    loopChance: 0,
    start: { x: 0, y: 0 },
    finish: { x: 1, y: 0 },
    cells: [
      [
        { walls: [true, false, true, true], visited: true },
        { walls: [true, true, true, false], visited: true }
      ]
    ]
  };
}

describe('collision', () => {
  it('prevents crossing outer wall', () => {
    const maze = singleCellMaze();
    const result = moveWithCollisions(maze, { x: 0.5, y: 0.5 }, { x: -1, y: 0 }, 0.2, 0.2);
    expect(result.pos.x).toBeGreaterThan(0.29);
  });

  it('allows movement through open corridor', () => {
    const maze = twoCellOpenMaze();
    const result = moveWithCollisions(maze, { x: 0.5, y: 0.5 }, { x: 1.0, y: 0 }, 0.2, 0.2);
    expect(result.pos.x).toBeCloseTo(1.5, 4);
  });
});
