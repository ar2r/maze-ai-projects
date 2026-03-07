export interface ScreenRefs {
  shell: HTMLElement;
  canvas: HTMLCanvasElement;
  playArea: HTMLElement;
  menuScreen: HTMLElement;
  pauseScreen: HTMLElement;
  resultsScreen: HTMLElement;
  settingsScreen: HTMLElement;
  hud: HTMLElement;
  debug: HTMLElement;
  instruction: HTMLElement;
  levelLabel: HTMLElement;
  timerLabel: HTMLElement;
  hitsLabel: HTMLElement;
  resultLevel: HTMLElement;
  resultTime: HTMLElement;
  resultHits: HTMLElement;
  resultSeed: HTMLElement;
  resultBest: HTMLElement;
  continueButton: HTMLButtonElement;
  startButton: HTMLButtonElement;
  openSettingsButtons: HTMLButtonElement[];
  closeSettingsButton: HTMLButtonElement;
  pauseButton: HTMLButtonElement;
  resumeButton: HTMLButtonElement;
  restartButtons: HTMLButtonElement[];
  nextButton: HTMLButtonElement;
  retryButton: HTMLButtonElement;
  backToMenuButtons: HTMLButtonElement[];
  vibrationToggle: HTMLInputElement;
  soundToggle: HTMLInputElement;
  debugToggle: HTMLInputElement;
}

export function createScreens(root: HTMLElement): ScreenRefs {
  root.innerHTML = `
    <div class="app-shell">
      <div class="game-shell">
        <div class="hud hidden" id="hud">
          <div class="hud__group">
            <span id="levelLabel">Уровень 1</span>
            <span id="timerLabel">0:00.00</span>
            <span id="hitsLabel">Ошибки: 0</span>
          </div>
          <div class="hud__group hud__group--actions">
            <button type="button" id="pauseButton">Пауза</button>
            <button type="button" data-action="restart">Заново</button>
          </div>
        </div>
        <div class="instruction hidden" id="instruction"></div>
        <div class="play-area" id="playArea">
          <canvas id="gameCanvas" aria-label="Игровое поле лабиринта"></canvas>
          <div class="overlay screen screen--menu" id="menuScreen">
            <div class="card">
              <p class="eyebrow">Maze Runner</p>
              <h1>Лабиринты без передышки</h1>
              <p>Ведите шар по коридорам, избегайте стен и проходите уровни все быстрее.</p>
              <div class="stack">
                <button type="button" id="startButton">Start</button>
                <button type="button" id="continueButton">Continue</button>
                <button type="button" class="secondary" data-action="open-settings">Settings</button>
              </div>
            </div>
          </div>
          <div class="overlay screen hidden" id="pauseScreen">
            <div class="card">
              <h2>Пауза</h2>
              <p>Игра остановлена. Продолжите попытку или начните уровень заново.</p>
              <div class="stack">
                <button type="button" id="resumeButton">Продолжить</button>
                <button type="button" data-action="restart">Перезапустить</button>
                <button type="button" class="secondary" data-action="open-settings">Settings</button>
                <button type="button" class="secondary" data-action="menu">В меню</button>
              </div>
            </div>
          </div>
          <div class="overlay screen hidden" id="resultsScreen">
            <div class="card">
              <p class="eyebrow" id="resultLevel">Уровень 1 пройден</p>
              <h2 id="resultTime">0:00.00</h2>
              <p id="resultHits">Ошибки: 0</p>
              <p id="resultBest">Лучший результат: 0:00.00</p>
              <p class="mono" id="resultSeed">Seed</p>
              <div class="stack">
                <button type="button" id="nextButton">Next</button>
                <button type="button" id="retryButton">Retry</button>
                <button type="button" class="secondary" data-action="menu">В меню</button>
              </div>
            </div>
          </div>
          <div class="overlay screen hidden" id="settingsScreen">
            <div class="card card--settings">
              <h2>Settings</h2>
              <label class="toggle">
                <span>Звук</span>
                <input id="soundToggle" type="checkbox" />
              </label>
              <label class="toggle">
                <span>Вибрация</span>
                <input id="vibrationToggle" type="checkbox" />
              </label>
              <label class="toggle">
                <span>Debug overlay</span>
                <input id="debugToggle" type="checkbox" />
              </label>
              <p class="note">Мобайл: ведите шар пальцем. ПК: мышь или WASD/стрелки.</p>
              <div class="stack">
                <button type="button" id="closeSettingsButton">Назад</button>
              </div>
            </div>
          </div>
        </div>
        <pre class="debug hidden" id="debugOverlay"></pre>
      </div>
    </div>
  `;

  const continueButton = root.querySelector('#continueButton') as HTMLButtonElement;
  const openSettingsButtons = Array.from(root.querySelectorAll('[data-action="open-settings"]')) as HTMLButtonElement[];
  const restartButtons = Array.from(root.querySelectorAll('[data-action="restart"]')) as HTMLButtonElement[];
  const backToMenuButtons = Array.from(root.querySelectorAll('[data-action="menu"]')) as HTMLButtonElement[];

  return {
    shell: root.querySelector('.app-shell') as HTMLElement,
    canvas: root.querySelector('#gameCanvas') as HTMLCanvasElement,
    playArea: root.querySelector('#playArea') as HTMLElement,
    menuScreen: root.querySelector('#menuScreen') as HTMLElement,
    pauseScreen: root.querySelector('#pauseScreen') as HTMLElement,
    resultsScreen: root.querySelector('#resultsScreen') as HTMLElement,
    settingsScreen: root.querySelector('#settingsScreen') as HTMLElement,
    hud: root.querySelector('#hud') as HTMLElement,
    debug: root.querySelector('#debugOverlay') as HTMLElement,
    instruction: root.querySelector('#instruction') as HTMLElement,
    levelLabel: root.querySelector('#levelLabel') as HTMLElement,
    timerLabel: root.querySelector('#timerLabel') as HTMLElement,
    hitsLabel: root.querySelector('#hitsLabel') as HTMLElement,
    resultLevel: root.querySelector('#resultLevel') as HTMLElement,
    resultTime: root.querySelector('#resultTime') as HTMLElement,
    resultHits: root.querySelector('#resultHits') as HTMLElement,
    resultSeed: root.querySelector('#resultSeed') as HTMLElement,
    resultBest: root.querySelector('#resultBest') as HTMLElement,
    continueButton,
    startButton: root.querySelector('#startButton') as HTMLButtonElement,
    openSettingsButtons,
    closeSettingsButton: root.querySelector('#closeSettingsButton') as HTMLButtonElement,
    pauseButton: root.querySelector('#pauseButton') as HTMLButtonElement,
    resumeButton: root.querySelector('#resumeButton') as HTMLButtonElement,
    restartButtons,
    nextButton: root.querySelector('#nextButton') as HTMLButtonElement,
    retryButton: root.querySelector('#retryButton') as HTMLButtonElement,
    backToMenuButtons,
    vibrationToggle: root.querySelector('#vibrationToggle') as HTMLInputElement,
    soundToggle: root.querySelector('#soundToggle') as HTMLInputElement,
    debugToggle: root.querySelector('#debugToggle') as HTMLInputElement
  };
}
