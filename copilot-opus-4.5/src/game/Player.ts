import { PlayerState } from '../utils/types';
import { PLAYER_BASE_RADIUS, PLAYER_BASE_SPEED } from '../utils/constants';

/**
 * Player entity with position and physics
 */
export class Player {
  state: PlayerState;
  private speed: number;

  constructor(startX: number, startY: number, speed: number = PLAYER_BASE_SPEED) {
    this.speed = speed;
    this.state = {
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      radius: PLAYER_BASE_RADIUS,
    };
  }

  /** Update player position based on input */
  update(dx: number, dy: number, dt: number): void {
    // Normalize diagonal movement
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }

    // Apply velocity
    this.state.vx = dx * this.speed;
    this.state.vy = dy * this.speed;

    // Update position
    this.state.x += this.state.vx * dt;
    this.state.y += this.state.vy * dt;
  }

  /** Set player position directly (for collision resolution) */
  setPosition(x: number, y: number): void {
    this.state.x = x;
    this.state.y = y;
  }

  /** Reset player to start position */
  reset(startX: number, startY: number): void {
    this.state.x = startX;
    this.state.y = startY;
    this.state.vx = 0;
    this.state.vy = 0;
  }

  /** Set player speed */
  setSpeed(speed: number): void {
    this.speed = speed;
  }

  /** Set player radius */
  setRadius(radius: number): void {
    this.state.radius = radius;
  }
}
