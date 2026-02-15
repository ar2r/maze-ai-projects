// Shared types for the maze game

/** 2D point or vector */
export interface Vec2 {
  x: number;
  y: number;
}

/** Wall flags for a cell (bitfield) */
export const enum Wall {
  NONE = 0,
  NORTH = 1,
  EAST = 2,
  SOUTH = 4,
  WEST = 8,
  ALL = 15,
}

/** Single maze cell */
export interface Cell {
  x: number;
  y: number;
  walls: number; // Wall bitfield
  visited: boolean;
}

/** Maze data structure */
export interface MazeData {
  width: number;
  height: number;
  cells: Cell[][];
  start: Vec2;
  end: Vec2;
  seed: number;
}

/** Player state */
export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

/** Game settings */
export interface Settings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showTimer: boolean;
}

/** Saved progress */
export interface SaveData {
  currentLevel: number;
  bestTimes: Record<number, number>; // level -> time in ms
  settings: Settings;
}

/** Game state enum */
export const enum GameState {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  RESULTS = 'results',
  SETTINGS = 'settings',
}

/** Input direction vector */
export interface InputState {
  dx: number; // -1 to 1
  dy: number; // -1 to 1
  active: boolean;
}

/** Level config */
export interface LevelConfig {
  level: number;
  width: number;
  height: number;
  cellSize: number;
  wallThickness: number;
  playerSpeed: number;
}

/** Collision result */
export interface CollisionResult {
  collided: boolean;
  newX: number;
  newY: number;
  hitCount: number;
}

/** Debug info */
export interface DebugInfo {
  fps: number;
  seed: number;
  mazeSize: string;
  playerPos: string;
  hitCount: number;
}
