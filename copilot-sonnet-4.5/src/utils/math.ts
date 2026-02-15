// Mathematical utility functions

import type { Position, Velocity } from '../types';

export function distance(p1: Position, p2: Position): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distanceSquared(p1: Position, p2: Position): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return dx * dx + dy * dy;
}

export function normalize(v: Velocity): Velocity {
  const mag = Math.sqrt(v.x * v.x + v.y * v.y);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
}

export function magnitude(v: Velocity): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function angleTo(from: Position, to: Position): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// AABB (Axis-Aligned Bounding Box) intersection test
export function aabbIntersects(
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number
): boolean {
  return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

// Circle-rectangle collision detection
export function circleRectIntersects(
  cx: number,
  cy: number,
  radius: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  // Find the closest point on the rectangle to the circle center
  const closestX = clamp(cx, rx, rx + rw);
  const closestY = clamp(cy, ry, ry + rh);

  // Calculate distance between circle center and closest point
  const distX = cx - closestX;
  const distY = cy - closestY;
  const distSquared = distX * distX + distY * distY;

  return distSquared < radius * radius;
}
