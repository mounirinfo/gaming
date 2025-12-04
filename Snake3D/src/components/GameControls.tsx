import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Direction } from '../types';

interface GameControlsProps {
  onDirectionChange: (direction: Direction) => void;
  disabled?: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onDirectionChange,
  disabled = false,
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

      {/* Middle Row: LEFT, FORWARD/BACKWARD, RIGHT */}
      <View style={styles.row}>
        {createButton('LEFT', '←', styles.side)}
        <View style={styles.verticalGroup}>
          {createButton('FORWARD', '▲', styles.small)}
          {createButton('BACKWARD', '▼', styles.small)}
        </View>
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