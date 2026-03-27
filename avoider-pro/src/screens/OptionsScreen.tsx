import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StorageUtils } from '../utils/storage';
import { GameSettings } from '../types';

export const OptionsScreen = () => {
  const navigation = useNavigation();
  const [settings, setSettings] = useState<GameSettings | null>(null);

  useEffect(() => {
    StorageUtils.getSettings().then(setSettings);
  }, []);

  const toggle = (key: keyof GameSettings) => {
    if (!settings) return;
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    StorageUtils.saveSettings(newSettings);
  };

  if (!settings) return <View />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OPTIONS</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Sound Effects</Text>
        <Switch value={settings.soundEnabled} onValueChange={() => toggle('soundEnabled')} />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Vibration</Text>
        <Switch value={settings.vibrationEnabled} onValueChange={() => toggle('vibrationEnabled')} />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Tilt Controls</Text>
        <Switch value={settings.tiltEnabled} onValueChange={() => toggle('tiltEnabled')} />
      </View>
      <Text style={styles.subtext}>Requires Motion Permissions on device</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Show Tutorial</Text>
        <Switch value={settings.tutorialEnabled} onValueChange={() => toggle('tutorialEnabled')} />
      </View>

      <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
        <Text style={styles.btnText}>BACK</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
    padding: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 40,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 10,
  },
  label: {
    color: 'white',
    fontSize: 18,
  },
  subtext: {
    color: '#95a5a6',
    fontSize: 12,
    marginTop: -15,
    marginBottom: 20,
    marginLeft: 5,
  },
  btn: {
    marginTop: 40,
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
  },
});