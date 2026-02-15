import type { ControlMode, GameSettings, PersistedState } from './types';

const STORAGE_KEY = 'maze-runner-state-v1';

export const DEFAULT_SETTINGS: GameSettings = {
  controlMode: 'auto',
  soundEnabled: true,
  vibrationEnabled: true
};

const DEFAULT_STATE: PersistedState = {
  hasProgress: false,
  currentLevel: 1,
  baseSeed: (Date.now() >>> 0) || 1,
  bestTimes: {},
  settings: DEFAULT_SETTINGS,
  debugEnabled: false
};

export function loadPersistedState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_STATE, settings: { ...DEFAULT_SETTINGS }, bestTimes: {} };
    }

    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const controlMode = normalizeControlMode(parsed.settings?.controlMode);

    return {
      hasProgress: Boolean(parsed.hasProgress),
      currentLevel: Math.max(1, Number(parsed.currentLevel ?? 1)),
      baseSeed: normalizeSeed(parsed.baseSeed),
      bestTimes: normalizeBestTimes(parsed.bestTimes),
      settings: {
        controlMode,
        soundEnabled: parsed.settings?.soundEnabled !== false,
        vibrationEnabled: parsed.settings?.vibrationEnabled !== false
      },
      debugEnabled: Boolean(parsed.debugEnabled)
    };
  } catch {
    return { ...DEFAULT_STATE, settings: { ...DEFAULT_SETTINGS }, bestTimes: {} };
  }
}

export function persistState(state: PersistedState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function bestTimeForLevel(state: PersistedState, level: number): number | null {
  const key = String(level);
  const value = state.bestTimes[key];
  return typeof value === 'number' ? value : null;
}

function normalizeSeed(seed: unknown): number {
  const numeric = Number(seed);
  if (!Number.isFinite(numeric)) {
    return (Date.now() >>> 0) || 1;
  }
  return (numeric >>> 0) || 1;
}

function normalizeControlMode(mode: unknown): ControlMode {
  if (mode === 'drag' || mode === 'joystick') {
    return mode;
  }
  return 'auto';
}

function normalizeBestTimes(input: unknown): Record<string, number> {
  if (!input || typeof input !== 'object') {
    return {};
  }

  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(input)) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      continue;
    }
    result[key] = numeric;
  }
  return result;
}
