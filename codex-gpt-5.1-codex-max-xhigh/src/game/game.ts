import { composeSeed } from '../core/random';
import { generateMaze, isConnected, shortestPathLength, type Maze } from '../core/maze';
import { resolveMovement } from '../core/collision';
import { InputManager, type ControlScheme } from '../core/input';
import { DebugOverlay } from '../core/debugOverlay';
import { loadProgress, saveProgress, type Settings } from '../core/storage';

type GameState = 'menu' | 'playing' | 'paused' | 'complete';

type LevelSettings = {
  width: number;
  height: number;
  wallThickness: number; // in cell units
  loops: number;
  speed: number; // cells per second
  radius: number;
};

type LevelStats = {
  level: number;
  time: number;
  collisions: number;
  seed: number;
  width: number;
  height: number;
  pathLength: number;
};

type Callbacks = {
  onLevelComplete?: (stats: LevelStats) => void;
  onHudUpdate?: (hud: HudState) => void;
};

type HudState = {
  level: number;
  time: number;
  best?: number;
  collisions: number;
};

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mazeLayer: HTMLCanvasElement;
  private mazeLayerCtx: CanvasRenderingContext2D;
  private input: InputManager;
  private debug: DebugOverlay;
  private state: GameState = 'menu';
  private maze!: Maze;
  private level = 1;
  private settings: Settings;
  private runSeed: number;
  private callbacks: Callbacks;
  private scale = 1;
  private margin = 12;
  private player = { x: 0.5, y: 0.5, radius: 0.24 };
  private goal = { x: 0, y: 0 };
  private wallThickness = 0.16;
  private speed = 2.6;
  private collisions = 0;
  private lastTime = 0;
  private levelStartedAt = 0;
  private finishedTime = 0;
  private bestTimes: Record<number, number> = {};
  private fpsSamples: number[] = [];
  private lastVibrate = 0;
  private pathLength = 0;
  private pausedFromBlur = false;

  constructor(canvas: HTMLCanvasElement, overlayRoot: HTMLElement, callbacks: Callbacks, debugEnabled: boolean) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.canvas = canvas;
    this.ctx = ctx;
    this.mazeLayer = document.createElement('canvas');
    const layerCtx = this.mazeLayer.getContext('2d');
    if (!layerCtx) throw new Error('Offscreen context missing');
    this.mazeLayerCtx = layerCtx;
    const progress = loadProgress();
    this.settings = progress.settings;
    this.runSeed = progress.runSeed;
    this.level = progress.level;
    this.bestTimes = progress.bestTimes;
    const mapper = this.buildMapper();
    this.input = new InputManager(canvas, this.settings.control, mapper);
    this.debug = new DebugOverlay(overlayRoot, debugEnabled);
    this.callbacks = callbacks;
    this.attachWindowEvents();
    this.resize();
    requestAnimationFrame((t) => this.loop(t));
  }

  private buildMapper() {
    return (px: number, py: number) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleFactor = this.canvas.width / rect.width;
      const cx = (px - rect.left) * scaleFactor;
      const cy = (py - rect.top) * scaleFactor;
      return {
        x: (cx - this.margin) / this.scale,
        y: (cy - this.margin) / this.scale
      };
    };
  }

  private attachWindowEvents() {
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => this.resize());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'playing') {
        this.pausedFromBlur = true;
        this.pause();
      } else if (!document.hidden && this.pausedFromBlur) {
        this.resume();
        this.pausedFromBlur = false;
      }
    });
  }

  private resize() {
    const dpr = window.devicePixelRatio || 1;
    const { clientWidth, clientHeight } = this.canvas;
    this.canvas.width = Math.floor(clientWidth * dpr);
    this.canvas.height = Math.floor(clientHeight * dpr);
    this.margin = 18 * dpr;
    this.scale = 1; // will be recomputed once maze exists
    this.input.setMapper(this.buildMapper());
    if (this.maze) {
      this.updateScale();
      this.drawMazeLayer();
    }
  }

  private updateScale() {
    const availableW = this.canvas.width - this.margin * 2;
    const availableH = this.canvas.height - this.margin * 2;
    this.scale = Math.min(availableW / this.maze.width, availableH / this.maze.height);
  }

  startLevel(level: number) {
    this.level = level;
    const seed = composeSeed(level, this.runSeed);
    const config = this.levelSettings(level);
    this.wallThickness = config.wallThickness;
    this.speed = config.speed;
    this.player.radius = config.radius;

    this.maze = generateMaze({ width: config.width, height: config.height, addLoops: config.loops, seed });
    if (!isConnected(this.maze)) {
      // extremely unlikely; regenerate with tweaked seed to guarantee path
      this.maze = generateMaze({ width: config.width, height: config.height, addLoops: config.loops, seed: seed + 1 });
    }
    this.goal = { x: this.maze.width - 0.5, y: this.maze.height - 0.5 };
    this.player.x = 0.5;
    this.player.y = 0.5;
    this.collisions = 0;
    this.levelStartedAt = performance.now();
    this.finishedTime = 0;
    this.pathLength = shortestPathLength(this.maze);
    this.state = 'playing';
    this.updateScale();
    this.drawMazeLayer();
    this.sendHud();
  }

  restartLevel() {
    this.startLevel(this.level);
  }

  pause() {
    if (this.state === 'playing') this.state = 'paused';
  }

  resume() {
    if (this.state === 'paused') this.state = 'playing';
  }

  setSettings(settings: Settings) {
    this.settings = settings;
    this.input.setControlScheme(settings.control);
    saveProgress({ level: this.level, bestTimes: this.bestTimes, runSeed: this.runSeed, settings: this.settings });
  }

  resetRun(newSeed: number, startLevel = 1, options?: { keepBestTimes?: boolean }) {
    this.runSeed = newSeed >>> 0;
    this.level = startLevel;
    if (!options?.keepBestTimes) {
      this.bestTimes = {};
    }
    saveProgress({ level: this.level, bestTimes: this.bestTimes, runSeed: this.runSeed, settings: this.settings });
  }

  getSettings(): Settings {
    return this.settings;
  }

  getJoystickState() {
    return this.input.getJoystickState();
  }

  getState(): GameState {
    return this.state;
  }

  getHudState(): HudState {
    return {
      level: this.level,
      time: this.getElapsedSeconds(),
      best: this.bestTimes[this.level],
      collisions: this.collisions
    };
  }

  private levelSettings(level: number): LevelSettings {
    const width = Math.min(50, 10 + Math.floor((level - 1) * 1.4));
    const height = Math.min(50, 10 + Math.floor((level - 1) * 1.2));
    const wallThickness = Math.min(0.3, 0.14 + level * 0.01);
    const loops = Math.min(0.25, 0.05 + level * 0.012);
    const speed = 2.4 + Math.min(2.6, level * 0.12);
    const radius = Math.max(0.18, 0.25 - level * 0.004);
    return { width, height, wallThickness, loops, speed, radius };
  }

  private drawMazeLayer() {
    this.mazeLayer.width = this.canvas.width;
    this.mazeLayer.height = this.canvas.height;
    const ctx = this.mazeLayerCtx;
    ctx.clearRect(0, 0, this.mazeLayer.width, this.mazeLayer.height);

    ctx.fillStyle = '#0f1d2f';
    ctx.fillRect(0, 0, this.mazeLayer.width, this.mazeLayer.height);

    ctx.save();
    ctx.translate(this.margin, this.margin);
    ctx.fillStyle = '#1c2f44';
    const halfWallPx = (this.wallThickness * this.scale) / 2;

    // vertical walls
    for (let y = 0; y < this.maze.height; y++) {
      for (let x = 0; x < this.maze.width + 1; x++) {
        if (this.maze.verticalWalls[x + y * (this.maze.width + 1)]) {
          const sx = x * this.scale - halfWallPx;
          const sy = y * this.scale;
          ctx.fillRect(sx, sy, this.wallThickness * this.scale, this.scale);
        }
      }
    }
    // horizontal walls
    for (let y = 0; y < this.maze.height + 1; y++) {
      for (let x = 0; x < this.maze.width; x++) {
        if (this.maze.horizontalWalls[x + y * this.maze.width]) {
          const sx = x * this.scale;
          const sy = y * this.scale - halfWallPx;
          ctx.fillRect(sx, sy, this.scale, this.wallThickness * this.scale);
        }
      }
    }

    // start & exit markers
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(0.5 * this.scale, 0.5 * this.scale, this.scale * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc((this.maze.width - 0.5) * this.scale, (this.maze.height - 0.5) * this.scale, this.scale * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private loop(timestamp: number) {
    const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000 || 0);
    this.lastTime = timestamp;
    this.update(dt);
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  private update(dt: number) {
    if (this.state !== 'playing') return;
    const input = this.input.snapshot({ x: this.player.x, y: this.player.y });
    const len = Math.hypot(input.dirX, input.dirY);
    const normX = len > 0 ? input.dirX / len : 0;
    const normY = len > 0 ? input.dirY / len : 0;
    const distance = this.speed * dt * (len > 0 ? Math.min(1.2, len) : 0);
    const dx = normX * distance;
    const dy = normY * distance;

    const { x, y, collided } = resolveMovement(this.player.x, this.player.y, dx, dy, this.maze, this.player.radius, this.wallThickness);
    if (collided) {
      this.collisions += 1;
      const now = performance.now();
      if (this.settings.vibration && now - this.lastVibrate > 80 && 'vibrate' in navigator) {
        navigator.vibrate(10);
        this.lastVibrate = now;
      }
    }
    this.player.x = x;
    this.player.y = y;

    // finish check
    const distToGoal = Math.hypot(this.player.x - this.goal.x, this.player.y - this.goal.y);
    if (distToGoal < 0.38) {
      this.finishedTime = this.getElapsedSeconds();
      this.state = 'complete';
      this.bestTimes[this.level] = Math.min(this.bestTimes[this.level] ?? Infinity, this.finishedTime);
      saveProgress({ level: this.level + 1, bestTimes: this.bestTimes, runSeed: this.runSeed, settings: this.settings });
      this.callbacks.onLevelComplete?.({
        level: this.level,
        time: this.finishedTime,
        collisions: this.collisions,
        seed: this.maze.seed,
        width: this.maze.width,
        height: this.maze.height,
        pathLength: this.pathLength
      });
    }
    this.sendHud();
  }

  private render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.mazeLayer, 0, 0);

    ctx.save();
    ctx.translate(this.margin, this.margin);
    ctx.fillStyle = '#f5f7fb';
    ctx.shadowColor = 'rgba(255,255,255,0.35)';
    ctx.shadowBlur = this.scale * 0.08;
    ctx.beginPath();
    ctx.arc(this.player.x * this.scale, this.player.y * this.scale, this.player.radius * this.scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this.drawDebug();
  }

  private drawDebug() {
    const now = performance.now();
    this.fpsSamples.push(now);
    while (this.fpsSamples.length && now - this.fpsSamples[0] > 1000) {
      this.fpsSamples.shift();
    }
    const fps = this.fpsSamples.length;
    this.debug.render({
      fps,
      seed: this.maze?.seed ?? 0,
      grid: this.maze ? `${this.maze.width}x${this.maze.height}` : '-x-',
      player: { x: this.player.x, y: this.player.y },
      collisions: this.collisions
    });
  }

  private getElapsedSeconds(): number {
    if (this.state === 'complete') return this.finishedTime;
    return (performance.now() - this.levelStartedAt) / 1000;
  }

  private sendHud() {
    this.callbacks.onHudUpdate?.(this.getHudState());
  }
}

export type { LevelStats, HudState, GameState };
