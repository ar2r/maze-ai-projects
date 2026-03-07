import { FIXED_TIME_STEP_MS, MAX_UPDATE_STEP_MS } from './config';

export class GameLoop {
  private frameId = 0;
  private lastTimestamp = 0;
  private accumulator = 0;
  private running = false;

  constructor(
    private readonly update: (dtSeconds: number) => void,
    private readonly render: (alpha: number) => void
  ) {}

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.lastTimestamp = performance.now();
    this.frameId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frameId);
  }

  private tick = (timestamp: number): void => {
    if (!this.running) {
      return;
    }

    const rawDelta = Math.min(MAX_UPDATE_STEP_MS, timestamp - this.lastTimestamp);
    this.lastTimestamp = timestamp;
    this.accumulator += rawDelta;

    while (this.accumulator >= FIXED_TIME_STEP_MS) {
      this.update(FIXED_TIME_STEP_MS / 1000);
      this.accumulator -= FIXED_TIME_STEP_MS;
    }

    this.render(this.accumulator / FIXED_TIME_STEP_MS);
    this.frameId = requestAnimationFrame(this.tick);
  };
}
