# Neon Maze Escape (Heroes & Pacman Edition)

A high-performance, client-side maze game built with TypeScript and Canvas, featuring a unique crossover aesthetic of **Heroes of Might and Magic** and **Pacman**.

## Visual Style
- **Heroes Retro Aesthetic**: Stone block walls, parchment UI panels, and gold/wood accents.
- **Animated Pacman**: Play as Pacman who rotates and animates his mouth while moving.
- **Custom Finish**: Reach the golden castle to clear the level.

## Screenshots
*(Add your own screenshots here after running the game locally)*

![Main Menu](https://via.placeholder.com/600x400?text=Main+Menu+Parchment+Style)
*Parchment-style menu with gold borders*

![Gameplay](https://via.placeholder.com/600x400?text=Pacman+in+Stone+Maze)
*Animated Pacman navigating through stone walls*

## Features
- **Procedural Generation**: Recursive backtracker algorithm with seed support.
- **Deterministic**: Levels are generated based on a seed (Level + Timestamp).
- **Progressive Difficulty**: Mazes grow larger as you level up.
- **Cross-Platform**:
  - **PC**: Use WASD, Arrow keys, or Mouse (drag to follow).
  - **Mobile**: Virtual joystick or touch drag.
- **Performance**: Uses offscreen canvas for static rendering and HiDPI support.
- **Persistence**: Automatically saves progress to `localStorage`.
- **QA Features**: Debug overlay with FPS/collision tracking (toggle in Settings).

## Development

### Install Dependencies
```bash
npm install
```

### Run Locally
```bash
npm run dev
```

### Run Tests
```bash
npm run test
```

### Build for Production
```bash
npm run build
```

## Controls
- **Keyboard**: `W/A/S/D` or `Arrows`.
- **Mouse**: Click and drag anywhere to lead the ball.
- **Mobile**: Use the joystick on the bottom left or drag anywhere on the screen.

## Project Structure
- `src/game/MazeGenerator.ts`: Seedable maze algorithm.
- `src/game/GameEngine.ts`: Physics, collisions, and rendering loop.
- `src/game/InputHandler.ts`: Unified input (Touch/Mouse/Keyboard).
- `src/game/UI.ts`: Menu management and settings.
- `src/tests/`: Unit tests for core logic.
