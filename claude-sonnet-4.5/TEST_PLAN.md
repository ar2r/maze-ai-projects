# 🧪 Maze Runner - Comprehensive Test Plan

## Test Strategy

This document outlines the testing approach for the Maze Runner game, covering unit tests, integration tests, manual testing procedures, and edge cases.

---

## 1. Automated Unit Tests

### 1.1 Maze Generation (`tests/maze.test.ts`)

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Valid Maze Structure | Generate maze and verify dimensions | Correct width × height grid |
| Boundary Positions | Check start/finish within bounds | Positions inside maze area |
| Reachability | Verify path exists from start to finish | `isReachable()` returns true |
| Progressive Difficulty | Compare sizes across levels | Level 10 > Level 5 > Level 1 |
| Cell Initialization | All cells have proper wall structure | All 4 walls defined as booleans |
| Deterministic Generation | Same seed produces same maze | Identical wall configurations |
| Wall Removal | At least some walls removed | Not all cells fully enclosed |
| Path Length | Calculate shortest path | ≥ Manhattan distance |

**Run:** `npm test maze.test.ts`

### 1.2 Collision Detection (`tests/collision.test.ts`)

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Wall Collision | Move player through wall | Position corrected/blocked |
| Boundary Clamping | Move player outside maze | Clamped to maze bounds |
| Open Space Movement | Move in valid area | Movement allowed |
| Wall Penetration | Rapid movement through wall | Cannot pass through |
| Finish Zone Detection | Player at finish | `isInFinishZone()` returns true |
| Finish Zone Range | Player near finish | Detected within threshold |

**Run:** `npm test collision.test.ts`

### 1.3 Random Number Generator

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Unique Seeds | Different levels → different seeds | Seed values differ |
| Reproducibility | Same inputs → same seed | Seed values match |

---

## 2. Manual Testing Checklist

### 2.1 Desktop Testing (Windows/macOS/Linux)

#### Browsers
- [ ] **Chrome** (latest)
- [ ] **Firefox** (latest)
- [ ] **Safari** (macOS)
- [ ] **Edge** (latest)

#### Functionality
- [ ] Game loads without errors
- [ ] Menu displays correctly
- [ ] Mouse follow control works
- [ ] Mouse drag control works
- [ ] Keyboard (WASD) controls work
- [ ] Keyboard (Arrow keys) controls work
- [ ] Settings persist after reload
- [ ] Progress saves to localStorage
- [ ] Sound effects play
- [ ] Debug overlay displays correct info
- [ ] Pause/Resume works
- [ ] Level completion triggers results screen
- [ ] Next level increments difficulty
- [ ] Retry level restarts correctly
- [ ] Quit returns to menu with progress saved

#### Performance
- [ ] FPS stays at ~60 during gameplay
- [ ] No visible lag when moving
- [ ] Maze renders instantly
- [ ] No memory leaks after 10+ levels

### 2.2 Mobile Testing (iOS/Android)

#### Devices
- [ ] **iPhone** (iOS 14+)
- [ ] **iPad** (iOS 14+)
- [ ] **Android Phone** (Android 10+)
- [ ] **Android Tablet** (Android 10+)

#### Portrait Orientation
- [ ] Game loads and displays correctly
- [ ] Virtual joystick appears
- [ ] Joystick controls player smoothly
- [ ] Touch doesn't trigger page scroll
- [ ] No zoom on double-tap
- [ ] UI elements are readable
- [ ] Buttons are easily tappable (min 44×44px)

#### Landscape Orientation
- [ ] Game adapts to landscape
- [ ] Joystick remains accessible
- [ ] HUD doesn't overlap gameplay
- [ ] Canvas resizes correctly

#### Performance
- [ ] FPS ≥ 30 on mid-range devices
- [ ] FPS ≥ 50 on high-end devices
- [ ] No janky touch response
- [ ] Vibration works (if enabled)

