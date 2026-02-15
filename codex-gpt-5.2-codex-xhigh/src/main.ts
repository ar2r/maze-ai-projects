import './style.css';
import { GameEngine } from './game/engine';
import { InputController, type ControlMode } from './game/input';
import { VirtualJoystick } from './ui/joystick';
import { DebugOverlay } from './debug/overlay';
import { loadState, saveState, type PersistedState } from './utils/storage';
import { qs, show, hide } from './utils/dom';
import { hash32 } from './game/rng';
import { AudioManager } from './utils/audio';

const mazeCanvas = qs<HTMLCanvasElement>('#maze-canvas');
const playCanvas = qs<HTMLCanvasElement>('#play-canvas');
const levelInfo = qs<HTMLDivElement>('#level-info');
const timerEl = qs<HTMLDivElement>('#timer');
const hintEl = qs<HTMLDivElement>('#hint');
const pauseBtn = qs<HTMLButtonElement>('#pause-btn');

const screenMenu = qs<HTMLElement>('#screen-menu');
const screenSettings = qs<HTMLElement>('#screen-settings');
const screenPause = qs<HTMLElement>('#screen-pause');
const screenResults = qs<HTMLElement>('#screen-results');

const btnStart = qs<HTMLButtonElement>('#btn-start');
const btnContinue = qs<HTMLButtonElement>('#btn-continue');
const btnSettings = qs<HTMLButtonElement>('#btn-settings');
const btnSettingsBack = qs<HTMLButtonElement>('#btn-settings-back');
const btnResume = qs<HTMLButtonElement>('#btn-resume');
const btnRetry = qs<HTMLButtonElement>('#btn-retry');
const btnExit = qs<HTMLButtonElement>('#btn-exit');
const btnNext = qs<HTMLButtonElement>('#btn-next');
const btnRetryResults = qs<HTMLButtonElement>('#btn-retry-results');
const btnExitResults = qs<HTMLButtonElement>('#btn-exit-results');

const resultTime = qs<HTMLSpanElement>('#result-time');
const resultCollisions = qs<HTMLSpanElement>('#result-collisions');
const resultBest = qs<HTMLSpanElement>('#result-best');

const toggleSound = qs<HTMLInputElement>('#toggle-sound');
const toggleVibration = qs<HTMLInputElement>('#toggle-vibration');
const selectControl = qs<HTMLSelectElement>('#select-control');

const joystickEl = qs<HTMLElement>('#joystick');
const debugEl = qs<HTMLElement>('#debug-overlay');

const joystick = new VirtualJoystick(joystickEl);
const input = new InputController(playCanvas, joystick);
const audio = new AudioManager();
let state: PersistedState = loadState();
const isTouch = navigator.maxTouchPoints > 0;
if (!localStorage.getItem('maze-drift-state-v1')) {
  state.settings.controlMode = isTouch ? 'joystick' : 'drag';
}
if (!('vibrate' in navigator)) {
  state.settings.vibration = false;
}

const engine = new GameEngine(mazeCanvas, playCanvas, input, {
  onComplete: (stats) => onLevelComplete(stats.timeMs, stats.collisions, stats.level),
  onStats: (stats) => onStats(stats.timeMs, stats.collisions, stats.level, stats.seed),
  onCollision: () => onCollision()
});

const debug = new DebugOverlay(debugEl);
const debugEnabled = new URLSearchParams(window.location.search).has('debug') ||
  localStorage.getItem('maze-debug') === '1';

debug.setEnabled(debugEnabled);

let lastStatsUpdate = 0;
let lastDebugTick = performance.now();
let currentLevel = state.level;
let activeScreen: 'menu' | 'settings' | 'pause' | 'results' | 'game' = 'menu';

function onStats(timeMs: number, collisions: number, level: number, seed: number): void {
  const now = performance.now();
  if (now - lastStatsUpdate > 120) {
    timerEl.textContent = formatTime(timeMs);
    levelInfo.textContent = `Level ${level}`;
    lastStatsUpdate = now;
  }
  const maze = engine.getMaze();
  const layout = engine.getLayout();
  const player = engine.getPlayer();
  if (maze) {
    const dt = (now - lastDebugTick) / 1000;
    debug.tick(dt, { level, seed, timeMs, collisions, finished: false }, maze, layout, player);
    lastDebugTick = now;
  }
}

function onCollision(): void {
  if (state.settings.vibration && navigator.vibrate) {
    navigator.vibrate(10);
  }
  if (state.settings.sound) {
    audio.playCollision();
  }
}

