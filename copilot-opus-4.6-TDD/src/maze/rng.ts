import type { RngFn } from '../types';

/**
 * Mulberry32 — fast seedable 32-bit PRNG.
 * Returns a function that produces pseudo-random numbers in [0, 1).
 */
export function createRng(seed: number): RngFn {
  // Ensure seed is a 32-bit integer
  let state = seed | 0;

  return (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create a deterministic seed from level number and a base seed.
 * Same level + same base always produces the same seed.
 */
export function createSeed(level: number, baseSeed: number): number {
  // Simple hash combining level and base
  return ((level * 2654435761) ^ (baseSeed * 40503)) | 0;
}
