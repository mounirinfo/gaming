import { GAME_CONFIG } from '../constants';
import { Obstacle, PowerUp } from '../types';

let idCounter = 0;
const generateId = (prefix: string) => `${prefix}_${Date.now()}_${idCounter++}`;

export const spawnObstacle = (gameTime: number): Obstacle => {
  // Calculate difficulty multipliers based on time
  const timeSeconds = gameTime; // gameTime is already in seconds tracking
  
  // Speed increases over time
  const speed = GAME_CONFIG.OBSTACLE.BASE_SPEED + (GAME_CONFIG.OBSTACLE.SPEED_INCREASE_PER_SEC * timeSeconds);
  
  // Random Dimensions
  const w = GAME_CONFIG.OBSTACLE.MIN_WIDTH + Math.random() * (GAME_CONFIG.OBSTACLE.MAX_WIDTH - GAME_CONFIG.OBSTACLE.MIN_WIDTH);
  const h = GAME_CONFIG.OBSTACLE.MIN_HEIGHT + Math.random() * (GAME_CONFIG.OBSTACLE.MAX_HEIGHT - GAME_CONFIG.OBSTACLE.MIN_HEIGHT);
  
  // Random X Position (clamped to screen)
  const x = Math.random() * (GAME_CONFIG.WIDTH - w);

  return {
    id: generateId('obs'),
    type: 'obstacle',
    x,
    y: -h - 10, // Spawn just above screen
    w,
    h,
    speed,
    color: GAME_CONFIG.OBSTACLE.COLOR,
  };
};

export const spawnPowerUp = (): PowerUp | null => {
  if (Math.random() > GAME_CONFIG.POWERUP.SPAWN_CHANCE) return null;

  const types = Object.values(GAME_CONFIG.POWERUP.TYPES);
  const selected = types[Math.floor(Math.random() * types.length)];

  const size = GAME_CONFIG.POWERUP.SIZE;
  const x = Math.random() * (GAME_CONFIG.WIDTH - size);

  return {
    id: generateId('pwr'),
    type: 'powerup',
    x,
    y: -size - 10,
    w: size,
    h: size,
    color: selected.color,
    effectType: selected.id as any,
  };
};