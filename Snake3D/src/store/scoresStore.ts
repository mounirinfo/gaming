import { create } from 'zustand';
import { HighScores, Difficulty } from '../types';

interface ScoresState {
  scores: HighScores;
  updateScore: (difficulty: Difficulty, score: number) => void;
}

export const useScoresStore = create<ScoresState>((set, get) => ({
  scores: { EASY: 0, MEDIUM: 0, HARD: 0 },

  updateScore: (difficulty: Difficulty, score: number) => {
    const { scores } = get();
    if (score > scores[difficulty]) {
      set({ scores: { ...scores, [difficulty]: score } });
    }
  },
}));