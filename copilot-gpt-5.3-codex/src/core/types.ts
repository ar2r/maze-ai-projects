export const WALL_N = 1;
export const WALL_E = 2;
export const WALL_S = 4;
export const WALL_W = 8;

export type WallMask = number;

export interface Maze {
  width: number;
  height: number;
  cells: Uint8Array;
  seed: string;
}

export interface LevelConfig {
  level: number;
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  corridorRatio: number;
  extraLoopChance: number;
  roomChance: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface PlayerState {
  x: number;
  y: number;
  radius: number;
  collisions: number;
}

export interface RunStats {
  startedAt: number;
  elapsedMs: number;
  collisions: number;
}

export type ControlMode = 'drag' | 'joystick';

export interface Settings {
  controlMode: ControlMode;
  vibration: boolean;
  sound: boolean;
  debugOverlay: boolean;
}

export interface ProgressData {
  currentLevel: number;
  bestTimesByLevel: Record<number, number>;
  sessionSeedBase: string;
}
