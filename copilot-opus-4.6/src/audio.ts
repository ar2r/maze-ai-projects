/**
 * Procedural audio using Web Audio API.
 * Simple bleeps/bloops — no external assets.
 */
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15): void {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function playWallHit(): void {
  playTone(150, 0.08, 'square', 0.1);
}

export function playLevelComplete(): void {
  playTone(523, 0.15, 'sine', 0.15);
  setTimeout(() => playTone(659, 0.15, 'sine', 0.15), 120);
  setTimeout(() => playTone(784, 0.25, 'sine', 0.15), 240);
}

export function playMenuClick(): void {
  playTone(440, 0.06, 'sine', 0.08);
}

/**
 * Vibrate device (if supported).
 */
export function vibrate(ms: number): void {
  try {
    navigator?.vibrate?.(ms);
  } catch { /* ignore */ }
}
