import { BASE_CANVAS_PADDING } from '../game/config';
import type { MazeData, ViewportInfo } from '../game/types';

export function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext('2d');
  if (context === null) {
    throw new Error('Canvas 2D context is unavailable');
  }

  return context;
}

export function resizeCanvas(canvas: HTMLCanvasElement): { widthPx: number; heightPx: number; dpr: number } {
  const bounds = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const widthPx = Math.max(1, Math.floor(bounds.width));
  const heightPx = Math.max(1, Math.floor(bounds.height));
  canvas.width = Math.max(1, Math.floor(widthPx * dpr));
  canvas.height = Math.max(1, Math.floor(heightPx * dpr));

  return { widthPx, heightPx, dpr };
}

export function computeViewport(maze: MazeData, widthPx: number, heightPx: number): ViewportInfo {
  const playableWidth = Math.max(1, widthPx - BASE_CANVAS_PADDING * 2);
  const playableHeight = Math.max(1, heightPx - BASE_CANVAS_PADDING * 2);
  const scale = Math.min(playableWidth / maze.width, playableHeight / maze.height);
  const worldWidth = maze.width * scale;
  const worldHeight = maze.height * scale;

  return {
    widthPx,
    heightPx,
    scale,
    offsetX: (widthPx - worldWidth) * 0.5,
    offsetY: (heightPx - worldHeight) * 0.5
  };
}
