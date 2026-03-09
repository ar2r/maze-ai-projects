# Maze Runner — QA Test Plan

## 1. Automated Tests (Vitest)

| Suite | Tests | Status |
|-------|-------|--------|
| `tests/rng.test.ts` | 8 tests: range, determinism, independence, distribution | ✅ |
| `tests/maze.test.ts` | 26 tests: dimensions, boundaries, connectivity, symmetry, determinism, solver, difficulty | ✅ |
| `tests/collision.test.ts` | 21 tests: closest point geometry, circle-vs-segment, resolution, sliding, getWallSegments | ✅ |
| **Total** | **55 tests** | **55/55 ✅** |

---

## 2. Manual Test Checklist

### 2.1 Desktop (Chrome, Firefox, Safari)

#### Startup
- [ ] Game loads without console errors
- [ ] Menu screen displays correctly at various window sizes (360px–2560px)
- [ ] "Continue" button is disabled on first load (no save)
- [ ] Settings screen opens/closes from menu
- [ ] Settings persist after page reload (localStorage)

#### Mouse Controls
- [ ] Mouse movement directs player toward cursor
- [ ] Player stops when cursor is within deadzone
- [ ] Player does not teleport through walls
- [ ] Player slides along walls (not stops dead)

#### Keyboard Controls
- [ ] Switch to "Keys" in Settings
- [ ] WASD and Arrow keys all work individually
- [ ] Diagonal movement (2 keys) works without speed boost
- [ ] No movement when no keys held

#### Collision
- [ ] Player cannot pass through any wall
- [ ] Player does not get stuck permanently at a corner
- [ ] Wall hit counter increments on collision
- [ ] Anti-spam: rapid movement doesn't increment counter 60x per second

#### Game Flow
- [ ] Level 1 completes on reaching finish (bottom-right)
- [ ] Results screen shows correct time, hits, level
- [ ] "Next Level" advances to level 2 (larger maze)
- [ ] "Retry" restarts same level, same maze layout (same seed)
- [ ] "Menu" returns to main menu
- [ ] Best time saved and displayed on retry/next

#### Pause
- [ ] Pause button (⏸) works during gameplay
- [ ] ESC key pauses
- [ ] Timer stops during pause
- [ ] Tab switch (visibility change) auto-pauses
- [ ] Resume continues from correct state

#### Level Progression (levels 1–20+)
- [ ] Grid size grows each level
- [ ] Level 3+: loop injection creates alternative paths
- [ ] Level 10+: cells are noticeably smaller
- [ ] All generated mazes are solvable (reach finish cell)

#### Persistence
- [ ] Closing and reopening browser resumes from correct level
- [ ] Best times persist across sessions
- [ ] localStorage key = `maze-runner-v1`

#### Debug Overlay
- [ ] `?debug=1` URL param activates overlay at startup
- [ ] Backtick `` ` `` key toggles overlay during gameplay
- [ ] Shows FPS, seed, grid size, player cell, wall hits, render time
- [ ] FPS counter updates every 0.5s

#### Performance
- [ ] 60 FPS maintained on Chrome desktop (check via debug overlay)
- [ ] No jank during maze generation (instant for ≤35×35)
- [ ] Wall buffer is not regenerated every frame (check with profiler)

---

### 2.2 Mobile (iOS Safari 17+, Android Chrome 120+)

#### Touch Controls
- [ ] Joystick appears at bottom-left during gameplay
- [ ] Joystick knob follows finger, clamped to base circle
- [ ] Player moves in correct direction
- [ ] Lifting finger stops player
- [ ] Second finger (multi-touch) does not break joystick

#### Scroll Prevention
- [ ] Page does not scroll while touching joystick
- [ ] Page does not scroll while touching canvas
- [ ] iOS "pull to refresh" does not trigger during gameplay
- [ ] Pinch-to-zoom is disabled

#### Haptics
- [ ] Vibration fires on wall hit (Android Chrome)
- [ ] Vibration fires on level complete
- [ ] Vibration can be disabled in Settings
- [ ] No JS error on iOS (Vibration API not supported — silently ignored)

#### Responsive Layout
- [ ] Game fits 360×640 (min phone) without horizontal scroll
- [ ] HUD visible above maze
- [ ] Buttons are ≥44px tap target on mobile
- [ ] Joystick does not overlap the finish cell for any maze size

#### Orientation Change
- [ ] Switching portrait↔landscape re-computes maze scale
- [ ] Player position is preserved (not reset) on resize
- [ ] Maze still fits screen after rotation

#### Double-tap Zoom Prevention
- [ ] Double-tapping canvas does not zoom page

---

### 2.3 Edge Cases

| Scenario | Expected Behaviour |
|----------|--------------------|
| Very fast mouse movement (swipe across entire screen in 1 frame) | Player moves at max speed along walls, does not teleport |
| Player starts exactly at wall edge | No visual flicker or stuck state |
| Level 1 completed in < 1s | Results screen shows "00:00.X" — no negative time |
| 100+ wall hits | Hit counter shows large number, no overflow |
| localStorage quota exceeded | Error silently caught, game continues without persistence |
| Browser back button during gameplay | Game pauses (visibilitychange) |
| Window resize during pause | Maze rescales correctly |
| Level 35 (max grid 38×38) | Maze generates in < 200ms, cells are 16px+, still navigable |
| Seed = 0 | Valid maze generated |
| OffscreenCanvas not supported (old browser) | Graceful error or fallback |
| No AudioContext support (old browser) | Silent, no errors |

---

## 3. Performance Benchmarks

| Target | Metric | Threshold |
|--------|--------|-----------|
| Frame rate | FPS at level 1 | ≥ 60 FPS |
| Frame rate | FPS at level 20 (18×18) | ≥ 60 FPS |
| Frame rate | FPS at level 35 (38×38) | ≥ 45 FPS |
| Generation | generateMaze(35, 35, 0, ...) | < 20ms |
| Build size | dist JS (gzip) | < 15 KB |
| Memory | Heap after 20 levels | < 50 MB delta |

---

## 4. Browser Compatibility Matrix

| Browser | Version | Desktop | Mobile |
|---------|---------|---------|--------|
| Chrome  | 115+    | ✅ Full | ✅ Full |
| Firefox | 115+    | ✅ Full | ✅ Full |
| Safari  | 16.4+   | ✅ Full | ✅ Full (no vibration) |
| Edge    | 115+    | ✅ Full | ✅ Full |
| Samsung Internet | 22+ | n/a | ✅ Full |

**Required APIs:**
- Canvas 2D + OffscreenCanvas
- requestAnimationFrame
- PointerEvents
- TouchEvents
- localStorage
- Web Audio API (optional — falls back to silence)
- Vibration API (optional — falls back to no haptics)
