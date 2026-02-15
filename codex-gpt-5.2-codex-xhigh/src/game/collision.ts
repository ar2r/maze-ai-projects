import type { Maze, Point } from './types';

export interface CollisionResult {
  pos: Point;
  collisions: number;
}

export function moveWithCollisions(
  maze: Maze,
  pos: Point,
  delta: Point,
  radius: number,
  wallThickness: number
): CollisionResult {
  let collisions = 0;
  const block = radius + wallThickness / 2;

  let x = pos.x;
  let y = pos.y;

  if (delta.x !== 0) {
    const move = moveAlongX(maze, x, y, delta.x, radius, block);
    if (move.collided) collisions++;
    x = move.x;
  }

  if (delta.y !== 0) {
    const move = moveAlongY(maze, x, y, delta.y, radius, block);
    if (move.collided) collisions++;
    y = move.y;
  }

  return { pos: { x, y }, collisions };
}

function moveAlongX(
  maze: Maze,
  x: number,
  y: number,
  dx: number,
  radius: number,
  block: number
): { x: number; collided: boolean } {
  let newX = x + dx;
  const { cols, rows } = maze;
  const rowMin = clamp(Math.floor(y - radius), 0, rows - 1);
  const rowMax = clamp(Math.floor(y + radius), 0, rows - 1);
  let collided = false;

  if (dx > 0) {
    const startLine = Math.floor(x + block) + 1;
    const endLine = Math.floor(newX + block);
    for (let line = startLine; line <= endLine; line++) {
      if (line < 0 || line > cols) continue;
      if (hasVerticalWall(maze, line, rowMin, rowMax)) {
        newX = line - block - 1e-4;
        collided = true;
        break;
      }
    }
  } else {
    const startLine = Math.floor(x - block);
    const endLine = Math.floor(newX - block);
    for (let line = startLine; line > endLine; line--) {
      if (line < 0 || line > cols) continue;
      if (hasVerticalWall(maze, line, rowMin, rowMax)) {
        newX = line + block + 1e-4;
        collided = true;
        break;
      }
    }
  }

  return { x: newX, collided };
}

function moveAlongY(
  maze: Maze,
  x: number,
  y: number,
  dy: number,
  radius: number,
  block: number
): { y: number; collided: boolean } {
  let newY = y + dy;
  const { cols, rows } = maze;
  const colMin = clamp(Math.floor(x - radius), 0, cols - 1);
  const colMax = clamp(Math.floor(x + radius), 0, cols - 1);
  let collided = false;

  if (dy > 0) {
    const startLine = Math.floor(y + block) + 1;
    const endLine = Math.floor(newY + block);
    for (let line = startLine; line <= endLine; line++) {
      if (line < 0 || line > rows) continue;
      if (hasHorizontalWall(maze, line, colMin, colMax)) {
        newY = line - block - 1e-4;
        collided = true;
        break;
      }
    }
  } else {
    const startLine = Math.floor(y - block);
    const endLine = Math.floor(newY - block);
    for (let line = startLine; line > endLine; line--) {
      if (line < 0 || line > rows) continue;
      if (hasHorizontalWall(maze, line, colMin, colMax)) {
        newY = line + block + 1e-4;
        collided = true;
        break;
      }
    }
  }

  return { y: newY, collided };
}

function hasVerticalWall(maze: Maze, line: number, rowMin: number, rowMax: number): boolean {
  if (line <= 0 || line >= maze.cols) return true;
  for (let row = rowMin; row <= rowMax; row++) {
    const left = maze.cells[row][line - 1];
    const right = maze.cells[row][line];
    if (left.walls[1] || right.walls[3]) return true;
  }
  return false;
}

function hasHorizontalWall(maze: Maze, line: number, colMin: number, colMax: number): boolean {
  if (line <= 0 || line >= maze.rows) return true;
  for (let col = colMin; col <= colMax; col++) {
    const top = maze.cells[line - 1][col];
    const bottom = maze.cells[line][col];
    if (top.walls[2] || bottom.walls[0]) return true;
  }
  return false;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
