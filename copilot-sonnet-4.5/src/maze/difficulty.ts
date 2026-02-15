// Difficulty scaling and level configuration

import type { LevelConfig } from '../types';

export function getLevelConfig(level: number): LevelConfig {
  // Base configuration
  const baseConfig: LevelConfig = {
    level,
    gridWidth: 10,
    gridHeight: 15,
    cellSize: 40,
    wallThickness: 3,
    addLoops: false,
    playerSpeed: 4,
  };

  // Difficulty progression
  if (level <= 5) {
    // Easy: Small mazes, wide corridors
    return {
      ...baseConfig,
      gridWidth: 10 + level,
      gridHeight: 15 + level,
      cellSize: 40,
      wallThickness: 3,
      playerSpeed: 4,
    };
  } else if (level <= 10) {
    // Medium: Larger mazes, narrower corridors
    return {
      ...baseConfig,
      gridWidth: 15 + (level - 5),
      gridHeight: 20 + (level - 5),
      cellSize: 35,
      wallThickness: 2.5,
      playerSpeed: 4.5,
    };
  } else if (level <= 15) {
    // Hard: Big mazes, narrow corridors, loops start appearing
    return {
      ...baseConfig,
      gridWidth: 20 + (level - 10),
      gridHeight: 25 + (level - 10),
      cellSize: 28,
      wallThickness: 2,
      addLoops: level >= 12,
      playerSpeed: 5,
    };
  } else if (level <= 20) {
    // Very hard: Huge mazes, very narrow corridors, loops
    return {
      ...baseConfig,
      gridWidth: 25 + (level - 15),
      gridHeight: 30 + (level - 15),
      cellSize: 24,
      wallThickness: 1.5,
      addLoops: true,
      playerSpeed: 5.5,
    };
  } else {
    // Extreme: Maximum difficulty
    const extraLevels = level - 20;
    return {
      ...baseConfig,
      gridWidth: Math.min(30 + Math.floor(extraLevels / 2), 50),
      gridHeight: Math.min(35 + Math.floor(extraLevels / 2), 60),
      cellSize: Math.max(20 - Math.floor(extraLevels / 5), 15),
      wallThickness: Math.max(1.5 - extraLevels * 0.05, 1),
      addLoops: true,
      playerSpeed: Math.min(6 + extraLevels * 0.1, 8),
    };
  }
}

export function getDifficultyLabel(level: number): string {
  if (level <= 5) return 'Easy';
  if (level <= 10) return 'Medium';
  if (level <= 15) return 'Hard';
  if (level <= 20) return 'Very Hard';
  return 'Extreme';
}

export function getExpectedTime(level: number): number {
  // Rough estimate in seconds
  const config = getLevelConfig(level);
  const cellCount = config.gridWidth * config.gridHeight;
  return Math.floor((cellCount * 0.5) / config.playerSpeed);
}
