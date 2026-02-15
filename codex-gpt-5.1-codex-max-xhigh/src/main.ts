import './style.css';
import { Game, type HudState, type LevelStats } from './game/game';
import { loadProgress, saveProgress, type Settings } from './core/storage';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const overlayRoot = document.getElementById('overlay-root') as HTMLDivElement;
const uiLayer = document.getElementById('ui-layer') as HTMLDivElement;

if (!canvas || !overlayRoot || !uiLayer) {
  throw new Error('Root elements missing');
}

const params = new URLSearchParams(location.search);
const debugEnabled = params.get('debug') === '1';
let progressState = loadProgress();
const isMobile = window.matchMedia('(pointer: coarse)').matches;

if (isMobile && progressState.settings.control === 'mouse-follow') {
  progressState.settings.control = 'joystick';
}

let currentSettings: Settings = { ...progressState.settings };
let currentLevel = Math.max(1, progressState.level);

const hudEl = document.createElement('div');
hudEl.id = 'hud';
uiLayer.appendChild(hudEl);

const joystickUI = buildJoystickUI();
overlayRoot.appendChild(joystickUI.root);

const menuContainer = document.createElement('div');
menuContainer.className = 'menu panel';
overlayRoot.appendChild(menuContainer);

const resultContainer = document.createElement('div');
resultContainer.id = 'result-modal';
overlayRoot.appendChild(resultContainer);

const game = new Game(canvas, overlayRoot, {
  onLevelComplete: handleLevelComplete,
  onHudUpdate: renderHud
}, debugEnabled);

const seedParam = params.get('seed');
if (seedParam) {
  const parsed = Number(seedParam);
  if (!Number.isNaN(parsed)) {
    progressState.runSeed = parsed >>> 0;
    game.resetRun(progressState.runSeed, currentLevel, { keepBestTimes: true });
    saveProgress(progressState);
  }
}

renderMenu();
renderHud(game.getHudState());
attachGlobalKeys();
requestAnimationFrame(syncJoystick);

function renderHud(hud: HudState) {
  hudEl.innerHTML = '';
  const chip = (label: string, value: string) => {
    const el = document.createElement('div');
    el.className = 'hud-chip';
    el.textContent = `${label}: ${value}`;
    hudEl.appendChild(el);
  };

  chip('Lvl', hud.level.toString());
  chip('Time', hud.time.toFixed(2) + 's');
  chip('Hits', hud.collisions.toString());
  chip('Best', hud.best ? hud.best.toFixed(2) + 's' : '—');
}

function renderMenu() {
  menuContainer.innerHTML = '';
  const title = document.createElement('h1');
  title.textContent = 'Maze Sprint';
  const desc = document.createElement('p');
  desc.textContent = 'Случайные лабиринты с ростом сложности. Доберись до выхода как можно быстрее.';

  const actions = document.createElement('div');
  actions.className = 'actions';

  const startBtn = button(progressState.level > 1 ? 'Continue' : 'Start', () => {
    currentLevel = Math.max(1, progressState.level);
    menuContainer.style.display = 'none';
    startLevel(currentLevel);
  });

  const retryBtn = button('New Run', () => {
    const newSeed = Date.now();
    game.resetRun(newSeed, 1);
    currentLevel = 1;
    progressState = { level: 1, bestTimes: {}, runSeed: newSeed, settings: currentSettings };
    saveProgress(progressState);
    menuContainer.style.display = 'none';
    startLevel(1);
  });

  const settingsBtn = button('Settings', () => {
    showSettings();
  });

  actions.append(startBtn, retryBtn, settingsBtn);

  const hints = document.createElement('p');
  hints.className = 'small-text';
  hints.innerHTML = 'Управление: ПК — следуй за мышью или WASD. Мобайл — виртуальный джойстик или drag. Двойной тап по экрану/ESC — пауза.';

  menuContainer.append(title, desc, actions, hints);
}

function startLevel(level: number) {
  currentLevel = level;
  game.startLevel(level);
  resultContainer.innerHTML = '';
}

function handleLevelComplete(stats: LevelStats) {
  resultContainer.innerHTML = '';
  const panel = document.createElement('div');
  panel.className = 'panel';
  const title = document.createElement('h2');
  title.textContent = 'Level Complete!';
  const body = document.createElement('p');
  body.innerHTML = `Время: <b>${stats.time.toFixed(2)}s</b> · Столкновения: ${stats.collisions} · Seed: ${stats.seed}`;
  const next = button('Next level', () => {
    startLevel(stats.level + 1);
    resultContainer.innerHTML = '';
    progressState.level = Math.max(progressState.level, stats.level + 1);
    const previous = progressState.bestTimes[stats.level];
    const better = previous ? Math.min(previous, stats.time) : stats.time;
    progressState.bestTimes = { ...progressState.bestTimes, [stats.level]: better };
    saveProgress({ ...progressState, runSeed: progressState.runSeed });
  });
  const retry = button('Retry', () => {
    startLevel(stats.level);
    resultContainer.innerHTML = '';
  });
  const menu = button('Menu', () => {
    resultContainer.innerHTML = '';
    renderMenu();
    menuContainer.style.display = 'block';
  });
  const row = document.createElement('div');
  row.className = 'actions';
  row.append(next, retry, menu);
  panel.append(title, body, row);
  resultContainer.append(panel);
}

