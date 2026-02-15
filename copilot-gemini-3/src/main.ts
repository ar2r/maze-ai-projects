import './style.css';
import { Game } from './game/Game';

// UI Elements
const menuScreen = document.getElementById('menu-screen')!;
const resultsScreen = document.getElementById('results-screen')!;
const settingsScreen = document.getElementById('settings-screen')!;
const hud = document.getElementById('hud')!;
const levelDisplay = document.getElementById('level-display')!;
// const timeDisplay = document.getElementById('time-display')!;
const debugOverlay = document.getElementById('debug-overlay')!;

// Buttons
const btnStart = document.getElementById('btn-start')!;
const btnNext = document.getElementById('btn-next')!;
const btnSettings = document.getElementById('btn-settings')!;
const btnBack = document.getElementById('btn-back')!;
const chkDebug = document.getElementById('chk-debug')! as HTMLInputElement;
const chkVibration = document.getElementById('chk-vibration')! as HTMLInputElement;

// Canvas
const worldCanvas = document.getElementById('world-canvas') as HTMLCanvasElement;
const entityCanvas = document.getElementById('entity-canvas') as HTMLCanvasElement;

// Game State
let currentLevel = 1;
let game: Game;

// Debug Toggle
chkDebug.addEventListener('change', () => {
  debugOverlay.style.display = chkDebug.checked ? 'block' : 'none';
});

function showScreen(screen: HTMLElement) {
  document.querySelectorAll('.screen').forEach(s => (s as HTMLElement).style.display = 'none');
  screen.style.display = 'flex';
}

function hideAllScreens() {
  document.querySelectorAll('.screen').forEach(s => (s as HTMLElement).style.display = 'none');
}

function startGame(level: number) {
  currentLevel = level;
  hideAllScreens();
  hud.style.display = 'block';
  levelDisplay.textContent = level.toString();
  
  if (!game) {
    game = new Game(
      worldCanvas, 
      entityCanvas,
      onLevelComplete,
      onDebugUpdate
    );
  }
  
  game.hapticsEnabled = chkVibration.checked;
  game.startLevel(level);
}

// Settings Listeners
chkVibration.addEventListener('change', () => {
    if (game) game.hapticsEnabled = chkVibration.checked;
});

function onLevelComplete(time: number, collisions: number) {
  // Show Results
  showScreen(resultsScreen);
  document.getElementById('result-time')!.textContent = time.toFixed(2);
  document.getElementById('result-collisions')!.textContent = collisions.toString();
  
  // Save Progress
  const bestTime = parseFloat(localStorage.getItem(`level_${currentLevel}_best`) || '9999');
  if (time < bestTime) {
    localStorage.setItem(`level_${currentLevel}_best`, time.toString());
  }
  localStorage.setItem('max_level', Math.max(currentLevel + 1, parseInt(localStorage.getItem('max_level') || '1')).toString());
}

function onDebugUpdate(info: string) {
  if (debugOverlay.style.display !== 'none') {
    debugOverlay.textContent = info;
  }
  // Also update time display in HUD
  // Ideally this should be passed separately, but parsing info string is hacky.
  // Let's rely on Game to call a separate callback or just update HUD here if we had access to time.
  // Actually, Game's update loop calls this. 
}

// Event Listeners
btnStart.addEventListener('click', () => {
  startGame(1);
});

btnNext.addEventListener('click', () => {
  startGame(currentLevel + 1);
});

btnSettings.addEventListener('click', () => {
  showScreen(settingsScreen);
});

btnBack.addEventListener('click', () => {
  showScreen(menuScreen);
});

// Initial Setup
const savedMaxLevel = parseInt(localStorage.getItem('max_level') || '1');
if (savedMaxLevel > 1) {
  btnStart.textContent = `Continue Level ${savedMaxLevel}`;
}

// Resize handling
// window.addEventListener('resize', () => {
//   worldCanvas.width = window.innerWidth;
//   worldCanvas.height = window.innerHeight;
//   entityCanvas.width = window.innerWidth;
//   entityCanvas.height = window.innerHeight;
// });

// Trigger initial resize
// window.dispatchEvent(new Event('resize'));
