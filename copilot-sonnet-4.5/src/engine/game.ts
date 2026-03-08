// Main game class orchestrating all systems

import type { Maze, Player, GameState as GameStateType, InputState, LevelStats, Settings } from '../types';
import { GameState } from '../types';
import { generateMaze } from '../maze/generator';
import { validateMaze } from '../maze/validator';
import { getLevelConfig } from '../maze/difficulty';
import { createSeed } from '../utils/rng';
import { createPlayer, updatePlayer } from './player';
import { checkGoalReached } from './collision';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameStateType = GameState.MENU;
  private maze: Maze | null = null;
  private player: Player | null = null;
  private currentLevel: number = 1;
  private levelStartTime: number = 0;
  private elapsedTime: number = 0;
  private collisionCount: number = 0;
  private lastCollisionTime: number = 0;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  
  public input: InputState = {
    mouse: { x: 0, y: 0, isDown: false },
    keyboard: { up: false, down: false, left: false, right: false },
    touch: { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 },
  };

  public settings: Settings = {
    soundEnabled: true,
    vibrationEnabled: true,
    controlMode: 'auto',
    debugMode: false,
  };

  private onStateChange?: (state: GameStateType) => void;
  private onStatsUpdate?: (stats: Partial<LevelStats>) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private resizeCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
  }

  public setCallbacks(
    onStateChange: (state: GameStateType) => void,
    onStatsUpdate: (stats: Partial<LevelStats>) => void
  ): void {
    this.onStateChange = onStateChange;
    this.onStatsUpdate = onStatsUpdate;
  }

  public startLevel(level: number): void {
    this.currentLevel = level;
    const config = getLevelConfig(level);
    const seed = createSeed(level);
    
    this.maze = generateMaze(config, seed);
    const validation = validateMaze(this.maze);
    
    if (!validation.isConnected) {
      console.error('Generated maze is not connected!');
    }
    
    this.player = createPlayer(this.maze.start, this.maze.cellSize);
    this.levelStartTime = performance.now();
    this.elapsedTime = 0;
    this.collisionCount = 0;
    this.lastCollisionTime = 0;
    
    this.setState(GameState.PLAYING);
    this.startGameLoop();
  }

  public pause(): void {
    if (this.state === GameState.PLAYING) {
      this.setState(GameState.PAUSED);
    }
  }

  public resume(): void {
    if (this.state === GameState.PAUSED) {
      this.setState(GameState.PLAYING);
      this.lastFrameTime = performance.now();
    }
  }

  public restart(): void {
    this.startLevel(this.currentLevel);
  }

  public nextLevel(): void {
    this.startLevel(this.currentLevel + 1);
  }

  public returnToMenu(): void {
    this.setState(GameState.MENU);
    this.stopGameLoop();
  }

  private setState(newState: GameStateType): void {
    this.state = newState;
    if (this.onStateChange) {
      this.onStateChange(newState);
    }
  }

  private startGameLoop(): void {
    this.resizeCanvas();
    if (this.animationFrameId === null) {
      this.lastFrameTime = performance.now();
      this.gameLoop();
    }
  }

  private stopGameLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private gameLoop = (): void => {
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    if (this.state === GameState.PLAYING) {
      this.update(deltaTime);
      this.render();
    } else if (this.state === GameState.PAUSED || this.state === GameState.LEVEL_COMPLETE) {
      // Still render but don't update
      this.render();
    }
  };

  private update(deltaTime: number): void {
    if (!this.player || !this.maze) return;

    // Update elapsed time
    this.elapsedTime = performance.now() - this.levelStartTime;
    
    // Update player
    const result = updatePlayer(this.player, this.input, this.maze, deltaTime, this.settings.controlMode);
    this.player = result.player;
    
    // Handle collision
    if (result.collided && performance.now() - this.lastCollisionTime > 200) {
      this.collisionCount++;
      this.lastCollisionTime = performance.now();
      this.onCollision();
    }

    // Check if goal reached
    if (checkGoalReached(this.player, this.maze.end)) {
      this.onLevelComplete();
    }

    // Update stats
    if (this.onStatsUpdate) {
      this.onStatsUpdate({
        level: this.currentLevel,
        time: this.elapsedTime,
        collisions: this.collisionCount,
        completed: false,
      });
    }
  }

  private render(): void {
    if (!this.maze || !this.player) return;

    const rect = this.canvas.getBoundingClientRect();
    const ctx = this.ctx;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Calculate scale and offset to center maze
    const mazeWidth = this.maze.width * this.maze.cellSize;
    const mazeHeight = this.maze.height * this.maze.cellSize;
    const scale = Math.min(rect.width / mazeWidth, rect.height / mazeHeight) * 0.9;
    const offsetX = (rect.width - mazeWidth * scale) / 2;
    const offsetY = (rect.height - mazeHeight * scale) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Draw maze
    this.renderMaze(ctx);

    // Draw start and end
    this.renderGoals(ctx);

    // Draw player
    this.renderPlayer(ctx);

    ctx.restore();
  }

  private renderMaze(ctx: CanvasRenderingContext2D): void {
    if (!this.maze) return;

    ctx.strokeStyle = '#0f3460';
    ctx.lineWidth = this.maze.wallThickness;
    ctx.lineCap = 'square';

    for (let row = 0; row < this.maze.height; row++) {
      for (let col = 0; col < this.maze.width; col++) {
        const cell = this.maze.cells[row][col];
        const x = col * this.maze.cellSize;
        const y = row * this.maze.cellSize;

        ctx.beginPath();
        if (cell.walls.top) {
          ctx.moveTo(x, y);
          ctx.lineTo(x + this.maze.cellSize, y);
        }
        if (cell.walls.right) {
          ctx.moveTo(x + this.maze.cellSize, y);
          ctx.lineTo(x + this.maze.cellSize, y + this.maze.cellSize);
        }
        if (cell.walls.bottom) {
          ctx.moveTo(x, y + this.maze.cellSize);
          ctx.lineTo(x + this.maze.cellSize, y + this.maze.cellSize);
        }
        if (cell.walls.left) {
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + this.maze.cellSize);
        }
        ctx.stroke();
      }
    }
  }

  private renderGoals(ctx: CanvasRenderingContext2D): void {
    if (!this.maze) return;

    // Start (green)
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(this.maze.start.x, this.maze.start.y, this.maze.cellSize * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // End (orange)
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(this.maze.end.x, this.maze.end.y, this.maze.cellSize * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderPlayer(ctx: CanvasRenderingContext2D): void {
    if (!this.player) return;

    ctx.fillStyle = '#e94560';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#e94560';
    ctx.beginPath();
    ctx.arc(this.player.position.x, this.player.position.y, this.player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private onCollision(): void {
    if (this.settings.soundEnabled) {
      this.playSound(200, 0.05);
    }
    if (this.settings.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }

  private onLevelComplete(): void {
    this.setState(GameState.LEVEL_COMPLETE);
    
    if (this.onStatsUpdate) {
      this.onStatsUpdate({
        level: this.currentLevel,
        time: this.elapsedTime,
        collisions: this.collisionCount,
        completed: true,
      });
    }

    if (this.settings.soundEnabled) {
      this.playSound(523.25, 0.2);
    }
    if (this.settings.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate([50, 50, 100]);
    }
  }

  private playSound(frequency: number, duration: number): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
      console.warn('Audio not supported:', e);
    }
  }

  public getCurrentLevel(): number {
    return this.currentLevel;
  }

  public getState(): GameStateType {
    return this.state;
  }
}
