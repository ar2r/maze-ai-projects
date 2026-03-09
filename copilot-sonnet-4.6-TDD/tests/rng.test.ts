/**
 * TDD – RNG tests (written BEFORE the implementation).
 *
 * Tests define the contract for the seedable PRNG:
 *  - Determinism: same seed → same sequence
 *  - Independence: different seeds → different sequences
 *  - Range: all values in [0, 1)
 *  - Uniform distribution (basic chi-square check)
 *  - nextInt: returns integers in [0, max)
 */

import { describe, it, expect } from 'vitest';
import { createRNG } from '../src/rng';

describe('createRNG', () => {
  it('returns a function', () => {
    const rng = createRNG(42);
    expect(typeof rng).toBe('function');
  });

  it('produces values in [0, 1)', () => {
    const rng = createRNG(1);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('is deterministic: same seed gives same sequence', () => {
    const rng1 = createRNG(12345);
    const rng2 = createRNG(12345);
    for (let i = 0; i < 200; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('different seeds produce different sequences', () => {
    const rng1 = createRNG(1);
    const rng2 = createRNG(2);
    let same = 0;
    for (let i = 0; i < 50; i++) {
      if (rng1() === rng2()) same++;
    }
    // Allow at most 2 accidental matches in 50
    expect(same).toBeLessThan(3);
  });

  it('seed 0 works without infinite loop or NaN', () => {
    const rng = createRNG(0);
    const v = rng();
    expect(Number.isFinite(v)).toBe(true);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  });

  it('has reasonable uniform distribution (chi-square, 10 buckets)', () => {
    const rng = createRNG(9999);
    const N = 10000;
    const buckets = 10;
    const counts = new Array<number>(buckets).fill(0);
    for (let i = 0; i < N; i++) {
      const v = rng();
      counts[Math.floor(v * buckets)]++;
    }
    const expected = N / buckets;
    // Each bucket should be within 20% of expected
    for (const count of counts) {
      expect(count).toBeGreaterThan(expected * 0.8);
      expect(count).toBeLessThan(expected * 1.2);
    }
  });
});

describe('createRNG – nextInt helper', () => {
  it('nextInt returns integer in [0, max)', () => {
    const rng = createRNG(7);
    // The rng function itself returns floats; nextInt is a wrapper we build on top
    // (imported separately or as property)
    const nextInt = (max: number) => Math.floor(rng() * max);
    for (let i = 0; i < 500; i++) {
      const v = nextInt(10);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
    }
  });

  it('nextInt(1) always returns 0', () => {
    const rng = createRNG(3);
    const nextInt = (max: number) => Math.floor(rng() * max);
    for (let i = 0; i < 50; i++) {
      expect(nextInt(1)).toBe(0);
    }
  });
});
