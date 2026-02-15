// === UI Manager - Handles all UI screens and updates ===

import type { GameState, GameStats } from '../types';
import { storage } from '../utils/storage';

export class UIManager {
  private screens: Map<string, HTMLElement> = new Map();

  constructor() {
    this.cacheElements();
    this.setupEventListeners();
    this.updateMenuStats();
  }

  private cacheElements(): void {
    const screenIds = ['menu', 'settings', 'game-screen', 'pause-menu', 'results'];

    for (const id of screenIds) {
      const element = document.getElementById(id);
      if (element) {
        this.screens.set(id, element);
      }
    }
  }

  private setupEventListeners(): void {
    // Menu buttons
    this.addListener('btn-start', () => this.emit('start-new-game'));
    this.addListener('btn-continue', () => this.emit('continue-game'));
    this.addListener('btn-settings', () => this.showScreen('settings'));

    // Settings
    this.addListener('btn-settings-back', () => this.showScreen('menu'));
    this.addListener('sound-toggle', (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      storage.updateSettings({ soundEnabled: checked });
      this.emit('settings-changed');
    });
    this.addListener('vibration-toggle', (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      storage.updateSettings({ vibrationEnabled: checked });
      this.emit('settings-changed');
    });
    this.addListener('control-mode', (e) => {
      const value = (e.target as HTMLSelectElement).value as any;
      storage.updateSettings({ controlMode: value });
      this.emit('settings-changed');
    });
    this.addListener('debug-toggle', (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      storage.updateSettings({ debugMode: checked });
      this.emit('settings-changed');
    });

    // Game controls
    this.addListener('btn-pause', () => this.emit('pause-game'));
    this.addListener('btn-resume', () => this.emit('resume-game'));
    this.addListener('btn-restart', () => this.emit('restart-level'));
    this.addListener('btn-quit', () => {
      this.emit('quit-to-menu');
      this.showScreen('menu');
    });

    // Results
    this.addListener('btn-next-level', () => this.emit('next-level'));
    this.addListener('btn-retry', () => this.emit('retry-level'));
  }

  private addListener(id: string, handler: (e: Event) => void): void {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('click', handler);
      element.addEventListener('change', handler);
    }
  }

  private eventHandlers: Map<string, Array<(data?: any) => void>> = new Map();

  on(event: string, handler: (data?: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  // === Screen Management ===

  showScreen(screen: GameState | 'settings'): void {
    // Hide all screens
    this.screens.forEach((element) => {
      element.classList.add('hidden');
    });

    // Show target screen
    const targetScreen = this.screens.get(screen);
    if (targetScreen) {
      targetScreen.classList.remove('hidden');
    }
  }

  showOverlay(overlay: 'pause-menu' | 'results'): void {
    const element = this.screens.get(overlay);
    if (element) {
      element.classList.remove('hidden');
    }
  }

  hideOverlay(overlay: 'pause-menu' | 'results'): void {
    const element = this.screens.get(overlay);
    if (element) {
      element.classList.add('hidden');
    }
  }

  // === HUD Updates ===

  updateHUD(level: number, time: number, hits: number): void {
    this.setText('hud-level', level.toString());
    this.setText('hud-time', this.formatTime(time));
    this.setText('hud-hits', hits.toString());
  }

  // === Menu Updates ===

  updateMenuStats(): void {
    const bestLevel = storage.getBestLevel();
    const totalTime = storage.getTotalPlayTime();

    this.setText('best-level', bestLevel.toString());
    this.setText('total-time', this.formatTime(totalTime * 1000));

    // Enable/disable continue button
    const continueBtn = document.getElementById('btn-continue');
    if (continueBtn) {
      if (storage.hasProgress()) {
        continueBtn.removeAttribute('disabled');
      } else {
        continueBtn.setAttribute('disabled', 'true');
      }
    }
  }

  // === Results Updates ===

  showResults(stats: GameStats, level: number): void {
    const timeInSeconds = Math.floor(stats.elapsedTime / 1000);
    const levelProgress = storage.getLevelProgress(level);
    const bestTime = levelProgress?.bestTime ?? null;

    this.setText('result-time', this.formatTime(stats.elapsedTime));
    this.setText('result-hits', stats.wallHits.toString());

    if (bestTime !== null && timeInSeconds < bestTime) {
      this.setText('result-best-time', '🎉 New Record!');
    } else if (bestTime !== null) {
      this.setText('result-best-time', this.formatTime(bestTime * 1000));
    } else {
      this.setText('result-best-time', 'First completion!');
    }

    this.showOverlay('results');
  }

  // === Settings Updates ===

  loadSettings(): void {
    const settings = storage.getSettings();

    const soundToggle = document.getElementById('sound-toggle') as HTMLInputElement;
    const vibrationToggle = document.getElementById('vibration-toggle') as HTMLInputElement;
    const controlMode = document.getElementById('control-mode') as HTMLSelectElement;
    const debugToggle = document.getElementById('debug-toggle') as HTMLInputElement;

    if (soundToggle) soundToggle.checked = settings.soundEnabled;
    if (vibrationToggle) vibrationToggle.checked = settings.vibrationEnabled;
    if (controlMode) controlMode.value = settings.controlMode;
    if (debugToggle) debugToggle.checked = settings.debugMode;
  }

  // === Utilities ===

  private setText(id: string, text: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = text;
    }
  }

  private formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
