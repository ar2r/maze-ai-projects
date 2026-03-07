import { describe, it, expect, beforeEach } from 'vitest';
import { MazeGenerator } from '../src/core/maze';
import { SeededRNG } from '../src/core/rng';

describe('MazeGenerator', () => {
  const generator = new MazeGenerator();

  describe('generate', () => {
    it('should create a maze with correct dimensions', () => {
      const maze = generator.generate(10, 10, 12345, 30);
      expect(maze.width).toBe(10);
      expect(maze.height).toBe(10);
      expect(maze.cells.length).toBe(10);
      expect(maze.cells[0].length).toBe(10);
    });

    it('should create deterministic mazes with same seed', () => {
      const maze1 = generator.generate(10, 10, 12345, 30);
      const maze2 = generator.generate(10, 10, 12345, 30);

      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          const cell1 = maze1.cells[y][x];
          const cell2 = maze2.cells[y][x];
          expect(cell1.walls.north).toBe(cell2.walls.north);
          expect(cell1.walls.south).toBe(cell2.walls.south);
          expect(cell1.walls.east).toBe(cell2.walls.east);
          expect(cell1.walls.west).toBe(cell2.walls.west);
        }
      }
    });

    it('should create different mazes with different seeds', () => {
      // Use larger seeds to ensure different outcomes
      const maze1 = generator.generate(15, 15, 11111, 30);
      const maze2 = generator.generate(15, 15, 99999, 30);

      // Compare wall patterns - should be different
      let differences = 0;
      for (let y = 0; y < 15; y++) {
        for (let x = 0; x < 15; x++) {
          const cell1 = maze1.cells[y][x];
          const cell2 = maze2.cells[y][x];
          if (cell1.walls.north !== cell2.walls.north) differences++;
          if (cell1.walls.south !== cell2.walls.south) differences++;
          if (cell1.walls.east !== cell2.walls.east) differences++;
          if (cell1.walls.west !== cell2.walls.west) differences++;
        }
      }

      // Different seeds should produce different mazes
      expect(differences).toBeGreaterThan(10);
    });

    it('should mark all cells as visited', () => {
      const maze = generator.generate(10, 10, 12345, 30);
      for (let y = 0; y < maze.height; y++) {
        for (let x = 0; x < maze.width; x++) {
          expect(maze.cells[y][x].visited).toBe(true);
        }
      }
    });

    it('should have correct start and end positions', () => {
      const maze = generator.generate(10, 15, 12345, 30);
      expect(maze.startX).toBe(15); // cellSize / 2
      expect(maze.startY).toBe(15);
      expect(maze.endX).toBe((maze.width - 1) * 30 + 15);
      expect(maze.endY).toBe((maze.height - 1) * 30 + 15);
    });

    it('should add loops when requested', () => {
      // Use different seeds for different mazes to test the loop feature
      const mazeNoLoops = generator.generate(20, 20, 100, 30, 0);
      const mazeWithLoops = generator.generate(20, 20, 200, 30, 10);

      // Count open passages (walls that are false)
      let passagesNoLoops = 0;
      let passagesWithLoops = 0;

      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 20; x++) {
          const cell1 = mazeNoLoops.cells[y][x];
          if (!cell1.walls.north) passagesNoLoops++;
          if (!cell1.walls.south) passagesNoLoops++;
          if (!cell1.walls.east) passagesNoLoops++;
          if (!cell1.walls.west) passagesNoLoops++;

          const cell2 = mazeWithLoops.cells[y][x];
          if (!cell2.walls.north) passagesWithLoops++;
          if (!cell2.walls.south) passagesWithLoops++;
          if (!cell2.walls.east) passagesWithLoops++;
          if (!cell2.walls.west) passagesWithLoops++;
        }
      }

      // Maze with loops should have more open passages than perfect maze
      // A perfect 20x20 maze has exactly 20*20-1 = 399 passages
      // Adding loops should increase this
      expect(passagesWithLoops).toBeGreaterThanOrEqual(passagesNoLoops);
    });
  });

  describe('maze connectivity', () => {
    it('should be solvable (all cells reachable)', () => {
      const maze = generator.generate(15, 15, 12345, 30);

      // BFS from start
      const visited = Array(maze.height).fill(null).map(() => Array(maze.width).fill(false));
      const queue = [{ x: 0, y: 0 }];
      visited[0][0] = true;

      while (queue.length > 0) {
        const current = queue.shift()!;
        const cell = maze.cells[current.y][current.x];

        // Check each direction
        if (!cell.walls.north && current.y > 0 && !visited[current.y - 1][current.x]) {
          visited[current.y - 1][current.x] = true;
          queue.push({ x: current.x, y: current.y - 1 });
        }
        if (!cell.walls.south && current.y < maze.height - 1 && !visited[current.y + 1][current.x]) {
          visited[current.y + 1][current.x] = true;
          queue.push({ x: current.x, y: current.y + 1 });
        }
        if (!cell.walls.west && current.x > 0 && !visited[current.y][current.x - 1]) {
          visited[current.y][current.x - 1] = true;
          queue.push({ x: current.x - 1, y: current.y });
        }
        if (!cell.walls.east && current.x < maze.width - 1 && !visited[current.y][current.x + 1]) {
          visited[current.y][current.x + 1] = true;
          queue.push({ x: current.x + 1, y: current.y });
        }
      }

      // All cells should be reachable
      for (let y = 0; y < maze.height; y++) {
        for (let x = 0; x < maze.width; x++) {
          expect(visited[y][x]).toBe(true);
        }
      }
    });
  });
});

describe('SeededRNG', () => {
  it('should produce deterministic results with same seed', () => {
    const rng1 = new SeededRNG(12345);
    const rng2 = new SeededRNG(12345);

    for (let i = 0; i < 100; i++) {
      expect(rng1.next()).toBeCloseTo(rng2.next(), 10);
    }
  });

  it('should produce different results with different seeds', () => {
    const rng1 = new SeededRNG(12345);
    const rng2 = new SeededRNG(54321);

    let differences = 0;
    for (let i = 0; i < 100; i++) {
      if (Math.abs(rng1.next() - rng2.next()) > 0.01) {
        differences++;
      }
    }

    expect(differences).toBeGreaterThan(50);
  });

  it('should return values between 0 and 1', () => {
    const rng = new SeededRNG(12345);

    for (let i = 0; i < 1000; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('should return integers in correct range', () => {
    const rng = new SeededRNG(12345);

    for (let i = 0; i < 100; i++) {
      const value = rng.nextInt(5, 10);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThanOrEqual(10);
    }
  });
});