import { GameState, LevelConfig, MazeData, Settings } from '../utils/types';
import { generateMaze } from '../maze/MazeGenerator';
import { RNG } from '../maze/RNG';
import { MazeRenderer } from '../render/MazeRenderer';
import { PlayerRenderer } from '../render/PlayerRenderer';
import { CollisionSystem } from './Collision';
import { Player } from './Player';
import { InputManager } from '../input/InputManager';
import { Storage } from '../storage/Storage';
import { DebugOverlay } from '../debug/DebugOverlay';
import {
  BASE_MAZE_WIDTH,
  BASE_MAZE_HEIGHT,
  SIZE_INCREMENT,
  MAX_MAZE_SIZE,
  BASE_CELL_SIZE,
  MIN_CELL_SIZE,
  WALL_THICKNESS,
  PLAYER_BASE_RADIUS,
  PLAYER_BASE_SPEED,
  CANVAS_PADDING,
  VIBRATION_DURATION,
  LEVEL_COMPLETE_DELAY,
} from '../utils/constants';

/**
 * Main game controller
 * Orchestrates all game systems
 */
export class Game {
  // Core systems
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mazeRenderer: MazeRenderer;
  private playerRenderer: PlayerRenderer;
  private inputManager: InputManager;
  private storage: Storage;
  private debugOverlay: DebugOverlay;

  // Game state
  private state: GameState = GameState.MENU;
  private currentLevel: number = 1;
  private maze: MazeData | null = null;
  private collision: CollisionSystem | null = null;
  private player: Player | null = null;
  private levelConfig: LevelConfig | null = null;

  // Timing
  private startTime: number = 0;
  private elapsedTime: number = 0;
  private lastFrameTime: number = 0;
  private animationFrameId: number = 0;

  // Stats
  private wallHitCount: number = 0;
  private collisionFlashIntensity: number = 0;

  // Settings
  private settings: Settings;

  // Canvas positioning
  private canvasOffsetX: number = 0;
  private canvasOffsetY: number = 0;
  private dpr: number = 1;

  // UI Elements
  private menuMain: HTMLElement;
  private menuSettings: HTMLElement;
  private menuPause: HTMLElement;
  private menuResults: HTMLElement;
  private hud: HTMLElement;
  private pauseBtn: HTMLElement;
  private instructions: HTMLElement;

