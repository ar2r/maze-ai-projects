import { getLevelConfig } from '../core/level-config';
import { buildWallRects, generateMaze } from '../core/maze-generator';
import { createSessionSeedBase } from '../core/rng';
import { validateMaze } from '../core/maze-validator';
import { resolveCircleMovement } from './collision';
import type { FeedbackService } from '../services/feedback';
import type { StorageService } from '../services/storage';
import type { InputManager } from '../input/input-manager';
import type { GameRenderer } from '../render/renderer';
import type {
  GameSettings,
  LevelConfig,
  LevelResult,
  MazeData,
  Rect,
  RenderDebugData,
  ScreenState,
  UiSnapshot,
  Vector2,
} from '../types';

interface RuntimeLevel {
  level: number;
  config: LevelConfig;
  maze: MazeData;
  wallRects: Rect[];
  playerPosition: Vector2;
  finishPosition: Vector2;
  elapsedMs: number;
  wallHits: number;
  lastRegisteredHitAt: number;
}

interface GameEngineOptions {
  input: InputManager;
  renderer: GameRenderer;
  storage: StorageService;
  feedback: FeedbackService;
  onUiChange: (snapshot: UiSnapshot) => void;
}

export class GameEngine {
  private readonly input: InputManager;
  private readonly renderer: GameRenderer;
  private readonly storage: StorageService;
  private readonly feedback: FeedbackService;
  private readonly onUiChange: (snapshot: UiSnapshot) => void;
  private settings: GameSettings;
  private screen: ScreenState = 'menu';
  private runtime: RuntimeLevel | null = null;
  private lastResult: LevelResult | null = null;
  private lastFrameTime = 0;
  private smoothedFps = 60;
  private uiAccumulator = 0;

  constructor(options: GameEngineOptions) {
    this.input = options.input;
    this.renderer = options.renderer;
    this.storage = options.storage;
    this.feedback = options.feedback;
    this.onUiChange = options.onUiChange;
    this.settings = this.storage.getSettings();
    this.input.setControlMode(this.settings.controlMode);
    this.feedback.updateSettings(this.settings);
    this.renderer.resize();

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('orientationchange', this.handleResize);
    window.addEventListener('blur', this.handleBlur);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    this.emitUiSnapshot();
    window.requestAnimationFrame(this.tick);
  }

  getSettings(): GameSettings {
    return this.settings;
  }

  startNewGame(): void {
    const progress = this.storage.getProgress();
    const nextProgress = {
      ...progress,
      currentLevel: 1,
      sessionSeedBase: createSessionSeedBase(),
    };
    this.storage.saveProgress(nextProgress);
    this.lastResult = null;
    this.loadLevel(1);
  }

  continueGame(): void {
    const progress = this.storage.getProgress();
    const seedBase = progress.sessionSeedBase || createSessionSeedBase();
    this.storage.saveProgress({
      ...progress,
      currentLevel: Math.max(1, progress.currentLevel),
      sessionSeedBase: seedBase,
    });
    this.lastResult = null;
    this.loadLevel(Math.max(1, progress.currentLevel));
  }

  restartLevel(): void {
    if (!this.runtime) {
      this.startNewGame();
      return;
    }

    this.lastResult = null;
    this.loadLevel(this.runtime.level);
  }

  nextLevel(): void {
    const nextLevel = (this.lastResult?.level ?? this.runtime?.level ?? 1) + 1;
    this.lastResult = null;
    this.loadLevel(nextLevel);
  }

  pause(): void {
    if (this.screen !== 'playing') {
      return;
    }

    this.screen = 'paused';
    this.input.resetTransientInputs();
    this.emitUiSnapshot();
  }

  resume(): void {
    if (this.screen !== 'paused') {
      return;
    }

    this.screen = 'playing';
    this.lastFrameTime = 0;
    this.emitUiSnapshot();
  }

  returnToMenu(): void {
    this.screen = 'menu';
    this.input.resetTransientInputs();
    this.lastResult = null;
    this.emitUiSnapshot();
  }

  applySettings(settings: GameSettings): void {
    this.settings = settings;
    this.storage.saveSettings(settings);
    this.input.setControlMode(settings.controlMode);
    this.feedback.updateSettings(settings);
    this.emitUiSnapshot();
  }

  private loadLevel(level: number): void {
    const progress = this.storage.getProgress();
    const sessionSeedBase = progress.sessionSeedBase || createSessionSeedBase();
    const config = getLevelConfig(level);
    const maze = generateMaze(config, sessionSeedBase);
    const validation = validateMaze(maze);
    if (!validation.valid) {
      throw new Error('Maze generation produced an invalid level.');
    }

    const wallRects = buildWallRects(maze, config.wallThickness);
    const playerPosition = { x: 0.5, y: 0.5 };
    const finishPosition = { x: maze.cols - 0.5, y: maze.rows - 0.5 };

    this.storage.saveProgress({
      ...progress,
      currentLevel: level,
      sessionSeedBase,
    });

    this.runtime = {
      level,
      config,
      maze,
      wallRects,
      playerPosition,
      finishPosition,
      elapsedMs: 0,
      wallHits: 0,
      lastRegisteredHitAt: Number.NEGATIVE_INFINITY,
    };
    this.screen = 'playing';
    this.renderer.setScene(maze, wallRects);
    this.input.setViewport(this.renderer.getViewport());
    this.lastFrameTime = 0;
    this.emitUiSnapshot();
  }

