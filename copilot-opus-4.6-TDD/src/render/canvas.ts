/**
 * Canvas setup with HiDPI support and resize handling.
 * For pixel art style: disables image smoothing.
 */

export interface CanvasContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;   // logical width (CSS pixels)
  height: number;  // logical height (CSS pixels)
  dpr: number;     // device pixel ratio
  resize(): void;
}

/**
 * Initialize canvas with HiDPI support.
 * The canvas will fill its container and scale for retina displays.
 */
export function setupCanvas(canvas: HTMLCanvasElement): CanvasContext {
  const ctx = canvas.getContext('2d')!;
  let width = 0;
  let height = 0;
  let dpr = 1;

  function resize(): void {
    dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2x for performance
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    // Disable smoothing for pixel art look
    ctx.imageSmoothingEnabled = false;
  }

  resize();

  return {
    canvas,
    ctx,
    get width() { return width; },
    get height() { return height; },
    get dpr() { return dpr; },
    resize,
  };
}
