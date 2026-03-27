import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, useColorScheme, Dimensions, SafeAreaView, Vibration } from 'react-native';
import { Flag, Bomb, Settings, RefreshCw } from 'lucide-react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

import { PALETTE, DIFFICULTIES } from './src/constants/theme';
import { generateBoard, floodFill, getNeighbors } from './src/utils/gameLogic';
import Cell from './src/components/Cell';
import GameModal from './src/components/GameModal';
import { Difficulty, GameState, CellData, ControlMode, InteractionType } from './src/types';

export default function App() {
  const systemTheme = useColorScheme();
  const [isDark, setIsDark] = useState<boolean>(systemTheme === 'dark');
  
  // Game State
  const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTIES.EASY);
  const [gameState, setGameState] = useState<GameState>('MENU'); 
  const [board, setBoard] = useState<CellData[]>([]);
  const [time, setTime] = useState<number>(0);
  const [flags, setFlags] = useState<number>(0);
  const [controlMode, setControlMode] = useState<ControlMode>('DIG');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [cellSize, setCellSize] = useState<number>(30);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Layout Calculation
  const calculateLayout = (diff: Difficulty) => {
    const screenWidth = Dimensions.get('window').width;
    const padding = 32; // 16px each side
    const availableWidth = screenWidth - padding;
    const size = Math.floor(availableWidth / diff.cols);
    setCellSize(size);
  };

  useEffect(() => {
    calculateLayout(difficulty);
  }, [difficulty]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Game Logic
  const initGame = (diff: Difficulty = difficulty) => {
    setDifficulty(diff);
    calculateLayout(diff);
    const count = diff.rows * diff.cols;
    const initialBoard: CellData[] = new Array(count).fill(null).map((_, i) => ({
      id: i, isMine: false, revealed: false, flagged: false, neighborMines: 0, exploded: false
    }));
    setBoard(initialBoard);
    setGameState('IDLE');
    setTime(0);
    setFlags(0);
    setShowModal(false);
  };

  // First run
  useEffect(() => {
    initGame();
  }, []);

  const handleWin = () => {
    setGameState('WON');
    setShowModal(true);
    Vibration.vibrate([100, 100, 100]);
  };

  const handleLoss = () => {
    setGameState('LOST');
    setShowModal(true);
    Vibration.vibrate(400);
    // Reveal all mines
    setBoard(prev => prev.map(cell => ({
      ...cell,
      revealed: cell.isMine ? true : cell.revealed,
      exploded: cell.isMine && !cell.flagged && !cell.revealed
    })));
  };

  const checkWin = (currentBoard: CellData[]) => {
    const hidden = currentBoard.filter(c => !c.isMine && !c.revealed).length;
    if (hidden === 0) handleWin();
  };

  const handleInteraction = useCallback((index: number, type: InteractionType) => {
    if (gameState === 'WON' || gameState === 'LOST') return;
    
    let currentBoard = [...board];

    // First Click Safety
    if (gameState === 'IDLE') {
        currentBoard = generateBoard(difficulty.rows, difficulty.cols, difficulty.mines, index);
        setGameState('PLAYING');
    }

    const cell = currentBoard[index];

    // Flag Logic
    if (type === 'LONG_PRESS' || (type === 'TAP' && controlMode === 'FLAG')) {
        if (cell.revealed) return;
        if (!cell.flagged && flags >= difficulty.mines) return;

        cell.flagged = !cell.flagged;
        setFlags(prev => cell.flagged ? prev + 1 : prev - 1);
        setBoard(currentBoard);
        return;
    }

    // Reveal Logic (Dig)
    if (type === 'TAP' && controlMode === 'DIG') {
        if (cell.flagged) return; // Protected
        if (cell.revealed) {
            // Chord Logic
            const neighbors = getNeighbors(index, difficulty.rows, difficulty.cols);
            const flagCount = neighbors.reduce((acc, n) => acc + (currentBoard[n].flagged ? 1 : 0), 0);
            
            if (flagCount === cell.neighborMines) {
                // Auto reveal neighbors
                let hitMine = false;
                neighbors.forEach(n => {
                    if (!currentBoard[n].flagged && !currentBoard[n].revealed) {
                        if (currentBoard[n].isMine) {
                            currentBoard[n].exploded = true;
                            currentBoard[n].revealed = true;
                            hitMine = true;
                        } else if (currentBoard[n].neighborMines === 0) {
                             currentBoard = floodFill(currentBoard, n, difficulty.rows, difficulty.cols);
                        } else {
                             currentBoard[n].revealed = true;
                        }
                    }
                });
                setBoard(currentBoard);
                if (hitMine) handleLoss();
                else checkWin(currentBoard);
            }
            return;
        }

        // Normal Reveal
        if (cell.isMine) {
            cell.exploded = true;
            cell.revealed = true;
            setBoard(currentBoard);
            handleLoss();
        } else {
            const newBoard = floodFill(currentBoard, index, difficulty.rows, difficulty.cols);
            setBoard(newBoard);
            checkWin(newBoard);
        }
    }

  }, [board, gameState, controlMode, difficulty, flags]);

  const themeColors = isDark ? { bg: PALETTE.bgDark, text: '#FFF' } : { bg: PALETTE.bgLight, text: '#1E293B' };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <ExpoStatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Bomb color={PALETTE.accent} size={24} />
            <Text style={[styles.appTitle, { color: themeColors.text }]}>Minesweeper</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => setIsDark(!isDark)} style={styles.iconBtn}>
                 <Text style={{ fontSize: 18 }}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowModal(true)} style={styles.iconBtn}>
                 <Settings color={themeColors.text} size={20} />
            </TouchableOpacity>
        </View>
      </View>

      {/* HUD */}
      <View style={[styles.hud, { backgroundColor: isDark ? '#1E293B' : '#FFF' }]}>
        <View style={styles.statBox}>
             <Flag color={PALETTE.danger} size={20} />
             <Text style={[styles.statText, { color: themeColors.text }]}>{difficulty.mines - flags}</Text>
        </View>
        
        <TouchableOpacity onPress={() => initGame(difficulty)} style={styles.faceBtn}>
             <Text style={{ fontSize: 24 }}>{gameState === 'WON' ? '😎' : gameState === 'LOST' ? '😵' : '🙂'}</Text>
        </TouchableOpacity>

        <View style={styles.statBox}>
             <Text style={[styles.statText, { color: themeColors.text }]}>{String(time).padStart(3, '0')}</Text>
             <RefreshCw color={PALETTE.accent} size={20} />
        </View>
      </View>

      {/* Grid */}
      <View style={styles.boardContainer}>
        <View style={[
            styles.grid, 
            { 
                width: cellSize * difficulty.cols,
                backgroundColor: isDark ? PALETTE.gridBgDark : PALETTE.gridBgLight 
            }
        ]}>
            {board.map((cell, idx) => (
                <Cell 
                    key={idx}
                    index={idx}
                    data={cell}
                    cellSize={cellSize}
                    onInteraction={handleInteraction}
                    theme={isDark ? 'dark' : 'light'}
                />
            ))}
        </View>
      </View>

      {/* Footer Controls */}
      <View style={[styles.footer, { backgroundColor: isDark ? '#1E293B' : '#FFF' }]}>
         <TouchableOpacity 
            style={[styles.controlBtn, controlMode === 'DIG' && styles.controlBtnActive]}
            onPress={() => setControlMode('DIG')}
         >
            <Bomb color={controlMode === 'DIG' ? 'white' : '#94A3B8'} size={20} />
            <Text style={[styles.controlText, controlMode === 'DIG' && { color: 'white' }]}>DIG</Text>
         </TouchableOpacity>

         <TouchableOpacity 
            style={[styles.controlBtn, controlMode === 'FLAG' && { backgroundColor: PALETTE.flag }]}
            onPress={() => setControlMode('FLAG')}
         >
            <Flag color={controlMode === 'FLAG' ? 'white' : '#94A3B8'} size={20} />
            <Text style={[styles.controlText, controlMode === 'FLAG' && { color: 'white' }]}>FLAG</Text>
         </TouchableOpacity>
      </View>

      <GameModal 
         isOpen={showModal}
         onClose={() => setShowModal(false)}
         type={gameState}
         time={time}
         onNewGame={initGame}
         currentDifficulty={difficulty}
         theme={isDark ? 'dark' : 'light'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 30, // Safe area fix
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  iconBtn: {
    padding: 8,
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 16,
    marginVertical: 10,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 80,
    justifyContent: 'center',
  },
  statText: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  faceBtn: {
    backgroundColor: PALETTE.accent,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 8,
    
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    margin: 20,
    borderRadius: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  controlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    gap: 8,
  },
  controlBtnActive: {
    backgroundColor: PALETTE.accent,
  },
  controlText: {
    fontWeight: 'bold',
    color: '#94A3B8',
  }
});