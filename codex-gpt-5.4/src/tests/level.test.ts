import { describe, expect, it } from 'vitest';
import { buildLevel } from '../game/level';
import { getLevelConfig } from '../game/config';

describe('level progression', () => {
  it('increases maze dimensions with level number', () => {
    const level1 = getLevelConfig(1, 'progression');
    const level8 = getLevelConfig(8, 'progression');

    expect(level8.gridWidth).toBeGreaterThan(level1.gridWidth);
    expect(level8.gridHeight).toBeGreaterThan(level1.gridHeight);
    expect(level8.wallThicknessRatio).toBeLessThan(level1.wallThicknessRatio);
  });

  it('keeps generated levels deterministic for the same session seed', () => {
    const first = buildLevel(5, 'session-fixed');
    const second = buildLevel(5, 'session-fixed');

    expect(first.config.seed).toBe(second.config.seed);
    expect(first.maze.cells.map((cell) => cell.passages)).toEqual(second.maze.cells.map((cell) => cell.passages));
    expect(first.maze.optimalPathLength).toBe(second.maze.optimalPathLength);
  });

  it('scales path complexity for later levels', () => {
    const early = buildLevel(1, 'session-a');
    const late = buildLevel(9, 'session-a');

    expect(late.maze.width).toBeGreaterThan(early.maze.width);
    expect(late.maze.optimalPathLength).toBeGreaterThan(late.maze.width + late.maze.height);
  });
});
