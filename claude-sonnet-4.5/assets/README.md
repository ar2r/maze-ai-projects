# 📸 Screenshots & Assets

## Current Screenshots

This folder contains SVG illustrations of the game screens:

- `screenshot-menu.svg` - Main menu screen
- `screenshot-game.svg` - Gameplay view with maze
- `screenshot-results.svg` - Level completion screen
- `screenshot-mobile.svg` - Mobile version with joystick

These are **programmatically generated SVG files** that provide a visual representation of the game without needing to run it.

---

## How to Replace with Real Screenshots

If you want to replace these SVG illustrations with actual screenshots from the running game:

### 1. Run the Game

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### 2. Take Screenshots

#### Desktop Screenshots

**Main Menu:**
- Navigate to the main menu
- Press `F12` to open DevTools
- Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
- Type "screenshot" and select "Capture screenshot"
- Save as `screenshot-menu.png`

**Gameplay:**
- Start a new game (Level 3-5 recommended for good maze complexity)
- Position yourself in the middle of the maze
- Take screenshot
- Save as `screenshot-game.png`

**Results:**
- Complete a level
- When results screen appears, take screenshot
- Save as `screenshot-results.png`

#### Mobile Screenshot

**Option 1: Using Chrome DevTools**
1. Open DevTools (`F12`)
2. Click "Toggle Device Toolbar" (phone icon) or press `Cmd+Shift+M`
3. Select "iPhone 12 Pro" or similar device
4. Navigate through the game
5. Take screenshot using DevTools screenshot feature
6. Save as `screenshot-mobile.png`

**Option 2: Real Device**
1. Build and deploy the game to a test server
2. Open on your phone
3. Take native screenshot
4. Transfer to your computer
5. Save as `screenshot-mobile.png`

### 3. Optimize Images

```bash
# Install optimization tools (optional)
npm install -g imagemin-cli imagemin-pngquant

# Optimize PNGs
imagemin screenshot-*.png --plugin=pngquant --out-dir=./
```

Or use online tools:
- [TinyPNG](https://tinypng.com/)
- [Squoosh](https://squoosh.app/)

### 4. Update README.md

Replace the SVG references with PNG:

```markdown
### Main Menu
<img src="assets/screenshot-menu.png" width="300" alt="Main Menu">

### Gameplay
<img src="assets/screenshot-game.png" width="450" alt="Gameplay">

### Level Complete
<img src="assets/screenshot-results.png" width="300" alt="Results Screen">

### Mobile Version
<img src="assets/screenshot-mobile.png" width="280" alt="Mobile Gameplay">
```

---

## Recommended Screenshot Settings

For best results:

### Desktop Screenshots
- **Resolution**: 1920x1080 or higher
- **Format**: PNG (lossless)
- **Level**: 5-7 (good balance of complexity)
- **Theme**: Default dark theme

### Mobile Screenshots
- **Device**: iPhone 12 Pro (390x844) or similar
- **Format**: PNG
- **Level**: 3-5 (fits mobile screen better)
- **Orientation**: Portrait

---

## Tips for Great Screenshots

1. **Clean HUD**: Make sure time shows meaningful values (not 0:00)
2. **Player Visibility**: Position player in visible area, not at edges
3. **Maze Complexity**: Use mid-level (5-7) for best visual appeal
4. **Lighting**: Use default theme for consistency
5. **No Debug Overlay**: Disable debug mode before taking screenshots

---

## Alternative: Animated GIFs

For even better presentation, create animated GIFs:

### Using LICEcap (Free)
1. Download [LICEcap](https://www.cockos.com/licecap/)
2. Position capture frame over game
3. Record 5-10 seconds of gameplay
4. Save as `gameplay.gif`

### Using Gifski (High Quality)
```bash
# Install
brew install gifski

# Record screen with QuickTime
# Then convert to GIF
gifski recording.mov -o gameplay.gif --quality 90 --fps 30
```

Add to README:
```markdown
### Gameplay Demo
<img src="assets/gameplay.gif" width="450" alt="Gameplay Demo">
```

---

## Current SVG Files

The included SVG files are:
- ✅ Vector graphics (scale to any size)
- ✅ Small file size (~5-10 KB each)
- ✅ No runtime needed to view
- ✅ Editable if you want to customize

However, real screenshots will:
- ✅ Show actual game rendering
- ✅ Display real fonts and effects
- ✅ Include canvas rendering details
- ✅ Look more authentic

**Both approaches are valid!** Use SVGs for lightweight previews, or real screenshots for authentic representation.
