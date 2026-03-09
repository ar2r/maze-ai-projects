import { describe, it, expect } from 'vitest';
import { createRng, createSeed } from '../src/maze/rng';

describe('RNG - Seedable PRNG', () => {
  it('should return numbers between 0 and 1 (exclusive)', () => {
    const rng = createRng(12345);
    for (let i = 0; i < 1000; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('should be deterministic - same seed produces same sequence', () => {
    const rng1 = createRng(42);
    const rng2 = createRng(42);
    const seq1: number[] = [];
    const seq2: number[] = [];
    for (let i = 0; i < 100; i++) {
      seq1.push(rng1());
      seq2.push(rng2());
    }
    expect(seq1).toEqual(seq2);
  });

  it('should produce different sequences for different seeds', () => {
    const rng1 = createRng(1);
    const rng2 = createRng(2);
    const seq1: number[] = [];
    const seq2: number[] = [];
    for (let i = 0; i < 20; i++) {
      seq1.push(rng1());
      seq2.push(rng2());
    }
    // Sequences should differ (extremely unlikely to match)
    expect(seq1).not.toEqual(seq2);
  });

  it('should have reasonable distribution (chi-squared rough check)', () => {
    const rng = createRng(99999);
    const buckets = new Array(10).fill(0);
    const N = 10000;
    for (let i = 0; i < N; i++) {
      const idx = Math.floor(rng() * 10);
      buckets[idx]++;
    }
    const expected = N / 10;
    for (const count of buckets) {
      // Each bucket should have roughly 1000 values, allow 30% deviation
      expect(count).toBeGreaterThan(expected * 0.7);
      expect(count).toBeLessThan(expected * 1.3);
    }
  });

  it('createSeed should produce deterministic seed from level', () => {
    const seed1 = createSeed(1, 100);
    const seed2 = createSeed(1, 100);
    expect(seed1).toBe(seed2);
  });

  it('createSeed should produce different seeds for different levels', () => {
    const seed1 = createSeed(1, 100);
    const seed2 = createSeed(2, 100);
    expect(seed1).not.toBe(seed2);
  });

  it('should work with seed = 0', () => {
    const rng = createRng(0);
    const val = rng();
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThan(1);
  });

  it('should work with very large seeds', () => {
    const rng = createRng(Number.MAX_SAFE_INTEGER);
    const val = rng();
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThan(1);
  });
});
