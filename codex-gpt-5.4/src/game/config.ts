import type { LevelConfig, SettingsState } from './types';
import { clamp } from '../utils/math';

export const STORAGE_PROGRESS_KEY = 'mazeGame.progress';
export const STORAGE_SETTINGS_KEY = 'mazeGame.settings';
export const BASE_CANVAS_PADDING = 24;
export const MAX_UPDATE_STEP_MS = 33;
export const FIXED_TIME_STEP_MS = 1000 / 120;

export const DEFAULT_SETTINGS: SettingsState = {
  vibrationEnabled: true,
  soundEnabled: true,
  preferredControlMode: 'drag',
  debugEnabled: false
};

export function getLevelConfig(level: number, sessionSeed: string): LevelConfig {
  const normalizedLevel = Math.max(1, level);
  const gridWidth = Math.min(8 + Math.floor((normalizedLevel - 1) * 0.9), 24);
  const gridHeight = Math.min(8 + Math.floor((normalizedLevel - 1) * 0.75), 22);
  const wallThicknessRatio = clamp(0.16 - normalizedLevel * 0.004, 0.07, 0.16);
  const playerRadius = clamp(0.22 - normalizedLevel * 0.0025, 0.12, 0.22);
  const playerSpeed = clamp(2.6 + normalizedLevel * 0.035, 2.6, 4.4);
  const pointerAcceleration = clamp(14 + normalizedLevel * 0.2, 14, 24);
  const seed = `level:${normalizedLevel}|session:${sessionSeed}`;

  return {
    level: normalizedLevel,
    gridWidth,
    gridHeight,
    wallThicknessRatio,
    playerRadius,
    playerSpeed,
    pointerAcceleration,
    seed
  };
}
