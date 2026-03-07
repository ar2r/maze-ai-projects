import { generateMaze, Maze } from './maze';
import { createPlayer, updatePlayer, checkLevelComplete, Player, Vector2 } from './engine';
import { saveGame, loadGame, clearSave, getBestLevel, setBestLevel, SavedGame } from './storage';
import { InputManager, UIManager } from './ui';

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private wallCanvas: HTMLCanvasElement;
  private wallCtx: CanvasRenderingContext2D;

  private maze: Maze | null = null;
  private player: Player | null = null;
  private cellSize = 0;
  private offsetX = 0;
  private offsetY = 0;

  private normalizedX = 0.5;
  private normalizedY = 0.5;

  private level = 1;
  private startTime = 0;
  private elapsedTime = 0;
  private isRunning = false;
  private animationId: number | null = null;

  private uiManager: UIManager;
  private input: Vector2 = { x: 0, y: 0 };

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    this.wallCanvas = document.createElement('canvas');
    this.wallCtx = this.wallCanvas.getContext('2d')!;

    new InputManager((input) => {
      this.input = input;
    });

    this.setupMouseControl();

    this.uiManager = new UIManager();

    this.setupUI();
    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.loadBestLevel();
    this.checkSavedGame();
  }

  private setupMouseControl(): void {
    let isMouseDown = false;

    const updateInputFromMouse = (clientX: number, clientY: number) => {
      if (!this.player) return;
      
      const dx = clientX - this.player.x;
      const dy = clientY - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 5) {
        this.input = {
          x: dx / dist,
          y: dy / dist
        };
      } else {
        this.input = { x: 0, y: 0 };
      }
    };

    this.canvas.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      this.input = { x: 0, y: 0 };
      if (this.player) {
        updateInputFromMouse(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (isMouseDown && this.player) {
        updateInputFromMouse(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mouseup', () => {
      isMouseDown = false;
      this.input = { x: 0, y: 0 };
    });

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isMouseDown = true;
      this.input = { x: 0, y: 0 };
      if (this.player && e.touches[0]) {
        updateInputFromMouse(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (isMouseDown && this.player && e.touches[0]) {
        updateInputFromMouse(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => {
      isMouseDown = false;
      this.input = { x: 0, y: 0 };
    });
  }

  private setupUI(): void {
    document.getElementById('start-btn')?.addEventListener('click', () => {
      this.startNewGame(1);
    });

    document.getElementById('continue-btn')?.addEventListener('click', () => {
      this.continueGame();
    });

    document.getElementById('next-level-btn')?.addEventListener('click', () => {
      this.startNewGame(this.level + 1);
    });

    document.getElementById('restart-btn')?.addEventListener('click', () => {
      this.startNewGame(1);
    });
  }

  private loadBestLevel(): void {
    const best = getBestLevel();
    this.uiManager.setBestLevel(best);
  }

  private checkSavedGame(): void {
    const saved = loadGame();
    this.uiManager.setContinueVisible(saved !== null);
  }

  private resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.wallCanvas.width = width;
    this.wallCanvas.height = height;

    if (this.maze) {
      this.calculateCellSize(width, height);
      this.updatePlayerPositionFromNormalized();
      this.renderWalls();
    }
  }

  private calculateCellSize(width: number, height: number): void {
    if (!this.maze) return;

    const padding = 20;
    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2;

    const cellW = availableWidth / this.maze.width;
    const cellH = availableHeight / this.maze.height;
    this.cellSize = Math.min(cellW, cellH);

    const mazeWidth = this.maze.width * this.cellSize;
    const mazeHeight = this.maze.height * this.cellSize;

    this.offsetX = (width - mazeWidth) / 2;
    this.offsetY = (height - mazeHeight) / 2;
  }

  private updatePlayerPositionFromNormalized(): void {
    if (!this.player || !this.maze) return;

    const mazeWidth = this.maze.width * this.cellSize;
    const mazeHeight = this.maze.height * this.cellSize;

    this.player.x = this.offsetX + this.normalizedX * mazeWidth;
    this.player.y = this.offsetY + this.normalizedY * mazeHeight;
  }

  private updateNormalizedFromPlayer(): void {
    if (!this.player || !this.maze) return;

    const mazeWidth = this.maze.width * this.cellSize;
    const mazeHeight = this.maze.height * this.cellSize;

    this.normalizedX = (this.player.x - this.offsetX) / mazeWidth;
    this.normalizedY = (this.player.y - this.offsetY) / mazeHeight;
  }

  private startNewGame(level: number): void {
    clearSave();
    this.level = level;
    this.normalizedX = 0.5;
    this.normalizedY = 0.5;
    this.initLevel();
  }

  private continueGame(): void {
    const saved = loadGame();
    if (saved) {
      this.level = saved.level;
      this.normalizedX = 0.5;
      this.normalizedY = 0.5;
      this.initLevel();
    }
  }

  private initLevel(): void {
    this.maze = generateMaze(this.level);
    this.calculateCellSize(window.innerWidth, window.innerHeight);

    this.player = createPlayer(this.cellSize);

    const startX = this.maze.startCell.x * this.cellSize + this.cellSize / 2 + this.offsetX;
    const startY = this.maze.startCell.y * this.cellSize + this.cellSize / 2 + this.offsetY;

    this.player.x = startX;
    this.player.y = startY;

    this.normalizedX = (startX - this.offsetX) / (this.maze.width * this.cellSize);
    this.normalizedY = (startY - this.offsetY) / (this.maze.height * this.cellSize);

    this.startTime = Date.now();
    this.elapsedTime = 0;
    this.isRunning = true;

    this.renderWalls();
    this.uiManager.showScreen('game-ui');
    this.uiManager.updateElement('level-num', this.level.toString());

    this.gameLoop();
  }

  private renderWalls(): void {
    if (!this.maze) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.wallCtx.fillStyle = '#0a0a0f';
    this.wallCtx.fillRect(0, 0, width, height);

    this.wallCtx.strokeStyle = '#00d4aa';
    this.wallCtx.lineWidth = 3;
    this.wallCtx.lineCap = 'round';

    for (let y = 0; y < this.maze.height; y++) {
      for (let x = 0; x < this.maze.width; x++) {
        const cell = this.maze.cells[y][x];
        const cx = x * this.cellSize + this.offsetX;
        const cy = y * this.cellSize + this.offsetY;

        if (cell.walls.top) {
          this.wallCtx.beginPath();
          this.wallCtx.moveTo(cx, cy);
          this.wallCtx.lineTo(cx + this.cellSize, cy);
          this.wallCtx.stroke();
        }

        if (cell.walls.left) {
          this.wallCtx.beginPath();
          this.wallCtx.moveTo(cx, cy);
          this.wallCtx.lineTo(cx, cy + this.cellSize);
          this.wallCtx.stroke();
        }

        if (x === this.maze.width - 1 && cell.walls.right) {
          this.wallCtx.beginPath();
          this.wallCtx.moveTo(cx + this.cellSize, cy);
          this.wallCtx.lineTo(cx + this.cellSize, cy + this.cellSize);
          this.wallCtx.stroke();
        }

        if (y === this.maze.height - 1 && cell.walls.bottom) {
          this.wallCtx.beginPath();
          this.wallCtx.moveTo(cx, cy + this.cellSize);
          this.wallCtx.lineTo(cx + this.cellSize, cy + this.cellSize);
          this.wallCtx.stroke();
        }
      }
    }

    this.renderGoal();
  }

  private renderGoal(): void {
    if (!this.maze) return;

    const endX = this.maze.endCell.x * this.cellSize + this.cellSize / 2 + this.offsetX;
    const endY = this.maze.endCell.y * this.cellSize + this.cellSize / 2 + this.offsetY;

    const gradient = this.wallCtx.createRadialGradient(endX, endY, 0, endX, endY, this.cellSize * 0.4);
    gradient.addColorStop(0, 'rgba(255, 200, 0, 0.6)');
    gradient.addColorStop(1, 'rgba(255, 200, 0, 0)');

    this.wallCtx.fillStyle = gradient;
    this.wallCtx.beginPath();
    this.wallCtx.arc(endX, endY, this.cellSize * 0.4, 0, Math.PI * 2);
    this.wallCtx.fill();
  }

  private gameLoop(): void {
    if (!this.isRunning || !this.player || !this.maze) return;

    this.update();
    this.render();
    this.saveCurrentState();

    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  private update(): void {
    if (!this.player || !this.maze) return;

    this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
    this.uiManager.updateElement('timer', this.elapsedTime.toString());

    updatePlayer(this.player, this.input, this.maze, this.cellSize, this.offsetX, this.offsetY);

    this.updateNormalizedFromPlayer();

    if (checkLevelComplete(this.player, this.maze, this.cellSize, this.offsetX, this.offsetY)) {
      this.levelComplete();
    }
  }

  private render(): void {
    if (!this.player) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.ctx.drawImage(this.wallCanvas, 0, 0, width, height);

    this.ctx.fillStyle = '#00d4aa';
    this.ctx.shadowColor = '#00d4aa';
    this.ctx.shadowBlur = 15;
    this.ctx.beginPath();
    this.ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }

  private saveCurrentState(): void {
    if (!this.player) return;

    const state: SavedGame = {
      level: this.level,
      playerX: this.normalizedX,
      playerY: this.normalizedY,
      timestamp: Date.now()
    };
    saveGame(state);
  }

  private levelComplete(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    setBestLevel(this.level);
    this.uiManager.setBestLevel(this.level + 1);

    this.uiManager.updateElement('completion-time', this.elapsedTime.toString());
    this.uiManager.showScreen('level-complete');
  }

  showMainMenu(): void {
    this.uiManager.showScreen('main-menu');
    this.loadBestLevel();
    this.checkSavedGame();
  }
}

new Game();
