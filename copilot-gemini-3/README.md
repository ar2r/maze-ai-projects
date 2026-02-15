# Maze Runner

A procedurally generated maze game built with TypeScript, Vite, and HTML5 Canvas.

## Features
- **Infinite Levels**: Mazes get larger and more complex.
- **Responsive**: Works on Desktop (Mouse) and Mobile (Touch).
- **Physics**: Smooth collision handling.
- **Offline**: Fully client-side, no backend.

## How to Run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

## Screenshots

![Start Screen](path/to/start-screen.png)
*Start Screen with controls info*

![Gameplay](path/to/gameplay.png)
*Navigate the maze to the green exit*

![Level Complete](path/to/level-complete.png)
*Results screen with stats*

## Controls
   ```bash
   npm run build
   ```
4. Run tests:
   ```bash
   npm test
   ```

## Controls
- **Desktop**: Click and drag to move the green dot. The dot follows your cursor/finger.
- **Mobile**: Touch and drag anywhere on screen.

## Architecture
- **Engine**: Custom game loop in `src/game/Game.ts`.
- **Maze Gen**: DFS Backtracker in `src/game/MazeGenerator.ts`.
- **Rendering**: Canvas API in `src/game/Renderer.ts`.
