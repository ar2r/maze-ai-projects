import type { GameState, GameSettings, Vec2, MazeData, LevelConfig, LevelResult } from '../types';
import { generateMaze } from './maze';
import { buildWallRects, moveWithCollision, isPlayerInCell } from './collision';
import { getLevelConfig } from './levels';
import { InputManager } from '../input/manager';
import { MazeRenderer, drawPlayer, DebugOverlay } from '../render/renderer';
import { loadSettings, saveSettings, loadSave, saveSave } from '../storage';
import { playWallHit, playLevelComplete, vibrate, playMenuClick } from '../audio';
import { vec2 } from '../utils/rng';

type WallRect = ReturnType<typeof buildWallRects>[number];

export class GameEngine {
  // State
  state: GameState = 'menu';
  settings: GameSettings;
  level = 1;
  private config!: LevelConfig;
  private maze!: MazeData;
  private walls: WallRect[] = [];
  private playerPos: Vec2 = { x: 0, y: 0 };
  private wallHits = 0;
  private startTime = 0;
  private elapsedTime = 0;
  private pausedAt = 0;
  private rafId = 0;
  private lastTime = 0;

  // Rendering
  private mazeCanvas!: HTMLCanvasElement;
  private playerCanvas!: HTMLCanvasElement;
  private mazeCtx!: CanvasRenderingContext2D;
  private playerCtx!: CanvasRenderingContext2D;
  private mazeRenderer = new MazeRenderer();
  private debugOverlay = new DebugOverlay();
  private dpr = 1;

  // Input
  private input = new InputManager();

  // Callbacks for UI
  onStateChange: (state: GameState) => void = () => {};
  onTimeUpdate: (elapsed: number) => void = () => {};
  onLevelComplete: (result: LevelResult) => void = () => {};

  constructor() {
    this.settings = loadSettings();
  }