  constructor() {
    // Get canvas and context
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    // Initialize renderers
    this.mazeRenderer = new MazeRenderer();
    this.playerRenderer = new PlayerRenderer();

    // Initialize systems
    this.inputManager = new InputManager(this.canvas);
    this.storage = new Storage();
    this.debugOverlay = new DebugOverlay();
    this.settings = this.storage.getSettings();

    // Get UI elements
    this.menuMain = document.getElementById('menu-main')!;
    this.menuSettings = document.getElementById('menu-settings')!;
    this.menuPause = document.getElementById('menu-pause')!;
    this.menuResults = document.getElementById('menu-results')!;
    this.hud = document.getElementById('hud')!;
    this.pauseBtn = document.getElementById('pause-btn')!;
    this.instructions = document.getElementById('instructions')!;

    this.setupUI();
    this.setupEventListeners();
    this.updateContinueButton();

    // Handle resize
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.resizeCanvas(), 100);
    });

    // Start game loop
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }

  private setupUI(): void {
    // Main menu buttons
    document.getElementById('btn-start')!.onclick = () => this.startNewGame();
    document.getElementById('btn-continue')!.onclick = () => this.continueGame();
    document.getElementById('btn-settings')!.onclick = () => this.showSettings();

    // Settings
    document.getElementById('btn-settings-back')!.onclick = () => this.hideSettings();
    this.setupToggle('toggle-sound', 'soundEnabled');
    this.setupToggle('toggle-vibration', 'vibrationEnabled');
    this.setupToggle('toggle-timer', 'showTimer');

    // Pause menu
    this.pauseBtn.onclick = () => this.pause();
    document.getElementById('btn-resume')!.onclick = () => this.resume();
    document.getElementById('btn-restart')!.onclick = () => this.restart();
    document.getElementById('btn-quit')!.onclick = () => this.quitToMenu();

    // Results
    document.getElementById('btn-next')!.onclick = () => this.nextLevel();
    document.getElementById('btn-retry')!.onclick = () => this.restart();

    // Update settings toggles
    this.updateSettingsUI();
  }

  private setupToggle(id: string, setting: keyof Settings): void {
    const toggle = document.getElementById(id)!;
    toggle.onclick = () => {
      const newValue = !this.settings[setting];
      this.settings[setting] = newValue;
      this.storage.setSettings({ [setting]: newValue });
      toggle.classList.toggle('active', newValue);
    };
  }

  private updateSettingsUI(): void {
    document.getElementById('toggle-sound')!.classList.toggle('active', this.settings.soundEnabled);
    document.getElementById('toggle-vibration')!.classList.toggle('active', this.settings.vibrationEnabled);
    document.getElementById('toggle-timer')!.classList.toggle('active', this.settings.showTimer);
  }

  private setupEventListeners(): void {
    // Handle visibility change (pause when tab hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === GameState.PLAYING) {
        this.pause();
      }
    });

    // Handle escape key for pause
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.state === GameState.PLAYING) {
          this.pause();
        } else if (this.state === GameState.PAUSED) {
          this.resume();
        }
      }
    });
  }

  private updateContinueButton(): void {
    const btn = document.getElementById('btn-continue') as HTMLButtonElement;
    btn.disabled = !this.storage.hasProgress();
  }

  private resizeCanvas(): void {
    const container = this.canvas.parentElement!;
    const rect = container.getBoundingClientRect();

    this.dpr = window.devicePixelRatio || 1;

    // Calculate available space
    const maxWidth = rect.width - CANVAS_PADDING * 2;
    const maxHeight = rect.height - CANVAS_PADDING * 2;

    // If we have a maze, size canvas to fit it
    if (this.maze && this.levelConfig) {
      const mazePixelWidth = this.maze.width * this.levelConfig.cellSize;
      const mazePixelHeight = this.maze.height * this.levelConfig.cellSize;

      // Scale down if needed
      const scale = Math.min(1, maxWidth / mazePixelWidth, maxHeight / mazePixelHeight);
      const canvasWidth = mazePixelWidth * scale;
      const canvasHeight = mazePixelHeight * scale;

      this.canvas.style.width = `${canvasWidth}px`;
      this.canvas.style.height = `${canvasHeight}px`;
      this.canvas.width = canvasWidth * this.dpr;
      this.canvas.height = canvasHeight * this.dpr;

      // Center offset
      this.canvasOffsetX = (this.canvas.width - mazePixelWidth * this.dpr) / 2;
      this.canvasOffsetY = (this.canvas.height - mazePixelHeight * this.dpr) / 2;
    } else {
      // Default canvas size
      const size = Math.min(maxWidth, maxHeight, 600);
      this.canvas.style.width = `${size}px`;
      this.canvas.style.height = `${size}px`;
      this.canvas.width = size * this.dpr;
      this.canvas.height = size * this.dpr;
      this.canvasOffsetX = 0;
      this.canvasOffsetY = 0;
    }
  }

  /** Calculate level configuration based on level number */
  private getLevelConfig(level: number): LevelConfig {
    // Increase maze size with level
    const width = Math.min(BASE_MAZE_WIDTH + (level - 1) * SIZE_INCREMENT, MAX_MAZE_SIZE);
    const height = Math.min(BASE_MAZE_HEIGHT + (level - 1) * SIZE_INCREMENT, MAX_MAZE_SIZE);

    // Decrease cell size slightly with level (but not too small)
    const cellSize = Math.max(BASE_CELL_SIZE - (level - 1) * 1.5, MIN_CELL_SIZE);

    // Wall thickness stays consistent
    const wallThickness = WALL_THICKNESS;

    // Player speed increases slightly with level
    const playerSpeed = PLAYER_BASE_SPEED + (level - 1) * 5;

    return { level, width, height, cellSize, wallThickness, playerSpeed };
  }

  private startNewGame(): void {
    this.currentLevel = 1;
    this.storage.setCurrentLevel(1);
    this.startLevel();
  }

  private continueGame(): void {
    this.currentLevel = this.storage.getCurrentLevel();
    this.startLevel();
  }

  private startLevel(): void {
    // Get level config
    this.levelConfig = this.getLevelConfig(this.currentLevel);

    // Generate maze with deterministic seed
    const seed = RNG.seedFromLevel(this.currentLevel);
    this.maze = generateMaze(
      this.levelConfig.width,
      this.levelConfig.height,
      seed
    );

    // Resize canvas to fit maze
    this.resizeCanvas();

    // Render maze to offscreen buffer
    this.mazeRenderer.render(this.maze, this.levelConfig.cellSize, this.dpr);

    // Create collision system
    this.collision = new CollisionSystem(
      this.maze,
      this.levelConfig.cellSize,
      this.levelConfig.wallThickness
    );

    // Create player at start position
    const startX = (this.maze.start.x + 0.5) * this.levelConfig.cellSize;
    const startY = (this.maze.start.y + 0.5) * this.levelConfig.cellSize;
    this.player = new Player(startX, startY, this.levelConfig.playerSpeed);

    // Scale player radius based on cell size
    const playerRadius = Math.max(
      PLAYER_BASE_RADIUS * (this.levelConfig.cellSize / BASE_CELL_SIZE),
      4
    );
    this.player.setRadius(playerRadius);

    // Reset stats
    this.wallHitCount = 0;
    this.collisionFlashIntensity = 0;
    this.startTime = performance.now();
    this.elapsedTime = 0;

    // Update debug overlay
    this.debugOverlay.update({
      seed: this.maze.seed,
      mazeSize: `${this.maze.width}x${this.maze.height}`,
      hitCount: 0,
    });

    // Show game UI
    this.hideAllMenus();
    this.hud.classList.remove('hidden');
    this.pauseBtn.classList.remove('hidden');
    this.instructions.classList.remove('hidden');

    // Update HUD
    document.getElementById('hud-level')!.textContent = String(this.currentLevel);

    // Show joystick on mobile
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.inputManager.setJoystickVisible(isMobile);

    // Update instructions based on device
    const instructionsText = document.getElementById('instructions-text')!;
    if (isMobile) {
      instructionsText.textContent = 'Use joystick to move • Reach the green exit';
    } else {
      instructionsText.textContent = 'Use mouse or WASD to move • Reach the green exit';
    }

    // Reset input
    this.inputManager.reset();

    // Start playing
    this.state = GameState.PLAYING;
  }

  private hideAllMenus(): void {
    this.menuMain.classList.add('hidden');
    this.menuSettings.classList.add('hidden');
    this.menuPause.classList.add('hidden');
    this.menuResults.classList.add('hidden');
  }

  private showSettings(): void {
    this.state = GameState.SETTINGS;
    this.menuMain.classList.add('hidden');
    this.menuSettings.classList.remove('hidden');
    this.updateSettingsUI();
  }

  private hideSettings(): void {
    this.state = GameState.MENU;
    this.menuSettings.classList.add('hidden');
    this.menuMain.classList.remove('hidden');
  }

  private pause(): void {
    if (this.state !== GameState.PLAYING) return;
    this.state = GameState.PAUSED;
    this.menuPause.classList.remove('hidden');
    this.inputManager.reset();
  }

  private resume(): void {
    if (this.state !== GameState.PAUSED) return;
    this.state = GameState.PLAYING;
    this.menuPause.classList.add('hidden');
    this.startTime = performance.now() - this.elapsedTime;
  }

  private restart(): void {
    this.hideAllMenus();
    this.startLevel();
  }

  private quitToMenu(): void {
    this.state = GameState.MENU;
    this.hideAllMenus();
    this.hud.classList.add('hidden');
    this.pauseBtn.classList.add('hidden');
    this.instructions.classList.add('hidden');
    this.inputManager.setJoystickVisible(false);
    this.menuMain.classList.remove('hidden');
    this.updateContinueButton();
    this.maze = null;
    this.player = null;
  }

  private showResults(): void {
    this.state = GameState.RESULTS;

    // Update results display
    document.getElementById('results-level')!.textContent = `Level ${this.currentLevel}`;

    const timeStr = this.formatTime(this.elapsedTime);
    document.getElementById('results-time')!.textContent = timeStr;
    document.getElementById('results-hits')!.textContent = String(this.wallHitCount);

    // Check for best time
    const isBest = this.storage.setBestTime(this.currentLevel, this.elapsedTime);
    const bestElement = document.getElementById('results-best')!;
    if (isBest) {
      bestElement.classList.remove('hidden');
      bestElement.classList.add('results-best');
    } else {
      bestElement.classList.add('hidden');
    }

    // Save progress
    this.storage.setCurrentLevel(this.currentLevel + 1);

    this.menuResults.classList.remove('hidden');
  }

  private nextLevel(): void {
    this.currentLevel++;
    this.startLevel();
  }

  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const millis = Math.floor((ms % 1000) / 10);
    return `${minutes}:${String(secs).padStart(2, '0')}.${String(millis).padStart(2, '0')}`;
  }

  private triggerVibration(): void {
    if (this.settings.vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(VIBRATION_DURATION);
    }
  }

  /** Main game loop */
  private gameLoop = (): void => {
    const now = performance.now();
    const dt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    // Update FPS counter
    this.debugOverlay.updateFps();

    if (this.state === GameState.PLAYING) {
      this.update(dt);
    }

    this.render();

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private update(dt: number): void {
    if (!this.player || !this.maze || !this.collision || !this.levelConfig) return;

    // Update elapsed time
    this.elapsedTime = performance.now() - this.startTime;

    // Update HUD timer
    if (this.settings.showTimer) {
      document.getElementById('hud-time')!.textContent = this.formatTime(this.elapsedTime);
    }

    // Get input
    this.inputManager.setPlayerPosition(
      this.player.state.x,
      this.player.state.y,
      this.canvasOffsetX,
      this.canvasOffsetY
    );
    const input = this.inputManager.getInput();

    // Update player position
    const oldX = this.player.state.x;
    const oldY = this.player.state.y;

    this.player.update(input.dx, input.dy, dt);

    // Check collision
    const result = this.collision.checkCollision(
      this.player.state,
      this.player.state.x,
      this.player.state.y
    );

    // Apply collision resolution
    this.player.setPosition(result.newX, result.newY);

    // Handle wall hit
    if (result.collided && (oldX !== result.newX || oldY !== result.newY)) {
      this.wallHitCount += result.hitCount;
      this.collisionFlashIntensity = 1;
      this.triggerVibration();

      this.debugOverlay.update({ hitCount: this.wallHitCount });
    }

    // Decay collision flash
    this.collisionFlashIntensity = Math.max(0, this.collisionFlashIntensity - dt * 5);

    // Update debug position
    this.debugOverlay.update({
      playerPos: `${Math.round(this.player.state.x)}, ${Math.round(this.player.state.y)}`,
    });

    // Check win condition
    if (this.collision.checkWin(this.player.state)) {
      setTimeout(() => this.showResults(), LEVEL_COMPLETE_DELAY);
      this.state = GameState.RESULTS; // Stop updates while showing results
    }
  }

  private render(): void {
    const ctx = this.ctx;

    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw maze from offscreen buffer
    if (this.maze) {
      ctx.drawImage(
        this.mazeRenderer.getCanvas(),
        this.canvasOffsetX,
        this.canvasOffsetY
      );
    }

    // Draw player
    if (this.player && this.state !== GameState.MENU) {
      // Draw collision flash
      if (this.collisionFlashIntensity > 0) {
        this.playerRenderer.renderCollisionFlash(
          ctx,
          this.player.state,
          this.canvasOffsetX,
          this.canvasOffsetY,
          this.collisionFlashIntensity
        );
      }

      // Draw player
      this.playerRenderer.render(
        ctx,
        this.player.state,
        this.canvasOffsetX,
        this.canvasOffsetY
      );
    }
  }

  /** Clean up resources */
  destroy(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.inputManager.destroy();
  }
}
