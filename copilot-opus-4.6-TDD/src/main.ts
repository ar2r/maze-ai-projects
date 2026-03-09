/**
 * Maze Runner — Main Entry Point
 *
 * Orchestrates all game systems: generation, rendering, input, UI, audio.
 */

import type { GameState, Settings, ScreenState } from './types';
import { createRng, createSeed } from './maze/rng';
import { generateMaze } from './maze/generator';
import { extractWallSegments } from './engine/collision';
import { getLevelConfig } from './maze/difficulty';
import { createGameState, initLevelState } from './engine/state';
import { updatePlayer, isAtExit } from './engine/player';
import { updateCamera, type Camera } from './engine/camera';
import { createGameLoop } from './engine/loop';
import { setupCanvas, type CanvasContext } from './render/canvas';
import { createMazeBuffer, renderMazeBuffer, COLORS } from './render/maze-renderer';
import { renderPlayer, renderExit } from './render/player-renderer';
import { renderJoystick } from './render/joystick-renderer';
import { renderHud } from './render/hud-renderer';
import { updateFps, renderDebugOverlay, type DebugInfo } from './render/debug-overlay';
import { createInputManager, type InputManager } from './input/manager';
import { showScreen, updateResultsScreen, setContinueVisible, updateToggle } from './ui/screens';
import { loadData, saveData, saveBestTime, getBestTime } from './storage';
import { formatTime, vibrate } from './utils';
import { playBump, playVictory, playClick, setAudioEnabled } from './audio/synth';

// ============ Initialization ============

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const canvasCtx: CanvasContext = setupCanvas(canvas);
const inputManager: InputManager = createInputManager(canvas);
const gameState: GameState = createGameState();

// Current settings from localStorage
let saveState = loadData();
let settings: Settings = { ...saveState.settings };

// Offscreen maze buffer (recreated each level)
let mazeBuffer: HTMLCanvasElement | null = null;

// Collision flash timer (decays from 1 on hit)
let hitFlash = 0;

// Total render time for animations
let renderTime = 0;

// Camera
let camera: Camera = { x: 0, y: 0 };

// Base seed for this session (timestamp-based for variety)
const sessionBaseSeed = Date.now();

// ============ Level Management ============

function startLevel(level: number, baseSeed?: number): void {
  const config = getLevelConfig(level);
  const seed = createSeed(level, baseSeed ?? sessionBaseSeed);
  const rng = createRng(seed);
  const maze = generateMaze(config.cols, config.rows, rng, config.extraOpenings);
  maze.seed = seed;

  const walls = extractWallSegments(maze, config.cellSize);
  initLevelState(gameState, maze, walls, config, seed);
  gameState.level = level;
  gameState.screen = 'playing';

  // Create offscreen maze buffer
  mazeBuffer = createMazeBuffer(maze, config.cellSize);

  // Reset camera to player position
  const worldW = config.cols * config.cellSize;
  const worldH = config.rows * config.cellSize;
  camera = {
    x: gameState.playerPos.x - canvasCtx.width / 2,
    y: gameState.playerPos.y - canvasCtx.height / 2,
  };
  // Clamp initial camera
  camera = updateCamera(camera, gameState.playerPos.x, gameState.playerPos.y,
    canvasCtx.width, canvasCtx.height, worldW, worldH, 1, 100);

  hitFlash = 0;

  showScreen('playing');
}

function completeLevel(): void {
  if (gameState.isComplete) return;
  gameState.isComplete = true;
  gameState.screen = 'results';

  // Save progress
  const time = gameState.timeElapsed;
  saveBestTime(gameState.level, time);

  saveState = loadData();
  if (gameState.level >= saveState.currentLevel) {
    saveState.currentLevel = gameState.level + 1;
    saveData(saveState);
  }

  // Show results
  const best = getBestTime(gameState.level);
  updateResultsScreen(
    formatTime(time),
    gameState.wallHits,
    best !== null ? formatTime(best) : null,
  );

  showScreen('results');
  playVictory();
}

// ============ Game Loop ============

