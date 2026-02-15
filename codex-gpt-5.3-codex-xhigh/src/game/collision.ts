import type { MazeData } from './types';
import { WALL_E, WALL_N, WALL_S, WALL_W } from './maze';

const EPSILON = 1e-6;

export interface MovementResult {
  x: number;
  y: number;
  hitWall: boolean;
  hitCount: number;
}

interface AxisResult {
  value: number;
  collisions: number;
}

export function moveWithCollisions(
  maze: MazeData,
  x: number,
  y: number,
  radius: number,
  deltaX: number,
  deltaY: number
): MovementResult {
  const maxSubStep = Math.max(0.015, radius * 0.45);

  const movedX = moveAxisX(maze, x, y, radius, deltaX, maxSubStep);
  const movedY = moveAxisY(maze, movedX.value, y, radius, deltaY, maxSubStep);

  const boundedX = clamp(movedX.value, radius + EPSILON, maze.cols - radius - EPSILON);
  const boundedY = clamp(movedY.value, radius + EPSILON, maze.rows - radius - EPSILON);

  const hitCount = movedX.collisions + movedY.collisions;

  return {
    x: boundedX,
    y: boundedY,
    hitWall: hitCount > 0,
    hitCount
  };
}

function moveAxisX(
  maze: MazeData,
  x: number,
  y: number,
  radius: number,
  delta: number,
  maxSubStep: number
): AxisResult {
  let current = x;
  let remaining = delta;
  let collisions = 0;

  while (Math.abs(remaining) > EPSILON) {
    const step = Math.abs(remaining) > maxSubStep ? Math.sign(remaining) * maxSubStep : remaining;
    const before = current;
    let candidate = before + step;
    let blocked = false;

    if (step > 0) {
      const beforeEdge = before + radius;
      const afterEdge = candidate + radius;
      const beforeCol = Math.floor(beforeEdge - EPSILON);
      const afterCol = Math.floor(afterEdge - EPSILON);

      if (afterCol > beforeCol) {
        const rowStart = Math.floor(y - radius + EPSILON);
        const rowEnd = Math.floor(y + radius - EPSILON);

        for (let row = rowStart; row <= rowEnd; row++) {
          if (isEastBlocked(maze, beforeCol, row)) {
            blocked = true;
            break;
          }
        }

        if (blocked) {
          candidate = beforeCol + 1 - radius - EPSILON;
        }
      }
    } else {
      const beforeEdge = before - radius;
      const afterEdge = candidate - radius;
      const beforeCol = Math.floor(beforeEdge + EPSILON);
      const afterCol = Math.floor(afterEdge + EPSILON);

      if (afterCol < beforeCol) {
        const rowStart = Math.floor(y - radius + EPSILON);
        const rowEnd = Math.floor(y + radius - EPSILON);

        for (let row = rowStart; row <= rowEnd; row++) {
          if (isWestBlocked(maze, beforeCol, row)) {
            blocked = true;
            break;
          }
        }

        if (blocked) {
          candidate = beforeCol + radius + EPSILON;
        }
      }
    }

    current = candidate;
    if (blocked) {
      collisions++;
      break;
    }

    remaining -= step;
  }

  return { value: current, collisions };
}

function moveAxisY(
  maze: MazeData,
  x: number,
  y: number,
  radius: number,
  delta: number,
  maxSubStep: number
): AxisResult {
  let current = y;
  let remaining = delta;
  let collisions = 0;

  while (Math.abs(remaining) > EPSILON) {
    const step = Math.abs(remaining) > maxSubStep ? Math.sign(remaining) * maxSubStep : remaining;
    const before = current;
    let candidate = before + step;
    let blocked = false;

    if (step > 0) {
      const beforeEdge = before + radius;
      const afterEdge = candidate + radius;
      const beforeRow = Math.floor(beforeEdge - EPSILON);
      const afterRow = Math.floor(afterEdge - EPSILON);

      if (afterRow > beforeRow) {
        const colStart = Math.floor(x - radius + EPSILON);
        const colEnd = Math.floor(x + radius - EPSILON);

        for (let col = colStart; col <= colEnd; col++) {
          if (isSouthBlocked(maze, col, beforeRow)) {
            blocked = true;
            break;
          }
        }

        if (blocked) {
          candidate = beforeRow + 1 - radius - EPSILON;
        }
      }
    } else {
      const beforeEdge = before - radius;
      const afterEdge = candidate - radius;
      const beforeRow = Math.floor(beforeEdge + EPSILON);
      const afterRow = Math.floor(afterEdge + EPSILON);

      if (afterRow < beforeRow) {
        const colStart = Math.floor(x - radius + EPSILON);
        const colEnd = Math.floor(x + radius - EPSILON);

        for (let col = colStart; col <= colEnd; col++) {
          if (isNorthBlocked(maze, col, beforeRow)) {
            blocked = true;
            break;
          }
        }

        if (blocked) {
          candidate = beforeRow + radius + EPSILON;
        }
      }
    }

    current = candidate;
    if (blocked) {
      collisions++;
      break;
    }

    remaining -= step;
  }

  return { value: current, collisions };
}

function isEastBlocked(maze: MazeData, col: number, row: number): boolean {
  if (row < 0 || row >= maze.rows || col < 0 || col >= maze.cols) {
    return true;
  }
  const index = row * maze.cols + col;
  return (maze.cells[index] & WALL_E) !== 0;
}

function isWestBlocked(maze: MazeData, col: number, row: number): boolean {
  if (row < 0 || row >= maze.rows || col < 0 || col >= maze.cols) {
    return true;
  }
  const index = row * maze.cols + col;
  return (maze.cells[index] & WALL_W) !== 0;
}

function isSouthBlocked(maze: MazeData, col: number, row: number): boolean {
  if (col < 0 || col >= maze.cols || row < 0 || row >= maze.rows) {
    return true;
  }
  const index = row * maze.cols + col;
  return (maze.cells[index] & WALL_S) !== 0;
}

function isNorthBlocked(maze: MazeData, col: number, row: number): boolean {
  if (col < 0 || col >= maze.cols || row < 0 || row >= maze.rows) {
    return true;
  }
  const index = row * maze.cols + col;
  return (maze.cells[index] & WALL_N) !== 0;
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}
