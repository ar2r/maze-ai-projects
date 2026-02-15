// ============================================================================
// UI Menu and Dialog System
// ============================================================================

import type { GameSettings } from '../game/types';

export interface UICallbacks {
  onStartGame?: () => void;
  onContinueGame?: () => void;
  onNextLevel?: () => void;
  onRetryLevel?: () => void;
  onResumeGame?: () => void;
  onSettingsChanged?: (settings: Partial<GameSettings>) => void;
  onMenuOpen?: () => void;
}

export class UIManager {
  private container: HTMLElement;
  private callbacks: UICallbacks = {};

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'ui-container';
    document.body.appendChild(this.container);
  }

  setCallbacks(callbacks: UICallbacks): void {
    this.callbacks = callbacks;
  }

  showMainMenu(hasSavedProgress: boolean): void {
    this.container.innerHTML = `
      <div class="menu-overlay">
        <div class="menu-panel">
          <h1>Maze Runner</h1>
          <button class="btn btn-primary" id="btn-new-game">New Game</button>
          ${hasSavedProgress ? '<button class="btn btn-secondary" id="btn-continue">Continue</button>' : ''}
          <button class="btn btn-secondary" id="btn-settings">Settings</button>
        </div>
      </div>
    `;

    document.getElementById('btn-new-game')?.addEventListener('click', () => {
      this.callbacks.onStartGame?.();
    });

    document.getElementById('btn-continue')?.addEventListener('click', () => {
      this.callbacks.onContinueGame?.();
    });

    document.getElementById('btn-settings')?.addEventListener('click', () => {
      this.showSettings();
    });
  }

  showLevelComplete(
    levelNumber: number,
    timeMs: number,
    wallHits: number,
    bestTime?: number
  ): void {
    const seconds = (timeMs / 1000).toFixed(2);
    const bestSeconds = bestTime ? (bestTime / 1000).toFixed(2) : 'N/A';

    this.container.innerHTML = `
      <div class="menu-overlay">
        <div class="menu-panel">
          <h2>Level ${levelNumber} Complete!</h2>
          <div class="result-stats">
            <p>Time: <strong>${seconds}s</strong></p>
            <p>Best: <strong>${bestSeconds}s</strong></p>
            <p>Wall Hits: <strong>${wallHits}</strong></p>
          </div>
          <div class="menu-buttons">
            <button class="btn btn-primary" id="btn-next">Next Level</button>
            <button class="btn btn-secondary" id="btn-retry">Retry</button>
            <button class="btn btn-secondary" id="btn-menu">Main Menu</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-next')?.addEventListener('click', () => {
      this.callbacks.onNextLevel?.();
    });

    document.getElementById('btn-retry')?.addEventListener('click', () => {
      this.callbacks.onRetryLevel?.();
    });

    document.getElementById('btn-menu')?.addEventListener('click', () => {
      this.callbacks.onMenuOpen?.();
    });
  }

  showPauseMenu(): void {
    this.container.innerHTML = `
      <div class="menu-overlay">
        <div class="menu-panel">
          <h2>Paused</h2>
          <div class="menu-buttons">
            <button class="btn btn-primary" id="btn-resume">Resume</button>
            <button class="btn btn-secondary" id="btn-pause-retry">Retry</button>
            <button class="btn btn-secondary" id="btn-pause-menu">Main Menu</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-resume')?.addEventListener('click', () => {
      this.callbacks.onResumeGame?.();
    });

    document.getElementById('btn-pause-retry')?.addEventListener('click', () => {
      this.callbacks.onRetryLevel?.();
    });

    document.getElementById('btn-pause-menu')?.addEventListener('click', () => {
      this.callbacks.onMenuOpen?.();
    });
  }

  showSettings(settings?: Partial<GameSettings>): void {
    this.container.innerHTML = `
      <div class="menu-overlay">
        <div class="menu-panel">
          <h2>Settings</h2>
          <div class="settings-group">
            <label>
              <input type="checkbox" id="sound-toggle" ${settings?.soundEnabled ? 'checked' : ''} />
              Sound Effects
            </label>
          </div>
          <div class="settings-group">
            <label>
              <input type="checkbox" id="vibration-toggle" ${settings?.vibrationEnabled ? 'checked' : ''} />
              Vibration
            </label>
          </div>
          <div class="settings-group">
            <label>Control Mode:</label>
            <select id="control-mode">
              <option value="mouse-follow" ${settings?.controlMode === 'mouse-follow' ? 'selected' : ''}>Mouse Follow</option>
              <option value="wasd" ${settings?.controlMode === 'wasd' ? 'selected' : ''}>WASD / Arrows</option>
              <option value="drag" ${settings?.controlMode === 'drag' ? 'selected' : ''}>Drag</option>
            </select>
          </div>
          <button class="btn btn-primary" id="btn-settings-close">Back</button>
        </div>
      </div>
    `;

    document.getElementById('btn-settings-close')?.addEventListener('click', () => {
      const settings: Partial<GameSettings> = {
        soundEnabled: (document.getElementById('sound-toggle') as HTMLInputElement)?.checked ?? true,
        vibrationEnabled: (document.getElementById('vibration-toggle') as HTMLInputElement)?.checked ?? true,
        controlMode: (document.getElementById('control-mode') as HTMLSelectElement)?.value as any ?? 'mouse-follow',
      };
      this.callbacks.onSettingsChanged?.(settings);
      this.showMainMenu(true);
    });
  }

  showHUD(levelNumber: number, timeMs: number): void {
    const seconds = (timeMs / 1000).toFixed(1);
    const hudElement = document.getElementById('hud') || document.createElement('div');
    hudElement.id = 'hud';
    hudElement.className = 'hud';
    hudElement.innerHTML = `
      <div class="hud-left">Level ${levelNumber}</div>
      <div class="hud-right">${seconds}s</div>
    `;

    if (!document.getElementById('hud')) {
      document.body.appendChild(hudElement);
    }
  }

  hideHUD(): void {
    const hud = document.getElementById('hud');
    if (hud) {
      hud.remove();
    }
  }

  clearUI(): void {
    this.container.innerHTML = '';
  }

  showDebugInfo(
    fps: number,
    seed: number,
    gridSize: string,
    playerPos: string,
    wallHits: number
  ): void {
    let debugEl = document.getElementById('debug-overlay');
    if (!debugEl) {
      debugEl = document.createElement('div');
      debugEl.id = 'debug-overlay';
      document.body.appendChild(debugEl);
    }

    debugEl.innerHTML = `
      <div style="font-size: 12px; color: #fff; text-shadow: 1px 1px 2px #000;">
        FPS: ${fps.toFixed(0)} | Seed: ${seed} | Grid: ${gridSize} | Pos: ${playerPos} | Hits: ${wallHits}
      </div>
    `;
  }

  hideDebugInfo(): void {
    const debugEl = document.getElementById('debug-overlay');
    if (debugEl) {
      debugEl.remove();
    }
  }
}
