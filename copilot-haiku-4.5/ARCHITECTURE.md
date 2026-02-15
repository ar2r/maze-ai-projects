# Architecture Overview

## Project Structure

```
maze-runner/
├── src/
│   ├── game/              # Core game logic
│   │   ├── types.ts       # All TypeScript interfaces and types
│   │   ├── maze-gen.ts    # Procedural maze generation (DFS)
│   │   ├── collision.ts   # Physics & collision detection
│   │   ├── input.ts       # Input event handling
│   │   ├── state.ts       # Game state management
│   │   └── game-loop.ts   # Main game loop & orchestration
│   ├── render/            # Rendering system
│   │   └── renderer.ts    # Canvas rendering with optimization
│   ├── ui/                # User interface
│   │   └── menu.ts        # Menus, dialogs, HUD
│   ├── storage/           # Data persistence
│   │   └── persist.ts     # localStorage wrapper
│   ├── utils/             # Utility functions
│   │   ├── random.ts      # Seedable RNG
│   │   ├── debug.ts       # Debug utilities
│   │   └── math.ts        # Math helpers
│   ├── styles/
│   │   └── main.css       # All game styles
│   └── main.ts            # Application entry point
├── tests/
│   ├── maze-gen.test.ts   # Maze generation tests
│   ├── collision.test.ts  # Collision detection tests
│   ├── qa-checklist.md    # QA test plan
│   └── run-tests.js       # Test runner
├── index.html             # HTML entry point
├── package.json           # Dependencies & scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite build configuration
└── README.md              # Project documentation
```

---

## Core Systems

### 1. Maze Generation (`game/maze-gen.ts`)

**Algorithm**: Depth-First Search (DFS) Backtracker

**Features**:
- Generates "perfect" mazes (exactly one path between any two cells)
- Fully deterministic with seed-based RNG
- Guaranteed solvable (start always connects to end)
- O(w×h) time complexity

**Key Functions**:
- `generateMaze()`: Creates maze from dimensions and seed
- `validateMazeConnectivity()`: Verifies all cells are reachable
- `getMazeWalls()`: Converts grid to renderable wall segments

**Difficulty Scaling**:
```
Level N:
  Width = 10 + N×0.5
  Height = 10 + N×0.5
  Cell Size = smaller as levels progress
```

---

### 2. Collision & Physics (`game/collision.ts`)

**Detection Methods**:
- **AABB-to-AABB**: For wall-to-wall (not used directly)
- **Circle-to-AABB**: Player (circle) vs walls (boxes)

**Physics**:
- Gravity: Disabled (2D topdown)
- Friction: 0.92 per frame
- Max velocity: 8 pixels/frame
- Wall sliding: Natural bounce with friction

**Key Functions**:
- `circleAabbIntersect()`: Check collision
- `resolveCollision()`: Push player out + apply friction
- `updatePlayerPhysics()`: Apply velocity and gravity
- `movePlayerTowardTarget()`: Mouse following mode
- `movePlayerByInput()`: Keyboard mode
- `isPlayerAtGoal()`: Goal detection

**Performance**:
- Spatial hashing could be added for very large mazes
- Current grid size (20×20 max) doesn't require optimization

---

### 3. Input System (`game/input.ts`)

**Event Types**:
- **Pointer Events**: Unified mouse/touch input
- **Keyboard Events**: WASD and arrow keys
- **Touch Events**: Multi-touch prevention

**Input State**:
```typescript
InputState {
  keyboard: { up, down, left, right }
  mouse: { x, y }
  mousePressed: boolean
  touch: { x, y } | null
  touchPressed: boolean
}
```

**Features**:
- Unified pointer API for compatibility
- Prevents default actions (context menu, zoom)
- No event bubbling conflicts

---

### 4. Game State Machine (`game/state.ts`)

**States**:
```
┌─────────────┐
│   MENU      │
└──────┬──────┘
       │ (start/continue)
       ▼
┌──────────────────┐
│   PLAYING   ◄────┼─── P (pause)
└──┬────────────┬──┘
   │ goal       │ (fail)
   ▼            ▼
LEVEL_COMPLETE MENU
```

**State Data**:
- Current level
- Score (time, wall hits, distance)
- Current maze
- Player position/velocity
- Input state
- Settings (sound, vibration, control mode)

---

### 5. Rendering (`render/renderer.ts`)

**Optimization Strategies**:

1. **Offscreen Canvas Buffer**
   - Maze walls pre-rendered once
   - Drawn via `canvas.drawImage()` each frame
   - Avoids expensive wall drawing

2. **Layer Separation**
   - Layer 1: Maze background + walls (offscreen buffer)
   - Layer 2: Player, effects
   - Minimal redraw per frame

3. **High-DPI Support**
   - Canvas scaled for device pixel ratio
   - Crisp rendering on retina displays

4. **Efficient Clearing**
   - Single fillRect per frame
   - No partial clears

**Rendering Loop**:
```
1. Clear canvas
2. Draw maze (from offscreen buffer)
3. Draw start/end markers
4. Draw player
5. Debug overlay (if enabled)
```

---

### 6. Game Loop (`game/game-loop.ts`)

**Main Loop**:
```
RAF (60 FPS target)
  ├─ Update (logic)
  │  ├─ Process input
  │  ├─ Move player
  │  ├─ Update physics
  │  ├─ Check collisions
  │  └─ Check goal
  │
  └─ Render (visual)
     ├─ Clear
     ├─ Draw maze
     ├─ Draw player
     └─ Update HUD
```

