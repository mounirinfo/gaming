import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GAME_CONFIG } from '../constants';

interface HUDProps {
  score: number;
  time: number;
  activePowerUp: string | null;
  lives: number;
}

export const HUD: React.FC<HUDProps> = ({ score, time, activePowerUp, lives }: HUDProps) => {
  const getPowerUpLabel = (id: string) => {
    const powerupTypes = GAME_CONFIG.POWERUP.TYPES as Record<string, { id: string; color: string; duration: number; label: string }>;
    const p = Object.values(powerupTypes).find((t: any) => t.id === id);
    return p ? p.label : id;
  };

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.topRow}>
        <Text style={styles.scoreText}>Score: {Math.floor(score)}</Text>
        <Text style={styles.timeText}>{time.toFixed(1)}s</Text>
      </View>
      
      {/* Lives */}
      <View style={styles.livesContainer}>
        <Text style={styles.livesText}>Lives: {lives}</Text>
      </View>

      {/* Active Power Up Indicator */}
      {activePowerUp && (
        <View style={styles.powerUpBadge}>
          <Text style={styles.powerUpText}>{getPowerUpLabel(activePowerUp)}</Text>
          <View style={styles.progressBar} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 50, // Safe area
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  timeText: {
    color: '#ecf0f1',
    fontSize: 20,
    fontFamily: 'monospace',
  },
  livesContainer: {
    marginTop: 5,
  },
  livesText: {
    color: '#ff4757',
    fontWeight: 'bold',
    fontSize: 16,
  },
  powerUpBadge: {
    alignSelf: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'white',
  },
  powerUpText: {
    color: 'white',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'white',
    marginTop: 4,
    width: '100%',
  },
});