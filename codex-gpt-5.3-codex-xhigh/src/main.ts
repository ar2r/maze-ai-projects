import './style.css';
import { GameEngine } from './game/engine';
import { bestTimeForLevel, loadPersistedState, persistState } from './game/storage';
import type { GameSettings, LevelResult } from './game/types';

const app = mustElement<HTMLDivElement>(document.querySelector('#app'), 'App root not found');

app.innerHTML = `
  <section id="menu-screen" class="screen active" aria-label="Главное меню">
    <div class="card menu-card">
      <p class="eyebrow">Canvas Labyrinth</p>
      <h1>Maze Runner</h1>
      <p class="subtitle">Проходи случайные лабиринты, каждый уровень становится теснее и длиннее.</p>
      <div class="menu-actions">
        <button id="start-btn" class="btn btn-primary">Start</button>
        <button id="continue-btn" class="btn">Continue</button>
        <button id="settings-btn" class="btn">Settings</button>
      </div>
      <p id="menu-progress" class="muted"></p>
      <p class="hint-text">Управление: мышь + WASD/стрелки, на телефоне джойстик или drag.</p>
    </div>
  </section>

  <section id="settings-screen" class="screen" aria-label="Настройки">
    <div class="card settings-card">
      <h2>Settings</h2>
      <label class="setting-row">
        <span>Control Mode</span>
        <select id="control-mode" class="select">
          <option value="auto">Auto</option>
          <option value="drag">Drag</option>
          <option value="joystick">Joystick</option>
        </select>
      </label>
      <label class="setting-row">
        <span>Sound</span>
        <input id="sound-enabled" type="checkbox" />
      </label>
      <label class="setting-row">
        <span>Vibration</span>
        <input id="vibration-enabled" type="checkbox" />
      </label>
      <label class="setting-row">
        <span>Debug Overlay</span>
        <input id="debug-enabled" type="checkbox" />
      </label>
      <div class="menu-actions">
        <button id="settings-back-btn" class="btn btn-primary">Back</button>
      </div>
    </div>
  </section>

  <section id="game-screen" class="screen" aria-label="Игра">
    <div class="hud">
      <div class="hud-main">
        <span id="hud-level">Lv 1</span>
        <span id="hud-time">00:00.0</span>
        <span id="hud-hits">Hits: 0</span>
      </div>
      <div class="hud-actions">
        <button id="pause-btn" class="btn btn-small">Pause</button>
        <button id="restart-btn" class="btn btn-small">Restart</button>
        <button id="menu-btn" class="btn btn-small">Menu</button>
      </div>
    </div>

    <div class="progress-track" aria-hidden="true">
      <div id="progress-fill" class="progress-fill"></div>
    </div>

    <div id="canvas-shell" class="canvas-shell">
      <canvas id="game-canvas" aria-label="Игровое поле"></canvas>

      <div id="pause-overlay" class="overlay hidden" role="dialog" aria-modal="true">
        <div class="overlay-card">
          <h3>Paused</h3>
          <div class="menu-actions">
            <button id="resume-btn" class="btn btn-primary">Resume</button>
            <button id="pause-menu-btn" class="btn">Menu</button>
          </div>
        </div>
      </div>

      <div id="joystick-base" class="joystick hidden" aria-hidden="true">
        <div id="joystick-knob" class="joystick-knob"></div>
      </div>

      <pre id="debug-overlay" class="debug hidden"></pre>
    </div>

    <p class="hint-text game-hint">Совет: удерживай мышь/палец и тяни в сторону выхода. Esc = pause.</p>
  </section>

  <section id="result-screen" class="screen" aria-label="Результат уровня">
    <div class="card result-card">
      <h2>Level Complete</h2>
      <p id="result-level"></p>
      <p id="result-time"></p>
      <p id="result-hits"></p>
      <p id="result-best" class="muted"></p>
      <div class="menu-actions">
        <button id="next-btn" class="btn btn-primary">Next</button>
        <button id="retry-btn" class="btn">Retry</button>
        <button id="result-menu-btn" class="btn">Menu</button>
      </div>
    </div>
  </section>
`;

const menuScreen = mustElement<HTMLElement>(document.querySelector('#menu-screen'), 'menu screen');
const settingsScreen = mustElement<HTMLElement>(document.querySelector('#settings-screen'), 'settings screen');
const gameScreen = mustElement<HTMLElement>(document.querySelector('#game-screen'), 'game screen');
const resultScreen = mustElement<HTMLElement>(document.querySelector('#result-screen'), 'result screen');

const startButton = mustElement<HTMLButtonElement>(document.querySelector('#start-btn'), 'start button');
const continueButton = mustElement<HTMLButtonElement>(document.querySelector('#continue-btn'), 'continue button');
const settingsButton = mustElement<HTMLButtonElement>(document.querySelector('#settings-btn'), 'settings button');
const settingsBackButton = mustElement<HTMLButtonElement>(document.querySelector('#settings-back-btn'), 'settings back button');

