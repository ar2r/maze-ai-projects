import type { LevelConfig } from './types';

export const GAME_CONFIG = {
  TARGET_FPS: 60,
  FIXED_TIMESTEP: 1000 / 60, // 16.67ms
  
  // Player physics
  PLAYER_ACCELERATION: 0.8,
  PLAYER_FRICTION: 0.85,
  PLAYER_MAX_SPEED: 4,
  PLAYER_RADIUS_RATIO: 0.35, // Relative to cell size
  
  // Collision
  COLLISION_BUFFER: 0.1, // Extra space for forgiveness
  WALL_SLIDE_FACTOR: 0.7, // How much to slide along walls
  
  // Rendering
  HIDPI_ENABLED: true,
  BACKGROUND_COLOR: '#1a1a2e',
  WALL_COLOR: '#0f3460',
  PLAYER_COLOR: '#e94560',
  START_COLOR: '#2ecc71',
  END_COLOR: '#f39c12',
  PATH_TRAIL_COLOR: 'rgba(233, 69, 96, 0.2)',
  
  // Audio
  COLLISION_FREQUENCY: 200,
  SUCCESS_FREQUENCY: 523.25, // C5
  AUDIO_DURATION: 0.1,
  
  // Haptics
  COLLISION_VIBRATE_DURATION: 50,
  SUCCESS_VIBRATE_PATTERN: [50, 50, 100],
  
  // Touch controls
  JOYSTICK_SIZE: 120,
  JOYSTICK_DEAD_ZONE: 0.15,
  JOYSTICK_MAX_DISTANCE: 50,
  
  // Debug
  DEBUG_KEY: 'd',
  DEBUG_SHOW_GRID: false,
  DEBUG_SHOW_COLLISION_BOXES: false,
};

export const LEVEL_CONFIGS: Record<number, Partial<LevelConfig>> = {
  1: { gridWidth: 10, gridHeight: 15, cellSize: 40, wallThickness: 3, playerSpeed: 4 },
  5: { gridWidth: 12, gridHeight: 18, cellSize: 35, wallThickness: 3, playerSpeed: 4 },
  10: { gridWidth: 15, gridHeight: 20, cellSize: 30, wallThickness: 2.5, playerSpeed: 4.5 },
  15: { gridWidth: 20, gridHeight: 25, cellSize: 25, wallThickness: 2, playerSpeed: 5, addLoops: true },
  20: { gridWidth: 25, gridHeight: 30, cellSize: 22, wallThickness: 1.5, playerSpeed: 5.5, addLoops: true },
  30: { gridWidth: 30, gridHeight: 35, cellSize: 20, wallThickness: 1.5, playerSpeed: 6, addLoops: true },
};

// Get config for a specific level with interpolation
export function getLevelConfig(level: number): LevelConfig {
  const keys = Object.keys(LEVEL_CONFIGS).map(Number).sort((a, b) => a - b);
  
  // Find the config to use (or interpolate between)
  let lowerKey = keys[0];
  let upperKey = keys[keys.length - 1];
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (level >= keys[i] && level < keys[i + 1]) {
      lowerKey = keys[i];
      upperKey = keys[i + 1];
      break;
    }
  }
  
  if (level >= upperKey) {
    // Use the highest config
    return {
      level,
      gridWidth: LEVEL_CONFIGS[upperKey].gridWidth || 30,
      gridHeight: LEVEL_CONFIGS[upperKey].gridHeight || 35,
      cellSize: LEVEL_CONFIGS[upperKey].cellSize || 20,
      wallThickness: LEVEL_CONFIGS[upperKey].wallThickness || 1.5,
      addLoops: LEVEL_CONFIGS[upperKey].addLoops || false,
      playerSpeed: LEVEL_CONFIGS[upperKey].playerSpeed || 6,
    };
  }
  
  // Interpolate between lower and upper
  const t = (level - lowerKey) / (upperKey - lowerKey);
  const lower = LEVEL_CONFIGS[lowerKey];
  const upper = LEVEL_CONFIGS[upperKey];
  
  return {
    level,
    gridWidth: Math.round(lerp(lower.gridWidth || 10, upper.gridWidth || 30, t)),
    gridHeight: Math.round(lerp(lower.gridHeight || 15, upper.gridHeight || 35, t)),
    cellSize: Math.round(lerp(lower.cellSize || 40, upper.cellSize || 20, t)),
    wallThickness: lerp(lower.wallThickness || 3, upper.wallThickness || 1.5, t),
    addLoops: level >= 15,
    playerSpeed: lerp(lower.playerSpeed || 4, upper.playerSpeed || 6, t),
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export const STORAGE_KEYS = {
  GAME_DATA: 'maze_game_data',
  SETTINGS: 'maze_game_settings',
};
