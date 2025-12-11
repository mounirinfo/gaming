import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, AppState, Text, TouchableOpacity, Platform } from 'react-native';
import { Canvas, Rect, Group, Image, useImage, vec, Atlas, Circle, Oval, LinearGradient, RoundedRect, Path, Shadow } from '@shopify/react-native-skia';
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

const SCALE_X = SCREEN_WIDTH / GAME_CONFIG.WIDTH;
const SCALE_Y = SCREEN_HEIGHT / GAME_CONFIG.HEIGHT;

export const GameScreen = () => {
  const navigation = useNavigation<any>();
  
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [settings, setSettings] = useState(StorageUtils.getSettings());
  const [hudState, setHudState] = useState({ score: 0, time: 0, powerUp: null as string | null, lives: 1 });

  // Refs
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const roadOffsetRef = useRef(0); 
  const sirenColorRef = useRef(0); // For Police Siren Animation
  
  // Ref for the police X position to calculate delay
  const chaserXRef = useRef(GAME_CONFIG.WIDTH / 2 - GAME_CONFIG.PLAYER.WIDTH / 2);

  const playerRef = useRef<Player>({
    id: 'p1',
    x: GAME_CONFIG.WIDTH / 2 - GAME_CONFIG.PLAYER.WIDTH / 2,
    y: GAME_CONFIG.HEIGHT - GAME_CONFIG.PLAYER.HEIGHT - 120, 
    w: GAME_CONFIG.PLAYER.WIDTH,
    h: GAME_CONFIG.PLAYER.HEIGHT,
    type: 'player',
    color: GAME_CONFIG.PLAYER.COLOR,
    vx: 0,
    invincibleTimer: 0,
    lives: 1
   
  });

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
  } as GameState); 

  const spawnTimerRef = useRef(0);
  const inputRef = useRef({ left: false, right: false, tiltVelocity: 0, boost: false });

  // Sensors
  useEffect(() => {
    let subscription: any;
    const setupSensors = async () => {
      const s = await StorageUtils.getSettings();
      setSettings(s as any);
      if (s.tiltEnabled) {
        DeviceMotion.setUpdateInterval(30); 
        subscription = DeviceMotion.addListener((data) => {
          const gamma = data.rotation?.gamma || 0; 
          if (Math.abs(gamma) > 0.05) inputRef.current.tiltVelocity = gamma * 2.5; 
          else inputRef.current.tiltVelocity = 0;
        });
      }
    };
    setupSensors();
    return () => subscription?.remove();
  }, []);

  // Gestures
  const panGesture = Gesture.Pan().runOnJS(true).onUpdate(() => {});
  
  const flingLeft = Gesture.Fling().direction(Directions.LEFT).runOnJS(true).onStart(() => {
       playerRef.current.x = clamp(playerRef.current.x - GAME_CONFIG.SWIPE_DISTANCE, 0, GAME_CONFIG.WIDTH - playerRef.current.w);
  });

  const flingRight = Gesture.Fling().direction(Directions.RIGHT).runOnJS(true).onStart(() => {
       playerRef.current.x = clamp(playerRef.current.x + GAME_CONFIG.SWIPE_DISTANCE, 0, GAME_CONFIG.WIDTH - playerRef.current.w);
  });

  const composedGestures = Gesture.Simultaneous(panGesture, flingLeft, flingRight);

  // Update Loop
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
    const boostMultiplier = inputRef.current.boost ? 1.5 : 1.0;
    const finalSpeedMultiplier = state.gameSpeedMultiplier * boostMultiplier;

    state.timeElapsed += dt * finalSpeedMultiplier;
    roadOffsetRef.current = (roadOffsetRef.current + (400 * dt * finalSpeedMultiplier)) % 120;
    
    // Siren Animation
    sirenColorRef.current += dt * 10; 

    // --- POLICE DELAY LOGIC (Smooth Chase) ---
    // Instead of setting equal directly, we move chaser towards player over time
    // Lerp factor of 5 * dt gives a nice "lag" effect (approx 0.2-0.3s delay)
    const lerpFactor = 5 * dt;
    const dist = playerRef.current.x - chaserXRef.current;
    chaserXRef.current += dist * lerpFactor;

    if (state.slowTimer > 0) {
      state.slowTimer -= deltaTimeMs;
      state.gameSpeedMultiplier = 0.5;
    } else {
      state.gameSpeedMultiplier = 1.0;
    }
    if (playerRef.current.invincibleTimer > 0) playerRef.current.invincibleTimer -= deltaTimeMs;

    let dx = 0;
    if ((settings as any)?.tiltEnabled) {
      dx = inputRef.current.tiltVelocity * GAME_CONFIG.PLAYER.SPEED;
    } else {
      if (inputRef.current.left) dx = -GAME_CONFIG.PLAYER.SPEED;
      if (inputRef.current.right) dx = GAME_CONFIG.PLAYER.SPEED;
    }
    playerRef.current.x = clamp(playerRef.current.x + dx * dt, 0, GAME_CONFIG.WIDTH - playerRef.current.w);

    spawnTimerRef.current -= deltaTimeMs * finalSpeedMultiplier;
    if (spawnTimerRef.current <= 0) {
      if (obstaclesRef.current.length < GAME_CONFIG.MAX_ENTITIES) {
        obstaclesRef.current.push(spawnObstacle(state.timeElapsed));
        const pwr = spawnPowerUp();
        if (pwr) powerUpsRef.current.push(pwr);
      }
      const reduction = GAME_CONFIG.OBSTACLE.SPAWN_DECREASE_PER_SEC * state.timeElapsed;
      spawnTimerRef.current = Math.max(GAME_CONFIG.OBSTACLE.MIN_SPAWN_INTERVAL, GAME_CONFIG.OBSTACLE.SPAWN_INTERVAL_BASE - reduction);
    }

    obstaclesRef.current.forEach(obs => {
      obs.y += obs.speed * dt * finalSpeedMultiplier;
      if (checkCollision(playerRef.current, obs)) {
        if (playerRef.current.invincibleTimer <= 0) handleGameOver();
        else obs.markedForDeletion = true; 
      }
      if (obs.y > GAME_CONFIG.HEIGHT) obs.markedForDeletion = true;
    });

    powerUpsRef.current.forEach(p => {
      p.y += GAME_CONFIG.POWERUP.SPEED * dt * finalSpeedMultiplier;
      if (checkCollision(playerRef.current, p)) {
        applyPowerUp(p);
        p.markedForDeletion = true;
      }
      if (p.y > GAME_CONFIG.HEIGHT) p.markedForDeletion = true;
    });

    obstaclesRef.current = obstaclesRef.current.filter(o => !o.markedForDeletion);
    powerUpsRef.current = powerUpsRef.current.filter(p => !p.markedForDeletion);

    const scoreTick = GAME_CONFIG.SCORE.BASE_PER_SECOND * dt * finalSpeedMultiplier;
    state.score += inputRef.current.boost ? scoreTick * 2 : scoreTick;

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
    if (settings?.vibrationEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    switch (p.effectType) {
      case 'slow': gameStateRef.current.slowTimer = GAME_CONFIG.POWERUP.TYPES.SLOW.duration; break;
      case 'invincible': playerRef.current.invincibleTimer = GAME_CONFIG.POWERUP.TYPES.INVINCIBLE.duration; break;
      case 'points': gameStateRef.current.score += GAME_CONFIG.SCORE.POINT_BONUS; break;
      case 'repair': playerRef.current.lives += 1; break;
    }
  };

  const handleGameOver = () => {
    if (gameStateRef.current.isGameOver) return;
    // @ts-ignore
    if (settings?.vibrationEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    gameStateRef.current.isGameOver = true;
    gameStateRef.current.isPlaying = false;
    cancelAnimationFrame(requestRef.current!);
    setIsGameOver(true);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
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
    chaserXRef.current = GAME_CONFIG.WIDTH / 2 - GAME_CONFIG.PLAYER.WIDTH / 2; // Reset Chaser
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
    } as GameState;
    lastTimeRef.current = performance.now();
    setIsGameOver(false);
    requestRef.current = requestAnimationFrame(update);
  };

  const handlePressIn = (action: 'left' | 'right' | 'boost') => {
    if (action === 'left') inputRef.current.left = true;
    if (action === 'right') inputRef.current.right = true;
    if (action === 'boost') inputRef.current.boost = true;
  };
  
  const handlePressOut = (action: 'left' | 'right' | 'boost') => {
    if (action === 'left') inputRef.current.left = false;
    if (action === 'right') inputRef.current.right = false;
    if (action === 'boost') inputRef.current.boost = false;
  };

  // Get the calculated lagged position
  const chaserX = chaserXRef.current;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
      <GestureDetector gesture={composedGestures}>
        <View style={styles.container}>
          
          <Canvas style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
            <Group transform={[{ scaleX: SCALE_X }, { scaleY: SCALE_Y }]}>
              
              {/* --- 1. MODERN ENVIRONMENT --- */}
              {/* Grass with Gradient (Depth) */}
              <Rect x={0} y={0} width={GAME_CONFIG.WIDTH} height={GAME_CONFIG.HEIGHT}>
                <LinearGradient start={vec(0, 0)} end={vec(GAME_CONFIG.WIDTH, 0)} colors={["#2ecc71", "#27ae60", "#2ecc71"]} />
              </Rect>
              
              {/* Asphalt Road with Border */}
              <Group>
                 {/* Curb */}
                 <Rect x={35} y={0} width={GAME_CONFIG.WIDTH - 70} height={GAME_CONFIG.HEIGHT} color="#95a5a6" />
                 {/* Road Surface */}
                 <Rect x={45} y={0} width={GAME_CONFIG.WIDTH - 90} height={GAME_CONFIG.HEIGHT} color="#34495e" />
              </Group>

              {/* Smooth Road Lines */}
              <Group>
                 <RoundedRect x={GAME_CONFIG.WIDTH/2 - 4} y={-100 + roadOffsetRef.current} width={8} height={60} r={4} color="rgba(255,255,255,0.4)" />
                 <RoundedRect x={GAME_CONFIG.WIDTH/2 - 4} y={50 + roadOffsetRef.current} width={8} height={60} r={4} color="rgba(255,255,255,0.4)" />
                 <RoundedRect x={GAME_CONFIG.WIDTH/2 - 4} y={200 + roadOffsetRef.current} width={8} height={60} r={4} color="rgba(255,255,255,0.4)" />
                 <RoundedRect x={GAME_CONFIG.WIDTH/2 - 4} y={350 + roadOffsetRef.current} width={8} height={60} r={4} color="rgba(255,255,255,0.4)" />
                 <RoundedRect x={GAME_CONFIG.WIDTH/2 - 4} y={500 + roadOffsetRef.current} width={8} height={60} r={4} color="rgba(255,255,255,0.4)" />
                 <RoundedRect x={GAME_CONFIG.WIDTH/2 - 4} y={650 + roadOffsetRef.current} width={8} height={60} r={4} color="rgba(255,255,255,0.4)" />
              </Group>

              {/* --- 2. THE CHASER (POLICE OFFICER) --- */}
              <Group>
                 {/* Soft Shadow */}
                 <Oval x={chaserX + 5} y={GAME_CONFIG.HEIGHT - 70} width={40} height={12} color="rgba(0,0,0,0.3)" />
                 
                 {/* Body (Smooth Rounded Rect) */}
                 <RoundedRect x={chaserX + 5} y={GAME_CONFIG.HEIGHT - 90} width={38} height={30} r={8} color="#0c2461" />
                 
                 {/* Head (Circle) */}
                 <Circle cx={chaserX + 24} cy={GAME_CONFIG.HEIGHT - 95} r={14} color="#f1c40f" /> 
                 <Circle cx={chaserX + 24} cy={GAME_CONFIG.HEIGHT - 95} r={14} color="#fab1a0" />
                 
                 {/* Cap (Dark Blue) */}
                 <RoundedRect x={chaserX + 8} y={GAME_CONFIG.HEIGHT - 110} width={32} height={12} r={4} color="#0c2461" />
                 <Rect x={chaserX + 8} y={GAME_CONFIG.HEIGHT - 105} width={32} height={4} color="gold" />

                 {/* Siren Lights (Flashing) */}
                 <Circle 
                    cx={chaserX + 16} cy={GAME_CONFIG.HEIGHT - 112} r={4} 
                    color={Math.sin(sirenColorRef.current) > 0 ? "#ff4757" : "#57606f"} 
                 />
                 <Circle 
                    cx={chaserX + 32} cy={GAME_CONFIG.HEIGHT - 112} r={4} 
                    color={Math.sin(sirenColorRef.current) < 0 ? "#3742fa" : "#57606f"} 
                 />
              </Group>

              {/* --- 3. OBSTACLES (VARIETY: BARRIERS & POTHOLES) --- */}
              {obstaclesRef.current.map((o, index) => {
                // Use index or ID to determine type deterministically
                const isPothole = o.id.charCodeAt(o.id.length - 1) % 2 === 0;

                return (
                  <Group key={o.id}>
                    {isPothole ? (
                      // --- POTHOLE VISUAL ---
                      <Group>
                        <Oval x={o.x} y={o.y + 10} width={o.w} height={o.h - 10} color="#212b36" />
                        <Oval x={o.x + 5} y={o.y + 15} width={o.w - 10} height={o.h - 20} color="#17202a" />
                      </Group>
                    ) : (
                      // --- BARRIER VISUAL (Red/White Stripes) ---
                      <Group>
                        {/* Shadow */}
                        <Oval x={o.x + 2} y={o.y + o.h - 5} width={o.w - 4} height={8} color="rgba(0,0,0,0.3)" />
                        
                        {/* Barrier Body (Red) */}
                        <RoundedRect x={o.x} y={o.y} width={o.w} height={o.h} r={4} color="#e74c3c" />
                        
                        {/* White Stripes (Diagonal) */}
                        <Path path={`M ${o.x + 10} ${o.y} L ${o.x} ${o.y + 20} L ${o.x} ${o.y + 30} L ${o.x + 20} ${o.y} Z`} color="white" />
                        <Path path={`M ${o.x + 40} ${o.y} L ${o.x + 10} ${o.y + o.h} L ${o.x + 25} ${o.y + o.h} L ${o.x + 55} ${o.y} Z`} color="white" />
                        <Path path={`M ${o.x + o.w} ${o.y + 10} L ${o.x + 40} ${o.y + o.h} L ${o.x + 55} ${o.y + o.h} L ${o.x + o.w} ${o.y + 20} Z`} color="white" />
                        
                        {/* Top Bar Highlight */}
                        <Rect x={o.x} y={o.y} width={o.w} height={4} color="rgba(255,255,255,0.2)" />
                      </Group>
                    )}
                  </Group>
                )
              })}

              {/* --- 4. POWERUPS (GLOWING ORBS) --- */}
              {powerUpsRef.current.map(p => (
                 <Group key={p.id}>
                   <Circle cx={p.x + p.w/2} cy={p.y + p.h/2} r={p.w/2 + 2} color="rgba(255, 255, 255, 0.5)" />
                   <Circle cx={p.x + p.w/2} cy={p.y + p.h/2} r={p.w/2} color="#0984e3">
                      <LinearGradient start={vec(p.x, p.y)} end={vec(p.x + p.w, p.y + p.h)} colors={["#74b9ff", "#0984e3"]} />
                   </Circle>
                   {/* Shine */}
                   <Circle cx={p.x + p.w/3} cy={p.y + p.h/3} r={4} color="white" />
                 </Group>
              ))}

              {/* --- 5. PLAYER (MODERN KID) --- */}
              <Group 
                 opacity={playerRef.current.invincibleTimer > 0 && (Math.floor(Date.now() / 100) % 2 === 0) ? 0.5 : 1}
              >
                {/* Shadow */}
                <Oval x={playerRef.current.x + 5} y={playerRef.current.y + playerRef.current.h - 5} width={38} height={10} color="rgba(0,0,0,0.4)" />
                
                {/* Backpack (Brown) */}
                <RoundedRect x={playerRef.current.x + 10} y={playerRef.current.y + 25} width={28} height={30} r={5} color="#8e44ad" />

                {/* Body (Hoodie - Red Gradient) */}
                <RoundedRect x={playerRef.current.x + 5} y={playerRef.current.y + 20} width={38} height={35} r={10} color="#e74c3c" />
                
                {/* Head (Skin) */}
                <Circle cx={playerRef.current.x + 24} cy={playerRef.current.y + 15} r={14} color="#ffcea5" />
                
                {/* Cap (Blue - Backwards) */}
                <Path path={`M ${playerRef.current.x + 10} ${playerRef.current.y + 15} Q ${playerRef.current.x + 24} ${playerRef.current.y - 5} ${playerRef.current.x + 38} ${playerRef.current.y + 15} Z`} color="#0984e3" />
                <RoundedRect x={playerRef.current.x + 10} y={playerRef.current.y + 12} width={28} height={5} r={2} color="#0984e3" />
              </Group>

            </Group>
          </Canvas>

          <HUD 
            score={hudState.score} 
            time={hudState.time} 
            activePowerUp={hudState.powerUp} 
            lives={hudState.lives}
          />

          {/* --- MODERN GLASSMORPHISM CONTROLS --- */}
          <View style={styles.controlsBar}>
            <TouchableOpacity 
               style={styles.modernBtn}
               onPressIn={() => handlePressIn('left')}
               onPressOut={() => handlePressOut('left')}
               activeOpacity={0.7}
            >
              <Text style={styles.modernBtnIcon}>◀</Text>
            </TouchableOpacity>

            <TouchableOpacity 
               style={[styles.modernBtn, styles.modernBoost]}
               onPressIn={() => handlePressIn('boost')}
               onPressOut={() => handlePressOut('boost')}
               activeOpacity={0.7}
            >
              <Text style={styles.modernBtnIcon}>🚀</Text>
            </TouchableOpacity>

            <TouchableOpacity 
               style={styles.modernBtn}
               onPressIn={() => handlePressIn('right')}
               onPressOut={() => handlePressOut('right')}
               activeOpacity={0.7}
            >
              <Text style={styles.modernBtnIcon}>▶</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.pauseBtn} 
            onPress={() => {
              gameStateRef.current.isPaused = !gameStateRef.current.isPaused;
              setIsPaused(gameStateRef.current.isPaused);
            }}
          >
            <Text style={styles.pauseBtnText}>||</Text>
          </TouchableOpacity>

          {(isPaused && !isGameOver) && (
            <View style={styles.overlay}>
              <View style={styles.modernCard}>
                <Text style={styles.modernTitle}>PAUSED</Text>
                <TouchableOpacity style={styles.modernActionBtn} onPress={() => {
                  gameStateRef.current.isPaused = false;
                  setIsPaused(false);
                }}><Text style={styles.modernActionText}>RESUME</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.modernActionBtn, {backgroundColor: '#ff7675'}]} onPress={() => navigation.goBack()}>
                  <Text style={styles.modernActionText}>QUIT</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {isGameOver && (
            <View style={styles.overlay}>
              <View style={styles.modernCard}>
                <Text style={[styles.modernTitle, { color: '#ff4757' }]}>BUSTED!</Text>
                <Text style={styles.modernSubtitle}>Score: {Math.floor(hudState.score)}</Text>
                <TouchableOpacity style={styles.modernActionBtn} onPress={retry}>
                  <Text style={styles.modernActionText}>TRY AGAIN</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modernActionBtn, {backgroundColor: '#74b9ff'}]} onPress={saveAndExit}>
                  <Text style={styles.modernActionText}>SAVE</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  pauseBtnText: {
    fontWeight: '900',
    fontSize: 16,
    color: 'white',
  },
  controlsBar: {
    position: 'absolute',
    bottom: 40,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 15,
  },
  modernBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)', // Glass effect
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  modernBoost: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 118, 117, 0.8)', // Modern Salmon color
    borderColor: '#ff7675',
    shadowColor: '#ff7675',
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  modernBtnIcon: {
    fontSize: 30,
    color: 'white',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
   
  },
  modernCard: {
    backgroundColor: 'white',
    padding: 30,
    width: '85%',
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modernTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2d3436',
    marginBottom: 10,
    letterSpacing: 1,
  },
  modernSubtitle: {
    fontSize: 24,
    color: '#636e72',
    marginBottom: 30,
    fontWeight: '600',
  },
  modernActionBtn: {
    backgroundColor: '#0984e3',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#0984e3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modernActionText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 1,
  },
});