import type { LevelConfig } from '../types';
import { clamp } from '../utils';

/**
 * Calculate maze and gameplay parameters for a given level.
 *
 * Progression:
 * - Maze size grows from 5x5 (level 1) up to ~35x35 (cap ~level 40+)
 * - Cell size decreases from 40px to 20px minimum
 * - Extra openings (false loops) appear from level 5+
 * - Player speed increases slightly to compensate for larger mazes
 */
export function getLevelConfig(level: number): LevelConfig {
  // Maze dimensions: grow with level, capped at 35
  const cols = clamp(Math.floor(4 + level * 1.0), 5, 35);
  const rows = clamp(Math.floor(4 + level * 1.0), 5, 35);

  // Cell size in pixels: shrinks as maze grows, min 20px for touch comfort
  const cellSize = clamp(Math.floor(44 - level * 0.8), 20, 44);

  // Player radius: ~30% of cell size, at least 4px
  const playerRadius = clamp(Math.floor(cellSize * 0.3), 4, 16);

  // Player speed (pixels/sec): base 120, grows slightly
  const playerSpeed = clamp(120 + level * 3, 120, 250);

  // Extra openings (false loops): start from level 5
  const extraOpenings = level >= 5 ? Math.floor((level - 4) * 0.8) : 0;

  return {
    level,
    cols,
    rows,
    cellSize,
    playerRadius,
    playerSpeed,
    extraOpenings,
  };
}
