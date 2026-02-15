import type { ProgressData, Settings } from '../core/types';

const PROGRESS_KEY = 'maze-game:progress:v1';
const SETTINGS_KEY = 'maze-game:settings:v1';

const defaultSettings: Settings = {
  controlMode: 'drag',
  vibration: true,
  sound: false,
  debugOverlay: false
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadProgress(): ProgressData {
  const fallback: ProgressData = {
    currentLevel: 1,
    bestTimesByLevel: {},
    sessionSeedBase: String(Date.now())
  };

  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<ProgressData>;
    return {
      currentLevel: parsed.currentLevel ?? fallback.currentLevel,
      bestTimesByLevel: parsed.bestTimesByLevel ?? fallback.bestTimesByLevel,
      sessionSeedBase: parsed.sessionSeedBase ?? fallback.sessionSeedBase
    };
  } catch {
    return fallback;
  }
}

export function saveProgress(progress: ProgressData): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}
