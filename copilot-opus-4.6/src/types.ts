// ─── Shared Types ───

export interface Vec2 {
  x: number;
  y: number;
}

/** Each cell knows which walls are open (removed) */
export interface Cell {
  row: number;
  col: number;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  visited: boolean;
}

export interface MazeData {
  cols: number;
  rows: number;
  cells: Cell[][];
  start: Vec2;
  end: Vec2;
  seed: number;
  solutionLength: number;
}

export interface LevelConfig {
  level: number;
  cols: number;
  rows: number;
  cellSize: number;
  playerRadius: number;
  playerSpeed: number;
}

export type GameState = 'menu' | 'playing' | 'paused' | 'results';

export type ControlMode = 'auto' | 'mouse' | 'keyboard' | 'joystick';

export interface GameSettings {
  sound: boolean;
  vibration: boolean;
  controlMode: ControlMode;
  debug: boolean;
}

export interface SaveData {
  currentLevel: number;
  bestTimes: Record<number, number>;
}

export interface InputState {
  direction: Vec2;
  active: boolean;
}

export interface LevelResult {
  time: number;
  wallHits: number;
  level: number;
}
