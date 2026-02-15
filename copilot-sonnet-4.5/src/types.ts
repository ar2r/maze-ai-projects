// Core type definitions for the maze game

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
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
  width: number;  // number of columns
  height: number; // number of rows
  cells: Cell[][];
  start: Position;
  end: Position;
  seed: number;
  cellSize: number;
  wallThickness: number;
}

export interface Player {
  position: Position;
  velocity: Velocity;
  radius: number;
  speed: number;
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
}

export interface LevelStats {
  level: number;
  time: number;
  collisions: number;
  completed: boolean;
}

export interface GameData {
  currentLevel: number;
  bestTimes: Map<number, number>;
  totalCollisions: number;
  totalPlayTime: number;
  settings: Settings;
}

export interface Settings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  controlMode: 'auto' | 'mouse' | 'keyboard';
  debugMode: boolean;
}

export interface LevelConfig {
  level: number;
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  wallThickness: number;
  addLoops: boolean; // Add false walls to create loops
  playerSpeed: number;
}

export interface InputState {
  mouse: {
    x: number;
    y: number;
    isDown: boolean;
  };
  keyboard: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  };
  touch: {
    active: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  };
}

export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  scale: number; // For HiDPI support
}

export interface DebugInfo {
  fps: number;
  seed: number;
  gridSize: string;
  playerPos: string;
  collisions: number;
  state: string;
}
