import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, AppState, Text, TouchableOpacity } from 'react-native';
import { Canvas, Rect, Group, RoundedRect, Circle } from '@shopify/react-native-skia';
import { GestureDetector, Gesture, GestureHandlerRootView, Directions } from 'react-native-gesture-handler';
import { DeviceMotion } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

import { GAME_CONFIG } from '../constants';
import { Player, Obstacle, PowerUp, GameState } from '../types';
import { checkCollision, clamp } from '../utils/physics';
import { spawnObstacle, spawnPowerUp } from '../systems/spawner';
import { StorageUtils } from '../utils/storage';
import { HUD } from '../components/HUD';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Scale factor to map Logical 360x640 to Device Screen
const SCALE_X = SCREEN_WIDTH / GAME_CONFIG.WIDTH;
const SCALE_Y = SCREEN_HEIGHT / GAME_CONFIG.HEIGHT;

export const GameScreen = () => {
  const navigation = useNavigation<any>();
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Settings State
  const [settings, setSettings] = useState(StorageUtils.getSettings()); // Promise-based init handled in useEffect
  
  // React State for HUD updates (debounced from loop)
  const [hudState, setHudState] = useState({ score: 0, time: 0, powerUp: null as string | null, lives: 1 });

  // --- GAME REFS (Hot Path) ---
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  
  const playerRef = useRef<Player>({
    id: 'p1',
    x: GAME_CONFIG.WIDTH / 2 - GAME_CONFIG.PLAYER.WIDTH / 2,
    y: GAME_CONFIG.HEIGHT - GAME_CONFIG.PLAYER.HEIGHT - 20,
    w: GAME_CONFIG.PLAYER.WIDTH,
    h: GAME_CONFIG.PLAYER.HEIGHT,
    type: 'player',
    color: GAME_CONFIG.PLAYER.COLOR,
    vx: 0,
    invincibleTimer: 0,
    lives: 1,
  } as Player); // Cast to Player to satisfy TS strictness if interface differs slightly

  const obstaclesRef = useRef<Obstacle[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  
  const gameStateRef = useRef<GameState>({
    isPlaying: true,
    isGameOver: false,
    isPaused: false,
    score: 0,
    timeElapsed: 0,
    gameSpeedMultiplier: 1.0,
    slowTimer: 0,
  });

  const spawnTimerRef = useRef(0);
  const inputRef = useRef({ left: false, right: false, tiltVelocity: 0 });

  // --- CONTROLS ---

  // Tilt Sensor
  useEffect(() => {
    let subscription: any;
    const setupSensors = async () => {
      const s = await StorageUtils.getSettings();
      setSettings(s as any);
      
      if (s.tiltEnabled) {
        DeviceMotion.setUpdateInterval(30); // ~30ms
        subscription = DeviceMotion.addListener((data) => {
          const gamma = data.rotation?.gamma || 0; 
          if (Math.abs(gamma) > 0.05) {
             inputRef.current.tiltVelocity = gamma * 2.5; 
          } else {
             inputRef.current.tiltVelocity = 0;
          }
        });
      }
    };
    setupSensors();
    return () => subscription?.remove();
  }, []);

  // Gestures
  // FIX: Added .runOnJS(true) to all gestures to allow modifying JS Refs safely
  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((e) => {
      // @ts-ignore
      if (settings?.tiltEnabled) return; 
      
      if (e.absoluteX < SCREEN_WIDTH / 2) {
        inputRef.current.left = true;
        inputRef.current.right = false;
      } else {
        inputRef.current.left = false;
        inputRef.current.right = true;
      }
    })
    .onFinalize(() => {
      // @ts-ignore
      if (settings?.tiltEnabled) return;
      inputRef.current.left = false;
      inputRef.current.right = false;
    });
  
  const flingLeft = Gesture.Fling()
    .direction(Directions.LEFT)
    .runOnJS(true)
    .onStart(() => {
       playerRef.current.x = clamp(playerRef.current.x - GAME_CONFIG.SWIPE_DISTANCE, 0, GAME_CONFIG.WIDTH - playerRef.current.w);
    });

  const flingRight = Gesture.Fling()
    .direction(Directions.RIGHT)
    .runOnJS(true)
    .onStart(() => {
       playerRef.current.x = clamp(playerRef.current.x + GAME_CONFIG.SWIPE_DISTANCE, 0, GAME_CONFIG.WIDTH - playerRef.current.w);
    });

  const composedGestures = Gesture.Simultaneous(panGesture, flingLeft, flingRight);

  // --- GAME LOOP ---
  const update = (time: number) => {
    if (gameStateRef.current.isPaused || gameStateRef.current.isGameOver) {
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    const deltaTimeMs = time - lastTimeRef.current;
    const dt = Math.min(deltaTimeMs / 1000, 0.1); 
    lastTimeRef.current = time;

    const state = gameStateRef.current;
    
    // 1. Update Timers
    state.timeElapsed += dt * state.gameSpeedMultiplier;
    
    if (state.slowTimer > 0) {
      state.slowTimer -= deltaTimeMs;
      state.gameSpeedMultiplier = 0.5;
    } else {
      state.gameSpeedMultiplier = 1.0;
    }

    if (playerRef.current.invincibleTimer > 0) {
      playerRef.current.invincibleTimer -= deltaTimeMs;
    }

    // 2. Player Movement
    let dx = 0;
    
    if ((settings as any)?.tiltEnabled) {
      dx = inputRef.current.tiltVelocity * GAME_CONFIG.PLAYER.SPEED;
    } else {
      if (inputRef.current.left) dx = -GAME_CONFIG.PLAYER.SPEED;
      if (inputRef.current.right) dx = GAME_CONFIG.PLAYER.SPEED;
    }

    playerRef.current.x = clamp(playerRef.current.x + dx * dt, 0, GAME_CONFIG.WIDTH - playerRef.current.w);

    // 3. Spawning
    spawnTimerRef.current -= deltaTimeMs * state.gameSpeedMultiplier;
    if (spawnTimerRef.current <= 0) {
      if (obstaclesRef.current.length < GAME_CONFIG.MAX_ENTITIES) {
        obstaclesRef.current.push(spawnObstacle(state.timeElapsed));
        const pwr = spawnPowerUp();
        if (pwr) powerUpsRef.current.push(pwr);
      }
      
      const reduction = GAME_CONFIG.OBSTACLE.SPAWN_DECREASE_PER_SEC * state.timeElapsed;
      const nextInterval = Math.max(
        GAME_CONFIG.OBSTACLE.MIN_SPAWN_INTERVAL,
        GAME_CONFIG.OBSTACLE.SPAWN_INTERVAL_BASE - reduction
      );
      spawnTimerRef.current = nextInterval;
    }

    // 4. Update Entities & Collision
    
    // Obstacles
    obstaclesRef.current.forEach(obs => {
      obs.y += obs.speed * dt * state.gameSpeedMultiplier;
      
      if (checkCollision(playerRef.current, obs)) {
        if (playerRef.current.invincibleTimer <= 0) {
          handleGameOver();
        } else {
          obs.markedForDeletion = true; 
        }
      }

      if (obs.y > GAME_CONFIG.HEIGHT) obs.markedForDeletion = true;
    });

    // Powerups
    powerUpsRef.current.forEach(p => {
      p.y += GAME_CONFIG.POWERUP.SPEED * dt * state.gameSpeedMultiplier;
      
      if (checkCollision(playerRef.current, p)) {
        applyPowerUp(p);
        p.markedForDeletion = true;
      }
      if (p.y > GAME_CONFIG.HEIGHT) p.markedForDeletion = true;
    });

    obstaclesRef.current = obstaclesRef.current.filter(o => !o.markedForDeletion);
    powerUpsRef.current = powerUpsRef.current.filter(p => !p.markedForDeletion);

    // 5. Score
    state.score += GAME_CONFIG.SCORE.BASE_PER_SECOND * dt * state.gameSpeedMultiplier;

    setHudState({
      score: state.score,
      time: state.timeElapsed,
      powerUp: state.slowTimer > 0 ? 'slow' : playerRef.current.invincibleTimer > 0 ? 'invincible' : null,
      lives: playerRef.current.lives
    });

    requestRef.current = requestAnimationFrame(update);
  };

  const applyPowerUp = (p: PowerUp) => {
    // @ts-ignore
    if (settings?.soundEnabled) {
       // Play sound
    }
    
    // @ts-ignore
    if (settings?.vibrationEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    switch (p.effectType) {
      case 'slow':
        gameStateRef.current.slowTimer = GAME_CONFIG.POWERUP.TYPES.SLOW.duration;
        break;
      case 'invincible':
        playerRef.current.invincibleTimer = GAME_CONFIG.POWERUP.TYPES.INVINCIBLE.duration;
        break;
      case 'points':
        gameStateRef.current.score += GAME_CONFIG.SCORE.POINT_BONUS;
        break;
      case 'repair':
        playerRef.current.lives += 1;
        break;
    }
  };

  const handleGameOver = () => {
    if (gameStateRef.current.isGameOver) return;
    
    // @ts-ignore
    if (settings?.vibrationEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    gameStateRef.current.isGameOver = true;
    gameStateRef.current.isPlaying = false;
    cancelAnimationFrame(requestRef.current!);
    setIsGameOver(true);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if (nextState === 'background' || nextState === 'inactive') {
        gameStateRef.current.isPaused = true;
        setIsPaused(true);
      }
    });
    return () => sub.remove();
  }, []);

  const saveAndExit = async () => {
    await StorageUtils.saveScore(Math.floor(hudState.score));
    navigation.goBack();
  };

  const retry = () => {
    playerRef.current.x = GAME_CONFIG.WIDTH / 2;
    playerRef.current.invincibleTimer = 0;
    obstaclesRef.current = [];
    powerUpsRef.current = [];
    gameStateRef.current = {
      isPlaying: true,
      isGameOver: false,
      isPaused: false,
      score: 0,
      timeElapsed: 0,
      gameSpeedMultiplier: 1.0,
      slowTimer: 0,
    };
    lastTimeRef.current = performance.now();
    setIsGameOver(false);
    requestRef.current = requestAnimationFrame(update);
  };

  const manualMoveStart = (dir: 'left' | 'right') => {
    if (dir === 'left') inputRef.current.left = true;
    else inputRef.current.right = true;
  };
  
  const manualMoveEnd = () => {
    inputRef.current.left = false;
    inputRef.current.right = false;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#2c3e50' }}>
      <GestureDetector gesture={composedGestures}>
        <View style={styles.container}>
          
          <Canvas style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
            <Group transform={[{ scaleX: SCALE_X }, { scaleY: SCALE_Y }]}>
              <Rect x={0} y={0} width={GAME_CONFIG.WIDTH} height={GAME_CONFIG.HEIGHT} color="#2c3e50" />
              
              {obstaclesRef.current.map(o => (
                <RoundedRect 
                  key={o.id} 
                  x={o.x} y={o.y} width={o.w} height={o.h} r={4} 
                  color={o.color} 
                />
              ))}

              {powerUpsRef.current.map(p => (
                <Group key={p.id}>
                  <Circle cx={p.x + p.w/2} cy={p.y + p.h/2} r={p.w/2} color={p.color} />
                  <Circle cx={p.x + p.w/2} cy={p.y + p.h/2} r={p.w/3} color="white" opacity={0.5} />
                </Group>
              ))}

              <RoundedRect
                x={playerRef.current.x}
                y={playerRef.current.y}
                width={playerRef.current.w}
                height={playerRef.current.h}
                r={8}
                color={playerRef.current.invincibleTimer > 0 
                  ? ((Math.floor(Date.now() / 100) % 2 === 0) ? GAME_CONFIG.PLAYER.INVINCIBLE_COLOR : GAME_CONFIG.PLAYER.COLOR) 
                  : GAME_CONFIG.PLAYER.COLOR
                }
              />
            </Group>
          </Canvas>

          <HUD 
            score={hudState.score} 
            time={hudState.time} 
            activePowerUp={hudState.powerUp} 
            lives={hudState.lives}
          />

          <TouchableOpacity 
            style={styles.pauseBtn} 
            onPress={() => {
              gameStateRef.current.isPaused = !gameStateRef.current.isPaused;
              setIsPaused(gameStateRef.current.isPaused);
            }}
          >
            <Text style={styles.btnText}>||</Text>
          </TouchableOpacity>

          <View style={styles.controlsContainer} pointerEvents="box-none">
            <View 
              style={styles.controlZone} 
              onTouchStart={() => manualMoveStart('left')} 
              onTouchEnd={manualMoveEnd} 
            />
             <View 
              style={styles.controlZone} 
              onTouchStart={() => manualMoveStart('right')} 
              onTouchEnd={manualMoveEnd} 
            />
          </View>

          {(isPaused && !isGameOver) && (
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>PAUSED</Text>
              <TouchableOpacity style={styles.btn} onPress={() => {
                gameStateRef.current.isPaused = false;
                setIsPaused(false);
              }}><Text style={styles.btnText}>RESUME</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnDestructive]} onPress={() => navigation.goBack()}>
                <Text style={styles.btnText}>QUIT</Text>
              </TouchableOpacity>
            </View>
          )}

          {isGameOver && (
            <View style={styles.overlay}>
              <Text style={[styles.overlayTitle, { color: '#e74c3c' }]}>GAME OVER</Text>
              <Text style={styles.scoreResult}>Final Score: {Math.floor(hudState.score)}</Text>
              
              <TouchableOpacity style={styles.btn} onPress={retry}>
                <Text style={styles.btnText}>RETRY</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.btn} onPress={saveAndExit}>
                <Text style={styles.btnText}>SAVE & QUIT</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  pauseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    flexDirection: 'row',
  },
  controlZone: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  overlayTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  scoreResult: {
    fontSize: 24,
    color: '#f1c40f',
    marginBottom: 40,
  },
  btn: {
    backgroundColor: '#3498db',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    marginBottom: 15,
    minWidth: 200,
    alignItems: 'center',
  },
  btnDestructive: {
    backgroundColor: '#e74c3c',
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});