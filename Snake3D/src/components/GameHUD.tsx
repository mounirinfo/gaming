import React from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';

interface GameHUDProps {
  score: number;
  difficulty: string;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onBack: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  difficulty,
  isPaused,
  onPause,
  onResume,
  onBack,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.infoText}>
          {t('game.level', { level: difficulty })}
        </Text>
        <Text style={styles.scoreText}>
          {t('game.score', { score })}
        </Text>
      </View>

      <View style={styles.buttonRow}>
        {isPaused ? (
          <Button
            title={t('common.resume')}
            onPress={onResume}
            variant="primary"
            style={styles.controlBtn}
          />
        ) : (
          <Button
            title={t('common.pause')}
            onPress={onPause}
            variant="secondary"
            style={styles.controlBtn}
          />
        )}
        <Button
          title={t('common.back')}
          onPress={onBack}
          variant="danger"
          style={styles.controlBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  topRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 18,
    color: '#00d9ff',
    fontWeight: '600',
  },
  scoreText: {
    fontSize: 24,
    color: '#00d9ff',
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
  },
  controlBtn: {
    minWidth: 120,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
});
