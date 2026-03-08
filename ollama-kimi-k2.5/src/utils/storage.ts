// LocalStorage wrapper with type safety

import type { SaveData } from '../types.js';

const STORAGE_KEY = 'maze-game-save';

const defaultSaveData: SaveData = {
  currentLevel: 1,
  bestTimes: {},
  settings: {
    sound: true,
    vibration: true,
    controlMode: 'auto',
  },
};

export function saveGame(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save game:', e);
  }
}

export function loadGame(): SaveData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultSaveData, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load game:', e);
  }
  return { ...defaultSaveData };
}

export function clearSave(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear save:', e);
  }
}

export function hasSaveData(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function updateSave(updates: Partial<SaveData>): SaveData {
  const current = loadGame();
  const updated = { ...current, ...updates };
  saveGame(updated);
  return updated;
}

export function setBestTime(level: number, time: number): void {
  const data = loadGame();
  const currentBest = data.bestTimes[level];
  if (currentBest === undefined || time < currentBest) {
    data.bestTimes[level] = time;
    saveGame(data);
  }
}

export function getBestTime(level: number): number | undefined {
  return loadGame().bestTimes[level];
}
