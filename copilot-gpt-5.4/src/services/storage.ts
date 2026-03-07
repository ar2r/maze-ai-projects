import type { GameSettings, ProgressData } from '../types';

const SETTINGS_KEY = 'maze.settings';
const PROGRESS_KEY = 'maze.progress';

export const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  controlMode: 'auto',
  debugOverlay: false,
};

export const DEFAULT_PROGRESS: ProgressData = {
  currentLevel: 1,
  bestTimes: {},
  sessionSeedBase: '',
};

export class StorageService {
  private readonly fallbackStore = new Map<string, string>();
  private readonly storageAvailable: boolean;
  private readonly searchParams = new URLSearchParams(window.location.search);

  constructor() {
    this.storageAvailable = this.checkStorageAvailability();
  }

  getSettings(): GameSettings {
    const stored = this.readJson<Partial<GameSettings>>(SETTINGS_KEY, {});
    const settings = {
      ...DEFAULT_SETTINGS,
      ...stored,
    };

    if (this.searchParams.get('debug') === '1') {
      settings.debugOverlay = true;
    }

    return settings;
  }

  saveSettings(settings: GameSettings): void {
    this.writeJson(SETTINGS_KEY, settings);
  }

  getProgress(): ProgressData {
    const stored = this.readJson<Partial<ProgressData>>(PROGRESS_KEY, {});
    return {
      ...DEFAULT_PROGRESS,
      ...stored,
      bestTimes: stored.bestTimes ?? {},
      sessionSeedBase: stored.sessionSeedBase ?? '',
      currentLevel: typeof stored.currentLevel === 'number' ? Math.max(1, stored.currentLevel) : 1,
    };
  }

  saveProgress(progress: ProgressData): void {
    this.writeJson(PROGRESS_KEY, progress);
  }

  private checkStorageAvailability(): boolean {
    try {
      const key = '__maze_probe__';
      window.localStorage.setItem(key, '1');
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  private readJson<T>(key: string, fallback: T): T {
    const raw = this.storageAvailable ? window.localStorage.getItem(key) : this.fallbackStore.get(key);
    if (!raw) {
      return fallback;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private writeJson<T>(key: string, value: T): void {
    const serialized = JSON.stringify(value);
    if (this.storageAvailable) {
      try {
        window.localStorage.setItem(key, serialized);
        return;
      } catch {
        // Fall back to in-memory storage below.
      }
    }

    this.fallbackStore.set(key, serialized);
  }
}
