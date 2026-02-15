// ============================================================================
// Main Game Loop
// ============================================================================

import { GameState } from './types';
import type { GameStateData, Player } from './types';
import { GameStateManager } from './state';
import { InputSystem } from './input';
import { generateMaze, getMazeWalls } from './maze-gen';
import {
  updatePlayerPhysics,
  movePlayerTowardTarget,
  movePlayerByInput,
  resolveCollision,
  isPlayerAtGoal,
  clampPlayerToBounds,
} from './collision';
import { generateSeed } from '../utils/random';

const PLAYER_SPEED = 4;
const PLAYER_FRICTION = 0.92;

export class GameLoop {
  private stateManager: GameStateManager;
  private inputSystem: InputSystem;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lastFrameTime: number = 0;
  private levelStartTime: number = 0;
  private totalMovementDistance: number = 0;
  private animationId: number = 0;
  private mazeWalls: Array<{ x: number; y: number; w: number; h: number }> = [];

  // Callbacks
  private onLevelComplete?: (result: any) => void;
  private onStateChanged?: (state: GameState) => void;
  private onRender?: (ctx: CanvasRenderingContext2D, state: GameStateData) => void;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.stateManager = new GameStateManager();
    this.inputSystem = new InputSystem(canvas);
  }

  getStateManager(): GameStateManager {
    return this.stateManager;
  }

  getInputSystem(): InputSystem {
    return this.inputSystem;
  }

  setOnLevelComplete(callback: (result: any) => void): void {
    this.onLevelComplete = callback;
  }

  setOnStateChanged(callback: (state: GameState) => void): void {
    this.onStateChanged = callback;
  }

  setOnRender(callback: (ctx: CanvasRenderingContext2D, state: GameStateData) => void): void {
    this.onRender = callback;
  }

  start(): void {
    this.lastFrameTime = performance.now();
    this.animate();
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  startLevel(levelNumber: number): void {
    const config = this.stateManager.getLevelDifficultyConfig(levelNumber);
    const seed = generateSeed(levelNumber, Date.now());
    const maze = generateMaze(
      config.gridSize.width,
      config.gridSize.height,
      config.cellSize,
      seed
    );

    this.stateManager.setCurrentLevel(levelNumber);
    this.stateManager.setMaze(maze);
    this.stateManager.resetScore();

    // Initialize player at start
    const player: Player = {
      pos: {
        x: maze.start.x * maze.cellSize + maze.cellSize / 2,
        y: maze.start.y * maze.cellSize + maze.cellSize / 2,
      },
      vel: { x: 0, y: 0 },
      radius: config.playerRadius,
    };

    this.stateManager.setPlayer(player);
    this.mazeWalls = getMazeWalls(maze);

    this.stateManager.setGameState(GameState.PLAYING);
    this.levelStartTime = performance.now();
    this.totalMovementDistance = 0;

    if (this.onStateChanged) {
      this.onStateChanged(GameState.PLAYING);
    }
  }

  private update(deltaTime: number): void {
    const state = this.stateManager.getState();

    if (state.state !== GameState.PLAYING || !state.maze || !state.player) {
      return;
    }

    const input = this.inputSystem.getInput();
    const player = state.player;
    const maze = state.maze;

    // Update input state
    state.input = input;

    // Movement based on control mode
    const controlMode = state.settings.controlMode;

    if (controlMode === 'mouse-follow' && input.mousePressed) {
      movePlayerTowardTarget(player, input.mouse.x, input.mouse.y, PLAYER_SPEED);
    } else if (controlMode === 'wasd') {
      movePlayerByInput(
        player,
        input.keyboard.up,
        input.keyboard.down,
        input.keyboard.left,
        input.keyboard.right,
        PLAYER_SPEED
      );
    } else if (controlMode === 'drag' && input.touch) {
      movePlayerTowardTarget(player, input.touch.x, input.touch.y, PLAYER_SPEED);
    }

    // Apply friction
    player.vel.x *= PLAYER_FRICTION;
    player.vel.y *= PLAYER_FRICTION;

    // Physics
    updatePlayerPhysics(player, deltaTime);

    // Collision resolution
    const collisionCount = resolveCollision(player, this.mazeWalls, maze);
    if (collisionCount > 0) {
      state.score.wallHits += collisionCount;
    }

    // Track movement distance
    const distance = Math.sqrt(player.vel.x ** 2 + player.vel.y ** 2);
    this.totalMovementDistance += distance;

    // Clamp to bounds
    clampPlayerToBounds(player, maze);

    // Update score
    const elapsedTime = performance.now() - this.levelStartTime;
    state.score.timeMs = elapsedTime;
    state.score.movementDistance = this.totalMovementDistance;

    // Check goal
    if (isPlayerAtGoal(player, maze, 30)) {
      this.completeLevel();
    }
  }

  private completeLevel(): void {
    const state = this.stateManager.getState();
    const result = {
      levelNumber: state.currentLevel,
      timeMs: state.score.timeMs,
      wallHits: state.score.wallHits,
      movementDistance: state.score.movementDistance,
    };

    this.stateManager.setGameState(GameState.LEVEL_COMPLETE);

    if (this.onStateChanged) {
      this.onStateChanged(GameState.LEVEL_COMPLETE);
    }

    if (this.onLevelComplete) {
      this.onLevelComplete(result);
    }
  }

  private animate(): void {
    const now = performance.now();
    const deltaTime = Math.min((now - this.lastFrameTime) / 1000, 0.016); // Cap at 60 FPS
    this.lastFrameTime = now;

    this.update(deltaTime);

    // Render
    const state = this.stateManager.getState();
    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.onRender) {
      this.onRender(this.ctx, state);
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }
}
