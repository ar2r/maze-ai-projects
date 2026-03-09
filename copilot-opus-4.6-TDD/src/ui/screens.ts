import type { ScreenState } from '../types';

/**
 * Screen manager — shows/hides HTML overlay screens.
 * Controls the state machine: menu -> playing -> paused -> results.
 */

const SCREEN_IDS: Record<ScreenState, string> = {
  menu: 'menu-screen',
  playing: '',           // no overlay for playing
  paused: 'pause-screen',
  results: 'results-screen',
  settings: 'settings-screen',
  tutorial: 'tutorial-screen',
};

/**
 * Show the specified screen, hide all others.
 */
export function showScreen(screen: ScreenState): void {
  // Hide all overlay screens
  const overlays = document.querySelectorAll('.screen-overlay');
  overlays.forEach((el) => {
    (el as HTMLElement).classList.add('hidden');
  });

  // Show pause button only during gameplay
  const pauseBtn = document.getElementById('pause-btn');
  if (pauseBtn) {
    pauseBtn.style.display = screen === 'playing' ? 'flex' : 'none';
  }

  // Show the target screen
  const id = SCREEN_IDS[screen];
  if (id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  }
}

/**
 * Update the results screen with level stats.
 */
export function updateResultsScreen(
  time: string,
  wallHits: number,
  bestTime: string | null,
): void {
  const timeEl = document.getElementById('result-time');
  const hitsEl = document.getElementById('result-hits');
  const bestEl = document.getElementById('result-best');

  if (timeEl) timeEl.textContent = time;
  if (hitsEl) hitsEl.textContent = String(wallHits);
  if (bestEl) bestEl.textContent = bestTime ?? '--';
}

/**
 * Show/hide the Continue button on the menu (only if progress exists).
 */
export function setContinueVisible(visible: boolean): void {
  const btn = document.getElementById('btn-continue');
  if (btn) btn.style.display = visible ? 'block' : 'none';
}

/**
 * Update a toggle button state.
 */
export function updateToggle(id: string, active: boolean): void {
  const btn = document.getElementById(id);
  if (!btn) return;
  if (active) {
    btn.classList.add('active');
    btn.textContent = 'ON';
  } else {
    btn.classList.remove('active');
    btn.textContent = 'OFF';
  }
}