function onLevelComplete(timeMs: number, collisions: number, level: number): void {
  if (state.settings.sound) audio.playSuccess();

  const bestKey = String(level);
  const currentBest = state.bestTimes[bestKey];
  if (currentBest === undefined || timeMs < currentBest) {
    state.bestTimes[bestKey] = timeMs;
  }
  state.level = Math.max(state.level, level + 1);
  saveState(state);

  resultTime.textContent = formatTime(timeMs);
  resultCollisions.textContent = String(collisions);
  resultBest.textContent = formatTime(state.bestTimes[bestKey]);

  setScreen('results');
}

function startLevel(level: number, resetSeed: boolean): void {
  currentLevel = level;
  const seed = getSeedForLevel(level, resetSeed);
  engine.startLevel(level, seed);
  input.setMode(state.settings.controlMode);
  updateHints();
  setScreen('game');
  state.level = Math.max(state.level, level);
  saveState(state);
}

function getSeedForLevel(level: number, reset: boolean): number {
  const key = String(level);
  if (!reset && state.levelSeeds[key]) return state.levelSeeds[key];
  const seed = hash32(`${level}-${Date.now()}-${Math.random()}`);
  state.levelSeeds[key] = seed;
  saveState(state);
  return seed;
}

function setScreen(screen: 'menu' | 'settings' | 'pause' | 'results' | 'game'): void {
  activeScreen = screen;
  hide(screenMenu);
  hide(screenSettings);
  hide(screenPause);
  hide(screenResults);

  if (screen === 'menu') show(screenMenu);
  if (screen === 'settings') show(screenSettings);
  if (screen === 'pause') show(screenPause);
  if (screen === 'results') show(screenResults);

  const playing = screen === 'game';
  document.body.classList.toggle('playing', playing || screen === 'pause');
  pauseBtn.hidden = !playing;
  hintEl.hidden = !playing;
  engine.setPaused(!playing);
  if (screen === 'menu') {
    btnContinue.disabled = state.level <= 1;
  }
}

function updateHints(): void {
  const mode = state.settings.controlMode;
  if (mode === 'joystick') {
    hintEl.textContent = 'Джойстик: удерживай и веди • WASD тоже работает';
  } else {
    hintEl.textContent = 'Drag: удерживай курсор • WASD / стрелки';
  }
}

function syncSettingsUI(): void {
  toggleSound.checked = state.settings.sound;
  toggleVibration.checked = state.settings.vibration;
  selectControl.value = state.settings.controlMode;
  input.setMode(state.settings.controlMode);
  audio.setEnabled(state.settings.sound);
}

function formatTime(timeMs: number): string {
  const totalSeconds = Math.max(0, timeMs) / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${seconds.toFixed(1).padStart(4, '0')}`;
}

btnStart.addEventListener('click', () => {
  state = { ...state, level: 1, levelSeeds: {} };
  saveState(state);
  startLevel(1, true);
});

btnContinue.addEventListener('click', () => {
  startLevel(state.level, false);
});

btnSettings.addEventListener('click', () => setScreen('settings'));
btnSettingsBack.addEventListener('click', () => {
  state.settings.sound = toggleSound.checked;
  state.settings.vibration = toggleVibration.checked;
  state.settings.controlMode = selectControl.value as ControlMode;
  saveState(state);
  syncSettingsUI();
  setScreen('menu');
});

pauseBtn.addEventListener('click', () => setScreen('pause'));
btnResume.addEventListener('click', () => setScreen('game'));
btnRetry.addEventListener('click', () => startLevel(currentLevel, false));
btnExit.addEventListener('click', () => setScreen('menu'));

btnNext.addEventListener('click', () => startLevel(currentLevel + 1, true));
btnRetryResults.addEventListener('click', () => startLevel(currentLevel, false));
btnExitResults.addEventListener('click', () => setScreen('menu'));

selectControl.addEventListener('change', () => {
  state.settings.controlMode = selectControl.value as ControlMode;
  saveState(state);
  syncSettingsUI();
  updateHints();
});

toggleSound.addEventListener('change', () => {
  state.settings.sound = toggleSound.checked;
  saveState(state);
  audio.setEnabled(state.settings.sound);
});

toggleVibration.addEventListener('change', () => {
  state.settings.vibration = toggleVibration.checked;
  saveState(state);
});

window.addEventListener('resize', () => {
  engine.resize();
  joystick.updateBounds();
});
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    engine.resize();
    joystick.updateBounds();
  }, 200);
});

window.addEventListener('visibilitychange', () => {
  if (document.hidden && activeScreen === 'game') setScreen('pause');
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'Escape' || event.code === 'KeyP') {
    if (activeScreen === 'game') setScreen('pause');
    else if (activeScreen === 'pause') setScreen('game');
  }
});

btnContinue.disabled = state.level <= 1;

syncSettingsUI();
setScreen('menu');
engine.startLoop();
