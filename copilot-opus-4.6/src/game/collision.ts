import type { Vec2, MazeData, LevelConfig } from '../types';
import { clamp } from '../utils/rng';

/**
 * Rectangle representing a wall segment.
 */
interface WallRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Build a list of wall rectangles from maze data for collision detection.
 * Each wall is a thin rect at the cell boundary.
 */
export function buildWallRects(maze: MazeData, cellSize: number, offsetX: number, offsetY: number): WallRect[] {
  const wallThickness = 2;
  const half = wallThickness / 2;
  const rects: WallRect[] = [];

  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      const cell = maze.cells[r][c];
      const x = offsetX + c * cellSize;
      const y = offsetY + r * cellSize;

      if (cell.walls.top) {
        rects.push({ x: x, y: y - half, w: cellSize, h: wallThickness });
      }
      if (cell.walls.right) {
        rects.push({ x: x + cellSize - half, y: y, w: wallThickness, h: cellSize });
      }
      if (cell.walls.bottom) {
        rects.push({ x: x, y: y + cellSize - half, w: cellSize, h: wallThickness });
      }
      if (cell.walls.left) {
        rects.push({ x: x - half, y: y, w: wallThickness, h: cellSize });
      }
    }
  }

  // Outer boundary walls
  const totalW = maze.cols * cellSize;
  const totalH = maze.rows * cellSize;
  rects.push({ x: offsetX - half, y: offsetY - half, w: totalW + wallThickness, h: wallThickness }); // top
  rects.push({ x: offsetX + totalW - half, y: offsetY - half, w: wallThickness, h: totalH + wallThickness }); // right
  rects.push({ x: offsetX - half, y: offsetY + totalH - half, w: totalW + wallThickness, h: wallThickness }); // bottom
  rects.push({ x: offsetX - half, y: offsetY - half, w: wallThickness, h: totalH + wallThickness }); // left

  return rects;
}

/**
 * Circle-vs-AABB collision test + resolution.
 * Returns resolved position and whether a collision occurred.
 */
export function resolveCircleRect(
  pos: Vec2, radius: number, rect: WallRect
): { resolved: Vec2; hit: boolean } {
  const closestX = clamp(pos.x, rect.x, rect.x + rect.w);
  const closestY = clamp(pos.y, rect.y, rect.y + rect.h);

  const dx = pos.x - closestX;
  const dy = pos.y - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq >= radius * radius) {
    return { resolved: pos, hit: false };
  }

  // Push player out
  const dist = Math.sqrt(distSq);
  if (dist < 0.0001) {
    // Player center is inside rect — push in the shortest axis
    const overlapX = radius + rect.w / 2 - Math.abs(pos.x - (rect.x + rect.w / 2));
    const overlapY = radius + rect.h / 2 - Math.abs(pos.y - (rect.y + rect.h / 2));
    if (overlapX < overlapY) {
      const sign = pos.x < rect.x + rect.w / 2 ? -1 : 1;
      return { resolved: { x: pos.x + sign * overlapX, y: pos.y }, hit: true };
    } else {
      const sign = pos.y < rect.y + rect.h / 2 ? -1 : 1;
      return { resolved: { x: pos.x, y: pos.y + sign * overlapY }, hit: true };
    }
  }

  const overlap = radius - dist;
  const nx = dx / dist;
  const ny = dy / dist;

  return {
    resolved: { x: pos.x + nx * overlap, y: pos.y + ny * overlap },
    hit: true,
  };
}

/**
 * Move player with wall collision & sliding.
 * Returns final position and number of wall hits this frame.
 */
export function moveWithCollision(
  pos: Vec2,
  delta: Vec2,
  radius: number,
  walls: WallRect[]
): { pos: Vec2; hits: number } {
  let newPos = { x: pos.x + delta.x, y: pos.y + delta.y };
  let hits = 0;

  // Multiple passes for stable collision (2 passes is enough)
  for (let pass = 0; pass < 3; pass++) {
    for (const wall of walls) {
      const result = resolveCircleRect(newPos, radius, wall);
      if (result.hit) {
        newPos = result.resolved;
        if (pass === 0) hits++;
      }
    }
  }

  return { pos: newPos, hits };
}

/**
 * Check if player (circle) overlaps a cell area.
 */
export function isPlayerInCell(
  playerPos: Vec2,
  playerRadius: number,
  cellRow: number,
  cellCol: number,
  cellSize: number,
  offsetX: number,
  offsetY: number
): boolean {
  const cx = offsetX + cellCol * cellSize + cellSize / 2;
  const cy = offsetY + cellRow * cellSize + cellSize / 2;
  const dx = playerPos.x - cx;
  const dy = playerPos.y - cy;
  const threshold = cellSize / 2 + playerRadius;
  return Math.abs(dx) < threshold && Math.abs(dy) < threshold;
}
