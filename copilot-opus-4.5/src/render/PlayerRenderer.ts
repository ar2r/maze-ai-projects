import { PlayerState } from '../utils/types';
import { PLAYER_COLOR, PLAYER_GLOW_COLOR } from '../utils/constants';

/**
 * Renders the player and dynamic elements
 */
export class PlayerRenderer {
  /** Draw player at current position */
  render(
    ctx: CanvasRenderingContext2D,
    player: PlayerState,
    offsetX: number,
    offsetY: number
  ): void {
    const x = player.x + offsetX;
    const y = player.y + offsetY;

    // Draw glow
    ctx.beginPath();
    ctx.arc(x, y, player.radius * 1.8, 0, Math.PI * 2);
    ctx.fillStyle = PLAYER_GLOW_COLOR;
    ctx.fill();

    // Draw player circle
    ctx.beginPath();
    ctx.arc(x, y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = PLAYER_COLOR;
    ctx.fill();

    // Draw highlight
    ctx.beginPath();
    ctx.arc(x - player.radius * 0.3, y - player.radius * 0.3, player.radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();
  }

  /** Draw collision flash effect */
  renderCollisionFlash(
    ctx: CanvasRenderingContext2D,
    player: PlayerState,
    offsetX: number,
    offsetY: number,
    intensity: number
  ): void {
    if (intensity <= 0) return;

    const x = player.x + offsetX;
    const y = player.y + offsetY;

    ctx.beginPath();
    ctx.arc(x, y, player.radius * (1.5 + intensity), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 100, 100, ${intensity * 0.5})`;
    ctx.fill();
  }
}
