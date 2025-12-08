import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Direction, GameMode } from '../types';

interface GameControlsProps {
  onDirectionChange: (direction: Direction) => void;
  disabled?: boolean;
  gameMode: GameMode; // Accept mode
}

export const GameControls: React.FC<GameControlsProps> = ({
  onDirectionChange,
  disabled = false,
  gameMode,
}) => {
  const createButton = (direction: Direction, label: string, style: any) => (
    <TouchableOpacity
      style={[styles.button, style, disabled && styles.disabled]}
      onPress={() => !disabled && onDirectionChange(direction)}
      activeOpacity={0.7}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Top Row: UP */}
      <View style={styles.row}>
        {createButton('UP', '↑', styles.center)}
      </View>

      {/* Middle Row: LEFT, RIGHT (and FWD/BACK only for 3D) */}
      <View style={styles.row}>
        {createButton('LEFT', '←', styles.side)}
        
        {/* Only show Forward/Backward in 3D Mode */}
        {gameMode === '3D' && (
          <View style={styles.verticalGroup}>
            {createButton('FORWARD', '▲', styles.small)}
            {createButton('BACKWARD', '▼', styles.small)}
          </View>
        )}
        
        {/* Spacer for 2D mode to keep layout balanced if needed, or just standard */}
        {gameMode === '2D' && <View style={{ width: 20 }} />} 

        {createButton('RIGHT', '→', styles.side)}
      </View>

      {/* Bottom Row: DOWN */}
      <View style={styles.row}>
        {createButton('DOWN', '↓', styles.center)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
  },
  button: {
    backgroundColor: 'rgba(22, 33, 62, 0.9)',
    borderWidth: 2,
    borderColor: '#00d9ff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
  },
  center: {
    width: 80,
    height: 80,
  },
  side: {
    width: 80,
    height: 80,
  },
  verticalGroup: {
    flexDirection: 'column',
    marginHorizontal: 10,
  },
  small: {
    width: 70,
    height: 50,
  },
  buttonText: {
    color: '#00d9ff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.5,
  },
});