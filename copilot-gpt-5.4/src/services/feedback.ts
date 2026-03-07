import type { GameSettings } from '../types';

export class FeedbackService {
  private settings: GameSettings;
  private audioContext: AudioContext | null = null;

  constructor(settings: GameSettings) {
    this.settings = settings;
  }

  updateSettings(settings: GameSettings): void {
    this.settings = settings;
  }

  button(): void {
    this.playTone(540, 0.04, 'triangle', 0.02);
  }

  wallHit(): void {
    this.playTone(180, 0.05, 'square', 0.025);
    this.vibrate(12);
  }

  levelComplete(): void {
    this.playTone(660, 0.08, 'triangle', 0.03);
    window.setTimeout(() => this.playTone(860, 0.1, 'sine', 0.025), 70);
    this.vibrate([25, 35, 50]);
  }

  private playTone(frequency: number, durationSeconds: number, type: OscillatorType, volume: number): void {
    if (!this.settings.soundEnabled || typeof window.AudioContext === 'undefined') {
      return;
    }

    const audioContext = this.getAudioContext();
    if (!audioContext) {
      return;
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const startTime = audioContext.currentTime;
    const endTime = startTime + durationSeconds;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gainNode.gain.setValueAtTime(volume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(startTime);
    oscillator.stop(endTime);
  }

  private vibrate(pattern: number | number[]): void {
    if (!this.settings.vibrationEnabled || typeof navigator.vibrate !== 'function') {
      return;
    }

    navigator.vibrate(pattern);
  }

  private getAudioContext(): AudioContext | null {
    if (this.audioContext) {
      void this.audioContext.resume();
      return this.audioContext;
    }

    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) {
      return null;
    }

    this.audioContext = new AudioContextConstructor();
    void this.audioContext.resume();
    return this.audioContext;
  }
}
