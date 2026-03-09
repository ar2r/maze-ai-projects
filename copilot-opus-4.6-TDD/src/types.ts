// ===== Maze Types =====

/** 2D vector */
export interface Vec2 {
  x: number;
  y: number;
}

/** Cardinal directions */
export type Direction = 'top' | 'right' | 'bottom' | 'left';

/** All four walls of a cell */
export interface CellWalls {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

/** A single cell in the maze grid */
export interface Cell {
  row: number;
  col: number;
  walls: CellWalls;
  visited: boolean; // used during generation
}

/** The maze grid */
export interface Maze {
  cols: number;
  rows: number;
  cells: Cell[][];      // [row][col]
  start: Vec2;          // cell coordinates {x: col, y: row}
  end: Vec2;            // cell coordinates {x: col, y: row}
  seed: number;
  solutionLength: number; // BFS shortest path length
}

/** A wall segment (line) for collision detection */
export interface WallSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// ===== Difficulty =====

export interface LevelConfig {
  level: number;
  cols: number;
  rows: number;
  cellSize: number;        // pixel size of one cell
  playerRadius: number;    // player circle radius in pixels
  playerSpeed: number;     // pixels per second
  extraOpenings: number;   // false loops / extra passages
}

// ===== Game State =====

export type ScreenState = 'menu' | 'playing' | 'paused' | 'results' | 'settings' | 'tutorial';

export interface GameState {
  screen: ScreenState;
  level: number;
  seed: number;
  maze: Maze | null;
  wallSegments: WallSegment[];

  // Player
  playerPos: Vec2;         // pixel coordinates
  playerRadius: number;

  // Input vector (normalized direction, -1..1 each axis)
  inputDir: Vec2;

  // Stats
  timeElapsed: number;     // seconds
  wallHits: number;
  isComplete: boolean;

  // Config
  levelConfig: LevelConfig;

  // Camera
  cameraX: number;
  cameraY: number;
}

// ===== Settings =====

export interface Settings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  debugEnabled: boolean;
}

// ===== Storage =====

export interface SaveData {
  currentLevel: number;
  bestTimes: Record<number, number>;  // level -> best time in seconds
  settings: Settings;
  tutorialShown: boolean;
}

// ===== RNG =====

/** A seedable pseudo-random number generator function. Returns 0..1 */
export type RngFn = () => number;

// ===== Input =====

export interface InputState {
  direction: Vec2;     // normalized -1..1
  isActive: boolean;   // is user providing any input
}
