import type { LevelConfig } from './types';

export function getLevelConfig(level: number): LevelConfig {
  const safeLevel = Math.max(1, level);
  const gridWidth = Math.min(12 + safeLevel * 2, 54);
  const gridHeight = Math.min(8 + Math.floor(safeLevel * 1.6), 40);
  const baseCell = Math.max(34 - safeLevel * 0.7, 14);
  const corridorRatio = Math.max(0.72 - safeLevel * 0.012, 0.38);

  return {
    level: safeLevel,
    gridWidth,
    gridHeight,
    cellSize: baseCell,
    corridorRatio,
    extraLoopChance: Math.min(0.02 + safeLevel * 0.01, 0.16),
    roomChance: Math.min(0.01 + safeLevel * 0.004, 0.07)
  };
}
