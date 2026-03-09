/**
 * Collision engine — circle vs axis-aligned wall segments.
 *
 * Core ideas:
 *  1. Walls are line segments (WallSegment: x1,y1 → x2,y2).
 *  2. Circle-vs-segment collision: find closest point on segment to circle center,
 *     check if distance < radius.
 *  3. Resolution: push circle away along the normal from closest point.
 *  4. Sliding: project velocity along wall tangent so player glides along walls
 *     instead of stopping dead.
 *  5. Only check walls near the player (cells in a 3×3 neighbourhood) to keep O(1).
 */

import type { MazeData, WallSegment } from '../types';

// ─── Geometry helpers ─────────────────────────────────────────────────────────

/**
 * Find the closest point on segment (x1,y1)→(x2,y2) to point (px,py).
 */
export function closestPointOnSegment(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number,
): { x: number; y: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  // Degenerate segment (zero length) → return the point itself
  if (lenSq === 0) return { x: x1, y: y1 };

  // Project point onto segment; t ∈ [0,1]
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return {
    x: x1 + t * dx,
    y: y1 + t * dy,
  };
}

/**
 * Returns true if a circle (cx,cy,radius) overlaps a wall segment.
 */
export function circleVsSegment(
  cx: number, cy: number, radius: number,
  seg: WallSegment,
): boolean {
  const closest = closestPointOnSegment(cx, cy, seg.x1, seg.y1, seg.x2, seg.y2);
  const dx = cx - closest.x;
  const dy = cy - closest.y;
  return (dx * dx + dy * dy) < (radius * radius);
}

/**
 * Resolve a circle-vs-segment collision.
 *
 * @returns New position {x,y} with the circle pushed out, or null if no collision.
 */
export function resolveCircleVsSegment(
  cx: number, cy: number, radius: number,
  seg: WallSegment,
): { x: number; y: number } | null {
  const closest = closestPointOnSegment(cx, cy, seg.x1, seg.y1, seg.x2, seg.y2);
  const dx = cx - closest.x;
  const dy = cy - closest.y;
  const distSq = dx * dx + dy * dy;

  if (distSq >= radius * radius) return null; // No collision

  const dist = Math.sqrt(distSq);
  // Epsilon to avoid re-sticking
  const epsilon = 0.05;
  const pushDist = radius - dist + epsilon;

  if (dist < 1e-9) {
    // Circle center is exactly on segment — push up by default
    return { x: cx, y: cy - pushDist };
  }

  // Normal from wall surface toward circle center
  const nx = dx / dist;
  const ny = dy / dist;

  return {
    x: cx + nx * pushDist,
    y: cy + ny * pushDist,
  };
}

/**
 * Apply wall sliding to a velocity vector.
 *
 * When the circle hits a wall, the velocity component perpendicular to the wall
 * is cancelled; the tangential component is preserved (sliding).
 *
 * @param vx Velocity x
 * @param vy Velocity y
 * @param seg The wall segment that was hit
 * @returns New velocity {vx, vy} with sliding applied
 */
export function applySliding(
  vx: number, vy: number,
  seg: WallSegment,
): { vx: number; vy: number } {
  // Wall tangent (direction of segment)
  const dx = seg.x2 - seg.x1;
  const dy = seg.y2 - seg.y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1e-9) return { vx, vy };

  const tx = dx / len;
  const ty = dy / len;

  // Project velocity onto tangent
  const dot = vx * tx + vy * ty;
  return {
    vx: dot * tx,
    vy: dot * ty,
  };
}

// ─── Wall segment extraction ──────────────────────────────────────────────────

/**
 * Extract all wall segments from a maze for collision checking.
 *
 * Each cell edge that has a wall → one line segment in world coordinates.
 * To avoid duplicates, we only emit each wall once:
 *   - North wall of cell (y, x) → only if y === 0  (outer) or emitted from above
 *   - We emit: N and W walls for every cell (covers all edges exactly once
 *     plus outer S and E borders).
 *
 * Strategy: emit N-wall and W-wall for every cell, plus S-wall of last row
 * and E-wall of last column.
 */
export function getWallSegments(maze: MazeData): WallSegment[] {
  const { width, height, cells, cellSize } = maze;
  const segments: WallSegment[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = cells[y][x];
      const wx = x * cellSize;
      const wy = y * cellSize;

      // North wall (top edge of cell)
      if (cell.wallN) {
        segments.push({ x1: wx, y1: wy, x2: wx + cellSize, y2: wy });
      }
      // West wall (left edge of cell)
      if (cell.wallW) {
        segments.push({ x1: wx, y1: wy, x2: wx, y2: wy + cellSize });
      }

      // Emit south wall only for last row (avoid doubles)
      if (y === height - 1 && cell.wallS) {
        segments.push({ x1: wx, y1: wy + cellSize, x2: wx + cellSize, y2: wy + cellSize });
      }
      // Emit east wall only for last column
      if (x === width - 1 && cell.wallE) {
        segments.push({ x1: wx + cellSize, y1: wy, x2: wx + cellSize, y2: wy + cellSize });
      }
    }
  }

  return segments;
}

/**
 * Get wall segments for cells near the player position (3×3 neighbourhood).
 * This is a performance optimisation: O(1) instead of O(n²).
 */
export function getNearbyWallSegments(
  maze: MazeData,
  worldX: number,
  worldY: number,
): WallSegment[] {
  const { width, height, cells, cellSize } = maze;

  // Which cell is the player in?
  const cellX = Math.floor(worldX / cellSize);
  const cellY = Math.floor(worldY / cellSize);

  const segments: WallSegment[] = [];

  // Check 3×3 neighbourhood
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = cellX + dx;
      const ny = cellY + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

      const cell = cells[ny][nx];
      const wx = nx * cellSize;
      const wy = ny * cellSize;

      if (cell.wallN) segments.push({ x1: wx, y1: wy, x2: wx + cellSize, y2: wy });
      if (cell.wallW) segments.push({ x1: wx, y1: wy, x2: wx, y2: wy + cellSize });
      if (cell.wallS) segments.push({ x1: wx, y1: wy + cellSize, x2: wx + cellSize, y2: wy + cellSize });
      if (cell.wallE) segments.push({ x1: wx + cellSize, y1: wy, x2: wx + cellSize, y2: wy + cellSize });
    }
  }

  return segments;
}

// ─── Full resolution pass ─────────────────────────────────────────────────────

/**
 * Resolve all collisions for a circle against a list of wall segments.
 *
 * Iterates up to `maxIter` times to handle corner cases where resolution
 * of one wall pushes into another.
 *
 * @returns Final position and adjusted velocity after all resolutions.
 */
export function resolveCollisions(
  cx: number, cy: number,
  vx: number, vy: number,
  radius: number,
  segments: WallSegment[],
  maxIter = 3,
): { x: number; y: number; vx: number; vy: number; hitCount: number } {
  let x = cx, y = cy;
  let dvx = vx, dvy = vy;
  let hitCount = 0;

  for (let iter = 0; iter < maxIter; iter++) {
    let hit = false;
    for (const seg of segments) {
      const resolved = resolveCircleVsSegment(x, y, radius, seg);
      if (resolved) {
        x = resolved.x;
        y = resolved.y;
        const slid = applySliding(dvx, dvy, seg);
        dvx = slid.vx;
        dvy = slid.vy;
        hitCount++;
        hit = true;
      }
    }
    if (!hit) break; // Converged
  }

  return { x, y, vx: dvx, vy: dvy, hitCount };
}
