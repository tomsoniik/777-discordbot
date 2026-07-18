"use client";

import React, { useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, Edges, Sparkles } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';

// Re-using types from the builder
export type ShapeType = 'square' | 'triangle' | 'bed';

export interface BuildItem {
  id: string;
  name: string;
  shape: ShapeType;
  materialClass: 'structure' | 'furniture';
  color: string;
  texture: string;
  fallbackTexture?: string;
  imageFilter?: string;
  costs: Record<string, number>;
}

export interface PlacedItem {
  id: string;
  itemId: string;
  x: number;
  y: number;
  rotation: number;
  customColor?: string;
}

interface Builder3DProps {
  placedItems: PlacedItem[];
  buildItems: BuildItem[];
}

const SIDE = 60;
const TRI_H = (SIDE * Math.sqrt(3)) / 2; // 51.9615

const Item3D = ({ item, def }: { item: PlacedItem, def: BuildItem }) => {
  // Convert 2D canvas coordinates to 3D world coordinates
  const scale = 1 / 10;
  
  const posX = item.x * scale;
  const posZ = item.y * scale;
  
  const rotY = -item.rotation * (Math.PI / 180);

  const isRoof = def.id.includes('roof') || def.id.includes('hole');
  const heightOffset = isRoof ? 3.0 : 0.0; 
  
  const width = SIDE * scale;
  const length = SIDE * scale;
  const height = isRoof ? 0.2 : 0.4;

  const color = new THREE.Color(item.customColor || def.color);
  if (def.materialClass === 'structure') {
    // Apply premium tech aesthetic by forcing green glow on structures without custom color
    if (!item.customColor) {
      color.set('#10b981');
    }
  }

  // Draw square or triangle or bed
  if (def.shape === 'bed') {
    const bedWidth = 20 * scale;
    const bedLength = 40 * scale;
    const bedHeight = 0.2;
    const bedPosY = bedHeight / 2;
    const radius = 270 * scale; // 4.5 foundations

    return (
      <RigidBody 
        type="fixed" 
        position={[posX, 0, posZ]} 
        rotation={[0, rotY, 0]} 
        colliders="cuboid"
      >
        <group>
          {/* The Bed itself */}
          <mesh position={[0, bedPosY, 0]} castShadow receiveShadow>
            <boxGeometry args={[bedWidth, bedHeight, bedLength]} />
            <meshStandardMaterial color="#ff4757" roughness={0.5} transparent opacity={0.8} />
            <Edges scale={1.05} threshold={15} color="#ff4757" />
          </mesh>
          
          {/* Protection Radius Area */}
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[radius, 32]} />
            <meshBasicMaterial color="#ff4757" transparent opacity={0.05} depthWrite={false} />
          </mesh>
          
          {/* Protection Radius Border */}
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius - 0.1, radius, 64]} />
            <meshBasicMaterial color="#ff4757" transparent opacity={0.5} depthWrite={false} />
          </mesh>
        </group>
      </RigidBody>
    );
  } else if (def.shape === 'square') {
    return (
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[posX, height / 2 + heightOffset, posZ]} rotation={[0, rotY, 0]} castShadow receiveShadow>
          <boxGeometry args={[width, height, length]} />
          <meshStandardMaterial 
            color={color} 
            transparent 
            opacity={0.6} 
            roughness={0.2} 
            metalness={0.8} 
          />
          <Edges scale={1.0} threshold={15} color={color} opacity={0.8} transparent />
        </mesh>
      </RigidBody>
    );
  } else {
    // Triangle
    // 2D CSS Triangle was drawn with center offset, let's just make a simple triangular prism
    const shape = useMemo(() => {
      const s = new THREE.Shape();
      const w = width;
      const h = TRI_H * scale;
      // Centered triangle matching the 2D logic
      // In 2D, centroid is 1/3 from the bottom
      s.moveTo(0, h * 2/3); // Top point
      s.lineTo(w/2, -h * 1/3); // Bottom right
      s.lineTo(-w/2, -h * 1/3); // Bottom left
      s.lineTo(0, h * 2/3);
      return s;
    }, [width, scale]);

    const extrudeSettings = { depth: height, bevelEnabled: false };

    return (
      <RigidBody type="fixed" colliders="hull">
        <group position={[posX, heightOffset, posZ]} rotation={[0, rotY, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <extrudeGeometry args={[shape, extrudeSettings]} />
            <meshStandardMaterial 
              color={color} 
              transparent 
              opacity={0.6} 
              roughness={0.2} 
              metalness={0.8} 
            />
            <Edges scale={1.0} threshold={15} color={color} opacity={0.8} transparent />
          </mesh>
        </group>
      </RigidBody>
    );
  }
};

export default function Builder3D({ placedItems, buildItems }: Builder3DProps) {
  // Center camera on the average position
  const center = useMemo(() => {
    if (placedItems.length === 0) return [0, 0, 0];
    const scale = 1 / 10;
    let sx = 0, sz = 0;
    placedItems.forEach(i => { sx += i.x * scale; sz += i.y * scale; });
    return [sx / placedItems.length, 0, sz / placedItems.length] as [number, number, number];
  }, [placedItems]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#030705' }}>
      <Canvas shadows camera={{ position: [center[0], 12, center[2] + 15] as [number, number, number], fov: 45 }}>
        <color attach="background" args={['#030705']} />
        
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
          color="#a7f3d0"
        />
        <Environment preset="city" />

        <OrbitControls 
          target={[center[0], center[1], center[2]] as [number, number, number]} 
          maxPolarAngle={Math.PI / 2 - 0.05} 
          dampingFactor={0.05} 
          makeDefault 
        />

        <Sparkles count={100} scale={40} size={1.5} speed={0.2} color="#10b981" opacity={0.3} />

        <Grid 
          position={[0, -0.01, 0]} 
          args={[200, 200]} 
          cellSize={0.6} 
          cellThickness={1.5} 
          cellColor="#042f1b" 
          sectionSize={3} 
          sectionThickness={2} 
          sectionColor="#065f46" 
          fadeDistance={60} 
          fadeStrength={1}
        />
        
        <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#030705" roughness={0.1} metalness={0.8} />
        </mesh>

        <Suspense fallback={null}>
          <Physics>
            {/* Ground Plane */}
            <RigidBody type="fixed" position={[0, -0.1, 0]}>
              <CuboidCollider args={[1000, 0.05, 1000]} />
            </RigidBody>
            <group>
              {placedItems.map(item => {
                const def = buildItems.find(d => d.id === item.itemId);
                if (!def) return null;
                return <Item3D key={item.id} item={item} def={def} />;
              })}
            </group>
          </Physics>
        </Suspense>
      </Canvas>
      <div style={{ position: 'absolute', bottom: '20px', right: '20px', color: '#fff', background: 'var(--bg-card)', padding: '15px', borderRadius: '12px', fontSize: '0.9rem', backdropFilter: 'blur(10px)', border: '1px solid var(--border-color)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
        <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 10px var(--accent-green)' }} />
          Holographic 3D Engine (Optimized)
        </p>
        <p style={{ margin: '8px 0 0 0', opacity: 0.8, lineHeight: '1.5' }}>
          <b style={{ color: 'white' }}>LMB:</b> Obracanie kamery<br/>
          <b style={{ color: 'white' }}>RMB:</b> Przesuwanie<br/>
          <b style={{ color: 'white' }}>Scroll:</b> Przybliżanie
        </p>
      </div>
    </div>
  );
}
