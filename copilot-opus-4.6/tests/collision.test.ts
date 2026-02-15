import { describe, it, expect } from 'vitest';
import { resolveCircleRect, moveWithCollision } from '../src/game/collision';

describe('Collision Detection', () => {
  it('no collision when circle is far from rect', () => {
    const result = resolveCircleRect(
      { x: 100, y: 100 }, 5,
      { x: 0, y: 0, w: 10, h: 10 }
    );
    expect(result.hit).toBe(false);
    expect(result.resolved).toEqual({ x: 100, y: 100 });
  });

  it('detects collision and resolves position', () => {
    // Circle at x=12 with radius 5, rect from 10-20 on x
    const result = resolveCircleRect(
      { x: 8, y: 5 }, 5,
      { x: 10, y: 0, w: 10, h: 10 }
    );
    expect(result.hit).toBe(true);
    // Should be pushed left so that distance from rect edge = radius
    expect(result.resolved.x).toBeLessThan(8);
  });

  it('slides along wall when moving diagonally', () => {
    // Wall is a horizontal bar at y=0, player close enough to collide after small step
    const wall = { x: -100, y: -1, w: 200, h: 2 };
    const pos = { x: 50, y: 5 };
    const delta = { x: 5, y: -3 }; // small diagonal into wall

    const result = moveWithCollision(pos, delta, 5, [wall]);
    // Player should have moved right but be pushed away from wall
    expect(result.pos.x).toBeGreaterThan(pos.x);
    expect(result.hits).toBeGreaterThan(0);
  });

  it('resolves collision with thick wall', () => {
    // Thick wall that the player can't skip over in one step
    const wall = { x: 48, y: 0, w: 20, h: 100 };
    const pos = { x: 45, y: 50 };
    const delta = { x: 5, y: 0 };

    const result = moveWithCollision(pos, delta, 5, [wall]);
    // Should be pushed back before the wall
    expect(result.pos.x).toBeLessThanOrEqual(48);
    expect(result.hits).toBeGreaterThan(0);
  });

  it('handles zero delta', () => {
    const wall = { x: 0, y: 0, w: 10, h: 10 };
    const pos = { x: 50, y: 50 };
    const result = moveWithCollision(pos, { x: 0, y: 0 }, 5, [wall]);
    expect(result.pos).toEqual(pos);
    expect(result.hits).toBe(0);
  });
});
