// LocalStorage wrapper for game data

import { SaveData, Settings } from '../core/types';

const STORAGE_KEY = 'maze-game-save';

const DEFAULT_SETTINGS: Settings = {
  sound: true,
  vibration: true,
  controlMode: 'mouse'
};

export class Storage {
  private static instance: Storage;
  private data: SaveData;

  private constructor() {
    this.data = this.load();
  }

  static getInstance(): Storage {
    if (!Storage.instance) {
      Storage.instance = new Storage();
    }
    return Storage.instance;
  }

  private load(): SaveData {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          currentLevel: parsed.currentLevel || 1,
          bestTimes: parsed.bestTimes || {},
          settings: { ...DEFAULT_SETTINGS, ...parsed.settings }
        };
      }
    } catch (e) {
      console.warn('Failed to load save data:', e);
    }

    return {
      currentLevel: 1,
      bestTimes: {},
      settings: DEFAULT_SETTINGS
    };
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save data:', e);
    }
  }

  getCurrentLevel(): number {
    return this.data.currentLevel;
  }

  setCurrentLevel(level: number): void {
    this.data.currentLevel = level;
    this.save();
  }

  getBestTime(level: number): number | null {
    return this.data.bestTimes[level] || null;
  }

  setBestTime(level: number, time: number): void {
    const current = this.data.bestTimes[level];
    if (!current || time < current) {
      this.data.bestTimes[level] = time;
      this.save();
    }
  }

  getSettings(): Settings {
    return { ...this.data.settings };
  }

  setSettings(settings: Settings): void {
    this.data.settings = { ...settings };
    this.save();
  }

  hasProgress(): boolean {
    return this.data.currentLevel > 1;
  }

  reset(): void {
    this.data = {
      currentLevel: 1,
      bestTimes: {},
      settings: DEFAULT_SETTINGS
    };
    this.save();
  }
}