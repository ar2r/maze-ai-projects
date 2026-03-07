// Seedable RNG using Xorshift128+

export class SeededRNG {
  private s0: number;
  private s1: number;

  constructor(seed: number) {
    // Initialize state using splitmix64-like seeding
    let s = seed >>> 0;
    s = Math.imul(s, 0x9e3779b9);
    this.s0 = (s ^ (s >>> 30)) >>> 0;
    s = Math.imul(s, 0x9e3779b9);
    this.s1 = (s ^ (s >>> 30)) >>> 0;

    // Warm up
    for (let i = 0; i < 20; i++) {
      this.next();
    }
  }

  next(): number {
    let s0 = this.s0;
    let s1 = this.s1;

    const result = (s0 + s1) >>> 0;

    s1 ^= s0;
    this.s0 = ((s0 << 23) | (s0 >>> 9)) ^ s1 ^ (s1 << 14);
    this.s1 = (s1 << 18) | (s1 >>> 14);

    this.s0 = s0;
    this.s1 = s1;

    // Normalize to 0-1 range (divide by 2^32)
    return (result >>> 11) / 0x200000;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
}