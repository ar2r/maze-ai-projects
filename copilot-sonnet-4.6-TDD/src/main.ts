/**
 * main.ts — application entry point.
 *
 * Responsibilities:
 *  1. Get the canvas element.
 *  2. Instantiate the Game.
 *  3. Boot it.
 *  4. Handle debug mode activation from URL param.
 */

import { Game } from './engine/game';
import { DebugOverlay } from './ui/debug';
import { isDebugMode } from './utils';

// ─── Bootstrap ───────────────────────────────────────────────────────────────

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
if (!canvas) {
  throw new Error('[main] #game-canvas not found in DOM');
}

// Create and start the game
const game = new Game(canvas);
game.start();

// ─── Debug mode (URL ?debug=1) ────────────────────────────────────────────────

if (isDebugMode()) {
  // The DebugOverlay is already instantiated inside Game, but we can show it
  // externally too by accessing the DOM element directly.
  const debugOverlay = new DebugOverlay();
  debugOverlay.show();
  console.info('[Maze Runner] Debug mode active. Press ` to toggle overlay.');
}

// ─── Prevent context menu on long-press (mobile) ─────────────────────────────
canvas.addEventListener('contextmenu', e => e.preventDefault());

// ─── Prevent zoom on double-tap (mobile) ─────────────────────────────────────
let lastTap = 0;
canvas.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTap < 300) {
    e.preventDefault();
  }
  lastTap = now;
}, { passive: false });
