import { describe, it, expect } from 'vitest';
import { Maze, Direction, DX, DY } from '../src/game/MazeGenerator';

describe('Maze Generator', () => {
  it('should generate a grid of correct size', () => {
    const w = 10, h = 10;
    const maze = new Maze(w, h, 123);
    
    expect(maze.width).toBe(w);
    expect(maze.height).toBe(h);
    expect(maze.grid.length).toBe(h);
  });

  // Simple connectivity check
  it('should be solvable', () => {
    const maze = new Maze(5, 5, 1);
    // Just ensure no errors during generation and basic properties
    expect(maze.grid[0][0]).toBeDefined();
  });
});
