export class AudioFeedback {
  private audioContext: AudioContext | null = null;
  private enabled = true;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  unlock(): void {
    if (!this.enabled) {
      return;
    }

    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    if (this.audioContext.state === 'suspended') {
      void this.audioContext.resume();
    }
  }

  playCollision(): void {
    this.beep(180, 0.04, 0.03, 'square');
  }

  playWin(): void {
    this.beep(420, 0.08, 0.05, 'sine');
    this.beep(620, 0.11, 0.04, 'triangle', 0.05);
  }

  playUiClick(): void {
    this.beep(300, 0.035, 0.025, 'triangle');
  }

  private beep(
    frequency: number,
    durationSeconds: number,
    volume: number,
    type: OscillatorType,
    offsetSeconds = 0
  ): void {
    if (!this.enabled) {
      return;
    }

    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    const context = this.audioContext;
    if (context.state === 'suspended') {
      return;
    }

    const start = context.currentTime + offsetSeconds;
    const end = start + durationSeconds;

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(start);
    oscillator.stop(end + 0.01);
  }
}
