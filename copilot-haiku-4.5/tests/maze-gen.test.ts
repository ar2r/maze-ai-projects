// ============================================================================
// Unit Tests - Maze Generation
// ============================================================================

import { generateMaze, validateMazeConnectivity } from '../src/game/maze-gen';

function testMazeGeneration() {
  console.log('\n=== Testing Maze Generation ===');

  // Test 1: Basic generation
  const maze = generateMaze(10, 10, 40, 12345);
  console.assert(maze.width === 10, 'Maze width should be 10');
  console.assert(maze.height === 10, 'Maze height should be 10');
  console.assert(maze.cells.length === 100, 'Should have 100 cells');
  console.assert(maze.cellSize === 40, 'Cell size should be 40');
  console.log('✓ Basic maze generation');

  // Test 2: Connectivity
  const isConnected = validateMazeConnectivity(maze);
  console.assert(isConnected, 'All cells should be reachable from start');
  console.log('✓ Maze connectivity');

  // Test 3: Deterministic RNG with same seed
  const maze2 = generateMaze(10, 10, 40, 12345);
  console.assert(
    JSON.stringify(maze.cells) === JSON.stringify(maze2.cells),
    'Same seed should produce same maze'
  );
  console.log('✓ Deterministic generation');

  // Test 4: Different seed = different maze
  const maze3 = generateMaze(10, 10, 40, 99999);
  console.assert(
    JSON.stringify(maze.cells) !== JSON.stringify(maze3.cells),
    'Different seeds should produce different mazes'
  );
  console.log('✓ Different seeds produce different mazes');

  // Test 5: Various sizes
  for (const size of [5, 8, 15, 20]) {
    const m = generateMaze(size, size, 40, 123);
    console.assert(m.width === size && m.height === size, `Should support ${size}x${size} grid`);
    console.assert(validateMazeConnectivity(m), `${size}x${size} maze should be valid`);
  }
  console.log('✓ Various grid sizes supported');

  console.log('✅ All maze tests passed\n');
}

export { testMazeGeneration };
