import { generatePerfectMaze, shortestPathLength } from '../core/maze';
import { getLevelConfig } from '../core/level';
import { makeLevelSeed } from '../core/rng';
import type { Maze, PlayerState, ProgressData, RunStats, Settings } from '../core/types';
import { validateMazeReachable } from '../core/validate';
import { InputController } from '../input/controls';
import type { UiElements } from '../ui/dom';
import { saveProgress, saveSettings } from '../ui/storage';
import { moveWithCollision } from './collision';
import { createRenderContext, drawMazeToBuffer, renderFrame, resizeRenderContext, type RenderContext } from './render';

const PLAYER_SPEED = 220;

interface EngineCallbacks {
  onLevelComplete: (stats: RunStats) => void;
}

export class MazeGameEngine {
  private ui: UiElements;
  private settings: Settings;
  private progress: ProgressData;
  private callbacks: EngineCallbacks;
  private render: RenderContext;
  private input: InputController;
  private maze: Maze | null = null;
  private player: PlayerState = { x: 0, y: 0, radius: 6, collisions: 0 };
  private level = 1;
  private cellSize = 24;
  private wallThickness = 2;
  private running = false;
  private paused = false;
  private rafId = 0;
  private lastTime = 0;
  private stats: RunStats = { startedAt: 0, elapsedMs: 0, collisions: 0 };
  private fps = 0;
  private dpr = 1;

  constructor(ui: UiElements, settings: Settings, progress: ProgressData, callbacks: EngineCallbacks) {
    this.ui = ui;
    this.settings = settings;
    this.progress = progress;
    this.callbacks = callbacks;
    this.render = createRenderContext(ui.canvas);
    this.input = new InputController(ui.canvas, ui.joystickArea, ui.joystickThumb, settings.controlMode);

    this.setupResize();
    this.setupVisibilityPause();
    this.resizeCanvas();
  }

  start(level: number): void {
    this.level = level;
    this.prepareLevel(level);
    this.running = true;
    this.paused = false;
    this.stats = { startedAt: performance.now(), elapsedMs: 0, collisions: 0 };
    this.lastTime = performance.now();
    this.loop();
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    if (!this.running) return;
    this.paused = false;
    this.lastTime = performance.now();
  }

  restart(): void {
    this.start(this.level);
  }

  setSettings(settings: Settings): void {
    this.settings = settings;
    this.input.setMode(settings.controlMode);
    saveSettings(settings);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.input.dispose();
  }

  getCurrentLevel(): number {
    return this.level;
  }

  getStats(): RunStats {
    return { ...this.stats };
  }

  getSeed(): string {
    return this.maze?.seed ?? '';
  }

  private prepareLevel(level: number): void {
    const cfg = getLevelConfig(level);
    const seed = makeLevelSeed(level, this.progress.sessionSeedBase);
    const targetPath = Math.floor((cfg.gridWidth + cfg.gridHeight) * 0.7);
    let maze = generatePerfectMaze(cfg.gridWidth, cfg.gridHeight, seed, cfg.extraLoopChance, cfg.roomChance);

    if (!validateMazeReachable(maze) || shortestPathLength(maze, { x: 0, y: 0 }, { x: maze.width - 1, y: maze.height - 1 }) < targetPath) {
      maze = generatePerfectMaze(cfg.gridWidth, cfg.gridHeight, `${seed}:retry`, cfg.extraLoopChance, cfg.roomChance);
    }

    this.maze = maze;

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const viewportW = Math.floor(window.innerWidth * this.dpr);
    const viewportH = Math.floor((window.innerHeight - 120) * this.dpr);
    const fitByW = Math.floor((viewportW - 12) / cfg.gridWidth);
    const fitByH = Math.floor((viewportH - 12) / cfg.gridHeight);
    this.cellSize = Math.max(12, Math.min(fitByW, fitByH, Math.floor(cfg.cellSize * this.dpr * cfg.corridorRatio)));
    this.wallThickness = Math.max(1, Math.floor(this.cellSize * 0.11));

    this.player = {
      x: this.cellSize * 0.5,
      y: this.cellSize * 0.5,
      radius: Math.max(4, Math.floor(this.cellSize * 0.23)),
      collisions: 0
    };

    this.resizeCanvas();
    drawMazeToBuffer(this.render, maze, this.cellSize, this.wallThickness);
    this.ui.hintLabel.textContent = this.settings.controlMode === 'drag' ? 'Drag / mouse / WASD' : 'Joystick / WASD';
  }

