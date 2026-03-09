/**
 * Game — central state machine and game loop.
 *
 * State transitions:
 *   MENU → PLAYING (start / continue)
 *   PLAYING → PAUSED (pause button / tab blur)
 *   PLAYING → RESULTS (reach finish)
 *   PAUSED → PLAYING (resume)
 *   PAUSED → MENU (menu from pause)
 *   RESULTS → PLAYING (next level / retry)
 *   RESULTS → MENU (menu from results)
 *   * → SETTINGS (from menu only)
 *
 * Ownership:
 *   - Owns the RAF loop.
 *   - Delegates rendering to Renderer.
 *   - Delegates physics to updatePlayer().
 *   - Delegates input to KeyboardInput, PointerInput, VirtualJoystick.
 *   - Delegates UI to all UI modules.
 *   - Delegates persistence to storage.ts.
 */

import type { GameState, AppSettings } from '../types';
import { generateMaze } from '../maze/generator';
import { getLevelParams } from '../maze/difficulty';
import { Renderer } from './renderer';
import { createPlayer, updatePlayer, hasReachedFinish } from './player';
import { KeyboardInput } from '../input/keyboard';
import { PointerInput } from '../input/pointer';
import { VirtualJoystick } from '../input/joystick';
import { HUD } from '../ui/hud';
import { MenuScreen } from '../ui/menu';
import { ResultsScreen } from '../ui/results';
import { PauseScreen } from '../ui/pause';
import { SettingsScreen } from '../ui/settings';
import { ControlHint } from '../ui/hint';
import { DebugOverlay } from '../ui/debug';
import { AudioSynth } from '../audio/synth';
import { Haptics } from '../haptics';
import { loadSave, writeSave, recordBestTime, getBestTime } from '../storage';
import { isTouchDevice, debounce } from '../utils';

export class Game {
  // ─── Canvas / Renderer ──────────────────────────────────────────────────
  private readonly renderer: Renderer;

  // ─── State ──────────────────────────────────────────────────────────────
  private state: GameState = {
    phase:         'MENU',
    level:         1,
    seed:          0,
    maze:          null,
    player:        null,
    elapsedMs:     0,
    lastTimestamp: 0,
  };

  // ─── Persistence ────────────────────────────────────────────────────────
  private save = loadSave();

  // ─── Input ──────────────────────────────────────────────────────────────
  private readonly keyboard: KeyboardInput;
  private readonly pointer:  PointerInput;
  private readonly joystick: VirtualJoystick;

  // ─── UI ─────────────────────────────────────────────────────────────────
  private readonly hud:      HUD;
  private readonly menu:     MenuScreen;
  private readonly results:  ResultsScreen;
  private readonly pause:    PauseScreen;
  private readonly settings: SettingsScreen;
  private readonly hint:     ControlHint;
  private readonly debug:    DebugOverlay;

  // ─── Audio / Haptics ────────────────────────────────────────────────────
  private readonly audio:   AudioSynth;
  private readonly haptics: Haptics;

  // ─── RAF loop ────────────────────────────────────────────────────────────
  /** Timestamp of previous frame (performance.now()) */
  private prevTs = 0;
  /** Accumulated delta for rendering stats */
  private lastRenderMs = 0;

