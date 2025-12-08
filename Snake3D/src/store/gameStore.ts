import { create } from 'zustand';
import { GameState, Direction, Difficulty, GameMode } from '../types';
import { GameEngine } from '../game/GameEngine';
import { LEVELS } from '../game/levels';

interface GameStore extends GameState {
  changeDirection: (direction: Direction) => void;
  tick: () => void;
  pause: () => void;
  resume: () => void;
  reset: (difficulty: Difficulty, mode: GameMode) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // État initial factice
  snake: [],
  food: { x: 0, y: 0, z: 0 },
  foodType: 'NORMAL',
  foodEatenCount: 0,
  floatingTexts: [],
  direction: 'RIGHT',
  nextDirection: 'RIGHT',
  score: 0,
  status: 'IDLE',
  level: LEVELS.EASY,
  speed: 400,
  gameMode: '3D',

  changeDirection: (direction: Direction) => {
    const { direction: currentDir, status, gameMode } = get();
    
    if (status !== 'PLAYING') return;

    // Empêcher les mouvements 3D (Avant/Arrière) en mode 2D
    if (gameMode === '2D' && (direction === 'FORWARD' || direction === 'BACKWARD')) {
      return;
    }
    
    if (GameEngine.isValidDirectionChange(currentDir, direction)) {
      set({ nextDirection: direction });
    }
  },

  tick: () => {
    const state = get();
    if (state.status !== 'PLAYING') return;
    
    const newState = GameEngine.moveSnake(state);
    set(newState);
  },

  pause: () => {
    set({ status: 'PAUSED' });
  },

  resume: () => {
    set({ status: 'PLAYING' });
  },

  reset: (difficulty: Difficulty, mode: GameMode) => {
    const level = LEVELS[difficulty];
    const newState = GameEngine.initializeGame(level, mode);
    set(newState);
  },
}));