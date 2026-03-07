// Main game engine

import { GameState, Settings, MovementInput, getLevelConfig } from './types';
import { MazeGenerator } from './maze';
import { CollisionSystem } from './collision';
import { SeededRNG } from './rng';
import { InputHandler } from '../input/input';
import { MouseInput } from '../input/mouse';
import { KeyboardInput } from '../input/keyboard';
import { TouchInput } from '../input/touch';
import { CanvasManager } from '../renderer/canvas';
import { MazeRenderer } from '../renderer/mazeRenderer';
import { PlayerRenderer } from '../renderer/playerRenderer';
import { Storage } from '../storage/storage';

export class GameEngine {
  private state: GameState;
  private mazeGenerator: MazeGenerator;
  private collisionSystem: CollisionSystem;
  private storage: Storage;

  private canvasManager: CanvasManager;
  private mazeRenderer: MazeRenderer;
  private playerRenderer: PlayerRenderer;

  private inputs: InputHandler[] = [];
  private mouseInput: MouseInput | null = null;
  private touchInput: TouchInput | null = null;

  private canvas: HTMLCanvasElement;
  private joystickContainer: HTMLElement;

  private animationFrame: number = 0;
  private lastTime: number = 0;
  private scale: number = 1;
  private offsetX: number = 0;
  private offsetY: number = 0;

