export function hash32(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Rng {
  next: () => number;
  int: (min: number, max: number) => number;
  pick: <T>(arr: T[]) => T;
}

export function createRng(seed: number): Rng {
  const rand = mulberry32(seed);
  return {
    next: () => rand(),
    int: (min: number, max: number) => {
      const lo = Math.ceil(min);
      const hi = Math.floor(max);
      return Math.floor(rand() * (hi - lo + 1)) + lo;
    },
    pick: <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
  };
}
