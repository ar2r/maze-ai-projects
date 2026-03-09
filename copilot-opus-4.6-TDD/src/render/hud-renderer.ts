import { COLORS } from './maze-renderer';
import { formatTime } from '../utils';

/**
 * Render the in-game HUD (level, timer).
 * Drawn directly on the main canvas (not affected by camera).
 */
export function renderHud(
  ctx: CanvasRenderingContext2D,
  level: number,
  timeElapsed: number,
  wallHits: number,
  width: number,
  height: number,
  dpr: number,
): void {
  ctx.save();

  const fontSize = Math.floor(14 * dpr);
  ctx.font = `${fontSize}px monospace`;
  ctx.textBaseline = 'top';

  const pad = 10 * dpr;

  // Level (top-left)
  ctx.fillStyle = COLORS.start;
  ctx.fillText(`LVL ${level}`, pad, pad);

  // Timer (top-center)
  const timeStr = formatTime(timeElapsed);
  ctx.fillStyle = COLORS.text;
  const timeWidth = ctx.measureText(timeStr).width;
  ctx.fillText(timeStr, (width * dpr - timeWidth) / 2, pad);

  // Wall hits (top-right, before pause button)
  if (wallHits > 0) {
    ctx.fillStyle = COLORS.wallHit;
    const hitStr = `Hits: ${wallHits}`;
    const hitWidth = ctx.measureText(hitStr).width;
    ctx.fillText(hitStr, width * dpr - hitWidth - pad - 45 * dpr, pad);
  }

  ctx.restore();
}
