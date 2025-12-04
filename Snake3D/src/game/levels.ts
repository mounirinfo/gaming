import { LevelConfig, Difficulty } from '../types';

export const LEVELS: Record<Difficulty, LevelConfig> = {
  EASY: {
    difficulty: 'EASY',
    gridSize: 12,
    initialSpeed: 500, // Slower for easier play
    speedIncrement: 10,
    minSpeed: 200,
    obstacles: [],
  },
  MEDIUM: {
    difficulty: 'MEDIUM',
    gridSize: 10,
    initialSpeed: 350,
    speedIncrement: 15,
    minSpeed: 150,
    obstacles: [],
  },
  HARD: {
    difficulty: 'HARD',
    gridSize: 8,
    initialSpeed: 250,
    speedIncrement: 20,
    minSpeed: 100,
    obstacles: [
      { x: 4, y: 4, z: 4 },
      { x: 3, y: 3, z: 3 },
    ],
  },
};