# Game Controls

## Desktop (PC)

### Mouse Mode (Default)
- **Move**: Move your mouse cursor
- **Player follows**: The blue circle (player) will follow your cursor smoothly
- **Stop**: Move cursor away or keep it still

### Keyboard Mode
- **W** or **↑**: Move up
- **A** or **←**: Move left
- **S** or **↓**: Move down
- **D** or **→**: Move right

### Game Controls
- **P**: Pause/Resume game
- **ESC**: Return to menu (when paused)
- **~** (tilde): Toggle debug overlay

---

## Mobile (Smartphone/Tablet)

### Drag Mode
- **Tap and drag**: Touch and drag the player towards your desired direction
- **Release**: Lift your finger to stop the player's movement
- **Smooth movement**: The player will slide smoothly in the direction you dragged

### Touch Controls
- Single touch to control player position
- Multi-touch (pinch) is prevented to avoid conflicts

### Game Controls
- **Menu button**: Tap "Pause" button visible during game
- **Portrait/Landscape**: Game adapts to any orientation

---

## Settings Menu

Access settings from the main menu or pause menu.

### Available Settings

1. **Control Mode**
   - Mouse Follow: Cursor-based movement (desktop)
   - WASD / Arrows: Keyboard-based movement (desktop)
   - Drag: Touch drag movement (mobile/desktop)

2. **Sound Effects**
   - Toggle on/off (saved to localStorage)

3. **Vibration**
   - Toggle haptic feedback on/off for collisions
   - Only works on supported devices

4. **Difficulty** (future feature)
   - Easy, Normal, Hard
   - Affects initial maze size

---

## Gameplay Tips

### Navigation
- The **green circle** is your start position
- The **orange circle** is your goal
- **Dark walls** block your path
- Find the path and reach the goal!

### Strategy
- Plan your route by observing the maze
- Avoid hitting walls (they slow you down)
- Complete levels faster for better times
- Retry levels to improve your score

### Controls Tips
- **Mouse mode**: Slow, precise movements near walls
- **Keyboard mode**: Good for precise turning
- **Drag mode**: Natural mobile experience

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| W / ↑ | Move up |
| A / ← | Move left |
| S / ↓ | Move down |
| D / → | Move right |
| P | Pause/Resume |
| ESC | Menu (when paused) |
| ~ | Debug overlay |
| ? | This help (in future) |

---

## Mobile Gestures

| Gesture | Action |
|---------|--------|
| Single touch | Select buttons |
| Drag | Move player |
| Tap | Confirm selection |
| Two-finger pinch | Prevented (no zoom) |
| Swipe | Drag player movement |

---

## Accessibility

- **Large buttons**: 48×48px minimum touch targets
- **High contrast**: Colors chosen for visibility
- **Clear indicators**: Start (green) and goal (orange) are distinct
- **Responsive feedback**: Visual and haptic feedback on actions

---

## Troubleshooting

**Player not moving?**
- Check that your control mode is correct in Settings
- For mouse: make sure you're clicking/pressing in the game area
- For keyboard: ensure the game window has focus

**Touch input not working?**
- Check if you're using single touch (multi-touch is blocked)
- Ensure browser allows touch events
- Try refreshing the page

**Haptic feedback not working?**
- Not all devices support vibration API
- Enable "Vibration" in Settings
- Some browsers may require user interaction first

---

For more help, check the main README.md or enable debug overlay with the ~ key.
