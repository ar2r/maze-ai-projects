# Test Plan — Maze Runner

## 1. Unit Tests (Automated — Vitest)

### 1.1 RNG (`tests/rng.test.ts`) — 8 tests
- [x] Numbers in range [0, 1)
- [x] Deterministic: same seed -> same sequence
- [x] Different seeds -> different sequences
- [x] Reasonable distribution (chi-squared rough)
- [x] `createSeed` deterministic for same level
- [x] `createSeed` different for different levels
- [x] Works with seed = 0
- [x] Works with very large seeds

### 1.2 Maze Generator (`tests/generator.test.ts`) — 15 tests
- [x] `createGrid` correct dimensions
- [x] `createGrid` all walls initially present
- [x] `createGrid` correct row/col
- [x] `createGrid` all cells not visited
- [x] `generateMaze` correct dimensions
- [x] Start and end positions exist
- [x] All cells reachable (full connectivity via BFS)
- [x] Perfect maze (N-1 passages for N cells, no loops)
- [x] Boundary walls intact
- [x] Deterministic (same seed -> same maze)
- [x] Wall consistency between adjacent cells
- [x] Extra openings increase passage count
- [x] Works with 2x2 maze
- [x] Works with non-square mazes
- [x] Start != End

### 1.3 Maze Solver (`tests/solver.test.ts`) — 10 tests
- [x] Path from start to end exists
- [x] Path starts at start, ends at end
- [x] Path length matches solutionLength
- [x] Path >= manhattan distance
- [x] Consecutive path cells are adjacent
- [x] Works with 2x2 maze
- [x] Works with large 30x30 mazes
- [x] `isMazeConnected` true for valid maze
- [x] `isMazeConnected` true for maze with extra openings
- [x] `isMazeConnected` true across 20 different seeds

### 1.4 Difficulty (`tests/difficulty.test.ts`) — 8 tests
- [x] Valid config for level 1
- [x] Maze size increases with level
- [x] Cell size decreases with level
- [x] Extra openings from level 5+
- [x] Reasonable maximums (no infinite growth)
- [x] Player radius < half cell size
- [x] Player speed increases with level
- [x] Consistent results for same level

### 1.5 Collision (`tests/collision.test.ts`) — 16 tests
- [x] Extract wall segments from maze
- [x] Outer boundary walls included
- [x] Segments are axis-aligned
- [x] Circle-segment collision detection (horizontal)
- [x] No collision when far away
- [x] Collision with vertical segment
- [x] Endpoint collision handling
- [x] No collision past segment endpoint
- [x] Correct push-out normal direction
- [x] Prevents overlapping walls
- [x] Blocks movement through walls
- [x] Sliding along walls works
- [x] Corner handling (no getting stuck)
- [x] Hit flag true on collision
- [x] Hit flag false with no collision
- [x] Multiple walls (corridor) handling

### 1.6 Storage (`tests/storage.test.ts`) — 6 tests
- [x] Default data when nothing saved
- [x] Save and load roundtrip
- [x] Best time save and retrieve
- [x] Best time only updated when better
- [x] Corrupted localStorage handled gracefully
- [x] Settings persistence

**Total automated: 63 tests**

---

## 2. Manual Testing Checklist — Desktop (PC)

### 2.1 Browser Compatibility
- [ ] Chrome (latest) — game loads, renders, plays correctly
- [ ] Firefox (latest) — game loads, renders, plays correctly
- [ ] Safari (latest) — game loads, renders, plays correctly
- [ ] Edge (latest) — game loads, renders, plays correctly

### 2.2 Mouse Control (Follow Cursor)
- [ ] Ball follows cursor smoothly
- [ ] Ball stops when cursor is near ball (dead zone)
- [ ] Ball cannot pass through walls
- [ ] Ball slides along walls correctly
- [ ] Ball does not get stuck in corners
- [ ] Leaving canvas resets input
- [ ] Fast mouse movement doesn't teleport through walls

### 2.3 Keyboard Control (WASD / Arrows)
- [ ] W/Up moves up
- [ ] A/Left moves left
- [ ] S/Down moves down
- [ ] D/Right moves right
- [ ] Diagonal movement normalized (WASD combo)
- [ ] No residual movement when keys released
- [ ] Escape toggles pause

### 2.4 Gameplay
- [ ] Start new game from menu
- [ ] Level 1 is a small, easy maze
- [ ] Player appears at start (cyan) cell
- [ ] Exit (golden) is visible and pulsing
- [ ] Reaching exit triggers level complete
- [ ] Results screen shows time and wall hits
- [ ] Next Level button advances to level 2
- [ ] Retry replays same level
- [ ] Levels get progressively larger
- [ ] Level 10+ has false loops (extra passages)

