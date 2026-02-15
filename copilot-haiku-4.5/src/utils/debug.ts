// ============================================================================
// Debug Utilities
// ============================================================================

export class DebugOverlay {
  private frameCount: number = 0;
  private lastSecond: number = performance.now();
  private fps: number = 0;
  private isEnabled: boolean = false;

  toggle(): void {
    this.isEnabled = !this.isEnabled;
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  isActive(): boolean {
    return this.isEnabled;
  }

  updateFPS(): number {
    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.lastSecond;

    if (elapsed >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastSecond = now;
    }

    return this.fps;
  }

  getFPS(): number {
    return this.fps;
  }

  reset(): void {
    this.frameCount = 0;
    this.fps = 0;
    this.lastSecond = performance.now();
  }
}

/**
 * Log object as table for development
 */
export function logTable(data: any): void {
  if (typeof console.table === 'function') {
    console.table(data);
  } else {
    console.log(data);
  }
}

/**
 * Performance profiling helper
 */
export class Profiler {
  private marks: Map<string, number> = new Map();

  start(label: string): void {
    this.marks.set(label, performance.now());
  }

  end(label: string): number {
    const startTime = this.marks.get(label);
    if (!startTime) {
      console.warn(`Profiler: No start mark for "${label}"`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(label);
    return duration;
  }

  measure(label: string, fn: () => void): number {
    this.start(label);
    fn();
    return this.end(label);
  }
}
