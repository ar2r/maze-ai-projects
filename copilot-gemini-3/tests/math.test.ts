import { describe, it, expect } from 'vitest';
import { circleRectIntersect, Rect, SeededRandom } from '../src/utils/math';

describe('Math Utils', () => {
  it('should detect circle-rect intersection', () => {
    const rect: Rect = { x: 10, y: 10, w: 20, h: 20 }; // 10,10 to 30,30
    
    // Center inside
    expect(circleRectIntersect(20, 20, 5, rect)).toBe(true);
    
    // Touching edge
    expect(circleRectIntersect(5, 20, 5.1, rect)).toBe(true); // 5 is x, rect.x is 10. dist is 5. 5.1 > 5. Intersect.
    
    // Far away
    expect(circleRectIntersect(0, 0, 5, rect)).toBe(false);
  });

  it('SeededRandom should be deterministic', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);
    
    expect(rng1.next()).toBe(rng2.next());
    expect(rng1.next()).toBe(rng2.next());
  });
});
