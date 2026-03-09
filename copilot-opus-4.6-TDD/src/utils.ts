/** Clamp value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Length of a 2D vector */
export function vecLength(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

/** Normalize a 2D vector. Returns {x:0,y:0} if zero-length */
export function vecNormalize(x: number, y: number): { x: number; y: number } {
  const len = vecLength(x, y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

/** Distance between two points */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return vecLength(x2 - x1, y2 - y1);
}

/** Trigger vibration if available and enabled */
export function vibrate(ms: number): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Format time in seconds to "MM:SS.s" */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}:${secs.toFixed(1).padStart(4, '0')}`;
  }
  return `${secs.toFixed(1)}s`;
}
