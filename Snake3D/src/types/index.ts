export type Vector3D = {
  x: number;
  y: number;
  z: number;
};

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'FORWARD' | 'BACKWARD';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type GameMode = '2D' | '3D';

export type GameStatus = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type FoodType = 'NORMAL' | 'BIG'; // New food type

// New Interface for floating score text
export interface FloatingText {
  id: string;
  text: string;
  position: Vector3D;
  createdAt: number; // To handle timeout
}

export interface LevelConfig {
  difficulty: Difficulty;
  gridSize: number;
  initialSpeed: number;
  speedIncrement: number;
  minSpeed: number;
  obstacles: Vector3D[];
}

export interface SnakeSegment extends Vector3D {
  id: string;
}

export interface GameState {
  snake: SnakeSegment[];
  food: Vector3D;
  foodType: FoodType; // Track current food type
  foodEatenCount: number; // Track count to spawn big food
  floatingTexts: FloatingText[]; // Array of floating scores
  direction: Direction;
  nextDirection: Direction;
  score: number;
  status: GameStatus;
  level: LevelConfig;
  speed: number;
  gameMode: GameMode;
}

export interface HighScores {
  EASY: number;
  MEDIUM: number;
  HARD: number;
}

export type Language = 'en' | 'fr' | 'ar';

export type RootStackParamList = {
  Home: undefined;
  LevelSelect: { gameMode: GameMode };
  Game: { difficulty: Difficulty; gameMode: GameMode };
  Settings: undefined;
};