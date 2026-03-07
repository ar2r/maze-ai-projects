import { describe, expect, it } from 'vitest';
import { resolveMovement } from '../game/collision';
import type { MazeData, PlayerState } from '../game/types';

const maze: MazeData = {
  width: 2,
  height: 2,
  cells: [{ passages: 0 }, { passages: 0 }, { passages: 0 }, { passages: 0 }],
  wallSegments: [
    { x1: 1, y1: 0, x2: 1, y2: 2, orientation: 'vertical' },
    { x1: 0, y1: 1, x2: 2, y2: 1, orientation: 'horizontal' }
  ],
  startCell: { x: 0, y: 0 },
  finishCell: { x: 1, y: 1 },
  seed: 'test',
  optimalPathLength: 2
};

function createPlayer(): PlayerState {
  return {
    position: { x: 0.6, y: 0.5 },
    velocity: { x: 0, y: 0 },
    radius: 0.2,
    lastSafePosition: { x: 0.6, y: 0.5 },
    wallHits: 0,
    collisionCooldownMs: 0
  };
}

describe('collision resolution', () => {
  it('prevents moving through a wall', () => {
    const player = createPlayer();
    const result = resolveMovement(player, maze, 1, 0);

    expect(result.collided).toBe(true);
    expect(player.position.x).toBeLessThan(0.81);
  });

  it('slides along a wall instead of freezing both axes', () => {
    const player = createPlayer();
    player.position.y = 0.65;
    player.lastSafePosition.y = 0.65;
    const result = resolveMovement(player, maze, 0.8, 0.3);

    expect(result.collided).toBe(true);
    expect(player.position.x).toBeLessThan(0.81);
    expect(player.position.y).toBeGreaterThan(0.65);
  });

  it('breaks large movement into steps to avoid tunneling', () => {
    const player = createPlayer();
    const result = resolveMovement(player, maze, 4.5, 0);

    expect(result.collided).toBe(true);
    expect(player.position.x).toBeLessThan(0.81);
  });
});
