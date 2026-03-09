import { COLORS } from './maze-renderer';

/**
 * Debug overlay: FPS, seed, grid size, player position, collision count.
 * Toggled via settings.
 */
export interface DebugInfo {
  fps: number;
  seed: number;
  gridCols: number;
  gridRows: number;
  playerX: number;
  playerY: number;
  wallHits: number;
  cellSize: number;
}

let frameCount = 0;
let lastFpsTime = 0;
let currentFps = 0;

/**
 * Update FPS counter. Call once per frame.
 */
export function updateFps(time: number): number {
  frameCount++;
  if (time - lastFpsTime >= 1000) {
    currentFps = frameCount;
    frameCount = 0;
    lastFpsTime = time;
  }
  return currentFps;
}

/**
 * Render debug overlay.
 */
export function renderDebugOverlay(
  ctx: CanvasRenderingContext2D,
  info: DebugInfo,
  width: number,
  height: number,
  dpr: number,
): void {
  ctx.save();

  const fontSize = Math.floor(11 * dpr);
  ctx.font = `${fontSize}px monospace`;
  ctx.textBaseline = 'top';

  const lines = [
    `FPS: ${info.fps}`,
    `Seed: ${info.seed}`,
    `Grid: ${info.gridCols}x${info.gridRows}`,
    `Cell: ${info.cellSize}px`,
    `Pos: (${info.playerX.toFixed(1)}, ${info.playerY.toFixed(1)})`,
    `Hits: ${info.wallHits}`,
  ];

  const pad = 8 * dpr;
  const lineHeight = (fontSize + 3 * dpr);
  const boxHeight = lines.length * lineHeight + pad * 2;
  const boxWidth = 160 * dpr;

  // Background
  ctx.fillStyle = 'rgba(15, 14, 23, 0.85)';
  ctx.fillRect(pad, height * dpr - boxHeight - pad, boxWidth, boxHeight);

  // Border
  ctx.strokeStyle = COLORS.start;
  ctx.lineWidth = dpr;
  ctx.strokeRect(pad, height * dpr - boxHeight - pad, boxWidth, boxHeight);

  // Text
  ctx.fillStyle = COLORS.text;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(
      lines[i],
      pad * 2,
      height * dpr - boxHeight - pad + pad + i * lineHeight,
    );
  }

  ctx.restore();
}
