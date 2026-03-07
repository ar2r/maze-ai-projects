import { describe, expect, it } from 'vitest';
import { getLevelConfig } from '../game/config';
import { generateMaze } from '../game/maze';
import { validateMaze } from '../game/mazeValidation';

describe('maze generation', () => {
  it('is deterministic for the same seed', () => {
    const config = getLevelConfig(3, 'seed-a');
    const mazeA = generateMaze(config);
    const mazeB = generateMaze(config);

    expect(mazeA.cells.map((cell) => cell.passages)).toEqual(mazeB.cells.map((cell) => cell.passages));
    expect(mazeA.finishCell).toEqual(mazeB.finishCell);
  });

  it('produces a connected maze with a closed perimeter', () => {
    const config = getLevelConfig(4, 'seed-b');
    const maze = generateMaze(config);
    const validation = validateMaze(maze);

    expect(validation.isConnected).toBe(true);
    expect(validation.hasClosedPerimeter).toBe(true);
    expect(validation.reachableCells).toBe(maze.width * maze.height);
    expect(validation.optimalPathLength).toBeGreaterThan(0);
  });

  it('changes layout when seed changes', () => {
    const mazeA = generateMaze(getLevelConfig(2, 'seed-x'));
    const mazeB = generateMaze(getLevelConfig(2, 'seed-y'));

    expect(mazeA.cells.map((cell) => cell.passages)).not.toEqual(mazeB.cells.map((cell) => cell.passages));
  });
});