  init(): void {
    this.mazeCanvas = document.getElementById('canvas-maze') as HTMLCanvasElement;
    this.playerCanvas = document.getElementById('canvas-player') as HTMLCanvasElement;
    this.mazeCtx = this.mazeCanvas.getContext('2d')!;
    this.playerCtx = this.playerCanvas.getContext('2d')!;

    this.resizeCanvases();
    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.onResize(), 200);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'playing') {
        this.pause();
      }
    });

    // Setup input with screen-to-world transform
    this.input.setScreenToWorld((sx, sy) => vec2(sx / this.dpr, sy / this.dpr));

    // Load saved progress
    const save = loadSave();
    this.level = save.currentLevel;
  }

  private resizeCanvases(): void {
    this.dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (const canvas of [this.mazeCanvas, this.playerCanvas]) {
      canvas.width = w * this.dpr;
      canvas.height = h * this.dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }
  }

  private onResize(): void {
    this.resizeCanvases();
    if (this.state === 'playing' || this.state === 'paused') {
      this.renderMaze();
      this.resetPlayerPosition();
    }
  }

  startLevel(level: number): void {
    this.level = level;
    this.config = getLevelConfig(level);
    this.maze = generateMaze(this.config);

    this.renderMaze();
    this.resetPlayerPosition();

    this.wallHits = 0;
    this.elapsedTime = 0;
    this.startTime = performance.now();
    this.lastTime = this.startTime;

    // Show/hide joystick based on control mode
    const useJoystick = this.settings.controlMode === 'joystick' ||
      (this.settings.controlMode === 'auto' && ('ontouchstart' in window));
    this.input.showJoystick(useJoystick);
    this.input.init(() => {}, this.settings.controlMode);

    this.setState('playing');

    if (this.settings.debug) this.debugOverlay.show();
    else this.debugOverlay.hide();

    this.startLoop();
  }

  private renderMaze(): void {
    const w = this.mazeCanvas.width;
    const h = this.mazeCanvas.height;
    this.mazeRenderer.render(this.maze, this.config, w, h, this.dpr);

    // Rebuild wall rects with new offset
    this.walls = buildWallRects(
      this.maze, this.config.cellSize,
      this.mazeRenderer.offsetX, this.mazeRenderer.offsetY
    );

    // Blit maze to canvas
    this.mazeCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.mazeCtx.clearRect(0, 0, w, h);
    this.mazeRenderer.drawTo(this.mazeCtx);
  }

  private resetPlayerPosition(): void {
    const { cellSize } = this.config;
    this.playerPos = {
      x: this.mazeRenderer.offsetX + cellSize / 2,
      y: this.mazeRenderer.offsetY + cellSize / 2,
    };
  }

  private startLoop(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.lastTime = performance.now();
    const loop = (now: number) => {
      this.rafId = requestAnimationFrame(loop);
      this.update(now);
      this.render(now);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stopLoop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private update(now: number): void {
    if (this.state !== 'playing') return;

    const dt = Math.min((now - this.lastTime) / 1000, 0.05); // cap delta for tab-out
    this.lastTime = now;
    this.elapsedTime = (now - this.startTime) / 1000;

    // Update pointer world pos for mouse follow
    const worldPointer = this.input.getWorldPointerPos();
    if (worldPointer) {
      this.input.playerWorldPos = this.playerPos;
    } else {
      this.input.playerWorldPos = this.playerPos;
    }

    // Get input direction
    const inputState = this.input.getInput();
    if (inputState.active) {
      const speed = this.config.playerSpeed;
      const delta = {
        x: inputState.direction.x * speed * dt,
        y: inputState.direction.y * speed * dt,
      };

      const result = moveWithCollision(
        this.playerPos, delta, this.config.playerRadius, this.walls
      );

      this.playerPos = result.pos;

      if (result.hits > 0) {
        this.wallHits += result.hits;
        if (this.settings.sound) playWallHit();
        if (this.settings.vibration) vibrate(30);
      }
    }

    // Check win condition: player in finish cell
    if (isPlayerInCell(
      this.playerPos, this.config.playerRadius,
      this.maze.rows - 1, this.maze.cols - 1,
      this.config.cellSize,
      this.mazeRenderer.offsetX, this.mazeRenderer.offsetY
    )) {
      // Check if player center is close enough to cell center
      const finishCenterX = this.mazeRenderer.offsetX + (this.maze.cols - 1) * this.config.cellSize + this.config.cellSize / 2;
      const finishCenterY = this.mazeRenderer.offsetY + (this.maze.rows - 1) * this.config.cellSize + this.config.cellSize / 2;
      const dx = this.playerPos.x - finishCenterX;
      const dy = this.playerPos.y - finishCenterY;
      if (Math.sqrt(dx * dx + dy * dy) < this.config.cellSize * 0.4) {
        this.completeLevel();
      }
    }

    // Update timer in HUD
    this.onTimeUpdate(this.elapsedTime);
  }

  private render(now: number): void {
    // Player layer
    drawPlayer(
      this.playerCtx,
      this.playerPos,
      this.config.playerRadius,
      this.dpr,
      this.playerCanvas.width,
      this.playerCanvas.height
    );

    // Debug overlay
    if (this.settings.debug) {
      this.debugOverlay.tick(now);
      this.debugOverlay.update({
        seed: this.maze.seed,
        gridSize: `${this.maze.cols}x${this.maze.rows}`,
        playerPos: `${this.playerPos.x.toFixed(1)},${this.playerPos.y.toFixed(1)}`,
        wallHits: this.wallHits,
        level: this.level,
        solutionLen: this.maze.solutionLength,
      });
    }
  }

  private completeLevel(): void {
    this.stopLoop();
    if (this.settings.sound) playLevelComplete();
    if (this.settings.vibration) vibrate(100);

    const result: LevelResult = {
      time: this.elapsedTime,
      wallHits: this.wallHits,
      level: this.level,
    };

    // Save progress
    const save = loadSave();
    save.currentLevel = Math.max(save.currentLevel, this.level + 1);
    const prevBest = save.bestTimes[this.level];
    if (!prevBest || this.elapsedTime < prevBest) {
      save.bestTimes[this.level] = this.elapsedTime;
    }
    saveSave(save);

    this.setState('results');
    this.onLevelComplete(result);
  }

  pause(): void {
    if (this.state !== 'playing') return;
    this.pausedAt = performance.now();
    this.stopLoop();
    this.setState('paused');
  }

  resume(): void {
    if (this.state !== 'paused') return;
    // Adjust startTime to account for pause duration
    const pauseDuration = performance.now() - this.pausedAt;
    this.startTime += pauseDuration;
    this.setState('playing');
    this.startLoop();
  }

  restart(): void {
    this.stopLoop();
    this.startLevel(this.level);
  }

  nextLevel(): void {
    this.stopLoop();
    this.startLevel(this.level + 1);
  }

  goToMenu(): void {
    this.stopLoop();
    this.input.showJoystick(false);
    this.debugOverlay.hide();

    // Clear canvases
    this.mazeCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.mazeCtx.clearRect(0, 0, this.mazeCanvas.width, this.mazeCanvas.height);
    this.playerCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.playerCtx.clearRect(0, 0, this.playerCanvas.width, this.playerCanvas.height);

    this.setState('menu');
  }

  updateSettings(s: GameSettings): void {
    this.settings = s;
    saveSettings(s);
    if (this.settings.debug && this.state === 'playing') {
      this.debugOverlay.show();
    } else {
      this.debugOverlay.hide();
    }
  }

  private setState(s: GameState): void {
    this.state = s;
    this.onStateChange(s);
  }
}
