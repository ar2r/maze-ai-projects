/**
 * TDD – Maze tests (written BEFORE the implementation).
 *
 * Contract for the maze generator:
 *  1. Correct dimensions (cells array size matches w×h)
 *  2. Boundary walls are always solid (outer edge cells have their outer walls)
 *  3. Connectivity: BFS from start reaches every cell (perfect maze)
 *  4. Wall symmetry: if cell A has no east wall, neighbour B has no west wall
 *  5. Determinism: same seed → same maze
 *  6. Optimal path exists from start (0,0) to finish (w-1, h-1)
 *  7. Loop injection: after addLoops(), maze is still fully connected
 *  8. Difficulty params: getLevelParams returns sane values for any level
 */

import { describe, it, expect } from 'vitest';
import { generateMaze } from '../src/maze/generator';
import { solveMaze, isConnected } from '../src/maze/solver';
import { getLevelParams } from '../src/maze/difficulty';
import type { MazeData } from '../src/types';

// ─── Helper ───────────────────────────────────────────────────────────────────
function bfsAllReachable(maze: MazeData): boolean {
  return isConnected(maze);
}

// ─── Generator tests ─────────────────────────────────────────────────────────
describe('generateMaze', () => {
  it('creates a grid of correct dimensions (5×5)', () => {
    const m = generateMaze(5, 5, 0, 40, 3);
    expect(m.cells.length).toBe(5);
    expect(m.cells[0].length).toBe(5);
    expect(m.width).toBe(5);
    expect(m.height).toBe(5);
  });

  it('creates a grid of correct dimensions (10×8)', () => {
    const m = generateMaze(10, 8, 0, 32, 3);
    expect(m.cells.length).toBe(8);
    expect(m.cells[0].length).toBe(10);
  });

  it('outer north walls (row 0) are always solid', () => {
    const m = generateMaze(6, 6, 1, 40, 2);
    for (let x = 0; x < m.width; x++) {
      expect(m.cells[0][x].wallN).toBe(true);
    }
  });

  it('outer south walls (last row) are always solid', () => {
    const m = generateMaze(6, 6, 1, 40, 2);
    const lastRow = m.height - 1;
    for (let x = 0; x < m.width; x++) {
      expect(m.cells[lastRow][x].wallS).toBe(true);
    }
  });

  it('outer west walls (col 0) are always solid', () => {
    const m = generateMaze(7, 5, 2, 40, 2);
    for (let y = 0; y < m.height; y++) {
      expect(m.cells[y][0].wallW).toBe(true);
    }
  });

  it('outer east walls (last col) are always solid', () => {
    const m = generateMaze(7, 5, 2, 40, 2);
    const lastCol = m.width - 1;
    for (let y = 0; y < m.height; y++) {
      expect(m.cells[y][lastCol].wallE).toBe(true);
    }
  });

  it('wall symmetry: A.wallE === false implies B.wallW === false (horizontal neighbours)', () => {
    const m = generateMaze(8, 8, 5, 36, 2);
    for (let y = 0; y < m.height; y++) {
      for (let x = 0; x < m.width - 1; x++) {
        const a = m.cells[y][x];
        const b = m.cells[y][x + 1];
        expect(a.wallE).toBe(b.wallW);
      }
    }
  });

  it('wall symmetry: A.wallS === false implies B.wallN === false (vertical neighbours)', () => {
    const m = generateMaze(8, 8, 5, 36, 2);
    for (let y = 0; y < m.height - 1; y++) {
      for (let x = 0; x < m.width; x++) {
        const a = m.cells[y][x];
        const b = m.cells[y + 1][x];
        expect(a.wallS).toBe(b.wallN);
      }
    }
  });

  it('is fully connected (BFS reaches all cells from start)', () => {
    const m = generateMaze(10, 10, 42, 36, 2);
    expect(bfsAllReachable(m)).toBe(true);
  });

  it('is fully connected for small maze (2×2)', () => {
    const m = generateMaze(2, 2, 0, 60, 2);
    expect(bfsAllReachable(m)).toBe(true);
  });

  it('is deterministic: same seed + params → identical cells', () => {
    const m1 = generateMaze(8, 8, 777, 36, 2);
    const m2 = generateMaze(8, 8, 777, 36, 2);
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const a = m1.cells[y][x];
        const b = m2.cells[y][x];
        expect(a.wallN).toBe(b.wallN);
        expect(a.wallE).toBe(b.wallE);
        expect(a.wallS).toBe(b.wallS);
        expect(a.wallW).toBe(b.wallW);
      }
    }
  });

  it('different seeds produce different mazes', () => {
    const m1 = generateMaze(8, 8, 1, 36, 2);
    const m2 = generateMaze(8, 8, 2, 36, 2);
    let diffCount = 0;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if (m1.cells[y][x].wallE !== m2.cells[y][x].wallE) diffCount++;
      }
    }
    expect(diffCount).toBeGreaterThan(0);
  });

  it('stores correct seed in returned MazeData', () => {
    const m = generateMaze(5, 5, 1234, 40, 2);
    expect(m.seed).toBe(1234);
  });

  it('cellSize is stored correctly', () => {
    const m = generateMaze(5, 5, 0, 48, 2);
    expect(m.cellSize).toBe(48);
  });

  it('all cells have x,y matching their position in the grid', () => {
    const m = generateMaze(5, 5, 0, 40, 2);
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        expect(m.cells[y][x].x).toBe(x);
        expect(m.cells[y][x].y).toBe(y);
      }
    }
  });
});

