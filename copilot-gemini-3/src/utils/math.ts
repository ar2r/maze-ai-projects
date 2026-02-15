export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Linear Congruential Generator
  // Parameters from Numerical Recipes
  public next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  public rangeInt(min: number, max: number): number {
    return Math.floor(this.range(min, max));
  }
  
  public shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

export function lerp(start: number, end: number, t: number): number {
  return start * (1 - t) + end * t;
}

// Check intersection between Circle and AABB (Axis Aligned Bounding Box)
// Used for Player (Circle) vs Wall (Rect) collision
export function circleRectIntersect(cx: number, cy: number, r: number, rect: Rect): boolean {
  // Find the closest point on the rectangle to the center of the circle
  const closestX = clamp(cx, rect.x, rect.x + rect.w);
  const closestY = clamp(cy, rect.y, rect.y + rect.h);

  // Calculate the distance between the circle's center and this closest point
  const distanceX = cx - closestX;
  const distanceY = cy - closestY;

  // If the distance is less than the circle's radius, an intersection occurs
  const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
  return distanceSquared < (r * r);
}
