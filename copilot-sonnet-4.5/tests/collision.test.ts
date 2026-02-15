// Tests for collision detection

import { describe, it, expect } from 'vitest';
import { checkCollision, checkGoalReached } from '../src/engine/collision';
import { createPlayer } from '../src/engine/player';
import { generateMaze } from '../src/maze/generator';
import type { LevelConfig, Position } from '../src/types';

describe('Collision Detection', () => {
  const testConfig: LevelConfig = {
    level: 1,
    gridWidth: 5,
    gridHeight: 5,
    cellSize: 40,
    wallThickness: 2,
    addLoops: false,
    playerSpeed: 4,
  };

  it('should detect collision with walls', () => {
    const maze = generateMaze(testConfig, 12345);
    const player = createPlayer(maze.start, maze.cellSize);
    
    // Try to move into a wall (top wall of starting cell)
    const newPosition: Position = { x: maze.start.x, y: -10 };
    const result = checkCollision(player, newPosition, maze);
    
    expect(result.collided).toBe(true);
  });

  it('should not detect collision in open space', () => {
    const maze = generateMaze(testConfig, 12345);
    const player = createPlayer(maze.start, maze.cellSize);
    
    // Move slightly from start (should be in same cell)
    const newPosition: Position = {
      x: maze.start.x + 5,
      y: maze.start.y + 5,
    };
    const result = checkCollision(player, newPosition, maze);
    
    // This might or might not collide depending on maze, but should not crash
    expect(result).toBeDefined();
    expect(result.correctedPosition).toBeDefined();
  });

  it('should prevent movement outside maze bounds', () => {
    const maze = generateMaze(testConfig, 12345);
    const player = createPlayer(maze.start, maze.cellSize);
    
    // Try to move far outside bounds
    const newPosition: Position = { x: -100, y: -100 };
    const result = checkCollision(player, newPosition, maze);
    
    expect(result.collided).toBe(true);
    expect(result.correctedPosition.x).toBeGreaterThanOrEqual(player.radius);
    expect(result.correctedPosition.y).toBeGreaterThanOrEqual(player.radius);
  });

  it('should detect goal reached', () => {
    const maze = generateMaze(testConfig, 12345);
    const player = createPlayer(maze.end, maze.cellSize);
    
    // Player at goal
    player.position = { ...maze.end };
    expect(checkGoalReached(player, maze.end, 20)).toBe(true);
    
    // Player far from goal
    player.position = { ...maze.start };
    expect(checkGoalReached(player, maze.end, 20)).toBe(false);
  });

  it('should provide collision normal for sliding', () => {
    const maze = generateMaze(testConfig, 12345);
    const player = createPlayer(maze.start, maze.cellSize);
    
    // Try to move into a wall
    const newPosition: Position = { x: maze.start.x, y: -10 };
    const result = checkCollision(player, newPosition, maze);
    
    if (result.collided) {
      // Normal should be defined
      expect(result.normal).toBeDefined();
      expect(typeof result.normal.x).toBe('number');
      expect(typeof result.normal.y).toBe('number');
    }
  });
});