  private resizeCanvas = (): void => {
    if (!this.maze) return;
    const width = Math.floor(this.maze.width * this.cellSize);
    const height = Math.floor(this.maze.height * this.cellSize);
    this.ui.canvas.style.width = `${Math.floor(width / this.dpr)}px`;
    this.ui.canvas.style.height = `${Math.floor(height / this.dpr)}px`;
    resizeRenderContext(this.render, width, height);
    this.player.x = Math.min(this.player.x, width - this.player.radius);
    this.player.y = Math.min(this.player.y, height - this.player.radius);

    drawMazeToBuffer(this.render, this.maze, this.cellSize, this.wallThickness);
  };

  private loop = (): void => {
    if (!this.running) return;

    this.rafId = requestAnimationFrame(this.loop);
    if (this.paused || !this.maze) return;

    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.stats.elapsedMs = now - this.stats.startedAt;
    this.fps = 1 / Math.max(dt, 0.0001);

    const input = this.input.getInput(this.player.x, this.player.y);
    const distance = PLAYER_SPEED * dt * (0.3 + input.intensity * 0.9);
    const dx = input.direction.x * distance;
    const dy = input.direction.y * distance;

    const moved = moveWithCollision(this.maze, this.player.x, this.player.y, dx, dy, this.player.radius, this.cellSize);
    this.player.x = moved.x;
    this.player.y = moved.y;

    if (moved.collided && distance > 0.01) {
      this.player.collisions += 1;
      this.stats.collisions = this.player.collisions;
      if (this.settings.vibration && 'vibrate' in navigator) navigator.vibrate(12);
    }

    const goalX = (this.maze.width - 0.5) * this.cellSize;
    const goalY = (this.maze.height - 0.5) * this.cellSize;
    const reached = Math.hypot(this.player.x - goalX, this.player.y - goalY) <= this.player.radius + this.cellSize * 0.18;

    const totalCells = this.maze.width * this.maze.height;
    const progress = Math.min(1, (Math.floor(this.player.y / this.cellSize) * this.maze.width + Math.floor(this.player.x / this.cellSize) + 1) / totalCells);

    renderFrame(this.render, this.maze, this.player, this.cellSize, progress);
    this.ui.levelLabel.textContent = `Level ${this.level}`;
    this.ui.timerLabel.textContent = `${(this.stats.elapsedMs / 1000).toFixed(1)}s`;
    this.ui.collisionLabel.textContent = `Hits: ${this.player.collisions}`;

    if (this.settings.debugOverlay) {
      this.ui.debugOverlay.hidden = false;
      this.ui.debugOverlay.textContent = `FPS ${this.fps.toFixed(0)} | seed ${this.maze.seed} | grid ${this.maze.width}x${this.maze.height} | pos ${this.player.x.toFixed(1)},${this.player.y.toFixed(1)} | hit ${this.player.collisions}`;
    } else {
      this.ui.debugOverlay.hidden = true;
    }

    if (reached) {
      this.running = false;
      const best = this.progress.bestTimesByLevel[this.level];
      if (!best || this.stats.elapsedMs < best) this.progress.bestTimesByLevel[this.level] = this.stats.elapsedMs;
      this.progress.currentLevel = Math.max(this.progress.currentLevel, this.level + 1);
      saveProgress(this.progress);
      this.callbacks.onLevelComplete({ ...this.stats });
    }
  };

  private setupVisibilityPause(): void {
    window.addEventListener('blur', () => {
      if (this.running) this.pause();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
  }

  private setupResize(): void {
    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (this.maze) this.prepareLevel(this.level);
      }, 120);
    });

    screen.orientation?.addEventListener?.('change', () => {
      if (this.maze) this.prepareLevel(this.level);
    });
  }
}
