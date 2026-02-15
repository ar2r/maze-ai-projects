import type { Maze, Layout, PlayerState } from './types';

interface Palette {
  wall: string;
  wallShadow: string;
  floor: string;
  start: string;
  finish: string;
  finishGlow: string;
  player: string;
  playerOutline: string;
}

export const defaultPalette: Palette = {
  wall: '#0b1f2c',
  wallShadow: 'rgba(0,0,0,0.25)',
  floor: '#102a3a',
  start: '#7ee081',
  finish: '#f7c660',
  finishGlow: 'rgba(247, 198, 96, 0.35)',
  player: '#8be8ff',
  playerOutline: 'rgba(255,255,255,0.8)'
};

export function renderMazeToBuffer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  maze: Maze,
  layout: Layout,
  palette: Palette = defaultPalette
): void {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, width, height);

  const cell = layout.cellSizePx;
  const offsetX = layout.offsetX;
  const offsetY = layout.offsetY;
  const wall = layout.wallThickness * cell;

  ctx.fillStyle = palette.floor;
  ctx.fillRect(offsetX, offsetY, maze.cols * cell, maze.rows * cell);

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.fillStyle = palette.wall;
  ctx.shadowColor = palette.wallShadow;
  ctx.shadowBlur = 10;

  for (let y = 0; y < maze.rows; y++) {
    for (let x = 0; x < maze.cols; x++) {
      const cellData = maze.cells[y][x];
      const px = x * cell;
      const py = y * cell;

      if (cellData.walls[0]) {
        ctx.fillRect(px - wall / 2, py - wall / 2, cell + wall, wall);
      }
      if (cellData.walls[1]) {
        ctx.fillRect(px + cell - wall / 2, py - wall / 2, wall, cell + wall);
      }
      if (cellData.walls[2]) {
        ctx.fillRect(px - wall / 2, py + cell - wall / 2, cell + wall, wall);
      }
      if (cellData.walls[3]) {
        ctx.fillRect(px - wall / 2, py - wall / 2, wall, cell + wall);
      }
    }
  }

  ctx.shadowBlur = 0;
  drawStartFinish(ctx, maze, cell, palette);
  ctx.restore();
}

export function renderDynamic(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  maze: Maze,
  layout: Layout,
  player: PlayerState,
  palette: Palette = defaultPalette
): void {
  ctx.clearRect(0, 0, width, height);

  const cell = layout.cellSizePx;
  const offsetX = layout.offsetX;
  const offsetY = layout.offsetY;

  const playerX = offsetX + player.pos.x * cell;
  const playerY = offsetY + player.pos.y * cell;
  const radius = player.radius * cell;

  ctx.save();
  ctx.fillStyle = palette.player;
  ctx.beginPath();
  ctx.arc(playerX, playerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = palette.playerOutline;
  ctx.lineWidth = Math.max(1, radius * 0.18);
  ctx.stroke();

  drawFinishGlow(ctx, maze, cell, offsetX, offsetY, palette);
  ctx.restore();
}

function drawStartFinish(ctx: CanvasRenderingContext2D, maze: Maze, cell: number, palette: Palette): void {
  const startX = (maze.start.x + 0.5) * cell;
  const startY = (maze.start.y + 0.5) * cell;
  const finishX = (maze.finish.x + 0.5) * cell;
  const finishY = (maze.finish.y + 0.5) * cell;

  ctx.fillStyle = palette.start;
  ctx.beginPath();
  ctx.arc(startX, startY, cell * 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = palette.finish;
  ctx.lineWidth = Math.max(2, cell * 0.08);
  ctx.beginPath();
  ctx.rect(finishX - cell * 0.16, finishY - cell * 0.16, cell * 0.32, cell * 0.32);
  ctx.stroke();
}

function drawFinishGlow(
  ctx: CanvasRenderingContext2D,
  maze: Maze,
  cell: number,
  offsetX: number,
  offsetY: number,
  palette: Palette
): void {
  const finishX = offsetX + (maze.finish.x + 0.5) * cell;
  const finishY = offsetY + (maze.finish.y + 0.5) * cell;
  const radius = cell * 0.55;
  const gradient = ctx.createRadialGradient(finishX, finishY, radius * 0.2, finishX, finishY, radius);
  gradient.addColorStop(0, palette.finishGlow);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(finishX, finishY, radius, 0, Math.PI * 2);
  ctx.fill();
}
