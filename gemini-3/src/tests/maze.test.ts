import { describe, it, expect } from 'vitest';
import { Maze, Wall } from '../game/MazeGenerator';

describe('Maze Generator', () => {
  it('should generate a maze of correct dimensions', () => {
    const maze = new Maze(10, 10, 123);
    expect(maze.grid.length).toBe(10);
    expect(maze.grid[0].length).toBe(10);
  });

  it('should have all cells visited (guarantees connectivity in backtracker)', () => {
    const maze = new Maze(5, 5, 456);
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        expect(maze.grid[y][x].visited).toBe(true);
      }
    }
  });

  it('should have boundaries (outer walls should mostly exist)', () => {
    const maze = new Maze(5, 5, 789);
    // Top boundary of top cells should be Wall.TOP
    for (let x = 0; x < 5; x++) {
      expect(maze.grid[0][x].walls & Wall.TOP).toBeTruthy();
      expect(maze.grid[4][x].walls & Wall.BOTTOM).toBeTruthy();
    }
  });

  it('should be deterministic with same seed', () => {
    const maze1 = new Maze(10, 10, 101);
    const maze2 = new Maze(10, 10, 101);
    expect(maze1.grid).toEqual(maze2.grid);
  });
});
