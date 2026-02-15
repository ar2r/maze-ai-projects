import { Maze } from './MazeGenerator';
import { PhysicsEngine } from './PhysicsEngine'; // Fixed import path
import { Renderer } from './Renderer';
import { InputManager } from './InputManager';
import { Vec2 } from '../utils/math';

export class Game {
  private worldCanvas: HTMLCanvasElement;
  private entityCanvas: HTMLCanvasElement;
  // private ctx: CanvasRenderingContext2D; // Removed unused

  private maze!: Maze;
  private physics!: PhysicsEngine;
  private renderer!: Renderer;
  private input!: InputManager;

  private isRunning: boolean = false;
  private lastTime: number = 0;
  private lastVibrate: number = 0;

  // Game State
  // private level: number = 1; // Removed unused
  private timeElapsed: number = 0;
  private playerPos: Vec2 = { x: 0, y: 0 };
  private velocity: Vec2 = { x: 0, y: 0 };
  private offset: Vec2 = { x: 0, y: 0 };
  private playerRadius: number = 8;
  private cellSize: number = 40;
  private wallThickness: number = 4;
  
  public hapticsEnabled: boolean = true;

  private onLevelComplete: (time: number, collisions: number) => void;
  private onDebugUpdate: (info: string) => void;

  constructor(
    worldCanvas: HTMLCanvasElement, 
    entityCanvas: HTMLCanvasElement,
    onLevelComplete: (time: number, collisions: number) => void,
    onDebugUpdate: (info: string) => void
  ) {
    this.worldCanvas = worldCanvas;
    this.entityCanvas = entityCanvas;
    this.onLevelComplete = onLevelComplete;
    this.onDebugUpdate = onDebugUpdate;
    // this.ctx = entityCanvas.getContext('2d')!;

    this.input = new InputManager(entityCanvas); // Listen on top layer
    this.renderer = new Renderer(worldCanvas, entityCanvas, this.cellSize, this.wallThickness);
    
    // Initial resize to fit screen
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  public startLevel(level: number) {
    // this.level = level;
    this.timeElapsed = 0;
    
    // Calculate difficulty
    // Level 1: 10x10. Level 10: 30x30?
    // Let's scale gently.
    const width = Math.min(50, 5 + Math.floor(level * 1.5));
    const height = Math.min(50, 5 + Math.floor(level * 1.5));
    
    // Fit cell size to screen?
    // Actually, fixed cell size is easier, but then maze might be too big for screen.
    // Or too small.
    // Better: Calculate cell size to fit screen, but max out at some reasonable pixel value.
    const screenW = this.worldCanvas.clientWidth;
    const screenH = this.worldCanvas.clientHeight;
    
    this.cellSize = Math.min(40, Math.floor(Math.min(screenW / width, screenH / height)));
    // Minimum cell size for touchability
    this.cellSize = Math.max(20, this.cellSize);

    // Re-calc maze dimensions if cell size constrained
    // Actually, let's keep the grid size fixed based on level and scroll/pan if needed?
    // Requirement says "Adaptive layout".
    // For simplicity: Fit maze to screen always.
    
    // const cols = Math.floor(screenW / this.cellSize);
    // const rows = Math.floor(screenH / this.cellSize);
    
    let mazeW = 5 + level * 2;
    let mazeH = 5 + level * 2;
    
    // Recalculate cell size to fit
    this.cellSize = Math.floor(Math.min(screenW / mazeW, screenH / mazeH));
    
    // Calculate centering offset
    const totalW = mazeW * this.cellSize;
    const totalH = mazeH * this.cellSize;
    this.offset = {
        x: Math.floor((screenW - totalW) / 2),
        y: Math.floor((screenH - totalH) / 2)
    };

    this.wallThickness = Math.max(2, Math.floor(this.cellSize * 0.1));
    this.playerRadius = Math.floor(this.cellSize * 0.2); // Smaller radius

    this.maze = new Maze(mazeW, mazeH, level + Date.now()); // Seed = level + time
    
    // Reset velocity
    this.velocity = { x: 0, y: 0 };
    
    // Init Physics
    this.physics = new PhysicsEngine(this.maze, this.cellSize, this.wallThickness); // Fixed class name
    this.renderer = new Renderer(this.worldCanvas, this.entityCanvas, this.cellSize, this.wallThickness); // Re-init renderer with new sizes

    // Player Start
    this.playerPos = {
        x: this.maze.start.x * this.cellSize + this.cellSize / 2,
        y: this.maze.start.y * this.cellSize + this.cellSize / 2
    };

    // Draw static world
    this.renderer.drawMaze(this.maze, this.offset);
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  private handleResize() {
    this.renderer.resizeCanvas(this.worldCanvas);
    this.renderer.resizeCanvas(this.entityCanvas);
    
    // Recalc offset on resize
    if (this.maze) {
        const screenW = this.worldCanvas.clientWidth;
        const screenH = this.worldCanvas.clientHeight;
        const totalW = this.maze.width * this.cellSize;
        const totalH = this.maze.height * this.cellSize;
        this.offset = {
            x: Math.floor((screenW - totalW) / 2),
            y: Math.floor((screenH - totalH) / 2)
        };
        this.renderer.drawMaze(this.maze, this.offset);
    }
  }

  private loop() {
    if (!this.isRunning) return;

    const now = performance.now();
    const dt = (now - this.lastTime) / 1000; // seconds
    this.lastTime = now;

    this.update(dt);
    this.draw();

    requestAnimationFrame(() => this.loop());
  }

  private update(dt: number) {
    this.timeElapsed += dt;

    // Movement Parameters
    const MAX_SPEED = 600;
    const ACCEL = 3000;
    const DRAG = 8.0;

    // Input -> Acceleration
    let ax = 0;
    let ay = 0;

    if (this.input.isDown) {
        // Vector from player to pointer
        // Adjust pointer for offset
        const targetX = this.input.pointerPos.x - this.offset.x;
        const targetY = this.input.pointerPos.y - this.offset.y;

        const dx = targetX - this.playerPos.x;
        const dy = targetY - this.playerPos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 10) { // Deadzone
            const nx = dx / dist;
            const ny = dy / dist;
            ax = nx * ACCEL;
            ay = ny * ACCEL;
        }
    }

    // Update Velocity
    this.velocity.x += ax * dt;
    this.velocity.y += ay * dt;

    // Apply Drag (Friction)
    this.velocity.x -= this.velocity.x * DRAG * dt;
    this.velocity.y -= this.velocity.y * DRAG * dt;

    // Cap Speed
    const speedSq = this.velocity.x**2 + this.velocity.y**2;
    if (speedSq > MAX_SPEED**2) {
        const speed = Math.sqrt(speedSq);
        this.velocity.x = (this.velocity.x / speed) * MAX_SPEED;
        this.velocity.y = (this.velocity.y / speed) * MAX_SPEED;
    }

    // Apply movement
    const nextPos = { 
        x: this.playerPos.x + this.velocity.x * dt, 
        y: this.playerPos.y + this.velocity.y * dt 
    };
    
    // Physics / Collision
    this.playerPos = this.physics.resolveCollision(nextPos, this.playerRadius);

    // Collision Response (Kill velocity on impact)
    // If we were stopped by a wall, dampen velocity component
    if (Math.abs(this.playerPos.x - nextPos.x) > 0.01) this.velocity.x *= 0.5;
    if (Math.abs(this.playerPos.y - nextPos.y) > 0.01) this.velocity.y *= 0.5;
    
    // Haptics
    if (this.hapticsEnabled && (Math.abs(nextPos.x - this.playerPos.x) > 0.1 || Math.abs(nextPos.y - this.playerPos.y) > 0.1)) {
        const now = performance.now();
        // Debounce vibration
        // if (now - this.lastTime > 0.1) { 
           // Need separate debounce
           if (!this.lastVibrate || now - this.lastVibrate > 200) {
               if (navigator.vibrate) navigator.vibrate(10);
               this.lastVibrate = now;
           }
        // }
    }
    
    // Check Win Condition
    this.checkWin();

    // Debug Info
    this.onDebugUpdate(`FPS: ${Math.floor(1/dt)} | Time: ${this.timeElapsed.toFixed(1)}`);
  }

  private checkWin() {
    const endCellX = this.maze.end.x;
    const endCellY = this.maze.end.y;
    
    const pCx = Math.floor(this.playerPos.x / this.cellSize);
    const pCy = Math.floor(this.playerPos.y / this.cellSize);

    if (pCx === endCellX && pCy === endCellY) {
        this.isRunning = false;
        this.onLevelComplete(this.timeElapsed, 0); // Collisions not tracked yet
    }
  }

  private draw() {
    this.renderer.clearEntities();
    this.renderer.drawPlayer(this.playerPos, this.playerRadius, this.offset);
  }
}