### 2.3 Touch/Pointer Events

| Test Case | Device | Action | Expected Result |
|-----------|--------|--------|-----------------|
| Single touch | Mobile | Touch joystick | Player moves |
| Multi-touch | Mobile | Two fingers on screen | Only joystick touch registered |
| Fast swipes | Mobile | Rapid joystick movements | Smooth, no lag |
| Touch release | Mobile | Release joystick | Player stops with friction |
| Mouse click | Desktop | Click canvas | Player follows cursor |
| Mouse drag | Desktop | Drag on canvas | Player follows drag path |
| Pointer cancel | Both | Touch interrupt (notification) | Game pauses gracefully |

---

## 3. Edge Cases Testing

### 3.1 Browser/System Events

| Scenario | Steps | Expected Behavior |
|----------|-------|-------------------|
| **Window Resize** | Resize browser window during game | Canvas resizes, game continues |
| **Orientation Change** | Rotate device (mobile) | Game pauses briefly, resizes, resumes |
| **Tab Switch** | Switch to another tab mid-game | Game continues (or pauses if visibility API used) |
| **Browser Back** | Press browser back button | Game state preserved, or confirmation dialog |
| **Page Reload** | Refresh page mid-level | Returns to menu, progress to last completed level saved |
| **Low Battery** | Play with low battery | Performance may degrade, but no crashes |

### 3.2 Input Edge Cases

| Scenario | Steps | Expected Behavior |
|----------|-------|---|
| **Simultaneous Keys** | Press W+A+S+D at same time | Player stops (cancel out) or moves diagonally correctly |
| **Key Spam** | Rapidly tap arrow keys | Smooth movement, no stuttering |
| **Mouse Rapid Movement** | Move cursor very fast | Player follows smoothly, no teleporting |
| **Joystick Fast Swipe** | Swipe joystick very quickly | Player accelerates up to max speed |
| **Joystick Outside Base** | Drag finger far from joystick | Clamped to max radius |
| **Dead Zone** | Tiny joystick movements | No movement if below dead zone threshold |

### 3.3 Game State Edge Cases

| Scenario | Steps | Expected Behavior |
|----------|-------|---|
| **Pause During Movement** | Pause while moving | Player stops immediately |
| **Collision Spam** | Hold player against wall | Collision sound debounced (not spamming) |
| **Finish Line Glitch** | Rapidly enter/exit finish zone | Completes only once |
| **Restart During Animation** | Restart while player moving | Player resets to start, trail cleared |
| **Settings Change Mid-Game** | Change control mode during play | New control takes effect immediately |
| **LocalStorage Full** | Fill localStorage externally | Game handles error gracefully, uses defaults |
| **Corrupt Save Data** | Manually corrupt localStorage JSON | Game resets to defaults, no crash |

### 3.4 Performance Edge Cases

| Scenario | Steps | Expected Behavior |
|----------|-------|---|
| **Very Large Maze** | Reach level 50+ | Still playable, FPS may drop but ≥ 30 |
| **Long Play Session** | Play for 30+ minutes | No memory leaks, performance stable |
| **Rapid Level Changes** | Next → Retry → Next repeatedly | No performance degradation |
| **Debug Mode Enabled** | Play with debug overlay | FPS counter updates, no impact on gameplay |

---

## 4. Accessibility Testing

| Feature | Test | Expected |
|---------|------|----------|
| **Keyboard Only** | Play using only keyboard | Fully playable without mouse |
| **Touch Only** | Play using only touch (no stylus) | Fully playable on mobile |
| **Color Blindness** | Check contrast ratios | Walls/player/finish distinguishable |
| **Screen Readers** | Use VoiceOver/TalkBack | Basic navigation possible (menu) |
| **Large Text** | Increase browser text size | UI scales reasonably |

---

## 5. Cross-Browser Compatibility

### 5.1 Feature Support Matrix

