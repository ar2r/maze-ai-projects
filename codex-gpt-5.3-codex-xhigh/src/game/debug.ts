import type { Point } from './types';

export interface DebugSnapshot {
  level: number;
  seed: number;
  cols: number;
  rows: number;
  player: Point;
  collisions: number;
  controlMode: string;
  paused: boolean;
}

export class DebugOverlay {
  private readonly element: HTMLElement;
  private enabled = false;
  private fps = 0;
  private elapsedSinceUpdate = 0;

  constructor(element: HTMLElement, enabled: boolean) {
    this.element = element;
    this.setEnabled(enabled);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.element.classList.toggle('hidden', !enabled);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  update(deltaSeconds: number, snapshot: DebugSnapshot): void {
    if (!this.enabled) {
      return;
    }

    const instantFps = deltaSeconds > 0 ? 1 / deltaSeconds : 60;
    this.fps = this.fps * 0.9 + instantFps * 0.1;

    this.elapsedSinceUpdate += deltaSeconds;
    if (this.elapsedSinceUpdate < 0.12) {
      return;
    }
    this.elapsedSinceUpdate = 0;

    this.element.textContent = [
      `FPS: ${this.fps.toFixed(1)}`,
      `Level: ${snapshot.level}`,
      `Seed: ${snapshot.seed}`,
      `Grid: ${snapshot.cols}x${snapshot.rows}`,
      `Player: ${snapshot.player.x.toFixed(2)}, ${snapshot.player.y.toFixed(2)}`,
      `Hits: ${snapshot.collisions}`,
      `Mode: ${snapshot.controlMode}`,
      `Paused: ${snapshot.paused ? 'yes' : 'no'}`
    ].join('\n');
  }
}
