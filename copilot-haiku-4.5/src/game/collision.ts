// ============================================================================
// Collision Detection and Physics
// ============================================================================

import type { AABB, Vec2, Player, Maze } from './types';

const GRAVITY = 0;
const FRICTION = 0.9;
const MAX_VELOCITY = 8;

/**
 * Check if two AABBs overlap
 */
export function aabbIntersect(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Check if circle (player) overlaps with AABB (wall)
 */
export function circleAabbIntersect(
  circleX: number,
  circleY: number,
  radius: number,
  box: AABB
): boolean {
  // Find closest point on box to circle
  const closestX = Math.max(box.x, Math.min(circleX, box.x + box.width));
  const closestY = Math.max(box.y, Math.min(circleY, box.y + box.height));

  const distX = circleX - closestX;
  const distY = circleY - closestY;
  const distSq = distX * distX + distY * distY;

  return distSq < radius * radius;
}

/**
 * Get closest point on AABB to a circle
 */
function getClosestPointOnBox(
  circleX: number,
  circleY: number,
  box: AABB
): Vec2 {
  return {
    x: Math.max(box.x, Math.min(circleX, box.x + box.width)),
    y: Math.max(box.y, Math.min(circleY, box.y + box.height)),
  };
}

/**
 * Resolve collision: push player out of wall and apply friction
 */
export function resolveCollision(
  player: Player,
  walls: Array<{ x: number; y: number; w: number; h: number }>,
  _maze: Maze
): number {
  let collisionCount = 0;
  const playerRadius = player.radius;

  for (const wall of walls) {
    const box: AABB = { x: wall.x, y: wall.y, width: wall.w, height: wall.h };

    if (circleAabbIntersect(player.pos.x, player.pos.y, playerRadius, box)) {
      collisionCount++;

      // Get closest point and push player out
      const closest = getClosestPointOnBox(player.pos.x, player.pos.y, box);
      const dx = player.pos.x - closest.x;
      const dy = player.pos.y - closest.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      const overlap = playerRadius - dist;
      const pushDist = overlap + 1; // Add small margin
      const nx = (dx / dist) * pushDist;
      const ny = (dy / dist) * pushDist;

      player.pos.x += nx;
      player.pos.y += ny;

      // Apply friction and dampen velocity in collision direction
      const velDot = player.vel.x * nx + player.vel.y * ny;
      if (velDot < 0) {
        player.vel.x -= velDot * (nx / dist) * 0.5;
        player.vel.y -= velDot * (ny / dist) * 0.5;
      }

      player.vel.x *= FRICTION;
      player.vel.y *= FRICTION;
    }
  }

  return collisionCount;
}

/**
 * Update player position based on velocity
 */
export function updatePlayerPhysics(player: Player, deltaTime: number): void {
  // Apply gravity
  player.vel.y += GRAVITY * deltaTime;

  // Clamp velocity
  const velMag = Math.sqrt(player.vel.x ** 2 + player.vel.y ** 2);
  if (velMag > MAX_VELOCITY) {
    const scale = MAX_VELOCITY / velMag;
    player.vel.x *= scale;
    player.vel.y *= scale;
  }

  // Update position
  player.pos.x += player.vel.x;
  player.pos.y += player.vel.y;

  // Natural friction
  player.vel.x *= FRICTION;
  player.vel.y *= FRICTION;
}

/**
 * Move player towards target (mouse following mode)
 */
export function movePlayerTowardTarget(
  player: Player,
  targetX: number,
  targetY: number,
  speed: number
): void {
  const dx = targetX - player.pos.x;
  const dy = targetY - player.pos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > speed) {
    player.vel.x = (dx / dist) * speed;
    player.vel.y = (dy / dist) * speed;
  } else {
    player.vel.x = 0;
    player.vel.y = 0;
  }
}

/**
 * Move player via keyboard input
 */
export function movePlayerByInput(
  player: Player,
  up: boolean,
  down: boolean,
  left: boolean,
  right: boolean,
  speed: number
): void {
  let vx = 0;
  let vy = 0;

  if (left) vx -= speed;
  if (right) vx += speed;
  if (up) vy -= speed;
  if (down) vy += speed;

  player.vel.x = vx;
  player.vel.y = vy;
}

/**
 * Check if player reached the goal
 */
export function isPlayerAtGoal(player: Player, maze: Maze, goalRadius: number): boolean {
  const goalCenterX = maze.end.x * maze.cellSize + maze.cellSize / 2;
  const goalCenterY = maze.end.y * maze.cellSize + maze.cellSize / 2;

  const dx = player.pos.x - goalCenterX;
  const dy = player.pos.y - goalCenterY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  return dist < goalRadius + player.radius;
}

/**
 * Clamp player position within maze bounds
 */
export function clampPlayerToBounds(player: Player, maze: Maze): void {
  const maxX = maze.width * maze.cellSize;
  const maxY = maze.height * maze.cellSize;

  player.pos.x = Math.max(player.radius, Math.min(maxX - player.radius, player.pos.x));
  player.pos.y = Math.max(player.radius, Math.min(maxY - player.radius, player.pos.y));
}
