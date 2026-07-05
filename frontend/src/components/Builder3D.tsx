"use client";

import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Re-using types from the builder
export type ShapeType = 'square' | 'triangle' | 'bed';

export interface BuildItem {
  id: string;
  name: string;
  shape: ShapeType;
  materialClass: 'wood' | 'metal' | 'brick' | 'furniture';
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

const getBedElevation = (bedItem: PlacedItem, allPlacedItems: PlacedItem[], allBuildItems: BuildItem[]) => {
  let maxY = 0.4;
  let closestDist = Infinity;
  let closestTopY = 0.4;
  
  allPlacedItems.forEach(other => {
    if (other.id === bedItem.id) return;
    const otherDef = allBuildItems.find(d => d.id === other.itemId);
    if (!otherDef || otherDef.shape === 'bed') return;
    
    const dist = Math.hypot(other.x - bedItem.x, other.y - bedItem.y);
    if (dist < closestDist) {
      closestDist = dist;
      const isRoof = otherDef.id.includes('roof') || otherDef.id.includes('hole');
      const heightOffset = isRoof ? 3.0 : 0.0;
      const height = isRoof ? 0.2 : 0.4;
      closestTopY = heightOffset + height;
    }
  });
  
  if (closestDist <= 40) {
    maxY = closestTopY;
  }
  return maxY;
};

const Item3D = ({ item, def, allPlacedItems, allBuildItems }: { item: PlacedItem, def: BuildItem, allPlacedItems: PlacedItem[], allBuildItems: BuildItem[] }) => {
  // Convert 2D canvas coordinates to 3D world coordinates
  // Note: Canvas y goes down, 3D z goes back. Let's map (x, y) to (x, 0, z)
  // Scaling down by a factor of 10 to keep 3D units reasonable (e.g. 60px -> 6 units)
  const scale = 1 / 10;
  
  const posX = item.x * scale;
  const posZ = item.y * scale;
  
  // Convert rotation to radians. In 2D, positive rotation is clockwise.
  // In 3D around Y axis, positive is counter-clockwise.
  const rotY = -item.rotation * (Math.PI / 180);

  // We determine height by whether it's a foundation or roof (for a basic 3D representation)
  // Since we don't have true 3D placement yet, we stack them blindly if they are roofs.
  const isRoof = def.id.includes('roof') || def.id.includes('hole');
  const heightOffset = isRoof ? 3.0 : 0.0; 
  
  const width = SIDE * scale;
  const length = SIDE * scale;
  const height = isRoof ? 0.2 : 0.4;
  const posY = height / 2 + heightOffset;

  const color = new THREE.Color(item.customColor || def.color);
  if (def.materialClass === 'metal') {
    color.multiplyScalar(1.2);
  }

  // Draw square or triangle or bed
  if (def.shape === 'bed') {
    const bedWidth = 20 * scale;
    const bedLength = 40 * scale;
    const bedHeight = 0.2;
    const bedPosY = bedHeight / 2;
    const bedBaseY = getBedElevation(item, allPlacedItems, allBuildItems); // Place on top of closest structure

    const radius = 270 * scale; // 4.5 foundations

    return (
      <group position={[posX, bedBaseY, posZ]} rotation={[0, rotY, 0]}>
        {/* The Bed itself */}
        <mesh position={[0, bedPosY, 0]} castShadow receiveShadow>
          <boxGeometry args={[bedWidth, bedHeight, bedLength]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
        
        {/* Protection Radius Area */}
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[radius, 32]} />
          <meshBasicMaterial color="#2ecc71" transparent opacity={0.1} depthWrite={false} />
        </mesh>
        
        {/* Protection Radius Border */}
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius - 0.1, radius, 64]} />
          <meshBasicMaterial color="#2ecc71" transparent opacity={0.3} depthWrite={false} />
        </mesh>
      </group>
    );
  } else if (def.shape === 'square') {
    return (
      <mesh position={[posX, posY, posZ]} rotation={[0, rotY, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, length]} />
        <meshStandardMaterial color={color} roughness={def.materialClass === 'metal' ? 0.2 : 0.8} metalness={def.materialClass === 'metal' ? 0.8 : 0.1} />
      </mesh>
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
      <group position={[posX, heightOffset, posZ]} rotation={[0, rotY, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <extrudeGeometry args={[shape, extrudeSettings]} />
          <meshStandardMaterial color={color} roughness={def.materialClass === 'metal' ? 0.2 : 0.8} metalness={def.materialClass === 'metal' ? 0.8 : 0.1} />
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
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0f0f14' }}>
      <Canvas shadows camera={{ position: [center[0], 15, center[2] + 15] as [number, number, number], fov: 45 }}>
        <color attach="background" args={['#0f0f14']} />
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
        <Environment preset="city" />

        <OrbitControls target={[center[0], center[1], center[2]] as [number, number, number]} maxPolarAngle={Math.PI / 2 - 0.05} />

        <Grid 
          position={[0, -0.01, 0]} 
          args={[200, 200]} 
          cellSize={0.6} 
          cellThickness={1} 
          cellColor="#2ecc71" 
          sectionSize={3} 
          sectionThickness={1.5} 
          sectionColor="#1a4a2c" 
          fadeDistance={100} 
          fadeStrength={1}
        />

        <group>
          {placedItems.map(item => {
            const def = buildItems.find(d => d.id === item.itemId);
            if (!def) return null;
            return <Item3D key={item.id} item={item} def={def} allPlacedItems={placedItems} allBuildItems={buildItems} />;
          })}
        </group>
      </Canvas>
      <div style={{ position: 'absolute', bottom: '20px', right: '20px', color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', backdropFilter: 'blur(4px)' }}>
        <p style={{ margin: 0, fontWeight: 'bold', color: '#2ecc71' }}>Testowy Widok 3D</p>
        <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>Złap i przeciągnij, by obrócić kamerę.<br/>Scroll, by przybliżyć.</p>
      </div>
    </div>
  );
}
