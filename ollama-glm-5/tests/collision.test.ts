import { describe, it, expect, beforeEach } from 'vitest';
import { CollisionSystem } from '../src/core/collision';
import { MazeGenerator } from '../src/core/maze';
import { Player, Maze } from '../src/core/types';

describe('CollisionSystem', () => {
  const collision = new CollisionSystem();
  const generator = new MazeGenerator();
  let maze: Maze;

  beforeEach(() => {
    maze = generator.generate(10, 10, 12345, 30);
  });

  describe('checkPlayerWallCollision', () => {
    it('should not collide when player is in valid position', () => {
      const player: Player = {
        x: maze.startX,
        y: maze.startY,
        radius: 5,
        speed: 100
      };

      const result = collision.checkPlayerWallCollision(player, maze);
      expect(result.collided).toBe(false);
    });

    it('should detect collision with boundary walls', () => {
      const player: Player = {
        x: -5, // Outside maze bounds
        y: maze.startY,
        radius: 8,
        speed: 100
      };

      const result = collision.checkPlayerWallCollision(player, maze);
      expect(result.collided).toBe(true);
      expect(result.correctionX).toBeGreaterThan(0);
    });

    it('should detect collision with right boundary', () => {
      const mazeWidth = maze.width * maze.cellSize;
      const player: Player = {
        x: mazeWidth + 10, // Outside maze bounds
        y: maze.startY,
        radius: 8,
        speed: 100
      };

      const result = collision.checkPlayerWallCollision(player, maze);
      expect(result.collided).toBe(true);
    });

    it('should detect collision with bottom boundary', () => {
      const mazeHeight = maze.height * maze.cellSize;
      const player: Player = {
        x: maze.startX,
        y: mazeHeight + 10, // Outside maze bounds
        radius: 8,
        speed: 100
      };

      const result = collision.checkPlayerWallCollision(player, maze);
      expect(result.collided).toBe(true);
    });
  });

  describe('resolveCollision', () => {
    it('should return corrected position', () => {
      const player: Player = {
        x: 50,
        y: 50,
        radius: 8,
        speed: 100
      };

      const collisionResult = {
        collided: true,
        correctionX: -10,
        correctionY: 5,
        wallHit: true
      };

      const newPosition = collision.resolveCollision(player, collisionResult);
      expect(newPosition.x).toBe(40);
      expect(newPosition.y).toBe(55);
    });
  });

  describe('checkWin', () => {
    it('should detect when player reaches end', () => {
      const player: Player = {
        x: maze.endX,
        y: maze.endY,
        radius: 8,
        speed: 100
      };

      const result = collision.checkWin(player, maze);
      expect(result).toBe(true);
    });

    it('should not detect win when player is far from end', () => {
      const player: Player = {
        x: maze.startX,
        y: maze.startY,
        radius: 8,
        speed: 100
      };

      const result = collision.checkWin(player, maze);
      expect(result).toBe(false);
    });

    it('should detect win when player is near end', () => {
      const player: Player = {
        x: maze.endX - 5,
        y: maze.endY - 5,
        radius: 8,
        speed: 100
      };

      const result = collision.checkWin(player, maze);
      expect(result).toBe(true);
    });
  });

  describe('sliding along walls', () => {
    it('should allow sliding along walls', () => {
      // Position player against a wall and try to slide
      const player: Player = {
        x: 10, // Close to left wall
        y: maze.cellSize / 2,
        radius: 8,
        speed: 100
      };

      // Move diagonally into the wall
      player.x = 5; // Very close to wall

      const result = collision.checkPlayerWallCollision(player, maze);

      // Should have correction for X but Y should be fine
      expect(result.correctionX).toBeGreaterThan(0);
    });
  });
});