import type { Layout, LevelConfig, Maze, PlayerState, Point } from './types';
import type { InputController } from './input';
import { createRng } from './rng';
import { generateMaze, makeLevelConfig } from './maze';
import { moveWithCollisions } from './collision';
import { renderDynamic, renderMazeToBuffer } from './render';

export interface GameStats {
  level: number;
  seed: number;
  timeMs: number;
  collisions: number;
  finished: boolean;
}

export interface EngineHooks {
  onComplete?: (stats: GameStats) => void;
  onStats?: (stats: GameStats) => void;
  onCollision?: () => void;
}

export class GameEngine {
  private mazeCanvas: HTMLCanvasElement;
  private playCanvas: HTMLCanvasElement;
  private mazeCtx: CanvasRenderingContext2D;
  private playCtx: CanvasRenderingContext2D;
  private mazeBuffer: HTMLCanvasElement;
  private mazeBufferCtx: CanvasRenderingContext2D;
  private input: InputController;
  private hooks: EngineHooks;
  private layout: Layout = { cellSizePx: 20, offsetX: 0, offsetY: 0, wallThickness: 0.2 };

  private maze: Maze | null = null;
  private player: PlayerState = { pos: { x: 0.5, y: 0.5 }, radius: 0.2 };
  private level = 1;
  private seed = 1;
  private elapsedMs = 0;
  private collisions = 0;
  private running = false;
  private paused = true;
  private finished = false;
  private lastFrame = 0;
  private speed = 2.8;
  private lastCollisionAt = 0;
  private rafId = 0;
  private dpr = 1;

  constructor(
    mazeCanvas: HTMLCanvasElement,
    playCanvas: HTMLCanvasElement,
    input: InputController,
    hooks: EngineHooks = {}
  ) {
    this.mazeCanvas = mazeCanvas;
    this.playCanvas = playCanvas;
    this.input = input;
    this.hooks = hooks;

    const mazeCtx = mazeCanvas.getContext('2d');
    const playCtx = playCanvas.getContext('2d');
    if (!mazeCtx || !playCtx) throw new Error('Canvas context missing');
    this.mazeCtx = mazeCtx;
    this.playCtx = playCtx;
    this.mazeBuffer = document.createElement('canvas');
    const bufferCtx = this.mazeBuffer.getContext('2d');
    if (!bufferCtx) throw new Error('Buffer context missing');
    this.mazeBufferCtx = bufferCtx;

    this.resize();
  }

  startLevel(level: number, seed: number, config?: LevelConfig): void {
    const levelConfig = config ?? makeLevelConfig(level);
    this.level = level;
    this.seed = seed;
    this.layout.wallThickness = levelConfig.wallThickness;
    this.speed = 2.6 + Math.min(level * 0.05, 1.2);

    const rng = createRng(seed);
    this.maze = generateMaze(levelConfig.cols, levelConfig.rows, rng, seed, levelConfig.loopChance);
    this.player.radius = (1 - levelConfig.wallThickness) * 0.25;
    this.player.pos = {
      x: this.maze.start.x + 0.5,
      y: this.maze.start.y + 0.5
    };
    this.elapsedMs = 0;
    this.collisions = 0;
    this.finished = false;
    this.paused = false;
    this.lastCollisionAt = 0;

    this.resize();
    this.renderFrame();
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  setActive(active: boolean): void {
    this.paused = !active;
  }

  getStats(): GameStats {
    return {
      level: this.level,
      seed: this.seed,
      timeMs: this.elapsedMs,
      collisions: this.collisions,
      finished: this.finished
    };
  }

  getLayout(): Layout {
    return this.layout;
  }

  getMaze(): Maze | null {
    return this.maze;
  }

  getPlayer(): PlayerState {
    return this.player;
  }

  startLoop(): void {
    if (this.running) return;
    this.running = true;
    this.lastFrame = performance.now();
    const tick = (time: number) => {
      if (!this.running) return;
      const dt = Math.min((time - this.lastFrame) / 1000, 0.05);
      this.lastFrame = time;

      if (!this.paused && !this.finished && this.maze) {
        this.update(dt);
      }
      this.renderFrame();

      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stopLoop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    const rect = this.playCanvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);

    const pixelWidth = Math.floor(width * dpr);
    const pixelHeight = Math.floor(height * dpr);

    for (const canvas of [this.playCanvas, this.mazeCanvas, this.mazeBuffer]) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    this.mazeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.playCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.mazeBufferCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!this.maze) return;
    const margin = Math.min(28, width * 0.06);
    const cellSizePx = Math.max(
      10,
      Math.floor(Math.min((width - margin * 2) / this.maze.cols, (height - margin * 2) / this.maze.rows))
    );

    const offsetX = Math.floor((width - this.maze.cols * cellSizePx) / 2);
    const offsetY = Math.floor((height - this.maze.rows * cellSizePx) / 2);

    this.layout = {
      cellSizePx,
      offsetX,
      offsetY,
      wallThickness: this.layout.wallThickness
    };

    this.input.updateLayout(this.layout);
    this.renderStatic();
  }

  private update(dt: number): void {
    const maze = this.maze as Maze;
    const vector = this.input.getMoveVector(this.player.pos);
    const delta = { x: vector.x * this.speed * dt, y: vector.y * this.speed * dt };
    const result = moveWithCollisions(maze, this.player.pos, delta, this.player.radius, this.layout.wallThickness);
    if (result.collisions > 0) {
      const now = performance.now();
      if (now - this.lastCollisionAt > 120) {
        this.collisions += 1;
        this.lastCollisionAt = now;
        this.hooks.onCollision?.();
      }
    }

    this.player.pos = result.pos;
    this.elapsedMs += dt * 1000;

    const finish = maze.finish;
    if (
      Math.floor(this.player.pos.x) === finish.x &&
      Math.floor(this.player.pos.y) === finish.y &&
      distance(this.player.pos, { x: finish.x + 0.5, y: finish.y + 0.5 }) < this.player.radius * 1.4
    ) {
      this.finished = true;
      this.paused = true;
      this.hooks.onComplete?.(this.getStats());
    }

    this.hooks.onStats?.(this.getStats());
  }

  private renderStatic(): void {
    if (!this.maze) return;
    const width = this.mazeCanvas.width / this.dpr;
    const height = this.mazeCanvas.height / this.dpr;
    renderMazeToBuffer(this.mazeBufferCtx, width, height, this.maze, this.layout);
    this.mazeCtx.clearRect(0, 0, width, height);
    this.mazeCtx.drawImage(this.mazeBuffer, 0, 0, width, height);
  }

  private renderFrame(): void {
    if (!this.maze) return;
    const width = this.playCanvas.width / this.dpr;
    const height = this.playCanvas.height / this.dpr;
    renderDynamic(this.playCtx, width, height, this.maze, this.layout, this.player);
  }
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
