import type { Point } from '../game/types';

export const EPSILON = 1e-4;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lengthSq(x: number, y: number): number {
  return x * x + y * y;
}

export function length(x: number, y: number): number {
  return Math.sqrt(lengthSq(x, y));
}

export function normalize(x: number, y: number): Point {
  const len = length(x, y);
  if (len <= EPSILON) {
    return { x: 0, y: 0 };
  }

  return { x: x / len, y: y / len };
}

export function distance(a: Point, b: Point): number {
  return length(a.x - b.x, a.y - b.y);
}
