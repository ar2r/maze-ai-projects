// === Collision Detection Tests ===

import { describe, it, expect } from 'vitest';
import { checkCollision, isInFinishZone } from '../src/game/collision';
import { generateMaze } from '../src/maze/generator';
import type { Position } from '../src/types';

describe('Collision Detection', () => {
  const createSimpleMaze = () => {
    // Create a simple 5x5 maze for testing
    return generateMaze(1, 12345, 500, 500);
  };

  it('should detect collision with walls', () => {
    const maze = createSimpleMaze();
    const radius = 8;

    // Find a cell with a top wall
    let testCell = null;
    for (let row = 0; row < maze.height; row++) {
      for (let col = 0; col < maze.width; col++) {
        if (maze.grid[row][col].walls.top && row > 0) {
          testCell = { row, col };
          break;
        }
      }
      if (testCell) break;
    }

    if (testCell) {
      const cellX = testCell.col * maze.cellSize + maze.cellSize / 2;
      const cellY = testCell.row * maze.cellSize;

      const currentPos: Position = { x: cellX, y: cellY + 20 };
      const newPos: Position = { x: cellX, y: cellY - 5 }; // Try to move through top wall

      const result = checkCollision(currentPos, newPos, radius, maze);

      // Should detect collision or correct position
      expect(result.collided || result.correctedPosition.y >= cellY).toBe(true);
    }
  });

  it('should keep player within maze bounds', () => {
    const maze = createSimpleMaze();
    const radius = 8;

    const mazeWidth = maze.width * maze.cellSize;
    const mazeHeight = maze.height * maze.cellSize;

    // Test top-left corner
    const currentPos1: Position = { x: 10, y: 10 };
    const newPos1: Position = { x: -10, y: -10 };
    const result1 = checkCollision(currentPos1, newPos1, radius, maze);

    expect(result1.correctedPosition.x).toBeGreaterThanOrEqual(radius);
    expect(result1.correctedPosition.y).toBeGreaterThanOrEqual(radius);

    // Test bottom-right corner
    const currentPos2: Position = { x: mazeWidth - 10, y: mazeHeight - 10 };
    const newPos2: Position = { x: mazeWidth + 10, y: mazeHeight + 10 };
    const result2 = checkCollision(currentPos2, newPos2, radius, maze);

    expect(result2.correctedPosition.x).toBeLessThanOrEqual(mazeWidth - radius);
    expect(result2.correctedPosition.y).toBeLessThanOrEqual(mazeHeight - radius);
  });

  it('should allow movement in open space', () => {
    const maze = createSimpleMaze();
    const radius = 8;

    // Find center of a cell (should be open space)
    const cellX = maze.cellSize / 2;
    const cellY = maze.cellSize / 2;

    const currentPos: Position = { x: cellX, y: cellY };
    const newPos: Position = { x: cellX + 2, y: cellY + 2 }; // Small movement

    const result = checkCollision(currentPos, newPos, radius, maze);

    // Should allow movement (unless there's a wall exactly there, which is unlikely)
    // At minimum, corrected position should be close to intended position
    const distance = Math.hypot(
      result.correctedPosition.x - newPos.x,
      result.correctedPosition.y - newPos.y
    );

    expect(distance).toBeLessThan(radius * 2);
  });

  it('should not allow player to pass through walls', () => {
    const maze = createSimpleMaze();
    const radius = 8;

    // Try to move from start position through the top wall
    const currentPos: Position = { x: maze.cellSize / 2, y: maze.cellSize / 2 };
    const newPos: Position = { x: maze.cellSize / 2, y: -radius };

    const result = checkCollision(currentPos, newPos, radius, maze);

    // Should be blocked or corrected to stay inside
    expect(result.correctedPosition.y).toBeGreaterThanOrEqual(radius);
  });
});

describe('Finish Zone Detection', () => {
  it('should detect when player is in finish zone', () => {
    const maze = generateMaze(1, 12345, 500, 500);
    const radius = 8;

    const playerPos: Position = { ...maze.finish };

    expect(isInFinishZone(playerPos, maze, radius)).toBe(true);
  });

  it('should not detect when player is far from finish', () => {
    const maze = generateMaze(1, 12345, 500, 500);
    const radius = 8;

    const playerPos: Position = { ...maze.start };

    // Assuming start and finish are different
    if (
      Math.hypot(maze.start.x - maze.finish.x, maze.start.y - maze.finish.y) >
      maze.cellSize * 2
    ) {
      expect(isInFinishZone(playerPos, maze, radius)).toBe(false);
    }
  });

  it('should detect when player is near but not exactly at finish', () => {
    const maze = generateMaze(1, 12345, 500, 500);
    const radius = 8;

    const offset = maze.cellSize * 0.2;
    const playerPos: Position = {
      x: maze.finish.x + offset,
      y: maze.finish.y + offset,
    };

    expect(isInFinishZone(playerPos, maze, radius)).toBe(true);
  });
});
