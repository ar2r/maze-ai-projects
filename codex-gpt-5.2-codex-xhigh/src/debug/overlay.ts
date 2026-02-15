import type { Layout, Maze, PlayerState } from '../game/types';
import type { GameStats } from '../game/engine';

export class DebugOverlay {
  private el: HTMLElement;
  private enabled = false;
  private fps = 0;
  private lastUpdate = 0;

  constructor(el: HTMLElement) {
    this.el = el;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.el.hidden = !enabled;
  }

  tick(dt: number, stats: GameStats, maze: Maze, layout: Layout, player: PlayerState): void {
    if (!this.enabled) return;
    const now = performance.now();
    if (dt > 0) {
      const instant = 1 / dt;
      this.fps = this.fps === 0 ? instant : this.fps * 0.9 + instant * 0.1;
    }
    if (now - this.lastUpdate < 200) return;
    this.lastUpdate = now;

    this.el.textContent = [
      `FPS: ${this.fps.toFixed(1)}`,
      `Level: ${stats.level}`,
      `Seed: ${stats.seed}`,
      `Grid: ${maze.cols}x${maze.rows}`,
      `CellPx: ${layout.cellSizePx}`,
      `Player: ${player.pos.x.toFixed(2)}, ${player.pos.y.toFixed(2)}`,
      `Collisions: ${stats.collisions}`
    ].join('\n');
  }
}
