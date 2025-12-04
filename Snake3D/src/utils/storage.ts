import AsyncStorage from '@react-native-async-storage/async-storage';
import { HighScores, Language } from '../types';

const KEYS = {
  HIGH_SCORES: 'snake3d_high_scores',
  LANGUAGE: 'snake3d_language',
  SOUND_ENABLED: 'snake3d_sound',
};

export const storage = {
  // High Scores
  async getHighScores(): Promise<HighScores> {
    try {
      const data = await AsyncStorage.getItem(KEYS.HIGH_SCORES);
      return data ? JSON.parse(data) : { EASY: 0, MEDIUM: 0, HARD: 0 };
    } catch {
      return { EASY: 0, MEDIUM: 0, HARD: 0 };
    }
  },

  async saveHighScore(difficulty: string, score: number): Promise<void> {
    try {
      const scores = await this.getHighScores();
      if (score > scores[difficulty as keyof HighScores]) {
        scores[difficulty as keyof HighScores] = score;
        await AsyncStorage.setItem(KEYS.HIGH_SCORES, JSON.stringify(scores));
      }
    } catch (error) {
      console.error('Failed to save high score:', error);
    }
  },

  // Language
  async getLanguage(): Promise<Language> {
    try {
      const lang = await AsyncStorage.getItem(KEYS.LANGUAGE);
      return (lang as Language) || 'en';
    } catch {
      return 'en';
    }
  },

  async saveLanguage(language: Language): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.LANGUAGE, language);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  },

  // Sound
  async getSoundEnabled(): Promise<boolean> {
    try {
      const sound = await AsyncStorage.getItem(KEYS.SOUND_ENABLED);
      return sound !== 'false';
    } catch {
      return true;
    }
  },

  async saveSoundEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.SOUND_ENABLED, String(enabled));
    } catch (error) {
      console.error('Failed to save sound setting:', error);
    }
  },
};