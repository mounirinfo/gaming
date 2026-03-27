import { GAME_CONFIG } from "../constants";
import { GameState, Player, Obstacle, PowerUp } from "../types";
import { checkCollision } from "../lib/collision";

export class GameEngine {
  public state: GameState;
  private spawnTimer: number = 0;
  private obstacles: Obstacle[] = [];
  private powerups: PowerUp[] = [];

  constructor() {
    this.state = this.getInitialState();
  }

  public getInitialState(): GameState {
    return {
      isPlaying: true,
      isGameOver: false,
      isPaused: false,
      score: 0,
      timeElapsed: 0,
      gameSpeedMultiplier: 1.0,
      slowTimer: 0,
    };
  }

  public reset() {
    this.state = this.getInitialState();
    this.spawnTimer = 0;
    this.obstacles = [];
    this.powerups = [];
  }

  public getObstacles(): Obstacle[] {
    return this.obstacles;
  }

  public getPowerUps(): PowerUp[] {
    return this.powerups;
  }

  public update(deltaTime: number, player: Player) {
    if (this.state.isGameOver || this.state.isPaused) return;

    // 1. Update Game Speed modifiers
    if (this.state.slowTimer > 0) {
      this.state.slowTimer -= deltaTime;
    }

    const isSlow = this.state.slowTimer > 0;
    const currentGlobalSpeed = isSlow ? 0.5 : 1.0;

    // 2. Spawner Logic
    this.spawnTimer -= deltaTime * currentGlobalSpeed;
    if (this.spawnTimer <= 0 && (this.obstacles.length + this.powerups.length < GAME_CONFIG.MAX_ENTITIES)) {
      this.spawnEntity();
      // Calculate next spawn interval based on difficulty
      const difficultyFactor = Math.min(
        this.state.timeElapsed * GAME_CONFIG.OBSTACLE.SPEED_INCREASE_PER_SEC,
        GAME_CONFIG.OBSTACLE.SPAWN_INTERVAL_BASE - GAME_CONFIG.OBSTACLE.MIN_SPAWN_INTERVAL
      );
      this.spawnTimer = (GAME_CONFIG.OBSTACLE.SPAWN_INTERVAL_BASE - difficultyFactor) / 1000;
    }

    // 3. Update Obstacles
    const fallSpeed = GAME_CONFIG.OBSTACLE.BASE_SPEED + (this.state.timeElapsed * GAME_CONFIG.OBSTACLE.SPEED_INCREASE_PER_SEC);
    
    // Filter out entities that are off-screen
    this.obstacles = this.obstacles.filter((obs: Obstacle) => {
      obs.y += fallSpeed * deltaTime * currentGlobalSpeed;
      
      // Collision with player
      if (!player.markedForDeletion && checkCollision(player, obs)) {
        if (player.invincibleTimer <= 0) {
          this.state.isGameOver = true;
        } else {
          obs.markedForDeletion = true;
        }
      }
      
      return obs.y < GAME_CONFIG.HEIGHT;
    });

    // 4. Update Powerups
    this.powerups = this.powerups.filter((pu: PowerUp) => {
      pu.y += GAME_CONFIG.POWERUP.SPEED * deltaTime * currentGlobalSpeed;
      
      // Collision with player
      if (!player.markedForDeletion && checkCollision(player, pu)) {
        this.applyPowerUp(pu.effectType);
        return false; // Remove
      }
      return pu.y < GAME_CONFIG.HEIGHT;
    });

    // 5. Update Scoring
    this.state.timeElapsed += deltaTime;
    if (!this.state.isGameOver) {
      this.state.score += GAME_CONFIG.SCORE.BASE_PER_SECOND * deltaTime * this.state.gameSpeedMultiplier;
    }
  }

  private spawnEntity() {
    const isPowerUp = Math.random() < GAME_CONFIG.POWERUP.SPAWN_CHANCE;
    const x = Math.random() * (GAME_CONFIG.WIDTH - 60);

    if (isPowerUp) {
      const types: Array<'slow' | 'invincible' | 'points' | 'repair'> = ['slow', 'invincible', 'points', 'repair'];
      const effectType = types[Math.floor(Math.random() * types.length)];
      const powerupTypes = GAME_CONFIG.POWERUP.TYPES as Record<string, { id: string; color: string; duration: number; label: string }>;
      const typeConfig = Object.values(powerupTypes).find((t: any) => t.id === effectType);
      
      this.powerups.push({
        id: `pu_${Date.now()}`,
        type: 'powerup',
        effectType,
        x,
        y: -50,
        w: GAME_CONFIG.POWERUP.SIZE,
        h: GAME_CONFIG.POWERUP.SIZE,
        color: typeConfig?.color || '#9b59b6'
      });
    } else {
      const w = GAME_CONFIG.OBSTACLE.MIN_WIDTH + Math.random() * (GAME_CONFIG.OBSTACLE.MAX_WIDTH - GAME_CONFIG.OBSTACLE.MIN_WIDTH);
      const h = GAME_CONFIG.OBSTACLE.MIN_HEIGHT + Math.random() * (GAME_CONFIG.OBSTACLE.MAX_HEIGHT - GAME_CONFIG.OBSTACLE.MIN_HEIGHT);
      
      this.obstacles.push({
        id: `obs_${Date.now()}`,
        type: 'obstacle',
        x,
        y: -h,
        w,
        h,
        speed: GAME_CONFIG.OBSTACLE.BASE_SPEED,
        color: GAME_CONFIG.OBSTACLE.COLOR
      });
    }
  }

  private applyPowerUp(effectType: 'slow' | 'invincible' | 'points' | 'repair') {
    if (effectType === 'slow') {
      this.state.slowTimer = GAME_CONFIG.POWERUP.TYPES.SLOW.duration;
    } else if (effectType === 'invincible') {
      // This should be handled by the calling code
    } else if (effectType === 'points') {
      this.state.score += GAME_CONFIG.SCORE.POINT_BONUS;
    } else if (effectType === 'repair') {
      // Extra life - handled by calling code
    }
  }
}
