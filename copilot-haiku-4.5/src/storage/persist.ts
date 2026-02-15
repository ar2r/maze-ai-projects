// ============================================================================
// Persistent Storage (localStorage)
// ============================================================================

import type { GameSettings } from '../game/types';

interface SaveData {
  currentLevel: number;
  levelBestTimes: Record<number, number>; // level -> best time in ms
  settings: GameSettings;
}

const STORAGE_KEY = 'maze-game-save';

export class StorageManager {
  static save(data: SaveData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  static load(): SaveData | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
      return null;
    }
  }

  static clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }
  }

  static saveLevel(levelNumber: number, timeMs: number): void {
    const data = this.load() || this.getDefaultSaveData();
    if (!data.levelBestTimes) {
      data.levelBestTimes = {};
    }

    const currentBest = data.levelBestTimes[levelNumber];
    if (!currentBest || timeMs < currentBest) {
      data.levelBestTimes[levelNumber] = timeMs;
    }

    data.currentLevel = Math.max(data.currentLevel, levelNumber);
    this.save(data);
  }

  static getBestTime(levelNumber: number): number | null {
    const data = this.load();
    return data?.levelBestTimes?.[levelNumber] ?? null;
  }

  static getCurrentLevel(): number {
    const data = this.load();
    return data?.currentLevel ?? 1;
  }

  static saveSettings(settings: GameSettings): void {
    const data = this.load() || this.getDefaultSaveData();
    data.settings = settings;
    this.save(data);
  }

  static loadSettings(): GameSettings | null {
    const data = this.load();
    return data?.settings ?? null;
  }

  private static getDefaultSaveData(): SaveData {
    return {
      currentLevel: 1,
      levelBestTimes: {},
      settings: {
        soundEnabled: true,
        vibrationEnabled: true,
        controlMode: 'mouse-follow',
        difficulty: 'normal',
        showDebugOverlay: false,
      },
    };
  }
}
