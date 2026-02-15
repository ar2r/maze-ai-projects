import type { GameState, GameSettings, LevelResult, ControlMode } from './types';
import { GameEngine } from './game/engine';
import { loadSettings, loadSave } from './storage';
import { playMenuClick } from './audio';

// ─── UI Controller ───

class UIController {
  private engine: GameEngine;

  // Screens
  private screenMenu = document.getElementById('screen-menu')!;
  private screenSettings = document.getElementById('screen-settings')!;
  private screenResults = document.getElementById('screen-results')!;
  private screenPause = document.getElementById('screen-pause')!;
  private hud = document.getElementById('hud')!;

  // Buttons
  private btnStart = document.getElementById('btn-start')!;
  private btnContinue = document.getElementById('btn-continue')!;
  private btnSettings = document.getElementById('btn-settings')!;
  private btnSettingsBack = document.getElementById('btn-settings-back')!;
  private btnNext = document.getElementById('btn-next')!;
  private btnRetry = document.getElementById('btn-retry')!;
  private btnResultsMenu = document.getElementById('btn-results-menu')!;
  private btnResume = document.getElementById('btn-resume')!;
  private btnRestart = document.getElementById('btn-restart')!;
  private btnPauseMenu = document.getElementById('btn-pause-menu')!;
  private btnPause = document.getElementById('btn-pause')!;

  // HUD
  private hudLevel = document.getElementById('hud-level')!;
  private hudTimer = document.getElementById('hud-timer')!;

  // Settings inputs
  private settingSound = document.getElementById('setting-sound') as HTMLInputElement;
  private settingVibration = document.getElementById('setting-vibration') as HTMLInputElement;
  private settingControl = document.getElementById('setting-control') as HTMLSelectElement;
  private settingDebug = document.getElementById('setting-debug') as HTMLInputElement;

  // Results
  private resultsContent = document.getElementById('results-content')!;

  constructor() {
    this.engine = new GameEngine();
  }

  init(): void {
    this.engine.init();

    // Show continue button if progress exists
    const save = loadSave();
    if (save.currentLevel > 1) {
      this.btnContinue.style.display = 'block';
    }

    // Load settings into UI
    this.applySettingsToUI(this.engine.settings);

    // Engine callbacks
    this.engine.onStateChange = (state) => this.onStateChange(state);
    this.engine.onTimeUpdate = (t) => this.updateTimer(t);
    this.engine.onLevelComplete = (r) => this.showResults(r);

    this.bindButtons();
    this.bindKeyboardShortcuts();
  }

  private bindButtons(): void {
    const click = (el: HTMLElement, fn: () => void) => {
      el.addEventListener('click', () => { playMenuClick(); fn(); });
    };

    click(this.btnStart, () => this.engine.startLevel(1));
    click(this.btnContinue, () => {
      const save = loadSave();
      this.engine.startLevel(save.currentLevel);
    });
    click(this.btnSettings, () => this.showScreen('settings'));
    click(this.btnSettingsBack, () => {
      this.saveSettingsFromUI();
      this.showScreen('menu');
    });
    click(this.btnNext, () => this.engine.nextLevel());
    click(this.btnRetry, () => this.engine.restart());
    click(this.btnResultsMenu, () => this.engine.goToMenu());
    click(this.btnResume, () => this.engine.resume());
    click(this.btnRestart, () => this.engine.restart());
    click(this.btnPauseMenu, () => this.engine.goToMenu());
    click(this.btnPause, () => this.engine.pause());
  }

  private bindKeyboardShortcuts(): void {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (this.engine.state === 'playing') this.engine.pause();
        else if (this.engine.state === 'paused') this.engine.resume();
      }
      if (e.code === 'KeyR' && (e.ctrlKey || e.metaKey)) {
        // Allow browser refresh
        return;
      }
    });
  }

  private onStateChange(state: GameState): void {
    // Hide all screens
    this.screenMenu.classList.remove('active');
    this.screenSettings.classList.remove('active');
    this.screenResults.classList.remove('active');
    this.screenPause.classList.remove('active');
    this.hud.style.display = 'none';

    switch (state) {
      case 'menu':
        this.screenMenu.classList.add('active');
        // Update continue button
        const save = loadSave();
        this.btnContinue.style.display = save.currentLevel > 1 ? 'block' : 'none';
        break;
      case 'playing':
        this.hud.style.display = 'flex';
        this.hudLevel.textContent = `Level ${this.engine.level}`;
        break;
      case 'paused':
        this.hud.style.display = 'flex';
        this.screenPause.classList.add('active');
        break;
      case 'results':
        this.screenResults.classList.add('active');
        break;
    }
  }

  private showScreen(screen: 'menu' | 'settings'): void {
    this.screenMenu.classList.remove('active');
    this.screenSettings.classList.remove('active');
    if (screen === 'menu') this.screenMenu.classList.add('active');
    if (screen === 'settings') this.screenSettings.classList.add('active');
  }

  private updateTimer(elapsed: number): void {
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    this.hudTimer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private showResults(result: LevelResult): void {
    const save = loadSave();
    const best = save.bestTimes[result.level];
    const bestStr = best ? this.formatTime(best) : '—';

    this.resultsContent.innerHTML = `
      <div>⏱ Time: <strong>${this.formatTime(result.time)}</strong></div>
      <div>🏆 Best: <strong>${bestStr}</strong></div>
      <div>💥 Wall hits: <strong>${result.wallHits}</strong></div>
      <div>📊 Level: <strong>${result.level}</strong></div>
    `;
  }

  private formatTime(t: number): string {
    const mins = Math.floor(t / 60);
    const secs = (t % 60).toFixed(1);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }

  private applySettingsToUI(s: GameSettings): void {
    this.settingSound.checked = s.sound;
    this.settingVibration.checked = s.vibration;
    this.settingControl.value = s.controlMode;
    this.settingDebug.checked = s.debug;
  }

  private saveSettingsFromUI(): void {
    const s: GameSettings = {
      sound: this.settingSound.checked,
      vibration: this.settingVibration.checked,
      controlMode: this.settingControl.value as ControlMode,
      debug: this.settingDebug.checked,
    };
    this.engine.updateSettings(s);
  }
}

// ─── Boot ───

const app = new UIController();
app.init();
