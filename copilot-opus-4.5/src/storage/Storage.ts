import { Settings, SaveData } from '../utils/types';
import { STORAGE_KEY, DEFAULT_SETTINGS } from '../utils/constants';

/**
 * LocalStorage wrapper for game progress and settings
 */
export class Storage {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  /** Load data from localStorage */
  private load(): SaveData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new settings
        return {
          currentLevel: parsed.currentLevel ?? 1,
          bestTimes: parsed.bestTimes ?? {},
          settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
        };
      }
    } catch (e) {
      console.warn('Failed to load save data:', e);
    }

    return {
      currentLevel: 1,
      bestTimes: {},
      settings: { ...DEFAULT_SETTINGS },
    };
  }

  /** Save data to localStorage */
  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save data:', e);
    }
  }

  /** Get current level */
  getCurrentLevel(): number {
    return this.data.currentLevel;
  }

  /** Set current level */
  setCurrentLevel(level: number): void {
    this.data.currentLevel = level;
    this.save();
  }

  /** Get best time for a level (in ms) */
  getBestTime(level: number): number | null {
    return this.data.bestTimes[level] ?? null;
  }

  /** Set best time for a level (returns true if it's a new record) */
  setBestTime(level: number, time: number): boolean {
    const current = this.data.bestTimes[level];
    if (current === undefined || time < current) {
      this.data.bestTimes[level] = time;
      this.save();
      return true;
    }
    return false;
  }

  /** Get settings */
  getSettings(): Settings {
    return { ...this.data.settings };
  }

  /** Update settings */
  setSettings(settings: Partial<Settings>): void {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
  }

  /** Check if there's any saved progress */
  hasProgress(): boolean {
    return this.data.currentLevel > 1;
  }

  /** Reset all progress (keep settings) */
  resetProgress(): void {
    this.data.currentLevel = 1;
    this.data.bestTimes = {};
    this.save();
  }
}
