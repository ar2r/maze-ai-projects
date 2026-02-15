// Tests for maze generation

import { describe, it, expect } from 'vitest';
import { generateMaze } from '../src/maze/generator';
import { validateMaze } from '../src/maze/validator';
import type { LevelConfig } from '../src/types';

describe('Maze Generator', () => {
  const testConfig: LevelConfig = {
    level: 1,
    gridWidth: 10,
    gridHeight: 10,
    cellSize: 40,
    wallThickness: 2,
    addLoops: false,
    playerSpeed: 4,
  };

  it('should generate a maze with correct dimensions', () => {
    const maze = generateMaze(testConfig, 12345);
    
    expect(maze.width).toBe(10);
    expect(maze.height).toBe(10);
    expect(maze.cells).toHaveLength(10);
    expect(maze.cells[0]).toHaveLength(10);
  });

  it('should generate a connected maze', () => {
    const maze = generateMaze(testConfig, 12345);
    const validation = validateMaze(maze);
    
    expect(validation.isConnected).toBe(true);
    expect(validation.pathLength).toBeGreaterThan(0);
  });

  it('should generate deterministic mazes with same seed', () => {
    const maze1 = generateMaze(testConfig, 99999);
    const maze2 = generateMaze(testConfig, 99999);
    
    // Check that walls are identical
    for (let row = 0; row < maze1.height; row++) {
      for (let col = 0; col < maze1.width; col++) {
        const cell1 = maze1.cells[row][col];
        const cell2 = maze2.cells[row][col];
        
        expect(cell1.walls.top).toBe(cell2.walls.top);
        expect(cell1.walls.right).toBe(cell2.walls.right);
        expect(cell1.walls.bottom).toBe(cell2.walls.bottom);
        expect(cell1.walls.left).toBe(cell2.walls.left);
      }
    }
  });

  it('should generate different mazes with different seeds', () => {
    const maze1 = generateMaze(testConfig, 111);
    const maze2 = generateMaze(testConfig, 222);
    
    let differences = 0;
    for (let row = 0; row < maze1.height; row++) {
      for (let col = 0; col < maze1.width; col++) {
        const cell1 = maze1.cells[row][col];
        const cell2 = maze2.cells[row][col];
        
        if (
          cell1.walls.top !== cell2.walls.top ||
          cell1.walls.right !== cell2.walls.right ||
          cell1.walls.bottom !== cell2.walls.bottom ||
          cell1.walls.left !== cell2.walls.left
        ) {
          differences++;
        }
      }
    }
    
    expect(differences).toBeGreaterThan(0);
  });

  it('should have start and end positions within bounds', () => {
    const maze = generateMaze(testConfig, 54321);
    
    expect(maze.start.x).toBeGreaterThanOrEqual(0);
    expect(maze.start.x).toBeLessThanOrEqual(maze.width * maze.cellSize);
    expect(maze.start.y).toBeGreaterThanOrEqual(0);
    expect(maze.start.y).toBeLessThanOrEqual(maze.height * maze.cellSize);
    
    expect(maze.end.x).toBeGreaterThanOrEqual(0);
    expect(maze.end.x).toBeLessThanOrEqual(maze.width * maze.cellSize);
    expect(maze.end.y).toBeGreaterThanOrEqual(0);
    expect(maze.end.y).toBeLessThanOrEqual(maze.height * maze.cellSize);
  });

  it('should create longer paths as maze size increases', () => {
    const smallConfig = { ...testConfig, gridWidth: 5, gridHeight: 5 };
    const largeConfig = { ...testConfig, gridWidth: 20, gridHeight: 20 };
    
    const smallMaze = generateMaze(smallConfig, 777);
    const largeMaze = generateMaze(largeConfig, 777);
    
    const smallValidation = validateMaze(smallMaze);
    const largeValidation = validateMaze(largeMaze);
    
    expect(largeValidation.pathLength).toBeGreaterThan(smallValidation.pathLength);
  });
});
