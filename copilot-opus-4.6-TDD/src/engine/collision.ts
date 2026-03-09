import type { Maze, WallSegment } from '../types';

/**
 * Extract wall segments (line segments) from a maze for collision detection.
 * Each wall is represented as a horizontal or vertical line segment in pixel space.
 */
export function extractWallSegments(maze: Maze, cellSize: number): WallSegment[] {
  const segments: WallSegment[] = [];
  const { cols, rows, cells } = maze;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellSize;
      const y = r * cellSize;
      const cell = cells[r][c];

      // Top wall (only for first row, or if present and not shared with above)
      if (cell.walls.top && r === 0) {
        segments.push({ x1: x, y1: y, x2: x + cellSize, y2: y });
      }

      // Left wall (only for first column, or if present and not shared with left)
      if (cell.walls.left && c === 0) {
        segments.push({ x1: x, y1: y, x2: x, y2: y + cellSize });
      }

      // Right wall
      if (cell.walls.right) {
        segments.push({
          x1: x + cellSize,
          y1: y,
          x2: x + cellSize,
          y2: y + cellSize,
        });
      }

      // Bottom wall
      if (cell.walls.bottom) {
        segments.push({
          x1: x,
          y1: y + cellSize,
          x2: x + cellSize,
          y2: y + cellSize,
        });
      }
    }
  }

  return segments;
}

/** Result of a circle-segment collision test */
export interface CollisionResult {
  normalX: number;
  normalY: number;
  penetration: number;
}

/**
 * Test collision between a circle and a line segment.
 * Returns collision info or null if no collision.
 *
 * Uses closest-point-on-segment approach.
 */
export function circleCollidesSegment(
  cx: number,
  cy: number,
  radius: number,
  seg: WallSegment,
): CollisionResult | null {
  // Vector from seg start to seg end
  const dx = seg.x2 - seg.x1;
  const dy = seg.y2 - seg.y1;
  const segLenSq = dx * dx + dy * dy;

  // Project circle center onto segment line
  let t: number;
  if (segLenSq === 0) {
    // Degenerate segment (point)
    t = 0;
  } else {
    t = ((cx - seg.x1) * dx + (cy - seg.y1) * dy) / segLenSq;
    t = Math.max(0, Math.min(1, t));
  }

  // Closest point on segment
  const closestX = seg.x1 + t * dx;
  const closestY = seg.y1 + t * dy;

  // Distance from circle center to closest point
  const distX = cx - closestX;
  const distY = cy - closestY;
  const distSq = distX * distX + distY * distY;
  const radiusSq = radius * radius;

  if (distSq >= radiusSq) {
    return null; // No collision
  }

  const dist = Math.sqrt(distSq);
  const penetration = radius - dist;

  // Normal: direction to push circle away from wall
  let normalX: number, normalY: number;
  if (dist < 0.0001) {
    // Circle center is ON the segment - push perpendicular to segment
    if (Math.abs(dx) > Math.abs(dy)) {
      // Mostly horizontal segment, push vertically
      normalX = 0;
      normalY = 1;
    } else {
      // Mostly vertical segment, push horizontally
      normalX = 1;
      normalY = 0;
    }
  } else {
    normalX = distX / dist;
    normalY = distY / dist;
  }

  return { normalX, normalY, penetration };
}

/** Result of collision resolution */
export interface ResolvedPosition {
  x: number;
  y: number;
  hit: boolean;
}

/**
 * Resolve collisions for a circle at (x, y) against all wall segments.
 * Pushes the circle out of any overlapping walls.
 * Supports sliding along walls and handles corners.
 *
 * @param x - Desired X position
 * @param y - Desired Y position
 * @param radius - Circle radius
 * @param walls - Array of wall segments to check
 * @returns Resolved position and whether any collision occurred
 */
export function resolveCollisions(
  x: number,
  y: number,
  radius: number,
  walls: WallSegment[],
): ResolvedPosition {
  let posX = x;
  let posY = y;
  let hit = false;

  // Multiple iterations to handle corners where multiple walls meet
  const MAX_ITERATIONS = 4;

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    let totalPushX = 0;
    let totalPushY = 0;
    let collisionCount = 0;

    for (const seg of walls) {
      // Quick AABB pre-check: skip segments far from player
      const segMinX = Math.min(seg.x1, seg.x2) - radius;
      const segMaxX = Math.max(seg.x1, seg.x2) + radius;
      const segMinY = Math.min(seg.y1, seg.y2) - radius;
      const segMaxY = Math.max(seg.y1, seg.y2) + radius;

      if (posX < segMinX || posX > segMaxX || posY < segMinY || posY > segMaxY) {
        continue;
      }

      const collision = circleCollidesSegment(posX, posY, radius, seg);
      if (collision) {
        totalPushX += collision.normalX * collision.penetration;
        totalPushY += collision.normalY * collision.penetration;
        collisionCount++;
        hit = true;
      }
    }

    if (collisionCount === 0) break;

    // Apply accumulated push
    posX += totalPushX;
    posY += totalPushY;
  }

  return { x: posX, y: posY, hit };
}
