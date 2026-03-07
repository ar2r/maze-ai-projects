import type { LevelConfig } from '../types';

export function getLevelConfig(level: number): LevelConfig {
  const safeLevel = Math.max(1, Math.floor(level));
  const cols = Math.min(7 + (safeLevel - 1) * 2, 27);
  const rows = Math.min(7 + Math.floor((safeLevel - 1) * 1.7), 23);
  const wallThickness = Math.max(0.18 - (safeLevel - 1) * 0.004, 0.085);
  const playerRadius = Math.max(0.22 - (safeLevel - 1) * 0.002, 0.14);
  const speed = Math.min(2.7 + (safeLevel - 1) * 0.035, 3.8);
  const minSolutionLength = Math.floor(cols * rows * 0.34 + safeLevel * 2.5);

  return {
    level: safeLevel,
    cols,
    rows,
    wallThickness,
    playerRadius,
    speed,
    minSolutionLength,
  };
}
