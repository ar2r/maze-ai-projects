import type { Rect, Vector2 } from '../types';

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export interface CollisionResult {
  position: Vector2;
  hit: boolean;
  hitCount: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function circleIntersectsRect(circle: Circle, rect: Rect): boolean {
  const nearestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const nearestY = clamp(circle.y, rect.y, rect.y + rect.height);
  const deltaX = circle.x - nearestX;
  const deltaY = circle.y - nearestY;
  return deltaX * deltaX + deltaY * deltaY < circle.radius * circle.radius;
}

function isColliding(circle: Circle, obstacles: readonly Rect[]): boolean {
  return obstacles.some((rect) => circleIntersectsRect(circle, rect));
}

function resolvePenetration(circle: Circle, obstacles: readonly Rect[]): Circle {
  const epsilon = 0.0001;
  let resolved = { ...circle };

  for (let pass = 0; pass < 6; pass += 1) {
    let moved = false;

    for (const rect of obstacles) {
      if (!circleIntersectsRect(resolved, rect)) {
        continue;
      }

      const overlapLeft = resolved.x + resolved.radius - rect.x;
      const overlapRight = rect.x + rect.width - (resolved.x - resolved.radius);
      const overlapTop = resolved.y + resolved.radius - rect.y;
      const overlapBottom = rect.y + rect.height - (resolved.y - resolved.radius);
      const smallestOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

      if (smallestOverlap === overlapLeft) {
        resolved.x = rect.x - resolved.radius - epsilon;
      } else if (smallestOverlap === overlapRight) {
        resolved.x = rect.x + rect.width + resolved.radius + epsilon;
      } else if (smallestOverlap === overlapTop) {
        resolved.y = rect.y - resolved.radius - epsilon;
      } else {
        resolved.y = rect.y + rect.height + resolved.radius + epsilon;
      }

      moved = true;
    }

    if (!moved) {
      break;
    }
  }

  return resolved;
}

export function resolveCircleMovement(circle: Circle, delta: Vector2, obstacles: readonly Rect[]): CollisionResult {
  const minimumStep = Math.max(circle.radius * 0.35, 0.03);
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(delta.x), Math.abs(delta.y)) / minimumStep));
  const stepX = delta.x / steps;
  const stepY = delta.y / steps;
  let resolved = resolvePenetration(circle, obstacles);
  let hitCount = 0;

  for (let step = 0; step < steps; step += 1) {
    if (stepX !== 0) {
      const nextX = { ...resolved, x: resolved.x + stepX };
      if (isColliding(nextX, obstacles)) {
        hitCount += 1;
      } else {
        resolved = nextX;
      }
    }

    if (stepY !== 0) {
      const nextY = { ...resolved, y: resolved.y + stepY };
      if (isColliding(nextY, obstacles)) {
        hitCount += 1;
      } else {
        resolved = nextY;
      }
    }

    resolved = resolvePenetration(resolved, obstacles);
  }

  return {
    position: { x: resolved.x, y: resolved.y },
    hit: hitCount > 0,
    hitCount,
  };
}
