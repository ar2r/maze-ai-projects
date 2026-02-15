// Tests for RNG

import { describe, it, expect } from 'vitest';
import { SeededRandom, createSeed } from '../src/utils/rng';

describe('Seeded Random', () => {
  it('should produce deterministic results', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);
    
    const values1 = Array.from({ length: 10 }, () => rng1.next());
    const values2 = Array.from({ length: 10 }, () => rng2.next());
    
    expect(values1).toEqual(values2);
  });

  it('should produce different results with different seeds', () => {
    const rng1 = new SeededRandom(111);
    const rng2 = new SeededRandom(222);
    
    const values1 = Array.from({ length: 10 }, () => rng1.next());
    const values2 = Array.from({ length: 10 }, () => rng2.next());
    
    expect(values1).not.toEqual(values2);
  });

  it('should produce values between 0 and 1', () => {
    const rng = new SeededRandom(99999);
    
    for (let i = 0; i < 100; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('should produce integers in specified range', () => {
    const rng = new SeededRandom(55555);
    
    for (let i = 0; i < 100; i++) {
      const value = rng.nextInt(10, 20);
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThan(20);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('should shuffle arrays deterministically', () => {
    const arr1 = [1, 2, 3, 4, 5];
    const arr2 = [1, 2, 3, 4, 5];
    
    const rng1 = new SeededRandom(777);
    const rng2 = new SeededRandom(777);
    
    rng1.shuffle(arr1);
    rng2.shuffle(arr2);
    
    expect(arr1).toEqual(arr2);
  });

  it('should return random choice from array', () => {
    const arr = ['a', 'b', 'c', 'd'];
    const rng = new SeededRandom(333);
    
    for (let i = 0; i < 10; i++) {
      const choice = rng.choice(arr);
      expect(arr).toContain(choice);
    }
  });

  it('should create different seeds for different levels', () => {
    const seed1 = createSeed(1, 1000);
    const seed2 = createSeed(2, 1000);
    
    expect(seed1).not.toBe(seed2);
  });
});
