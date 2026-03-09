import { describe, it, expect } from 'vitest';
import {
  extractWallSegments,
  circleCollidesSegment,
  resolveCollisions,
} from '../src/engine/collision';
import { generateMaze } from '../src/maze/generator';
import { createRng } from '../src/maze/rng';
import type { WallSegment, Vec2 } from '../src/types';

describe('Collision System', () => {
  describe('extractWallSegments', () => {
    it('should extract wall segments from a maze', () => {
      const rng = createRng(42);
      const maze = generateMaze(3, 3, rng);
      const segments = extractWallSegments(maze, 40);
      expect(segments.length).toBeGreaterThan(0);
    });

    it('should include outer boundary walls', () => {
      const rng = createRng(42);
      const maze = generateMaze(3, 3, rng);
      const cellSize = 40;
      const segments = extractWallSegments(maze, cellSize);

      // Should have top boundary: y=0 line segments
      const topBoundary = segments.filter(
        (s) => s.y1 === 0 && s.y2 === 0,
      );
      expect(topBoundary.length).toBeGreaterThan(0);

      // Should have left boundary: x=0 line segments
      const leftBoundary = segments.filter(
        (s) => s.x1 === 0 && s.x2 === 0,
      );
      expect(leftBoundary.length).toBeGreaterThan(0);
    });

    it('wall segments should be axis-aligned (horizontal or vertical)', () => {
      const rng = createRng(42);
      const maze = generateMaze(5, 5, rng);
      const segments = extractWallSegments(maze, 30);

      for (const seg of segments) {
        const isHorizontal = seg.y1 === seg.y2;
        const isVertical = seg.x1 === seg.x2;
        expect(isHorizontal || isVertical).toBe(true);
      }
    });
  });

  describe('circleCollidesSegment', () => {
    it('should detect collision when circle overlaps a horizontal segment', () => {
      // Horizontal wall at y=0, from x=0 to x=100
      const seg: WallSegment = { x1: 0, y1: 0, x2: 100, y2: 0 };
      // Circle at (50, 5) with radius 10 -> overlaps (distance 5 < 10)
      const result = circleCollidesSegment(50, 5, 10, seg);
      expect(result).not.toBeNull();
      expect(result!.penetration).toBeGreaterThan(0);
    });

    it('should NOT detect collision when circle is far from segment', () => {
      const seg: WallSegment = { x1: 0, y1: 0, x2: 100, y2: 0 };
      // Circle at (50, 50) with radius 10 -> distance 50, no collision
      const result = circleCollidesSegment(50, 50, 10, seg);
      expect(result).toBeNull();
    });

    it('should detect collision with vertical segment', () => {
      const seg: WallSegment = { x1: 0, y1: 0, x2: 0, y2: 100 };
      // Circle at (5, 50) with radius 10 -> overlaps
      const result = circleCollidesSegment(5, 50, 10, seg);
      expect(result).not.toBeNull();
    });

    it('should handle circle near segment endpoint', () => {
      const seg: WallSegment = { x1: 0, y1: 0, x2: 50, y2: 0 };
      // Circle near the endpoint (50, 0) at (55, 3) with radius 10
      const result = circleCollidesSegment(55, 3, 10, seg);
      expect(result).not.toBeNull();
    });

    it('should NOT collide when circle is past segment endpoint', () => {
      const seg: WallSegment = { x1: 0, y1: 0, x2: 50, y2: 0 };
      // Circle far past endpoint
      const result = circleCollidesSegment(100, 50, 10, seg);
      expect(result).toBeNull();
    });

    it('should return correct push-out normal', () => {
      const seg: WallSegment = { x1: 0, y1: 0, x2: 100, y2: 0 };
      // Circle below the wall
      const result = circleCollidesSegment(50, 5, 10, seg);
      expect(result).not.toBeNull();
      // Normal should push downward (away from wall, positive y)
      expect(result!.normalY).toBeGreaterThan(0);
    });
  });

  describe('resolveCollisions', () => {
    it('should prevent player from overlapping a wall', () => {
      // Single horizontal wall at y=40, from x=0 to x=120
      const walls: WallSegment[] = [{ x1: 0, y1: 40, x2: 120, y2: 40 }];
      const radius = 8;

      // Player center at y=35, radius=8 -> bottom edge at y=43, overlaps wall at y=40
      // Should be pushed up so center y <= 40 - radius = 32
      const resolved = resolveCollisions(60, 35, radius, walls);
      expect(resolved.y).toBeLessThanOrEqual(40 - radius + 0.5);
      expect(resolved.hit).toBe(true);
    });

    it('should block movement through a wall (pre+post check)', () => {
      // Horizontal wall at y=40
      const walls: WallSegment[] = [{ x1: 0, y1: 40, x2: 120, y2: 40 }];
      const radius = 8;

      // Player above wall, very close: center at y=33 (edge at y=41, overlapping)
      const resolved = resolveCollisions(60, 33, radius, walls);
      // Should push player up: y <= 40-radius
      expect(resolved.y).toBeLessThanOrEqual(40 - radius + 0.5);
    });

    it('should allow movement along a wall (sliding)', () => {
      // Vertical wall at x=40, from y=0 to y=120
      const walls: WallSegment[] = [{ x1: 40, y1: 0, x2: 40, y2: 120 }];
      const radius = 8;

      // Player to the right of wall, moving down
      const resolved = resolveCollisions(50, 60, radius, walls);
      // X should be >= 40+radius (not through wall)
      expect(resolved.x).toBeGreaterThanOrEqual(40 + radius - 0.1);
      // Y should remain as intended (sliding allowed)
      expect(resolved.y).toBeCloseTo(60, 0);
    });

    it('should handle corner correctly (not get stuck)', () => {
      // Corner: horizontal wall at y=40 and vertical wall at x=40
      const walls: WallSegment[] = [
        { x1: 0, y1: 40, x2: 120, y2: 40 },
        { x1: 40, y1: 0, x2: 40, y2: 120 },
      ];
      const radius = 8;

      // Player near corner, should be pushed out
      const resolved = resolveCollisions(45, 45, radius, walls);
      expect(resolved.x).toBeGreaterThanOrEqual(40 + radius - 0.5);
      expect(resolved.y).toBeGreaterThanOrEqual(40 + radius - 0.5);
    });

    it('should return hit=true when collision occurs', () => {
      const walls: WallSegment[] = [{ x1: 0, y1: 40, x2: 120, y2: 40 }];
      const resolved = resolveCollisions(60, 42, 8, walls);
      expect(resolved.hit).toBe(true);
    });

    it('should return hit=false when no collision', () => {
      const walls: WallSegment[] = [{ x1: 0, y1: 40, x2: 120, y2: 40 }];
      const resolved = resolveCollisions(60, 80, 8, walls);
      expect(resolved.hit).toBe(false);
    });

    it('should handle multiple walls in sequence', () => {
      // Corridor: two parallel walls
      const walls: WallSegment[] = [
        { x1: 0, y1: 0, x2: 200, y2: 0 },   // top wall
        { x1: 0, y1: 40, x2: 200, y2: 40 },  // bottom wall
      ];
      const radius = 8;

      // Player inside corridor
      const resolved = resolveCollisions(100, 20, radius, walls);
      expect(resolved.y).toBeGreaterThanOrEqual(radius - 0.1);
      expect(resolved.y).toBeLessThanOrEqual(40 - radius + 0.1);
    });
  });
});
