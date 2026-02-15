// === Player Logic ===

import type { Player, Position, Velocity, InputState, Maze } from '../types';
import { CONFIG } from '../config';
import { checkCollision } from './collision';

export function createPlayer(startPosition: Position): Player {
  return {
    position: { ...startPosition },
    velocity: { dx: 0, dy: 0 },
    radius: CONFIG.PLAYER.RADIUS,
    speed: CONFIG.PLAYER.SPEED,
  };
}

export function updatePlayer(
  player: Player,
  input: InputState,
  maze: Maze,
  deltaTime: number
): { hitWall: boolean } {
  const dt = deltaTime / 1000; // Convert to seconds

  let targetVelocity: Velocity = { dx: 0, dy: 0 };

  // === Keyboard Input ===
  if (input.keyboard.up || input.keyboard.down || input.keyboard.left || input.keyboard.right) {
    let moveX = 0;
    let moveY = 0;

    if (input.keyboard.up) moveY -= 1;
    if (input.keyboard.down) moveY += 1;
    if (input.keyboard.left) moveX -= 1;
    if (input.keyboard.right) moveX += 1;

    // Normalize diagonal movement
    const magnitude = Math.hypot(moveX, moveY);
    if (magnitude > 0) {
      moveX /= magnitude;
      moveY /= magnitude;
    }

    targetVelocity.dx = moveX * player.speed;
    targetVelocity.dy = moveY * player.speed;
  }

  // === Mouse Follow ===
  if (input.mouse.active) {
    const dx = input.mouse.target.x - player.position.x;
    const dy = input.mouse.target.y - player.position.y;
    const distance = Math.hypot(dx, dy);

    if (distance > CONFIG.INPUT.MOUSE_FOLLOW_THRESHOLD) {
      targetVelocity.dx = (dx / distance) * player.speed;
      targetVelocity.dy = (dy / distance) * player.speed;
    }
  }

  // === Joystick ===
  if (input.joystick.active && input.joystick.magnitude > 0) {
    const angle = input.joystick.angle;
    const magnitude = input.joystick.magnitude;

    targetVelocity.dx = Math.cos(angle) * player.speed * magnitude;
    targetVelocity.dy = Math.sin(angle) * player.speed * magnitude;
  }

  // Apply friction for smooth stopping
  player.velocity.dx += (targetVelocity.dx - player.velocity.dx) * (1 - CONFIG.PLAYER.FRICTION);
  player.velocity.dy += (targetVelocity.dy - player.velocity.dy) * (1 - CONFIG.PLAYER.FRICTION);

  // Clamp to max speed
  const speed = Math.hypot(player.velocity.dx, player.velocity.dy);
  if (speed > CONFIG.PLAYER.MAX_SPEED) {
    const factor = CONFIG.PLAYER.MAX_SPEED / speed;
    player.velocity.dx *= factor;
    player.velocity.dy *= factor;
  }

  // Calculate new position
  const oldPosition = { ...player.position };
  const newPosition = {
    x: player.position.x + player.velocity.dx * dt,
    y: player.position.y + player.velocity.dy * dt,
  };

  // Check collision and correct position
  const collision = checkCollision(
    oldPosition,
    newPosition,
    player.radius,
    maze
  );

  // Update position
  player.position = collision.correctedPosition;

  // Stop velocity on collision
  if (collision.hitWall) {
    player.velocity.dx *= CONFIG.PLAYER.FRICTION * 0.5;
    player.velocity.dy *= CONFIG.PLAYER.FRICTION * 0.5;
  }

  return { hitWall: collision.hitWall };
}

export function resetPlayer(player: Player, position: Position): void {
  player.position = { ...position };
  player.velocity = { dx: 0, dy: 0 };
}