const pauseButton = mustElement<HTMLButtonElement>(document.querySelector('#pause-btn'), 'pause button');
const restartButton = mustElement<HTMLButtonElement>(document.querySelector('#restart-btn'), 'restart button');
const menuButton = mustElement<HTMLButtonElement>(document.querySelector('#menu-btn'), 'menu button');

const resumeButton = mustElement<HTMLButtonElement>(document.querySelector('#resume-btn'), 'resume button');
const pauseMenuButton = mustElement<HTMLButtonElement>(document.querySelector('#pause-menu-btn'), 'pause menu button');

const nextButton = mustElement<HTMLButtonElement>(document.querySelector('#next-btn'), 'next button');
const retryButton = mustElement<HTMLButtonElement>(document.querySelector('#retry-btn'), 'retry button');
const resultMenuButton = mustElement<HTMLButtonElement>(document.querySelector('#result-menu-btn'), 'result menu button');

const levelLabel = mustElement<HTMLSpanElement>(document.querySelector('#hud-level'), 'hud level');
const timeLabel = mustElement<HTMLSpanElement>(document.querySelector('#hud-time'), 'hud time');
const hitsLabel = mustElement<HTMLSpanElement>(document.querySelector('#hud-hits'), 'hud hits');
const progressFill = mustElement<HTMLDivElement>(document.querySelector('#progress-fill'), 'progress fill');

const menuProgressText = mustElement<HTMLParagraphElement>(document.querySelector('#menu-progress'), 'menu progress');

const resultLevelText = mustElement<HTMLParagraphElement>(document.querySelector('#result-level'), 'result level');
const resultTimeText = mustElement<HTMLParagraphElement>(document.querySelector('#result-time'), 'result time');
const resultHitsText = mustElement<HTMLParagraphElement>(document.querySelector('#result-hits'), 'result hits');
const resultBestText = mustElement<HTMLParagraphElement>(document.querySelector('#result-best'), 'result best');

const pauseOverlay = mustElement<HTMLDivElement>(document.querySelector('#pause-overlay'), 'pause overlay');

const controlModeSelect = mustElement<HTMLSelectElement>(document.querySelector('#control-mode'), 'control mode');
const soundToggle = mustElement<HTMLInputElement>(document.querySelector('#sound-enabled'), 'sound toggle');
const vibrationToggle = mustElement<HTMLInputElement>(document.querySelector('#vibration-enabled'), 'vibration toggle');
const debugToggle = mustElement<HTMLInputElement>(document.querySelector('#debug-enabled'), 'debug toggle');

const canvas = mustElement<HTMLCanvasElement>(document.querySelector('#game-canvas'), 'game canvas');
const joystickBase = mustElement<HTMLElement>(document.querySelector('#joystick-base'), 'joystick base');
const joystickKnob = mustElement<HTMLElement>(document.querySelector('#joystick-knob'), 'joystick knob');
const debugOverlay = mustElement<HTMLElement>(document.querySelector('#debug-overlay'), 'debug overlay');

const persisted = loadPersistedState();
const query = new URLSearchParams(window.location.search);
const screenshotMode = query.get('shot');
if (query.get('debug') === '1') {
  persisted.debugEnabled = true;
}

let activeLevel = Math.max(1, persisted.currentLevel);
syncSettingsUI(persisted.settings, persisted.debugEnabled);
refreshMenu();

const engine = new GameEngine(
  {
    canvas,
    joystickBase,
    joystickKnob,
    debugElement: debugOverlay
  },
  {
    onHudUpdate(snapshot) {
      levelLabel.textContent = `Lv ${snapshot.level}`;
      timeLabel.textContent = formatTime(snapshot.timeMs);
      hitsLabel.textContent = `Hits: ${snapshot.collisions}`;
      progressFill.style.width = `${Math.round(snapshot.progress * 100)}%`;
    },
    onLevelComplete(result) {
      onLevelComplete(result);
    },
    onPauseChanged(paused) {
      pauseOverlay.classList.toggle('hidden', !paused);
      pauseButton.textContent = paused ? 'Resume' : 'Pause';
    }
  },
  persisted.settings,
  persisted.debugEnabled
);

showScreen('menu');
applyScreenshotMode();

window.addEventListener('resize', () => engine.resize());
window.addEventListener('orientationchange', () => engine.resize());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    engine.setPaused(true);
  }
});
window.addEventListener('blur', () => engine.setPaused(true));

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    engine.togglePause();
  }
});

document.addEventListener('pointerdown', () => engine.unlockAudio());

startButton.addEventListener('click', () => {
  engine.unlockAudio();
  persisted.hasProgress = true;
  persisted.currentLevel = 1;
  persisted.baseSeed = (Date.now() >>> 0) || 1;
  persistState(persisted);
  activeLevel = 1;
  startGameplay(activeLevel);
});

continueButton.addEventListener('click', () => {
  engine.unlockAudio();
  if (!persisted.hasProgress) {
    persisted.hasProgress = true;
    persisted.currentLevel = 1;
    persisted.baseSeed = (Date.now() >>> 0) || 1;
  }
  activeLevel = Math.max(1, persisted.currentLevel);
  startGameplay(activeLevel);
});

settingsButton.addEventListener('click', () => {
  showScreen('settings');
});

