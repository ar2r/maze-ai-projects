/**
 * Haptics — Vibration API wrapper.
 * Gracefully degrades on unsupported devices.
 */

export class Haptics {
  private enabled = true;
  private supported = 'vibrate' in navigator;

  setEnabled(on: boolean): void {
    this.enabled = on;
  }

  /** Short buzz on wall hit */
  wallHit(): void {
    this.vibrate(18);
  }

  /** Longer double-pulse on level complete */
  levelWin(): void {
    this.vibrate([60, 40, 60]);
  }

  private vibrate(pattern: number | number[]): void {
    if (!this.enabled || !this.supported) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // Some browsers throw on restrictive policies
    }
  }
}
