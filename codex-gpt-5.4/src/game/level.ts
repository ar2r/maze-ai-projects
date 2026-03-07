import { getLevelConfig } from './config';
import { generateMaze } from './maze';
import type { LevelState, PlayerState } from './types';

export function createSessionSeed(now = Date.now()): string {
  return now.toString(36);
}

export function buildLevel(levelNumber: number, sessionSeed: string): LevelState {
  const config = getLevelConfig(levelNumber, sessionSeed);
  const maze = generateMaze(config);
  return { config, maze };
}

export function createPlayer(level: LevelState): PlayerState {
  return {
    position: {
      x: level.maze.startCell.x + 0.5,
      y: level.maze.startCell.y + 0.5
    },
    velocity: { x: 0, y: 0 },
    radius: level.config.playerRadius,
    lastSafePosition: {
      x: level.maze.startCell.x + 0.5,
      y: level.maze.startCell.y + 0.5
    },
    wallHits: 0,
    collisionCooldownMs: 0
  };
}
