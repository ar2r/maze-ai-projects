import type { ControlMode, Settings } from '../core/types';

export interface UiElements {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  hud: HTMLElement;
  levelLabel: HTMLElement;
  timerLabel: HTMLElement;
  collisionLabel: HTMLElement;
  hintLabel: HTMLElement;
  menuPanel: HTMLElement;
  startButton: HTMLButtonElement;
  continueButton: HTMLButtonElement;
  settingsButton: HTMLButtonElement;
  settingsPanel: HTMLElement;
  controlSelect: HTMLSelectElement;
  vibrationToggle: HTMLInputElement;
  soundToggle: HTMLInputElement;
  debugToggle: HTMLInputElement;
  closeSettingsButton: HTMLButtonElement;
  pauseButton: HTMLButtonElement;
  restartButton: HTMLButtonElement;
  resultPanel: HTMLElement;
  resultTitle: HTMLElement;
  resultBody: HTMLElement;
  nextButton: HTMLButtonElement;
  retryButton: HTMLButtonElement;
  joystickArea: HTMLElement;
  joystickThumb: HTMLElement;
  debugOverlay: HTMLElement;
}

export function createUi(settings: Settings): UiElements {
  const root = document.getElementById('app');
  if (!root) throw new Error('App root not found');

  root.innerHTML = `
    <main class="layout">
      <section class="game-shell" aria-label="Maze game area">
        <canvas id="game-canvas" aria-label="Maze game canvas"></canvas>
        <div class="hud">
          <div class="hud-row"><span id="level-label"></span><span id="timer-label"></span></div>
          <div class="hud-row"><span id="collision-label"></span><span id="hint-label"></span></div>
          <div class="hud-row hud-controls">
            <button id="pause-btn">Pause</button>
            <button id="restart-btn">Restart</button>
          </div>
        </div>
        <div id="debug-overlay" class="debug-overlay" hidden></div>
        <div id="joystick" class="joystick" hidden>
          <div id="joystick-thumb" class="joystick-thumb"></div>
        </div>
      </section>
      <section class="overlay-stack" aria-live="polite">
        <div id="menu-panel" class="panel">
          <h1>Maze Runner</h1>
          <p>Reach the green exit. Levels become denser and harder.</p>
          <button id="start-btn">Start</button>
          <button id="continue-btn">Continue</button>
          <button id="settings-btn">Settings</button>
        </div>

        <div id="settings-panel" class="panel" hidden>
          <h2>Settings</h2>
          <label>Control mode
            <select id="control-select">
              <option value="drag">Drag / Mouse follow</option>
              <option value="joystick">Virtual joystick</option>
            </select>
          </label>
          <label class="switch-row"><input id="vibration-toggle" type="checkbox" /> Vibration</label>
          <label class="switch-row"><input id="sound-toggle" type="checkbox" /> Sound</label>
          <label class="switch-row"><input id="debug-toggle" type="checkbox" /> Debug overlay</label>
          <button id="close-settings-btn">Back</button>
        </div>

        <div id="result-panel" class="panel" hidden>
          <h2 id="result-title">Level complete</h2>
          <p id="result-body"></p>
          <button id="next-btn">Next level</button>
          <button id="retry-btn">Retry</button>
        </div>
      </section>
    </main>
  `;

  const get = <T extends HTMLElement>(selector: string): T => {
    const node = root.querySelector(selector);
    if (!node) throw new Error(`UI element missing: ${selector}`);
    return node as T;
  };

  const ui: UiElements = {
    root,
    canvas: get<HTMLCanvasElement>('#game-canvas'),
    hud: get<HTMLElement>('.hud'),
    levelLabel: get<HTMLElement>('#level-label'),
    timerLabel: get<HTMLElement>('#timer-label'),
    collisionLabel: get<HTMLElement>('#collision-label'),
    hintLabel: get<HTMLElement>('#hint-label'),
    menuPanel: get<HTMLElement>('#menu-panel'),
    startButton: get<HTMLButtonElement>('#start-btn'),
    continueButton: get<HTMLButtonElement>('#continue-btn'),
    settingsButton: get<HTMLButtonElement>('#settings-btn'),
    settingsPanel: get<HTMLElement>('#settings-panel'),
    controlSelect: get<HTMLSelectElement>('#control-select'),
    vibrationToggle: get<HTMLInputElement>('#vibration-toggle'),
    soundToggle: get<HTMLInputElement>('#sound-toggle'),
    debugToggle: get<HTMLInputElement>('#debug-toggle'),
    closeSettingsButton: get<HTMLButtonElement>('#close-settings-btn'),
    pauseButton: get<HTMLButtonElement>('#pause-btn'),
    restartButton: get<HTMLButtonElement>('#restart-btn'),
    resultPanel: get<HTMLElement>('#result-panel'),
    resultTitle: get<HTMLElement>('#result-title'),
    resultBody: get<HTMLElement>('#result-body'),
    nextButton: get<HTMLButtonElement>('#next-btn'),
    retryButton: get<HTMLButtonElement>('#retry-btn'),
    joystickArea: get<HTMLElement>('#joystick'),
    joystickThumb: get<HTMLElement>('#joystick-thumb'),
    debugOverlay: get<HTMLElement>('#debug-overlay')
  };

  applySettingsToForm(ui, settings);
  return ui;
}

export function applySettingsToForm(ui: UiElements, settings: Settings): void {
  ui.controlSelect.value = settings.controlMode;
  ui.vibrationToggle.checked = settings.vibration;
  ui.soundToggle.checked = settings.sound;
  ui.debugToggle.checked = settings.debugOverlay;
}

export function readSettingsFromForm(ui: UiElements): Settings {
  return {
    controlMode: ui.controlSelect.value as ControlMode,
    vibration: ui.vibrationToggle.checked,
    sound: ui.soundToggle.checked,
    debugOverlay: ui.debugToggle.checked
  };
}
