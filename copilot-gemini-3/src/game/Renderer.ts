import { Maze, Direction } from './MazeGenerator';
import { Vec2 } from '../utils/math';

export class Renderer {
  private worldCtx: CanvasRenderingContext2D;
  private entityCtx: CanvasRenderingContext2D;
  private cellSize: number;
  private wallThickness: number;
  private dpr: number = 1;

  constructor(
    worldCanvas: HTMLCanvasElement, 
    entityCanvas: HTMLCanvasElement, 
    cellSize: number, 
    wallThickness: number
  ) {
    this.worldCtx = worldCanvas.getContext('2d', { alpha: false })!;
    this.entityCtx = entityCanvas.getContext('2d', { alpha: true })!;
    this.cellSize = cellSize;
    this.wallThickness = wallThickness;

    this.resizeCanvas(worldCanvas);
    this.resizeCanvas(entityCanvas);
  }

  public resizeCanvas(canvas: HTMLCanvasElement) {
    this.dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * this.dpr;
    canvas.height = rect.height * this.dpr;
    
    const ctx = canvas.getContext('2d')!;
    ctx.scale(this.dpr, this.dpr);
  }

  public drawMaze(maze: Maze, offset: Vec2) {
    const ctx = this.worldCtx;
    const cs = this.cellSize;
    const wt = this.wallThickness;
    // const width = maze.width * cs;
    // const height = maze.height * cs;

    // Clear background & Reset Transform
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Apply Scaling and Offset
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.translate(offset.x, offset.y);

    ctx.fillStyle = '#666'; // Wall color

    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const cell = maze.grid[y][x];
        const cx = x * cs;
        const cy = y * cs;

        // Draw walls
        if (cell.walls & Direction.N) {
          ctx.fillRect(cx, cy, cs, wt);
        }
        if (cell.walls & Direction.S) {
          ctx.fillRect(cx, cy + cs - wt, cs, wt);
        }
        if (cell.walls & Direction.W) {
          ctx.fillRect(cx, cy, wt, cs);
        }
        if (cell.walls & Direction.E) {
          ctx.fillRect(cx + cs - wt, cy, wt, cs);
        }
        
        // Fill corners to avoid gaps?
        // Actually, overlapping rects cover corners fine.
      }
    }
    
    // Draw Floor (Entrance/Exit highlights)
    const start = maze.start;
    const end = maze.end;
    
    ctx.fillStyle = 'rgba(0, 255, 0, 0.2)'; // Start Zone
    ctx.fillRect(start.x * cs + wt, start.y * cs + wt, cs - 2*wt, cs - 2*wt);

    ctx.fillStyle = 'rgba(255, 0, 0, 0.2)'; // End Zone
    ctx.fillRect(end.x * cs + wt, end.y * cs + wt, cs - 2*wt, cs - 2*wt);
  }

  public clearEntities() {
    const canvas = this.entityCtx.canvas;
    this.entityCtx.clearRect(0, 0, canvas.width, canvas.height);
  }

  public drawPlayer(pos: Vec2, radius: number, offset: Vec2) {
    const ctx = this.entityCtx;
    // Reset to scaled state + offset
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.translate(offset.x, offset.y); 
    
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#4CAF50';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  public drawEnd(_pos: Vec2, _radius: number) {
     // Optional: Draw a pulsing goal or something
  }
}
