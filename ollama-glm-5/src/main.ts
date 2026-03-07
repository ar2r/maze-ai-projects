// Main entry point

import { GameEngine } from './core/game';
import { Storage } from './storage/storage';
import { Menu } from './ui/menu';
import { GameUI } from './ui/gameUI';
import { Results } from './ui/results';
import { SettingsUI } from './ui/settings';
import { DebugOverlay } from './debug/debugOverlay';

class GameApp {
  private gameEngine: GameEngine | null = null;
  private storage: Storage;
  private menu: Menu;
  private gameUI: GameUI;
  private results: Results;
  private settingsUI: SettingsUI;
  private debugOverlay: DebugOverlay;

  private canvas: HTMLCanvasElement;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.storage = Storage.getInstance();
    this.menu = new Menu();
    this.gameUI = new GameUI();
    this.results = new Results(this.gameUI);
    this.settingsUI = new SettingsUI();
    this.debugOverlay = new DebugOverlay();

    this.setupEventListeners();
    this.showMenu();
  }

  private setupEventListeners(): void {
    this.menu.setOnStart(() => {
      this.startGame(1);
    });

    this.menu.setOnContinue(() => {
      this.startGame(this.storage.getCurrentLevel());
    });

    this.menu.setOnSettings(() => {
      this.menu.hide();
      this.settingsUI.show();
    });

    this.settingsUI.setOnBack(() => {
      this.settingsUI.hide();
      this.showMenu();
    });

    this.settingsUI.setOnChange((settings) => {
      if (this.gameEngine) {
        this.gameEngine.updateSettings(settings);
      }
    });

    this.results.setOnNext(() => {
      const state = this.gameEngine?.getState();
      if (state) {
        this.startGame(state.level + 1);
      }
    });

    this.results.setOnRetry(() => {
      const state = this.gameEngine?.getState();
      if (state) {
        this.startGame(state.level);
      }
    });

    this.results.setOnMenu(() => {
      this.showMenu();
    });

    // Debug toggle
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Backquote') {
        this.debugOverlay.toggle();
      }
    });
  }

  private showMenu(): void {
    this.gameUI.hide();
    this.results.hide();
    this.settingsUI.hide();
    this.menu.show(this.storage.hasProgress());
  }

  private startGame(level: number): void {
    this.menu.hide();
    this.results.hide();
    this.gameUI.show();
    this.gameUI.setLevel(level);
    this.gameUI.startTimer();

    if (this.gameEngine) {
      this.gameEngine.destroy();
    }

    this.gameEngine = new GameEngine(this.canvas);

    this.gameEngine.setOnLevelComplete((time, hits) => {
      this.gameUI.stopTimer();
      this.showResults(time, hits, level);
    });

    this.gameEngine.setOnVibration(() => {
      if (this.storage.getSettings().vibration && navigator.vibrate) {
        navigator.vibrate(30);
      }
    });

    this.gameEngine.start(level);
  }

  private showResults(time: number, hits: number, level: number): void {
    this.gameUI.hide();
    const bestTime = this.storage.getBestTime(level);
    const isLastLevel = level >= 20; // Max 20 levels
    this.results.show(time, hits, bestTime, isLastLevel);
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});