// === Game Configuration ===

export const CONFIG = {
  // Game version
  VERSION: '1.0.0',

  // Canvas
  CANVAS: {
    MIN_WIDTH: 360,
    MIN_HEIGHT: 640,
    MAX_RENDER_SIZE: 2048,
  },

  // Player
  PLAYER: {
    RADIUS: 8,
    SPEED: 200, // pixels per second
    FRICTION: 0.85,
    MAX_SPEED: 300,
  },

  // Maze generation progression
  MAZE: {
    // Base size for level 1
    BASE_SIZE: 10,
    // Growth formula: baseSize + (level - 1) * growth
    SIZE_GROWTH_PER_LEVEL: 2,
    MAX_SIZE: 50,

    // Cell size in pixels (will be calculated based on screen)
    MIN_CELL_SIZE: 20,
    MAX_CELL_SIZE: 60,

    // Wall thickness
    WALL_THICKNESS: 3,

    // Colors
    COLORS: {
      WALL: '#2c3e50',
      PATH: '#34495e',
      PLAYER: '#3498db',
      PLAYER_TRAIL: 'rgba(52, 152, 219, 0.3)',
      START: '#27ae60',
      FINISH: '#e67e22',
      FINISH_GLOW: 'rgba(230, 126, 34, 0.6)',
    },
  },

  // Physics
  PHYSICS: {
    // Collision detection precision
    WALL_BUFFER: 2,
    // Sliding factor along walls
    SLIDE_FACTOR: 0.7,
  },

  // Input
  INPUT: {
    // Mouse follow distance threshold
    MOUSE_FOLLOW_THRESHOLD: 5,
    // Joystick dead zone (0-1)
    JOYSTICK_DEAD_ZONE: 0.15,
    // Joystick size
    JOYSTICK_RADIUS: 60,
  },

  // Performance
  PERFORMANCE: {
    TARGET_FPS: 60,
    // Offscreen buffer for static maze
    USE_OFFSCREEN_BUFFER: true,
  },

  // Audio
  AUDIO: {
    // Web Audio API simple tones
    COLLISION_FREQ: 200,
    SUCCESS_FREQ: 800,
    DURATION: 0.05,
  },

  // Haptics
  HAPTICS: {
    COLLISION_DURATION: 20,
    SUCCESS_DURATION: 100,
  },
} as const;

// Helper: Calculate maze size for a given level
export function getMazeSizeForLevel(level: number): number {
  const size = CONFIG.MAZE.BASE_SIZE + (level - 1) * CONFIG.MAZE.SIZE_GROWTH_PER_LEVEL;
  return Math.min(size, CONFIG.MAZE.MAX_SIZE);
}

// Helper: Calculate cell size based on screen and maze size
export function calculateCellSize(
  screenWidth: number,
  screenHeight: number,
  mazeWidth: number,
  mazeHeight: number
): number {
  const maxCellWidth = Math.floor(screenWidth / mazeWidth);
  const maxCellHeight = Math.floor(screenHeight / mazeHeight);
  const cellSize = Math.min(maxCellWidth, maxCellHeight);

  return Math.max(
    CONFIG.MAZE.MIN_CELL_SIZE,
    Math.min(cellSize, CONFIG.MAZE.MAX_CELL_SIZE)
  );
}
