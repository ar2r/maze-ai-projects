export const DIR_N = 1;
export const DIR_E = 2;
export const DIR_S = 4;
export const DIR_W = 8;

export type ScreenState = 'menu' | 'running' | 'paused' | 'results' | 'settings';
export type ControlMode = 'drag' | 'hybrid';

export interface Point {
  x: number;
  y: number;
}

export interface MazeCell {
  passages: number;
}

export interface WallSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  orientation: 'vertical' | 'horizontal';
}

export interface MazeData {
  width: number;
  height: number;
  cells: MazeCell[];
  wallSegments: WallSegment[];
  startCell: Point;
  finishCell: Point;
  seed: string;
  optimalPathLength: number;
}

export interface LevelConfig {
  level: number;
  gridWidth: number;
  gridHeight: number;
  wallThicknessRatio: number;
  playerRadius: number;
  playerSpeed: number;
  pointerAcceleration: number;
  seed: string;
}

export interface LevelState {
  config: LevelConfig;
  maze: MazeData;
}

export interface PlayerState {
  position: Point;
  velocity: Point;
  radius: number;
  lastSafePosition: Point;
  wallHits: number;
  collisionCooldownMs: number;
}

export interface InputState {
  pointerActive: boolean;
  pointerWorld: Point;
  keyboardX: number;
  keyboardY: number;
}

export interface CollisionResult {
  collided: boolean;
  stuck: boolean;
}

export interface LevelResult {
  level: number;
  timeMs: number;
  wallHits: number;
  seed: string;
  bestTimeMs: number;
  improvedBest: boolean;
}

export interface ProgressState {
  currentLevel: number;
  sessionSeed: string;
  bestTimesByLevel: Record<string, number>;
}

export interface SettingsState {
  vibrationEnabled: boolean;
  soundEnabled: boolean;
  preferredControlMode: ControlMode;
  debugEnabled: boolean;
}

export interface GameSessionState {
  screen: ScreenState;
  progress: ProgressState;
  settings: SettingsState;
  level: LevelState | null;
  player: PlayerState | null;
  startedAtMs: number;
  elapsedBeforePauseMs: number;
  result: LevelResult | null;
}

export interface ViewportInfo {
  widthPx: number;
  heightPx: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface MazeValidationResult {
  isConnected: boolean;
  hasClosedPerimeter: boolean;
  reachableCells: number;
  optimalPathLength: number;
}
