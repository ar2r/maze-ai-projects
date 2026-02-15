import type { ControlScheme } from './input';

type Progress = {
  level: number;
  bestTimes: Record<number, number>;
  runSeed: number;
  settings: Settings;
};

export type Settings = {
  sound: boolean;
  vibration: boolean;
  control: ControlScheme;
};

const KEY = 'maze-progress-v1';

const defaultSettings: Settings = {
  sound: true,
  vibration: true,
  control: 'mouse-follow'
};

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return createDefault();
    const parsed = JSON.parse(raw) as Progress;
    return {
      level: parsed.level ?? 1,
      bestTimes: parsed.bestTimes ?? {},
      runSeed: parsed.runSeed ?? Date.now(),
      settings: { ...defaultSettings, ...(parsed.settings ?? {}) }
    };
  } catch {
    return createDefault();
  }
}

export function saveProgress(progress: Progress) {
  localStorage.setItem(KEY, JSON.stringify(progress));
}

function createDefault(): Progress {
  return {
    level: 1,
    bestTimes: {},
    runSeed: Date.now(),
    settings: { ...defaultSettings }
  };
}

export function getDefaultSettings(): Settings {
  return { ...defaultSettings };
}
