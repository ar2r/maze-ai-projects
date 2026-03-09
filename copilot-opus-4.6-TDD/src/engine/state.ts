import type { GameState, ScreenState, Maze, WallSegment, LevelConfig, Vec2 } from '../types';

/**
 * Create initial game state.
 */
export function createGameState(): GameState {
  return {
    screen: 'menu',
    level: 1,
    seed: 0,
    maze: null,
    wallSegments: [],
    playerPos: { x: 0, y: 0 },
    playerRadius: 8,
    inputDir: { x: 0, y: 0 },
    timeElapsed: 0,
    wallHits: 0,
    isComplete: false,
    levelConfig: {
      level: 1,
      cols: 5,
      rows: 5,
      cellSize: 40,
      playerRadius: 8,
      playerSpeed: 120,
      extraOpenings: 0,
    },
    cameraX: 0,
    cameraY: 0,
  };
}

/**
 * Initialize game state for a new level.
 */
export function initLevelState(
  state: GameState,
  maze: Maze,
  walls: WallSegment[],
  config: LevelConfig,
  seed: number,
): void {
  state.maze = maze;
  state.wallSegments = walls;
  state.levelConfig = config;
  state.seed = seed;
  state.playerRadius = config.playerRadius;

  // Place player at center of start cell
  state.playerPos = {
    x: maze.start.x * config.cellSize + config.cellSize / 2,
    y: maze.start.y * config.cellSize + config.cellSize / 2,
  };

  // Reset stats
  state.timeElapsed = 0;
  state.wallHits = 0;
  state.isComplete = false;
  state.inputDir = { x: 0, y: 0 };

  // Reset camera
  state.cameraX = 0;
  state.cameraY = 0;
}
