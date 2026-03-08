// Seeded Random Number Generator using Mulberry32

export type RNG = () => number;

export function mulberry32(seed: number): RNG {
  let state = seed >>> 0;
  return function(): number {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSeededRNG(seed?: number): { rng: RNG; seed: number } {
  const actualSeed = seed ?? Math.floor(Math.random() * 1000000);
  return { rng: mulberry32(actualSeed), seed: actualSeed };
}

export function shuffleArray<T>(array: T[], rng: RNG): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function randomInt(min: number, max: number, rng: RNG): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function randomChoice<T>(array: T[], rng: RNG): T {
  return array[Math.floor(rng() * array.length)];
}
