import type { ControlMode } from '../game/input';

export interface PersistedState {
  version: 1;
  level: number;
  bestTimes: Record<string, number>;
  levelSeeds: Record<string, number>;
  settings: {
    sound: boolean;
    vibration: boolean;
    controlMode: ControlMode;
  };
}

const STORAGE_KEY = 'maze-drift-state-v1';

export function defaultState(): PersistedState {
  return {
    version: 1,
    level: 1,
    bestTimes: {},
    levelSeeds: {},
    settings: {
      sound: true,
      vibration: true,
      controlMode: 'joystick'
    }
  };
}

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed || parsed.version !== 1) return defaultState();
    return { ...defaultState(), ...parsed, settings: { ...defaultState().settings, ...parsed.settings } };
  } catch {
    return defaultState();
  }
}

export function saveState(state: PersistedState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
