# QA Test Plan - Maze Game

## Test Scope
Complete testing for PC (desktop) and Mobile (iOS/Android) platforms.

## Environment
- **PC**: Windows 10/11, macOS
- **Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS (Safari), Android (Chrome)
- **Screen Resolutions**: 360x640 (mobile), 1920x1080 (desktop)

---

## 1. Functional Testing

### 1.1 Menu System
- [ ] Start Game button initializes level 1
- [ ] Continue button appears only with saved progress
- [ ] Continue loads last played level
- [ ] Settings button opens settings panel
- [ ] Settings persist after restart
- [ ] Main menu displays correctly on mobile (360x640)
- [ ] Main menu displays correctly on desktop (1920x1080)

### 1.2 Gameplay
- [ ] Level loads with random maze
- [ ] Maze is solvable (start to end is always accessible)
- [ ] Player spawns at maze start (green circle)
- [ ] Finish is marked distinctly (orange circle)
- [ ] Player cannot pass through walls
- [ ] Player moves smoothly (not jerky)
- [ ] Player slides along walls naturally
- [ ] Timer counts up during gameplay
- [ ] Collision counter increments on wall hits

### 1.3 Level Progression
- [ ] Each level is different (random generation)
- [ ] Level difficulty increases (grid size grows)
- [ ] Level n has approximately 10 + n*2 cells width/height
- [ ] Completing level shows results screen
- [ ] Results display: time, wall hits, best time
- [ ] Next Level button loads next level
- [ ] Retry button reloads same level
- [ ] Main Menu button returns to menu

### 1.4 Controls - Desktop (Mouse)
- [ ] Mouse following mode works (player follows cursor)
- [ ] Player stops at cursor when not moving
- [ ] WASD movement works
- [ ] Arrow key movement works
- [ ] Movement is smooth and responsive
- [ ] Both control modes can be switched in settings

### 1.5 Controls - Mobile (Touch)
- [ ] Touch drag works (player follows touch)
- [ ] Player stops when touch released
- [ ] No accidental scroll during gameplay
- [ ] Virtual joystick visible and responsive
- [ ] Touch input works in portrait (360x640)
- [ ] Touch input works in landscape
- [ ] Multi-touch (pinch) is prevented

### 1.6 Pause System
- [ ] Press 'P' to pause during gameplay
- [ ] Pause menu shows: Resume, Retry, Main Menu
- [ ] Resume continues from same position
- [ ] Retry resets level
- [ ] Main Menu button returns to menu

### 1.7 Settings
- [ ] Sound toggle visible and functional
- [ ] Vibration toggle visible and functional
- [ ] Control mode dropdown shows all options
- [ ] Settings are saved to localStorage
- [ ] Settings persist after refresh

### 1.8 Data Persistence
- [ ] Current level saved to localStorage
- [ ] Best time per level saved
- [ ] Continue button uses saved level
- [ ] Game data survives browser refresh
- [ ] Clear saves button works (if available)

---

## 2. Performance Testing

### 2.1 FPS & Smoothness
- [ ] Game runs at 60 FPS on desktop
- [ ] Game runs at 30+ FPS on mobile (iPhone/Android mid-range)
- [ ] No stuttering during gameplay
- [ ] No frame drops when maze renders
- [ ] Player movement is smooth

### 2.2 Load Time
- [ ] Initial page load < 2 seconds
- [ ] Level generation < 200ms
- [ ] No freezing when starting new level

### 2.3 Memory
- [ ] No obvious memory leaks over 10+ levels
- [ ] Game doesn't crash after 30 mins of play
- [ ] Switching levels doesn't accumulate memory

---

## 3. UI/UX Testing

### 3.1 Responsiveness
- [ ] UI correctly sized on 360x640 mobile
- [ ] UI correctly sized on 1920x1080 desktop
- [ ] Buttons are at least 48x48px on mobile
- [ ] Text is readable on all screen sizes
- [ ] No UI overlaps on any resolution

### 3.2 Accessibility
- [ ] Buttons have visible focus states
- [ ] Text contrast is sufficient (WCAG AA)
- [ ] Touch targets are large enough (48x48px)
- [ ] Colors are not sole indicator of state

