export type Vector3D = {
  x: number;
  y: number;
  z: number;
};

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'FORWARD' | 'BACKWARD';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type GameStatus = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export interface LevelConfig {
  difficulty: Difficulty;
  gridSize: number;
  initialSpeed: number; // milliseconds per move
  speedIncrement: number; // decrease in ms per food eaten
  minSpeed: number; // fastest possible speed
  obstacles: Vector3D[]; // for hard mode
}

export interface SnakeSegment extends Vector3D {
  id: string;
}

export interface GameState {
  snake: SnakeSegment[];
  food: Vector3D;
  direction: Direction;
  nextDirection: Direction;
  score: number;
  status: GameStatus;
  level: LevelConfig;
  speed: number;
}

export interface HighScores {
  EASY: number;
  MEDIUM: number;
  HARD: number;
}

export type Language = 'en' | 'fr' | 'ar';

export type RootStackParamList = {
  Home: undefined;
  LevelSelect: undefined;
  Game: { difficulty: Difficulty };
  Settings: undefined;
};
