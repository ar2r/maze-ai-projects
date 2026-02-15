// ============================================================================
// Unit Tests - Collision Detection
// ============================================================================

import {
  aabbIntersect,
  circleAabbIntersect,
  isPlayerAtGoal,
} from '../src/game/collision';
import { AABB, Maze, Player } from '../src/game/types';
import { generateMaze } from '../src/game/maze-gen';

function testCollisionDetection() {
  console.log('\n=== Testing Collision Detection ===');

  // Test 1: AABB intersection
  const box1: AABB = { x: 0, y: 0, width: 10, height: 10 };
  const box2: AABB = { x: 5, y: 5, width: 10, height: 10 };
  const box3: AABB = { x: 20, y: 20, width: 10, height: 10 };

  console.assert(aabbIntersect(box1, box2), 'Overlapping boxes should intersect');
  console.assert(!aabbIntersect(box1, box3), 'Non-overlapping boxes should not intersect');
  console.log('✓ AABB intersection tests');

  // Test 2: Circle-AABB collision
  const box: AABB = { x: 50, y: 50, width: 20, height: 20 };

  console.assert(circleAabbIntersect(50, 50, 5, box), 'Circle inside box should collide');
  console.assert(circleAabbIntersect(60, 60, 5, box), 'Circle at box corner should collide');
  console.assert(!circleAabbIntersect(0, 0, 5, box), 'Far circle should not collide');
  console.log('✓ Circle-AABB collision tests');

  // Test 3: Goal detection
  const maze = generateMaze(5, 5, 40, 123);
  const player: Player = {
    pos: { x: maze.end.x * maze.cellSize + maze.cellSize / 2, y: maze.end.y * maze.cellSize + maze.cellSize / 2 },
    vel: { x: 0, y: 0 },
    radius: 5,
  };

  console.assert(isPlayerAtGoal(player, maze, 30), 'Player at goal should be detected');

  player.pos.x = 0;
  player.pos.y = 0;
  console.assert(!isPlayerAtGoal(player, maze, 30), 'Player far from goal should not be detected');
  console.log('✓ Goal detection tests');

  console.log('✅ All collision tests passed\n');
}

export { testCollisionDetection };
