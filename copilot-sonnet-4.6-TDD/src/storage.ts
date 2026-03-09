/**
 * localStorage wrapper — save/load game progress and settings.
 *
 * All data is stored under a single key to keep the API simple.
 * Handles quota errors and JSON parse failures gracefully.
 */

import type { SaveData, AppSettings } from './types';

const STORAGE_KEY = 'maze-runner-v1';

const DEFAULT_SETTINGS: AppSettings = {
  sound: true,
  vibration: true,
  controlMode: 'mouse',
};

const DEFAULT_SAVE: SaveData = {
  currentLevel: 1,
  userSeed: Math.floor(Math.random() * 0xFFFFFF),
  bestTimes: {},
  settings: { ...DEFAULT_SETTINGS },
};

/** Load save data from localStorage. Falls back to defaults on error. */
export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SAVE, settings: { ...DEFAULT_SETTINGS } };
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    // Merge with defaults to handle missing fields (e.g. app version upgrades)
    return {
      currentLevel: parsed.currentLevel ?? 1,
      userSeed:     parsed.userSeed     ?? DEFAULT_SAVE.userSeed,
      bestTimes:    parsed.bestTimes    ?? {},
      settings: {
        ...DEFAULT_SETTINGS,
        ...(parsed.settings ?? {}),
      },
    };
  } catch {
    return { ...DEFAULT_SAVE, settings: { ...DEFAULT_SETTINGS } };
  }
}

/** Persist save data. Silently handles quota exceeded. */
export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage quota exceeded or private-browsing restriction — ignore
    console.warn('[storage] Could not write to localStorage');
  }
}

/** Update best time for a level. Returns true if it's a new record. */
export function recordBestTime(data: SaveData, level: number, timeMs: number): boolean {
  const prev = data.bestTimes[level];
  if (prev === undefined || timeMs < prev) {
    data.bestTimes[level] = timeMs;
    return true;
  }
  return false;
}

/** Convenience: get best time for a level, or undefined */
export function getBestTime(data: SaveData, level: number): number | undefined {
  return data.bestTimes[level];
}

/** Reset all progress (keep settings). */
export function resetProgress(data: SaveData): SaveData {
  return {
    ...data,
    currentLevel: 1,
    bestTimes: {},
  };
}
