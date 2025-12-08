import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Vibration } from 'react-native';
import { Flag, Bomb } from 'lucide-react-native';
import { PALETTE, NUMBER_COLORS } from '../constants/theme';
import { CellData, InteractionType, ThemeType } from '../types';

interface CellProps {
  data: CellData;
  index: number;
  cellSize: number;
  onInteraction: (index: number, type: InteractionType) => void;
  theme: ThemeType;
}

const Cell: React.FC<CellProps> = React.memo(({ data, index, cellSize, onInteraction, theme }) => {
  const isDark = theme === 'dark';

  // Dynamic Styles
  const getBackgroundColor = () => {
    if (data.revealed) {
        if (data.isMine) return data.exploded ? PALETTE.danger : (isDark ? '#7f1d1d' : '#fca5a5');
        return isDark ? '#1E293B' : '#F1F5F9'; // Slate 800 : Slate 100
    }
    return isDark ? '#334155' : '#FFFFFF'; // Slate 700 : White
  };

  const handlePress = () => onInteraction(index, 'TAP');
  
  const handleLongPress = () => {
    Vibration.vibrate(50);
    onInteraction(index, 'LONG_PRESS');
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={250}
      activeOpacity={0.7}
      style={[
        styles.cell,
        {
            width: cellSize - 2, // Accounting for margin
            height: cellSize - 2,
            backgroundColor: getBackgroundColor(),
        }
      ]}
    >
        {data.revealed && data.isMine && <Bomb size={cellSize * 0.6} color="white" />}
        
        {data.revealed && !data.isMine && data.neighborMines > 0 && (
            <Text style={{ 
                color: NUMBER_COLORS[data.neighborMines], 
                fontWeight: '900', 
                fontSize: cellSize * 0.65 
            }}>
                {data.neighborMines}
            </Text>
        )}
        
        {!data.revealed && data.flagged && (
            <Flag size={cellSize * 0.6} color={PALETTE.flag} fill={PALETTE.flag} />
        )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
    cell: {
        margin: 1,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        // Shadow for depth
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    }
});

export default Cell;