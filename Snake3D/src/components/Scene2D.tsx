import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber'; 
import * as THREE from 'three';
import { Text } from '@react-three/drei'; 
// Correction du chemin d'importation : remonter d'un niveau depuis components vers store
import { useGameStore } from '../store/gameStore';

// --- Assets ---
const headGeometry = new THREE.SphereGeometry(0.5, 32, 32); 
const bodyGeometry = new THREE.SphereGeometry(0.48, 32, 32); 
const eyeGeometry = new THREE.SphereGeometry(0.12, 16, 16);
const foodNormalGeometry = new THREE.SphereGeometry(0.4, 32, 32);
const foodBigGeometry = new THREE.SphereGeometry(0.6, 32, 32); 

// --- Composants ---

const FloatingScore = ({ text, position }: { text: string, position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.position.y += delta * 2;
      meshRef.current.scale.multiplyScalar(0.95);
    }
  });

  return (
    <group ref={meshRef} position={position}>
      <Text
        color="#ffd700" 
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
  
  const headVec = new THREE.Vector3(position[0]-0.5, position[1]-0.5, position[2]);
  const foodVec = new THREE.Vector3(foodPos.x, foodPos.y, foodPos.z);
  const dist = headVec.distanceTo(foodVec);
  const isMouthOpen = dist < 2.0; 

  useFrame((state, delta) => {
    if (groupRef.current) {
      const targetRotation = new THREE.Euler();
      switch (direction) {
        case 'UP': targetRotation.set(Math.PI / 2, 0, 0); break;
        case 'DOWN': targetRotation.set(-Math.PI / 2, 0, 0); break;
        case 'LEFT': targetRotation.set(0, -Math.PI / 2, 0); break;
        case 'RIGHT': targetRotation.set(0, Math.PI / 2, 0); break;
      }
      
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotation.x, 0.25);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation.y, 0.25);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotation.z, 0.25);
      
      const breathe = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.02;
      groupRef.current.scale.set(breathe, breathe, breathe);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh geometry={headGeometry}>
        <meshStandardMaterial color="#32CD32" roughness={0.2} metalness={0.1} />
      </mesh>
      
      <group position={[0, 0, 0]}>
        <mesh position={[-0.2, 0.25, 0.3]} geometry={eyeGeometry}>
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[0.2, 0.25, 0.3]} geometry={eyeGeometry}>
          <meshStandardMaterial color="white" />
        </mesh>
        
        <mesh position={[-0.2, 0.3, 0.38]} scale={0.4}>
           <sphereGeometry args={[0.12, 8, 8]} />
           <meshBasicMaterial color="black" />
        </mesh>
        <mesh position={[0.2, 0.3, 0.38]} scale={0.4}>
           <sphereGeometry args={[0.12, 8, 8]} />
           <meshBasicMaterial color="black" />
        </mesh>
      </group>
      
      <group rotation={[isMouthOpen ? 0.5 : 0, 0, 0]}> 
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
        if (index === 0) return null; 
        
        return (
          <mesh
            key={segment.id}
            position={[segment.x + 0.5, segment.y + 0.5, 0]}
            geometry={bodyGeometry}
          >
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
      meshRef.current.position.z = Math.sin(state.clock.elapsedTime * 5) * 0.1;
      meshRef.current.rotation.y += 0.02;
      meshRef.current.rotation.x += 0.01;
    }
  });

  const isBig = foodType === 'BIG';
  const color = isBig ? "#FFD700" : "#FF4500"; 

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
    </mesh>
  );
};

const BackgroundPlane = ({ size }: { size: number }) => {
  return (
    <mesh position={[size/2, size/2, -1]}>
      <planeGeometry args={[size * 10, size * 10]} />
      <meshBasicMaterial color="#1a1a2e" />
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
      
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 10]} intensity={1.0} castShadow />
      <pointLight position={[center, center, 5]} intensity={0.8} color="#ffffff" distance={20} />

      <BackgroundPlane size={level.gridSize} />
      
      {snake.length > 0 && (
        <SnakeHead2D 
          position={[snake[0].x + 0.5, snake[0].y + 0.5, 0]}
          direction={direction}
          foodPos={food}
        />
      )}
      
      <SnakeBody2D segments={snake} />
      
      <Food2D />

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