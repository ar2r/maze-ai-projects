/**
 * Renderer — draws the maze and player onto the HTML canvas.
 *
 * Architecture (two-layer approach):
 *  Layer 1 — offscreen OffscreenCanvas (walls):
 *    - Drawn ONCE per level generation.
 *    - Contains: background, all wall lines, start/finish markers.
 *    - Composited onto main canvas each frame (one drawImage call).
 *
 *  Layer 2 — main canvas:
 *    - Each frame: drawImage(wallBuffer), then draw player + effects.
 *
 * Scale strategy ("always visible"):
 *  - The maze world is (gridW * cellSize) × (gridH * cellSize) pixels.
 *  - We compute a scale factor so the maze fits within the available canvas area.
 *  - All rendering is in world coordinates; the canvas context is scaled.
 *
 * HiDPI:
 *  - Canvas dimensions set to clientWidth/clientHeight * devicePixelRatio.
 *  - Context scaled by devicePixelRatio so CSS pixels remain correct.
 */

import type { MazeData, PlayerState } from '../types';

// ─── Color constants ──────────────────────────────────────────────────────────
const C = {
  BG:          '#0d1117',
  PATH:        '#161b22',  // open corridor fill
  WALL:        '#3d6a9e',  // wall stroke
  WALL_OUTER:  '#2d4a6e',  // outer border (slightly darker)
  START_FILL:  '#1a472a',  // start cell fill
  START_RING:  '#27ae60',  // start cell ring
  FINISH_FILL: '#4a1a1a',  // finish cell fill
  FINISH_RING: '#e74c3c',  // finish cell ring/pulse
  PLAYER:      '#f39c12',  // player fill
  PLAYER_GLOW: 'rgba(243,156,18,0.35)',
  FINISH_STAR: '#f5a623',
} as const;

// ─── Renderer class ───────────────────────────────────────────────────────────