  private readonly tick = (timestamp: number): void => {
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = timestamp;
    }

    const deltaSeconds = Math.min((timestamp - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = timestamp;
    this.smoothedFps = this.smoothedFps * 0.92 + (1 / Math.max(deltaSeconds, 0.0001)) * 0.08;

    if (this.screen === 'playing' && this.runtime) {
      this.updateRuntime(deltaSeconds, timestamp);
    }

    this.renderer.render({
      playerPosition: this.runtime?.playerPosition ?? null,
      playerRadius: this.runtime?.config.playerRadius ?? 0.18,
      finishPosition: this.runtime?.finishPosition ?? null,
      debugData: this.settings.debugOverlay ? this.buildDebugData() : null,
    });

    this.uiAccumulator += deltaSeconds;
    if (this.uiAccumulator >= 0.12) {
      this.uiAccumulator = 0;
      this.emitUiSnapshot();
    }

    window.requestAnimationFrame(this.tick);
  };

  private updateRuntime(deltaSeconds: number, timestamp: number): void {
    if (!this.runtime) {
      return;
    }

    this.runtime.elapsedMs += deltaSeconds * 1000;
    const movementIntent = this.input.getMovementIntent(this.runtime.playerPosition);
    const delta = {
      x: movementIntent.x * this.runtime.config.speed * deltaSeconds,
      y: movementIntent.y * this.runtime.config.speed * deltaSeconds,
    };

    const result = resolveCircleMovement(
      {
        x: this.runtime.playerPosition.x,
        y: this.runtime.playerPosition.y,
        radius: this.runtime.config.playerRadius,
      },
      delta,
      this.runtime.wallRects,
    );

    this.runtime.playerPosition = result.position;

    if (result.hit && timestamp - this.runtime.lastRegisteredHitAt > 80) {
      this.runtime.wallHits += 1;
      this.runtime.lastRegisteredHitAt = timestamp;
      this.feedback.wallHit();
    }

    const distanceToFinish = Math.hypot(
      this.runtime.playerPosition.x - this.runtime.finishPosition.x,
      this.runtime.playerPosition.y - this.runtime.finishPosition.y,
    );
    if (distanceToFinish <= Math.max(0.22, this.runtime.config.playerRadius * 1.2)) {
      this.completeLevel();
    }
  }

  private completeLevel(): void {
    if (!this.runtime) {
      return;
    }

    const progress = this.storage.getProgress();
    const bestTimeKey = String(this.runtime.level);
    const previousBest = progress.bestTimes[bestTimeKey] ?? Number.POSITIVE_INFINITY;
    const bestTimeMs = Math.min(previousBest, this.runtime.elapsedMs);

    this.storage.saveProgress({
      ...progress,
      currentLevel: this.runtime.level + 1,
      bestTimes: {
        ...progress.bestTimes,
        [bestTimeKey]: bestTimeMs,
      },
    });

    this.lastResult = {
      level: this.runtime.level,
      elapsedMs: this.runtime.elapsedMs,
      wallHits: this.runtime.wallHits,
      bestTimeMs,
      seed: this.runtime.maze.seed,
    };
    this.screen = 'results';
    this.input.resetTransientInputs();
    this.feedback.levelComplete();
    this.emitUiSnapshot();
  }

  private buildDebugData(): RenderDebugData | null {
    if (!this.runtime) {
      return null;
    }

    return {
      fps: this.smoothedFps,
      seed: this.runtime.maze.seed,
      grid: `${this.runtime.maze.cols}x${this.runtime.maze.rows}`,
      player: `${this.runtime.playerPosition.x.toFixed(2)}, ${this.runtime.playerPosition.y.toFixed(2)}`,
      wallHits: this.runtime.wallHits,
      control: this.input.getResolvedControlMode(),
    };
  }

  private emitUiSnapshot(): void {
    const progress = this.storage.getProgress();
    this.onUiChange({
      screen: this.screen,
      level: this.runtime?.level ?? Math.max(1, progress.currentLevel),
      elapsedMs: this.runtime?.elapsedMs ?? 0,
      wallHits: this.runtime?.wallHits ?? 0,
      canContinue: Boolean(progress.sessionSeedBase),
      result: this.lastResult,
      helpText: this.input.getHelpText(),
      settings: this.settings,
      showJoystick: this.input.isJoystickVisible() && (this.screen === 'playing' || this.screen === 'paused'),
      statusText: this.runtime
        ? `Seed ${this.runtime.maze.seed} • ${this.runtime.maze.cols}x${this.runtime.maze.rows} • solution ${this.runtime.maze.solutionLength}`
        : 'Random seeded perfect mazes. Complete levels to unlock the next one.',
    });
  }

  private readonly handleResize = (): void => {
    this.renderer.resize();
    if (this.runtime) {
      this.input.setViewport(this.renderer.getViewport());
    }
    this.emitUiSnapshot();
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this.pause();
    }
  };

  private readonly handleBlur = (): void => {
    this.pause();
  };
}
