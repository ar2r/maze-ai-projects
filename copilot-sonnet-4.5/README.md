# Maze Game 🎮

A fully client-side web-based maze game with progressive difficulty, built with TypeScript and HTML5 Canvas.

## Features

✨ **Progressive Difficulty**: Mazes grow larger and more complex with each level  
🎲 **Procedural Generation**: Unique mazes using DFS backtracker algorithm  
🎯 **Cross-Platform Controls**: Mouse, keyboard, and touch support  
💾 **Progress Saving**: Auto-save to localStorage  
📱 **Mobile Optimized**: Responsive design with virtual joystick  
🎨 **Clean UI**: Modern dark theme with smooth animations  
🧪 **Well Tested**: Unit tests for core game logic  

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

The game will open automatically at http://localhost:3000

## How to Play

### Goal
Navigate from the green start point to the orange exit point without touching the walls!

### Controls

**Desktop:**
- **Mouse**: Click and drag or just move the mouse - your character will follow
- **Keyboard**: Use WASD or Arrow keys to move
- **Pause**: Press ESC or click the pause button

**Mobile:**
- **Virtual Joystick**: Use the on-screen joystick in the bottom-left corner
- **Direct Touch**: Tap and drag on the maze

### Gameplay

- Complete each level to unlock the next one
- Try to minimize collisions and complete time
- Levels get progressively harder with:
  - Larger grid sizes
  - Narrower corridors
  - More complex paths
  - Additional loops (from level 12+)

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── types.ts                # TypeScript type definitions
├── constants.ts            # Game constants and configuration
├── utils/
│   ├── rng.ts              # Seedable random number generator
│   └── math.ts             # Math utility functions
├── maze/
│   ├── generator.ts        # DFS backtracker maze generation
│   ├── validator.ts        # Connectivity validation
│   └── difficulty.ts       # Difficulty scaling logic
├── engine/
│   ├── game.ts             # Main game loop and state management
│   ├── collision.ts        # Collision detection with wall sliding
│   └── player.ts           # Player physics and movement
├── input/
│   └── manager.ts          # Unified input handling (mouse/keyboard/touch)
└── storage/
    └── persistence.ts      # localStorage save/load system
```

## Technical Details

### Technologies
- **TypeScript**: Type-safe game logic
- **Vite**: Fast development and optimized builds
- **HTML5 Canvas**: High-performance rendering
- **Vitest**: Unit testing framework

### Maze Generation
Uses the **DFS (Depth-First Search) Backtracker** algorithm to create perfect mazes:
1. Start at a random cell
2. Mark it as visited
3. While there are unvisited neighbors:
   - Choose a random unvisited neighbor
   - Remove the wall between them
   - Move to that neighbor
4. Backtrack when stuck
5. Optionally add loops for higher difficulty

### Physics & Collision
- **AABB collision detection** for player-wall interactions
- **Wall sliding** algorithm prevents getting stuck in corners
- **Sub-pixel positioning** for smooth movement
- **Velocity-based physics** with acceleration and friction

### Performance
- **Double buffering**: Static maze rendered once to offscreen canvas
- **60 FPS target**: Optimized game loop with delta time
- **HiDPI support**: Automatic scaling for retina displays
- **Minimal allocations**: Reuse objects in game loop

## Testing

Run the test suite:

```bash
npm test           # Run once
npm test -- --watch # Watch mode
npm test -- --ui    # UI mode
```

Tests cover:
- Maze generation (connectivity, determinism, dimensions)
- RNG (determinism, value ranges)
- Collision detection (walls, boundaries)

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Optimized with touch controls

## Development

### Adding New Features

**New Level Config:**
Edit `src/constants.ts` and add to `LEVEL_CONFIGS`

**New Control Scheme:**
Extend `InputManager` in `src/input/manager.ts`

**Visual Changes:**
Edit `public/styles.css` or rendering methods in `src/engine/game.ts`

### Debug Mode

Press `D` during gameplay to toggle debug overlay showing:
- FPS counter
- Current seed
- Grid dimensions
- Player position
- Collision count

## License

MIT

## Credits

Built with ❤️ using TypeScript and HTML5 Canvas  
Maze generation algorithm: DFS Backtracker  
No external game frameworks or libraries!
