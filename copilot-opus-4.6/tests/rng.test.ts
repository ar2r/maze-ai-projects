import { describe, it, expect } from 'vitest';
import { mulberry32, levelSeed } from '../src/utils/rng';

describe('Seedable RNG', () => {
  it('is deterministic for the same seed', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('produces values in [0, 1)', () => {
    const rng = mulberry32(12345);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('different seeds produce different sequences', () => {
    const rng1 = mulberry32(1);
    const rng2 = mulberry32(2);
    let same = 0;
    for (let i = 0; i < 50; i++) {
      if (rng1() === rng2()) same++;
    }
    expect(same).toBeLessThan(5); // extremely unlikely to have many matches
  });

  it('levelSeed produces different seeds for different levels', () => {
    const seeds = new Set<number>();
    for (let i = 1; i <= 100; i++) {
      seeds.add(levelSeed(i));
    }
    expect(seeds.size).toBe(100);
  });
});
