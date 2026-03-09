/**
 * Player module — state and movement.
 *
 * The player is a circle moving in world coordinates.
 * Movement is velocity-based with collision resolution (see collision.ts).
 */

import type { PlayerState, MazeData, InputVector } from '../types';
import { resolveCollisions, getNearbyWallSegments } from './collision';

/** Fraction of speed to apply when two directions cancel (diagonal) */
const DIAGONAL_FACTOR = 0.7071; // 1/sqrt(2)

/**
 * Create initial player state for a new level.
 * Player starts at the center of the start cell (0,0).
 */
export function createPlayer(maze: MazeData): PlayerState {
  const { cellSize } = maze;
  const radius = Math.max(4, cellSize * 0.22);
  return {
    x: cellSize / 2,
    y: cellSize / 2,
    radius,
    vx: 0,
    vy: 0,
    wallHits: 0,
  };
}

/**
 * Update player position for one physics tick.
 *
 * @param player   Current player state (mutated in place for performance)
 * @param input    Normalised direction vector from input system
 * @param speed    World pixels per second
 * @param deltaMs  Time step in ms
 * @param maze     Current maze (for collision)
 * @returns Number of new wall hits this tick
 */
export function updatePlayer(
  player: PlayerState,
  input: InputVector,
  speed: number,
  deltaMs: number,
  maze: MazeData,
): number {
  const dt = deltaMs / 1000; // seconds

  // Normalize input vector if both axes active (diagonal movement)
  let ix = input.x;
  let iy = input.y;
  const len = Math.sqrt(ix * ix + iy * iy);
  if (len > 1) {
    ix = (ix / len) * DIAGONAL_FACTOR;
    iy = (iy / len) * DIAGONAL_FACTOR;
  }

  // Compute desired velocity
  const vx = ix * speed;
  const vy = iy * speed;

  // Candidate new position
  let nx = player.x + vx * dt;
  let ny = player.y + vy * dt;

  // Get nearby wall segments for collision (performance: O(1) lookup)
  const segments = getNearbyWallSegments(maze, nx, ny);

  // Resolve collisions with sliding
  const result = resolveCollisions(nx, ny, vx, vy, player.radius, segments);

  const newHits = result.hitCount > 0 ? 1 : 0; // count as 1 hit event per tick

  player.x = result.x;
  player.y = result.y;
  player.vx = result.vx;
  player.vy = result.vy;
  if (newHits > 0) player.wallHits += newHits;

  return newHits;
}

/**
 * Check if the player has reached the finish cell (bottom-right).
 */
export function hasReachedFinish(player: PlayerState, maze: MazeData): boolean {
  const { cellSize, width, height } = maze;
  // Finish cell center
  const fcx = (width - 1) * cellSize + cellSize / 2;
  const fcy = (height - 1) * cellSize + cellSize / 2;

  const dx = player.x - fcx;
  const dy = player.y - fcy;
  // Trigger when player center is within 45% of cellSize from finish center
  const threshold = cellSize * 0.45;
  return (dx * dx + dy * dy) < (threshold * threshold);
}
