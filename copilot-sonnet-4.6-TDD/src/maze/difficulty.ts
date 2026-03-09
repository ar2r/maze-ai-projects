/**
 * Difficulty progression: maps level number → generation + gameplay parameters.
 *
 * Design goals:
 *  - Level 1: small, generous cell size, easy to navigate
 *  - Level 20+: large grid, tight corridors, many loops
 *  - All values clamped to safe ranges so UI never breaks
 */

import type { LevelParams } from '../types';

/** Maximum grid dimension allowed */
const MAX_GRID = 38;
/** Minimum cell size in pixels (world coords before DPI scaling) */
const MIN_CELL = 18;
/** Maximum cell size in pixels */
const MAX_CELL = 64;

/**
 * Returns level parameters for the given 1-based level number.
 */
export function getLevelParams(level: number): LevelParams {
  const l = Math.max(1, level);

  // Grid grows: 5 at level 1 → 38 at level ~25+
  const rawGrid = 5 + Math.floor((l - 1) * 1.4);
  const gridSize = Math.min(rawGrid, MAX_GRID);
  const gridW = gridSize;
  const gridH = gridSize;

  // Cell size shrinks as grid grows (so maze fits in ~600px reference space)
  // cellSize = clamp(600 / gridSize, MIN_CELL, MAX_CELL)
  const rawCell = Math.floor(600 / gridSize);
  const cellSize = Math.max(MIN_CELL, Math.min(rawCell, MAX_CELL));

  // Wall thickness: start at 4px, shrink at higher levels, min 2px
  const wallThickness = Math.max(2, Math.min(4, Math.floor(cellSize / 10)));

  // Loop injection: 0 for levels 1-2, then grows
  const loops = Math.max(0, Math.floor((l - 2) / 3));

  // Player speed (world px/s): starts at 160, grows slightly with level
  const speedPx = Math.min(160 + (l - 1) * 4, 260);

  return { gridW, gridH, cellSize, wallThickness, loops, speedPx };
}
