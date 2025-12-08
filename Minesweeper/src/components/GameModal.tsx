import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RefreshCw, X, Check } from 'lucide-react-native';
import { PALETTE, DIFFICULTIES } from '../constants/theme';
import { GameState, Difficulty, ThemeType } from '../types';

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: GameState;
  time: number;
  onNewGame: (diff: Difficulty) => void;
  currentDifficulty: Difficulty;
  theme: ThemeType;
}

const GameModal: React.FC<GameModalProps> = ({ isOpen, onClose, type, time, onNewGame, currentDifficulty, theme }) => {
  const isDark = theme === 'dark';
  const isWin = type === 'WON';
  const isLoss = type === 'LOST';

  const styles = getStyles(isDark);

  return (
    <Modal visible={isOpen} transparent={true} animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>
                    {isWin ? 'Victory! 🎉' : isLoss ? 'Game Over 💥' : 'Game Menu'}
                </Text>
                {!isWin && !isLoss && (
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <X size={24} color={isDark ? '#FFF' : '#333'} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Content */}
            {isWin && (
                <View style={{ alignItems: 'center', marginVertical: 20 }}>
                    <Text style={{ fontSize: 40, fontWeight: '900', color: PALETTE.accent }}>{time}s</Text>
                    <Text style={{ color: '#94A3B8' }}>New Record!</Text>
                </View>
            )}

            <View style={{ marginVertical: 20 }}>
                <Text style={styles.sectionTitle}>SELECT DIFFICULTY</Text>
                <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'space-between' }}>
                    {Object.values(DIFFICULTIES).map(diff => (
                        <TouchableOpacity 
                            key={diff.label}
                            onPress={() => onNewGame(diff)}
                            style={[
                                styles.diffBtn, 
                                currentDifficulty.label === diff.label && styles.diffBtnActive
                            ]}
                        >
                            <Text style={[
                                styles.diffText, 
                                currentDifficulty.label === diff.label && { color: PALETTE.accent }
                            ]}>
                                {diff.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Footer Button */}
            <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => onNewGame(currentDifficulty)}
            >
                {isWin || isLoss ? <RefreshCw color="white" size={20} /> : <Check color="white" size={20}/>}
                <Text style={styles.actionBtnText}>
                    {isWin || isLoss ? ' Play Again' : ' Resume / Restart'}
                </Text>
            </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: isDark ? PALETTE.bgDark : PALETTE.cardLight,
        borderRadius: 24,
        padding: 24,
        // Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        position: 'relative',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: isDark ? '#FFF' : '#1E293B',
    },
    closeBtn: {
        position: 'absolute',
        right: 0,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94A3B8',
        marginBottom: 10,
        letterSpacing: 1,
    },
    diffBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: isDark ? '#334155' : '#E2E8F0',
        alignItems: 'center',
    },
    diffBtnActive: {
        borderColor: PALETTE.accent,
        backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
    },
    diffText: {
        fontWeight: 'bold',
        color: isDark ? '#CBD5E1' : '#64748B',
    },
    actionBtn: {
        backgroundColor: PALETTE.accent,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        marginTop: 10,
    },
    actionBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    }
});

export default GameModal;