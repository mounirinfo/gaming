export interface Difficulty {
  rows: number;
  cols: number;
  mines: number;
  label: string;
}

export interface CellData {
  id: number;
  isMine: boolean;
  revealed: boolean;
  flagged: boolean;
  exploded: boolean;
  neighborMines: number;
}

export type GameState = 'MENU' | 'IDLE' | 'PLAYING' | 'WON' | 'LOST';
export type ControlMode = 'DIG' | 'FLAG';
export type InteractionType = 'TAP' | 'LONG_PRESS';
export type ThemeType = 'light' | 'dark';