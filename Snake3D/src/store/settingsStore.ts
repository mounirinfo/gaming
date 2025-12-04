import { create } from 'zustand';
import { Language } from '../types';
import i18n from '../i18n';

interface SettingsState {
  language: Language;
  soundEnabled: boolean;
  setLanguage: (lang: Language) => void;
  setSoundEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: 'en',
  soundEnabled: true,

  setLanguage: (lang: Language) => {
    i18n.changeLanguage(lang);
    set({ language: lang });
  },

  setSoundEnabled: (enabled: boolean) => {
    set({ soundEnabled: enabled });
  },
}));