  private onLevelComplete: (time: number, hits: number) => void = () => {};
  private onVibration: () => void = () => {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.joystickContainer = document.getElementById('joystick-container')!;

    this.storage = Storage.getInstance();
    this.mazeGenerator = new MazeGenerator();
    this.collisionSystem = new CollisionSystem();
    this.canvasManager = new CanvasManager(canvas);
    this.mazeRenderer = new MazeRenderer();
    this.playerRenderer = new PlayerRenderer();

    this.state = this.createInitialState();
    this.setupInputs(this.storage.getSettings());

    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('blur', () => this.pause());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.pause();
    });
  }

  private createInitialState(): GameState {
    return {
      level: 1,
      player: { x: 20, y: 20, radius: 8, speed: 150 },
      maze: null,
      status: 'menu',
      stats: {
        startTime: 0,
        elapsedTime: 0,
        wallHits: 0,
        bestTime: null
      }
    };
  }

  private setupInputs(settings: Settings): void {
    // Clear existing inputs
    this.inputs.forEach(input => input.destroy());
    this.inputs = [];

    // Always add keyboard input
    const keyboardInput = new KeyboardInput();
    this.inputs.push(keyboardInput);

    // Add mouse input for desktop
    if (settings.controlMode === 'mouse' || settings.controlMode === 'follow') {
      this.mouseInput = new MouseInput(this.canvas);
      this.inputs.push(this.mouseInput);
    }

    // Add touch input for mobile
    if (settings.controlMode === 'joystick') {
      this.joystickContainer.classList.remove('hidden');
      const joystickBase = document.getElementById('joystick-base')!;
      const joystickStick = document.getElementById('joystick-stick')!;
      this.touchInput = new TouchInput(this.joystickContainer, joystickBase, joystickStick);
      this.inputs.push(this.touchInput);
    } else {
      this.joystickContainer.classList.add('hidden');
    }
  }

  updateSettings(settings: Settings): void {
    this.setupInputs(settings);
    this.storage.setSettings(settings);
  }

  private handleResize(): void {
    this.canvasManager.resize();
    if (this.state.maze) {
      this.calculateScale();
    }
  }

  private calculateScale(): void {
    if (!this.state.maze) return;

    const canvasWidth = this.canvasManager.getWidth();
    const canvasHeight = this.canvasManager.getHeight();

    const mazeWidth = this.state.maze.width * this.state.maze.cellSize;
    const mazeHeight = this.state.maze.height * this.state.maze.cellSize;

    const scaleX = (canvasWidth - 40) / mazeWidth;
    const scaleY = (canvasHeight - 40) / mazeHeight;

    this.scale = Math.min(scaleX, scaleY, 2);
    this.offsetX = (canvasWidth - mazeWidth * this.scale) / 2 / this.scale;
    this.offsetY = (canvasHeight - mazeHeight * this.scale) / 2 / this.scale;

    // Update mouse input transform
    if (this.mouseInput) {
      this.mouseInput.setTransform(this.scale, this.offsetX, this.offsetY);
    }

    // Re-render maze background
    this.mazeRenderer.render(this.canvasManager, this.state.maze);
  }

  start(level: number = 1): void {
    this.state.level = level;
    this.generateLevel(level);
    this.state.status = 'playing';
    this.state.stats.startTime = Date.now();
    this.state.stats.wallHits = 0;
    this.state.stats.bestTime = this.storage.getBestTime(level);
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private generateLevel(level: number): void {
    const config = getLevelConfig(level);
    const seed = Date.now();
    const rng = new SeededRNG(seed);

    const cellSize = 30;
    this.state.maze = this.mazeGenerator.generate(
      config.width,
      config.height,
      rng.nextInt(1, 1000000),
      cellSize,
      config.loops
    );

    // Position player at start
    this.state.player.x = this.state.maze.startX;
    this.state.player.y = this.state.maze.startY;

    // Update global position for mouse input
    (window as any).__playerPosition = { x: this.state.player.x, y: this.state.player.y };

    this.calculateScale();
    this.playerRenderer.clearTrail();
  }

  private gameLoop(): void {
    if (this.state.status !== 'playing') return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Update mouse input transform
    if (this.mouseInput) {
      this.mouseInput.setTransform(this.scale, this.offsetX, this.offsetY);
    }

    this.update(deltaTime);
    this.render();

    this.animationFrame = requestAnimationFrame(() => this.gameLoop());
  }

  private update(deltaTime: number): void {
    if (!this.state.maze) return;

    // Get combined input
    const movement: MovementInput = { x: 0, y: 0 };
    for (const input of this.inputs) {
      const m = input.getMovement();
      movement.x += m.x;
      movement.y += m.y;
    }

    // Clamp movement
    const length = Math.sqrt(movement.x * movement.x + movement.y * movement.y);
    if (length > 1) {
      movement.x /= length;
      movement.y /= length;
    }

    // Apply movement
    const speed = this.state.player.speed * deltaTime;
    let newX = this.state.player.x + movement.x * speed;
    let newY = this.state.player.y + movement.y * speed;

    // Update player position temporarily for collision check
    const oldX = this.state.player.x;
    const oldY = this.state.player.y;

    this.state.player.x = newX;
    this.state.player.y = newY;

    // Check collision
    const collision = this.collisionSystem.checkPlayerWallCollision(this.state.player, this.state.maze);

    if (collision.wallHit) {
      // Apply correction
      this.state.player.x = oldX + collision.correctionX;
      this.state.player.y = oldY + collision.correctionY;

      // Try separate axes
      this.state.player.x = newX;
      const collisionX = this.collisionSystem.checkPlayerWallCollision(this.state.player, this.state.maze);
      if (collisionX.wallHit) {
        this.state.player.x = oldX;
      }

      this.state.player.y = newY;
      const collisionY = this.collisionSystem.checkPlayerWallCollision(this.state.player, this.state.maze);
      if (collisionY.wallHit) {
        this.state.player.y = oldY;
      }

      this.state.stats.wallHits++;
      this.onVibration();
    }

    // Update global position for mouse input
    (window as any).__playerPosition = { x: this.state.player.x, y: this.state.player.y };

    // Update trail
    this.playerRenderer.updateTrail(this.state.player);

    // Check win condition
    if (this.collisionSystem.checkWin(this.state.player, this.state.maze)) {
      this.onWin();
    }
  }

  private render(): void {
    if (!this.state.maze) return;

    const ctx = this.canvasManager.getContext();

    this.canvasManager.clear();

    // Draw maze background
    ctx.save();
    ctx.translate(this.offsetX * this.scale, this.offsetY * this.scale);
    ctx.scale(this.scale, this.scale);
    this.canvasManager.drawMazeBackground(0, 0);
    ctx.restore();

    // Draw player
    ctx.save();
    ctx.translate(this.offsetX * this.scale, this.offsetY * this.scale);
    ctx.scale(this.scale, this.scale);
    this.playerRenderer.render(ctx, this.state.player, 0, 0, 1);
    ctx.restore();
  }

  private onWin(): void {
    this.state.status = 'won';
    this.state.stats.elapsedTime = Date.now() - this.state.stats.startTime;

    // Save best time
    this.storage.setBestTime(this.state.level, this.state.stats.elapsedTime);
    this.storage.setCurrentLevel(this.state.level + 1);

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    this.onLevelComplete(this.state.stats.elapsedTime, this.state.stats.wallHits);
  }

  pause(): void {
    if (this.state.status === 'playing') {
      this.state.status = 'paused';
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }
    }
  }

  resume(): void {
    if (this.state.status === 'paused') {
      this.state.status = 'playing';
      this.lastTime = performance.now();
      this.gameLoop();
    }
  }

  getState(): GameState {
    return this.state;
  }

  setOnLevelComplete(callback: (time: number, hits: number) => void): void {
    this.onLevelComplete = callback;
  }

  setOnVibration(callback: () => void): void {
    this.onVibration = callback;
  }

  destroy(): void {
    this.inputs.forEach(input => input.destroy());
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}