/**
 * Web Audio synthesizer — generates simple sound effects in code.
 * No external audio files required.
 *
 * Sounds:
 *  - wallHit:  short low buzz (collision feedback)
 *  - levelWin: ascending 3-note arpeggio (success)
 *  - click:    soft high tick (button press)
 */

type AudioCtx = AudioContext;

export class AudioSynth {
  private ctx: AudioCtx | null = null;
  private enabled = true;

  /** Lazily initialise AudioContext (requires user gesture first on some browsers) */
  private getCtx(): AudioCtx | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => null);
    }
    return this.ctx;
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
  }

  /** Short low buzz on wall hit */
  wallHit(): void {
    this.playTone(80, 'sawtooth', 0.08, 0.05);
  }

  /** Rising arpeggio on level complete */
  levelWin(): void {
    const notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.2, 0.12), i * 120);
    });
  }

  /** Soft click on button */
  click(): void {
    this.playTone(440, 'sine', 0.06, 0.03);
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  private playTone(
    frequency: number,
    type: OscillatorType,
    gainPeak: number,
    duration: number,
  ): void {
    const ctx = this.getCtx();
    if (!ctx) return;

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(gainPeak, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.01);
  }
}
