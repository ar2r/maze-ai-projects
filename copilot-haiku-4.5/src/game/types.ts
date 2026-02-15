// ============================================================================
// Game Types and Interfaces
// ============================================================================

/** Vector 2D position */
export interface Vec2 {
  x: number;
  y: number;
}

/** AABB Collision box */
export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A single cell in the maze grid */
export interface MazeCell {
  x: number;
  y: number;
  walls: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
  visited?: boolean;
}

/** The maze grid structure */
export interface Maze {
  width: number;    // cells count
  height: number;   // cells count
  cellSize: number; // pixels
  cells: MazeCell[];
  start: Vec2;      // cell indices
  end: Vec2;        // cell indices
  seed: number;
}

/** Player state */
export interface Player {
  pos: Vec2;        // world position (pixels)
  vel: Vec2;        // velocity
  radius: number;   // collision radius
  targetPos?: Vec2; // for mouse following
}

/** Input state */
export interface InputState {
  keyboard: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  };
  mouse: Vec2;
  mousePressed: boolean;
  touch: Vec2 | null;
  touchPressed: boolean;
}

/** Level result */
export interface LevelResult {
  levelNumber: number;
  timeMs: number;
  wallHits: number;
  movementDistance: number;
}

/** Game state values */
export const GameState = {
  MENU: 'menu' as const,
  PLAYING: 'playing' as const,
  PAUSED: 'paused' as const,
  LEVEL_COMPLETE: 'level_complete' as const,
  SETTINGS: 'settings' as const,
} as const;

export type GameState = (typeof GameState)[keyof typeof GameState];

/** Main game state */
export interface GameStateData {
  state: GameState;
  currentLevel: number;
  score: {
    timeMs: number;
    wallHits: number;
    movementDistance: number;
  };
  maze: Maze | null;
  player: Player | null;
  input: InputState;
  settings: GameSettings;
  levelResult?: LevelResult;
  isPaused: boolean;
}

/** Game settings */
export interface GameSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  controlMode: 'mouse-follow' | 'wasd' | 'joystick' | 'drag';
  difficulty: 'easy' | 'normal' | 'hard';
  showDebugOverlay: boolean;
}

/** Difficulty configuration */
export interface DifficultyConfig {
  gridSize: {
    width: number;
    height: number;
  };
  cellSize: number;
  playerRadius: number;
  wallThickness: number;
}
