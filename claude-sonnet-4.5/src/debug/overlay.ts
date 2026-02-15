// === Debug Overlay ===

import type { DebugInfo } from '../types';

export class DebugOverlay {
  private overlay: HTMLElement | null;
  private enabled: boolean = false;

  constructor() {
    this.overlay = document.getElementById('debug-overlay');
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.overlay) {
      if (enabled) {
        this.overlay.classList.remove('hidden');
      } else {
        this.overlay.classList.add('hidden');
      }
    }
  }

  update(info: DebugInfo): void {
    if (!this.enabled || !this.overlay) return;

    this.setText('debug-fps', info.fps.toString());
    this.setText('debug-level', info.level.toString());
    this.setText('debug-size', `${info.mazeSize.width}x${info.mazeSize.height}`);
    this.setText('debug-seed', info.seed.toString());
    this.setText(
      'debug-pos',
      `${Math.floor(info.playerPos.x)}, ${Math.floor(info.playerPos.y)}`
    );
    this.setText('debug-collisions', info.collisionCount.toString());
  }

  private setText(id: string, text: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = text;
    }
  }
}
