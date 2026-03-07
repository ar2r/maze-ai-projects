import { createInitialState } from './state';
import { loadProgress, loadSettings, saveProgress, saveSettings } from './storage';
import { bindUi } from '../ui/bindings';
import { createScreens, type ScreenRefs } from '../ui/screens';
import { createSessionSeed, buildLevel, createPlayer } from '../game/level';
import { setupCanvas, resizeCanvas, computeViewport } from '../render/canvas';
import { MazeRenderer } from '../render/mazeRenderer';
import { drawPlayer } from '../render/gameRenderer';
import { DebugOverlay } from '../render/debugOverlay';
import { InputController } from '../game/input';
import { GameLoop } from '../game/loop';
import { resolveMovement } from '../game/collision';
import { formatTime } from '../utils/time';
import { distance, normalize } from '../utils/math';
import { playBeep } from '../utils/audio';
import { vibrate } from '../utils/vibration';
import type { GameSessionState, LevelState, ViewportInfo } from '../game/types';

export class GameApp {
  private readonly refs: ScreenRefs;
  private readonly context: CanvasRenderingContext2D;
  private readonly mazeRenderer = new MazeRenderer();
  private readonly debugOverlay: DebugOverlay;
  private readonly loop: GameLoop;
  private readonly input: InputController;
  private state: GameSessionState;
  private viewport: ViewportInfo = { widthPx: 1, heightPx: 1, scale: 1, offsetX: 0, offsetY: 0 };
  private dpr = 1;
  private lastFrameTime = performance.now();
  private fps = 0;
  private settingsReturnScreen: GameSessionState['screen'] = 'menu';

  constructor(root: HTMLElement) {
    this.refs = createScreens(root);
    this.context = setupCanvas(this.refs.canvas);
    const queryDebug = new URLSearchParams(window.location.search).get('debug') === '1';
    const storedSettings = loadSettings();
    this.state = createInitialState(loadProgress(), {
      ...storedSettings,
      debugEnabled: queryDebug || storedSettings.debugEnabled
    });
    this.debugOverlay = new DebugOverlay(this.refs.debug);
    this.input = new InputController(
      this.refs.canvas,
      { width: 10, height: 10 },
      {
        onPauseToggle: () => this.togglePause(),
        onRestart: () => this.restartLevel()
      }
    );
    this.loop = new GameLoop((dt) => this.update(dt), () => this.render());

    bindUi(this.refs, {
      startNewGame: () => this.startNewGame(),
      continueGame: () => this.continueGame(),
      pauseToggle: () => this.togglePause(),
      restartLevel: () => this.restartLevel(),
      resumeGame: () => this.resumeGame(),
      nextLevel: () => this.nextLevel(),
      retryLevel: () => this.retryLevel(),
      openSettings: () => this.openSettings(),
      closeSettings: () => this.closeSettings(),
      backToMenu: () => this.backToMenu(),
      updateSettings: (patch) => this.updateSettings(patch)
    });

    this.bindWindowEvents();
    this.syncSettingsToggles();
    this.syncUi();
    this.handleResize();
    this.render();
  }

  private bindWindowEvents(): void {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('orientationchange', this.handleOrientationChange);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('blur', this.handleWindowBlur);
  }

  private handleResize = (): void => {
    const resized = resizeCanvas(this.refs.canvas);
    this.dpr = resized.dpr;

    if (this.state.level !== null) {
      this.viewport = computeViewport(this.state.level.maze, resized.widthPx, resized.heightPx);
      this.input.updateViewport(this.viewport, {
        width: this.state.level.maze.width,
        height: this.state.level.maze.height
      });
      this.mazeRenderer.redraw(this.state.level, this.viewport, this.dpr);
    }

    this.render();
  };

