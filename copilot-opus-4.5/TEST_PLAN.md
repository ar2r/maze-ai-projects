# Maze Game - QA Test Plan

## Overview
Comprehensive test checklist for the maze game covering functionality, performance, and cross-platform compatibility.

---

## 1. Maze Generation Tests

### Connectivity
- [ ] All mazes are solvable (path exists from start to finish)
- [ ] No isolated cells (all cells reachable)
- [ ] No "holes" in walls (wall pairs are consistent)
- [ ] Outer boundaries are always solid

### Difficulty Progression
- [ ] Level 1 starts at 8x8 grid
- [ ] Each level increases maze size by 2x2
- [ ] Maximum size caps at 40x40
- [ ] Cell size decreases appropriately with level

### Determinism
- [ ] Same level number produces identical maze
- [ ] Maze is reproducible with known seed
- [ ] Restarting level produces same maze

---

## 2. Player Controls

### Keyboard (Desktop)
- [ ] W / Arrow Up moves player up
- [ ] S / Arrow Down moves player down
- [ ] A / Arrow Left moves player left
- [ ] D / Arrow Right moves player right
- [ ] Diagonal movement with two keys works
- [ ] Diagonal movement is not faster than cardinal
- [ ] Key release stops movement immediately

### Mouse (Desktop)
- [ ] Player follows cursor when mouse on canvas
- [ ] Player stops when cursor exits canvas
- [ ] Player stops near cursor (no jitter)
- [ ] Movement respects wall collisions

### Touch (Mobile)
- [ ] Virtual joystick appears on mobile devices
- [ ] Joystick responds to touch drag
- [ ] Joystick has appropriate dead zone
- [ ] Knob returns to center on release
- [ ] Multi-touch doesn't break controls
- [ ] Joystick doesn't interfere with page scroll (outside canvas)

---

## 3. Collision Detection

### Wall Collisions
- [ ] Player cannot pass through walls
- [ ] Player slides along walls smoothly
- [ ] No wall "sticking" (player gets stuck)
- [ ] Corner collisions handled properly
- [ ] Collision counter increments on hit
- [ ] Visual flash on collision
- [ ] Vibration feedback on mobile (if enabled)

### Boundary Collisions
- [ ] Player cannot exit maze bounds
- [ ] All four edges are solid

### Win Condition
- [ ] Reaching green exit zone triggers level complete
- [ ] Partial overlap with exit zone counts as win
- [ ] Win doesn't trigger prematurely

---

## 4. Game Flow

### Menu System
- [ ] Main menu displays on load
- [ ] "New Game" starts at level 1
- [ ] "Continue" resumes at saved level
- [ ] "Continue" disabled if no save exists
- [ ] Settings opens settings panel
- [ ] Back button returns to main menu

### Settings
- [ ] Sound toggle works
- [ ] Vibration toggle works
- [ ] Timer toggle shows/hides HUD timer
- [ ] Settings persist after page reload

### Pause/Resume
- [ ] ESC key pauses game (desktop)
- [ ] Pause button works (mobile)
- [ ] Resume continues from same position
- [ ] Timer pauses when game paused
- [ ] Tab visibility change pauses game

### Level Complete
- [ ] Results show after reaching exit
- [ ] Correct time displayed
- [ ] Correct wall hit count displayed
- [ ] "New Best Time" shows when applicable
- [ ] "Next Level" advances to next level
- [ ] "Retry" restarts same level
- [ ] Progress saved to localStorage

---

## 5. UI/UX

### Responsive Layout
- [ ] Works on 360x640 mobile screen
- [ ] Works on 1920x1080 desktop screen
- [ ] Maze fits within viewport with padding
- [ ] UI elements don't overlap
- [ ] Text is readable at all sizes

### HiDPI Support
- [ ] Canvas renders sharply on Retina displays
- [ ] No blurriness on high-DPI screens

### Accessibility
- [ ] Buttons have focus styles (tab navigation)
- [ ] Touch targets are min 44x44px
- [ ] Sufficient color contrast
- [ ] Controls instructions visible

### Visual Feedback
- [ ] Start zone clearly marked (blue)
- [ ] Exit zone clearly marked (green)
- [ ] Player has visible glow effect
- [ ] Collision flash visible
- [ ] Level number in HUD
- [ ] Timer in HUD (if enabled)

---

## 6. Performance

### Frame Rate
- [ ] Maintains 60 FPS on desktop
- [ ] Maintains 60 FPS on mid-range mobile
- [ ] No frame drops during player movement
- [ ] Large mazes (40x40) remain smooth

### Memory
- [ ] No memory leaks over extended play
- [ ] Offscreen canvas properly managed
- [ ] Level transitions don't accumulate memory

### Rendering
- [ ] Maze only re-renders on level change
- [ ] Player rendering is efficient
- [ ] Debug overlay has minimal impact

---

## 7. Edge Cases

### Input Handling
- [ ] Very fast swipes don't break collision
- [ ] Rapid key tapping works correctly
- [ ] Multiple touch points don't conflict
- [ ] Input works after tab regains focus

### State Transitions
- [ ] Pausing during collision is safe
- [ ] Winning while moving works correctly
- [ ] Resize during gameplay adapts properly
- [ ] Orientation change works (mobile)

### Storage
- [ ] Works when localStorage is full
- [ ] Works when localStorage is disabled
- [ ] Corrupted save data doesn't crash game

---

## 8. Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Chrome Android
- [ ] Safari iOS
- [ ] Samsung Internet

### Features
- [ ] Canvas 2D rendering works
- [ ] localStorage works
- [ ] Vibration API (mobile)
- [ ] Pointer events
- [ ] Touch events
- [ ] requestAnimationFrame

---

## 9. Debug Mode

- [ ] F3 toggles debug overlay
- [ ] FPS counter updates correctly
- [ ] Seed displays current maze seed
- [ ] Size displays maze dimensions
- [ ] Position updates in real-time
- [ ] Hit count matches actual collisions
- [ ] Debug state persists in localStorage

---

## Test Execution Notes

### Manual Test Setup
1. Run `npm run dev` to start development server
2. Open http://localhost:5173 in browser
3. Use browser DevTools for mobile emulation

### Performance Testing
- Use Chrome DevTools Performance tab
- Monitor FPS with debug overlay (F3)
- Test on actual mobile devices for accurate results

### Mobile Testing
- Test on real devices when possible
- iOS Safari has unique touch handling
- Android Chrome and Firefox may differ

---

## Sign-off

| Tester | Platform | Date | Pass/Fail |
|--------|----------|------|-----------|
|        | Desktop Chrome | | |
|        | Desktop Firefox | | |
|        | Desktop Safari | | |
|        | Mobile iOS Safari | | |
|        | Mobile Android Chrome | | |