| Feature | Chrome | Firefox | Safari | Edge | Notes |
|---------|--------|---------|--------|------|-------|
| Canvas API | ✅ | ✅ | ✅ | ✅ | Core rendering |
| Pointer Events | ✅ | ✅ | ✅ | ✅ | Touch/mouse unified |
| Web Audio API | ✅ | ✅ | ✅ | ✅ | May need user interaction to start |
| LocalStorage | ✅ | ✅ | ✅ | ✅ | 5-10MB limit |
| Vibration API | ✅ | ❌ | ❌ | ✅ | Android/Chrome only |
| HiDPI Canvas | ✅ | ✅ | ✅ | ✅ | devicePixelRatio |

### 5.2 Known Issues

| Browser | Issue | Workaround |
|---------|-------|------------|
| Safari (iOS) | Audio may not play on first tap | Resume audio context on first touch |
| Firefox | Slight rendering differences | No major impact |
| Safari (macOS) | Vibration API not supported | Gracefully degrades (no error) |

---

## 6. Performance Benchmarks

### 6.1 Target Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Initial Load Time** | < 2s | Time to interactive |
| **FPS (Desktop)** | 60 FPS | Debug overlay |
| **FPS (Mobile)** | 30-60 FPS | Debug overlay |
| **Maze Generation** | < 100ms | Console.time() |
| **Memory Usage** | < 100MB | Chrome DevTools |
| **Bundle Size** | < 200KB | Vite build output |

### 6.2 Performance Test Cases

1. **Load Test**: Open game in incognito mode, measure time to first paint
2. **FPS Test**: Play level 10 with debug mode, record average FPS
3. **Memory Test**: Play 20 levels, check for memory leaks in DevTools
4. **Stress Test**: Generate level 100 (if reachable), verify no crash

---

## 7. Regression Testing

After any code changes, verify:

- [ ] All unit tests pass (`npm test`)
- [ ] Game loads without console errors
- [ ] Controls still work on desktop and mobile
- [ ] Settings persist correctly
- [ ] Level progression works
- [ ] No visual glitches

---

## 8. Test Reporting

### 8.1 Bug Report Template

```markdown
**Title**: [Brief description]

**Severity**: Critical / High / Medium / Low

**Environment**:
- Browser: [Chrome 120 / Safari 17 / etc.]
- OS: [Windows 11 / iOS 17 / etc.]
- Device: [Desktop / iPhone 13 / etc.]

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. ...

**Expected Behavior**: [What should happen]

**Actual Behavior**: [What actually happens]

**Screenshots/Video**: [If applicable]

**Debug Info**: [Seed, level, FPS from debug overlay]
```

---

## 9. Test Execution Schedule

### Pre-Release Checklist

- [ ] Run all unit tests
- [ ] Manual test on 3+ desktop browsers
- [ ] Manual test on 2+ mobile devices (iOS + Android)
- [ ] Performance benchmarks pass
- [ ] No console errors
- [ ] Edge cases verified
- [ ] README and documentation updated

---

## 10. Tools Used

- **Unit Testing**: Vitest
- **Browser Testing**: Chrome DevTools, Firefox DevTools, Safari Web Inspector
- **Mobile Testing**: Physical devices + Chrome Remote Debugging
- **Performance**: Chrome Lighthouse, DevTools Performance tab
- **Cross-browser**: BrowserStack (optional) or manual testing

---

## Summary

This test plan covers:
- ✅ **Automated Tests**: 16+ unit tests for maze generation and collision
- ✅ **Manual Tests**: Desktop and mobile checklists
- ✅ **Edge Cases**: 20+ scenarios covering input, state, and performance
- ✅ **Browsers**: Chrome, Firefox, Safari, Edge
- ✅ **Devices**: Desktop, mobile (iOS/Android), tablets
- ✅ **Performance**: FPS, memory, bundle size benchmarks

**Status**: Ready for testing and deployment 🚀
