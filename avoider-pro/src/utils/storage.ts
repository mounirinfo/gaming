import AsyncStorage from '@react-native-async-storage/async-storage';
import { LeaderboardEntry, GameSettings } from '../types';

const KEYS = {
  LEADERBOARD: '@topdown_leaderboard',
  SETTINGS: '@topdown_settings',
  TUTORIAL_SEEN: '@topdown_tutorial_seen',
};

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  tiltEnabled: false,
  tutorialEnabled: true,
  laneMode: false,
  controlsSize: 1.0,
};

export const StorageUtils = {
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const json = await AsyncStorage.getItem(KEYS.LEADERBOARD);
      return json ? JSON.parse(json) : [];
    } catch (e) {
      console.error('Failed to load leaderboard', e);
      return [];
    }
  },

  async saveScore(score: number): Promise<LeaderboardEntry[]> {
    const current = await this.getLeaderboard();
    const newEntry: LeaderboardEntry = { score, date: new Date().toISOString() };
    const updated = [...current, newEntry]
      .sort((a, b) => b.score - a.score) // Descending
      .slice(0, 10); // Keep top 10

    await AsyncStorage.setItem(KEYS.LEADERBOARD, JSON.stringify(updated));
    return updated;
  },

  async getSettings(): Promise<GameSettings> {
    try {
      const json = await AsyncStorage.getItem(KEYS.SETTINGS);
      return json ? { ...DEFAULT_SETTINGS, ...JSON.parse(json) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: GameSettings): Promise<void> {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  async isTutorialSeen(): Promise<boolean> {
    const val = await AsyncStorage.getItem(KEYS.TUTORIAL_SEEN);
    return val === 'true';
  },

  async setTutorialSeen(): Promise<void> {
    await AsyncStorage.setItem(KEYS.TUTORIAL_SEEN, 'true');
  },
};