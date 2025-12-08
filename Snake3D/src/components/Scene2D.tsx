import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber'; 
import * as THREE from 'three';
import { Text } from '@react-three/drei'; // For floating text
import { useGameStore } from '../store/gameStore';
import { GameEngine } from '../game/GameEngine';

// --- Assets ---
// Smoother snake geometry
const headGeometry = new THREE.SphereGeometry(0.5, 32, 32); 
const bodyGeometry = new THREE.SphereGeometry(0.48, 32, 32); // Slightly smaller body
const eyeGeometry = new THREE.SphereGeometry(0.12, 16, 16);
const foodNormalGeometry = new THREE.SphereGeometry(0.4, 32, 32);
const foodBigGeometry = new THREE.SphereGeometry(0.6, 32, 32); // Bigger food

// --- Components ---

const FloatingScore = ({ text, position }: { text: string, position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      // Float up animation
      meshRef.current.position.y += delta * 2;
      // Fade out logic would require custom shader or transparent material manipulation, 
      // but simpler is just scale down before unmounting
      meshRef.current.scale.multiplyScalar(0.95);
    }
  });

  return (
    <group ref={meshRef} position={position}>
      <Text
        color="#ffd700" // Gold color
        fontSize={1}
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </group>
  );
};

const SnakeHead2D = ({ position, direction, foodPos }: { position: [number, number, number], direction: string, foodPos: {x:number, y:number, z:number} }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Calculate distance to food to trigger mouth opening
  // position is [x+0.5, y+0.5, 0]
  // foodPos is raw grid coords. Adjust to center for comparison
  const headVec = new THREE.Vector3(position[0]-0.5, position[1]-0.5, position[2]);
  const foodVec = new THREE.Vector3(foodPos.x, foodPos.y, foodPos.z);
  const dist = headVec.distanceTo(foodVec);
  const isMouthOpen = dist < 2.0; // Open mouth when close (2 grid cells)

  useFrame((state, delta) => {
    if (groupRef.current) {
      const targetRotation = new THREE.Euler();
      switch (direction) {
        case 'UP': targetRotation.set(Math.PI / 2, 0, 0); break;
        case 'DOWN': targetRotation.set(-Math.PI / 2, 0, 0); break;
        case 'LEFT': targetRotation.set(0, -Math.PI / 2, 0); break;
        case 'RIGHT': targetRotation.set(0, Math.PI / 2, 0); break;
      }
      
      // Smooth rotation
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotation.x, 0.25);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation.y, 0.25);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotation.z, 0.25);
      
      // Slight "breathing" scale for life-like effect
      const breathe = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.02;
      groupRef.current.scale.set(breathe, breathe, breathe);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Head Main */}
      <mesh geometry={headGeometry}>
        <meshStandardMaterial color="#32CD32" roughness={0.2} metalness={0.1} />
      </mesh>
      
      {/* Eyes */}
      <group position={[0, 0, 0]}>
        {/* White parts */}
        <mesh position={[-0.2, 0.25, 0.3]} geometry={eyeGeometry}>
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[0.2, 0.25, 0.3]} geometry={eyeGeometry}>
          <meshStandardMaterial color="white" />
        </mesh>
        
        {/* Pupils (black) */}
        <mesh position={[-0.2, 0.3, 0.38]} scale={0.4}>
           <sphereGeometry args={[0.12, 8, 8]} />
           <meshBasicMaterial color="black" />
        </mesh>
        <mesh position={[0.2, 0.3, 0.38]} scale={0.4}>
           <sphereGeometry args={[0.12, 8, 8]} />
           <meshBasicMaterial color="black" />
        </mesh>
      </group>
      
      {/* Mouth (Lower Jaw) - Animation logic */}
      <group rotation={[isMouthOpen ? 0.5 : 0, 0, 0]}> 
         {/* Simple simulated mouth with a dark sphere cut or just positioning */}
         {/* We simulate mouth opening by rotating a "jaw" or just adding a dark shape that appears */}
         {isMouthOpen && (
            <mesh position={[0, -0.3, 0.4]} scale={[0.5, 0.2, 0.1]}>
              <sphereGeometry args={[0.5, 16, 16]} />
              <meshBasicMaterial color="#330000" />
            </mesh>
         )}
      </group>
    </group>
  );
};

const SnakeBody2D = ({ segments }: { segments: any[] }) => {
  return (
    <group>
      {segments.map((segment, index) => {
        if (index === 0) return null; // Head handled separately
        
        return (
          <mesh
            key={segment.id}
            position={[segment.x + 0.5, segment.y + 0.5, 0]}
            geometry={bodyGeometry}
          >
            {/* Gradient-like color for body: fade from head green to darker green */}
            <meshStandardMaterial 
              color={new THREE.Color().setHSL(0.33, 1.0, Math.max(0.2, 0.5 - (index * 0.01)))} 
              roughness={0.4} 
            />
          </mesh>
        );
      })}
    </group>
  );
};

const Food2D = () => {
  const food = useGameStore((state) => state.food);
  const foodType = useGameStore((state) => state.foodType);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Bobbing animation
      meshRef.current.position.z = Math.sin(state.clock.elapsedTime * 5) * 0.1;
      // Rotating animation
      meshRef.current.rotation.y += 0.02;
      meshRef.current.rotation.x += 0.01;
    }
  });

  const isBig = foodType === 'BIG';
  const color = isBig ? "#FFD700" : "#FF4500"; // Gold for big, Red-Orange for normal

  return (
    <mesh
      ref={meshRef}
      position={[food.x + 0.5, food.y + 0.5, 0]}
      geometry={isBig ? foodBigGeometry : foodNormalGeometry}
    >
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
      />
      {/* Sparkle effect for big food could be added here with particles, but keeping performant */}
    </mesh>
  );
};

// No grid lines, just a clean background plane if needed, or nothing for pure black void
const BackgroundPlane = ({ size }: { size: number }) => {
  return (
    <mesh position={[size/2, size/2, -1]}>
      <planeGeometry args={[size * 10, size * 10]} />
      <meshBasicMaterial color="#1a1a2e" /> {/* Dark blueish background */}
    </mesh>
  );
}

export const Scene2D = () => {
  const level = useGameStore((state) => state.level);
  const snake = useGameStore((state) => state.snake);
  const food = useGameStore((state) => state.food);
  const direction = useGameStore((state) => state.direction);
  const floatingTexts = useGameStore((state) => state.floatingTexts);
  
  const center = level.gridSize / 2;

  return (
    <Canvas
      orthographic
      camera={{ position: [center, center, 50], zoom: 25, near: 0.1, far: 1000 }}
      onCreated={({ camera }) => { camera.lookAt(center, center, 0); }}
    >
      <color attach="background" args={['#0f0f1a']} />
      
      {/* Cinematic Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 10]} intensity={1.0} castShadow />
      <pointLight position={[center, center, 5]} intensity={0.8} color="#ffffff" distance={20} />

      <BackgroundPlane size={level.gridSize} />
      
      {/* Render Head */}
      {snake.length > 0 && (
        <SnakeHead2D 
          position={[snake[0].x + 0.5, snake[0].y + 0.5, 0]}
          direction={direction}
          foodPos={food}
        />
      )}
      
      {/* Render Body */}
      <SnakeBody2D segments={snake} />
      
      <Food2D />

      {/* Floating Texts */}
      {floatingTexts.map((ft) => (
        <FloatingScore 
          key={ft.id} 
          text={ft.text} 
          position={[ft.position.x + 0.5, ft.position.y + 1.5, 0]} 
        />
      ))}
    </Canvas>
  );
};