import { describe, it, expect, beforeEach } from 'vitest';
import { saveData, loadData, saveBestTime, getBestTime, DEFAULT_SAVE } from '../src/storage';

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { for (const k of Object.keys(store)) delete store[k]; },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};

// Replace global localStorage
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

describe('Storage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should return default save data when nothing saved', () => {
    const data = loadData();
    expect(data.currentLevel).toBe(1);
    expect(data.tutorialShown).toBe(false);
    expect(data.settings.soundEnabled).toBe(true);
    expect(data.bestTimes).toEqual({});
  });

  it('should save and load data correctly', () => {
    const data = { ...DEFAULT_SAVE, currentLevel: 5, tutorialShown: true };
    saveData(data);
    const loaded = loadData();
    expect(loaded.currentLevel).toBe(5);
    expect(loaded.tutorialShown).toBe(true);
  });

  it('should save and retrieve best time for a level', () => {
    saveBestTime(3, 25.5);
    expect(getBestTime(3)).toBe(25.5);
    expect(getBestTime(4)).toBeNull();
  });

  it('should update best time only if new time is better', () => {
    saveBestTime(1, 30);
    saveBestTime(1, 20); // better
    saveBestTime(1, 25); // worse
    expect(getBestTime(1)).toBe(20);
  });

  it('should handle corrupted localStorage gracefully', () => {
    localStorageMock.setItem('maze-runner-save', 'not json{{{');
    const data = loadData();
    expect(data.currentLevel).toBe(1); // falls back to default
  });

  it('should persist settings', () => {
    const data = loadData();
    data.settings.soundEnabled = false;
    data.settings.vibrationEnabled = false;
    saveData(data);

    const loaded = loadData();
    expect(loaded.settings.soundEnabled).toBe(false);
    expect(loaded.settings.vibrationEnabled).toBe(false);
  });
});
