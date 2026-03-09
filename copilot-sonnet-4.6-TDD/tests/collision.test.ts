/**
 * TDD – Collision tests (written BEFORE implementation).
 *
 * Contract for the collision engine:
 *  1. closestPointOnSegment: correct geometry
 *  2. circleVsSegment: detects overlap correctly
 *  3. resolveCircleVsSegment: pushes circle outside wall
 *  4. resolveAndSlide: velocity is projected along wall tangent (sliding)
 *  5. resolvePosition: player cannot end up inside a wall
 *  6. getWallSegments: extracts correct segments from maze cells
 *  7. Integration: player constrained to open corridors
 */

import { describe, it, expect } from 'vitest';
import {
  closestPointOnSegment,
  circleVsSegment,
  resolveCircleVsSegment,
  getWallSegments,
} from '../src/engine/collision';
import { generateMaze } from '../src/maze/generator';
import type { WallSegment } from '../src/types';

// ─── closestPointOnSegment ─────────────────────────────────────────────────────
describe('closestPointOnSegment', () => {
  it('returns the segment start when projection < 0', () => {
    const p = closestPointOnSegment(0, 0, 5, 5, 10, 5);
    expect(p.x).toBeCloseTo(5);
    expect(p.y).toBeCloseTo(5);
  });

  it('returns the segment end when projection > 1', () => {
    const p = closestPointOnSegment(20, 5, 5, 5, 10, 5);
    expect(p.x).toBeCloseTo(10);
    expect(p.y).toBeCloseTo(5);
  });

  it('returns projected point on horizontal segment', () => {
    const p = closestPointOnSegment(7, 10, 0, 5, 20, 5);
    expect(p.x).toBeCloseTo(7);
    expect(p.y).toBeCloseTo(5);
  });

  it('returns projected point on vertical segment', () => {
    const p = closestPointOnSegment(10, 7, 5, 0, 5, 20);
    expect(p.x).toBeCloseTo(5);
    expect(p.y).toBeCloseTo(7);
  });

  it('handles zero-length segment (degenerate) returning the point', () => {
    const p = closestPointOnSegment(3, 4, 5, 5, 5, 5);
    expect(p.x).toBeCloseTo(5);
    expect(p.y).toBeCloseTo(5);
  });
});

// ─── circleVsSegment ──────────────────────────────────────────────────────────
describe('circleVsSegment', () => {
  const wallH: WallSegment = { x1: 0, y1: 10, x2: 100, y2: 10 };  // horizontal
  const wallV: WallSegment = { x1: 10, y1: 0, x2: 10, y2: 100 };  // vertical

  it('detects no collision when circle is far away', () => {
    expect(circleVsSegment(50, 50, 5, wallH)).toBe(false);
  });

  it('detects collision when circle overlaps horizontal wall', () => {
    // Circle center 3px below wall, radius 5 → overlaps by 2px
    expect(circleVsSegment(50, 13, 5, wallH)).toBe(true);
  });

  it('detects collision when circle center is ON the wall', () => {
    expect(circleVsSegment(50, 10, 5, wallH)).toBe(true);
  });

  it('detects no collision when circle is just outside radius', () => {
    // Circle center 6px below wall, radius 5 → no overlap
    expect(circleVsSegment(50, 16, 5, wallH)).toBe(false);
  });

  it('detects collision with vertical wall', () => {
    expect(circleVsSegment(8, 50, 5, wallV)).toBe(true);
  });

  it('detects no collision with vertical wall when far', () => {
    expect(circleVsSegment(20, 50, 5, wallV)).toBe(false);
  });

  it('detects collision at segment endpoints', () => {
    // Circle near the start endpoint
    expect(circleVsSegment(1, 12, 5, wallH)).toBe(true);
  });
});

