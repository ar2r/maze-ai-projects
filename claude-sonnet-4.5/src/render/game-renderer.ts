// === Game Renderer ===

import type { Player, Maze } from '../types';
import { CONFIG } from '../config';
import { MazeRenderer } from './maze-renderer';

export class GameRenderer {
  private mazeRenderer: MazeRenderer;
  private playerTrail: Array<{ x: number; y: number; alpha: number }> = [];

  constructor() {
    this.mazeRenderer = new MazeRenderer();
  }

  render(
    ctx: CanvasRenderingContext2D,
    maze: Maze,
    player: Player
  ): void {
    // Clear canvas
    const width = maze.width * maze.cellSize;
    const height = maze.height * maze.cellSize;
    ctx.clearRect(0, 0, width, height);

    // Render maze (static, uses offscreen buffer)
    this.mazeRenderer.render(ctx, maze);

    // Render player trail
    this.renderTrail(ctx);

    // Render player
    this.renderPlayer(ctx, player);

    // Update trail
    this.updateTrail(player);
  }

  private renderPlayer(ctx: CanvasRenderingContext2D, player: Player): void {
    const { position, radius } = player;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(position.x + 2, position.y + 2, radius, 0, Math.PI * 2);
    ctx.fill();

    // Outer glow
    const gradient = ctx.createRadialGradient(
      position.x,
      position.y,
      radius * 0.5,
      position.x,
      position.y,
      radius * 1.5
    );
    gradient.addColorStop(0, CONFIG.MAZE.COLORS.PLAYER);
    gradient.addColorStop(1, 'rgba(52, 152, 219, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Player ball
    ctx.fillStyle = CONFIG.MAZE.COLORS.PLAYER;
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    const highlightGradient = ctx.createRadialGradient(
      position.x - radius * 0.3,
      position.y - radius * 0.3,
      0,
      position.x - radius * 0.3,
      position.y - radius * 0.3,
      radius * 0.7
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  private updateTrail(player: Player): void {
    // Add current position to trail
    this.playerTrail.push({
      x: player.position.x,
      y: player.position.y,
      alpha: 1,
    });

    // Limit trail length
    if (this.playerTrail.length > 20) {
      this.playerTrail.shift();
    }

    // Fade trail
    for (const point of this.playerTrail) {
      point.alpha *= 0.9;
    }
  }

  private renderTrail(ctx: CanvasRenderingContext2D): void {
    if (this.playerTrail.length < 2) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < this.playerTrail.length; i++) {
      const prev = this.playerTrail[i - 1];
      const curr = this.playerTrail[i];

      const alpha = curr.alpha * 0.3;
      const width = (i / this.playerTrail.length) * 4;

      ctx.strokeStyle = `rgba(52, 152, 219, ${alpha})`;
      ctx.lineWidth = width;

      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
    }
  }

  clearMazeBuffer(): void {
    this.mazeRenderer.clearBuffer();
  }

  clearTrail(): void {
    this.playerTrail = [];
  }
}
