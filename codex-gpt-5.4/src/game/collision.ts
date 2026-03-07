import type { CollisionResult, MazeData, PlayerState, WallSegment } from './types';
import { EPSILON } from '../utils/math';

function overlapsRange(value: number, min: number, max: number): boolean {
  return value >= min - EPSILON && value <= max + EPSILON;
}

function moveAlongX(x: number, y: number, radius: number, deltaX: number, walls: WallSegment[]): { x: number; collided: boolean } {
  let nextX = x + deltaX;
  let collided = false;

  for (let index = 0; index < walls.length; index += 1) {
    const wall = walls[index];
    if (wall.orientation !== 'vertical') {
      continue;
    }

    if (!overlapsRange(y, Math.min(wall.y1, wall.y2) - radius, Math.max(wall.y1, wall.y2) + radius)) {
      continue;
    }

    const wallX = wall.x1;
    if (deltaX > 0 && x + radius <= wallX && nextX + radius > wallX) {
      nextX = wallX - radius - EPSILON;
      collided = true;
    }

    if (deltaX < 0 && x - radius >= wallX && nextX - radius < wallX) {
      nextX = wallX + radius + EPSILON;
      collided = true;
    }
  }

  return { x: nextX, collided };
}

function moveAlongY(x: number, y: number, radius: number, deltaY: number, walls: WallSegment[]): { y: number; collided: boolean } {
  let nextY = y + deltaY;
  let collided = false;

  for (let index = 0; index < walls.length; index += 1) {
    const wall = walls[index];
    if (wall.orientation !== 'horizontal') {
      continue;
    }

    if (!overlapsRange(x, Math.min(wall.x1, wall.x2) - radius, Math.max(wall.x1, wall.x2) + radius)) {
      continue;
    }

    const wallY = wall.y1;
    if (deltaY > 0 && y + radius <= wallY && nextY + radius > wallY) {
      nextY = wallY - radius - EPSILON;
      collided = true;
    }

    if (deltaY < 0 && y - radius >= wallY && nextY - radius < wallY) {
      nextY = wallY + radius + EPSILON;
      collided = true;
    }
  }

  return { y: nextY, collided };
}

export function circleIntersectsWall(x: number, y: number, radius: number, wall: WallSegment): boolean {
  if (wall.orientation === 'vertical') {
    const wallX = wall.x1;
    const nearestY = Math.max(Math.min(y, Math.max(wall.y1, wall.y2)), Math.min(wall.y1, wall.y2));
    const dx = x - wallX;
    const dy = y - nearestY;
    return dx * dx + dy * dy < radius * radius - EPSILON;
  }

  const wallY = wall.y1;
  const nearestX = Math.max(Math.min(x, Math.max(wall.x1, wall.x2)), Math.min(wall.x1, wall.x2));
  const dx = x - nearestX;
  const dy = y - wallY;
  return dx * dx + dy * dy < radius * radius - EPSILON;
}

export function circleIntersectsMaze(x: number, y: number, radius: number, maze: MazeData): boolean {
  for (let index = 0; index < maze.wallSegments.length; index += 1) {
    if (circleIntersectsWall(x, y, radius, maze.wallSegments[index])) {
      return true;
    }
  }

  return false;
}

export function resolveMovement(player: PlayerState, maze: MazeData, deltaX: number, deltaY: number): CollisionResult {
  const stepCount = Math.max(1, Math.ceil(Math.max(Math.abs(deltaX), Math.abs(deltaY)) / 0.35));
  const stepX = deltaX / stepCount;
  const stepY = deltaY / stepCount;
  let collided = false;

  for (let step = 0; step < stepCount; step += 1) {
    const moveX = moveAlongX(player.position.x, player.position.y, player.radius, stepX, maze.wallSegments);
    player.position.x = moveX.x;
    const moveY = moveAlongY(player.position.x, player.position.y, player.radius, stepY, maze.wallSegments);
    player.position.y = moveY.y;
    collided = collided || moveX.collided || moveY.collided;

    if (circleIntersectsMaze(player.position.x, player.position.y, player.radius, maze)) {
      player.position.x = player.lastSafePosition.x;
      player.position.y = player.lastSafePosition.y;
      return { collided: true, stuck: true };
    }

    if (!moveX.collided && !moveY.collided) {
      player.lastSafePosition.x = player.position.x;
      player.lastSafePosition.y = player.position.y;
    }
  }

  return { collided, stuck: false };
}
