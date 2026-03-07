import type { LevelState, PlayerState } from '../game/types';

export interface DebugSnapshot {
  fps: number;
  level: LevelState | null;
  player: PlayerState | null;
}

export class DebugOverlay {
  constructor(private readonly element: HTMLElement) {}

  update(snapshot: DebugSnapshot): void {
    if (snapshot.level === null || snapshot.player === null) {
      this.element.textContent = 'debug: no active level';
      return;
    }

    this.element.textContent = [
      `FPS ${snapshot.fps.toFixed(1)}`,
      `Seed ${snapshot.level.config.seed}`,
      `Grid ${snapshot.level.maze.width}x${snapshot.level.maze.height}`,
      `Pos ${snapshot.player.position.x.toFixed(2)}, ${snapshot.player.position.y.toFixed(2)}`,
      `Hits ${snapshot.player.wallHits}`
    ].join('\n');
  }
}
