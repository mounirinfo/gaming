import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber'; 
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { LevelConfig } from '../types';

// Reusable Geometry
const segmentGeometry = new THREE.SphereGeometry(0.45, 16, 16);
const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
const foodGeometry = new THREE.SphereGeometry(0.4, 16, 16);

// Reuse the same head component logic but adapted if needed (though it works for 2D view too)
const SnakeHead2D = ({ position, direction, isEating }: { position: [number, number, number], direction: string, isEating: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      const targetRotation = new THREE.Euler();
      switch (direction) {
        case 'UP': targetRotation.set(Math.PI / 2, 0, 0); break;
        case 'DOWN': targetRotation.set(-Math.PI / 2, 0, 0); break;
        case 'LEFT': targetRotation.set(0, -Math.PI / 2, 0); break;
        case 'RIGHT': targetRotation.set(0, Math.PI / 2, 0); break;
      }
      
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotation.x, 0.2);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation.y, 0.2);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotation.z, 0.2);
      
      if (isEating) {
         const s = 1 + Math.sin(state.clock.elapsedTime * 20) * 0.1;
         groupRef.current.scale.set(s, s, s);
      } else {
         groupRef.current.scale.set(1, 1, 1);
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh geometry={headGeometry}>
        <meshStandardMaterial color="#00ff00" roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[-0.2, 0.2, 0.35]} geometry={eyeGeometry}>
        <meshStandardMaterial color="white" />
        <mesh position={[0, 0, 0.08]} scale={0.5}>
           <sphereGeometry args={[0.1, 8, 8]} />
           <meshBasicMaterial color="black" />
        </mesh>
      </mesh>
      <mesh position={[0.2, 0.2, 0.35]} geometry={eyeGeometry}>
        <meshStandardMaterial color="white" />
        <mesh position={[0, 0, 0.08]} scale={0.5}>
           <sphereGeometry args={[0.1, 8, 8]} />
           <meshBasicMaterial color="black" />
        </mesh>
      </mesh>
      <mesh position={[0, -0.2, 0.35]} rotation={[Math.PI/2, 0, 0]}>
         <torusGeometry args={[0.1, 0.02, 8, 16, Math.PI]} />
         <meshBasicMaterial color="#330000" />
      </mesh>
    </group>
  );
};

const Snake2D = () => {
  const snake = useGameStore((state) => state.snake);
  const direction = useGameStore((state) => state.direction);
  const isEating = false;

  return (
    <group>
      {snake.map((segment, index) => {
        if (index === 0) {
           return (
            <SnakeHead2D 
              key={segment.id}
              position={[segment.x + 0.5, segment.y + 0.5, 0]}
              direction={direction}
              isEating={isEating}
            />
           );
        }
        return (
          <mesh
            key={segment.id}
            position={[segment.x + 0.5, segment.y + 0.5, 0]}
            geometry={segmentGeometry}
          >
            <meshStandardMaterial color="#00aa00" roughness={0.3} metalness={0.1} />
          </mesh>
        );
      })}
    </group>
  );
};

const Food2D = () => {
  const food = useGameStore((state) => state.food);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.1;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[food.x + 0.5, food.y + 0.5, 0]}
      geometry={foodGeometry}
    >
      <meshStandardMaterial color="#ff0055" emissive="#aa0033" emissiveIntensity={0.5} />
    </mesh>
  );
};

const Grid2D = ({ size }: { size: number }) => {
  const gridHelper = useMemo(() => {
    const grid = new THREE.GridHelper(size, size, 0x444444, 0x222222);
    grid.rotation.x = Math.PI / 2;
    grid.position.set(size / 2, size / 2, 0);
    return grid;
  }, [size]);

  return <primitive object={gridHelper} />;
};

export const Scene2D = () => {
  const level = useGameStore((state) => state.level);
  const center = level.gridSize / 2;

  return (
    <Canvas
      orthographic
      camera={{ position: [center, center, 50], zoom: 25, near: 0.1, far: 1000 }}
      onCreated={({ camera }) => { camera.lookAt(center, center, 0); }}
    >
      <color attach="background" args={['#111']} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[0, 0, 10]} intensity={0.5} />
      <Grid2D size={level.gridSize} />
      <Snake2D />
      <Food2D />
    </Canvas>
  );
};