export type ControlMode = 'auto' | 'drag' | 'joystick';

export interface Point {
  x: number;
  y: number;
}

export interface MazeCell {
  x: number;
  y: number;
}

export interface MazeData {
  cols: number;
  rows: number;
  cells: Uint8Array;
  start: MazeCell;
  finish: MazeCell;
  seed: number;
  shortestPath: number;
  distancesFromStart: Int32Array;
}

export interface LevelConfig {
  level: number;
  cols: number;
  rows: number;
  seed: number;
  wallThicknessPx: number;
  playerRadius: number;
  moveSpeed: number;
  extraOpenings: number;
}

export interface GameSettings {
  controlMode: ControlMode;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface PersistedState {
  hasProgress: boolean;
  currentLevel: number;
  baseSeed: number;
  bestTimes: Record<string, number>;
  settings: GameSettings;
  debugEnabled: boolean;
}

export interface HudSnapshot {
  level: number;
  timeMs: number;
  collisions: number;
  progress: number;
  seed: number;
}

export interface LevelResult {
  level: number;
  seed: number;
  timeMs: number;
  collisions: number;
  shortestPath: number;
}
