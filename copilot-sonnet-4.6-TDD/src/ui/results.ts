/**
 * Results screen — shown after level completion.
 * Displays time, wall hits, level, path ratio; handles Next/Retry/Menu.
 */

import { formatTimeMs } from '../utils';
import type { SaveData } from '../types';

export interface ResultsData {
  level: number;
  elapsedMs: number;
  wallHits: number;
  optimalPathLength: number;
  /** Actual path length in cells (rough estimate from wall hits + optimal) */
  actualPathLength?: number;
  isNewBest: boolean;
  bestTimeMs?: number;
}

export class ResultsScreen {
  private readonly el       = document.getElementById('screen-results')!;
  private readonly timeEl   = document.getElementById('res-time')!;
  private readonly bestEl   = document.getElementById('res-best')!;
  private readonly hitsEl   = document.getElementById('res-hits')!;
  private readonly levelEl  = document.getElementById('res-level')!;
  private readonly ratioEl  = document.getElementById('res-ratio')!;
  private readonly badgeEl  = document.getElementById('new-best-badge')!;

  private readonly nextBtn   = document.getElementById('btn-next-level')!;
  private readonly retryBtn  = document.getElementById('btn-retry')!;
  private readonly menuBtn   = document.getElementById('btn-menu-from-results')!;

  private onNext:  (() => void) | null = null;
  private onRetry: (() => void) | null = null;
  private onMenu:  (() => void) | null = null;

  constructor() {
    this.nextBtn.addEventListener('click',  () => this.onNext?.());
    this.retryBtn.addEventListener('click', () => this.onRetry?.());
    this.menuBtn.addEventListener('click',  () => this.onMenu?.());
  }

  show(data: ResultsData, _save: SaveData): void {
    this.el.classList.remove('hidden');
    this.timeEl.textContent  = formatTimeMs(data.elapsedMs);
    this.hitsEl.textContent  = String(data.wallHits);
    this.levelEl.textContent = String(data.level);

    if (data.bestTimeMs !== undefined) {
      this.bestEl.textContent = `Best: ${formatTimeMs(data.bestTimeMs)}`;
    } else {
      this.bestEl.textContent = '';
    }

    // Path efficiency ratio (rough: optimal / (optimal + extra detours))
    // We use wallHits as a proxy for extra steps taken
    if (data.optimalPathLength > 0) {
      const extra = Math.max(0, data.wallHits);
      const ratio = Math.max(0, Math.min(1, data.optimalPathLength / (data.optimalPathLength + extra * 0.5)));
      this.ratioEl.textContent = `${Math.round(ratio * 100)}%`;
    } else {
      this.ratioEl.textContent = '—';
    }

    if (data.isNewBest) {
      this.badgeEl.classList.add('visible');
    } else {
      this.badgeEl.classList.remove('visible');
    }
  }

  hide(): void {
    this.el.classList.add('hidden');
  }

  setOnNext(fn: () => void):  void { this.onNext  = fn; }
  setOnRetry(fn: () => void): void { this.onRetry = fn; }
  setOnMenu(fn: () => void):  void { this.onMenu  = fn; }
}