### 3.3 Visual Feedback
- [ ] Player color is distinct (#2196F3 blue)
- [ ] Start is marked in green (#4CAF50)
- [ ] Finish is marked in orange (#FF9800)
- [ ] Walls are dark and visible (#333)
- [ ] Score updates in real-time

### 3.4 Canvas Quality
- [ ] Rendering is crisp (not blurry)
- [ ] High DPI displays show sharp edges
- [ ] No visual artifacts

---

## 4. Input & Interaction Testing

### 4.1 Keyboard Input (Desktop)
- [ ] W key moves up
- [ ] A key moves left
- [ ] S key moves down
- [ ] D key moves right
- [ ] Arrow up/down/left/right work as alternatives
- [ ] Multiple keys can be pressed (combo movement)
- [ ] 'P' key toggles pause
- [ ] '~' key toggles debug overlay

### 4.2 Mouse Input (Desktop)
- [ ] Mouse move updates cursor position
- [ ] Mouse down starts following
- [ ] Mouse up stops movement
- [ ] Rapid mouse movements don't cause glitches
- [ ] Dragging to far corners works

### 4.3 Touch Input (Mobile)
- [ ] Single touch move works
- [ ] Touch drag follows smoothly
- [ ] Rapid tap doesn't cause issues
- [ ] Swipe doesn't trigger page scroll
- [ ] Multi-touch is ignored/prevented
- [ ] Long press doesn't cause context menu

### 4.4 Event Edge Cases
- [ ] Pointer leaves canvas (no crash)
- [ ] Rapid pointer events don't stack
- [ ] Tab loses focus, game pauses/doesn't crash
- [ ] Tab regains focus, game resumes
- [ ] Device rotates (portrait to landscape)
- [ ] Window is resized

---

## 5. Browser Compatibility

### 5.1 Desktop Browsers
- [ ] Chrome (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Edge (latest 2 versions)

### 5.2 Mobile Browsers
- [ ] iOS Safari (iOS 14+)
- [ ] Android Chrome
- [ ] Android Firefox

### 5.3 API Support
- [ ] Canvas 2D context available
- [ ] localStorage available (or graceful fallback)
- [ ] Pointer events working
- [ ] RAF (requestAnimationFrame) working
- [ ] Vibration API (if available)

---

## 6. Device-Specific Testing

### 6.1 Mobile Orientation
- [ ] Portrait mode: maze fits, controls accessible
- [ ] Landscape mode: maze fits, controls accessible
- [ ] Rotating during gameplay doesn't crash
- [ ] Game pauses on orientation change (optional)
- [ ] Exiting fullscreen doesn't break layout

### 6.2 Touch Device Types
- [ ] Finger touch works
- [ ] Stylus touch works (if supported)
- [ ] Fast swiping doesn't cause lag
- [ ] Two-finger pinch is prevented

### 6.3 Common Mobile Issues
- [ ] No unwanted URL bar appearing
- [ ] No body scroll during game
- [ ] No double-tap zoom
- [ ] No context menu on long press
- [ ] Viewport fits entire game

---

## 7. Edge Case Testing

### 7.1 Collision & Physics
- [ ] Player can't get stuck in corners
- [ ] Player can't pass through walls
- [ ] Player bounces off walls naturally
- [ ] Ultra-small grids work (5x5)
- [ ] Ultra-large grids work (20x20)
- [ ] Very fast movement doesn't cause clipping

### 7.2 Level Progression
- [ ] Level 1 is easiest
- [ ] Difficulty visibly increases with levels
- [ ] Can play 20+ levels without issue
- [ ] Each level is unique
- [ ] All levels are solvable

### 7.3 Data & Storage
- [ ] localStorage full (simulated): graceful handling
- [ ] localStorage disabled: game still works (in-memory)
- [ ] Corrupted saved data: reset gracefully
- [ ] Rapid level completion doesn't cause save issues

### 7.4 Performance Edge Cases
- [ ] Spam-clicking buttons doesn't crash
- [ ] Rapidly switching levels works
- [ ] Alt-tab on desktop doesn't break state
- [ ] Minimizing app on mobile doesn't crash
- [ ] Returning from background works

---

## 8. Debug Overlay Testing (URL: ?debug)

- [ ] Debug overlay visible in top-left
- [ ] FPS counter accurate (within ±5 FPS)
- [ ] Seed displayed correctly
- [ ] Grid size displayed correctly
- [ ] Player position updates in real-time
- [ ] Wall hit counter increments on collision
- [ ] ~ key toggles overlay on/off
- [ ] No performance impact when disabled

---

## 9. Random Seed & Reproducibility

- [ ] Same seed produces identical maze
- [ ] Different seeds produce different mazes
- [ ] Seed varies per level (level-dependent)
- [ ] Maze is not completely random (still challenging, solvable)

---

## 10. Sound & Vibration (if implemented)

- [ ] Collision sound plays on wall hit
- [ ] Victory sound plays on level complete
- [ ] Sound toggle mutes all audio
- [ ] Vibration plays on collision
- [ ] Vibration toggle disables haptics
- [ ] Settings persist for audio/vibration

---

## Summary Checklist

| Category | Status | Notes |
|----------|--------|-------|
| Functionality | ⬜ | All core features working |
| Performance | ⬜ | 60 FPS desktop, 30+ FPS mobile |
| UI/UX | ⬜ | Responsive, accessible |
| Input | ⬜ | Keyboard, mouse, touch all working |
| Browser Compat | ⬜ | All major browsers tested |
| Mobile | ⬜ | Portrait & landscape, touch optimized |
| Edge Cases | ⬜ | Handled gracefully |
| Data Persistence | ⬜ | Save/load working |

---

## Bugs Found

(Document any bugs discovered during testing)

1. [Bug #1] ...
2. [Bug #2] ...

---

## Notes

- Game should feel responsive and "snappy"
- Maze should be visually clear and unambiguous
- Controls should feel natural for each input type
- No console errors should appear (unless intentional)

