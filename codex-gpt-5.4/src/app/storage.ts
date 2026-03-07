import { STORAGE_PROGRESS_KEY, STORAGE_SETTINGS_KEY } from '../game/config';
import { createDefaultProgress } from './state';
import type { ProgressState, SettingsState } from '../game/types';

function safeParse<T>(raw: string | null): T | null {
  if (raw === null) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadProgress(): ProgressState {
  if (typeof localStorage === 'undefined') {
    return createDefaultProgress();
  }

  const parsed = safeParse<ProgressState>(localStorage.getItem(STORAGE_PROGRESS_KEY));
  if (!parsed) {
    return createDefaultProgress();
  }

  return {
    currentLevel: Math.max(1, parsed.currentLevel || 1),
    sessionSeed: parsed.sessionSeed || '',
    bestTimesByLevel: parsed.bestTimesByLevel || {}
  };
}

export function saveProgress(progress: ProgressState): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(progress));
}

export function loadSettings(): Partial<SettingsState> {
  if (typeof localStorage === 'undefined') {
    return {};
  }

  return safeParse<SettingsState>(localStorage.getItem(STORAGE_SETTINGS_KEY)) ?? {};
}

export function saveSettings(settings: SettingsState): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
}
