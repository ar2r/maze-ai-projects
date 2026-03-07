// Core type definitions

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  vx: number;
  vy: number;
}

export interface Player {
  x: number;
  y: number;
  radius: number;
  speed: number;
}

export interface Walls {
  north: boolean;
  south: boolean;
  east: boolean;
  west: boolean;
}

export interface Cell {
  x: number;
  y: number;
  walls: Walls;
  visited: boolean;
}

export interface Maze {
  width: number;
  height: number;
  cells: Cell[][];
  cellSize: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export type GameStatus = 'menu' | 'playing' | 'paused' | 'won';

export interface GameStats {
  startTime: number;
  elapsedTime: number;
  wallHits: number;
  bestTime: number | null;
}

export interface GameState {
  level: number;
  player: Player;
  maze: Maze | null;
  status: GameStatus;
  stats: GameStats;
}

export interface SaveData {
  currentLevel: number;
  bestTimes: Record<number, number>;
  settings: Settings;
}

export interface Settings {
  sound: boolean;
  vibration: boolean;
  controlMode: 'mouse' | 'follow' | 'joystick';
}

export interface MovementInput {
  x: number; // -1 to 1
  y: number; // -1 to 1
}

export interface CollisionResult {
  collided: boolean;
  correctionX: number;
  correctionY: number;
  wallHit: boolean;
}

export interface LevelConfig {
  width: number;
  height: number;
  loops: number;
}

export function getLevelConfig(level: number): LevelConfig {
  // Progressive difficulty: small simple mazes, growing larger and more complex
  if (level <= 3) {
    // Very easy: 5x5 to 7x7
    return {
      width: 4 + level,
      height: 4 + level,
      loops: 0
    };
  } else if (level <= 6) {
    // Easy: 8x8 to 11x11
    return {
      width: 5 + level,
      height: 5 + level,
      loops: 0
    };
  } else if (level <= 10) {
    // Medium: 12x15 to 16x19
    return {
      width: 5 + level,
      height: 9 + level,
      loops: 0
    };
  } else if (level <= 15) {
    // Hard: 18x22 with loops
    return {
      width: 17 + (level - 10),
      height: 20 + (level - 10),
      loops: level - 10
    };
  } else {
    // Expert: growing mazes with more loops
    return {
      width: 22 + Math.floor((level - 15) * 1.5),
      height: 25 + Math.floor((level - 15) * 1.5),
      loops: 5 + Math.floor((level - 15) * 2)
    };
  }
}