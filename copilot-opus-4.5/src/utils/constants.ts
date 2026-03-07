// Game constants

/** Canvas and rendering */
export const MIN_CANVAS_SIZE = 300;
export const MAX_CANVAS_SIZE = 800;
export const CANVAS_PADDING = 20;

/** Player */
export const PLAYER_BASE_RADIUS = 8;
export const PLAYER_BASE_SPEED = 200; // pixels per second
export const PLAYER_COLOR = '#e94560';
export const PLAYER_GLOW_COLOR = 'rgba(233, 69, 96, 0.4)';

/** Maze */
export const BASE_MAZE_WIDTH = 5;  // Start smaller for easier first levels
export const BASE_MAZE_HEIGHT = 5;
export const SIZE_INCREMENT = 1;   // Gradual increase
export const MAX_MAZE_SIZE = 40;
export const BASE_CELL_SIZE = 50;  // Larger cells for early levels
export const MIN_CELL_SIZE = 15;
export const WALL_THICKNESS = 3;
export const WALL_COLOR = '#0f3460';
export const FLOOR_COLOR = '#16213e';
export const PASSAGE_HIGHLIGHT_COLOR = 'rgba(100, 150, 200, 0.15)';  // Subtle highlight for open passages
export const START_COLOR = 'rgba(66, 135, 245, 0.5)';
export const END_COLOR = 'rgba(74, 222, 128, 0.6)';

/** Physics */
export const COLLISION_EPSILON = 0.5;
export const WALL_SLIDE_FACTOR = 0.8;
export const COLLISION_HIT_COOLDOWN = 500; // ms between counting wall hits

/** Joystick */
export const JOYSTICK_MAX_DISTANCE = 40;
export const JOYSTICK_DEAD_ZONE = 0.15;

/** Timing */
export const VIBRATION_DURATION = 30; // ms
export const LEVEL_COMPLETE_DELAY = 500; // ms
export const STUCK_HINT_DELAY = 5000; // ms before showing hint arrow

/** Debug */
export const DEBUG_KEY = 'F3';
export const DEBUG_ENABLED_KEY = 'maze_debug';

/** Storage keys */
export const STORAGE_KEY = 'maze_save_data';

/** Default settings */
export const DEFAULT_SETTINGS = {
  soundEnabled: true,
  vibrationEnabled: true,
  showTimer: true,
};
