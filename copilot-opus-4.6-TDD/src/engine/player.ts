import type { Vec2 } from '../types';
import { resolveCollisions } from './collision';
import type { WallSegment } from '../types';
import { clamp } from '../utils';

/**
 * Update player position based on input direction, speed, and delta time.
 * Applies collision resolution against wall segments.
 *
 * @returns New position and whether a wall hit occurred this frame
 */
export function updatePlayer(
  pos: Vec2,
  inputDir: Vec2,
  speed: number,
  dt: number,
  radius: number,
  walls: WallSegment[],
  mazePixelWidth: number,
  mazePixelHeight: number,
): { pos: Vec2; hit: boolean } {
  // Calculate desired movement
  let dx = inputDir.x * speed * dt;
  let dy = inputDir.y * speed * dt;

  // Desired new position
  let newX = pos.x + dx;
  let newY = pos.y + dy;

  // Clamp to maze bounds (keep inside the outer boundary)
  newX = clamp(newX, radius, mazePixelWidth - radius);
  newY = clamp(newY, radius, mazePixelHeight - radius);

  // Resolve wall collisions
  const resolved = resolveCollisions(newX, newY, radius, walls);

  // Clamp again after resolution to be safe
  resolved.x = clamp(resolved.x, radius, mazePixelWidth - radius);
  resolved.y = clamp(resolved.y, radius, mazePixelHeight - radius);

  return {
    pos: { x: resolved.x, y: resolved.y },
    hit: resolved.hit,
  };
}

/**
 * Check if the player has reached the exit cell.
 * Player is considered at exit when their center is inside the exit cell.
 */
export function isAtExit(
  playerPos: Vec2,
  exitCell: Vec2,
  cellSize: number,
): boolean {
  const cellCenterX = exitCell.x * cellSize + cellSize / 2;
  const cellCenterY = exitCell.y * cellSize + cellSize / 2;

  const dx = playerPos.x - cellCenterX;
  const dy = playerPos.y - cellCenterY;

  // Player center must be within half cellSize of exit center
  return Math.abs(dx) < cellSize * 0.5 && Math.abs(dy) < cellSize * 0.5;
}
