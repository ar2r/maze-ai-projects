# Quick Start Guide

## 🚀 Installation & Setup

### Prerequisites
- **Node.js 16+** and **npm**
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Setup (1 minute)

```bash
cd copilot-haiku-4.5

# Install dependencies
npm install

# Start development server
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## 🎮 First Game

1. Click "New Game" on the main menu
2. Level 1 loads with a 10×10 random maze
3. Blue circle = you, Green = start, Orange = finish
4. **Desktop**: Move your mouse to guide the player
5. **Mobile**: Tap and drag to move the player
6. Reach the orange circle to complete the level
7. See your score and proceed to Level 2

---

## 📱 Control Modes

### Desktop (Default: Mouse Follow)
- Move your cursor, player follows
- Switch to WASD/Arrows in Settings

### Mobile (Drag Mode)
- Tap and drag the player in desired direction
- Works in both portrait and landscape

### Keyboard (Desktop)
- **W/↑**: Up
- **A/←**: Left
- **S/↓**: Down
- **D/→**: Right

---

## ⌨️ Game Controls

| Key | Action |
|-----|--------|
| **P** | Pause/Resume |
| **ESC** | Menu |
| **~** | Toggle debug overlay |

---

## 📊 Debug Mode

Add `?debug` to the URL to enable debug overlay:
```
http://localhost:5173?debug
```

Or press **~** during gameplay to toggle.

**Shows**:
- FPS (Frames per second)
- Current maze seed
- Grid size
- Player position
- Wall collision count

---

## 🔨 Available Commands

```bash
npm run dev       # Start dev server (auto-reload)
npm run build     # Build for production
npm run preview   # Preview production build
npm run test      # Run unit tests
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `src/main.ts` | Game entry point |
| `src/game/maze-gen.ts` | Maze generation algorithm |
| `src/game/collision.ts` | Physics & collisions |
| `src/game/game-loop.ts` | Main game update/render |
| `src/render/renderer.ts` | Canvas rendering |
| `src/ui/menu.ts` | Menus and HUD |
| `README.md` | Full documentation |
| `ARCHITECTURE.md` | Technical details |
| `CONTROLS.md` | Complete control guide |

---

## 🎯 Features

✅ Procedurally generated mazes (DFS backtracker)
✅ Progressive difficulty (levels get harder)
✅ Smooth physics with wall collision
✅ Multiple control modes (mouse, keyboard, touch)
✅ Progress saving (localStorage)
✅ Responsive design (mobile & desktop)
✅ Debug overlay for development
✅ Unit tests for core systems
✅ High-DPI display support
✅ No external dependencies (Vite only)

---

## 🐛 Troubleshooting

**Port 5173 already in use?**
```bash
npm run dev -- --port 3000  # Use different port
```

**Build fails?**
```bash
rm -rf node_modules dist package-lock.json
npm install
npm run build
```

**Tests not running?**
```bash
node tests/run-tests.js   # Run directly
```

**Game not loading?**
- Check browser console (F12 → Console tab)
- Make sure you ran `npm install`
- Try force-refresh (Ctrl+Shift+R or Cmd+Shift+R)

---

## 📚 Documentation

- **README.md** - Full project overview
- **ARCHITECTURE.md** - Technical architecture
- **CONTROLS.md** - Detailed control guide
- **tests/qa-checklist.md** - QA test plan

---

## 🎲 How It Works (30 seconds)

1. **Generation**: Each level generates a unique random maze using DFS algorithm
2. **Seeded RNG**: Same seed = same maze (reproducible)
3. **Physics**: Player is a circle, collides with wall rectangles
4. **Control**: Input system handles keyboard/mouse/touch
5. **Game Loop**: Updates physics, checks collisions, detects goal
6. **Rendering**: Draws maze walls once, player each frame
7. **Save**: Progress stored in browser's localStorage

---

## 🎓 Learning Path

**New to the codebase?**

1. Start with `README.md` - Overview
2. Read `ARCHITECTURE.md` - How it's organized
3. Explore `src/game/types.ts` - Data structures
4. Check `src/game/maze-gen.ts` - Understand maze generation
5. Look at `src/main.ts` - Game initialization flow

**Want to modify something?**
- Settings: `src/game/state.ts`
- Controls: `src/game/input.ts`
- Physics: `src/game/collision.ts`
- UI: `src/ui/menu.ts`
- Styles: `src/styles/main.css`

---

## 🚢 Deployment

Build for production:
```bash
npm run build
```

This creates optimized files in `dist/` folder.

**Deploy to**:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting

---

## 💡 Tips

- **Better times**: Plan your route before moving
- **Less collisions**: Move smoothly, avoid jerky inputs
- **Keyboard mode**: More precise turns than mouse
- **Mobile tip**: Avoid touching screen edges during play
- **Debug**: Press ~ to see real-time FPS and stats

---

## 🎉 You're Ready!

```bash
npm run dev
```

Then navigate to **http://localhost:5173** and enjoy the game!

---

## 🆘 Need Help?

1. **Stuck on a level?**: There's always a path from start to finish
2. **Poor FPS?**: Check with debug overlay (~), ensure browser isn't busy
3. **Touch not working?**: Single touch only, multi-touch is blocked
4. **Can't save progress?**: Browser must allow localStorage

Check console (F12) for any error messages.

---

**Happy maze running! 🐭🎮**
