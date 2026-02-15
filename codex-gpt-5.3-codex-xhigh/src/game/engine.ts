import { moveWithCollisions } from './collision';
import { createLevelConfig } from './level';
import { generateMaze, isReachable } from './maze';
import { AudioFeedback } from './audio';
import { DebugOverlay } from './debug';
import { InputController } from './input';
import { MazeRenderer } from './renderer';
import type { GameSettings, HudSnapshot, LevelResult, MazeData, Point } from './types';

export interface GameEngineElements {
  canvas: HTMLCanvasElement;
  joystickBase: HTMLElement;
  joystickKnob: HTMLElement;
  debugElement: HTMLElement;
}

export interface GameEngineCallbacks {
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onLevelComplete: (result: LevelResult) => void;
  onPauseChanged: (paused: boolean) => void;
}

export class GameEngine {
  private readonly renderer: MazeRenderer;
  private readonly input: InputController;
  private readonly audio: AudioFeedback;
  private readonly debug: DebugOverlay;
  private readonly callbacks: GameEngineCallbacks;

  private settings: GameSettings;
  private baseSeed = 1;

  private maze: MazeData | null = null;
  private level = 1;
  private seed = 1;
  private playerRadius = 0.2;
  private moveSpeed = 2.8;
  private wallThicknessPx = 4;

  private readonly player: Point = { x: 0.5, y: 0.5 };

  private elapsedMs = 0;
  private collisionCount = 0;

  private running = false;
  private paused = false;

  private rafId = 0;
  private lastFrameTimestamp = 0;
  private lastHudEmit = 0;
  private lastCollisionFeedback = -1000;

  constructor(elements: GameEngineElements, callbacks: GameEngineCallbacks, settings: GameSettings, debugEnabled: boolean) {
    this.callbacks = callbacks;
    this.settings = settings;

    this.renderer = new MazeRenderer(elements.canvas);
    this.input = new InputController(
      elements.canvas,
      elements.joystickBase,
      elements.joystickKnob,
      (clientX, clientY) => this.renderer.screenToWorld(clientX, clientY)
    );

    this.audio = new AudioFeedback();
    this.audio.setEnabled(settings.soundEnabled);

    this.debug = new DebugOverlay(elements.debugElement, debugEnabled);

    this.applySettings(settings, debugEnabled);
  }

  applySettings(settings: GameSettings, debugEnabled: boolean): void {
    this.settings = settings;
    this.audio.setEnabled(settings.soundEnabled);
    this.debug.setEnabled(debugEnabled);
    this.input.setMode(resolveRuntimeControlMode(settings.controlMode));
  }

  unlockAudio(): void {
    this.audio.unlock();
  }

  startLevel(level: number, baseSeed: number): void {
    this.level = Math.max(1, level);
    this.baseSeed = baseSeed >>> 0;

    const config = createLevelConfig(this.level, this.baseSeed);
    this.seed = config.seed;
    this.playerRadius = config.playerRadius;
    this.moveSpeed = config.moveSpeed;
    this.wallThicknessPx = config.wallThicknessPx;

    this.maze = generateMaze({
      cols: config.cols,
      rows: config.rows,
      seed: config.seed,
      extraOpenings: config.extraOpenings
    });

    if (!isReachable(this.maze, this.maze.start, this.maze.finish)) {
      throw new Error('Generated maze is not reachable');
    }

    this.player.x = this.maze.start.x + 0.5;
    this.player.y = this.maze.start.y + 0.5;
    this.elapsedMs = 0;
    this.collisionCount = 0;
    this.lastCollisionFeedback = -1000;
    this.paused = false;

    this.renderer.setMaze(this.maze, this.wallThicknessPx);
    this.input.setMode(resolveRuntimeControlMode(this.settings.controlMode));
    this.input.setScreenToWorldMapper((clientX, clientY) => this.renderer.screenToWorld(clientX, clientY));

    this.emitHud(true);
    this.callbacks.onPauseChanged(false);

    this.running = true;
    this.ensureLoop();
  }

  restartLevel(): void {
    this.startLevel(this.level, this.baseSeed);
  }

