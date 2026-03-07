import { describe, expect, it } from 'vitest';
import { getLevelConfig } from '../src/core/level-config';

describe('level config progression', () => {
  it('monotonically increases maze scale and target path length', () => {
    const level1 = getLevelConfig(1);
    const level5 = getLevelConfig(5);
    const level10 = getLevelConfig(10);

    expect(level5.cols).toBeGreaterThan(level1.cols);
    expect(level10.rows).toBeGreaterThan(level5.rows);
    expect(level10.minSolutionLength).toBeGreaterThan(level5.minSolutionLength);
    expect(level10.wallThickness).toBeLessThan(level1.wallThickness);
  });
});
