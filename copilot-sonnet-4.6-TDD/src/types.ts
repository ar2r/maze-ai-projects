/**
 * Shared type definitions for Maze Runner.
 * Every module imports from here to keep the type system consistent.
 */

// ─── RNG ─────────────────────────────────────────────────────────────────────

/** A callable that returns a float in [0, 1) */
export type RNGFn = () => number;

// ─── Maze ─────────────────────────────────────────────────────────────────────

/**
 * A single cell in the maze grid.
 * Walls are stored as booleans: true = wall present (blocked), false = open (carved).
 */
export interface Cell {
  /** Column index (0-based) */
  x: number;
  /** Row index (0-based) */
  y: number;
  wallN: boolean; // north wall (top edge)
  wallE: boolean; // east wall  (right edge)
  wallS: boolean; // south wall (bottom edge)
  wallW: boolean; // west wall  (left edge)
  visited: boolean;
}

/** The full maze data model */
export interface MazeData {
  width: number;        // number of cells horizontally
  height: number;       // number of cells vertically
  cells: Cell[][];      // [row][col] — cells[y][x]
  seed: number;
  cellSize: number;     // rendered pixel size of each cell (before DPI scaling)
  wallThickness: number;// pixel thickness of walls
  optimalPathLength: number; // BFS shortest path (in cells)
}

// ─── Difficulty ──────────────────────────────────────────────────────────────

export interface LevelParams {
  gridW: number;
  gridH: number;
  cellSize: number;
  wallThickness: number;
  loops: number; // number of extra passages to carve (loop injection)
  speedPx: number; // player speed in pixels/second (world coords)
}

// ─── Player ──────────────────────────────────────────────────────────────────

export interface PlayerState {
  /** World x position (pixels) */
  x: number;
  /** World y position (pixels) */
  y: number;
  /** Radius in world pixels */
  radius: number;
  /** Velocity vector (pixels/second) */
  vx: number;
  vy: number;
  /** Running count of wall collisions this level */
  wallHits: number;
}

// ─── Input ───────────────────────────────────────────────────────────────────

/** Normalised direction vector; both components in [-1, 1] */
export interface InputVector {
  x: number;
  y: number;
}

// ─── Game state machine ───────────────────────────────────────────────────────

export type GamePhase =
  | 'MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'RESULTS'
  | 'SETTINGS';

export interface GameState {
  phase: GamePhase;
  level: number;
  /** Seed for reproducibility (stored between retries) */
  seed: number;
  maze: MazeData | null;
  player: PlayerState | null;
  /** Elapsed time in ms since level started (excludes paused time) */
  elapsedMs: number;
  /** Timestamp of last un-pause (performance.now()) */
  lastTimestamp: number;
}

// ─── Persistence ─────────────────────────────────────────────────────────────

export interface SaveData {
  currentLevel: number;
  userSeed: number;
  bestTimes: Record<number, number>; // level number → best time ms
  settings: AppSettings;
}

export interface AppSettings {
  sound: boolean;
  vibration: boolean;
  /** 'mouse' | 'keyboard' */
  controlMode: 'mouse' | 'keyboard';
}

// ─── Wall segments (for collision) ───────────────────────────────────────────

/**
 * An axis-aligned wall segment (line from p1 to p2).
 * Used by the collision engine.
 */
export interface WallSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// ─── Debug ───────────────────────────────────────────────────────────────────

export interface DebugInfo {
  fps: number;
  seed: number;
  gridW: number;
  gridH: number;
  playerCell: { x: number; y: number };
  collisions: number;
  renderMs: number;
}
