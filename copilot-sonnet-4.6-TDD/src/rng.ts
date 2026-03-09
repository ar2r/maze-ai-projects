/**
 * Seedable PRNG — mulberry32 algorithm.
 *
 * mulberry32 is a fast, high-quality 32-bit generator by Tommy Ettinger.
 * Passes most statistical tests, has a period of 2^32, and fits in 5 lines.
 *
 * Usage:
 *   const rng = createRNG(42);
 *   const float = rng();          // [0, 1)
 *   const int   = Math.floor(rng() * max); // [0, max)
 */

import type { RNGFn } from './types';

/**
 * Creates a seeded pseudo-random number generator using the mulberry32 algorithm.
 *
 * @param seed - Any 32-bit integer (negative values are converted via >>> 0)
 * @returns A zero-argument function returning floats in [0, 1)
 */
export function createRNG(seed: number): RNGFn {
  // Ensure 32-bit unsigned integer (handles 0, negatives, and large values)
  let state = (seed >>> 0) || 1; // avoid all-zero state; 0 seed maps to 1

  return function rng(): number {
    // mulberry32 step
    state = (state + 0x6d2b79f5) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    z = ((z ^ (z >>> 14)) >>> 0);
    // Map to [0, 1) — divide by 2^32
    return z / 0x100000000;
  };
}

/**
 * Convenience: create an integer picker in range [0, max).
 *
 * @param rng - The RNG function from createRNG
 * @param max - Exclusive upper bound (must be >= 1)
 */
export function nextInt(rng: RNGFn, max: number): number {
  return Math.floor(rng() * max);
}

/**
 * Shuffle an array in-place using Fisher-Yates with the given RNG.
 */
export function shuffle<T>(arr: T[], rng: RNGFn): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = nextInt(rng, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
