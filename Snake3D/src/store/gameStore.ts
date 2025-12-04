// ============================================
// FILE: src/store/gameStore.ts - FIXED
// ============================================

import { create } from 'zustand';
import { GameState, Direction, Difficulty } from '../types';
import { GameEngine } from '../game/GameEngine';
import { LEVELS } from '../game/levels';

interface GameStore extends GameState {
  changeDirection: (direction: Direction) => void;
  tick: () => void;
  pause: () => void;
  resume: () => void;
  reset: (difficulty: Difficulty) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial dummy state
  snake: [],
  food: { x: 0, y: 0, z: 0 },
  direction: 'RIGHT',
  nextDirection: 'RIGHT',
  score: 0,
  status: 'IDLE',
  level: LEVELS.EASY,
  speed: 400,

  changeDirection: (direction: Direction) => {
    const { direction: currentDir, status, nextDirection } = get();
    
    if (status !== 'PLAYING') {
      console.log('Cannot change direction - game not playing');
      return;
    }
    
    // Check if the new direction is valid (not opposite to current)
    if (GameEngine.isValidDirectionChange(currentDir, direction)) {
      console.log('Direction changed from', currentDir, 'to', direction);
      set({ nextDirection: direction });
    } else {
      console.log('Invalid direction change from', currentDir, 'to', direction);
    }
  },

  tick: () => {
    const state = get();
    
    if (state.status !== 'PLAYING') {
      return;
    }
    
    const newState = GameEngine.moveSnake(state);
    set(newState);
    
    if (newState.status === 'GAME_OVER') {
      console.log('Game Over! Final Score:', newState.score);
    }
  },

  pause: () => {
    console.log('Game paused');
    set({ status: 'PAUSED' });
  },

  resume: () => {
    console.log('Game resumed');
    set({ status: 'PLAYING' });
  },

  reset: (difficulty: Difficulty) => {
    const level = LEVELS[difficulty];
    const newState = GameEngine.initializeGame(level);
    console.log('Game reset with difficulty:', difficulty);
    set(newState);
  },
}));