export class Renderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;

  /** Offscreen wall buffer — rebuilt on each new level */
  private wallBuffer: OffscreenCanvas | null = null;

  /** Current scale factor (world → canvas CSS pixels) */
  private scale = 1;
  /** World width / height in px */
  private worldW = 0;
  private worldH = 0;
  /** Canvas left/top offset to center the maze */
  private offsetX = 0;
  private offsetY = 0;

  /** Used for finish cell pulse animation */
  private animTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context from canvas');
    this.ctx = ctx;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Call when the canvas size changes (resize / orientation change).
   * Re-computes scale and offset; invalidates wall buffer.
   */
  resize(maze: MazeData | null): void {
    const dpr = window.devicePixelRatio || 1;
    const cssW = this.canvas.clientWidth;
    const cssH = this.canvas.clientHeight;

    this.canvas.width  = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);

    this.ctx.scale(dpr, dpr);

    if (maze) {
      this.computeLayout(maze, cssW, cssH);
      this.buildWallBuffer(maze);
    }
  }

  /**
   * Prepare rendering for a new maze level.
   * Call after generateMaze() returns.
   */
  loadMaze(maze: MazeData): void {
    const dpr = window.devicePixelRatio || 1;
    const cssW = this.canvas.width / dpr;
    const cssH = this.canvas.height / dpr;
    this.computeLayout(maze, cssW, cssH);
    this.buildWallBuffer(maze);
  }

  /**
   * Render one frame.
   * @param maze     Current maze data
   * @param player   Current player state
   * @param deltaMs  Time since last frame (for animations)
   */
  renderFrame(maze: MazeData, player: PlayerState, deltaMs: number): void {
    this.animTime += deltaMs;
    const ctx = this.ctx;

    // ── Clear entire canvas ─────────────────────────────────────────────────
    const dpr = window.devicePixelRatio || 1;
    const cssW = this.canvas.width / dpr;
    const cssH = this.canvas.height / dpr;
    ctx.clearRect(0, 0, cssW, cssH);

    // ── Draw background ──────────────────────────────────────────────────────
    ctx.fillStyle = C.BG;
    ctx.fillRect(0, 0, cssW, cssH);

    // ── Apply world transform ────────────────────────────────────────────────
    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    // ── Composite wall buffer ────────────────────────────────────────────────
    if (this.wallBuffer) {
      ctx.drawImage(this.wallBuffer, 0, 0);
    }

    // ── Animated finish pulse ────────────────────────────────────────────────
    this.drawFinishPulse(ctx, maze);

    // ── Draw player ──────────────────────────────────────────────────────────
    this.drawPlayer(ctx, player, maze.cellSize);

    ctx.restore();
  }

  /**
   * Convert canvas CSS pixel coordinates to world coordinates.
   * Useful for mapping mouse/pointer position to world space.
   */
  canvasToWorld(cx: number, cy: number): { x: number; y: number } {
    return {
      x: (cx - this.offsetX) / this.scale,
      y: (cy - this.offsetY) / this.scale,
    };
  }

  get currentScale(): number { return this.scale; }
  get worldWidth():  number  { return this.worldW; }
  get worldHeight(): number  { return this.worldH; }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private computeLayout(maze: MazeData, cssW: number, cssH: number): void {
    this.worldW = maze.width  * maze.cellSize;
    this.worldH = maze.height * maze.cellSize;

    // Padding so maze doesn't press against edges
    const paddingX = cssW > 500 ? 32 : 12;
    const paddingY = cssH > 500 ? 48 : 12; // more top padding for HUD

    const availW = cssW - paddingX * 2;
    const availH = cssH - paddingY * 2;

    const scaleX = availW / this.worldW;
    const scaleY = availH / this.worldH;
    this.scale = Math.min(scaleX, scaleY);

    // Center maze in canvas
    this.offsetX = (cssW - this.worldW * this.scale) / 2;
    this.offsetY = (cssH - this.worldH * this.scale) / 2;
  }

  /** Build the offscreen wall buffer for the current maze. */
  private buildWallBuffer(maze: MazeData): void {
    const { width, height, cells, cellSize, wallThickness } = maze;
    const bufW = width  * cellSize;
    const bufH = height * cellSize;

    const buf = new OffscreenCanvas(bufW, bufH);
    const bctx = buf.getContext('2d')!;

    // ── Fill corridor background ─────────────────────────────────────────────
    bctx.fillStyle = C.PATH;
    bctx.fillRect(0, 0, bufW, bufH);

    // ── Draw start and finish cells ──────────────────────────────────────────
    // Start: top-left cell
    bctx.fillStyle = C.START_FILL;
    bctx.fillRect(1, 1, cellSize - 2, cellSize - 2);

    // Finish: bottom-right cell
    const fx = (width - 1) * cellSize;
    const fy = (height - 1) * cellSize;
    bctx.fillStyle = C.FINISH_FILL;
    bctx.fillRect(fx + 1, fy + 1, cellSize - 2, cellSize - 2);

    // ── Draw start ring ──────────────────────────────────────────────────────
    bctx.strokeStyle = C.START_RING;
    bctx.lineWidth = 2;
    bctx.beginPath();
    bctx.arc(cellSize / 2, cellSize / 2, cellSize / 2 - wallThickness * 2, 0, Math.PI * 2);
    bctx.stroke();

    // ── Draw walls ───────────────────────────────────────────────────────────
    bctx.strokeStyle = C.WALL;
    bctx.lineWidth = wallThickness;
    bctx.lineCap = 'square';

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = cells[y][x];
        const wx = x * cellSize;
        const wy = y * cellSize;

        bctx.beginPath();

        // North wall
        if (cell.wallN) {
          const isOuter = y === 0;
          bctx.strokeStyle = isOuter ? C.WALL_OUTER : C.WALL;
          bctx.lineWidth = isOuter ? wallThickness + 1 : wallThickness;
          bctx.moveTo(wx, wy);
          bctx.lineTo(wx + cellSize, wy);
          bctx.stroke();
          bctx.beginPath();
        }
        // West wall
        if (cell.wallW) {
          const isOuter = x === 0;
          bctx.strokeStyle = isOuter ? C.WALL_OUTER : C.WALL;
          bctx.lineWidth = isOuter ? wallThickness + 1 : wallThickness;
          bctx.moveTo(wx, wy);
          bctx.lineTo(wx, wy + cellSize);
          bctx.stroke();
          bctx.beginPath();
        }
        // South wall (only for last row)
        if (y === height - 1 && cell.wallS) {
          bctx.strokeStyle = C.WALL_OUTER;
          bctx.lineWidth = wallThickness + 1;
          bctx.moveTo(wx, wy + cellSize);
          bctx.lineTo(wx + cellSize, wy + cellSize);
          bctx.stroke();
          bctx.beginPath();
        }
        // East wall (only for last col)
        if (x === width - 1 && cell.wallE) {
          bctx.strokeStyle = C.WALL_OUTER;
          bctx.lineWidth = wallThickness + 1;
          bctx.moveTo(wx + cellSize, wy);
          bctx.lineTo(wx + cellSize, wy + cellSize);
          bctx.stroke();
          bctx.beginPath();
        }
      }
    }

    // ── "S" label on start ───────────────────────────────────────────────────
    const fontSize = Math.max(10, Math.floor(cellSize * 0.35));
    bctx.fillStyle = C.START_RING;
    bctx.font = `bold ${fontSize}px system-ui`;
    bctx.textAlign = 'center';
    bctx.textBaseline = 'middle';
    bctx.fillText('S', cellSize / 2, cellSize / 2);

    // ── Finish marker (static part) ──────────────────────────────────────────
    const fcx = fx + cellSize / 2;
    const fcy = fy + cellSize / 2;
    bctx.fillStyle = C.FINISH_RING;
    bctx.font = `bold ${fontSize}px system-ui`;
    bctx.fillText('F', fcx, fcy);

    this.wallBuffer = buf;
  }

  /** Animated pulsing ring on the finish cell. */
  private drawFinishPulse(ctx: CanvasRenderingContext2D, maze: MazeData): void {
    const { width, height, cellSize } = maze;
    const fx = (width - 1) * cellSize + cellSize / 2;
    const fy = (height - 1) * cellSize + cellSize / 2;

    const t = (Math.sin(this.animTime / 400) + 1) / 2; // 0..1
    const r = cellSize * 0.28 + t * cellSize * 0.1;
    const alpha = 0.4 + t * 0.5;

    ctx.strokeStyle = `rgba(231,76,60,${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  /** Draw the player circle with a glow effect. */
  private drawPlayer(
    ctx: CanvasRenderingContext2D,
    player: PlayerState,
    _cellSize: number,
  ): void {
    const { x, y, radius } = player;

    // Glow
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.2);
    grad.addColorStop(0,   C.PLAYER_GLOW);
    grad.addColorStop(1,   'rgba(243,156,18,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = C.PLAYER;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Shine highlight
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(x - radius * 0.28, y - radius * 0.28, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}
