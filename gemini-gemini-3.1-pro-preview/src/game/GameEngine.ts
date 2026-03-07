import { Maze, Wall } from './MazeGenerator';
import { InputHandler } from './InputHandler';
import { clamp } from './Utils';

export interface GameSettings {
  level: number;
  seed: number;
  width: number;
  height: number;
  cellSize: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  
  private maze!: Maze;
  private input: InputHandler;
  private settings!: GameSettings;

  private playerPos = { x: 0, y: 0 };
  private playerRadius = 0;
  private playerRotation = 0; // Current rotation in radians
  private speed = 5;

  private collisions = 0;
  private startTime = 0;
  private isPaused = true;
  private isFinished = false;

  private onWin: (time: number, collisions: number) => void;

  constructor(canvas: HTMLCanvasElement, onWin: (time: number, collisions: number) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
    this.input = new InputHandler();
    this.onWin = onWin;

    // Initial resize to set up canvas dimensions
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  public initLevel(level: number) {
    const baseSize = 8; // Slightly smaller base for better visibility
    const size = baseSize + Math.floor(level / 2);
    this.settings = {
      level,
      seed: level + Date.now(),
      width: size,
      height: size,
      cellSize: 0
    };

    this.maze = new Maze(this.settings.width, this.settings.height, this.settings.seed);
    this.resize();
    
    this.playerPos = { 
        x: this.settings.cellSize / 2, 
        y: this.settings.cellSize / 2 
    };
    this.playerRadius = this.settings.cellSize * 0.3;
    this.collisions = 0;
    this.startTime = performance.now();
    this.isFinished = false;
    this.isPaused = false;

    this.renderMazeToOffscreen();
  }

  private resize() {
    const dpr = window.devicePixelRatio || 1;
    // Ensure we have a valid size even if window is small
    const size = Math.max(280, Math.min(window.innerWidth, window.innerHeight) * 0.9);
    
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    
    // Reset context state after size change
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    if (this.settings) {
      this.settings.cellSize = size / Math.max(this.settings.width, this.settings.height);
      this.playerRadius = this.settings.cellSize * 0.3;
      this.offscreenCanvas.width = this.canvas.width;
      this.offscreenCanvas.height = this.canvas.height;
      this.offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);
      this.offscreenCtx.scale(dpr, dpr);
      this.renderMazeToOffscreen();
    }
  }

