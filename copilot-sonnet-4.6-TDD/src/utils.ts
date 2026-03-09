/**
 * Utility helpers — small, pure functions used across the codebase.
 */

/** Clamp a value to [min, max] */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Format milliseconds as "mm:ss" */
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** Format milliseconds as "mm:ss.t" (with tenths) */
export function formatTimeMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
}

/** Check if the device is primarily a touch device */
export function isTouchDevice(): boolean {
  return navigator.maxTouchPoints > 0;
}

/** Check if URL has a debug flag (?debug=1 or ?debug=true) */
export function isDebugMode(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get('debug') === '1' || params.get('debug') === 'true';
}

/**
 * Debounce: returns a function that delays calling `fn` until `wait` ms
 * have elapsed since the last call.
 */
export function debounce<T extends unknown[]>(
  fn: (...args: T) => void,
  wait: number,
): (...args: T) => void {
  let timer = 0;
  return (...args: T) => {
    clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), wait);
  };
}
