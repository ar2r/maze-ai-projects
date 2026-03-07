import { GameEngine } from '../game/game-engine';
import { InputManager } from '../input/input-manager';
import { GameRenderer } from '../render/renderer';
import { FeedbackService } from '../services/feedback';
import { StorageService } from '../services/storage';
import type { GameSettings } from '../types';

function setVisible(element: HTMLElement, visible: boolean): void {
  element.dataset.visible = visible ? 'true' : 'false';
}

function formatTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const remainder = Math.floor((milliseconds % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(remainder).padStart(2, '0')}`;
}

export class AppController {
  private readonly root: HTMLElement;
  private readonly storage = new StorageService();
  private readonly feedback = new FeedbackService(this.storage.getSettings());
  private readonly input = new InputManager();
  private engine!: GameEngine;
  private settingsVisible = false;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  mount(): void {
    this.root.innerHTML = `
      <div class="app-shell">
        <header class="hero-bar">
          <div>
            <p class="eyebrow">Canvas / TypeScript / No backend</p>
            <h1>Maze Runner</h1>
            <p class="hero-copy">Procedurally generated perfect mazes with desktop + mobile controls, saved progress, and debug tools.</p>
          </div>
        </header>
        <main class="layout">
          <section class="game-card">
            <div class="hud" data-visible="false">
              <div class="hud__stats">
                <span id="hud-level">Level 1</span>
                <span id="hud-time">00:00.00</span>
                <span id="hud-hits">Hits 0</span>
              </div>
              <div class="hud__actions">
                <button id="pause-button" class="button button--ghost" type="button">Pause</button>
                <button id="restart-button" class="button button--ghost" type="button">Restart</button>
              </div>
            </div>
            <div class="game-surface">
              <canvas id="maze-canvas" aria-label="Maze playfield"></canvas>
              <div id="joystick-shell" class="joystick-shell" data-visible="false" aria-hidden="true">
                <div id="joystick-base" class="joystick-base">
                  <div id="joystick-knob" class="joystick-knob"></div>
                </div>
              </div>
              <section id="menu-overlay" class="overlay">
                <div class="panel">
                  <p class="panel__eyebrow">Menu</p>
                  <h2>Escape every maze</h2>
                  <p>Reach the exit, avoid grinding the walls, and push through progressively larger labyrinths.</p>
                  <div class="panel__actions">
                    <button id="start-button" class="button" type="button">Start</button>
                    <button id="continue-button" class="button button--secondary" type="button">Continue</button>
                    <button id="menu-settings-button" class="button button--ghost" type="button">Settings</button>
                  </div>
                </div>
              </section>
              <section id="pause-overlay" class="overlay" data-visible="false">
                <div class="panel">
                  <p class="panel__eyebrow">Paused</p>
                  <h2>Catch your breath</h2>
                  <div class="panel__actions">
                    <button id="resume-button" class="button" type="button">Resume</button>
                    <button id="pause-restart-button" class="button button--secondary" type="button">Restart</button>
                    <button id="pause-settings-button" class="button button--ghost" type="button">Settings</button>
                    <button id="pause-menu-button" class="button button--ghost" type="button">Menu</button>
                  </div>
                </div>
              </section>
              <section id="results-overlay" class="overlay" data-visible="false">
                <div class="panel">
                  <p class="panel__eyebrow">Level clear</p>
                  <h2>Nice run</h2>
                  <dl class="results-grid">
                    <div>
                      <dt>Time</dt>
                      <dd id="result-time">00:00.00</dd>
                    </div>
                    <div>
                      <dt>Wall hits</dt>
                      <dd id="result-hits">0</dd>
                    </div>
                    <div>
                      <dt>Best</dt>
                      <dd id="result-best">00:00.00</dd>
                    </div>
                    <div>
                      <dt>Seed</dt>
                      <dd id="result-seed">-</dd>
                    </div>
                  </dl>
                  <div class="panel__actions">
                    <button id="next-button" class="button" type="button">Next</button>
                    <button id="retry-button" class="button button--secondary" type="button">Retry</button>
                    <button id="results-menu-button" class="button button--ghost" type="button">Menu</button>
                  </div>
                </div>
              </section>
              <section id="settings-overlay" class="overlay overlay--settings" data-visible="false">
                <div class="panel panel--wide">
                  <p class="panel__eyebrow">Settings</p>
                  <h2>Tune the run</h2>
                  <form id="settings-form" class="settings-form">
                    <label class="toggle-row">
                      <span>Sound</span>
                      <input id="sound-toggle" type="checkbox" />
                    </label>
                    <label class="toggle-row">
                      <span>Vibration</span>
                      <input id="vibration-toggle" type="checkbox" />
                    </label>
                    <label class="toggle-row toggle-row--stacked">
                      <span>Control mode</span>
                      <select id="control-mode-select">
                        <option value="auto">Auto</option>
                        <option value="mouse">Mouse follow</option>
                        <option value="drag">Drag</option>
                        <option value="joystick">Joystick</option>
                      </select>
                    </label>
                    <label class="toggle-row">
                      <span>Debug overlay</span>
                      <input id="debug-toggle" type="checkbox" />
                    </label>
                  </form>
                  <div class="panel__actions">
                    <button id="close-settings-button" class="button" type="button">Done</button>
                  </div>
                </div>
              </section>
            </div>
            <footer class="footer-strip">
              <div>
                <strong>Controls</strong>
                <p id="help-text">Desktop: move with mouse follow or drag. Keyboard: WASD / arrows.</p>
              </div>
              <div>
                <strong>Status</strong>
                <p id="status-text">Random seeded perfect mazes. Complete levels to unlock the next one.</p>
              </div>
            </footer>
          </section>
        </main>
      </div>
    `;

    const canvas = this.root.querySelector('#maze-canvas') as HTMLCanvasElement;
    const joystickShell = this.root.querySelector('#joystick-shell') as HTMLElement;
    const joystickBase = this.root.querySelector('#joystick-base') as HTMLElement;
    const joystickKnob = this.root.querySelector('#joystick-knob') as HTMLElement;
    const menuOverlay = this.root.querySelector('#menu-overlay') as HTMLElement;
    const pauseOverlay = this.root.querySelector('#pause-overlay') as HTMLElement;
    const resultsOverlay = this.root.querySelector('#results-overlay') as HTMLElement;
    const settingsOverlay = this.root.querySelector('#settings-overlay') as HTMLElement;
    const hud = this.root.querySelector('.hud') as HTMLElement;
    const continueButton = this.root.querySelector('#continue-button') as HTMLButtonElement;
    const helpText = this.root.querySelector('#help-text') as HTMLElement;
    const statusText = this.root.querySelector('#status-text') as HTMLElement;
    const hudLevel = this.root.querySelector('#hud-level') as HTMLElement;
    const hudTime = this.root.querySelector('#hud-time') as HTMLElement;
    const hudHits = this.root.querySelector('#hud-hits') as HTMLElement;
    const resultTime = this.root.querySelector('#result-time') as HTMLElement;
    const resultHits = this.root.querySelector('#result-hits') as HTMLElement;
    const resultBest = this.root.querySelector('#result-best') as HTMLElement;
    const resultSeed = this.root.querySelector('#result-seed') as HTMLElement;
    const soundToggle = this.root.querySelector('#sound-toggle') as HTMLInputElement;
    const vibrationToggle = this.root.querySelector('#vibration-toggle') as HTMLInputElement;
    const debugToggle = this.root.querySelector('#debug-toggle') as HTMLInputElement;
    const controlModeSelect = this.root.querySelector('#control-mode-select') as HTMLSelectElement;

    this.input.attach(canvas, joystickBase, joystickKnob);
    const renderer = new GameRenderer(canvas);

    this.engine = new GameEngine({
      input: this.input,
      renderer,
      storage: this.storage,
      feedback: this.feedback,
      onUiChange: (snapshot) => {
        if (snapshot.screen !== 'menu' && snapshot.screen !== 'paused') {
          this.settingsVisible = false;
        }

        setVisible(menuOverlay, snapshot.screen === 'menu');
        setVisible(pauseOverlay, snapshot.screen === 'paused');
        setVisible(resultsOverlay, snapshot.screen === 'results');
        setVisible(settingsOverlay, this.settingsVisible);
        setVisible(hud, snapshot.screen === 'playing' || snapshot.screen === 'paused');
        setVisible(joystickShell, snapshot.showJoystick);

        continueButton.disabled = !snapshot.canContinue;
        helpText.textContent = snapshot.helpText;
        statusText.textContent = snapshot.statusText;
        hudLevel.textContent = `Level ${snapshot.level}`;
        hudTime.textContent = formatTime(snapshot.elapsedMs);
        hudHits.textContent = `Hits ${snapshot.wallHits}`;

        if (snapshot.result) {
          resultTime.textContent = formatTime(snapshot.result.elapsedMs);
          resultHits.textContent = String(snapshot.result.wallHits);
          resultBest.textContent = formatTime(snapshot.result.bestTimeMs);
          resultSeed.textContent = snapshot.result.seed;
        }

        this.syncSettingsForm(snapshot.settings, {
          soundToggle,
          vibrationToggle,
          debugToggle,
          controlModeSelect,
        });
      },
    });

    const playButtonClick = (): void => {
      this.feedback.button();
    };

    (this.root.querySelector('#start-button') as HTMLButtonElement).addEventListener('click', () => {
      playButtonClick();
      this.settingsVisible = false;
      this.engine.startNewGame();
    });
    continueButton.addEventListener('click', () => {
      playButtonClick();
      this.settingsVisible = false;
      this.engine.continueGame();
    });
    (this.root.querySelector('#menu-settings-button') as HTMLButtonElement).addEventListener('click', () => {
      playButtonClick();
      this.settingsVisible = true;
      setVisible(settingsOverlay, true);
    });
    (this.root.querySelector('#pause-button') as HTMLButtonElement).addEventListener('click', () => {
      playButtonClick();
      this.engine.pause();
    });
    (this.root.querySelector('#restart-button') as HTMLButtonElement).addEventListener('click', () => {
      playButtonClick();
      this.engine.restartLevel();
    });
    (this.root.querySelector('#resume-button') as HTMLButtonElement).addEventListener('click', () => {
      playButtonClick();
      this.engine.resume();
    });
    (this.root.querySelector('#pause-restart-button') as HTMLButtonElement).addEventListener('click', () => {
      playButtonClick();
      this.engine.restartLevel();
    });
    (this.root.querySelector('#pause-settings-button') as HTMLButtonElement).addEventListener('click', () => {
      playButtonClick();
      this.settingsVisible = true;
      setVisible(settingsOverlay, true);
    });
    (this.root.querySelector('#pause-menu-button') as HTMLButtonElement).addEventListener('click', () => {
      playButtonClick();
      this.settingsVisible = false;
      this.engine.returnToMenu();
    });
    (this.root.querySelector('#next-button') as HTMLButtonElement).addEventListener('click', () => {
      playButtonClick();
      this.engine.nextLevel();
    });
    (this.root.querySelector('#retry-button') as HTMLButtonElement).addEventListener('click', () => {
      playButtonClick();
      this.engine.restartLevel();
    });
    (this.root.querySelector('#results-menu-button') as HTMLButtonElement).addEventListener('click', () => {
      playButtonClick();
      this.engine.returnToMenu();
    });
    (this.root.querySelector('#close-settings-button') as HTMLButtonElement).addEventListener('click', () => {
      playButtonClick();
      this.settingsVisible = false;
      setVisible(settingsOverlay, false);
    });

    const handleSettingsChange = (): void => {
      const settings: GameSettings = {
        soundEnabled: soundToggle.checked,
        vibrationEnabled: vibrationToggle.checked,
        debugOverlay: debugToggle.checked,
        controlMode: controlModeSelect.value as GameSettings['controlMode'],
      };
      this.engine.applySettings(settings);
    };

    soundToggle.addEventListener('change', handleSettingsChange);
    vibrationToggle.addEventListener('change', handleSettingsChange);
    debugToggle.addEventListener('change', handleSettingsChange);
    controlModeSelect.addEventListener('change', handleSettingsChange);

    window.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') {
        return;
      }

      if (this.settingsVisible) {
        this.settingsVisible = false;
        setVisible(settingsOverlay, false);
        return;
      }

      if (pauseOverlay.dataset.visible === 'true') {
        this.engine.resume();
        return;
      }

      if (menuOverlay.dataset.visible === 'true' || resultsOverlay.dataset.visible === 'true') {
        return;
      }

      this.engine.pause();
    });
  }

  private syncSettingsForm(
    settings: GameSettings,
    elements: {
      soundToggle: HTMLInputElement;
      vibrationToggle: HTMLInputElement;
      debugToggle: HTMLInputElement;
      controlModeSelect: HTMLSelectElement;
    },
  ): void {
    elements.soundToggle.checked = settings.soundEnabled;
    elements.vibrationToggle.checked = settings.vibrationEnabled;
    elements.debugToggle.checked = settings.debugOverlay;
    elements.controlModeSelect.value = settings.controlMode;
  }
}
