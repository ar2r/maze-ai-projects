// LocalStorage persistence

import type { GameData, Settings } from '../types';

const STORAGE_KEY = 'maze_game_save';

export function saveGameData(data: Partial<GameData>): void {
  try {
    const existing = loadGameData();
    const merged = { ...existing, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    console.warn('Failed to save game data:', e);
  }
}

export function loadGameData(): GameData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      // Convert bestTimes object back to Map
      if (data.bestTimes && typeof data.bestTimes === 'object') {
        data.bestTimes = new Map(Object.entries(data.bestTimes));
      }
      return data;
    }
  } catch (e) {
    console.warn('Failed to load game data:', e);
  }

  return {
    currentLevel: 1,
    bestTimes: new Map(),
    totalCollisions: 0,
    totalPlayTime: 0,
    settings: {
      soundEnabled: true,
      vibrationEnabled: true,
      controlMode: 'auto',
      debugMode: false,
    },
  };
}

export function saveSettings(settings: Settings): void {
  const data = loadGameData();
  data.settings = settings;
  saveGameData(data);
}

export function loadSettings(): Settings {
  const data = loadGameData();
  return data.settings;
}

export function saveBestTime(level: number, time: number): void {
  const data = loadGameData();
  const existing = data.bestTimes.get(level);
  
  if (!existing || time < existing) {
    data.bestTimes.set(level, time);
    // Convert Map to object for JSON serialization
    const bestTimesObj = Object.fromEntries(data.bestTimes);
    saveGameData({ ...data, bestTimes: bestTimesObj as any });
  }
}

export function getBestTime(level: number): number | undefined {
  const data = loadGameData();
  return data.bestTimes.get(level);
}

export function clearSaveData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear save data:', e);
  }
}
