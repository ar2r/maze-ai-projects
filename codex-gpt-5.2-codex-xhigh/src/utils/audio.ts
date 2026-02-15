export class AudioManager {
  private context: AudioContext | null = null;
  private enabled = true;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  playTone(freq: number, duration: number, type: OscillatorType = 'sine'): void {
    if (!this.enabled) return;
    try {
      if (!this.context) this.context = new AudioContext();
      const ctx = this.context;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = 0.12;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.stop(ctx.currentTime + duration);
    } catch {
      // ignore audio errors
    }
  }

  playSuccess(): void {
    this.playTone(640, 0.18, 'triangle');
  }

  playCollision(): void {
    this.playTone(220, 0.08, 'square');
  }
}
