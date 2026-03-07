let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
    return null;
  }

  if (audioContext === null) {
    audioContext = new window.AudioContext();
  }

  return audioContext;
}

export function playBeep(enabled: boolean, frequency: number, durationMs: number, gainValue = 0.04): void {
  if (!enabled) {
    return;
  }

  const context = getContext();
  if (context === null) {
    return;
  }

  const now = context.currentTime;
  const osc = context.createOscillator();
  const gain = context.createGain();

  osc.type = 'sine';
  osc.frequency.value = frequency;
  gain.gain.value = gainValue;
  gain.gain.setValueAtTime(gainValue, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);

  osc.connect(gain);
  gain.connect(context.destination);
  osc.start(now);
  osc.stop(now + durationMs / 1000);
}
