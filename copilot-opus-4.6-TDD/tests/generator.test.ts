import { describe, it, expect } from 'vitest';
import { generateMaze, createGrid } from '../src/maze/generator';
import { createRng } from '../src/maze/rng';
import type { Cell } from '../src/types';

describe('Maze Generator', () => {
  describe('createGrid', () => {
    it('should create a grid of the correct size', () => {
      const grid = createGrid(5, 7);
      expect(grid.length).toBe(7); // rows
      expect(grid[0].length).toBe(5); // cols
    });

    it('should initialize all walls as present', () => {
      const grid = createGrid(3, 3);
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          expect(grid[r][c].walls.top).toBe(true);
          expect(grid[r][c].walls.right).toBe(true);
          expect(grid[r][c].walls.bottom).toBe(true);
          expect(grid[r][c].walls.left).toBe(true);
        }
      }
    });

    it('should set correct row/col for each cell', () => {
      const grid = createGrid(4, 3);
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          expect(grid[r][c].row).toBe(r);
          expect(grid[r][c].col).toBe(c);
        }
      }
    });

    it('should mark all cells as not visited', () => {
      const grid = createGrid(3, 3);
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          expect(grid[r][c].visited).toBe(false);
        }
      }
    });
  });

  describe('generateMaze', () => {
    it('should return a maze with correct dimensions', () => {
      const rng = createRng(42);
      const maze = generateMaze(5, 5, rng);
      expect(maze.cols).toBe(5);
      expect(maze.rows).toBe(5);
      expect(maze.cells.length).toBe(5);
      expect(maze.cells[0].length).toBe(5);
    });

    it('should have start and end positions', () => {
      const rng = createRng(42);
      const maze = generateMaze(5, 5, rng);
      expect(maze.start).toBeDefined();
      expect(maze.end).toBeDefined();
      expect(maze.start.x).toBeGreaterThanOrEqual(0);
      expect(maze.start.x).toBeLessThan(5);
      expect(maze.start.y).toBeGreaterThanOrEqual(0);
      expect(maze.start.y).toBeLessThan(5);
    });

    it('should produce a fully connected maze (all cells reachable)', () => {
      const rng = createRng(42);
      const maze = generateMaze(10, 10, rng);

      // BFS from (0,0) to check connectivity
      const visited = new Set<string>();
      const queue: [number, number][] = [[0, 0]];
      visited.add('0,0');

      while (queue.length > 0) {
        const [r, c] = queue.shift()!;
        const cell = maze.cells[r][c];

        // Check each direction
        if (!cell.walls.top && r > 0 && !visited.has(`${r - 1},${c}`)) {
          visited.add(`${r - 1},${c}`);
          queue.push([r - 1, c]);
        }
        if (!cell.walls.right && c < maze.cols - 1 && !visited.has(`${r},${c + 1}`)) {
          visited.add(`${r},${c + 1}`);
          queue.push([r, c + 1]);
        }
        if (!cell.walls.bottom && r < maze.rows - 1 && !visited.has(`${r + 1},${c}`)) {
          visited.add(`${r + 1},${c}`);
          queue.push([r + 1, c]);
        }
        if (!cell.walls.left && c > 0 && !visited.has(`${r},${c - 1}`)) {
          visited.add(`${r},${c - 1}`);
          queue.push([r, c - 1]);
        }
      }

      expect(visited.size).toBe(10 * 10);
    });

    it('should produce a perfect maze (no loops in base maze)', () => {
      const rng = createRng(123);
      const maze = generateMaze(8, 8, rng, 0); // 0 extra openings

      // A perfect maze of N cells has exactly N-1 passages
      let passageCount = 0;
      for (let r = 0; r < maze.rows; r++) {
        for (let c = 0; c < maze.cols; c++) {
          // Count only right and bottom to avoid double-counting
          if (!maze.cells[r][c].walls.right && c < maze.cols - 1) passageCount++;
          if (!maze.cells[r][c].walls.bottom && r < maze.rows - 1) passageCount++;
        }
      }

      const totalCells = maze.rows * maze.cols;
      expect(passageCount).toBe(totalCells - 1);
    });

    it('should maintain boundary walls (outer walls intact)', () => {
      const rng = createRng(42);
      const maze = generateMaze(6, 6, rng);

      // Top row should have top walls
      for (let c = 0; c < 6; c++) {
        expect(maze.cells[0][c].walls.top).toBe(true);
      }
      // Bottom row should have bottom walls
      for (let c = 0; c < 6; c++) {
        expect(maze.cells[5][c].walls.bottom).toBe(true);
      }
      // Left column should have left walls
      for (let r = 0; r < 6; r++) {
        expect(maze.cells[r][0].walls.left).toBe(true);
      }
      // Right column should have right walls
      for (let r = 0; r < 6; r++) {
        expect(maze.cells[r][5].walls.right).toBe(true);
      }
    });

    it('should be deterministic - same seed produces same maze', () => {
      const maze1 = generateMaze(7, 7, createRng(555));
      const maze2 = generateMaze(7, 7, createRng(555));

      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          expect(maze1.cells[r][c].walls).toEqual(maze2.cells[r][c].walls);
        }
      }
      expect(maze1.start).toEqual(maze2.start);
      expect(maze1.end).toEqual(maze2.end);
    });

    it('should have wall consistency between adjacent cells', () => {
      const rng = createRng(42);
      const maze = generateMaze(8, 8, rng);

      for (let r = 0; r < maze.rows; r++) {
        for (let c = 0; c < maze.cols; c++) {
          // If cell has no right wall, right neighbor should have no left wall
          if (c < maze.cols - 1) {
            expect(maze.cells[r][c].walls.right).toBe(maze.cells[r][c + 1].walls.left);
          }
          // If cell has no bottom wall, bottom neighbor should have no top wall
          if (r < maze.rows - 1) {
            expect(maze.cells[r][c].walls.bottom).toBe(maze.cells[r + 1][c].walls.top);
          }
        }
      }
    });

    it('should add extra openings when requested', () => {
      const rng1 = createRng(42);
      const mazeNoExtra = generateMaze(8, 8, rng1, 0);

      const rng2 = createRng(42);
      const mazeWithExtra = generateMaze(8, 8, rng2, 5);

      // Count passages in both
      let passages1 = 0;
      let passages2 = 0;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (!mazeNoExtra.cells[r][c].walls.right && c < 7) passages1++;
          if (!mazeNoExtra.cells[r][c].walls.bottom && r < 7) passages1++;
          if (!mazeWithExtra.cells[r][c].walls.right && c < 7) passages2++;
          if (!mazeWithExtra.cells[r][c].walls.bottom && r < 7) passages2++;
        }
      }

      expect(passages2).toBeGreaterThan(passages1);
    });

    it('should work with minimal 2x2 maze', () => {
      const rng = createRng(1);
      const maze = generateMaze(2, 2, rng);
      expect(maze.cols).toBe(2);
      expect(maze.rows).toBe(2);
      // Should still be connected
      expect(maze.solutionLength).toBeGreaterThanOrEqual(1);
    });

    it('should work with non-square mazes', () => {
      const rng = createRng(77);
      const maze = generateMaze(3, 10, rng);
      expect(maze.cols).toBe(3);
      expect(maze.rows).toBe(10);
      expect(maze.solutionLength).toBeGreaterThanOrEqual(1);
    });

    it('start and end should be different cells', () => {
      const rng = createRng(42);
      const maze = generateMaze(5, 5, rng);
      expect(maze.start).not.toEqual(maze.end);
    });
  });
});
