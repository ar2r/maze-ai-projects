# Maze Runner

Fully client-side maze game built with **TypeScript + Vite + Canvas**. No backend, no database, no external APIs.

## Features

- Perfect-maze generation with deterministic seeded DFS backtracker.
- Progressive difficulty: larger grids, thinner walls, longer target solution path.
- Desktop controls: mouse follow / drag + `WASD` / arrow keys.
- Mobile controls: virtual joystick by default, optional drag mode in Settings.
- Smooth circle collision with sliding and anti-tunneling substeps.
- Pause, restart, per-level results, local progress + best times in `localStorage`.
- HiDPI canvas, static wall buffer, debug overlay, and vibration / procedural sound.

## Scripts

```bash
npm install
npm run dev
npm run test
npm run build
npm run preview
```

The Vite dev server is configured for `http://127.0.0.1:3000` with strict port mode.

## Controls

### Desktop

- **Mouse**: follow the cursor inside the maze or click / drag.
- **Keyboard**: `W`, `A`, `S`, `D` or arrow keys.
- **Pause**: `Esc` or the pause button.

### Mobile

- **Virtual joystick** by default.
- Optional **drag mode** in Settings.
- The game surface disables unwanted touch scrolling / zooming without affecting the rest of the page.

## File layout

```text
src/
  app/app-controller.ts      UI composition and DOM state
  core/rng.ts                Seed hashing and PRNG
  core/level-config.ts       Difficulty progression
  core/maze-generator.ts     Perfect maze generation + wall rects
  core/maze-validator.ts     Connectivity and solvability checks
  game/collision.ts          Circle-vs-wall collision resolution
  game/game-engine.ts        Game loop, level lifecycle, results
  input/input-manager.ts     Keyboard, pointer, touch joystick
  render/renderer.ts         HiDPI canvas + static wall buffer + debug overlay
  services/storage.ts        localStorage wrapper with memory fallback
  services/feedback.ts       Procedural sound + vibration wrappers
  types.ts                   Shared types
tests/
  *.test.ts                  Maze, collision, and progression checks
```

## QA checklist

### Functional

- [ ] Start, Continue, Settings, Pause, Restart, Next, Retry all work.
- [ ] Completing a level stores best time and unlocks the next level.
- [ ] Same session seed + level reproduces the same maze.
- [ ] Start and exit are always reachable.

### Desktop input

- [ ] Mouse follow stays responsive without passing through walls.
- [ ] Click / drag works.
- [ ] `WASD` and arrow keys both work.
- [ ] Focus styles are visible on all buttons.

### Mobile input

- [ ] Virtual joystick controls movement without page scroll conflicts.
- [ ] Drag mode works when selected.
- [ ] Fast swipes do not tunnel through walls.
- [ ] Vibration fires on wall hits when supported and enabled.

### Resilience / edge cases

- [ ] Tab switch / app background pauses the run.
- [ ] Resize and orientation change keep the level playable.
- [ ] If `localStorage` is unavailable, the game still runs.
- [ ] Debug overlay shows FPS, seed, grid size, player position, and hits.

### Browsers

- [ ] Chrome / Edge desktop
- [ ] Firefox desktop
- [ ] Safari desktop
- [ ] Chrome Android
- [ ] Safari iOS
