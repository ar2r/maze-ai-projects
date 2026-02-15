import type { Maze } from './maze';
import { wallAt } from './maze';

type MoveResult = { x: number; y: number; collided: boolean };

export function resolveMovement(
  x: number,
  y: number,
  dx: number,
  dy: number,
  maze: Maze,
  radius: number,
  wallThickness: number
): MoveResult {
  let collided = false;
  const halfWall = wallThickness / 2;

  const clampX = (currentX: number, delta: number): number => {
    if (delta === 0) return currentX;
    let newX = currentX + delta;
    const minRow = Math.max(0, Math.floor(y - radius));
    const maxRow = Math.min(maze.height - 1, Math.floor(y + radius));

    const startBound = Math.floor((Math.min(currentX, newX) - radius));
    const endBound = Math.floor((Math.max(currentX, newX) + radius));

    if (delta > 0) {
      for (let boundary = startBound + 1; boundary <= endBound + 1; boundary++) {
        for (let row = minRow; row <= maxRow; row++) {
          if (wallAt(maze, 'V', boundary, row)) {
            const limit = boundary - halfWall - radius;
            if (newX > limit) {
              newX = Math.min(newX, limit);
              collided = true;
            }
          }
        }
      }
    } else {
      for (let boundary = endBound; boundary >= startBound; boundary--) {
        for (let row = minRow; row <= maxRow; row++) {
          if (wallAt(maze, 'V', boundary, row)) {
            const limit = boundary + halfWall + radius;
            if (newX < limit) {
              newX = Math.max(newX, limit);
              collided = true;
            }
          }
        }
      }
    }

    // clamp to outer bounds just in case
    newX = Math.max(radius + halfWall, Math.min(maze.width - radius - halfWall, newX));
    return newX;
  };

  const clampY = (currentY: number, delta: number, atX: number): number => {
    if (delta === 0) return currentY;
    let newY = currentY + delta;
    const minCol = Math.max(0, Math.floor(atX - radius));
    const maxCol = Math.min(maze.width - 1, Math.floor(atX + radius));

    const startBound = Math.floor((Math.min(currentY, newY) - radius));
    const endBound = Math.floor((Math.max(currentY, newY) + radius));

    if (delta > 0) {
      for (let boundary = startBound + 1; boundary <= endBound + 1; boundary++) {
        for (let col = minCol; col <= maxCol; col++) {
          if (wallAt(maze, 'H', col, boundary)) {
            const limit = boundary - halfWall - radius;
            if (newY > limit) {
              newY = Math.min(newY, limit);
              collided = true;
            }
          }
        }
      }
    } else {
      for (let boundary = endBound; boundary >= startBound; boundary--) {
        for (let col = minCol; col <= maxCol; col++) {
          if (wallAt(maze, 'H', col, boundary)) {
            const limit = boundary + halfWall + radius;
            if (newY < limit) {
              newY = Math.max(newY, limit);
              collided = true;
            }
          }
        }
      }
    }

    newY = Math.max(radius + halfWall, Math.min(maze.height - radius - halfWall, newY));
    return newY;
  };

  const xAfter = clampX(x, dx);
  const yAfter = clampY(y, dy, xAfter);

  return { x: xAfter, y: yAfter, collided };
}
