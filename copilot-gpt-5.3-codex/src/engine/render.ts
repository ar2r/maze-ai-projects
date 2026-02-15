import { WALL_E, WALL_N, WALL_S, WALL_W, type Maze, type PlayerState } from '../core/types';

export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  mazeBuffer: HTMLCanvasElement | OffscreenCanvas;
  mazeBufferCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
}

function createBuffer(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function get2dContext(canvas: HTMLCanvasElement | OffscreenCanvas): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');
  return ctx;
}

export function createRenderContext(canvas: HTMLCanvasElement): RenderContext {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  const mazeBuffer = createBuffer(canvas.width, canvas.height);
  return {
    canvas,
    ctx,
    mazeBuffer,
    mazeBufferCtx: get2dContext(mazeBuffer)
  };
}

export function resizeRenderContext(render: RenderContext, width: number, height: number): void {
  render.canvas.width = width;
  render.canvas.height = height;
  render.mazeBuffer = createBuffer(width, height);
  render.mazeBufferCtx = get2dContext(render.mazeBuffer);
}

export function drawMazeToBuffer(
  render: RenderContext,
  maze: Maze,
  cellSize: number,
  wallThickness: number
): void {
  const ctx = render.mazeBufferCtx;
  ctx.clearRect(0, 0, render.canvas.width, render.canvas.height);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, maze.width * cellSize, maze.height * cellSize);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineCap = 'round';
  ctx.lineWidth = wallThickness;

  for (let y = 0; y < maze.height; y += 1) {
    for (let x = 0; x < maze.width; x += 1) {
      const idx = y * maze.width + x;
      const walls = maze.cells[idx];
      const left = x * cellSize;
      const top = y * cellSize;
      const right = left + cellSize;
      const bottom = top + cellSize;

      if ((walls & WALL_N) !== 0) {
        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(right, top);
        ctx.stroke();
      }
      if ((walls & WALL_W) !== 0) {
        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(left, bottom);
        ctx.stroke();
      }
      if (x === maze.width - 1 && (walls & WALL_E) !== 0) {
        ctx.beginPath();
        ctx.moveTo(right, top);
        ctx.lineTo(right, bottom);
        ctx.stroke();
      }
      if (y === maze.height - 1 && (walls & WALL_S) !== 0) {
        ctx.beginPath();
        ctx.moveTo(left, bottom);
        ctx.lineTo(right, bottom);
        ctx.stroke();
      }
    }
  }
}

export function renderFrame(
  render: RenderContext,
  maze: Maze,
  player: PlayerState,
  cellSize: number,
  levelProgress: number
): void {
  render.ctx.clearRect(0, 0, render.canvas.width, render.canvas.height);
  render.ctx.drawImage(render.mazeBuffer as CanvasImageSource, 0, 0);

  const startPad = cellSize * 0.2;
  render.ctx.fillStyle = '#22c55e';
  render.ctx.fillRect(startPad, startPad, cellSize - startPad * 2, cellSize - startPad * 2);

  const exitX = (maze.width - 1) * cellSize + startPad;
  const exitY = (maze.height - 1) * cellSize + startPad;
  render.ctx.fillStyle = '#10b981';
  render.ctx.fillRect(exitX, exitY, cellSize - startPad * 2, cellSize - startPad * 2);

  render.ctx.beginPath();
  render.ctx.fillStyle = '#38bdf8';
  render.ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  render.ctx.fill();

  render.ctx.fillStyle = '#f59e0b';
  render.ctx.fillRect(0, render.canvas.height - 5, render.canvas.width * levelProgress, 5);
}
