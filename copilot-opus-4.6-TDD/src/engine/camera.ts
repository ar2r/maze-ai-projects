import { lerp } from '../utils';

/**
 * Camera tracks the player with smooth following.
 * On small mazes (entire maze fits on screen), centers the maze.
 * On large mazes, follows the player and clamps to maze boundaries.
 */
export interface Camera {
  x: number; // top-left x of the viewport in world space
  y: number; // top-left y of the viewport in world space
}

/**
 * Update camera position to follow the player.
 *
 * @param camera - Current camera position
 * @param playerX - Player world X
 * @param playerY - Player world Y
 * @param viewportWidth - Screen viewport width in pixels
 * @param viewportHeight - Screen viewport height in pixels
 * @param worldWidth - Total maze width in pixels
 * @param worldHeight - Total maze height in pixels
 * @param dt - Delta time in seconds
 * @param smoothness - Camera smoothing factor (0=instant, higher=smoother). Default 8
 * @returns Updated camera position
 */
export function updateCamera(
  camera: Camera,
  playerX: number,
  playerY: number,
  viewportWidth: number,
  viewportHeight: number,
  worldWidth: number,
  worldHeight: number,
  dt: number,
  smoothness: number = 8,
): Camera {
  // Target: center on player
  let targetX = playerX - viewportWidth / 2;
  let targetY = playerY - viewportHeight / 2;

  // If maze fits on screen, center the maze instead
  if (worldWidth <= viewportWidth) {
    targetX = (worldWidth - viewportWidth) / 2;
  } else {
    // Clamp to world bounds
    targetX = Math.max(0, Math.min(targetX, worldWidth - viewportWidth));
  }

  if (worldHeight <= viewportHeight) {
    targetY = (worldHeight - viewportHeight) / 2;
  } else {
    targetY = Math.max(0, Math.min(targetY, worldHeight - viewportHeight));
  }

  // Smooth follow
  const t = 1 - Math.exp(-smoothness * dt);
  return {
    x: lerp(camera.x, targetX, t),
    y: lerp(camera.y, targetY, t),
  };
}
