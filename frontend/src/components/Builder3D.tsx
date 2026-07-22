"use client";

import React, { useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, Edges, Sparkles, ContactShadows, SoftShadows, Box, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

// Re-using types from the builder
export type ShapeType = 'square' | 'triangle' | 'bed' | 'wall' | 'pillar';

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
  floor?: number;
}

interface Builder3DProps {
  placedItems: PlacedItem[];
  buildItems: BuildItem[];
}

const SIDE = 60;
const TRI_H = (SIDE * Math.sqrt(3)) / 2; // 51.9615

const Item3D = ({ item, def, allItems, buildDefs }: { item: PlacedItem, def: BuildItem, allItems: PlacedItem[], buildDefs: BuildItem[] }) => {
  // Convert 2D canvas coordinates to 3D world coordinates
  const scale = 1 / 10;
  
  const posX = item.x * scale;
  const posZ = item.y * scale;
  
  const rotY = -item.rotation * (Math.PI / 180);

  const floorLevel = item.floor || 0;
  const floorOffset = floorLevel * 3.0; // Each floor is 3.0 units high

  const isRoof = def.id.includes('roof') || def.id.includes('hole');
  const heightOffset = floorOffset + (isRoof ? 3.0 : 0.0); 
  
  const width = SIDE * scale;
  const length = SIDE * scale;
  const height = isRoof ? 0.3 : 0.4; // Slightly thicker roof

  const color = new THREE.Color(item.customColor || def.color);
  if (def.materialClass === 'structure') {
    // Apply premium tech aesthetic by forcing green glow on structures without custom color if desired
    // Actually, let's keep the user's custom color or the default def color, but make it look more premium
  }

  // Draw square or triangle or bed
  if (def.shape === 'bed') {
    const bedWidth = 20 * scale;
    const bedLength = 40 * scale;
    const bedHeight = 0.5;
    const bedPosY = bedHeight / 2;
    const radius = 270 * scale; // 4.5 foundations

    // Check if bed is on a roof
    const isOnRoof = allItems.some(other => {
      const otherDef = buildDefs.find(d => d.id === other.itemId);
      if (!otherDef || !(otherDef.id.includes('roof') || otherDef.id.includes('hole'))) return false;
      
      const dx = Math.abs(other.x - item.x);
      const dy = Math.abs(other.y - item.y);
      const sameFloor = (other.floor || 0) === floorLevel;
      return dx < 45 && dy < 45 && sameFloor; 
    });

    const spawnY = floorOffset + (isOnRoof ? 3.3 : 0.41);

    return (
      <group position={[posX, spawnY, posZ]} rotation={[0, rotY, 0]}>
        <group>
          {/* The Bed itself */}
          <Box args={[bedWidth, bedHeight, bedLength]} position={[0, bedPosY, 0]} castShadow receiveShadow>
            <meshPhysicalMaterial 
              color="#ff4757" 
              roughness={0.4} 
              metalness={0.1} 
              clearcoat={0.5} 
              clearcoatRoughness={0.2} 
            />
            <Edges scale={1.05} color="#ffffff" opacity={0.5} transparent />
          </Box>
          
          {/* Protection Radius Area */}
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[radius, 64]} />
            <meshBasicMaterial color="#ff4757" transparent opacity={0.03} depthWrite={false} />
          </mesh>
          
          {/* Protection Radius Border */}
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius - 0.2, radius, 64]} />
            <meshBasicMaterial color="#ff4757" transparent opacity={0.4} depthWrite={false} />
          </mesh>
        </group>
      </group>
    );
  } else if (def.shape === 'square') {
    return (
      <group position={[posX, height / 2 + heightOffset, posZ]} rotation={[0, rotY, 0]}>
        <Box args={[width, height, length]} castShadow receiveShadow>
          <meshPhysicalMaterial 
            color={color} 
            transparent 
            opacity={0.8} 
            roughness={0.3} 
            metalness={0.6}
            clearcoat={0.2}
          />
          <Edges scale={1.01} color="black" opacity={0.3} transparent />
        </Box>
      </group>
    );
  } else if (def.shape === 'wall') {
    return (
      <group position={[posX, floorOffset + 1.5 + (isRoof ? 0 : 0.2), posZ]} rotation={[0, rotY, 0]}>
        <Box args={[width, 3.0, 0.4]} castShadow receiveShadow>
          <meshPhysicalMaterial 
            color={color} 
            transparent 
            opacity={0.8} 
            roughness={0.3} 
            metalness={0.6}
            clearcoat={0.2} 
          />
          <Edges scale={1.01} color="black" opacity={0.3} transparent />
        </Box>
      </group>
    );
  } else if (def.shape === 'pillar') {
    return (
      <group position={[posX, floorOffset + 1.5 + (isRoof ? 0 : 0.2), posZ]} rotation={[0, rotY, 0]}>
        <Cylinder args={[0.4, 0.4, 3.0, 16]} castShadow receiveShadow>
          <meshPhysicalMaterial 
            color={color} 
            transparent 
            opacity={0.8} 
            roughness={0.3} 
            metalness={0.6}
            clearcoat={0.2} 
          />
          <Edges scale={1.02} color="black" opacity={0.3} transparent threshold={15} />
        </Cylinder>
      </group>
    );
  } else {
    // Triangle
    const shape = useMemo(() => {
      const s = new THREE.Shape();
      const w = width;
      const h = TRI_H * scale;
      s.moveTo(0, h * 2/3); 
      s.lineTo(w/2, -h * 1/3); 
      s.lineTo(-w/2, -h * 1/3); 
      s.lineTo(0, h * 2/3);
      return s;
    }, [width, scale]);

    const extrudeSettings = { depth: height, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 0.05, bevelThickness: 0.05 };

    return (
      <group position={[posX, heightOffset, posZ]} rotation={[0, rotY, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <extrudeGeometry args={[shape, extrudeSettings]} />
          <meshPhysicalMaterial 
            color={color} 
            transparent 
            opacity={0.8} 
            roughness={0.3} 
            metalness={0.6}
            clearcoat={0.2} 
          />
          <Edges scale={1.01} color="black" opacity={0.3} transparent threshold={15} />
        </mesh>
      </group>
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
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#202428' }}>
      <Canvas shadows camera={{ position: [center[0], 25, center[2] + 25] as [number, number, number], fov: 40 }}>
        <color attach="background" args={['#202428']} />
        
        {/* Soft shadows for premium look */}
        <SoftShadows size={10} samples={16} focus={0.5} />

        <ambientLight intensity={0.6} color="#ffffff" />
        <directionalLight 
          position={[30, 50, 20]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-40}
          shadow-camera-right={40}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
          color="#ffffff"
          shadow-bias={-0.0001}
        />
        <pointLight position={[-20, 20, -20]} intensity={0.3} color="#ffffff" />

        {/* Use a softer environment preset */}
        <Environment preset="dawn" />

        <OrbitControls 
          target={[center[0], center[1], center[2]] as [number, number, number]} 
          maxPolarAngle={Math.PI / 2 - 0.05} 
          dampingFactor={0.05} 
          makeDefault 
        />

        <Grid 
          position={[0, -0.01, 0]} 
          args={[200, 200]} 
          cellSize={0.6} 
          cellThickness={1} 
          cellColor="#3a4048" 
          sectionSize={3} 
          sectionThickness={1.5} 
          sectionColor="#4b5563" 
          fadeDistance={100} 
          fadeStrength={2}
        />

        {/* Ground Plane */}
        <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[300, 300]} />
          <meshStandardMaterial color="#1a1d21" roughness={0.8} metalness={0.2} />
        </mesh>

        {/* Adds realistic soft ground shadows */}
        <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={100} blur={2} far={10} />

        <Suspense fallback={null}>
          <group>
            {placedItems.map(item => {
              const def = buildItems.find(d => d.id === item.itemId);
              if (!def) return null;
              return <Item3D key={item.id} item={item} def={def} allItems={placedItems} buildDefs={buildItems} />;
            })}
          </group>
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
