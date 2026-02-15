// ============================================================================
// Game State Management
// ============================================================================

import { GameState } from './types';
import type {
  GameStateData,
  GameSettings,
  DifficultyConfig,
  Player,
  Maze,
} from './types';

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  controlMode: 'mouse-follow',
  difficulty: 'normal',
  showDebugOverlay: false,
};

const DIFFICULTY_CONFIGS: Record<'easy' | 'normal' | 'hard', DifficultyConfig> = {
  easy: {
    gridSize: { width: 8, height: 8 },
    cellSize: 60,
    playerRadius: 8,
    wallThickness: 2,
  },
  normal: {
    gridSize: { width: 12, height: 12 },
    cellSize: 40,
    playerRadius: 6,
    wallThickness: 2,
  },
  hard: {
    gridSize: { width: 16, height: 16 },
    cellSize: 30,
    playerRadius: 5,
    wallThickness: 2,
  },
};

export class GameStateManager {
  private state: GameStateData;

  constructor() {
    this.state = {
      state: GameState.MENU,
      currentLevel: 1,
      score: {
        timeMs: 0,
        wallHits: 0,
        movementDistance: 0,
      },
      maze: null,
      player: null,
      input: {
        keyboard: { up: false, down: false, left: false, right: false },
        mouse: { x: 0, y: 0 },
        mousePressed: false,
        touch: null,
        touchPressed: false,
      },
      settings: { ...DEFAULT_SETTINGS },
      isPaused: false,
    };
  }

  getState(): GameStateData {
    return this.state;
  }

  setState(newState: Partial<GameStateData>): void {
    this.state = { ...this.state, ...newState };
  }

  setGameState(gameState: GameState): void {
    this.state.state = gameState;
  }

  setMaze(maze: Maze): void {
    this.state.maze = maze;
  }

  setPlayer(player: Player): void {
    this.state.player = player;
  }

  setCurrentLevel(level: number): void {
    this.state.currentLevel = Math.max(1, level);
  }

  updateScore(
    timeMs: number,
    wallHits: number,
    movementDistance: number
  ): void {
    this.state.score = { timeMs, wallHits, movementDistance };
  }

  addWallHit(): void {
    this.state.score.wallHits++;
  }

  setSettings(settings: Partial<GameSettings>): void {
    this.state.settings = { ...this.state.settings, ...settings };
  }

  getSettings(): GameSettings {
    return this.state.settings;
  }

  getDifficultyConfig(difficulty: 'easy' | 'normal' | 'hard'): DifficultyConfig {
    return DIFFICULTY_CONFIGS[difficulty];
  }

  getLevelDifficultyConfig(level: number): DifficultyConfig {
    // Scale difficulty based on level
    const config = DIFFICULTY_CONFIGS['normal'];
    const scale = 1 + Math.floor((level - 1) / 3) * 0.3;
    return {
      gridSize: {
        width: Math.min(20, Math.floor(config.gridSize.width + (level - 1) * 0.5)),
        height: Math.min(20, Math.floor(config.gridSize.height + (level - 1) * 0.5)),
      },
      cellSize: Math.max(20, Math.floor(config.cellSize / scale)),
      playerRadius: Math.max(4, Math.floor(config.playerRadius / scale)),
      wallThickness: config.wallThickness,
    };
  }

  togglePause(): void {
    this.state.isPaused = !this.state.isPaused;
  }

  setPaused(paused: boolean): void {
    this.state.isPaused = paused;
  }

  resetScore(): void {
    this.state.score = {
      timeMs: 0,
      wallHits: 0,
      movementDistance: 0,
    };
  }
}
