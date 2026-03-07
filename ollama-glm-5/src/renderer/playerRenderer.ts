// Player renderer

import { Player } from '../core/types';

export class PlayerRenderer {
  private playerColor: string = '#3b82f6';
  private playerOutlineColor: string = '#60a5fa';
  private trailColor: string = 'rgba(59, 130, 246, 0.2)';

  private trailPositions: Array<{ x: number; y: number }> = [];
  private maxTrailLength: number = 20;

  updateTrail(player: Player): void {
    this.trailPositions.unshift({ x: player.x, y: player.y });
    if (this.trailPositions.length > this.maxTrailLength) {
      this.trailPositions.pop();
    }
  }

  render(ctx: CanvasRenderingContext2D, player: Player, offsetX: number, offsetY: number, scale: number): void {
    const screenX = (player.x + offsetX) * scale;
    const screenY = (player.y + offsetY) * scale;
    const screenRadius = player.radius * scale;

    // Draw trail
    ctx.strokeStyle = this.trailColor;
    ctx.lineWidth = screenRadius * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (this.trailPositions.length > 1) {
      ctx.beginPath();
      ctx.moveTo(
        (this.trailPositions[0].x + offsetX) * scale,
        (this.trailPositions[0].y + offsetY) * scale
      );

      for (let i = 1; i < this.trailPositions.length; i++) {
        const alpha = 1 - (i / this.trailPositions.length);
        ctx.globalAlpha = alpha * 0.3;
        ctx.lineTo(
          (this.trailPositions[i].x + offsetX) * scale,
          (this.trailPositions[i].y + offsetY) * scale
        );
      }
      ctx.stroke();
    }

    ctx.globalAlpha = 1;

    // Draw player glow
    const gradient = ctx.createRadialGradient(
      screenX, screenY, 0,
      screenX, screenY, screenRadius * 2
    );
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY, screenRadius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw player body
    ctx.fillStyle = this.playerColor;
    ctx.beginPath();
    ctx.arc(screenX, screenY, screenRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw outline
    ctx.strokeStyle = this.playerOutlineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(screenX, screenY, screenRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(
      screenX - screenRadius * 0.3,
      screenY - screenRadius * 0.3,
      screenRadius * 0.4,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  clearTrail(): void {
    this.trailPositions = [];
  }
}