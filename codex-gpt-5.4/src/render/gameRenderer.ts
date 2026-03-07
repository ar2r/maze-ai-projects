import type { PlayerState, ViewportInfo } from '../game/types';

export function drawPlayer(
  context: CanvasRenderingContext2D,
  player: PlayerState,
  viewport: ViewportInfo,
  dpr: number,
  pulse = 0
): void {
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.save();
  context.translate(viewport.offsetX, viewport.offsetY);
  const x = player.position.x * viewport.scale;
  const y = player.position.y * viewport.scale;
  const radius = player.radius * viewport.scale;

  context.fillStyle = '#2f7fd8';
  context.beginPath();
  context.arc(x, y, radius + pulse, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = 'rgba(255,255,255,0.8)';
  context.beginPath();
  context.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.25, 0, Math.PI * 2);
  context.fill();
  context.restore();
}
