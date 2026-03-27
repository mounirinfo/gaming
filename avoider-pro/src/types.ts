export interface Entity {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'player' | 'obstacle' | 'powerup';
  color: string;
  markedForDeletion?: boolean;
}

export interface Player extends Entity {
  vx: number;
  invincibleTimer: number; // ms
  lives: number;
}

export interface Obstacle extends Entity {
  speed: number;
}

export interface PowerUp extends Entity {
  effectType: 'slow' | 'invincible' | 'points' | 'repair';
}

export interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  isPaused: boolean;
  score: number;
  timeElapsed: number; // Seconds
  gameSpeedMultiplier: number; // 1.0 normal, 0.5 slow
  slowTimer: number; // ms
}

export interface LeaderboardEntry {
  score: number;
  date: string;
}

export interface GameSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  tiltEnabled: boolean;
  tutorialEnabled: boolean;
  laneMode: boolean; // 3-lane simplified movement
  controlsSize: number; // 1.0 base
}