// ─── resolveCircleVsSegment ───────────────────────────────────────────────────
describe('resolveCircleVsSegment', () => {
  it('returns null when no collision', () => {
    const wall: WallSegment = { x1: 0, y1: 10, x2: 100, y2: 10 };
    const result = resolveCircleVsSegment(50, 50, 5, wall);
    expect(result).toBeNull();
  });

  it('pushes circle above horizontal wall', () => {
    const wall: WallSegment = { x1: 0, y1: 10, x2: 100, y2: 10 };
    // Circle overlapping: center at y=13, radius=5 → overlap 2px
    const result = resolveCircleVsSegment(50, 13, 5, wall);
    expect(result).not.toBeNull();
    // Resolved y must be >= wall.y1 + radius (circle fully above wall)
    expect(result!.y).toBeGreaterThanOrEqual(10 + 5 - 0.01);
  });

  it('pushes circle right of vertical wall', () => {
    const wall: WallSegment = { x1: 10, y1: 0, x2: 10, y2: 100 };
    const result = resolveCircleVsSegment(8, 50, 5, wall);
    expect(result).not.toBeNull();
    // The resolved position should not be inside the wall
    const dist = Math.abs(result!.x - 10);
    expect(dist).toBeGreaterThanOrEqual(5 - 0.01);
  });

  it('preserves x when pushing along y-axis', () => {
    const wall: WallSegment = { x1: 0, y1: 10, x2: 100, y2: 10 };
    const result = resolveCircleVsSegment(50, 13, 5, wall);
    expect(result!.x).toBeCloseTo(50);
  });

  it('resolved position is always outside circle radius from wall', () => {
    const wall: WallSegment = { x1: 0, y1: 20, x2: 100, y2: 20 };
    const radius = 6;
    // Circle deeply inside the wall
    const result = resolveCircleVsSegment(50, 20, radius, wall);
    expect(result).not.toBeNull();
    // After resolution, circle should not overlap
    const dx = result!.x - 50;
    const dy = result!.y - 20;
    const dist = Math.sqrt(dx * dx + dy * dy);
    expect(dist).toBeGreaterThanOrEqual(radius - 0.01);
  });
});

// ─── getWallSegments ──────────────────────────────────────────────────────────
describe('getWallSegments', () => {
  it('returns wall segments for a single cell', () => {
    const maze = generateMaze(3, 3, 0, 40, 2);
    const segs = getWallSegments(maze);
    // Must return an array
    expect(Array.isArray(segs)).toBe(true);
    expect(segs.length).toBeGreaterThan(0);
  });

  it('every segment has numeric coordinates', () => {
    const maze = generateMaze(5, 5, 42, 36, 2);
    const segs = getWallSegments(maze);
    for (const s of segs) {
      expect(typeof s.x1).toBe('number');
      expect(typeof s.y1).toBe('number');
      expect(typeof s.x2).toBe('number');
      expect(typeof s.y2).toBe('number');
    }
  });

  it('segments lie within maze world bounds (0 to w*cellSize, 0 to h*cellSize)', () => {
    const maze = generateMaze(5, 5, 10, 40, 2);
    const maxX = maze.width * maze.cellSize;
    const maxY = maze.height * maze.cellSize;
    const segs = getWallSegments(maze);
    for (const s of segs) {
      expect(s.x1).toBeGreaterThanOrEqual(0);
      expect(s.y1).toBeGreaterThanOrEqual(0);
      expect(s.x2).toBeGreaterThanOrEqual(0);
      expect(s.y2).toBeGreaterThanOrEqual(0);
      expect(s.x1).toBeLessThanOrEqual(maxX);
      expect(s.y1).toBeLessThanOrEqual(maxY);
      expect(s.x2).toBeLessThanOrEqual(maxX);
      expect(s.y2).toBeLessThanOrEqual(maxY);
    }
  });

  it('outer boundary segments are present (outer walls of maze)', () => {
    const maze = generateMaze(3, 3, 0, 40, 2);
    const segs = getWallSegments(maze);
    // At least one segment on x=0 (left outer wall)
    const leftWall = segs.some(s => s.x1 === 0 && s.x2 === 0);
    expect(leftWall).toBe(true);
  });
});
