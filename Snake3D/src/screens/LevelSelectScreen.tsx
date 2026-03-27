import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList, Difficulty } from '../types';
import { Button } from '../components/Button';
import { useScoresStore } from '../store/scoresStore';

type Props = NativeStackScreenProps<RootStackParamList, 'LevelSelect'>;

export const LevelSelectScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const scores = useScoresStore((state) => state.scores);
  const { gameMode } = route.params; // Get the mode passed from Home

  const levels: Array<{
    difficulty: Difficulty;
    title: string;
    description: string;
    color: string;
  }> = [
    {
      difficulty: 'EASY',
      title: t('levelSelect.easy'),
      description: t('levelSelect.easyDesc'),
      color: '#00d9ff',
    },
    {
      difficulty: 'MEDIUM',
      title: t('levelSelect.medium'),
      description: t('levelSelect.mediumDesc'),
      color: '#ffa500',
    },
    {
      difficulty: 'HARD',
      title: t('levelSelect.hard'),
      description: t('levelSelect.hardDesc'),
      color: '#e94560',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.modeIndicator}>Mode: {gameMode}</Text>
        <Text style={styles.title}>{t('levelSelect.title')}</Text>

        {levels.map((level) => (
          <View key={level.difficulty} style={styles.levelCard}>
            <Text style={[styles.levelTitle, { color: level.color }]}>
              {level.title}
            </Text>
            <Text style={styles.levelDesc}>{level.description}</Text>
            <Text style={styles.bestScore}>
              {t('common.bestScore')}: {scores[level.difficulty]}
            </Text>
            <Button
              title={t('common.play')}
              onPress={() =>
                navigation.navigate('Game', { 
                  difficulty: level.difficulty,
                  gameMode: gameMode // Pass mode to Game screen
                })
              }
              variant="primary"
              style={styles.levelButton}
            />
          </View>
        ))}

        <Button
          title={t('common.back')}
          onPress={() => navigation.goBack()}
          variant="secondary"
          style={styles.backButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  modeIndicator: {
    color: '#ffffff',
    opacity: 0.6,
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00d9ff',
    marginBottom: 30,
    textAlign: 'center',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  levelCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0f3460',
  },
  levelTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  levelDesc: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  bestScore: {
    fontSize: 14,
    color: '#00d9ff',
    marginBottom: 15,
  },
  levelButton: {
    minWidth: 150,
  },
  backButton: {
    marginTop: 20,
    minWidth: 200,
  },
});