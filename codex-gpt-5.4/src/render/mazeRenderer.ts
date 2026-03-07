import type { LevelState, ViewportInfo } from '../game/types';

export class MazeRenderer {
  private readonly buffer = document.createElement('canvas');

  redraw(level: LevelState, viewport: ViewportInfo, dpr: number): void {
    this.buffer.width = Math.max(1, Math.floor(viewport.widthPx * dpr));
    this.buffer.height = Math.max(1, Math.floor(viewport.heightPx * dpr));
    const context = this.buffer.getContext('2d');
    if (context === null) {
      return;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, viewport.widthPx, viewport.heightPx);
    context.fillStyle = '#f7f0dc';
    context.fillRect(0, 0, viewport.widthPx, viewport.heightPx);

    const gridWidthPx = level.maze.width * viewport.scale;
    const gridHeightPx = level.maze.height * viewport.scale;
    const wallThickness = Math.max(2, viewport.scale * level.config.wallThicknessRatio);

    context.save();
    context.translate(viewport.offsetX, viewport.offsetY);
    context.fillStyle = '#18110f';
    context.fillRect(-wallThickness, -wallThickness, gridWidthPx + wallThickness * 2, wallThickness);
    context.fillRect(-wallThickness, gridHeightPx, gridWidthPx + wallThickness * 2, wallThickness);
    context.fillRect(-wallThickness, 0, wallThickness, gridHeightPx);
    context.fillRect(gridWidthPx, 0, wallThickness, gridHeightPx);

    context.lineCap = 'round';
    context.strokeStyle = '#18110f';
    context.lineWidth = wallThickness;
    context.beginPath();
    for (let index = 0; index < level.maze.wallSegments.length; index += 1) {
      const segment = level.maze.wallSegments[index];
      context.moveTo(segment.x1 * viewport.scale, segment.y1 * viewport.scale);
      context.lineTo(segment.x2 * viewport.scale, segment.y2 * viewport.scale);
    }
    context.stroke();

    const startX = (level.maze.startCell.x + 0.5) * viewport.scale;
    const startY = (level.maze.startCell.y + 0.5) * viewport.scale;
    const finishX = (level.maze.finishCell.x + 0.5) * viewport.scale;
    const finishY = (level.maze.finishCell.y + 0.5) * viewport.scale;

    context.fillStyle = '#2e8b57';
    context.beginPath();
    context.arc(startX, startY, viewport.scale * 0.18, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#cc5b2f';
    context.beginPath();
    context.arc(finishX, finishY, viewport.scale * 0.2, 0, Math.PI * 2);
    context.fill();

    context.restore();
  }

  drawTo(context: CanvasRenderingContext2D, viewport: ViewportInfo, dpr: number): void {
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, viewport.widthPx, viewport.heightPx);
    context.drawImage(this.buffer, 0, 0, viewport.widthPx * dpr, viewport.heightPx * dpr, 0, 0, viewport.widthPx, viewport.heightPx);
  }
}
