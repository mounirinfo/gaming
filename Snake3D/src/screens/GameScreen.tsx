import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Direction } from '../types';
import { useGameStore } from '../store/gameStore';
import { useScoresStore } from '../store/scoresStore';
import { Scene3D } from '../components/Scene3D';
import { Scene2D } from '../components/Scene2D'; // Import new 2D Scene
import { GameControls } from '../components/GameControls';
import { GameHUD } from '../components/GameHUD';
import { GameOverModal } from './GameOverScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

export const GameScreen: React.FC<Props> = ({ route, navigation }) => {
  const { difficulty, gameMode } = route.params; // Get gameMode
  const gameState = useGameStore();
  const { scores, updateScore } = useScoresStore();
  
  const [showGameOver, setShowGameOver] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize game
  useEffect(() => {
    gameState.reset(difficulty, gameMode); // Pass mode to reset
    return () => stopLoop();
  }, []);

  const startLoop = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    gameLoopRef.current = setInterval(() => {
      gameState.tick();
    }, gameState.speed);
  };

  const stopLoop = () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  };

  // Manage Game Loop State
  useEffect(() => {
    if (gameState.status === 'PLAYING') {
      startLoop();
    } else {
      stopLoop();
    }
    return () => stopLoop();
  }, [gameState.status, gameState.speed]);

  // Watch for Game Over
  useEffect(() => {
    if (gameState.status === 'GAME_OVER' && !showGameOver) {
      stopLoop();
      const currentBest = scores[difficulty];
      if (gameState.score > currentBest) {
        updateScore(difficulty, gameState.score);
      }
      setShowGameOver(true);
    }
  }, [gameState.status]);

  const handleDirection = (dir: Direction) => {
    gameState.changeDirection(dir);
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* View Layer - Switch based on mode */}
      <View style={styles.sceneContainer}>
        {gameMode === '3D' ? <Scene3D /> : <Scene2D />}
      </View>

      {/* UI Overlay Layer */}
      <View style={styles.uiContainer} pointerEvents="box-none">
        <GameHUD 
          score={gameState.score}
          difficulty={difficulty}
          isPaused={gameState.status === 'PAUSED'}
          onPause={gameState.pause}
          onResume={gameState.resume}
          onBack={() => navigation.goBack()}
        />

        <GameControls 
          onDirectionChange={handleDirection} 
          disabled={gameState.status !== 'PLAYING'}
          gameMode={gameMode} // Pass mode to controls
        />
      </View>

      {/* Game Over Modal */}
      <GameOverModal
        visible={showGameOver}
        score={gameState.score}
        difficulty={difficulty}
        isNewBest={gameState.score > scores[difficulty]}
        onRetry={() => {
          setShowGameOver(false);
          gameState.reset(difficulty, gameMode);
        }}
        onChangeLevel={() => {
          setShowGameOver(false);
          navigation.navigate('LevelSelect', { gameMode });
        }}
        onHome={() => {
          setShowGameOver(false);
          navigation.navigate('Home');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  sceneContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  uiContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
});