**Time Management**:
- Delta-time capped at 16ms (60 FPS)
- Prevents physics jumps on frame drops
- Smooth movement across devices

---

### 7. UI System (`ui/menu.ts`)

**Screens**:
1. **Main Menu**: Start, Continue, Settings
2. **In-Game HUD**: Level, Timer
3. **Level Complete**: Results, Next/Retry/Menu
4. **Pause Menu**: Resume, Retry, Menu
5. **Settings**: Sound, Vibration, Control Mode

**UI Manager Pattern**:
- Callback-based architecture
- Decoupled from game logic
- Easy to extend/modify

---

### 8. Data Persistence (`storage/persist.ts`)

**Stored Data**:
```json
{
  "currentLevel": 5,
  "levelBestTimes": {
    "1": 24500,
    "2": 31200,
    "3": 42800
  },
  "settings": {
    "soundEnabled": true,
    "vibrationEnabled": true,
    "controlMode": "mouse-follow",
    "difficulty": "normal",
    "showDebugOverlay": false
  }
}
```

**Features**:
- Auto-save on level complete
- Load on game start
- Graceful fallback if localStorage unavailable

---

## Data Flow

```
┌─────────────────────────────────────────────┐
│         User Input (Keyboard/Mouse/Touch)   │
└────────────────┬────────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ Input System  │
         └───────┬───────┘
                 │
    ┌────────────▼────────────┐
    │                         │
    ▼                         ▼
Game Loop Update    Game State Manager
    │                         │
    ├─ Movement         ├─ Level progression
    ├─ Physics          ├─ Score tracking
    ├─ Collisions       ├─ Settings
    └─ Goal check       └─ State transitions
         │                     │
         └──────────┬──────────┘
                    │
                    ▼
            Game State (memory)
                    │
         ┌──────────┼──────────┐
         │          │          │
         ▼          ▼          ▼
    Renderer      UI        Storage
    (Canvas)   (Menu/HUD)  (localStorage)
```

---

## Performance Considerations

### Frame Budget (60 FPS = 16.67ms per frame)

**Typical Frame**:
- Input processing: ~0.5ms
- Physics update: ~1ms
- Collision detection: ~0.5ms
- Rendering: ~2ms
- **Total**: ~4ms (4.5ms per frame budget)

**Headroom**: 12ms spare for GC, unexpected work

### Mobile Optimization

1. **Canvas size**: Scales with window size
2. **DPI awareness**: Respects devicePixelRatio
3. **Event throttling**: No expensive operations in tight loops
4. **Memory pooling**: Reuse objects, minimize allocation

### Profiling

Enable debug overlay (press ~ or add `?debug`):
- FPS counter (real-time)
- Grid size and seed
- Player position
- Wall hit count

---

## Type Safety

All code is fully typed with TypeScript:

```typescript
// Strong types for game objects
interface Maze { width, height, cells, ... }
interface Player { pos, vel, radius }
interface InputState { keyboard, mouse, touch }

// Strict null checking enabled
// No implicit any

// Type-only imports for performance
import type { GameState } from './types'
```

**Benefits**:
- Compile-time error detection
- Better IDE autocomplete
- Self-documenting code
- Easier refactoring

---

## Extensibility

### Adding New Features

**Example: Sound Effects**
1. Create `src/audio/audio.ts`
2. Add sound types to `types.ts`
3. Call audio manager from game loop
4. Add toggle to settings UI

**Example: Custom Maze Algo**
1. Create `src/game/maze-gen-custom.ts`
2. Implement same interface as `generateMaze()`
3. Update `GameStateManager.getLevelDifficultyConfig()`
4. Add UI option to select algorithm

**Example: New Control Mode**
1. Add control mode to `GameSettings` type
2. Implement in `game-loop.ts` input handling
3. Add UI option in settings
4. Document in `CONTROLS.md`

---

## Testing Strategy

### Unit Tests
- Maze connectivity (DFS validation)
- Collision edge cases
- RNG determinism
- Difficulty scaling

### Integration Tests
- Full level playthrough
- State transitions
- Save/load functionality

### QA Testing
- Browser compatibility
- Mobile responsiveness
- Performance benchmarks
- Edge cases

---

## Build Configuration

**Vite Config**:
- HMR for dev mode
- Tree-shaking for production
- Source maps for debugging
- Minification for size

**TypeScript**:
- Strict mode enabled
- No implicit any
- Type-only imports (performance)
- ES2020 target

---

## Future Improvements

### Performance
- [ ] Spatial hashing for collision
- [ ] WebGL renderer option
- [ ] Service Worker caching
- [ ] Memory pooling for objects

### Features
- [ ] Multiple maze algorithms
- [ ] Sound effects & music
- [ ] Leaderboard (local/online)
- [ ] Level editor
- [ ] Multiplayer/race mode
- [ ] Mobile app wrapper

### Quality
- [ ] E2E testing (Cypress/Playwright)
- [ ] Visual regression tests
- [ ] Performance benchmarks
- [ ] Accessibility audit (WCAG)

---

## Resources

- **Maze Generation**: https://en.wikipedia.org/wiki/Maze_generation_algorithm
- **Canvas API**: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- **TypeScript**: https://www.typescriptlang.org/
- **Vite**: https://vitejs.dev/
- **Game Physics**: https://www.gamedev.net/tutorials/
