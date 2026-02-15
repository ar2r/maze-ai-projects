import type { LevelConfig } from '../types';

/**
 * Level difficulty progression.
 * Maze grows, corridors shrink, player slightly smaller/faster.
 */
export function getLevelConfig(level: number): LevelConfig {
  // Maze size grows: starts 6x6, grows ~2 per level, capped at 40
  const base = 6;
  const growth = Math.floor(level * 1.8);
  const cols = Math.min(base + growth, 40);
  const rows = Math.min(base + growth, 40);

  // Cell size shrinks with larger mazes, but has a floor
  const cellSize = Math.max(18, 50 - level * 2.5);

  // Player radius relative to cell
  const playerRadius = Math.max(4, cellSize * 0.25);

  // Speed increases slightly with level
  const playerSpeed = Math.min(250 + level * 8, 400);

  return { level, cols, rows, cellSize, playerRadius, playerSpeed };
}
