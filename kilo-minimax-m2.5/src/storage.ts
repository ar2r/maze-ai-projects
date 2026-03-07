export interface SavedGame {
  level: number;
  playerX: number;
  playerY: number;
  timestamp: number;
}

const STORAGE_KEY = 'maze_runner_save';

export function saveGame(state: SavedGame): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save game:', e);
  }
}

export function loadGame(): SavedGame | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Failed to load game:', e);
  }
  return null;
}

export function clearSave(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear save:', e);
  }
}

const BEST_LEVEL_KEY = 'maze_runner_best';

export function getBestLevel(): number {
  try {
    const data = localStorage.getItem(BEST_LEVEL_KEY);
    return data ? parseInt(data, 10) : 0;
  } catch {
    return 0;
  }
}

export function setBestLevel(level: number): void {
  try {
    const current = getBestLevel();
    if (level > current) {
      localStorage.setItem(BEST_LEVEL_KEY, level.toString());
    }
  } catch (e) {
    console.warn('Failed to save best level:', e);
  }
}
