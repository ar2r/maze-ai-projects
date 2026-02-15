// === Simple Audio System using Web Audio API ===

import { CONFIG } from '../config';
import { storage } from '../utils/storage';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    this.enabled = storage.getSettings().soundEnabled;
    this.initAudioContext();
  }

  private initAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      this.audioContext = null;
    }
  }

  private ensureContext(): void {
    if (!this.audioContext) {
      this.initAudioContext();
    }

    // Resume context if suspended (due to autoplay policies)
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  playCollision(): void {
    if (!this.enabled || !this.audioContext) return;

    this.ensureContext();

    try {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.frequency.value = CONFIG.AUDIO.COLLISION_FREQ;
      oscillator.type = 'square';

      gainNode.gain.setValueAtTime(0.1, this.audioContext!.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext!.currentTime + CONFIG.AUDIO.DURATION
      );

      oscillator.start();
      oscillator.stop(this.audioContext!.currentTime + CONFIG.AUDIO.DURATION);
    } catch (error) {
      console.warn('Failed to play collision sound:', error);
    }
  }

  playSuccess(): void {
    if (!this.enabled || !this.audioContext) return;

    this.ensureContext();

    try {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      // Ascending tone
      oscillator.frequency.setValueAtTime(
        CONFIG.AUDIO.SUCCESS_FREQ,
        this.audioContext!.currentTime
      );
      oscillator.frequency.exponentialRampToValueAtTime(
        CONFIG.AUDIO.SUCCESS_FREQ * 1.5,
        this.audioContext!.currentTime + 0.2
      );

      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.2, this.audioContext!.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext!.currentTime + 0.2
      );

      oscillator.start();
      oscillator.stop(this.audioContext!.currentTime + 0.2);
    } catch (error) {
      console.warn('Failed to play success sound:', error);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  updateSettings(): void {
    this.enabled = storage.getSettings().soundEnabled;
  }
}

// === Haptics ===

export class HapticsManager {
  private enabled: boolean = true;

  constructor() {
    this.enabled = storage.getSettings().vibrationEnabled;
  }

  vibrate(duration: number): void {
    if (!this.enabled) return;

    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  }

  vibrateCollision(): void {
    this.vibrate(CONFIG.HAPTICS.COLLISION_DURATION);
  }

  vibrateSuccess(): void {
    this.vibrate(CONFIG.HAPTICS.SUCCESS_DURATION);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  updateSettings(): void {
    this.enabled = storage.getSettings().vibrationEnabled;
  }
}
