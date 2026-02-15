// ============================================================================
// Seedable Random Number Generator
// ============================================================================

/**
 * Linear Congruential Generator - simple, fast, deterministic with seed
 * Formula: X(n+1) = (a*X(n) + c) mod m
 */
export class SeededRandom {
  private state: number;
  
  // Constants for LCG (from Numerical Recipes)
  private readonly a = 1664525;
  private readonly c = 1013904223;
  private readonly m = 2 ** 32;

  constructor(seed: number) {
    this.state = seed >>> 0; // ensure 32-bit unsigned
  }

  /** Returns next random number in [0, 1) */
  next(): number {
    this.state = (this.a * this.state + this.c) % this.m;
    return this.state / this.m;
  }

  /** Returns random integer in [min, max) */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /** Shuffle array in place using Fisher-Yates */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

/** Generate seed from level number and timestamp (or fixed for testing) */
export function generateSeed(levelNumber: number, timestamp?: number): number {
  const ts = timestamp ?? Date.now();
  return ((levelNumber << 16) ^ ts) >>> 0;
}