function update(dt: number): void {
  if (gameState.screen !== 'playing' || gameState.isComplete) return;

  // Get input
  const dir = inputManager.getDirection();
  gameState.inputDir = dir;

  // Update player
  const config = gameState.levelConfig;
  const result = updatePlayer(
    gameState.playerPos,
    dir,
    config.playerSpeed,
    dt,
    gameState.playerRadius,
    gameState.wallSegments,
    config.cols * config.cellSize,
    config.rows * config.cellSize,
  );

  gameState.playerPos = result.pos;

  // Handle wall hit
  if (result.hit) {
    gameState.wallHits++;
    hitFlash = 1;
    if (settings.vibrationEnabled) vibrate(30);
    if (settings.soundEnabled) playBump();
  }

  // Decay hit flash
  hitFlash = Math.max(0, hitFlash - dt * 5);

  // Update timer
  gameState.timeElapsed += dt;

  // Update camera
  const worldW = config.cols * config.cellSize;
  const worldH = config.rows * config.cellSize;
  camera = updateCamera(
    camera,
    gameState.playerPos.x,
    gameState.playerPos.y,
    canvasCtx.width,
    canvasCtx.height,
    worldW,
    worldH,
    dt,
  );

  gameState.cameraX = camera.x;
  gameState.cameraY = camera.y;

  // Update player screen position for mouse follow
  const screenX = gameState.playerPos.x - camera.x;
  const screenY = gameState.playerPos.y - camera.y;
  inputManager.setPlayerScreenPos(screenX, screenY);

  // Check win condition
  if (gameState.maze && isAtExit(gameState.playerPos, gameState.maze.end, config.cellSize)) {
    completeLevel();
  }
}

function render(): void {
  const { ctx } = canvasCtx;
  const w = canvasCtx.width;
  const h = canvasCtx.height;
  const dpr = canvasCtx.dpr;

  renderTime += 1 / 60; // approximate

  // Clear
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w * dpr, h * dpr);

  // Only render maze content if we have a maze
  if (mazeBuffer && gameState.maze) {
    // Draw maze from offscreen buffer
    renderMazeBuffer(ctx, mazeBuffer, camera.x, camera.y, dpr);

    // Draw exit marker
    renderExit(
      ctx,
      gameState.maze.end.x,
      gameState.maze.end.y,
      gameState.levelConfig.cellSize,
      camera.x,
      camera.y,
      dpr,
      renderTime,
    );

    // Draw player
    renderPlayer(
      ctx,
      gameState.playerPos.x,
      gameState.playerPos.y,
      gameState.playerRadius,
      camera.x,
      camera.y,
      dpr,
      hitFlash,
    );

    // Draw joystick if active
    if (inputManager.isJoystickActive()) {
      const base = inputManager.getJoystickBase();
      const knob = inputManager.getJoystickKnob();
      renderJoystick(ctx, base.x, base.y, knob.x, knob.y, dpr);
    }

    // Draw HUD
    if (gameState.screen === 'playing') {
      renderHud(
        ctx,
        gameState.level,
        gameState.timeElapsed,
        gameState.wallHits,
        w,
        h,
        dpr,
      );
    }
  }

  // Debug overlay
  if (settings.debugEnabled && gameState.maze) {
    const fps = updateFps(performance.now());
    const info: DebugInfo = {
      fps,
      seed: gameState.seed,
      gridCols: gameState.levelConfig.cols,
      gridRows: gameState.levelConfig.rows,
      playerX: gameState.playerPos.x,
      playerY: gameState.playerPos.y,
      wallHits: gameState.wallHits,
      cellSize: gameState.levelConfig.cellSize,
    };
    renderDebugOverlay(ctx, info, w, h, dpr);
  }
}

const loop = createGameLoop(update, render);

// ============ UI Event Binding ============

