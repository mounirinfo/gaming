import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { Difficulty } from '../types';

interface GameOverModalProps {
  visible: boolean;
  score: number;
  difficulty: Difficulty;
  isNewBest: boolean;
  onRetry: () => void;
  onChangeLevel: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  visible,
  score,
  difficulty,
  isNewBest,
  onRetry,
  onChangeLevel,
  onHome,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onHome}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{t('gameOver.title')}</Text>
          
          <Text style={styles.score}>
            {t('gameOver.finalScore', { score })}
          </Text>

          {isNewBest && (
            <Text style={styles.newBest}>{t('gameOver.newBest')}</Text>
          )}

          <View style={styles.buttonContainer}>
            <Button
              title={t('common.retry')}
              onPress={onRetry}
              variant="primary"
            />
            <Button
              title={t('common.changeLevel')}
              onPress={onChangeLevel}
              variant="secondary"
            />
            <Button
              title={t('common.home')}
              onPress={onHome}
              variant="danger"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#00d9ff',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: 20,
    textAlign: 'center',
  },
  score: {
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  newBest: {
    fontSize: 20,
    color: '#00d9ff',
    marginBottom: 30,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 15,
    width: '100%',
  },
});