// Seedable pseudo-random number generator using mulberry32 algorithm
// Produces deterministic results for the same seed

export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  // Returns a random number between 0 (inclusive) and 1 (exclusive)
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Returns a random integer between min (inclusive) and max (exclusive)
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  // Returns a random element from an array
  choice<T>(array: T[]): T {
    return array[this.nextInt(0, array.length)];
  }

  // Shuffles an array in place using Fisher-Yates algorithm
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Returns a random boolean with given probability (0-1)
  bool(probability: number = 0.5): boolean {
    return this.next() < probability;
  }
}

// Create a seed from level and timestamp for reproducibility
export function createSeed(level: number, timestamp?: number): number {
  const time = timestamp || Date.now();
  return (level * 31 + time) >>> 0;
}