  // ─── Throttle wall-hit events (prevent spam) ────────────────────────────
  private lastHitTime = 0;
  private readonly HIT_COOLDOWN_MS = 80;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);

    this.keyboard = new KeyboardInput();
    this.pointer  = new PointerInput(canvas, (cx, cy) => this.renderer.canvasToWorld(cx, cy));
    this.joystick = new VirtualJoystick();

    this.hud      = new HUD();
    this.menu     = new MenuScreen();
    this.results  = new ResultsScreen();
    this.pause    = new PauseScreen();
    this.settings = new SettingsScreen();
    this.hint     = new ControlHint();
    this.debug    = new DebugOverlay();

    this.audio   = new AudioSynth();
    this.haptics = new Haptics();

    this.wireUI();
    this.applySettings(this.save.settings);
    this.handleResize();
    window.addEventListener('resize', debounce(() => this.handleResize(), 150));

    // Pause on tab hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state.phase === 'PLAYING') {
        this.doPause();
      }
    });
  }

  // ─── Public boot ─────────────────────────────────────────────────────────

  start(): void {
    this.showMenu();
    requestAnimationFrame(ts => this.loop(ts));
  }

  // ─── RAF loop ─────────────────────────────────────────────────────────────

  private loop(ts: number): void {
    const deltaMs = Math.min(ts - this.prevTs, 64); // cap at ~15fps equivalent
    this.prevTs = ts;

    if (this.state.phase === 'PLAYING') {
      this.tick(deltaMs, ts);
    }

    requestAnimationFrame(t => this.loop(t));
  }

  private tick(deltaMs: number, _ts: number): void {
    const { maze, player } = this.state;
    if (!maze || !player) return;

    // Accumulate elapsed time
    this.state.elapsedMs += deltaMs;

    // ── Gather input ───────────────────────────────────────────────────────
    const input = this.gatherInput(player.x, player.y);

    // ── Physics ───────────────────────────────────────────────────────────
    const params = getLevelParams(this.state.level);
    const t0 = performance.now();
    const hits = updatePlayer(player, input, params.speedPx, deltaMs, maze);
    this.lastRenderMs = performance.now() - t0;

    // ── Wall hit feedback ─────────────────────────────────────────────────
    if (hits > 0) {
      const now = performance.now();
      if (now - this.lastHitTime > this.HIT_COOLDOWN_MS) {
        this.lastHitTime = now;
        if (this.save.settings.sound)     this.audio.wallHit();
        if (this.save.settings.vibration) this.haptics.wallHit();
      }
    }

    // ── Win condition ─────────────────────────────────────────────────────
    if (hasReachedFinish(player, maze)) {
      this.doLevelComplete();
      return;
    }

    // ── Render ────────────────────────────────────────────────────────────
    this.renderer.renderFrame(maze, player, deltaMs);

    // ── HUD ───────────────────────────────────────────────────────────────
    this.hud.update(this.state.level, this.state.elapsedMs, player.wallHits);

    // ── Debug ─────────────────────────────────────────────────────────────
    if (this.debug.isVisible()) {
      this.debug.update(deltaMs, {
        seed:       this.state.seed,
        gridW:      maze.width,
        gridH:      maze.height,
        playerCell: {
          x: Math.floor(player.x / maze.cellSize),
          y: Math.floor(player.y / maze.cellSize),
        },
        collisions: player.wallHits,
        renderMs:   this.lastRenderMs,
      });
    }
  }

  // ─── Input aggregation ────────────────────────────────────────────────────

  private gatherInput(px: number, py: number) {
    const isTouchMode = isTouchDevice();
    const settings    = this.save.settings;

    if (isTouchMode) {
      return this.joystick.getDirection();
    }

    if (settings.controlMode === 'keyboard') {
      return this.keyboard.getDirection();
    }

    // Mouse mode: check if any key is held (keyboard as fallback)
    const keyDir = this.keyboard.getDirection();
    if (this.keyboard.isAnyKeyHeld()) return keyDir;
    return this.pointer.getDirection(px, py);
  }

  // ─── State transitions ────────────────────────────────────────────────────

  private showMenu(): void {
    this.state.phase = 'MENU';
    this.hud.hide();
    this.results.hide();
    this.pause.hide();
    this.settings.hide();
    this.hint.hide();
    this.stopInput();
    this.menu.show(this.save.currentLevel > 1);
  }

  private doStartNewGame(): void {
    this.save.currentLevel = 1;
    writeSave(this.save);
    this.doStartLevel(1);
  }

  private doContinue(): void {
    this.doStartLevel(this.save.currentLevel);
  }

  private doStartLevel(level: number): void {
    const params = getLevelParams(level);
    // Seed: combine user seed + level number for determinism
    const seed = ((this.save.userSeed ^ (level * 100003)) >>> 0);

    const maze = generateMaze(
      params.gridW,
      params.gridH,
      seed,
      params.cellSize,
      params.wallThickness,
      params.loops,
    );

    const player = createPlayer(maze);

    this.state = {
      phase:         'PLAYING',
      level,
      seed,
      maze,
      player,
      elapsedMs:     0,
      lastTimestamp: performance.now(),
    };

    // Update canvas layout for new maze
    this.renderer.loadMaze(maze);

    // Show UI
    this.menu.hide();
    this.results.hide();
    this.pause.hide();
    this.settings.hide();
    this.hud.show();
    this.hud.update(level, 0, 0);

    // Input
    this.startInput();
    this.hint.autoDetectAndShow(this.save.settings.controlMode);
  }

  private doLevelComplete(): void {
    const { maze, player, level, elapsedMs } = this.state;
    if (!maze || !player) return;

    if (this.save.settings.sound)     this.audio.levelWin();
    if (this.save.settings.vibration) this.haptics.levelWin();

    // Advance and save
    const nextLevel = level + 1;
    this.save.currentLevel = nextLevel;
    const isNewBest = recordBestTime(this.save, level, elapsedMs);
    writeSave(this.save);

    this.state.phase = 'RESULTS';
    this.hud.hide();
    this.stopInput();

    // Render final frame first (so the player visually reaches the finish)
    this.renderer.renderFrame(maze, player, 0);

    this.results.show({
      level,
      elapsedMs,
      wallHits:          player.wallHits,
      optimalPathLength: maze.optimalPathLength,
      isNewBest,
      bestTimeMs:        getBestTime(this.save, level),
    }, this.save);
  }

  private doPause(): void {
    if (this.state.phase !== 'PLAYING') return;
    this.state.phase = 'PAUSED';
    this.hud.hide();
    this.stopInput();
    this.pause.show();
  }

  private doResume(): void {
    if (this.state.phase !== 'PAUSED') return;
    this.state.phase = 'PLAYING';
    this.pause.hide();
    this.hud.show();
    this.startInput();
    // Reset prevTs to avoid delta spike after pause
    this.prevTs = performance.now();
  }

  private doRestart(): void {
    if (!this.state.maze) return;
    const level = this.state.level;
    this.doStartLevel(level);
  }

  private doNextLevel(): void {
    const nextLevel = this.state.level + 1;
    this.doStartLevel(nextLevel);
  }

  private doOpenSettings(): void {
    this.menu.hide();
    this.settings.show(this.save.settings);
  }

  private doCloseSettings(): void {
    this.settings.hide();
    this.menu.show(this.save.currentLevel > 1);
  }

  // ─── Input management ────────────────────────────────────────────────────

  private startInput(): void {
    if (isTouchDevice()) {
      this.joystick.enable();
    } else {
      this.keyboard.enable();
      if (this.save.settings.controlMode === 'mouse') {
        this.pointer.enable();
      }
    }
  }

  private stopInput(): void {
    this.keyboard.disable();
    this.pointer.disable();
    this.joystick.disable();
  }

  // ─── Settings ────────────────────────────────────────────────────────────

  private applySettings(s: AppSettings): void {
    this.audio.setEnabled(s.sound);
    this.haptics.setEnabled(s.vibration);
  }

  // ─── Resize ──────────────────────────────────────────────────────────────

  private handleResize(): void {
    this.renderer.resize(this.state.maze ?? null);
  }

  // ─── Wire UI callbacks ────────────────────────────────────────────────────

  private wireUI(): void {
    this.menu.setOnStart(    () => { this.audio.click(); this.doStartNewGame(); });
    this.menu.setOnContinue( () => { this.audio.click(); this.doContinue(); });
    this.menu.setOnSettings( () => { this.audio.click(); this.doOpenSettings(); });

    this.hud.setOnPause(     () => { this.audio.click(); this.doPause(); });

    this.pause.setOnResume(  () => { this.audio.click(); this.doResume(); });
    this.pause.setOnRestart( () => { this.audio.click(); this.doRestart(); });
    this.pause.setOnMenu(    () => { this.audio.click(); this.showMenu(); });

    this.results.setOnNext(  () => { this.audio.click(); this.doNextLevel(); });
    this.results.setOnRetry( () => { this.audio.click(); this.doRestart(); });
    this.results.setOnMenu(  () => { this.audio.click(); this.showMenu(); });

    this.settings.setOnClose(() => { this.audio.click(); this.doCloseSettings(); });
    this.settings.setOnChange((s: AppSettings) => {
      this.save.settings = s;
      writeSave(this.save);
      this.applySettings(s);
    });
  }
}
