import { DEFAULT_SETTINGS } from '../game/config';
import type { GameSessionState, ProgressState, SettingsState } from '../game/types';

export function createDefaultProgress(): ProgressState {
  return {
    currentLevel: 1,
    sessionSeed: '',
    bestTimesByLevel: {}
  };
}

export function createInitialState(progress?: ProgressState, settings?: Partial<SettingsState>): GameSessionState {
  return {
    screen: 'menu',
    progress: progress ?? createDefaultProgress(),
    settings: {
      ...DEFAULT_SETTINGS,
      ...settings
    },
    level: null,
    player: null,
    startedAtMs: 0,
    elapsedBeforePauseMs: 0,
    result: null
  };
}
