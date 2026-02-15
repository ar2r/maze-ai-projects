// Main application entry point

import { Game } from './engine/game';
import { GameState } from './types';
import { InputManager } from './input/manager';
import { loadGameData, saveGameData, saveBestTime, getBestTime, saveSettings, loadSettings } from './storage/persistence';
import { formatTime } from './utils/math';

class MazeGameApp {
  private game: Game;
  private screens: Map<string, HTMLElement> = new Map();

  constructor() {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) throw new Error('Canvas not found');

    this.game = new Game(canvas);
    new InputManager(this.game, canvas);

    this.initScreens();
    this.setupEventListeners();
    this.loadSavedSettings();

    // Setup game callbacks
    this.game.setCallbacks(
      (state) => this.handleStateChange(state),
      (stats) => this.handleStatsUpdate(stats)
    );

    // Show continue button if there's saved progress
    const savedData = loadGameData();
    if (savedData.currentLevel > 1) {
      const continueBtn = document.getElementById('btn-continue');
      if (continueBtn) {
        continueBtn.style.display = 'block';
      }
    }
  }

  private initScreens(): void {
    this.screens.set('menu', document.getElementById('menu')!);
    this.screens.set('game', document.getElementById('game-screen')!);
    this.screens.set('pause', document.getElementById('pause-screen')!);
    this.screens.set('complete', document.getElementById('level-complete-screen')!);
    this.screens.set('settings', document.getElementById('settings-screen')!);
    this.screens.set('help', document.getElementById('help-screen')!);
  }

  private setupEventListeners(): void {
    // Menu buttons
    document.getElementById('btn-start')?.addEventListener('click', () => this.startNewGame());
    document.getElementById('btn-continue')?.addEventListener('click', () => this.continueGame());
    document.getElementById('btn-settings')?.addEventListener('click', () => this.showSettings());
    document.getElementById('btn-help')?.addEventListener('click', () => this.showHelp());

    // Game buttons
    document.getElementById('btn-pause')?.addEventListener('click', () => this.game.pause());

    // Pause menu buttons
    document.getElementById('btn-resume')?.addEventListener('click', () => this.game.resume());
    document.getElementById('btn-restart')?.addEventListener('click', () => this.game.restart());
    document.getElementById('btn-menu')?.addEventListener('click', () => {
      this.game.returnToMenu();
      this.showScreen('menu');
    });

    // Level complete buttons
    document.getElementById('btn-next')?.addEventListener('click', () => this.nextLevel());
    document.getElementById('btn-retry')?.addEventListener('click', () => this.game.restart());

    // Settings
    document.getElementById('toggle-sound')?.addEventListener('change', (e) => {
      this.game.settings.soundEnabled = (e.target as HTMLInputElement).checked;
      saveSettings(this.game.settings);
    });

    document.getElementById('toggle-vibration')?.addEventListener('change', (e) => {
      this.game.settings.vibrationEnabled = (e.target as HTMLInputElement).checked;
      saveSettings(this.game.settings);
    });

    document.getElementById('select-controls')?.addEventListener('change', (e) => {
      this.game.settings.controlMode = (e.target as HTMLSelectElement).value as any;
      saveSettings(this.game.settings);
    });

    document.getElementById('btn-settings-close')?.addEventListener('click', () => this.showScreen('menu'));
    document.getElementById('btn-help-close')?.addEventListener('click', () => this.showScreen('menu'));
  }

  private loadSavedSettings(): void {
    const settings = loadSettings();
    this.game.settings = settings;

    (document.getElementById('toggle-sound') as HTMLInputElement).checked = settings.soundEnabled;
    (document.getElementById('toggle-vibration') as HTMLInputElement).checked = settings.vibrationEnabled;
    (document.getElementById('select-controls') as HTMLSelectElement).value = settings.controlMode;
  }

  private startNewGame(): void {
    this.game.startLevel(1);
    this.showScreen('game');
  }

  private continueGame(): void {
    const savedData = loadGameData();
    this.game.startLevel(savedData.currentLevel);
    this.showScreen('game');
  }

  private nextLevel(): void {
    const nextLevelNum = this.game.getCurrentLevel() + 1;
    saveGameData({ currentLevel: nextLevelNum });
    this.game.nextLevel();
    this.showScreen('game');
  }

  private showSettings(): void {
    this.showScreen('settings');
  }

  private showHelp(): void {
    this.showScreen('help');
  }

  private showScreen(screenName: string): void {
    this.screens.forEach((screen, name) => {
      if (name === screenName) {
        screen.classList.add('active');
      } else {
        screen.classList.remove('active');
      }
    });
  }

  private handleStateChange(state: GameState): void {
    switch (state) {
      case GameState.MENU:
        this.showScreen('menu');
        break;
      case GameState.PLAYING:
        this.showScreen('game');
        this.screens.get('pause')?.classList.remove('active');
        this.screens.get('complete')?.classList.remove('active');
        break;
      case GameState.PAUSED:
        this.screens.get('pause')?.classList.add('active');
        break;
      case GameState.LEVEL_COMPLETE:
        this.screens.get('complete')?.classList.add('active');
        break;
    }
  }

  private handleStatsUpdate(stats: any): void {
    // Update HUD
    document.getElementById('level-display')!.textContent = `Level: ${stats.level || 1}`;
    document.getElementById('timer-display')!.textContent = formatTime(stats.time || 0);
    document.getElementById('collision-display')!.textContent = `Hits: ${stats.collisions || 0}`;

    // Update level complete screen
    if (stats.completed) {
      document.getElementById('stat-time')!.textContent = formatTime(stats.time);
      document.getElementById('stat-collisions')!.textContent = String(stats.collisions);

      const bestTime = getBestTime(stats.level);
      const bestTimeEl = document.getElementById('best-time')!;
      if (bestTime) {
        document.getElementById('stat-best')!.textContent = formatTime(bestTime);
        bestTimeEl.style.display = 'block';
      } else {
        bestTimeEl.style.display = 'none';
      }

      saveBestTime(stats.level, stats.time);
    }
  }
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new MazeGameApp());
} else {
  new MazeGameApp();
}

export default MazeGameApp;