### 2.5 UI/UX
- [ ] Menu: Start, Continue (if progress), Settings visible
- [ ] Settings: Sound, Vibration, Debug toggles work
- [ ] Debug overlay shows FPS, seed, grid size, position
- [ ] Pause button works
- [ ] Pause screen: Resume, Restart, Menu buttons work
- [ ] HUD shows level number, timer, wall hits
- [ ] Tutorial shows on first launch
- [ ] Tutorial doesn't show again after dismissal

### 2.6 localStorage
- [ ] Progress saved between page reloads
- [ ] Continue button appears after completing level 1
- [ ] Best times persist across sessions
- [ ] Settings persist across sessions
- [ ] Clearing localStorage resets everything

### 2.7 Window Resize
- [ ] Canvas adapts to window resize
- [ ] No visual artifacts after resize
- [ ] HiDPI rendering correct (no blurriness on retina)

---

## 3. Manual Testing Checklist — Mobile (Touch)

### 3.1 Device/Browser Targets
- [ ] iOS Safari (iPhone)
- [ ] iOS Chrome (iPhone)
- [ ] Android Chrome (phone)
- [ ] Android Firefox (phone)
- [ ] Tablet (iPad/Android)

### 3.2 Touch Control (Virtual Joystick)
- [ ] Touch down creates joystick at touch point
- [ ] Drag moves ball in direction of drag
- [ ] Joystick visual (base + knob) appears
- [ ] Release stops movement
- [ ] Dead zone prevents micro-movements
- [ ] Joystick disappears on release
- [ ] Fast swipes don't break controls
- [ ] Multi-touch doesn't crash

### 3.3 Scroll/Zoom Prevention
- [ ] Page does NOT scroll during gameplay
- [ ] Page does NOT zoom with pinch
- [ ] No rubber-banding on iOS
- [ ] Context menu does NOT appear on long press

### 3.4 Orientation
- [ ] Works in portrait mode
- [ ] Works in landscape mode
- [ ] Smooth transition between orientations
- [ ] Canvas resizes correctly

### 3.5 Performance
- [ ] 60 FPS on mid-range phone (level 1-5)
- [ ] No noticeable lag on level 10-15
- [ ] Smooth camera following
- [ ] No jank during maze generation

### 3.6 Vibration
- [ ] Vibrates on wall collision (if enabled)
- [ ] No vibration when disabled in settings
- [ ] Vibration works on Android Chrome
- [ ] Gracefully degrades where unsupported

### 3.7 Buttons/Touch Targets
- [ ] All buttons are >=44px touch target
- [ ] Buttons respond to tap (no missed taps)
- [ ] Pause button reachable during gameplay

---

## 4. Edge Cases

### 4.1 Tab/Focus
- [ ] Game pauses when tab loses focus (alt-tab)
- [ ] No time skip when returning to tab
- [ ] No phantom keypresses after tab switch

### 4.2 Very Fast Input
- [ ] Fast mouse snapping doesn't teleport through thin walls
- [ ] Fast touch swipe is handled gracefully
- [ ] No NaN/Infinity in position calculations

### 4.3 Extreme Levels
- [ ] Level 30+ generates and plays (large maze, small cells)
- [ ] Camera following works on large mazes
- [ ] No memory issues after many level transitions
- [ ] No canvas buffer size issues (>4096px dimension)

### 4.4 Refresh/Reload
- [ ] Refreshing during gameplay doesn't corrupt save
- [ ] Can resume from saved progress after reload

### 4.5 First-time User
- [ ] Tutorial appears on first launch
- [ ] Clear instructions for both input methods
- [ ] Start cell is visually distinct
- [ ] Exit cell is obvious (pulsing gold)

---

## 5. Performance Targets

| Metric | Target | Method |
|--------|--------|--------|
| FPS (level 1, desktop) | 60 | Debug overlay |
| FPS (level 1, mobile) | 60 | Debug overlay |
| FPS (level 20, desktop) | 60 | Debug overlay |
| FPS (level 20, mobile) | 50+ | Debug overlay |
| Maze generation time | <50ms | console.time |
| Bundle size (gzip) | <15KB | Build output |
| First paint | <500ms | DevTools |

---

## 6. Accessibility

- [ ] Focus styles visible on keyboard navigation
- [ ] Buttons have sufficient color contrast
- [ ] Pause button has aria-label
- [ ] Game is playable with keyboard only
- [ ] No reliance on color alone (shapes distinguish start/end)