function bindUI(): void {
  // Menu buttons
  document.getElementById('btn-start')?.addEventListener('click', () => {
    playClick();
    // Check if tutorial needs showing
    if (!saveState.tutorialShown) {
      showScreen('tutorial');
    } else {
      startLevel(1);
      loop.start();
    }
  });

  document.getElementById('btn-continue')?.addEventListener('click', () => {
    playClick();
    startLevel(saveState.currentLevel);
    loop.start();
  });

  document.getElementById('btn-settings')?.addEventListener('click', () => {
    playClick();
    showScreen('settings');
  });

  // Tutorial
  document.getElementById('btn-tutorial-ok')?.addEventListener('click', () => {
    playClick();
    saveState.tutorialShown = true;
    saveData(saveState);
    startLevel(1);
    loop.start();
  });

  // Settings
  document.getElementById('toggle-sound')?.addEventListener('click', () => {
    settings.soundEnabled = !settings.soundEnabled;
    updateToggle('toggle-sound', settings.soundEnabled);
    setAudioEnabled(settings.soundEnabled);
    saveState.settings = { ...settings };
    saveData(saveState);
    playClick();
  });

  document.getElementById('toggle-vibration')?.addEventListener('click', () => {
    settings.vibrationEnabled = !settings.vibrationEnabled;
    updateToggle('toggle-vibration', settings.vibrationEnabled);
    saveState.settings = { ...settings };
    saveData(saveState);
    playClick();
  });

  document.getElementById('toggle-debug')?.addEventListener('click', () => {
    settings.debugEnabled = !settings.debugEnabled;
    updateToggle('toggle-debug', settings.debugEnabled);
    saveState.settings = { ...settings };
    saveData(saveState);
    playClick();
  });

  document.getElementById('btn-settings-back')?.addEventListener('click', () => {
    playClick();
    showScreen('menu');
  });

  // Pause
  document.getElementById('pause-btn')?.addEventListener('click', () => {
    if (gameState.screen === 'playing') {
      gameState.screen = 'paused';
      loop.pause();
      showScreen('paused');
      playClick();
    }
  });

  document.getElementById('btn-resume')?.addEventListener('click', () => {
    playClick();
    gameState.screen = 'playing';
    loop.resume();
    showScreen('playing');
  });

  document.getElementById('btn-restart')?.addEventListener('click', () => {
    playClick();
    startLevel(gameState.level);
    loop.resume();
  });

  document.getElementById('btn-pause-menu')?.addEventListener('click', () => {
    playClick();
    loop.stop();
    gameState.screen = 'menu';
    showScreen('menu');
  });

  // Results
  document.getElementById('btn-next')?.addEventListener('click', () => {
    playClick();
    startLevel(gameState.level + 1);
    loop.resume();
  });

  document.getElementById('btn-retry')?.addEventListener('click', () => {
    playClick();
    startLevel(gameState.level);
    loop.resume();
  });

  document.getElementById('btn-results-menu')?.addEventListener('click', () => {
    playClick();
    loop.stop();
    gameState.screen = 'menu';
    showScreen('menu');
  });

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (gameState.screen === 'playing') {
        gameState.screen = 'paused';
        loop.pause();
        showScreen('paused');
      } else if (gameState.screen === 'paused') {
        gameState.screen = 'playing';
        loop.resume();
        showScreen('playing');
      }
    }
  });
}

// ============ Resize Handling ============

function handleResize(): void {
  canvasCtx.resize();
}

window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', () => {
  // Delay to let browser settle orientation
  setTimeout(handleResize, 100);
});

// Handle tab visibility — pause game when tab hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden && gameState.screen === 'playing') {
    gameState.screen = 'paused';
    loop.pause();
    showScreen('paused');
  }
});

// ============ Boot ============

function init(): void {
  // Apply saved settings to UI toggles
  updateToggle('toggle-sound', settings.soundEnabled);
  updateToggle('toggle-vibration', settings.vibrationEnabled);
  updateToggle('toggle-debug', settings.debugEnabled);
  setAudioEnabled(settings.soundEnabled);

  // Show continue button if player has progress
  setContinueVisible(saveState.currentLevel > 1);

  bindUI();
  showScreen('menu');

  // Start the render loop (updates only run when playing)
  loop.start();
}

init();
