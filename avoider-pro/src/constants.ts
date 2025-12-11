// Centralized configuration for game balance and specs
export const GAME_CONFIG = {
  // Logical Canvas Dimensions
  WIDTH: 360,
  HEIGHT: 640,

  // Player Specs
  PLAYER: {
    WIDTH: 48,
    HEIGHT: 80,
    SPEED: 300, // px per second horizontal
    COLOR: '#3498db',
    INVINCIBLE_COLOR: '#f1c40f',
  },

  // Obstacle Specs
  OBSTACLE: {
    BASE_SPEED: 120, // px per second
    SPEED_INCREASE_PER_SEC: 6,
    SPAWN_INTERVAL_BASE: 900, // ms
    SPAWN_DECREASE_PER_SEC: 25, // ms reduction per sec of gameplay
    MIN_SPAWN_INTERVAL: 300,
    MIN_WIDTH: 30,
    MAX_WIDTH: 80,
    MIN_HEIGHT: 30,
    MAX_HEIGHT: 60,
    COLOR: '#e74c3c',
  },

  // Powerups
  POWERUP: {
    SIZE: 30,
    SPEED: 150,
    SPAWN_CHANCE: 0.08, // 8% chance per obstacle spawn
    TYPES: {
      SLOW: { id: 'slow', color: '#2ecc71', duration: 3000, label: 'SLOW' },
      INVINCIBLE: { id: 'invincible', color: '#f1c40f', duration: 3000, label: 'SHIELD' },
      POINTS: { id: 'points', color: '#9b59b6', duration: 0, label: '+150' },
      REPAIR: { id: 'repair', color: '#e91e63', duration: 0, label: 'HP+' }, // Extra life
    },
  },

  // Scoring
  SCORE: {
    BASE_PER_SECOND: 10,
    POINT_BONUS: 150,
  },

  // System
  MAX_ENTITIES: 60,
  FPS_TARGET: 60,
  
  // Swipe Controls
  SWIPE_THRESHOLD: 40, // px
  SWIPE_TIME_LIMIT: 300, // ms
  SWIPE_DISTANCE: 60, // px jump
};