  private renderMazeToOffscreen() {
    if (!this.maze || !this.settings) return;
    const { width, height, cellSize } = this.settings;
    const ctx = this.offscreenCtx;

    ctx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    
    // Background "Grass/Dirt" texture
    ctx.fillStyle = '#1b2417'; 
    ctx.fillRect(0, 0, width * cellSize, height * cellSize);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = this.maze.grid[y][x];
        const px = x * cellSize;
        const py = y * cellSize;

        // Draw Walls as 3D stone blocks
        ctx.strokeStyle = '#5a5a5a'; // Top light
        ctx.fillStyle = '#3a3a3a';   // Main stone
        const w = Math.max(4, cellSize * 0.15);

        if (cell.walls & Wall.TOP) {
            ctx.fillRect(px, py, cellSize, w);
            ctx.strokeRect(px, py, cellSize, w);
        }
        if (cell.walls & Wall.RIGHT) {
            ctx.fillRect(px + cellSize - w, py, w, cellSize);
            ctx.strokeRect(px + cellSize - w, py, w, cellSize);
        }
        if (cell.walls & Wall.BOTTOM) {
            ctx.fillRect(px, py + cellSize - w, cellSize, w);
            ctx.strokeRect(px, py + cellSize - w, cellSize, w);
        }
        if (cell.walls & Wall.LEFT) {
            ctx.fillRect(px, py, w, cellSize);
            ctx.strokeRect(px, py, w, cellSize);
        }
      }
    }

    // Start/Finish markers (Heroes style)
    // Start: Blue flag area
    ctx.fillStyle = 'rgba(0, 100, 255, 0.3)';
    ctx.fillRect(4, 4, cellSize - 8, cellSize - 8);
    
    // Finish: Gold Castle area
    const fx = (width - 1) * cellSize;
    const fy = (height - 1) * cellSize;
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(fx + cellSize*0.2, fy + cellSize*0.2, cellSize*0.6, cellSize*0.6);
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 2;
    ctx.strokeRect(fx + cellSize*0.2, fy + cellSize*0.2, cellSize*0.6, cellSize*0.6);
    // Tiny "towers"
    ctx.fillRect(fx + cellSize*0.1, fy + cellSize*0.1, cellSize*0.2, cellSize*0.3);
    ctx.fillRect(fx + cellSize*0.7, fy + cellSize*0.1, cellSize*0.2, cellSize*0.3);
  }

  public update() {
    if (this.isPaused || this.isFinished || !this.settings) return;

    this.input.update();

    let moveX = this.input.state.dx * this.speed;
    let moveY = this.input.state.dy * this.speed;

    // Follow pointer if dragging
    if (this.input.state.isDragging) {
        const rect = this.canvas.getBoundingClientRect();
        const targetX = this.input.state.pointerPos.x - rect.left;
        const targetY = this.input.state.pointerPos.y - rect.top;
        
        const dx = targetX - this.playerPos.x;
        const dy = targetY - this.playerPos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 5) {
            moveX = (dx / dist) * this.speed;
            moveY = (dy / dist) * this.speed;
        }
    }

    this.movePlayer(moveX, moveY);
    
    // Update rotation if moving
    if (Math.abs(moveX) > 0.1 || Math.abs(moveY) > 0.1) {
        this.playerRotation = Math.atan2(moveY, moveX);
    }

    this.checkWin();
  }

  private movePlayer(dx: number, dy: number) {
    const nextX = this.playerPos.x + dx;
    const nextY = this.playerPos.y + dy;
    
    // Collision detection (simplified circle-wall)
    // We check 4 points around the player
    if (!this.checkCollision(nextX, this.playerPos.y)) {
        this.playerPos.x = nextX;
    } else {
        this.onCollision();
    }

    if (!this.checkCollision(this.playerPos.x, nextY)) {
        this.playerPos.y = nextY;
    } else {
        this.onCollision();
    }
    
    // Boundary clamp
    const limit = this.settings.width * this.settings.cellSize;
    this.playerPos.x = clamp(this.playerPos.x, this.playerRadius, limit - this.playerRadius);
    this.playerPos.y = clamp(this.playerPos.y, this.playerRadius, limit - this.playerRadius);
  }

  private checkCollision(px: number, py: number): boolean {
    const { cellSize, width, height } = this.settings;
    const r = this.playerRadius;
    const buffer = 1; // Minimal distance to keep from walls

    // Determine which cell the center is in
    const gx = Math.floor(px / cellSize);
    const gy = Math.floor(py / cellSize);

    // Out of bounds is a collision
    if (gx < 0 || gy < 0 || gx >= width || gy >= height) return true;

    const cell = this.maze.grid[gy][gx];
    
    // Exact wall positions
    const leftW = gx * cellSize;
    const rightW = (gx + 1) * cellSize;
    const topW = gy * cellSize;
    const botW = (gy + 1) * cellSize;

    // Check collision with each wall of the current cell
    if ((cell.walls & Wall.LEFT) && px - r < leftW + buffer) return true;
    if ((cell.walls & Wall.RIGHT) && px + r > rightW - buffer) return true;
    if ((cell.walls & Wall.TOP) && py - r < topW + buffer) return true;
    if ((cell.walls & Wall.BOTTOM) && py + r > botW - buffer) return true;

    // Additional check: if we are near an edge and there is no wall, 
    // we still need to check if the NEXT cell has a wall that might block our radius.
    // (e.g. corner cases)
    const checkRadius = r + buffer;
    
    // Check neighbors if near boundaries
    if (px - checkRadius < leftW && gx > 0) {
        const neighbor = this.maze.grid[gy][gx - 1];
        if ((neighbor.walls & Wall.TOP) && py - r < topW + buffer) return true;
        if ((neighbor.walls & Wall.BOTTOM) && py + r > botW - buffer) return true;
    }
    if (px + checkRadius > rightW && gx < width - 1) {
        const neighbor = this.maze.grid[gy][gx + 1];
        if ((neighbor.walls & Wall.TOP) && py - r < topW + buffer) return true;
        if ((neighbor.walls & Wall.BOTTOM) && py + r > botW - buffer) return true;
    }

    return false;
  }

  private onCollision() {
    this.collisions++;
    if ('vibrate' in navigator) {
        navigator.vibrate(10);
    }
  }

  private checkWin() {
    const { width, height, cellSize } = this.settings;
    const targetX = (width - 0.5) * cellSize;
    const targetY = (height - 0.5) * cellSize;

    const dx = this.playerPos.x - targetX;
    const dy = this.playerPos.y - targetY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < cellSize * 0.4) {
      this.isFinished = true;
      const endTime = performance.now();
      this.onWin((endTime - this.startTime) / 1000, this.collisions);
    }
  }

  public render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (!this.settings) return;

    const dpr = window.devicePixelRatio || 1;
    this.ctx.drawImage(this.offscreenCanvas, 0, 0, this.canvas.width / dpr, this.canvas.height / dpr);

    // Draw player as an animated Pacman
    const { x, y } = this.playerPos;
    const r = this.playerRadius;
    
    this.ctx.save();
    this.ctx.translate(x, y);
    
    this.ctx.rotate(this.playerRotation);

    // Mouth animation based on time
    const mouthOpen = (Math.sin(performance.now() * 0.015) + 1) / 2; // 0 to 1
    const mouthAngle = 0.2 * Math.PI * mouthOpen;

    this.ctx.fillStyle = '#ff0';
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.arc(0, 0, r, mouthAngle, 2 * Math.PI - mouthAngle);
    this.ctx.fill();
    
    this.ctx.restore();

    if (document.getElementById('debug-overlay')?.style.display !== 'none') {
        this.renderDebug();
    }
  }

  private renderDebug() {
    const debug = document.getElementById('debug-overlay')!;
    debug.innerText = `
        Level: ${this.settings.level}
        Pos: ${Math.round(this.playerPos.x)}, ${Math.round(this.playerPos.y)}
        Collisions: ${this.collisions}
        Time: ${((performance.now() - this.startTime) / 1000).toFixed(1)}s
    `;
  }

  public setPaused(p: boolean) { this.isPaused = p; }
}