function showSettings() {
  const panel = document.createElement('div');
  panel.className = 'panel menu';
  const title = document.createElement('h2');
  title.textContent = 'Настройки';

  const soundRow = settingSwitch('Звук (псевдо)', currentSettings.sound, (v) => (currentSettings.sound = v));
  const vibroRow = settingSwitch('Вибрация', currentSettings.vibration, (v) => (currentSettings.vibration = v));

  const controlRow = document.createElement('div');
  controlRow.className = 'settings-row';
  const label = document.createElement('label');
  label.textContent = 'Режим управления';
  const select = document.createElement('select');
  ['mouse-follow', 'drag', 'joystick'].forEach((mode) => {
    const opt = document.createElement('option');
    opt.value = mode;
    opt.textContent = mode;
    if (mode === currentSettings.control) opt.selected = true;
    select.appendChild(opt);
  });
  select.onchange = () => {
    currentSettings.control = select.value as Settings['control'];
  };
  controlRow.append(label, select);

  const close = button('Сохранить', () => {
    game.setSettings({ ...currentSettings });
    progressState.settings = { ...currentSettings };
    saveProgress(progressState);
    menuContainer.style.display = 'none';
    panel.remove();
  });

  panel.append(title, soundRow, vibroRow, controlRow, close);
  menuContainer.innerHTML = '';
  menuContainer.append(panel);
  menuContainer.style.display = 'block';
}

function button(text: string, handler: () => void) {
  const btn = document.createElement('button');
  btn.className = 'button';
  btn.textContent = text;
  btn.onclick = handler;
  return btn;
}

function settingSwitch(label: string, value: boolean, onChange: (value: boolean) => void) {
  const row = document.createElement('div');
  row.className = 'settings-row';
  const lab = document.createElement('label');
  lab.textContent = label;
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = value;
  input.onchange = () => onChange(input.checked);
  row.append(lab, input);
  return row;
}

function buildJoystickUI() {
  const root = document.createElement('div');
  root.id = 'joystick';
  const base = document.createElement('div');
  base.className = 'joystick-base';
  const stick = document.createElement('div');
  stick.className = 'joystick-stick';
  root.append(base, stick);
  return { root, base, stick };
}

function syncJoystick() {
  const js = game.getJoystickState();
  joystickUI.root.style.display = js.active && currentSettings.control === 'joystick' ? 'block' : 'none';
  if (js.active) {
    joystickUI.root.style.transform = `translate(${js.origin.x - 65}px, ${js.origin.y - 65}px)`;
    const dx = js.current.x - js.origin.x;
    const dy = js.current.y - js.origin.y;
    joystickUI.stick.style.transform = `translate(${35 + dx * 0.4}px, ${35 + dy * 0.4}px)`;
  }
  requestAnimationFrame(syncJoystick);
}

function attachGlobalKeys() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (game.getState() === 'playing') {
        game.pause();
        showPauseOverlay();
      } else if (game.getState() === 'paused') {
        game.resume();
        hidePauseOverlay();
      }
    }
  });

  canvas.addEventListener('dblclick', () => {
    if (game.getState() === 'playing') {
      game.pause();
      showPauseOverlay();
    }
  });
}

function showPauseOverlay() {
  const panel = document.createElement('div');
  panel.className = 'panel menu';
  panel.innerHTML = '<h2>Пауза</h2><p class="small-text">Игра на паузе. Продолжить?</p>';
  const resumeBtn = button('Продолжить', () => {
    game.resume();
    hidePauseOverlay();
  });
  const retryBtn = button('Перезапустить уровень', () => {
    game.restartLevel();
    hidePauseOverlay();
  });
  const menuBtn = button('Меню', () => {
    hidePauseOverlay();
    renderMenu();
    menuContainer.style.display = 'block';
    game.pause();
  });
  const row = document.createElement('div');
  row.className = 'actions';
  row.append(resumeBtn, retryBtn, menuBtn);
  panel.append(row);
  menuContainer.innerHTML = '';
  menuContainer.append(panel);
  menuContainer.style.display = 'block';
}

function hidePauseOverlay() {
  menuContainer.style.display = 'none';
}
