/**
 * HUD — in-game heads-up display.
 * Updates level, timer, wall hit counter each frame.
 */

import { formatTime } from '../utils';

export class HUD {
  private readonly el       = document.getElementById('hud')!;
  private readonly levelEl  = document.getElementById('hud-level')!;
  private readonly timeEl   = document.getElementById('hud-time')!;
  private readonly hitsEl   = document.getElementById('hud-hits')!;
  private readonly pauseBtn = document.getElementById('btn-pause')!;

  private onPause: (() => void) | null = null;

  constructor() {
    this.pauseBtn.addEventListener('click', () => this.onPause?.());
  }

  show(): void { this.el.classList.remove('hidden'); }
  hide(): void { this.el.classList.add('hidden'); }

  setOnPause(fn: () => void): void { this.onPause = fn; }

  update(level: number, elapsedMs: number, hits: number): void {
    this.levelEl.textContent = String(level);
    this.timeEl.textContent  = formatTime(elapsedMs);
    this.hitsEl.textContent  = String(hits);
  }
}
