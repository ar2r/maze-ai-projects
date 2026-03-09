import { describe, it, expect } from 'vitest';
import { getLevelConfig } from '../src/maze/difficulty';

describe('Difficulty - Level Configuration', () => {
  it('should return valid config for level 1', () => {
    const cfg = getLevelConfig(1);
    expect(cfg.level).toBe(1);
    expect(cfg.cols).toBeGreaterThanOrEqual(5);
    expect(cfg.rows).toBeGreaterThanOrEqual(5);
    expect(cfg.cellSize).toBeGreaterThan(0);
    expect(cfg.playerRadius).toBeGreaterThan(0);
    expect(cfg.playerSpeed).toBeGreaterThan(0);
    expect(cfg.extraOpenings).toBeGreaterThanOrEqual(0);
  });

  it('maze size should increase with level', () => {
    const cfg1 = getLevelConfig(1);
    const cfg10 = getLevelConfig(10);
    const cfg20 = getLevelConfig(20);
    expect(cfg10.cols).toBeGreaterThan(cfg1.cols);
    expect(cfg20.cols).toBeGreaterThan(cfg10.cols);
    expect(cfg10.rows).toBeGreaterThan(cfg1.rows);
    expect(cfg20.rows).toBeGreaterThan(cfg10.rows);
  });

  it('cell size should decrease with level (corridors get tighter)', () => {
    const cfg1 = getLevelConfig(1);
    const cfg15 = getLevelConfig(15);
    expect(cfg15.cellSize).toBeLessThanOrEqual(cfg1.cellSize);
  });

  it('extra openings should increase from level 5+', () => {
    const cfg3 = getLevelConfig(3);
    const cfg10 = getLevelConfig(10);
    expect(cfg3.extraOpenings).toBe(0);
    expect(cfg10.extraOpenings).toBeGreaterThan(0);
  });

  it('should have reasonable maximums (not grow infinitely)', () => {
    const cfg50 = getLevelConfig(50);
    expect(cfg50.cols).toBeLessThanOrEqual(40);
    expect(cfg50.rows).toBeLessThanOrEqual(40);
    expect(cfg50.cellSize).toBeGreaterThanOrEqual(16); // minimum for touch
  });

  it('player radius should be smaller than half cell size', () => {
    for (let lvl = 1; lvl <= 30; lvl++) {
      const cfg = getLevelConfig(lvl);
      expect(cfg.playerRadius).toBeLessThan(cfg.cellSize / 2);
    }
  });

  it('player speed should increase slightly with level', () => {
    const cfg1 = getLevelConfig(1);
    const cfg20 = getLevelConfig(20);
    expect(cfg20.playerSpeed).toBeGreaterThanOrEqual(cfg1.playerSpeed);
  });

  it('should return consistent results for same level', () => {
    const a = getLevelConfig(5);
    const b = getLevelConfig(5);
    expect(a).toEqual(b);
  });
});
