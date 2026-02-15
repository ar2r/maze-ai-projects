/**
 * Seedable pseudo-random number generator (mulberry32)
 * Fast, simple, and produces good quality random numbers
 */
export class RNG {
  private state: number;

  constructor(seed: number) {
    // Ensure seed is a 32-bit integer
    this.state = seed >>> 0;
  }

  /** Get next random number in [0, 1) */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Get random integer in [min, max] inclusive */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Shuffle array in place using Fisher-Yates */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /** Create seed from level number (deterministic per level) */
  static seedFromLevel(level: number): number {
    // Use golden ratio hash for better distribution
    return Math.floor((level * 2654435761) % 4294967296);
  }

  /** Create seed with timestamp (unique per game) */
  static seedWithTimestamp(level: number): number {
    return (RNG.seedFromLevel(level) + Date.now()) >>> 0;
  }
}