  stop(): void {
    this.running = false;
    this.paused = false;
    this.input.clearTransient();
    if (this.rafId !== 0) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  setPaused(paused: boolean): void {
    if (!this.running || this.paused === paused) {
      return;
    }

    this.paused = paused;
    this.callbacks.onPauseChanged(paused);

    if (paused) {
      this.input.clearTransient();
    }
  }

  togglePause(): void {
    this.setPaused(!this.paused);
  }

  resize(): void {
    this.renderer.resize();
    this.input.setScreenToWorldMapper((clientX, clientY) => this.renderer.screenToWorld(clientX, clientY));
  }

  private ensureLoop(): void {
    if (this.rafId !== 0) {
      return;
    }

    this.lastFrameTimestamp = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  private readonly tick = (timestamp: number): void => {
    this.rafId = 0;

    if (!this.running) {
      return;
    }

    const rawDelta = (timestamp - this.lastFrameTimestamp) / 1000;
    const deltaSeconds = clamp(rawDelta, 0, 0.033);
    this.lastFrameTimestamp = timestamp;

    if (!this.paused && this.maze) {
      this.update(deltaSeconds, timestamp);
    }

    if (this.maze) {
      this.renderer.render({
        player: this.player,
        playerRadius: this.playerRadius,
        finishPulse: 0.7 + Math.sin(timestamp / 380) * 0.3
      });

      this.debug.update(deltaSeconds, {
        level: this.level,
        seed: this.seed,
        cols: this.maze.cols,
        rows: this.maze.rows,
        player: this.player,
        collisions: this.collisionCount,
        controlMode: resolveRuntimeControlMode(this.settings.controlMode),
        paused: this.paused
      });
    }

    if (this.running) {
      this.ensureLoop();
    }
  };

  private update(deltaSeconds: number, nowTimestamp: number): void {
    if (!this.maze) {
      return;
    }

    this.elapsedMs += deltaSeconds * 1000;

    const direction = this.input.getDirection(this.player);
    const deltaX = direction.x * this.moveSpeed * deltaSeconds;
    const deltaY = direction.y * this.moveSpeed * deltaSeconds;

    if (deltaX !== 0 || deltaY !== 0) {
      const movement = moveWithCollisions(
        this.maze,
        this.player.x,
        this.player.y,
        this.playerRadius,
        deltaX,
        deltaY
      );

      this.player.x = movement.x;
      this.player.y = movement.y;

      if (movement.hitWall && nowTimestamp - this.lastCollisionFeedback > 90) {
        this.lastCollisionFeedback = nowTimestamp;
        this.collisionCount += 1;
        this.audio.playCollision();

        if (this.settings.vibrationEnabled && typeof navigator.vibrate === 'function') {
          navigator.vibrate(10);
        }
      }
    }

    if (nowTimestamp - this.lastHudEmit > 100) {
      this.emitHud(false);
      this.lastHudEmit = nowTimestamp;
    }

    const finishX = this.maze.finish.x + 0.5;
    const finishY = this.maze.finish.y + 0.5;
    const finishDistanceSq = squaredDistance(this.player.x, this.player.y, finishX, finishY);

    if (finishDistanceSq <= 0.09) {
      this.completeLevel();
    }
  }

  private emitHud(force: boolean): void {
    if (!this.maze) {
      return;
    }

    if (!force && this.paused) {
      return;
    }

    const col = clampInt(Math.floor(this.player.x), 0, this.maze.cols - 1);
    const row = clampInt(Math.floor(this.player.y), 0, this.maze.rows - 1);
    const index = row * this.maze.cols + col;
    const distance = this.maze.distancesFromStart[index];

    const progress = this.maze.shortestPath > 0 ? clamp(distance / this.maze.shortestPath, 0, 1) : 0;

    this.callbacks.onHudUpdate({
      level: this.level,
      timeMs: this.elapsedMs,
      collisions: this.collisionCount,
      progress,
      seed: this.seed
    });
  }

  private completeLevel(): void {
    if (!this.maze) {
      return;
    }

    this.audio.playWin();

    const result: LevelResult = {
      level: this.level,
      seed: this.seed,
      timeMs: this.elapsedMs,
      collisions: this.collisionCount,
      shortestPath: this.maze.shortestPath
    };

    this.stop();
    this.callbacks.onLevelComplete(result);
  }
}

function resolveRuntimeControlMode(mode: GameSettings['controlMode']): 'drag' | 'joystick' {
  if (mode === 'drag' || mode === 'joystick') {
    return mode;
  }

  const hasTouch = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
  return hasTouch ? 'joystick' : 'drag';
}

function squaredDistance(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

function clampInt(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}
