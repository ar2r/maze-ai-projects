// === Core Types ===

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  dx: number;
  dy: number;
}

export interface Cell {
  row: number;
  col: number;
  walls: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
  visited: boolean;
}

export interface Maze {
  grid: Cell[][];
  width: number;
  height: number;
  cellSize: number;
  start: Position;
  finish: Position;
  seed: number;
}

export interface Player {
  position: Position;
  velocity: Velocity;
  radius: number;
  speed: number;
}

export interface GameStats {
  startTime: number;
  elapsedTime: number;
  wallHits: number;
  completed: boolean;
}

export interface LevelProgress {
  level: number;
  bestTime: number | null;
  wallHits: number;
  timestamp: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  controlMode: 'auto' | 'mouse' | 'keyboard' | 'joystick';
  debugMode: boolean;
}

export interface SaveData {
  currentLevel: number;
  bestLevel: number;
  totalPlayTime: number;
  levelProgress: Record<number, LevelProgress>;
  settings: GameSettings;
  version: string;
}

export type GameState =
  | 'menu'
  | 'playing'
  | 'paused'
  | 'results'
  | 'settings';

export interface InputState {
  keyboard: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  };
  mouse: {
    active: boolean;
    target: Position;
  };
  joystick: {
    active: boolean;
    angle: number;
    magnitude: number;
  };
}

export interface DebugInfo {
  fps: number;
  level: number;
  mazeSize: { width: number; height: number };
  seed: number;
  playerPos: Position;
  collisionCount: number;
}
