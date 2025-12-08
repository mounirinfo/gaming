import { Vector3D, Direction, SnakeSegment, GameState, LevelConfig, GameMode, FoodType, FloatingText } from '../types';

export class GameEngine {
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

  static moveSnake(state: GameState): GameState {
    const { snake, direction, food, level, speed, gameMode, foodType, foodEatenCount, floatingTexts, score } = state;
    const dirVector = this.getDirectionVector(direction);
    
    const head = snake[0];
    const newHead: SnakeSegment = {
      x: head.x + dirVector.x,
      y: head.y + dirVector.y,
      z: head.z + dirVector.z,
      id: `seg-${Date.now()}-${Math.random()}`,
    };

    if (this.checkCollision(newHead, snake, level, gameMode)) {
      return { ...state, status: 'GAME_OVER' };
    }

    const ateFood = this.vectorEquals(newHead, food);
    
    let newSnake: SnakeSegment[];
    let newScore = score;
    let newFood = food;
    let newSpeed = speed;
    let newFoodType = foodType;
    let newFoodEatenCount = foodEatenCount;
    let newFloatingTexts = [...floatingTexts];

    // Remove old floating texts (older than 0.5s)
    const now = Date.now();
    newFloatingTexts = newFloatingTexts.filter(ft => now - ft.createdAt < 500);

    if (ateFood) {
      newSnake = [newHead, ...snake];
      
      const points = foodType === 'BIG' ? 5 : 1;
      newScore += points * 10; // Base score multiplier
      
      // Add floating text
      newFloatingTexts.push({
        id: `ft-${now}`,
        text: `+${points}`,
        position: { ...newHead, z: gameMode === '2D' ? 1 : newHead.z }, // Slightly above in 2D
        createdAt: now,
      });

      newFoodEatenCount++;
      
      // Check if next food should be BIG (every 5th)
      if (newFoodEatenCount > 0 && newFoodEatenCount % 5 === 0) {
        newFoodType = 'BIG';
      } else {
        newFoodType = 'NORMAL';
      }

      newFood = this.generateFood(newSnake, level, gameMode);
      newSpeed = Math.max(level.minSpeed, speed - level.speedIncrement);
    } else {
      newSnake = [newHead, ...snake.slice(0, -1)];
    }

    return {
      ...state,
      snake: newSnake,
      food: newFood,
      foodType: newFoodType,
      foodEatenCount: newFoodEatenCount,
      floatingTexts: newFloatingTexts,
      score: newScore,
      speed: newSpeed,
      direction: state.nextDirection,
    };
  }

  static checkCollision(
    position: Vector3D,
    snake: SnakeSegment[],
    level: LevelConfig,
    gameMode: GameMode
  ): boolean {
    const { gridSize, obstacles } = level;
    
    if (
      position.x < 0 || position.x >= gridSize ||
      position.y < 0 || position.y >= gridSize ||
      position.z < 0 || position.z >= (gameMode === '2D' ? 1 : gridSize)
    ) {
      return true;
    }

    for (let i = 0; i < snake.length; i++) {
      if (this.vectorEquals(snake[i], position)) {
        return true;
      }
    }

    for (const obs of obstacles) {
      if (this.vectorEquals(obs, position)) {
        return true;
      }
    }

    return false;
  }

  static generateFood(snake: SnakeSegment[], level: LevelConfig, gameMode: GameMode): Vector3D {
    const { gridSize, obstacles } = level;
    let food: Vector3D;
    let attempts = 0;
    const maxAttempts = 1000;
    
    do {
      food = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize),
        z: gameMode === '2D' ? 0 : Math.floor(Math.random() * gridSize),
      };
      attempts++;
      if (attempts > maxAttempts) break;
    } while (
      snake.some(seg => this.vectorEquals(seg, food)) ||
      obstacles.some(obs => this.vectorEquals(obs, food))
    );

    return food;
  }

  static initializeGame(level: LevelConfig, gameMode: GameMode): GameState {
    const centerPos = Math.floor(level.gridSize / 2);
    const startZ = gameMode === '2D' ? 0 : centerPos;
    
    const initialSnake: SnakeSegment[] = [
      { x: centerPos, y: centerPos, z: startZ, id: 'seg-0' },
      { x: centerPos - 1, y: centerPos, z: startZ, id: 'seg-1' },
      { x: centerPos - 2, y: centerPos, z: startZ, id: 'seg-2' },
    ];

    const food = this.generateFood(initialSnake, level, gameMode);

    return {
      snake: initialSnake,
      food,
      foodType: 'NORMAL',
      foodEatenCount: 0,
      floatingTexts: [],
      direction: 'RIGHT',
      nextDirection: 'RIGHT',
      score: 0,
      status: 'PLAYING',
      level,
      speed: level.initialSpeed,
      gameMode,
    };
  }

  static vectorEquals(a: Vector3D, b: Vector3D): boolean {
    return a.x === b.x && a.y === b.y && a.z === b.z;
  }
  
  static distance(a: Vector3D, b: Vector3D): number {
    return Math.sqrt(
      Math.pow(a.x - b.x, 2) + 
      Math.pow(a.y - b.y, 2) + 
      Math.pow(a.z - b.z, 2)
    );
  }
}