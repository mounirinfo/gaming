// ============================================
// FILE: src/game/GameEngine.ts - FIXED
// ============================================

import { Vector3D, Direction, SnakeSegment, GameState, LevelConfig } from '../types';

export class GameEngine {
  /**
   * Get direction vector for a given direction
   */
  static getDirectionVector(direction: Direction): Vector3D {
    switch (direction) {
      case 'UP': return { x: 0, y: 1, z: 0 };
      case 'DOWN': return { x: 0, y: -1, z: 0 };
      case 'LEFT': return { x: -1, y: 0, z: 0 };
      case 'RIGHT': return { x: 1, y: 0, z: 0 };
      case 'FORWARD': return { x: 0, y: 0, z: 1 };
      case 'BACKWARD': return { x: 0, y: 0, z: -1 };
    }
  }

  /**
   * Check if a direction change is valid (can't go directly backwards)
   */
  static isValidDirectionChange(current: Direction, next: Direction): boolean {
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
      FORWARD: 'BACKWARD',
      BACKWARD: 'FORWARD',
    };
    return opposites[current] !== next;
  }

  /**
   * Move the snake one step in the current direction
   */
  static moveSnake(state: GameState): GameState {
    const { snake, direction, food, level, speed } = state;
    const dirVector = this.getDirectionVector(direction);
    
    // Calculate new head position
    const head = snake[0];
    const newHead: SnakeSegment = {
      x: head.x + dirVector.x,
      y: head.y + dirVector.y,
      z: head.z + dirVector.z,
      id: `seg-${Date.now()}-${Math.random()}`,
    };

    console.log('Moving snake:', {
      from: head,
      to: newHead,
      direction,
    });

    // Check if new head position is valid (no collision)
    if (this.checkCollision(newHead, snake, level)) {
      console.log('Collision detected! Game Over');
      return { ...state, status: 'GAME_OVER' };
    }

    // Check if snake ate food
    const ateFood = this.vectorEquals(newHead, food);
    
    let newSnake: SnakeSegment[];
    let newScore = state.score;
    let newFood = food;
    let newSpeed = speed;

    if (ateFood) {
      console.log('Food eaten! Score:', newScore + 10);
      // Snake grows (don't remove tail)
      newSnake = [newHead, ...snake];
      newScore += 10;
      newFood = this.generateFood(newSnake, level);
      // Increase speed (decrease interval)
      newSpeed = Math.max(level.minSpeed, speed - level.speedIncrement);
    } else {
      // Snake moves (remove tail)
      newSnake = [newHead, ...snake.slice(0, -1)];
    }

    return {
      ...state,
      snake: newSnake,
      food: newFood,
      score: newScore,
      speed: newSpeed,
      direction: state.nextDirection, // Apply queued direction
    };
  }

  /**
   * Check if snake collides with walls, itself, or obstacles
   */
  static checkCollision(
    position: Vector3D,
    snake: SnakeSegment[],
    level: LevelConfig
  ): boolean {
    const { gridSize, obstacles } = level;
    
    // Check wall collision (cube boundaries)
    if (
      position.x < 0 || position.x >= gridSize ||
      position.y < 0 || position.y >= gridSize ||
      position.z < 0 || position.z >= gridSize
    ) {
      console.log('Wall collision at:', position);
      return true;
    }

    // Check self collision (don't check head against itself)
    for (let i = 0; i < snake.length; i++) {
      if (this.vectorEquals(snake[i], position)) {
        console.log('Self collision at:', position);
        return true;
      }
    }

    // Check obstacle collision
    for (const obs of obstacles) {
      if (this.vectorEquals(obs, position)) {
        console.log('Obstacle collision at:', position);
        return true;
      }
    }

    return false;
  }

  /**
   * Generate a random food position that doesn't overlap with snake or obstacles
   */
  static generateFood(snake: SnakeSegment[], level: LevelConfig): Vector3D {
    const { gridSize, obstacles } = level;
    let food: Vector3D;
    let attempts = 0;
    const maxAttempts = 1000;
    
    do {
      food = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize),
        z: Math.floor(Math.random() * gridSize),
      };
      attempts++;
      
      if (attempts > maxAttempts) {
        console.warn('Could not find valid food position after', maxAttempts, 'attempts');
        break;
      }
    } while (
      snake.some(seg => this.vectorEquals(seg, food)) ||
      obstacles.some(obs => this.vectorEquals(obs, food))
    );

    console.log('New food generated at:', food);
    return food;
  }

  /**
   * Initialize a new game state
   */
  static initializeGame(level: LevelConfig): GameState {
    const centerPos = Math.floor(level.gridSize / 2);
    
    const initialSnake: SnakeSegment[] = [
      { x: centerPos, y: centerPos, z: centerPos, id: 'seg-0' },
      { x: centerPos - 1, y: centerPos, z: centerPos, id: 'seg-1' },
      { x: centerPos - 2, y: centerPos, z: centerPos, id: 'seg-2' },
    ];

    const food = this.generateFood(initialSnake, level);

    console.log('Game initialized:', {
      level: level.difficulty,
      gridSize: level.gridSize,
      initialSpeed: level.initialSpeed,
      snake: initialSnake,
      food,
    });

    return {
      snake: initialSnake,
      food,
      direction: 'RIGHT',
      nextDirection: 'RIGHT',
      score: 0,
      status: 'PLAYING',
      level,
      speed: level.initialSpeed,
    };
  }

  /**
   * Helper to check if two vectors are equal
   */
  static vectorEquals(a: Vector3D, b: Vector3D): boolean {
    return a.x === b.x && a.y === b.y && a.z === b.z;
  }
}