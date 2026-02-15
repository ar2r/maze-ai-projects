import type { LevelConfig } from './types';
import { hashSeed } from './rng';

export function seedForLevel(baseSeed: number, level: number): number {
  const mixed = (baseSeed ^ Math.imul(level + 1, 0x9e3779b1)) >>> 0;
  return hashSeed(mixed);
}

export function createLevelConfig(level: number, baseSeed: number): LevelConfig {
  const levelClamped = Math.max(1, level);
  const size = 8 + Math.floor((levelClamped - 1) * 1.35);
  const cols = Math.min(42, size + (levelClamped % 3 === 0 ? 1 : 0));
  const rows = Math.min(42, size + (levelClamped % 4 === 0 ? 1 : 0));
  const wallThicknessPx = Math.max(2, 8 - Math.floor(levelClamped / 4));

  return {
    level: levelClamped,
    cols,
    rows,
    seed: seedForLevel(baseSeed, levelClamped),
    wallThicknessPx,
    playerRadius: Math.max(0.14, 0.24 - levelClamped * 0.0025),
    moveSpeed: 2.7 + Math.min(2.0, levelClamped * 0.04),
    extraOpenings: 0
  };
}
