import { DebugInfo } from '../utils/types';
import { DEBUG_KEY, DEBUG_ENABLED_KEY } from '../utils/constants';

/**
 * Debug overlay for development and testing
 */
export class DebugOverlay {
  private overlay: HTMLElement;
  private fpsElement: HTMLElement;
  private seedElement: HTMLElement;
  private sizeElement: HTMLElement;
  private posElement: HTMLElement;
  private hitsElement: HTMLElement;
  private enabled: boolean;

  // FPS calculation
  private frameCount: number = 0;
  private lastFpsTime: number = 0;
  private currentFps: number = 0;

  constructor() {
    this.overlay = document.getElementById('debug-overlay')!;
    this.fpsElement = document.getElementById('debug-fps')!;
    this.seedElement = document.getElementById('debug-seed')!;
    this.sizeElement = document.getElementById('debug-size')!;
    this.posElement = document.getElementById('debug-pos')!;
    this.hitsElement = document.getElementById('debug-hits')!;

    // Check stored preference
    this.enabled = localStorage.getItem(DEBUG_ENABLED_KEY) === 'true';
    this.updateVisibility();

    // Toggle with F3
    window.addEventListener('keydown', (e) => {
      if (e.key === DEBUG_KEY) {
        this.toggle();
      }
    });
  }

  /** Toggle debug overlay */
  toggle(): void {
    this.enabled = !this.enabled;
    localStorage.setItem(DEBUG_ENABLED_KEY, String(this.enabled));
    this.updateVisibility();
  }

  private updateVisibility(): void {
    this.overlay.classList.toggle('hidden', !this.enabled);
  }

  /** Update FPS counter (call every frame) */
  updateFps(): void {
    this.frameCount++;
    const now = performance.now();

    if (now - this.lastFpsTime >= 1000) {
      this.currentFps = Math.round(this.frameCount * 1000 / (now - this.lastFpsTime));
      this.frameCount = 0;
      this.lastFpsTime = now;
      this.fpsElement.textContent = String(this.currentFps);
    }
  }

  /** Update debug info display */
  update(info: Partial<DebugInfo>): void {
    if (!this.enabled) return;

    if (info.seed !== undefined) {
      this.seedElement.textContent = String(info.seed);
    }
    if (info.mazeSize !== undefined) {
      this.sizeElement.textContent = info.mazeSize;
    }
    if (info.playerPos !== undefined) {
      this.posElement.textContent = info.playerPos;
    }
    if (info.hitCount !== undefined) {
      this.hitsElement.textContent = String(info.hitCount);
    }
  }

  /** Check if debug is enabled */
  isEnabled(): boolean {
    return this.enabled;
  }
}
