import { COLORS } from './maze-renderer';

/**
 * Render the player as a pixel-art circle.
 * Flash effect on wall collision.
 */
export function renderPlayer(
  ctx: CanvasRenderingContext2D,
  worldX: number,
  worldY: number,
  radius: number,
  cameraX: number,
  cameraY: number,
  dpr: number,
  hitFlash: number, // 0..1, decays from 1 on collision
): void {
  const screenX = (worldX - cameraX) * dpr;
  const screenY = (worldY - cameraY) * dpr;
  const r = radius * dpr;

  ctx.save();

  // Glow effect
  ctx.shadowColor = hitFlash > 0.1 ? COLORS.wallHit : COLORS.player;
  ctx.shadowBlur = (6 + hitFlash * 10) * dpr;

  // Main circle
  ctx.fillStyle = hitFlash > 0.1
    ? lerpColor(COLORS.player, COLORS.wallHit, hitFlash)
    : COLORS.player;
  ctx.beginPath();
  ctx.arc(screenX, screenY, r, 0, Math.PI * 2);
  ctx.fill();

  // Inner highlight (pixel art feel)
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.arc(screenX - r * 0.25, screenY - r * 0.25, r * 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Render the pulsing exit marker.
 */
export function renderExit(
  ctx: CanvasRenderingContext2D,
  cellX: number,
  cellY: number,
  cellSize: number,
  cameraX: number,
  cameraY: number,
  dpr: number,
  time: number, // total elapsed time for animation
): void {
  const worldX = cellX * cellSize + cellSize / 2;
  const worldY = cellY * cellSize + cellSize / 2;
  const screenX = (worldX - cameraX) * dpr;
  const screenY = (worldY - cameraY) * dpr;

  const pulse = 0.5 + 0.5 * Math.sin(time * 4); // 0..1 pulsing
  const r = (cellSize * 0.3 + cellSize * 0.1 * pulse) * dpr;

  ctx.save();
  ctx.shadowColor = COLORS.exit;
  ctx.shadowBlur = (8 + 6 * pulse) * dpr;
  ctx.fillStyle = COLORS.exit;
  ctx.globalAlpha = 0.6 + 0.4 * pulse;

  // Draw diamond shape (pixel art feel)
  ctx.beginPath();
  ctx.moveTo(screenX, screenY - r);
  ctx.lineTo(screenX + r, screenY);
  ctx.lineTo(screenX, screenY + r);
  ctx.lineTo(screenX - r, screenY);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.restore();
}

/** Simple hex color interpolation */
function lerpColor(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);

  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bv = Math.round(ab + (bb - ab) * t);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bv.toString(16).padStart(2, '0')}`;
}
