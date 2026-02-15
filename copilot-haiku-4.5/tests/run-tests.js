// ============================================================================
// Test Runner
// ============================================================================
// Simple Node.js test runner for unit tests

import { testMazeGeneration } from './maze-gen.test.ts';
import { testCollisionDetection } from './collision.test.ts';

console.log('🧪 Running Unit Tests...\n');

try {
  testMazeGeneration();
  testCollisionDetection();

  console.log('\n✅ All tests passed!\n');
  process.exit(0);
} catch (e) {
  console.error('\n❌ Tests failed:', e);
  process.exit(1);
}
