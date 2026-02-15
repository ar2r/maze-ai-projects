export class RNG {
  private state: number;

  constructor(seed: number) {
    // force into uint32 space
    this.state = seed >>> 0 || 1;
  }

  next(): number {
    // Xorshift32
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return (this.state & 0xffffffff) / 0x100000000;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

export function composeSeed(level: number, runSeed: number): number {
  // Combine using LCG-style mix to reduce collisions
  const n = (runSeed ^ (level * 0x9e3779b9)) >>> 0;
  return (n + level * 2654435761) >>> 0;
}
