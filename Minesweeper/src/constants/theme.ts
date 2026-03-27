import { Difficulty } from '../types';

export const PALETTE = {
  bgLight: '#FCFDFF',
  bgDark: '#0F1724',
  accent: '#00B894',
  danger: '#FF6B6B',
  flag: '#FF9F43',
  textLight: '#1E293B',
  textDark: '#F1F5F9',
  cardLight: '#FFFFFF',
  cardDark: '#1E293B',
  gridBgLight: '#CBD5E1', // Slate 300
  gridBgDark: '#1E293B', // Slate 800
};

export const NUMBER_COLORS: Record<number, string> = {
  1: '#2B6EF6',
  2: '#16A34A',
  3: '#E11D48',
  4: '#7C3AED',
  5: '#F59E0B',
  6: '#0EA5A4',
  7: '#0F1724',
  8: '#64748B'
};

export const DIFFICULTIES: Record<string, Difficulty> = {
  EASY: { rows: 12, cols: 9, mines: 12, label: 'Easy' },
  MEDIUM: { rows: 18, cols: 12, mines: 35, label: 'Medium' },
  HARD: { rows: 24, cols: 15, mines: 60, label: 'Hard' }, 
};