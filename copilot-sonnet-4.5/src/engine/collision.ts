// Collision detection system with wall sliding

import type { Maze, Position, Player } from '../types';
import { circleRectIntersects } from '../utils/math';

export interface CollisionResult {
  collided: boolean;
  correctedPosition: Position;
  normal: Position; // Collision normal for sliding
}

export function checkCollision(
  player: Player,
  newPosition: Position,
  maze: Maze
): CollisionResult {
  const result: CollisionResult = {
    collided: false,
    correctedPosition: { ...newPosition },
    normal: { x: 0, y: 0 },
  };

  const { cellSize, wallThickness } = maze;
  const radius = player.radius;

  // Determine which cells the player might collide with
  const minCol = Math.max(0, Math.floor((newPosition.x - radius) / cellSize));
  const maxCol = Math.min(maze.width - 1, Math.floor((newPosition.x + radius) / cellSize));
  const minRow = Math.max(0, Math.floor((newPosition.y - radius) / cellSize));
  const maxRow = Math.min(maze.height - 1, Math.floor((newPosition.y + radius) / cellSize));

  let hasCollision = false;
  const normals: Position[] = [];

  // Check walls in nearby cells
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const cell = maze.cells[row][col];
      const cellX = col * cellSize;
      const cellY = row * cellSize;

      // Check each wall
      if (cell.walls.top) {
        const wallRect = {
          x: cellX,
          y: cellY - wallThickness / 2,
          w: cellSize,
          h: wallThickness,
        };
        if (
          circleRectIntersects(
            newPosition.x,
            newPosition.y,
            radius,
            wallRect.x,
            wallRect.y,
            wallRect.w,
            wallRect.h
          )
        ) {
          hasCollision = true;
          normals.push({ x: 0, y: 1 }); // Push down
        }
      }

      if (cell.walls.right) {
        const wallRect = {
          x: cellX + cellSize - wallThickness / 2,
          y: cellY,
          w: wallThickness,
          h: cellSize,
        };
        if (
          circleRectIntersects(
            newPosition.x,
            newPosition.y,
            radius,
            wallRect.x,
            wallRect.y,
            wallRect.w,
            wallRect.h
          )
        ) {
          hasCollision = true;
          normals.push({ x: -1, y: 0 }); // Push left
        }
      }

      if (cell.walls.bottom) {
        const wallRect = {
          x: cellX,
          y: cellY + cellSize - wallThickness / 2,
          w: cellSize,
          h: wallThickness,
        };
        if (
          circleRectIntersects(
            newPosition.x,
            newPosition.y,
            radius,
            wallRect.x,
            wallRect.y,
            wallRect.w,
            wallRect.h
          )
        ) {
          hasCollision = true;
          normals.push({ x: 0, y: -1 }); // Push up
        }
      }

      if (cell.walls.left) {
        const wallRect = {
          x: cellX - wallThickness / 2,
          y: cellY,
          w: wallThickness,
          h: cellSize,
        };
        if (
          circleRectIntersects(
            newPosition.x,
            newPosition.y,
            radius,
            wallRect.x,
            wallRect.y,
            wallRect.w,
            wallRect.h
          )
        ) {
          hasCollision = true;
          normals.push({ x: 1, y: 0 }); // Push right
        }
      }
    }
  }

  if (hasCollision) {
    // Average collision normals
    const avgNormal = normals.reduce(
      (acc, n) => ({ x: acc.x + n.x, y: acc.y + n.y }),
      { x: 0, y: 0 }
    );
    const len = Math.sqrt(avgNormal.x * avgNormal.x + avgNormal.y * avgNormal.y);
    if (len > 0) {
      avgNormal.x /= len;
      avgNormal.y /= len;
    }

    result.collided = true;
    result.normal = avgNormal;

    // Push player out of collision
    const pushDistance = radius + wallThickness;
    result.correctedPosition = {
      x: newPosition.x + avgNormal.x * pushDistance * 0.1,
      y: newPosition.y + avgNormal.y * pushDistance * 0.1,
    };
  }

  // Check maze boundaries
  const minX = radius;
  const maxX = maze.width * cellSize - radius;
  const minY = radius;
  const maxY = maze.height * cellSize - radius;

  if (newPosition.x < minX || newPosition.x > maxX || newPosition.y < minY || newPosition.y > maxY) {
    result.collided = true;
    result.correctedPosition = {
      x: Math.max(minX, Math.min(maxX, newPosition.x)),
      y: Math.max(minY, Math.min(maxY, newPosition.y)),
    };
  }

  return result;
}

export function checkGoalReached(player: Player, goal: Position, threshold: number = 20): boolean {
  const dx = player.position.x - goal.x;
  const dy = player.position.y - goal.y;
  return dx * dx + dy * dy < threshold * threshold;
}