settingsBackButton.addEventListener('click', () => {
  showScreen('menu');
});

pauseButton.addEventListener('click', () => {
  engine.togglePause();
});

restartButton.addEventListener('click', () => {
  engine.unlockAudio();
  engine.restartLevel();
});

menuButton.addEventListener('click', () => {
  engine.stop();
  showScreen('menu');
  refreshMenu();
});

resumeButton.addEventListener('click', () => {
  engine.setPaused(false);
});

pauseMenuButton.addEventListener('click', () => {
  engine.stop();
  showScreen('menu');
  refreshMenu();
});

nextButton.addEventListener('click', () => {
  activeLevel += 1;
  startGameplay(activeLevel);
});

retryButton.addEventListener('click', () => {
  startGameplay(activeLevel);
});

resultMenuButton.addEventListener('click', () => {
  showScreen('menu');
  refreshMenu();
});

controlModeSelect.addEventListener('change', () => {
  persisted.settings.controlMode = controlModeSelect.value as GameSettings['controlMode'];
  saveSettings();
});

soundToggle.addEventListener('change', () => {
  persisted.settings.soundEnabled = soundToggle.checked;
  saveSettings();
});

vibrationToggle.addEventListener('change', () => {
  persisted.settings.vibrationEnabled = vibrationToggle.checked;
  saveSettings();
});

debugToggle.addEventListener('change', () => {
  persisted.debugEnabled = debugToggle.checked;
  saveSettings();
});

function startGameplay(level: number): void {
  showScreen('game');
  activeLevel = level;
  engine.applySettings(persisted.settings, persisted.debugEnabled);
  engine.resize();
  engine.startLevel(level, persisted.baseSeed);
}

function onLevelComplete(result: LevelResult): void {
  const levelKey = String(result.level);
  const previousBest = persisted.bestTimes[levelKey];
  const isBest = typeof previousBest !== 'number' || result.timeMs < previousBest;

  if (isBest) {
    persisted.bestTimes[levelKey] = result.timeMs;
  }

  persisted.hasProgress = true;
  persisted.currentLevel = Math.max(persisted.currentLevel, result.level + 1);
  persistState(persisted);

  resultLevelText.textContent = `Level ${result.level} · seed ${result.seed}`;
  resultTimeText.textContent = `Time: ${formatTime(result.timeMs)}`;
  resultHitsText.textContent = `Wall touches: ${result.collisions}`;

  const bestTime = bestTimeForLevel(persisted, result.level);
  resultBestText.textContent = bestTime
    ? `Best time: ${formatTime(bestTime)}${isBest ? ' (new)' : ''}`
    : 'Best time: not set';

  showScreen('result');
}

function saveSettings(): void {
  persistState(persisted);
  engine.applySettings(persisted.settings, persisted.debugEnabled);
}

function refreshMenu(): void {
  continueButton.disabled = !persisted.hasProgress;

  const bestCurrent = bestTimeForLevel(persisted, Math.max(1, persisted.currentLevel - 1));
  const bestText = bestCurrent ? `, best: ${formatTime(bestCurrent)}` : '';
  menuProgressText.textContent = persisted.hasProgress
    ? `Current level: ${persisted.currentLevel}${bestText}`
    : 'No progress yet';
}

function syncSettingsUI(settings: GameSettings, debugEnabled: boolean): void {
  controlModeSelect.value = settings.controlMode;
  soundToggle.checked = settings.soundEnabled;
  vibrationToggle.checked = settings.vibrationEnabled;
  debugToggle.checked = debugEnabled;
}

function showScreen(target: 'menu' | 'settings' | 'game' | 'result'): void {
  menuScreen.classList.toggle('active', target === 'menu');
  settingsScreen.classList.toggle('active', target === 'settings');
  gameScreen.classList.toggle('active', target === 'game');
  resultScreen.classList.toggle('active', target === 'result');

  document.body.classList.toggle('game-active', target === 'game');
}

function applyScreenshotMode(): void {
  if (!screenshotMode) {
    return;
  }

  if (screenshotMode === 'menu') {
    showScreen('menu');
    return;
  }

  if (screenshotMode === 'game') {
    persisted.hasProgress = true;
    persisted.currentLevel = Math.max(3, persisted.currentLevel);
    activeLevel = persisted.currentLevel;
    startGameplay(activeLevel);
    window.setTimeout(() => engine.setPaused(true), 400);
    return;
  }

  if (screenshotMode === 'result') {
    resultLevelText.textContent = 'Level 7 · seed 2451801014';
    resultTimeText.textContent = 'Time: 01:26.4';
    resultHitsText.textContent = 'Wall touches: 12';
    resultBestText.textContent = 'Best time: 01:18.9';
    showScreen('result');
  }
}

function formatTime(timeMs: number): string {
  const totalSeconds = Math.max(0, timeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((totalSeconds - Math.floor(totalSeconds)) * 10);
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}.${tenths}`;
}

function mustElement<T>(value: T | null, label: string): T {
  if (!value) {
    throw new Error(`Missing element: ${label}`);
  }
  return value;
}
