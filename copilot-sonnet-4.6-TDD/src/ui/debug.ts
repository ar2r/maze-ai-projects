/**
 * Debug overlay — renders real-time diagnostic information.
 *
 * Activated by:
 *  - URL parameter: ?debug=1
 *  - Keyboard shortcut: backtick (`) key
 *
 * Displays: FPS, seed, grid size, player cell, wall hits, render time.
 */

import type { DebugInfo } from '../types';

export class DebugOverlay {
  private readonly el: HTMLElement;
  private visible = false;

  // FPS tracking
  private frameCount = 0;
  private fpsTimer   = 0;
  private currentFps = 0;

  constructor() {
    this.el = document.getElementById('debug-overlay')!;
    window.addEventListener('keydown', (e) => {
      if (e.key === '`' || e.key === '~') this.toggle();
    });
  }

  show():   void { this.visible = true;  this.el.classList.remove('hidden'); }
  hide():   void { this.visible = false; this.el.classList.add('hidden'); }
  toggle(): void { this.visible ? this.hide() : this.show(); }
  isVisible(): boolean { return this.visible; }

  /**
   * Call each frame to update FPS counter and render info.
   * @param deltaMs Time since last frame
   * @param info    Current debug info
   */
  update(deltaMs: number, info: Omit<DebugInfo, 'fps'>): void {
    if (!this.visible) return;

    // FPS calculation (average over 0.5s)
    this.frameCount++;
    this.fpsTimer += deltaMs;
    if (this.fpsTimer >= 500) {
      this.currentFps = Math.round(this.frameCount / (this.fpsTimer / 1000));
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    this.el.textContent = [
      `FPS:     ${this.currentFps}`,
      `Seed:    ${info.seed}`,
      `Grid:    ${info.gridW}×${info.gridH}`,
      `Cell:    (${info.playerCell.x}, ${info.playerCell.y})`,
      `Hits:    ${info.collisions}`,
      `RndMs:   ${info.renderMs.toFixed(1)}`,
    ].join('\n');
  }
}
