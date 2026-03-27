import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsContextType {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  tiltEnabled: boolean;
  tutorialEnabled: boolean;
  laneMode: boolean; // 3-lane strict mode
  toggleSound: () => void;
  toggleVibration: () => void;
  toggleTilt: () => void;
  toggleTutorial: () => void;
  toggleLaneMode: () => void;
  markTutorialSeen: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundEnabled, setSound] = useState(true);
  const [vibrationEnabled, setVibration] = useState(true);
  const [tiltEnabled, setTilt] = useState(false);
  const [tutorialEnabled, setTutorial] = useState(true);
  const [laneMode, setLaneMode] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem('app_settings');
      if (stored) {
        const settings = JSON.parse(stored);
        setSound(settings.soundEnabled ?? true);
        setVibration(settings.vibrationEnabled ?? true);
        setTilt(settings.tiltEnabled ?? false);
        setTutorial(settings.tutorialEnabled ?? true);
        setLaneMode(settings.laneMode ?? false);
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  };

  const saveSettings = async (newSettings: Partial<SettingsContextType>) => {
    try {
      const current = { soundEnabled, vibrationEnabled, tiltEnabled, tutorialEnabled, laneMode };
      await AsyncStorage.setItem('app_settings', JSON.stringify({ ...current, ...newSettings }));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  };

  const toggleSound = () => { setSound(p => { saveSettings({ soundEnabled: !p }); return !p; }); };
  const toggleVibration = () => { setVibration(p => { saveSettings({ vibrationEnabled: !p }); return !p; }); };
  const toggleTilt = () => { setTilt(p => { saveSettings({ tiltEnabled: !p }); return !p; }); };
  const toggleTutorial = () => { setTutorial(p => { saveSettings({ tutorialEnabled: !p }); return !p; }); };
  const toggleLaneMode = () => { setLaneMode(p => { saveSettings({ laneMode: !p }); return !p; }); };
  const markTutorialSeen = () => { setTutorial(false); saveSettings({ tutorialEnabled: false }); };

  return (
    <SettingsContext.Provider value={{
      soundEnabled, vibrationEnabled, tiltEnabled, tutorialEnabled, laneMode,
      toggleSound, toggleVibration, toggleTilt, toggleTutorial, toggleLaneMode, markTutorialSeen
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};