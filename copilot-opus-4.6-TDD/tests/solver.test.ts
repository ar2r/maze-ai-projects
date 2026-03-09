import { describe, it, expect } from 'vitest';
import { solveMaze, isMazeConnected } from '../src/maze/solver';
import { generateMaze } from '../src/maze/generator';
import { createRng } from '../src/maze/rng';

describe('Maze Solver', () => {
  describe('solveMaze (BFS shortest path)', () => {
    it('should find a path from start to end', () => {
      const rng = createRng(42);
      const maze = generateMaze(8, 8, rng);
      const path = solveMaze(maze);
      expect(path).not.toBeNull();
      expect(path!.length).toBeGreaterThan(0);
    });

    it('path should start at maze.start and end at maze.end', () => {
      const rng = createRng(42);
      const maze = generateMaze(6, 6, rng);
      const path = solveMaze(maze)!;
      expect(path[0]).toEqual(maze.start);
      expect(path[path.length - 1]).toEqual(maze.end);
    });

    it('path length should match solutionLength + 1 (including start)', () => {
      const rng = createRng(42);
      const maze = generateMaze(8, 8, rng, 0); // perfect maze
      const path = solveMaze(maze)!;
      // solutionLength is the number of steps (edges), path includes start node
      expect(path.length).toBe(maze.solutionLength + 1);
    });

    it('path should be >= manhattan distance between start and end', () => {
      const rng = createRng(77);
      const maze = generateMaze(10, 10, rng);
      const path = solveMaze(maze)!;
      const manhattan =
        Math.abs(maze.end.x - maze.start.x) + Math.abs(maze.end.y - maze.start.y);
      expect(path.length - 1).toBeGreaterThanOrEqual(manhattan);
    });

    it('consecutive path cells should be adjacent', () => {
      const rng = createRng(99);
      const maze = generateMaze(7, 7, rng);
      const path = solveMaze(maze)!;
      for (let i = 1; i < path.length; i++) {
        const dx = Math.abs(path[i].x - path[i - 1].x);
        const dy = Math.abs(path[i].y - path[i - 1].y);
        expect(dx + dy).toBe(1); // adjacent = one step in cardinal direction
      }
    });

    it('should work with 2x2 maze', () => {
      const rng = createRng(1);
      const maze = generateMaze(2, 2, rng);
      const path = solveMaze(maze);
      expect(path).not.toBeNull();
      expect(path!.length).toBeGreaterThanOrEqual(2);
    });

    it('should work with large mazes', () => {
      const rng = createRng(42);
      const maze = generateMaze(30, 30, rng);
      const path = solveMaze(maze);
      expect(path).not.toBeNull();
      expect(path!.length).toBeGreaterThan(30); // should be much longer than side
    });
  });

  describe('isMazeConnected', () => {
    it('should return true for a valid generated maze', () => {
      const rng = createRng(42);
      const maze = generateMaze(8, 8, rng);
      expect(isMazeConnected(maze)).toBe(true);
    });

    it('should return true for maze with extra openings', () => {
      const rng = createRng(42);
      const maze = generateMaze(8, 8, rng, 10);
      expect(isMazeConnected(maze)).toBe(true);
    });

    it('should return true for various seeds', () => {
      for (let seed = 0; seed < 20; seed++) {
        const rng = createRng(seed);
        const maze = generateMaze(6, 6, rng);
        expect(isMazeConnected(maze)).toBe(true);
      }
    });
  });
});
