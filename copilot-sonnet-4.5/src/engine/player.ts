// Player entity with physics

import type { Player, Position, Velocity, InputState, Maze } from '../types';
import { GAME_CONFIG } from '../constants';
import { normalize, magnitude } from '../utils/math';
import { checkCollision } from './collision';

export function createPlayer(startPosition: Position, cellSize: number): Player {
  return {
    position: { ...startPosition },
    velocity: { x: 0, y: 0 },
    radius: cellSize * GAME_CONFIG.PLAYER_RADIUS_RATIO,
    speed: GAME_CONFIG.PLAYER_MAX_SPEED,
  };
}

export function updatePlayer(
  player: Player,
  input: InputState,
  maze: Maze,
  deltaTime: number,
  controlMode: string
): { player: Player; collided: boolean } {
  const dt = deltaTime / 16.67; // Normalize to 60 FPS
  let targetVelocity: Velocity = { x: 0, y: 0 };

  // Calculate target velocity based on input
  if (controlMode === 'keyboard' || (controlMode === 'auto' && !input.touch.active && !input.mouse.isDown)) {
    // Keyboard controls
    if (input.keyboard.up) targetVelocity.y -= 1;
    if (input.keyboard.down) targetVelocity.y += 1;
    if (input.keyboard.left) targetVelocity.x -= 1;
    if (input.keyboard.right) targetVelocity.x += 1;

    // Normalize diagonal movement
    const normalized = normalize(targetVelocity);
    targetVelocity.x = normalized.x * player.speed;
    targetVelocity.y = normalized.y * player.speed;
  } else if (controlMode === 'mouse' || (controlMode === 'auto' && (input.mouse.isDown || input.touch.active))) {
    // Mouse/Touch controls - move toward target
    const targetPos = input.touch.active
      ? { x: input.touch.currentX, y: input.touch.currentY }
      : { x: input.mouse.x, y: input.mouse.y };

    const dx = targetPos.x - player.position.x;
    const dy = targetPos.y - player.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) {
      // Dead zone
      const direction = { x: dx / distance, y: dy / distance };
      const speed = Math.min(player.speed, distance * 0.1); // Ease near target
      targetVelocity.x = direction.x * speed;
      targetVelocity.y = direction.y * speed;
    }
  }

  // Apply acceleration toward target velocity
  player.velocity.x += (targetVelocity.x - player.velocity.x) * GAME_CONFIG.PLAYER_ACCELERATION * dt;
  player.velocity.y += (targetVelocity.y - player.velocity.y) * GAME_CONFIG.PLAYER_ACCELERATION * dt;

  // Apply friction
  player.velocity.x *= Math.pow(GAME_CONFIG.PLAYER_FRICTION, dt);
  player.velocity.y *= Math.pow(GAME_CONFIG.PLAYER_FRICTION, dt);

  // Clamp velocity
  const speed = magnitude(player.velocity);
  if (speed > player.speed) {
    const scale = player.speed / speed;
    player.velocity.x *= scale;
    player.velocity.y *= scale;
  }

  // Calculate new position
  const newPosition: Position = {
    x: player.position.x + player.velocity.x * dt,
    y: player.position.y + player.velocity.y * dt,
  };

  // Check collision and correct position
  const collision = checkCollision(player, newPosition, maze);

  if (collision.collided) {
    // Apply wall sliding
    const slideVelocity = {
      x: player.velocity.x - collision.normal.x * (player.velocity.x * collision.normal.x + player.velocity.y * collision.normal.y),
      y: player.velocity.y - collision.normal.y * (player.velocity.x * collision.normal.x + player.velocity.y * collision.normal.y),
    };

    player.velocity.x = slideVelocity.x * GAME_CONFIG.WALL_SLIDE_FACTOR;
    player.velocity.y = slideVelocity.y * GAME_CONFIG.WALL_SLIDE_FACTOR;
    player.position = collision.correctedPosition;
  } else {
    player.position = newPosition;
  }

  return { player, collided: collision.collided };
}
