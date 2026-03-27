import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  I18nManager,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList, GameMode } from '../types';
import { Button } from '../components/Button';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const [selectedMode, setSelectedMode] = useState<GameMode>('3D');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        <Text style={styles.title}>{t('home.title')}</Text>
        <Text style={styles.subtitle}>{t('home.subtitle')}</Text>

        <Text style={styles.sectionTitle}>Select Game Mode</Text>
        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[styles.modeBtn, selectedMode === '2D' && styles.modeBtnActive]}
            onPress={() => setSelectedMode('2D')}
          >
            <Text style={[styles.modeText, selectedMode === '2D' && styles.modeTextActive]}>
              Snake 2D
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modeBtn, selectedMode === '3D' && styles.modeBtnActive]}
            onPress={() => setSelectedMode('3D')}
          >
            <Text style={[styles.modeText, selectedMode === '3D' && styles.modeTextActive]}>
              Snake 3D
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={t('common.play')}
            onPress={() => navigation.navigate('LevelSelect', { gameMode: selectedMode })}
            variant="primary"
          />
          <Button
            title={t('common.settings')}
            onPress={() => navigation.navigate('Settings')}
            variant="secondary"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#00d9ff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#ffffff',
    marginBottom: 40,
    textAlign: 'center',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 15,
    opacity: 0.8,
  },
  modeContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 40,
  },
  modeBtn: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    backgroundColor: '#16213e',
    borderWidth: 2,
    borderColor: '#0f3460',
    minWidth: 120,
    alignItems: 'center',
  },
  modeBtnActive: {
    borderColor: '#00d9ff',
    backgroundColor: '#0f3460',
  },
  modeText: {
    color: '#666',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modeTextActive: {
    color: '#00d9ff',
  },
  buttonContainer: {
    gap: 20,
    width: '100%',
    alignItems: 'center',
  },
});