export function hashSeed(input: string | number): number {
  const value = String(input);
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) || 1;
}

export class SeededRng {
  private state: number;

  constructor(seedInput: string | number) {
    this.state = hashSeed(seedInput);
  }

  next(): number {
    this.state += 0x6d2b79f5;
    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }

  pick<T>(items: readonly T[]): T {
    return items[this.int(items.length)] as T;
  }
}

export function deriveLevelSeed(baseSeed: string, level: number, attempt = 0): string {
  return `${baseSeed}:level:${level}:attempt:${attempt}`;
}

export function createSessionSeedBase(now = Date.now()): string {
  return `${now.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
