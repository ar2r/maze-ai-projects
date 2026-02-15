# 🚀 Quick Start Guide

## Installation & Running

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Open your browser to `http://localhost:5173` (or the URL shown in terminal).

### 3. Build for Production

```bash
npm run build
```

Output files will be in `dist/` directory.

### 4. Preview Production Build

```bash
npm run preview
```

### 5. Run Tests

```bash
npm test
```

---

## 🎮 Controls

### Desktop
- **Mouse**: Click and move cursor to guide the ball
- **Keyboard**: WASD or Arrow keys to move

### Mobile
- **Virtual Joystick**: Drag the joystick in bottom-left corner

---

## 🎯 Gameplay

1. **Start**: Click "New Game" or "Continue"
2. **Navigate**: Move from green 🏁 to orange 🎯 marker
3. **Avoid Walls**: Each collision is tracked
4. **Complete Level**: Reach the finish to unlock next level
5. **Progress**: Your best times and level progress are saved automatically

---

## 📁 Project Structure

```
src/
├── main.ts              # Entry point
├── config.ts            # Game settings
├── maze/                # Maze generation (DFS)
├── game/                # Game loop, physics, input
├── render/              # Canvas rendering
└── ui/                  # UI management
```

---

## 🔧 Configuration

Edit `src/config.ts` to customize:

- Maze size and growth rate
- Player speed and size
- Difficulty progression
- Colors and visual settings

---

## 🧪 Testing

All tests are in `tests/` directory:

- `maze.test.ts` - Maze generation and validation
- `collision.test.ts` - Collision detection

Run with: `npm test`

---

## 📊 Debug Mode

Enable in **Settings** to see:
- FPS counter
- Maze seed (for reproducibility)
- Player position
- Collision count

---

## 🌐 Browser Compatibility

- **Desktop**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Android 90+

---

## 🎨 Features

✅ Fully client-side (no backend)
✅ Random maze generation (DFS algorithm)
✅ Progressive difficulty
✅ LocalStorage save system
✅ Touch and keyboard controls
✅ Sound effects and haptics
✅ HiDPI support
✅ Mobile-first responsive design

---

## 📝 Notes

- All game progress is saved in browser's LocalStorage
- Mazes are generated using a seeded RNG (reproducible)
- Each level increases maze size by 2 cells
- Collision physics includes wall sliding

---

**Have fun! 🎮**
