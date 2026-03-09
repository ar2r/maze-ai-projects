import type { SaveData, Settings } from './types';

const STORAGE_KEY = 'maze-runner-save';

export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  vibrationEnabled: true,
  debugEnabled: false,
};

export const DEFAULT_SAVE: SaveData = {
  currentLevel: 1,
  bestTimes: {},
  settings: { ...DEFAULT_SETTINGS },
  tutorialShown: false,
};

/**
 * Load saved game data from localStorage.
 * Returns defaults if nothing saved or data is corrupted.
 */
export function loadData(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SAVE, settings: { ...DEFAULT_SETTINGS }, bestTimes: {} };

    const parsed = JSON.parse(raw);

    // Validate and merge with defaults
    return {
      currentLevel: typeof parsed.currentLevel === 'number' ? parsed.currentLevel : 1,
      bestTimes: parsed.bestTimes && typeof parsed.bestTimes === 'object' ? parsed.bestTimes : {},
      settings: {
        soundEnabled: parsed.settings?.soundEnabled ?? true,
        vibrationEnabled: parsed.settings?.vibrationEnabled ?? true,
        debugEnabled: parsed.settings?.debugEnabled ?? false,
      },
      tutorialShown: typeof parsed.tutorialShown === 'boolean' ? parsed.tutorialShown : false,
    };
  } catch {
    return { ...DEFAULT_SAVE, settings: { ...DEFAULT_SETTINGS }, bestTimes: {} };
  }
}

/**
 * Save game data to localStorage.
 */
export function saveData(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

/**
 * Save best time for a level. Only saves if better than existing.
 */
export function saveBestTime(level: number, time: number): void {
  const data = loadData();
  const existing = data.bestTimes[level];
  if (existing === undefined || time < existing) {
    data.bestTimes[level] = time;
    saveData(data);
  }
}

/**
 * Get best time for a level, or null if no record.
 */
export function getBestTime(level: number): number | null {
  const data = loadData();
  return data.bestTimes[level] ?? null;
}
