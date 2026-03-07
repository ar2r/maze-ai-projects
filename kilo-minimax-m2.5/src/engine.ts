import { Maze, Cell } from './maze';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  radius: number;
  velocity: Vector2;
}

export interface GameState {
  player: Player;
  maze: Maze;
  level: number;
  startTime: number;
  elapsedTime: number;
  isComplete: boolean;
}

const SLIDE_FACTOR = 0.5;
const VELOCITY_THRESHOLD = 0.1;
const FRICTION = 0.85;
const PLAYER_SPEED = 2;

export function createPlayer(cellSize: number): Player {
  const radius = cellSize * 0.25;
  return {
    x: 0,
    y: 0,
    radius,
    velocity: { x: 0, y: 0 }
  };
}

export function updatePlayer(
  player: Player,
  input: Vector2,
  maze: Maze,
  cellSize: number,
  offsetX: number,
  offsetY: number
): void {
  player.velocity.x += input.x * PLAYER_SPEED;
  player.velocity.y += input.y * PLAYER_SPEED;

  player.velocity.x *= FRICTION;
  player.velocity.y *= FRICTION;

  if (Math.abs(player.velocity.x) < VELOCITY_THRESHOLD) player.velocity.x = 0;
  if (Math.abs(player.velocity.y) < VELOCITY_THRESHOLD) player.velocity.y = 0;

  const newX = player.x + player.velocity.x;
  const newY = player.y + player.velocity.y;

  const collisionX = checkCollision(player.x, newX, player.y, player.y, maze, cellSize, offsetX, offsetY, player.radius);
  const collisionY = checkCollision(player.x, newX, player.y, newY, maze, cellSize, offsetX, offsetY, player.radius);

  if (!collisionX.collided) {
    player.x = collisionX.newPos;
  } else {
    player.velocity.x *= SLIDE_FACTOR;
  }

  if (!collisionY.collided) {
    player.y = collisionY.newPos;
  } else {
    player.velocity.y *= SLIDE_FACTOR;
  }

  player.x = Math.max(player.radius, Math.min(player.x, maze.width * cellSize - player.radius));
  player.y = Math.max(player.radius, Math.min(player.y, maze.height * cellSize - player.radius));
}

function checkCollision(
  oldX: number,
  newX: number,
  oldY: number,
  newY: number,
  maze: Maze,
  cellSize: number,
  offsetX: number,
  offsetY: number,
  radius: number
): { collided: boolean; newPos: number } {
  const margin = 2;

  const playerCX = Math.floor((oldX - offsetX) / cellSize);
  const playerCY = Math.floor((oldY - offsetY) / cellSize);

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const cx = playerCX + dx;
      const cy = playerCY + dy;

      if (cx < 0 || cx >= maze.width || cy < 0 || cy >= maze.height) continue;

      const cell = maze.cells[cy][cx];
      const cellLeft = cx * cellSize + offsetX;
      const cellRight = (cx + 1) * cellSize + offsetX;
      const cellTop = cy * cellSize + offsetY;
      const cellBottom = (cy + 1) * cellSize + offsetY;

      if (cell.walls.top && dy <= 0) {
        const wallY = cellTop + margin;
        if (oldY - radius >= wallY - margin && newY - radius < wallY) {
          return { collided: true, newPos: wallY + radius };
        }
      }

      if (cell.walls.bottom && dy >= 0) {
        const wallY = cellBottom - margin;
        if (oldY + radius <= wallY + margin && newY + radius > wallY) {
          return { collided: true, newPos: wallY - radius };
        }
      }

      if (cell.walls.left && dx <= 0) {
        const wallX = cellLeft + margin;
        if (oldX - radius >= wallX - margin && newX - radius < wallX) {
          return { collided: true, newPos: wallX + radius };
        }
      }

      if (cell.walls.right && dx >= 0) {
        const wallX = cellRight - margin;
        if (oldX + radius <= wallX + margin && newX + radius > wallX) {
          return { collided: true, newPos: wallX - radius };
        }
      }
    }
  }

  return { collided: false, newPos: newX !== oldX ? newX : newY };
}

export function checkLevelComplete(
  player: Player,
  maze: Maze,
  cellSize: number,
  offsetX: number,
  offsetY: number
): boolean {
  const endX = maze.endCell.x * cellSize + cellSize / 2 + offsetX;
  const endY = maze.endCell.y * cellSize + cellSize / 2 + offsetY;

  const dx = player.x - endX;
  const dy = player.y - endY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < cellSize * 0.5;
}

export function getPlayerCell(
  player: Player,
  maze: Maze,
  cellSize: number,
  offsetX: number,
  offsetY: number
): Cell | null {
  const cx = Math.floor((player.x - offsetX) / cellSize);
  const cy = Math.floor((player.y - offsetY) / cellSize);

  if (cx >= 0 && cx < maze.width && cy >= 0 && cy < maze.height) {
    return maze.cells[cy][cx];
  }
  return null;
}