  private handleOrientationChange = (): void => {
    this.input.cancelPointer();
    if (this.state.screen === 'running') {
      this.pauseForInterruption();
    }
    window.setTimeout(this.handleResize, 50);
  };

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.pauseForInterruption();
    }
  };

  private handleWindowBlur = (): void => {
    this.pauseForInterruption();
  };

  private startNewGame(): void {
    this.state.progress.currentLevel = 1;
    this.state.progress.sessionSeed = createSessionSeed();
    this.state.result = null;
    saveProgress(this.state.progress);
    this.loadLevel(1);
  }

  private continueGame(): void {
    if (!this.state.progress.sessionSeed) {
      this.startNewGame();
      return;
    }

    this.loadLevel(this.state.progress.currentLevel);
  }

  private loadLevel(levelNumber: number): void {
    const level = buildLevel(levelNumber, this.state.progress.sessionSeed);
    this.state.level = level;
    this.state.player = createPlayer(level);
    this.state.progress.currentLevel = levelNumber;
    this.state.result = null;
    this.state.screen = 'running';
    this.state.elapsedBeforePauseMs = 0;
    this.state.startedAtMs = performance.now();
    saveProgress(this.state.progress);

    this.handleResize();
    this.syncUi();
    this.loop.start();
  }

  private restartLevel(): void {
    if (this.state.level === null) {
      return;
    }

    this.loadLevel(this.state.level.config.level);
  }

  private retryLevel(): void {
    this.restartLevel();
  }

  private nextLevel(): void {
    if (this.state.level === null) {
      return;
    }

    this.loadLevel(this.state.level.config.level + 1);
  }

  private togglePause(): void {
    if (this.state.screen === 'running') {
      this.pauseGame();
      return;
    }

    if (this.state.screen === 'paused') {
      this.resumeGame();
    }
  }

  private pauseGame(): void {
    if (this.state.screen !== 'running') {
      return;
    }

    this.state.elapsedBeforePauseMs += performance.now() - this.state.startedAtMs;
    this.state.screen = 'paused';
    this.input.cancelPointer();
    this.loop.stop();
    this.syncUi();
    this.render();
  }

  private pauseForInterruption(): void {
    if (this.state.screen === 'running') {
      this.pauseGame();
    }
  }

  private resumeGame(): void {
    if (this.state.screen !== 'paused' || this.state.level === null) {
      return;
    }

    this.state.startedAtMs = performance.now();
    this.state.screen = 'running';
    this.syncUi();
    this.loop.start();
  }

  private openSettings(): void {
    this.settingsReturnScreen = this.state.screen;
    if (this.state.screen === 'running') {
      this.pauseGame();
      this.settingsReturnScreen = 'paused';
    }
    this.state.screen = 'settings';
    this.syncUi();
  }

  private closeSettings(): void {
    this.state.screen = this.settingsReturnScreen === 'running' ? 'paused' : this.settingsReturnScreen;
    this.syncUi();
    this.render();
  }

  private backToMenu(): void {
    this.loop.stop();
    this.input.cancelPointer();
    this.state.screen = 'menu';
    this.state.level = null;
    this.state.player = null;
    this.state.result = null;
    this.state.elapsedBeforePauseMs = 0;
    this.syncUi();
    this.render();
  }

  private updateSettings(patch: Partial<GameSessionState['settings']>): void {
    this.state.settings = {
      ...this.state.settings,
      ...patch
    };
    saveSettings(this.state.settings);
    this.syncSettingsToggles();
    this.syncUi();
  }

  private syncSettingsToggles(): void {
    this.refs.soundToggle.checked = this.state.settings.soundEnabled;
    this.refs.vibrationToggle.checked = this.state.settings.vibrationEnabled;
    this.refs.debugToggle.checked = this.state.settings.debugEnabled;
  }

  private getElapsedMs(): number {
    if (this.state.screen === 'running') {
      return this.state.elapsedBeforePauseMs + (performance.now() - this.state.startedAtMs);
    }

    return this.state.elapsedBeforePauseMs;
  }

  private update(dt: number): void {
    const { level, player } = this.state;
    if (this.state.screen !== 'running' || level === null || player === null) {
      return;
    }

    player.collisionCooldownMs = Math.max(0, player.collisionCooldownMs - dt * 1000);

    let desiredX = 0;
    let desiredY = 0;

    if (this.input.state.pointerActive) {
      const pointerVector = {
        x: this.input.state.pointerWorld.x - player.position.x,
        y: this.input.state.pointerWorld.y - player.position.y
      };
      const normalized = normalize(pointerVector.x, pointerVector.y);
      desiredX += normalized.x;
      desiredY += normalized.y;
    }

    desiredX += this.input.state.keyboardX;
    desiredY += this.input.state.keyboardY;

    const normalizedDesired = normalize(desiredX, desiredY);
    const desiredVelocityX = normalizedDesired.x * level.config.playerSpeed;
    const desiredVelocityY = normalizedDesired.y * level.config.playerSpeed;
    const blend = Math.min(1, dt * level.config.pointerAcceleration);

    player.velocity.x += (desiredVelocityX - player.velocity.x) * blend;
    player.velocity.y += (desiredVelocityY - player.velocity.y) * blend;

    if (normalizedDesired.x === 0 && normalizedDesired.y === 0) {
      player.velocity.x *= 0.84;
      player.velocity.y *= 0.84;
    }

    const collision = resolveMovement(player, level.maze, player.velocity.x * dt, player.velocity.y * dt);
    if (collision.collided) {
      player.velocity.x *= 0.45;
      player.velocity.y *= 0.45;
      if (player.collisionCooldownMs === 0) {
        player.wallHits += 1;
        player.collisionCooldownMs = 110;
        if (this.state.settings.vibrationEnabled) {
          vibrate(12);
        }
        playBeep(this.state.settings.soundEnabled, 180, 45, 0.02);
      }
    }

    const finishCenter = {
      x: level.maze.finishCell.x + 0.5,
      y: level.maze.finishCell.y + 0.5
    };

    if (distance(player.position, finishCenter) <= Math.max(player.radius, 0.18)) {
      this.completeLevel(level);
    }
  }

  private completeLevel(level: LevelState): void {
    this.loop.stop();
    const elapsed = this.getElapsedMs();
    const levelKey = String(level.config.level);
    const previousBest = this.state.progress.bestTimesByLevel[levelKey] ?? Number.POSITIVE_INFINITY;
    const bestTimeMs = Math.min(previousBest, elapsed);
    const improvedBest = elapsed < previousBest;

    this.state.progress.bestTimesByLevel[levelKey] = bestTimeMs;
    this.state.progress.currentLevel = level.config.level + 1;
    saveProgress(this.state.progress);

    this.state.result = {
      level: level.config.level,
      timeMs: elapsed,
      wallHits: this.state.player?.wallHits ?? 0,
      seed: level.config.seed,
      bestTimeMs,
      improvedBest
    };
    this.state.elapsedBeforePauseMs = elapsed;
    this.state.screen = 'results';
    playBeep(this.state.settings.soundEnabled, 620, 160, 0.035);
    this.syncUi();
    this.render();
  }

  private render(): void {
    const now = performance.now();
    const delta = Math.max(1, now - this.lastFrameTime);
    this.fps = 1000 / delta;
    this.lastFrameTime = now;

    this.context.save();
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.context.clearRect(0, 0, this.viewport.widthPx, this.viewport.heightPx);
    this.context.restore();

    if (this.state.level !== null) {
      this.mazeRenderer.drawTo(this.context, this.viewport, this.dpr);
    } else {
      this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.context.fillStyle = '#f7f0dc';
      this.context.fillRect(0, 0, this.viewport.widthPx || this.refs.canvas.clientWidth, this.viewport.heightPx || this.refs.canvas.clientHeight);
    }

    if (this.state.player !== null) {
      const pulse = Math.sin(now / 160) * 1.5 + 2;
      drawPlayer(this.context, this.state.player, this.viewport, this.dpr, pulse * 0.08);
    }

    this.refs.timerLabel.textContent = formatTime(this.getElapsedMs());
    this.refs.hitsLabel.textContent = `Ошибки: ${this.state.player?.wallHits ?? 0}`;

    this.debugOverlay.update({
      fps: this.fps,
      level: this.state.level,
      player: this.state.player
    });
  }

  private syncUi(): void {
    const { level, result } = this.state;
    const activeScreen = this.state.screen;
    this.refs.menuScreen.classList.toggle('hidden', activeScreen !== 'menu');
    this.refs.pauseScreen.classList.toggle('hidden', activeScreen !== 'paused');
    this.refs.resultsScreen.classList.toggle('hidden', activeScreen !== 'results');
    this.refs.settingsScreen.classList.toggle('hidden', activeScreen !== 'settings');
    this.refs.hud.classList.toggle('hidden', !(activeScreen === 'running' || activeScreen === 'paused'));
    this.refs.instruction.classList.toggle('hidden', !(activeScreen === 'running' || activeScreen === 'paused'));
    this.refs.debug.classList.toggle('hidden', !this.state.settings.debugEnabled);
    this.refs.continueButton.disabled = !this.state.progress.sessionSeed;

    if (level !== null) {
      this.refs.levelLabel.textContent = `Уровень ${level.config.level}`;
      this.refs.instruction.textContent = window.matchMedia('(pointer: coarse)').matches
        ? 'Ведите шар пальцем. Быстрые свайпы не телепортируют, пауза сработает при уходе со вкладки.'
        : 'Зажмите мышь и ведите шар или используйте WASD/стрелки. Space/Esc — пауза, R — рестарт.';
    }

    if (result !== null) {
      this.refs.resultLevel.textContent = `Уровень ${result.level} пройден`;
      this.refs.resultTime.textContent = formatTime(result.timeMs);
      this.refs.resultHits.textContent = `Ошибки: ${result.wallHits}`;
      this.refs.resultBest.textContent = result.improvedBest
        ? `Новый рекорд: ${formatTime(result.bestTimeMs)}`
        : `Лучший результат: ${formatTime(result.bestTimeMs)}`;
      this.refs.resultSeed.textContent = result.seed;
    }
  }
}
