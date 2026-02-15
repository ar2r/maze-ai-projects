// ============================================================================
// Main Entry Point
// ============================================================================

import './styles/main.css';
import { GameLoop } from './game/game-loop';
import { GameState } from './game/types';
import { UIManager } from './ui/menu';
import { CanvasRenderer } from './render/renderer';
import { StorageManager } from './storage/persist';
import { DebugOverlay } from './utils/debug';

// Initialize
const container = document.createElement('div');
container.id = 'game-container';
document.body.appendChild(container);

const canvas = document.createElement('canvas');
canvas.id = 'gameCanvas';
container.appendChild(canvas);

const ctx = canvas.getContext('2d')!;
const gameLoop = new GameLoop(canvas, ctx);
const renderer = new CanvasRenderer(canvas, ctx);
const uiManager = new UIManager();
const debugOverlay = new DebugOverlay();

// Enable debug overlay if URL has ?debug parameter
if (new URLSearchParams(window.location.search).has('debug')) {
  debugOverlay.setEnabled(true);
}

let isPausable = false;

// State machine
const stateManager = gameLoop.getStateManager();

gameLoop.setOnStateChanged((state: GameState) => {
  const savedData = StorageManager.load();
  const currentLevel = stateManager.getState().currentLevel;

  switch (state) {
    case GameState.MENU:
      uiManager.clearUI();
      uiManager.showMainMenu(savedData != null);
      isPausable = false;
      break;

    case GameState.PLAYING:
      uiManager.clearUI();
      isPausable = true;
      break;

    case GameState.LEVEL_COMPLETE:
      isPausable = false;
      const result = stateManager.getState().score;
      const bestTime = StorageManager.getBestTime(currentLevel) ?? undefined;
      StorageManager.saveLevel(currentLevel, result.timeMs);
      uiManager.showLevelComplete(
        currentLevel,
        result.timeMs,
        result.wallHits,
        bestTime
      );
      break;

    case GameState.SETTINGS:
      uiManager.showSettings(stateManager.getSettings());
      break;
  }
});

gameLoop.setOnRender((_renderCtx, gameState) => {
  if (gameState.state === GameState.PLAYING && gameState.maze) {
    renderer.render(gameState);
    uiManager.showHUD(gameState.currentLevel, gameState.score.timeMs);

    if (debugOverlay.isActive()) {
      debugOverlay.updateFPS();
      const fps = debugOverlay.getFPS();
      const pos = gameState.player
        ? `(${gameState.player.pos.x.toFixed(0)},${gameState.player.pos.y.toFixed(0)})`
        : '(0,0)';
      const gridSize = gameState.maze
        ? `${gameState.maze.width}x${gameState.maze.height}`
        : '0x0';

      uiManager.showDebugInfo(
        fps,
        gameState.maze?.seed ?? 0,
        gridSize,
        pos,
        gameState.score.wallHits
      );
    }
  } else {
    renderer.clear();
    uiManager.hideHUD();
    if (debugOverlay.isActive()) {
      uiManager.hideDebugInfo();
    }
  }
});

// UI Callbacks
uiManager.setCallbacks({
  onStartGame: () => {
    StorageManager.clear();
    gameLoop.startLevel(1);
  },

  onContinueGame: () => {
    const currentLevel = StorageManager.getCurrentLevel();
    gameLoop.startLevel(currentLevel);
  },

  onNextLevel: () => {
    const nextLevel = stateManager.getState().currentLevel + 1;
    gameLoop.startLevel(nextLevel);
  },

  onRetryLevel: () => {
    const currentLevel = stateManager.getState().currentLevel;
    gameLoop.startLevel(currentLevel);
  },

  onResumeGame: () => {
    stateManager.setPaused(false);
    stateManager.setGameState(GameState.PLAYING);
    uiManager.clearUI();
  },

  onSettingsChanged: (settings) => {
    stateManager.setSettings(settings);
    StorageManager.saveSettings(stateManager.getSettings());
    uiManager.showMainMenu(true);
  },

  onMenuOpen: () => {
    stateManager.setGameState(GameState.MENU);
  },
});

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (e.key === 'p' && isPausable && stateManager.getState().state === GameState.PLAYING) {
    stateManager.togglePause();
    if (stateManager.getState().isPaused) {
      uiManager.showPauseMenu();
    }
  }

  if (e.key === '~' || e.key === '`') {
    debugOverlay.toggle();
  }
});

// Load saved settings
const savedSettings = StorageManager.loadSettings();
if (savedSettings) {
  stateManager.setSettings(savedSettings);
}

// Handle window resize
window.addEventListener('resize', () => {
  // Canvas will be re-sized by renderer
});

// Prevent pinch zoom on mobile
document.addEventListener(
  'gesturestart',
  (e) => {
    e.preventDefault();
  },
  false
);

// Start the game
stateManager.setGameState(GameState.MENU);
gameLoop.start();

console.log('🎮 Maze Game Started');
console.log('Press P to pause, ~ to toggle debug overlay');
console.log('Use ?debug in URL to enable debug from start');
