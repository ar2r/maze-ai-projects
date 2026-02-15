import type { GameSettings, SaveData } from './types';

const SETTINGS_KEY = 'maze-runner-settings';
const SAVE_KEY = 'maze-runner-save';

const defaultSettings: GameSettings = {
  sound: true,
  vibration: true,
  controlMode: 'auto',
  debug: false,
};

const defaultSave: SaveData = {
  currentLevel: 1,
  bestTimes: {},
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...defaultSettings };
}

export function saveSettings(s: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return { ...defaultSave, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...defaultSave };
}

export function saveSave(s: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}
