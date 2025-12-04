import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { OrbitControls } from '@react-three/drei/native';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { LevelConfig, SnakeSegment } from '../types';

// Reusable Box Geometry to save memory
const boxGeometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
const foodGeometry = new THREE.SphereGeometry(0.4, 16, 16);

// --- Sub-components ---

const Snake = () => {
  const snake = useGameStore((state) => state.snake);

  return (
    <group>
      {snake.map((segment, index) => (
        <mesh
          key={segment.id} // IMPORTANT: React uses this to track segments efficiently
          position={[segment.x + 0.5, segment.y + 0.5, segment.z + 0.5]}
          geometry={boxGeometry}
        >
          <meshStandardMaterial
            color={index === 0 ? '#00ff00' : '#00aa00'} // Bright green head, darker body
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
};

const Food = () => {
  const food = useGameStore((state) => state.food);
  const meshRef = useRef<THREE.Mesh>(null);

  // Animation loop for just the food
  useFrame((state) => {
    if (meshRef.current) {
      // Pulse effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.1;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[food.x + 0.5, food.y + 0.5, food.z + 0.5]}
      geometry={foodGeometry}
    >
      <meshStandardMaterial
        color="#ff0055"
        emissive="#aa0033"
        emissiveIntensity={0.5}
        roughness={0.2}
      />
    </mesh>
  );
};

const Obstacles = ({ obstacles }: { obstacles: LevelConfig['obstacles'] }) => {
  return (
    <group>
      {obstacles.map((obs, i) => (
        <mesh
          key={`obs-${i}`}
          position={[obs.x + 0.5, obs.y + 0.5, obs.z + 0.5]}
          geometry={boxGeometry}
        >
          <meshStandardMaterial color="#666666" transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
};

const GridContainer = ({ size }: { size: number }) => {
  // Memoize the grid helper so it's created only once
  const { gridHelper, boxHelper } = useMemo(() => {
    // Bottom grid
    const grid = new THREE.GridHelper(size, size, 0x444444, 0x222222);
    grid.position.set(size / 2, 0, size / 2);
    
    // Outer wireframe cube
    const geometry = new THREE.BoxGeometry(size, size, size);
    const edges = new THREE.EdgesGeometry(geometry);
    const box = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x00d9ff, transparent: true, opacity: 0.3 })
    );
    box.position.set(size / 2, size / 2, size / 2);

    return { gridHelper: grid, boxHelper: box };
  }, [size]);

  return (
    <group>
      <primitive object={gridHelper} />
      <primitive object={boxHelper} />
    </group>
  );
};

// --- Main Scene ---

export const Scene3D = () => {
  const level = useGameStore((state) => state.level);
  
  // Calculate camera position based on grid size
  const camDist = level.gridSize * 1.8;
  const center = level.gridSize / 2;

  return (
    <Canvas
      camera={{
        position: [camDist, camDist * 0.8, camDist],
        fov: 50,
      }}
      onCreated={({ camera }) => {
        camera.lookAt(center, center, center);
      }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00d9ff" />

      {/* Controls: Allows user to rotate the view to better understand 3D space */}
      <OrbitControls target={[center, center, center]} enablePan={false} />

      {/* Game Objects */}
      <GridContainer size={level.gridSize} />
      <Snake />
      <Food />
      <Obstacles obstacles={level.obstacles} />
    </Canvas>
  );
};