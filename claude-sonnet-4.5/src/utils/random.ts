// === Seedable Random Number Generator ===
// Uses Mulberry32 algorithm for deterministic random generation

export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0; // Ensure unsigned 32-bit integer
  }

  // Returns a random float between 0 (inclusive) and 1 (exclusive)
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

  // Shuffles an array in place (Fisher-Yates)
  shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

// Helper: Create seed from level and timestamp
export function createSeed(level: number, timestamp?: number): number {
  const time = timestamp ?? Date.now();
  // Combine level and timestamp for unique but reproducible seeds
  return (level * 1000000 + (time % 1000000)) >>> 0;
}
