import { describe, it, expect } from 'vitest';
import { RNG } from '../src/core/random';

describe('RNG', () => {
  it('nextInt stays within bounds', () => {
    const rng = new RNG(12345);
    for (let i = 0; i < 1000; i++) {
      const n = rng.nextInt(4);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(4);
    }
  });
});
