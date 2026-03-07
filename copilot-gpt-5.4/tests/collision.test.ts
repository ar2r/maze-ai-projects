import { describe, expect, it } from 'vitest';
import { resolveCircleMovement } from '../src/game/collision';
import type { Rect } from '../src/types';

describe('collision resolution', () => {
  const verticalWall: Rect = { x: 1, y: 0, width: 0.16, height: 3 };

  it('prevents tunneling through a wall during a fast move', () => {
    const result = resolveCircleMovement(
      { x: 0.45, y: 1.2, radius: 0.18 },
      { x: 2.6, y: 0 },
      [verticalWall],
    );

    expect(result.hit).toBe(true);
    expect(result.position.x).toBeLessThanOrEqual(0.82);
  });

  it('slides along a wall instead of sticking completely', () => {
    const result = resolveCircleMovement(
      { x: 0.45, y: 0.4, radius: 0.18 },
      { x: 1.5, y: 1.2 },
      [verticalWall],
    );

    expect(result.hit).toBe(true);
    expect(result.position.x).toBeLessThanOrEqual(0.82);
    expect(result.position.y).toBeGreaterThan(0.8);
  });
});
