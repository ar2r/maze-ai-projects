# Test Plan - Maze Game

## Manual Testing Checklist

### Desktop Testing

#### Chrome/Edge
- [ ] Game starts and menu displays correctly
- [ ] Mouse controls work (click and drag)
- [ ] Mouse follow mode works (just move mouse)
- [ ] Keyboard controls work (WASD + arrows)
- [ ] Diagonal keyboard movement works correctly
- [ ] Pause with ESC key
- [ ] Collision detection prevents wall passage
- [ ] Player slides along walls smoothly
- [ ] Level completion triggers correctly
- [ ] Settings save and persist
- [ ] Sound effects play on collision and completion
- [ ] Best time tracking works
- [ ] Canvas scales properly on window resize
- [ ] Game works in fullscreen mode

#### Firefox
- [ ] Same as Chrome tests above
- [ ] Audio context works correctly
- [ ] Canvas rendering is smooth
- [ ] No console errors

#### Safari
- [ ] Same as Chrome tests above
- [ ] Touch events don't conflict
- [ ] Audio playback works (may need user gesture first)
- [ ] HiDPI rendering is crisp

### Mobile Testing (Portrait & Landscape)

#### Android Chrome
- [ ] Virtual joystick appears and works
- [ ] Joystick doesn't trigger page scroll
- [ ] Pinch-zoom is disabled during gameplay
- [ ] Touch drag moves player correctly
- [ ] Vibration works on collision (if supported)
- [ ] Canvas fills screen appropriately
- [ ] HUD is readable and doesn't overlap
- [ ] Buttons are large enough to tap
- [ ] Orientation change handled gracefully
- [ ] Settings menu is accessible

#### iOS Safari
- [ ] Same as Android tests
- [ ] Viewport meta tags prevent zoom
- [ ] No rubber-band scrolling during gameplay
- [ ] Game works when added to home screen
- [ ] Safe area insets respected (iPhone X+)
- [ ] Audio works (may need user gesture)

### Cross-Platform Features

#### Game Mechanics
- [ ] Level 1 is easy and completable
- [ ] Difficulty increases noticeably by level 10
- [ ] Loops appear starting level 12+
- [ ] Mazes are always solvable (start to end)
- [ ] Same seed produces identical maze
- [ ] Player cannot clip through walls
- [ ] Player cannot escape maze bounds
- [ ] Goal detection works when reaching exit

#### UI/UX
- [ ] All buttons have proper focus states
- [ ] Keyboard navigation works in menus
- [ ] Touch targets are at least 44x44px
- [ ] Animations are smooth (60 FPS target)
- [ ] No visual glitches or flickering
- [ ] Loading is fast (< 2 seconds)
- [ ] Game state persists after page refresh

#### Persistence
- [ ] Progress saves to localStorage
- [ ] Best times are recorded correctly
- [ ] Settings persist across sessions
- [ ] Continue button appears when appropriate
- [ ] Clearing browser data resets progress

### Edge Cases

#### Input Edge Cases
- [ ] Rapid key mashing doesn't break controls
- [ ] Multiple simultaneous keys work correctly
- [ ] Alt-Tab and returning to game works
- [ ] Window blur/focus handled correctly
- [ ] Touch + mouse simultaneously doesn't cause issues
- [ ] Very fast swipes don't cause glitches

#### Rendering Edge Cases
- [ ] Extremely small window (360x640)
- [ ] Very large window (4K resolution)
- [ ] Ultra-wide aspect ratios
- [ ] Portrait orientation on tablet
- [ ] Rapid window resizing
- [ ] Browser zoom (50% to 200%)

#### Game Logic Edge Cases
- [ ] Player starting position is never in a wall
- [ ] End position is always reachable
- [ ] Collision at corners works correctly
- [ ] Fast movement doesn't allow wall clipping
- [ ] Simultaneous collision from multiple directions
- [ ] Reaching goal from different angles

### Performance Testing

- [ ] 60 FPS maintained on mid-range device
- [ ] No memory leaks after 30+ minutes of play
- [ ] No performance degradation on high levels (30+)
- [ ] Smooth on devices from last 3 years
- [ ] Battery drain is reasonable on mobile
- [ ] Page load time < 2 seconds on 3G

### Accessibility

- [ ] Keyboard-only navigation possible
- [ ] Focus indicators are visible
- [ ] Sufficient color contrast (WCAG AA)
- [ ] Text is readable at default size
- [ ] No flashing elements (seizure risk)
- [ ] Touch targets meet accessibility guidelines

## Automated Test Coverage

### Unit Tests (Vitest)
- ✅ Maze generation produces connected graphs
- ✅ RNG is deterministic with same seed
- ✅ Collision detection prevents wall passage
- ✅ Level config scaling works correctly
- ✅ Path validation finds route from start to end

### Integration Tests (TODO)
- [ ] Full game loop runs without errors
- [ ] State transitions work correctly
- [ ] Input triggers proper game responses
- [ ] Rendering completes without exceptions

## Bug Reporting Template

```
**Platform**: (Chrome Desktop / iOS Safari / Android Chrome)
**Device**: (PC / iPhone 13 / Samsung S21)
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected**: 
**Actual**: 
**Screenshot/Video**: 
**Console Errors**: 
```

## Testing Schedule

1. **During Development**: Unit tests on every commit
2. **Pre-Alpha**: Manual desktop testing
3. **Alpha**: Full mobile testing
4. **Beta**: Cross-browser testing
5. **Release**: Final regression test
6. **Post-Release**: Monitor user reports

## Known Limitations

- Audio may not work without user gesture (browser policy)
- Vibration API not supported on all devices
- Some older browsers may have reduced performance
- Offline play works but no cloud sync
