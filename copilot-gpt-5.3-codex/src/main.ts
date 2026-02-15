import './styles.css';
import { MazeGameEngine } from './engine/game';
import { applySettingsToForm, createUi, readSettingsFromForm } from './ui/dom';
import { loadProgress, loadSettings, saveProgress, saveSettings } from './ui/storage';

const settings = loadSettings();
if (new URLSearchParams(window.location.search).get('debug') === '1') {
  settings.debugOverlay = true;
}

const progress = loadProgress();
const ui = createUi(settings);
const engine = new MazeGameEngine(ui, settings, progress, {
  onLevelComplete: (stats) => {
    showResults(stats.elapsedMs, stats.collisions);
  }
});

let running = false;
let paused = false;
let activeLevel = progress.currentLevel > 1 ? progress.currentLevel - 1 : 1;

function updateMenuState(): void {
  ui.continueButton.disabled = progress.currentLevel <= 1;
}

function openMenu(): void {
  ui.menuPanel.hidden = false;
  ui.settingsPanel.hidden = true;
  ui.resultPanel.hidden = true;
}

function closePanels(): void {
  ui.menuPanel.hidden = true;
  ui.settingsPanel.hidden = true;
  ui.resultPanel.hidden = true;
}

function startLevel(level: number): void {
  activeLevel = level;
  running = true;
  paused = false;
  closePanels();
  engine.start(level);
  ui.pauseButton.textContent = 'Pause';
}

function showResults(elapsedMs: number, collisions: number): void {
  running = false;
  paused = false;
  ui.resultPanel.hidden = false;
  ui.resultTitle.textContent = `Level ${activeLevel} complete`;
  const best = progress.bestTimesByLevel[activeLevel];
  const bestText = best ? `${(best / 1000).toFixed(1)}s` : '-';
  ui.resultBody.textContent = `Time: ${(elapsedMs / 1000).toFixed(1)}s | Hits: ${collisions} | Best: ${bestText}`;
}

ui.startButton.addEventListener('click', () => {
  startLevel(1);
});

ui.continueButton.addEventListener('click', () => {
  startLevel(Math.max(1, progress.currentLevel - 1));
});

ui.settingsButton.addEventListener('click', () => {
  ui.settingsPanel.hidden = false;
  ui.menuPanel.hidden = true;
});

ui.closeSettingsButton.addEventListener('click', () => {
  const nextSettings = readSettingsFromForm(ui);
  engine.setSettings(nextSettings);
  saveSettings(nextSettings);
  applySettingsToForm(ui, nextSettings);
  openMenu();
});

ui.pauseButton.addEventListener('click', () => {
  if (!running) return;
  paused = !paused;
  if (paused) {
    engine.pause();
    ui.pauseButton.textContent = 'Resume';
  } else {
    engine.resume();
    ui.pauseButton.textContent = 'Pause';
  }
});

ui.restartButton.addEventListener('click', () => {
  if (!running) return;
  engine.restart();
  paused = false;
  ui.pauseButton.textContent = 'Pause';
});

ui.retryButton.addEventListener('click', () => {
  startLevel(activeLevel);
});

ui.nextButton.addEventListener('click', () => {
  startLevel(activeLevel + 1);
});

window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'escape') {
    if (running) {
      engine.pause();
      running = false;
      openMenu();
    }
  }
});

window.addEventListener('beforeunload', () => {
  saveProgress(progress);
});

updateMenuState();
openMenu();
