// === Game Engine - Main Loop ===

import type { DebugInfo } from '../types';
import { GameStateManager } from './state';
import { InputManager } from './input';
import { updatePlayer } from './player';
import { isInFinishZone } from './collision';
import { storage } from '../utils/storage';

export class GameEngine {
  private stateManager: GameStateManager;
  private inputManager: InputManager;
  private lastFrameTime: number = 0;
  private running: boolean = false;
  private animationFrameId: number = 0;

  // Debug info
  private debugInfo: DebugInfo = {
    fps: 60,
    level: 1,
    mazeSize: { width: 0, height: 0 },
    seed: 0,
    playerPos: { x: 0, y: 0 },
    collisionCount: 0,
  };

  private fpsCounter: number[] = [];
  private lastCollisionTime: number = 0;

  // Callbacks
  private onStateChange?: (state: string) => void;
  private onStatsUpdate?: () => void;
  private onCollision?: () => void;
  private onLevelComplete?: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    width: number,
    height: number
  ) {
    this.stateManager = new GameStateManager(width, height);
    this.inputManager = new InputManager(canvas, storage.getSettings());
  }

  // === Lifecycle ===

  start(): void {
    if (this.running) return;

    this.running = true;
    this.lastFrameTime = performance.now();
    this.loop(this.lastFrameTime);
  }

  stop(): void {
    this.running = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  // === Main Game Loop ===

  private loop = (currentTime: number): void => {
    if (!this.running) return;

    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Update FPS
    this.updateFPS(deltaTime);

    // Update game state
    if (this.stateManager.getState() === 'playing') {
      this.update(deltaTime);
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(deltaTime: number): void {
    const player = this.stateManager.getPlayer();
    const maze = this.stateManager.getMaze();

    if (!player || !maze) return;

    // Update elapsed time
    this.stateManager.updateElapsedTime();

    // Get input state
    const input = this.inputManager.getState();

    // Update player
    const { hitWall } = updatePlayer(player, input, maze, deltaTime);

    // Handle wall collision
    if (hitWall) {
      const now = Date.now();
      // Debounce collision events (max 1 per 100ms)
      if (now - this.lastCollisionTime > 100) {
        this.stateManager.incrementWallHits();
        this.debugInfo.collisionCount++;
        this.lastCollisionTime = now;

        if (this.onCollision) {
          this.onCollision();
        }
      }
    }

    // Check if reached finish
    if (isInFinishZone(player.position, maze, player.radius)) {
      this.completeLevel();
    }

    // Update debug info
    this.updateDebugInfo();

    // Notify stats update
    if (this.onStatsUpdate) {
      this.onStatsUpdate();
    }
  }

  private updateFPS(deltaTime: number): void {
    const fps = 1000 / deltaTime;
    this.fpsCounter.push(fps);

    if (this.fpsCounter.length > 60) {
      this.fpsCounter.shift();
    }

    const avgFps = this.fpsCounter.reduce((a, b) => a + b, 0) / this.fpsCounter.length;
    this.debugInfo.fps = Math.round(avgFps);
  }

  private updateDebugInfo(): void {
    const player = this.stateManager.getPlayer();
    const maze = this.stateManager.getMaze();

    if (player && maze) {
      this.debugInfo.level = this.stateManager.getCurrentLevel();
      this.debugInfo.mazeSize = { width: maze.width, height: maze.height };
      this.debugInfo.seed = maze.seed;
      this.debugInfo.playerPos = { ...player.position };
    }
  }

  // === Game Actions ===

  startNewGame(): void {
    this.stateManager.setLevel(1);
    this.stateManager.startLevel(1);
    this.inputManager.reset();
    this.debugInfo.collisionCount = 0;
    this.notifyStateChange();
  }

  continueGame(): void {
    this.stateManager.loadSavedProgress();
    const level = this.stateManager.getCurrentLevel();
    this.stateManager.startLevel(level);
    this.inputManager.reset();
    this.debugInfo.collisionCount = 0;
    this.notifyStateChange();
  }

  pauseGame(): void {
    this.stateManager.setState('paused');
    this.notifyStateChange();
  }

  resumeGame(): void {
    this.stateManager.setState('playing');
    this.notifyStateChange();
  }

  restartLevel(): void {
    this.stateManager.retryLevel();
    this.inputManager.reset();
    this.debugInfo.collisionCount = 0;
    this.notifyStateChange();
  }

  nextLevel(): void {
    this.stateManager.nextLevel();
    this.inputManager.reset();
    this.debugInfo.collisionCount = 0;
    this.notifyStateChange();
  }

  returnToMenu(): void {
    this.stateManager.reset();
    this.inputManager.reset();
    this.notifyStateChange();
  }

  private completeLevel(): void {
    this.stateManager.completeLevel();
    this.notifyStateChange();

    if (this.onLevelComplete) {
      this.onLevelComplete();
    }
  }

  // === Getters ===

  getStateManager(): GameStateManager {
    return this.stateManager;
  }

  getInputManager(): InputManager {
    return this.inputManager;
  }

  getDebugInfo(): DebugInfo {
    return { ...this.debugInfo };
  }

  // === Settings ===

  updateSettings(): void {
    const settings = storage.getSettings();
    this.inputManager.updateSettings(settings);
  }

  // === Callbacks ===

  onStateChangeCallback(callback: (state: string) => void): void {
    this.onStateChange = callback;
  }

  onStatsUpdateCallback(callback: () => void): void {
    this.onStatsUpdate = callback;
  }

  onCollisionCallback(callback: () => void): void {
    this.onCollision = callback;
  }

  onLevelCompleteCallback(callback: () => void): void {
    this.onLevelComplete = callback;
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.stateManager.getState());
    }
  }

  // === Cleanup ===

  destroy(): void {
    this.stop();
    this.inputManager.destroy();
  }
}
