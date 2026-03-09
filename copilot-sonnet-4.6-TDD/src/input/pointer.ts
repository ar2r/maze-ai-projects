/**
 * Pointer (mouse) input handler.
 *
 * On desktop, the player follows the mouse cursor direction.
 * Strategy: compute a direction vector from player position toward cursor.
 * When the cursor is far from the player, move at full speed.
 * When close (within deadzone), stop.
 *
 * This feels more natural than raw "mouse follow teleport" and respects walls.
 */

import type { InputVector } from '../types';

const DEADZONE_PX = 8; // World pixels — inside this radius, player stops

export class PointerInput {
  /** Mouse position in world coordinates (set by renderer.canvasToWorld) */
  private targetX = -9999;
  private targetY = -9999;
  private isDown  = false;
  private active  = false;

  private readonly canvas: HTMLCanvasElement;
  private worldTransform: (cx: number, cy: number) => { x: number; y: number };

  constructor(
    canvas: HTMLCanvasElement,
    worldTransform: (cx: number, cy: number) => { x: number; y: number },
  ) {
    this.canvas = canvas;
    this.worldTransform = worldTransform;
  }

  enable(): void {
    if (this.active) return;
    this.canvas.addEventListener('pointermove', this.onMove);
    this.canvas.addEventListener('pointerdown', this.onDown);
    this.canvas.addEventListener('pointerup',   this.onUp);
    this.canvas.addEventListener('pointerleave',this.onUp);
    this.active = true;
  }

  disable(): void {
    this.canvas.removeEventListener('pointermove', this.onMove);
    this.canvas.removeEventListener('pointerdown', this.onDown);
    this.canvas.removeEventListener('pointerup',   this.onUp);
    this.canvas.removeEventListener('pointerleave',this.onUp);
    this.isDown = false;
    this.active = false;
  }

  /** Call each frame to compute direction from player position toward cursor */
  getDirection(playerX: number, playerY: number): InputVector {
    if (!this.isDown && this.targetX === -9999) return { x: 0, y: 0 };
    // On desktop, always track (not just when pressed)
    // Direction: from player toward cursor
    const dx = this.targetX - playerX;
    const dy = this.targetY - playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < DEADZONE_PX) return { x: 0, y: 0 };
    return { x: dx / dist, y: dy / dist };
  }

  private readonly onMove = (e: PointerEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const world = this.worldTransform(cx, cy);
    this.targetX = world.x;
    this.targetY = world.y;
  };

  private readonly onDown = (e: PointerEvent): void => {
    this.isDown = true;
    this.canvas.setPointerCapture(e.pointerId);
    // Trigger onMove to set initial target
    this.onMove(e);
  };

  private readonly onUp = (_e: PointerEvent): void => {
    this.isDown = false;
  };
}
