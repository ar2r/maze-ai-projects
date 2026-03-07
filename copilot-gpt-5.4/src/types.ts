export type ControlMode = 'auto' | 'mouse' | 'drag' | 'joystick';
export type ScreenState = 'menu' | 'playing' | 'paused' | 'results';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MazeCell {
  x: number;
  y: number;
  walls: {
    north: boolean;
    east: boolean;
    south: boolean;
    west: boolean;
  };
}

export interface MazeData {
  cols: number;
  rows: number;
  cells: MazeCell[];
  startIndex: number;
  finishIndex: number;
  solutionLength: number;
  seed: string;
}

export interface LevelConfig {
  level: number;
  cols: number;
  rows: number;
  wallThickness: number;
  playerRadius: number;
  speed: number;
  minSolutionLength: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  controlMode: ControlMode;
  debugOverlay: boolean;
}

export interface ProgressData {
  currentLevel: number;
  bestTimes: Record<string, number>;
  sessionSeedBase: string;
}

export interface LevelResult {
  level: number;
  elapsedMs: number;
  wallHits: number;
  bestTimeMs: number;
  seed: string;
}

export interface ViewportTransform {
  cssWidth: number;
  cssHeight: number;
  pixelWidth: number;
  pixelHeight: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  worldWidth: number;
  worldHeight: number;
  dpr: number;
}

export interface RenderDebugData {
  fps: number;
  seed: string;
  grid: string;
  player: string;
  wallHits: number;
  control: string;
}

export interface UiSnapshot {
  screen: ScreenState;
  level: number;
  elapsedMs: number;
  wallHits: number;
  canContinue: boolean;
  result: LevelResult | null;
  helpText: string;
  settings: GameSettings;
  showJoystick: boolean;
  statusText: string;
}
