// Global type definitions for Maze Game

export interface Position {
  x: number;
  y: number;
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Cell {
  x: number;
  y: number;
  visited: boolean;
  walls: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
}

export interface Maze {
  width: number;
  height: number;
  cells: Cell[][];
  seed: number;
  start: Position;
  end: Position;
}

export interface Player {
  position: Position;
  velocity: Vector2;
  radius: number;
  speed: number;
  collisionCount: number;
}

export interface DifficultyConfig {
  width: number;
  height: number;
  loopChance: number;
  cellSize: number;
}

export type GameScreen = 'menu' | 'game' | 'paused' | 'results' | 'settings';

export interface GameState {
  screen: GameScreen;
  level: number;
  startTime: number;
  elapsedTime: number;
  isPlaying: boolean;
  maze: Maze | null;
  player: Player | null;
}

export interface SaveData {
  currentLevel: number;
  bestTimes: Record<number, number>;
  settings: {
    sound: boolean;
    vibration: boolean;
    controlMode: 'auto' | 'drag' | 'joystick';
  };
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  pointer: Position | null;
  pointerActive: boolean;
}

export interface RenderConfig {
  cellSize: number;
  wallThickness: number;
  playerRadius: number;
  colors: {
    background: string;
    wall: string;
    player: string;
    start: string;
    end: string;
    path: string;
  };
}
