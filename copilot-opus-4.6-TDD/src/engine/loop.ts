/**
 * Game loop using requestAnimationFrame.
 * Provides fixed delta time capping and pause support.
 */

export type UpdateFn = (dt: number) => void;
export type RenderFn = () => void;

export interface GameLoop {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  isPaused(): boolean;
}

/**
 * Create a game loop with configurable update and render callbacks.
 *
 * @param onUpdate - Called with delta time (seconds) each frame
 * @param onRender - Called after update to render the frame
 * @param maxDt - Maximum delta time cap (default 0.05 = 50ms, prevents spiral of death)
 */
export function createGameLoop(
  onUpdate: UpdateFn,
  onRender: RenderFn,
  maxDt: number = 0.05,
): GameLoop {
  let running = false;
  let paused = false;
  let lastTime = 0;
  let rafId = 0;

  function tick(time: number): void {
    if (!running) return;

    rafId = requestAnimationFrame(tick);

    if (lastTime === 0) {
      lastTime = time;
      return;
    }

    let dt = (time - lastTime) / 1000; // ms to seconds
    lastTime = time;

    // Cap delta time to prevent physics issues after tab switch
    if (dt > maxDt) dt = maxDt;

    if (!paused) {
      onUpdate(dt);
    }

    onRender();
  }

  return {
    start() {
      if (running) return;
      running = true;
      paused = false;
      lastTime = 0;
      rafId = requestAnimationFrame(tick);
    },

    stop() {
      running = false;
      paused = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    },

    pause() {
      paused = true;
    },

    resume() {
      paused = false;
      lastTime = 0; // Reset time to avoid big dt jump
    },

    isPaused() {
      return paused;
    },
  };
}
