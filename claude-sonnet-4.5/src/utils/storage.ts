// === LocalStorage Wrapper ===

import type { SaveData, GameSettings, LevelProgress } from '../types';
import { CONFIG } from '../config';

const STORAGE_KEY = 'maze_runner_save';

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  controlMode: 'auto',
  debugMode: false,
};

const DEFAULT_SAVE_DATA: SaveData = {
  currentLevel: 1,
  bestLevel: 1,
  totalPlayTime: 0,
  levelProgress: {},
  settings: DEFAULT_SETTINGS,
  version: CONFIG.VERSION,
};

export class Storage {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  private load(): SaveData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return { ...DEFAULT_SAVE_DATA };

      const parsed = JSON.parse(stored) as SaveData;

      // Version migration (if needed in future)
      if (parsed.version !== CONFIG.VERSION) {
        console.log('Save data version mismatch, migrating...');
        // Add migration logic here if needed
      }

      // Merge with defaults to handle new fields
      return {
        ...DEFAULT_SAVE_DATA,
        ...parsed,
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      };
    } catch (error) {
      console.error('Failed to load save data:', error);
      return { ...DEFAULT_SAVE_DATA };
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  // === Getters ===

  getCurrentLevel(): number {
    return this.data.currentLevel;
  }

  getBestLevel(): number {
    return this.data.bestLevel;
  }

  getTotalPlayTime(): number {
    return this.data.totalPlayTime;
  }

  getLevelProgress(level: number): LevelProgress | null {
    return this.data.levelProgress[level] ?? null;
  }

  getSettings(): GameSettings {
    return { ...this.data.settings };
  }

  getAllLevelProgress(): Record<number, LevelProgress> {
    return { ...this.data.levelProgress };
  }

  // === Setters ===

  setCurrentLevel(level: number): void {
    this.data.currentLevel = level;
    this.data.bestLevel = Math.max(this.data.bestLevel, level);
    this.save();
  }

  addPlayTime(seconds: number): void {
    this.data.totalPlayTime += seconds;
    this.save();
  }

  saveLevelProgress(level: number, progress: Omit<LevelProgress, 'level'>): void {
    const existing = this.data.levelProgress[level];

    // Update best time if better or first completion
    const bestTime = existing?.bestTime !== null && existing?.bestTime !== undefined
      ? Math.min(existing.bestTime, progress.bestTime ?? Infinity)
      : progress.bestTime;

    this.data.levelProgress[level] = {
      level,
      bestTime: bestTime ?? null,
      wallHits: progress.wallHits,
      timestamp: progress.timestamp,
    };

    this.save();
  }

  updateSettings(settings: Partial<GameSettings>): void {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
  }

  // === Utilities ===

  resetProgress(): void {
    this.data = { ...DEFAULT_SAVE_DATA };
    this.save();
  }

  hasProgress(): boolean {
    return this.data.currentLevel > 1 || Object.keys(this.data.levelProgress).length > 0;
  }
}

// Singleton instance
export const storage = new Storage();
