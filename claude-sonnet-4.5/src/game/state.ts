// === Game State Manager ===

import type { GameState, GameStats, Maze, Player } from '../types';
import { generateMaze } from '../maze/generator';
import { isReachable } from '../maze/validator';
import { createPlayer } from './player';
import { createSeed } from '../utils/random';
import { storage } from '../utils/storage';

export class GameStateManager {
  private currentState: GameState = 'menu';
  private currentLevel: number = 1;
  private currentMaze: Maze | null = null;
  private player: Player | null = null;
  private stats: GameStats = {
    startTime: 0,
    elapsedTime: 0,
    wallHits: 0,
    completed: false,
  };

  private screenWidth: number = 800;
  private screenHeight: number = 600;

  constructor(screenWidth: number, screenHeight: number) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  // === State Management ===

  getState(): GameState {
    return this.currentState;
  }

  setState(state: GameState): void {
    this.currentState = state;
  }

  // === Level Management ===

  getCurrentLevel(): number {
    return this.currentLevel;
  }

  setLevel(level: number): void {
    this.currentLevel = level;
  }

  startLevel(level: number): void {
    this.currentLevel = level;
    this.generateMaze();
    this.resetStats();
    this.currentState = 'playing';
  }

  nextLevel(): void {
    this.currentLevel++;
    storage.setCurrentLevel(this.currentLevel);
    this.startLevel(this.currentLevel);
  }

  retryLevel(): void {
    this.startLevel(this.currentLevel);
  }

  // === Maze Management ===

  private generateMaze(): void {
    const seed = createSeed(this.currentLevel);

    let maze = generateMaze(
      this.currentLevel,
      seed,
      this.screenWidth,
      this.screenHeight
    );

    // Ensure maze is reachable (regenerate if not)
    let attempts = 0;
    while (!isReachable(maze) && attempts < 10) {
      console.warn('Maze not reachable, regenerating...');
      const newSeed = createSeed(this.currentLevel, Date.now() + attempts);
      maze = generateMaze(
        this.currentLevel,
        newSeed,
        this.screenWidth,
        this.screenHeight
      );
      attempts++;
    }

    if (!isReachable(maze)) {
      console.error('Failed to generate reachable maze after 10 attempts');
      // Fallback: use a very simple maze
      maze = generateMaze(1, seed, this.screenWidth, this.screenHeight);
    }

    this.currentMaze = maze;
    this.player = createPlayer(maze.start);
  }

  getMaze(): Maze | null {
    return this.currentMaze;
  }

  getPlayer(): Player | null {
    return this.player;
  }

  // === Stats Management ===

  private resetStats(): void {
    this.stats = {
      startTime: Date.now(),
      elapsedTime: 0,
      wallHits: 0,
      completed: false,
    };
  }

  updateElapsedTime(): void {
    if (this.currentState === 'playing' && !this.stats.completed) {
      this.stats.elapsedTime = Date.now() - this.stats.startTime;
    }
  }

  incrementWallHits(): void {
    this.stats.wallHits++;
  }

  getStats(): GameStats {
    return { ...this.stats };
  }

  completeLevel(): void {
    this.stats.completed = true;

    // Save progress
    const timeInSeconds = Math.floor(this.stats.elapsedTime / 1000);
    storage.saveLevelProgress(this.currentLevel, {
      bestTime: timeInSeconds,
      wallHits: this.stats.wallHits,
      timestamp: Date.now(),
    });

    storage.addPlayTime(timeInSeconds);

    this.currentState = 'results';
  }

  // === Screen Management ===

  updateScreenSize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  // === Reset ===

  reset(): void {
    this.currentState = 'menu';
    this.currentLevel = 1;
    this.currentMaze = null;
    this.player = null;
    this.resetStats();
  }

  loadSavedProgress(): void {
    const savedLevel = storage.getCurrentLevel();
    this.currentLevel = savedLevel;
  }
}
