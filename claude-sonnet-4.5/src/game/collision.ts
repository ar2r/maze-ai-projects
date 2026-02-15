// === Collision Detection & Response ===

import type { Position, Maze } from '../types';
import { CONFIG } from '../config';

interface CollisionResult {
  collided: boolean;
  correctedPosition: Position;
  hitWall: boolean;
}

// Check if a circle intersects with a line segment
function circleLineIntersection(
  circleX: number,
  circleY: number,
  radius: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): boolean {
  // Find closest point on line segment to circle center
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    // Line segment is a point
    const dist = Math.hypot(circleX - x1, circleY - y1);
    return dist < radius + CONFIG.PHYSICS.WALL_BUFFER;
  }

  // Parameter t for closest point on line
  let t = ((circleX - x1) * dx + (circleY - y1) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));

  // Closest point on line segment
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  // Distance from circle to closest point
  const distance = Math.hypot(circleX - closestX, circleY - closestY);

  return distance < radius + CONFIG.PHYSICS.WALL_BUFFER;
}

// Get all wall segments for collision checking
function getWallSegments(maze: Maze): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const { grid, width, height, cellSize } = maze;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cell = grid[row][col];
      const x = col * cellSize;
      const y = row * cellSize;

      // Top wall
      if (cell.walls.top) {
        segments.push({
          x1: x,
          y1: y,
          x2: x + cellSize,
          y2: y,
        });
      }

      // Right wall
      if (cell.walls.right) {
        segments.push({
          x1: x + cellSize,
          y1: y,
          x2: x + cellSize,
          y2: y + cellSize,
        });
      }

      // Bottom wall
      if (cell.walls.bottom) {
        segments.push({
          x1: x,
          y1: y + cellSize,
          x2: x + cellSize,
          y2: y + cellSize,
        });
      }

      // Left wall
      if (cell.walls.left) {
        segments.push({
          x1: x,
          y1: y,
          x2: x,
          y2: y + cellSize,
        });
      }
    }
  }

  return segments;
}

// Check collision and correct position with sliding
export function checkCollision(
  position: Position,
  newPosition: Position,
  radius: number,
  maze: Maze
): CollisionResult {
  const wallSegments = getWallSegments(maze);
  let hitWall = false;
  let correctedX = newPosition.x;
  let correctedY = newPosition.y;

  // Check collision with each wall segment
  for (const wall of wallSegments) {
    if (
      circleLineIntersection(
        newPosition.x,
        newPosition.y,
        radius,
        wall.x1,
        wall.y1,
        wall.x2,
        wall.y2
      )
    ) {
      hitWall = true;

      // Calculate wall normal
      const dx = wall.x2 - wall.x1;
      const dy = wall.y2 - wall.y1;
      const length = Math.hypot(dx, dy);

      if (length === 0) continue;

      // Normal vector (perpendicular to wall)
      const normalX = -dy / length;
      const normalY = dx / length;

      // Direction from old position to new position
      const moveX = newPosition.x - position.x;
      const moveY = newPosition.y - position.y;

      // Project movement onto wall tangent for sliding
      const dot = moveX * normalX + moveY * normalY;

      // If moving into wall, apply sliding
      if (dot < 0) {
        // Slide along wall
        const slideX = moveX - dot * normalX;
        const slideY = moveY - dot * normalY;

        correctedX = position.x + slideX * CONFIG.PHYSICS.SLIDE_FACTOR;
        correctedY = position.y + slideY * CONFIG.PHYSICS.SLIDE_FACTOR;

        // Verify corrected position doesn't collide
        if (
          !circleLineIntersection(
            correctedX,
            correctedY,
            radius,
            wall.x1,
            wall.y1,
            wall.x2,
            wall.y2
          )
        ) {
          newPosition.x = correctedX;
          newPosition.y = correctedY;
        } else {
          // If still colliding, don't move
          correctedX = position.x;
          correctedY = position.y;
        }
      }
    }
  }

  // Clamp to maze bounds
  const mazeWidth = maze.width * maze.cellSize;
  const mazeHeight = maze.height * maze.cellSize;

  correctedX = Math.max(radius, Math.min(mazeWidth - radius, correctedX));
  correctedY = Math.max(radius, Math.min(mazeHeight - radius, correctedY));

  return {
    collided: hitWall,
    correctedPosition: { x: correctedX, y: correctedY },
    hitWall,
  };
}

// Check if position is inside finish area
export function isInFinishZone(position: Position, maze: Maze, radius: number): boolean {
  const distance = Math.hypot(
    position.x - maze.finish.x,
    position.y - maze.finish.y
  );

  return distance < radius + maze.cellSize * 0.3;
}
