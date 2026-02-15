import { Game } from './game/Game';

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();

  // Expose game instance for debugging
  if (import.meta.env.DEV) {
    (window as unknown as { game: Game }).game = game;
  }

  // Handle cleanup on page unload
  window.addEventListener('beforeunload', () => {
    game.destroy();
  });
});

// Prevent pull-to-refresh on mobile
document.body.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false });

// Prevent double-tap zoom
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false });