// ─── Solver tests ─────────────────────────────────────────────────────────────
describe('solveMaze', () => {
  it('finds a path from (0,0) to (w-1, h-1)', () => {
    const m = generateMaze(6, 6, 55, 36, 2);
    const path = solveMaze(m);
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(0);
    expect(path![0]).toEqual({ x: 0, y: 0 });
    expect(path![path!.length - 1]).toEqual({ x: m.width - 1, y: m.height - 1 });
  });

  it('returns path with minimum length ≥ Manhattan distance', () => {
    const m = generateMaze(6, 6, 55, 36, 2);
    const path = solveMaze(m)!;
    const manhattan = (m.width - 1) + (m.height - 1);
    expect(path.length - 1).toBeGreaterThanOrEqual(manhattan);
  });

  it('stores optimalPathLength in MazeData', () => {
    const m = generateMaze(5, 5, 10, 40, 2);
    expect(m.optimalPathLength).toBeGreaterThan(0);
  });
});

// ─── isConnected ──────────────────────────────────────────────────────────────
describe('isConnected', () => {
  it('returns true for generated mazes', () => {
    for (let seed = 0; seed < 10; seed++) {
      const m = generateMaze(7, 7, seed, 36, 2);
      expect(isConnected(m)).toBe(true);
    }
  });
});

// ─── Difficulty ───────────────────────────────────────────────────────────────
describe('getLevelParams', () => {
  it('level 1 has small grid', () => {
    const p = getLevelParams(1);
    expect(p.gridW).toBeLessThanOrEqual(7);
    expect(p.gridH).toBeLessThanOrEqual(7);
  });

  it('higher levels have larger grids', () => {
    const p1 = getLevelParams(1);
    const p10 = getLevelParams(10);
    const p20 = getLevelParams(20);
    expect(p10.gridW).toBeGreaterThan(p1.gridW);
    expect(p20.gridW).toBeGreaterThan(p10.gridW);
  });

  it('grid size is capped at max', () => {
    const p100 = getLevelParams(100);
    expect(p100.gridW).toBeLessThanOrEqual(40);
    expect(p100.gridH).toBeLessThanOrEqual(40);
  });

  it('cellSize is positive for any level', () => {
    for (let l = 1; l <= 50; l++) {
      expect(getLevelParams(l).cellSize).toBeGreaterThan(0);
    }
  });

  it('wallThickness is positive and ≤ cellSize / 2', () => {
    for (let l = 1; l <= 50; l++) {
      const p = getLevelParams(l);
      expect(p.wallThickness).toBeGreaterThan(0);
      expect(p.wallThickness).toBeLessThanOrEqual(p.cellSize / 2);
    }
  });

  it('higher levels have more loops', () => {
    const p1 = getLevelParams(1);
    const p15 = getLevelParams(15);
    expect(p15.loops).toBeGreaterThan(p1.loops);
  });

  it('speed increases with levels', () => {
    const p1 = getLevelParams(1);
    const p20 = getLevelParams(20);
    expect(p20.speedPx).toBeGreaterThanOrEqual(p1.speedPx);
  });
});
