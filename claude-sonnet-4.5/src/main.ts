// === Main Entry Point ===

import { CanvasManager } from './render/canvas';
import { GameRenderer } from './render/game-renderer';
import { GameEngine } from './game/engine';
import { UIManager } from './ui/ui-manager';
import { AudioManager, HapticsManager } from './audio/sounds';
import { DebugOverlay } from './debug/overlay';
import { storage } from './utils/storage';

class MazeRunnerGame {
  private canvasManager: CanvasManager;
  private gameRenderer: GameRenderer;
  private gameEngine: GameEngine;
  private uiManager: UIManager;
  private audioManager: AudioManager;
  private hapticsManager: HapticsManager;
  private debugOverlay: DebugOverlay;

  private renderLoopId: number = 0;

  constructor() {
    // Get canvas element
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }

    // Initialize managers
    this.canvasManager = new CanvasManager(canvas);
    this.gameRenderer = new GameRenderer();
    this.debugOverlay = new DebugOverlay();
    this.audioManager = new AudioManager();
    this.hapticsManager = new HapticsManager();

    // Get initial size
    const { width, height } = this.canvasManager.resize();

    // Initialize game engine
    this.gameEngine = new GameEngine(canvas, width, height);

    // Initialize UI
    this.uiManager = new UIManager();
    this.uiManager.loadSettings();

    // Setup callbacks
    this.setupCallbacks();

    // Start game engine
    this.gameEngine.start();

    // Start render loop
    this.startRenderLoop();

    // Initialize based on state
    this.initialize();

    console.log('🎮 Maze Runner initialized!');
  }

  private initialize(): void {
    // Show menu by default
    this.uiManager.showScreen('menu');
    this.uiManager.updateMenuStats();

    // Load debug setting
    const settings = storage.getSettings();
    this.debugOverlay.setEnabled(settings.debugMode);

    // Update input joystick visibility
    this.gameEngine.getInputManager().updateJoystickVisibility();
  }

  private setupCallbacks(): void {
    // UI events
    this.uiManager.on('start-new-game', () => this.startNewGame());
    this.uiManager.on('continue-game', () => this.continueGame());
    this.uiManager.on('pause-game', () => this.pauseGame());
    this.uiManager.on('resume-game', () => this.resumeGame());
    this.uiManager.on('restart-level', () => this.restartLevel());
    this.uiManager.on('quit-to-menu', () => this.quitToMenu());
    this.uiManager.on('next-level', () => this.nextLevel());
    this.uiManager.on('retry-level', () => this.retryLevel());
    this.uiManager.on('settings-changed', () => this.onSettingsChanged());

    // Engine events
    this.gameEngine.onStateChangeCallback((state) => this.onStateChange(state));
    this.gameEngine.onStatsUpdateCallback(() => this.onStatsUpdate());
    this.gameEngine.onCollisionCallback(() => this.onCollision());
    this.gameEngine.onLevelCompleteCallback(() => this.onLevelComplete());
  }

  // === Game Actions ===

  private startNewGame(): void {
    this.gameEngine.startNewGame();
    this.gameRenderer.clearMazeBuffer();
    this.gameRenderer.clearTrail();
  }

  private continueGame(): void {
    this.gameEngine.continueGame();
    this.gameRenderer.clearMazeBuffer();
    this.gameRenderer.clearTrail();
  }

  private pauseGame(): void {
    this.gameEngine.pauseGame();
  }

  private resumeGame(): void {
    this.gameEngine.resumeGame();
  }

  private restartLevel(): void {
    this.gameEngine.restartLevel();
    this.gameRenderer.clearTrail();
    this.uiManager.hideOverlay('pause-menu');
  }

  private quitToMenu(): void {
    this.gameEngine.returnToMenu();
    this.gameRenderer.clearMazeBuffer();
    this.gameRenderer.clearTrail();
    this.uiManager.updateMenuStats();
  }

  private nextLevel(): void {
    this.gameEngine.nextLevel();
    this.gameRenderer.clearMazeBuffer();
    this.gameRenderer.clearTrail();
    this.uiManager.hideOverlay('results');
  }

  private retryLevel(): void {
    this.gameEngine.restartLevel();
    this.gameRenderer.clearTrail();
    this.uiManager.hideOverlay('results');
  }

  // === Event Handlers ===

  private onStateChange(state: string): void {
    console.log('State changed:', state);

    if (state === 'menu') {
      this.uiManager.showScreen('menu');
      this.uiManager.updateMenuStats();
    } else if (state === 'playing') {
      this.uiManager.showScreen('game-screen' as any);
      this.uiManager.hideOverlay('pause-menu');
      this.uiManager.hideOverlay('results');
    } else if (state === 'paused') {
      this.uiManager.showOverlay('pause-menu');
    } else if (state === 'results') {
      const stats = this.gameEngine.getStateManager().getStats();
      const level = this.gameEngine.getStateManager().getCurrentLevel();
      this.uiManager.showResults(stats, level);
    }
  }

  private onStatsUpdate(): void {
    const stateManager = this.gameEngine.getStateManager();
    const stats = stateManager.getStats();
    const level = stateManager.getCurrentLevel();

    this.uiManager.updateHUD(level, stats.elapsedTime, stats.wallHits);
  }

  private onCollision(): void {
    this.audioManager.playCollision();
    this.hapticsManager.vibrateCollision();
  }

  private onLevelComplete(): void {
    this.audioManager.playSuccess();
    this.hapticsManager.vibrateSuccess();
  }

  private onSettingsChanged(): void {
    this.gameEngine.updateSettings();
    this.audioManager.updateSettings();
    this.hapticsManager.updateSettings();

    const settings = storage.getSettings();
    this.debugOverlay.setEnabled(settings.debugMode);
  }

  // === Render Loop ===

  private startRenderLoop(): void {
    const render = () => {
      this.render();
      this.renderLoopId = requestAnimationFrame(render);
    };

    render();
  }

  private render(): void {
    const state = this.gameEngine.getStateManager().getState();

    if (state === 'playing' || state === 'paused') {
      const maze = this.gameEngine.getStateManager().getMaze();
      const player = this.gameEngine.getStateManager().getPlayer();

      if (maze && player) {
        const ctx = this.canvasManager.getContext();
        this.gameRenderer.render(ctx, maze, player);
      }

      // Update debug overlay
      if (storage.getSettings().debugMode) {
        const debugInfo = this.gameEngine.getDebugInfo();
        this.debugOverlay.update(debugInfo);
      }
    }
  }

  // === Cleanup ===

  destroy(): void {
    this.gameEngine.destroy();
    this.canvasManager.destroy();
    cancelAnimationFrame(this.renderLoopId);
  }
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new MazeRunnerGame();
  });
} else {
  new MazeRunnerGame();
}

// Prevent pull-to-refresh on mobile
document.body.addEventListener(
  'touchmove',
  (e) => {
    if ((e.target as HTMLElement).tagName !== 'INPUT' &&
        (e.target as HTMLElement).tagName !== 'SELECT') {
      e.preventDefault();
    }
  },
  { passive: false }
);

// Prevent double-tap zoom
let lastTouchEnd = 0;
document.addEventListener(
  'touchend',
  (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  },
  { passive: false }
);
