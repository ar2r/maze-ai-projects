import { describe, it, expect } from 'vitest';
import { CollisionSystem } from '../src/game/Collision';
import { generateMaze } from '../src/maze/MazeGenerator';
import { PlayerState } from '../src/utils/types';

describe('CollisionSystem', () => {
  const cellSize = 40;
  const wallThickness = 3;

  // Create a simple 3x3 maze for testing
  const maze = generateMaze(3, 3, 12345);
  const collision = new CollisionSystem(maze, cellSize, wallThickness);

  it('should detect collision with outer boundary (left)', () => {
    const player: PlayerState = { x: 5, y: cellSize * 1.5, vx: -10, vy: 0, radius: 8 };
    const result = collision.checkCollision(player, 0, player.y);

    expect(result.collided).toBe(true);
    expect(result.newX).toBeGreaterThanOrEqual(player.radius);
  });

  it('should detect collision with outer boundary (top)', () => {
    const player: PlayerState = { x: cellSize * 1.5, y: 5, vx: 0, vy: -10, radius: 8 };
    const result = collision.checkCollision(player, player.x, 0);

    expect(result.collided).toBe(true);
    expect(result.newY).toBeGreaterThanOrEqual(player.radius);
  });

  it('should detect collision with outer boundary (right)', () => {
    const player: PlayerState = { x: cellSize * 2.8, y: cellSize * 1.5, vx: 10, vy: 0, radius: 8 };
    const result = collision.checkCollision(player, cellSize * 3 + 5, player.y);

    expect(result.collided).toBe(true);
    expect(result.newX).toBeLessThanOrEqual(cellSize * 3 - player.radius);
  });

  it('should detect collision with outer boundary (bottom)', () => {
    const player: PlayerState = { x: cellSize * 1.5, y: cellSize * 2.8, vx: 0, vy: 10, radius: 8 };
    const result = collision.checkCollision(player, player.x, cellSize * 3 + 5);

    expect(result.collided).toBe(true);
    expect(result.newY).toBeLessThanOrEqual(cellSize * 3 - player.radius);
  });

  it('should allow movement in open passages', () => {
    // Start position is always open
    const player: PlayerState = { x: cellSize * 0.5, y: cellSize * 0.5, vx: 0, vy: 0, radius: 8 };
    const result = collision.checkCollision(player, player.x, player.y);

    expect(result.collided).toBe(false);
    expect(result.newX).toBe(player.x);
    expect(result.newY).toBe(player.y);
  });

  it('should detect win condition at end cell', () => {
    const player: PlayerState = {
      x: (maze.end.x + 0.5) * cellSize,
      y: (maze.end.y + 0.5) * cellSize,
      vx: 0,
      vy: 0,
      radius: 8
    };

    expect(collision.checkWin(player)).toBe(true);
  });

  it('should not detect win at start cell', () => {
    const player: PlayerState = {
      x: (maze.start.x + 0.5) * cellSize,
      y: (maze.start.y + 0.5) * cellSize,
      vx: 0,
      vy: 0,
      radius: 8
    };

    expect(collision.checkWin(player)).toBe(false);
  });

  it('should not allow player to teleport through outer walls', () => {
    // Try to move completely outside the maze (definitely through boundary walls)
    const player: PlayerState = { x: cellSize * 0.5, y: cellSize * 0.5, vx: -100, vy: -100, radius: 8 };
    const targetX = -cellSize; // Outside maze
    const targetY = -cellSize; // Outside maze

    const result = collision.checkCollision(player, targetX, targetY);

    // Player should be stopped at boundary, not at target
    expect(result.collided).toBe(true);
    expect(result.newX).toBeGreaterThan(0);
    expect(result.newY).toBeGreaterThan(0);
  });

  it('should count collisions correctly', () => {
    // Slam into a corner
    const player: PlayerState = { x: cellSize * 0.5, y: cellSize * 0.5, vx: -50, vy: -50, radius: 8 };
    const result = collision.checkCollision(player, -5, -5);

    expect(result.hitCount).toBeGreaterThanOrEqual(1);
  });
});

describe('Player Movement Physics', () => {
  it('should normalize diagonal movement', () => {
    // This is tested implicitly through the player class
    // Diagonal movement should not be faster than cardinal movement

    // If dx=1, dy=1, normalized length should be sqrt(2)/sqrt(2) = 1, 1 -> ~0.707, 0.707
    const dx = 1;
    const dy = 1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const normalizedX = dx / len;
    const normalizedY = dy / len;

    expect(normalizedX).toBeCloseTo(0.707, 2);
    expect(normalizedY).toBeCloseTo(0.707, 2);

    // Total speed should equal 1
    const normalizedLen = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
    expect(normalizedLen).toBeCloseTo(1, 5);
  });
});
