"use client";

import React, { useMemo, useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, Edges, Sparkles, ContactShadows, SoftShadows, Box, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

import styles from '@/777_addons/styles/Builder3D.module.css';

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
  activeItem?: string | null;
  selectedColor?: string;
  currentFloor?: number;
  showBedAreas?: boolean;
  selectedItemIds?: string[];
  isNightMode?: boolean;
  onPlaceItem?: (item: Omit<PlacedItem, 'id'>) => void;
  onSelectItem?: (id: string, shiftKey: boolean) => void;
  onDeleteItem?: (id: string) => void;
  onPaintItem?: (id: string) => void;
  onSelectActiveItem?: (id: string | null) => void;
}

const SIDE = 60;
const TRI_H = (SIDE * Math.sqrt(3)) / 2; // 51.9615
const SCALE = 1 / 10;

interface Item3DProps {
  item: PlacedItem;
  def: BuildItem;
  allItems: PlacedItem[];
  buildDefs: BuildItem[];
  isSelected: boolean;
  currentFloor: number;
  showBedAreas: boolean;
  onPointerDown: (e: THREE.Event | any, id: string) => void;
}

const Item3D = ({
  item,
  def,
  allItems,
  buildDefs,
  isSelected,
  showBedAreas,
  onPointerDown
}: Item3DProps) => {
  const itemFloor = item.floor || 0;
  const posX = item.x * SCALE;
  const posZ = item.y * SCALE;
  const rotY = -item.rotation * (Math.PI / 180);

  const floorOffset = itemFloor * 3.0;
  const isRoof = def.id.includes('roof') || def.id.includes('hole');
  const heightOffset = floorOffset + (isRoof ? 3.0 : 0.0);

  const width = SIDE * SCALE;
  const length = SIDE * SCALE;
  const height = isRoof ? 0.3 : 0.4;

  // Safe vibrant color selection
  const rawColor = (item.customColor && item.customColor !== 'clear') ? item.customColor : (def.color && def.color !== 'clear' ? def.color : '#94a3b8');
  const baseColorHex = rawColor.startsWith('#') || rawColor.startsWith('rgb') ? rawColor : '#94a3b8';
  const color = new THREE.Color(baseColorHex);
  
  // Highlight edges with bright cyan/green for high visibility
  const edgeColor = isSelected ? '#10b981' : '#38bdf8';

  const handlePointerDown = (e: THREE.Event | any) => {
    e.stopPropagation();
    onPointerDown(e, item.id);
  };

  if (def.shape === 'bed') {
    const bedWidth = 20 * SCALE;
    const bedLength = 40 * SCALE;
    const bedHeight = 0.5;
    const bedPosY = bedHeight / 2;
    const radius = 270 * SCALE;

    const isOnRoof = allItems.some(other => {
      const otherDef = buildDefs.find(d => d.id === other.itemId);
      if (!otherDef || !(otherDef.id.includes('roof') || otherDef.id.includes('hole'))) return false;
      const dx = Math.abs(other.x - item.x);
      const dy = Math.abs(other.y - item.y);
      const sameFloor = (other.floor || 0) === itemFloor;
      return dx < 45 && dy < 45 && sameFloor;
    });

    const spawnY = floorOffset + (isOnRoof ? 3.3 : 0.41);

    return (
      <group position={[posX, spawnY, posZ]} rotation={[0, rotY, 0]} onPointerDown={handlePointerDown}>
        <group>
          <Box args={[bedWidth, bedHeight, bedLength]} position={[0, bedPosY, 0]} castShadow receiveShadow>
            <meshStandardMaterial
              color="#ff4757"
              roughness={0.3}
              metalness={0.2}
            />
            <Edges scale={1.05} color={isSelected ? '#10b981' : '#ffffff'} opacity={isSelected ? 1 : 0.9} transparent />
          </Box>

          {showBedAreas && (
            <>
              <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[radius, 64]} />
                <meshBasicMaterial color="#ff4757" transparent opacity={0.08} depthWrite={false} />
              </mesh>
              <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[radius - 0.2, radius, 64]} />
                <meshBasicMaterial color="#ff4757" transparent opacity={0.5} depthWrite={false} />
              </mesh>
            </>
          )}
        </group>
      </group>
    );
  } else if (def.shape === 'square') {
    return (
      <group position={[posX, height / 2 + heightOffset, posZ]} rotation={[0, rotY, 0]} onPointerDown={handlePointerDown}>
        <Box args={[width, height, length]} castShadow receiveShadow>
          <meshStandardMaterial
            color={color}
            roughness={0.4}
            metalness={0.2}
          />
          <Edges scale={1.01} color={edgeColor} opacity={isSelected ? 1 : 0.8} transparent />
        </Box>
      </group>
    );
  } else if (def.shape === 'wall') {
    return (
      <group position={[posX, floorOffset + 1.5 + (isRoof ? 0 : 0.2), posZ]} rotation={[0, rotY, 0]} onPointerDown={handlePointerDown}>
        <Box args={[width, 3.0, 0.4]} castShadow receiveShadow>
          <meshStandardMaterial
            color={color}
            roughness={0.4}
            metalness={0.2}
          />
          <Edges scale={1.01} color={edgeColor} opacity={isSelected ? 1 : 0.8} transparent />
        </Box>
      </group>
    );
  } else if (def.shape === 'pillar') {
    return (
      <group position={[posX, floorOffset + 1.5 + (isRoof ? 0 : 0.2), posZ]} rotation={[0, rotY, 0]} onPointerDown={handlePointerDown}>
        <Cylinder args={[0.4, 0.4, 3.0, 16]} castShadow receiveShadow>
          <meshStandardMaterial
            color={color}
            roughness={0.4}
            metalness={0.2}
          />
          <Edges scale={1.02} color={edgeColor} opacity={isSelected ? 1 : 0.8} transparent threshold={15} />
        </Cylinder>
      </group>
    );
  } else {
    // Triangle
    const shape = useMemo(() => {
      const s = new THREE.Shape();
      const w = width;
      const h = TRI_H * SCALE;
      s.moveTo(0, h * 2 / 3);
      s.lineTo(w / 2, -h * 1 / 3);
      s.lineTo(-w / 2, -h * 1 / 3);
      s.lineTo(0, h * 2 / 3);
      return s;
    }, [width]);

    const extrudeSettings = { depth: height, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 0.05, bevelThickness: 0.05 };

    return (
      <group position={[posX, heightOffset, posZ]} rotation={[0, rotY, 0]} onPointerDown={handlePointerDown}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <extrudeGeometry args={[shape, extrudeSettings]} />
          <meshStandardMaterial
            color={color}
            roughness={0.4}
            metalness={0.2}
          />
          <Edges scale={1.01} color={edgeColor} opacity={isSelected ? 1 : 0.8} transparent threshold={15} />
        </mesh>
      </group>
    );
  }
};



// Ghost Preview Mesh for 3D Socket Snapping
const GhostMesh3D = ({
  activeDef,
  position,
  rotation,
  isValid,
  onPlace
}: {
  activeDef: BuildItem;
  position: [number, number, number];
  rotation: number;
  isValid: boolean;
  onPlace: () => void;
}) => {
  const rotY = -rotation * (Math.PI / 180);
  const color = isValid ? '#10b981' : '#ef4444';

  const width = SIDE * SCALE;
  const length = SIDE * SCALE;
  const height = activeDef.id.includes('roof') ? 0.3 : 0.4;

  const handleClick = (e: THREE.Event | any) => {
    e.stopPropagation();
    onPlace();
  };

  if (activeDef.shape === 'bed') {
    return (
      <group position={position} rotation={[0, rotY, 0]} onClick={handleClick}>
        <Box args={[20 * SCALE, 0.5, 40 * SCALE]} position={[0, 0.25, 0]}>
          <meshStandardMaterial color={color} transparent opacity={0.7} wireframe />
        </Box>
      </group>
    );
  } else if (activeDef.shape === 'square') {
    return (
      <group position={position} rotation={[0, rotY, 0]} onClick={handleClick}>
        <Box args={[width, height, length]}>
          <meshStandardMaterial color={color} transparent opacity={0.7} wireframe />
        </Box>
      </group>
    );
  } else if (activeDef.shape === 'wall') {
    return (
      <group position={position} rotation={[0, rotY, 0]} onClick={handleClick}>
        <Box args={[width, 3.0, 0.4]}>
          <meshStandardMaterial color={color} transparent opacity={0.7} wireframe />
        </Box>
      </group>
    );
  } else if (activeDef.shape === 'pillar') {
    return (
      <group position={position} rotation={[0, rotY, 0]} onClick={handleClick}>
        <Cylinder args={[0.4, 0.4, 3.0, 16]}>
          <meshStandardMaterial color={color} transparent opacity={0.7} wireframe />
        </Cylinder>
      </group>
    );
  } else {
    return (
      <group position={position} rotation={[0, rotY, 0]} onClick={handleClick}>
        <Box args={[width, height, width]}>
          <meshStandardMaterial color={color} transparent opacity={0.7} wireframe />
        </Box>
      </group>
    );
  }
};

// First Person NoClip Camera Controller (Unturned Style)
function FirstPersonFlyController({ active }: { active: boolean }) {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const isDragging = useRef(false);
  const previousMouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pitch = useRef(0);
  const yaw = useRef(0);

  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isDragging.current = true;
        previousMouse.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - previousMouse.current.x;
      const dy = e.clientY - previousMouse.current.y;
      previousMouse.current = { x: e.clientX, y: e.clientY };

      const sensitivity = 0.003;
      yaw.current -= dx * sensitivity;
      pitch.current -= dy * sensitivity;
      pitch.current = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch.current));

      const euler = new THREE.Euler(pitch.current, yaw.current, 0, 'YXZ');
      camera.quaternion.setFromEuler(euler);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [active, camera]);

  useFrame((_, delta) => {
    if (!active) return;
    const speed = 12 * delta;
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    
    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();

    if (keys.current['KeyW']) camera.position.addScaledVector(forward, speed);
    if (keys.current['KeyS']) camera.position.addScaledVector(forward, -speed);
    if (keys.current['KeyA']) camera.position.addScaledVector(right, -speed);
    if (keys.current['KeyD']) camera.position.addScaledVector(right, speed);
    if (keys.current['KeyE'] || keys.current['Space']) camera.position.y += speed;
    if (keys.current['KeyQ'] || keys.current['ShiftLeft']) camera.position.y -= speed;
  });

  return null;
}

export default function Builder3D({
  placedItems,
  buildItems,
  activeItem,
  selectedColor,
  currentFloor = 0,
  showBedAreas = true,
  selectedItemIds = [],
  isNightMode = false,
  onPlaceItem,
  onSelectItem,
  onDeleteItem,
  onPaintItem,
  onSelectActiveItem
}: Builder3DProps) {
  const [cameraView, setCameraView] = useState<'fps' | 'orbit' | 'top' | 'iso'>('fps');
  const [ghostPos, setGhostPos] = useState<[number, number, number] | null>(null);
  const [ghost2DPos, setGhost2DPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation3D, setRotation3D] = useState(0);

  const activeDef = useMemo(() => buildItems.find(d => d.id === activeItem), [activeItem, buildItems]);

  // Center calculation
  const center = useMemo(() => {
    if (placedItems.length === 0) return [0, 0, 0] as [number, number, number];
    let sx = 0, sz = 0;
    placedItems.forEach(i => {
      sx += i.x * SCALE;
      sz += i.y * SCALE;
    });
    return [sx / placedItems.length, 0, sz / placedItems.length] as [number, number, number];
  }, [placedItems]);

  // Unturned Structure Socket Snapping Logic
  const handlePointerMoveGround = (e: THREE.Event | any) => {
    if (!activeDef) {
      setGhostPos(null);
      return;
    }
    const point = e.point as THREE.Vector3;
    if (!point) return;

    let targetX = Math.round((point.x / SCALE) / 30) * 30;
    let targetZ = Math.round((point.z / SCALE) / 30) * 30;
    let targetFloor = currentFloor;

    // Find nearest placed item to test socket snapping
    let closestItem: PlacedItem | null = null;
    let minSocketDist = 4.0; // 3D world units threshold

    placedItems.forEach(item => {
      const itemX3D = item.x * SCALE;
      const itemZ3D = item.y * SCALE;
      const dist = Math.hypot(point.x - itemX3D, point.z - itemZ3D);
      if (dist < minSocketDist) {
        minSocketDist = dist;
        closestItem = item;
      }
    });

    if (closestItem) {
      const closestDef = buildItems.find(d => d.id === (closestItem as PlacedItem).itemId);
      const itemFloor = (closestItem as PlacedItem).floor || 0;

      // Socket Snapping Rules:
      if (activeDef.shape === 'square' || activeDef.shape === 'triangle') {
        if (closestDef?.shape === 'square' || closestDef?.shape === 'triangle') {
          // Snap foundation edge-to-edge
          const dx = point.x - (closestItem as PlacedItem).x * SCALE;
          const dz = point.z - (closestItem as PlacedItem).y * SCALE;
          if (Math.abs(dx) > Math.abs(dz)) {
            targetX = (closestItem as PlacedItem).x + (dx > 0 ? 60 : -60);
            targetZ = (closestItem as PlacedItem).y;
          } else {
            targetX = (closestItem as PlacedItem).x;
            targetZ = (closestItem as PlacedItem).y + (dz > 0 ? 60 : -60);
          }
          targetFloor = itemFloor;
        }
      } else if (activeDef.shape === 'wall') {
        // Wall snaps to foundation or lower wall top
        targetX = (closestItem as PlacedItem).x;
        targetZ = (closestItem as PlacedItem).y;
        targetFloor = point.y > (itemFloor * 3.0 + 1.5) ? itemFloor + 1 : itemFloor;
      } else if (activeDef.shape === 'pillar') {
        // Pillar snaps to corners
        targetX = (closestItem as PlacedItem).x + (point.x > (closestItem as PlacedItem).x * SCALE ? 30 : -30);
        targetZ = (closestItem as PlacedItem).y + (point.z > (closestItem as PlacedItem).y * SCALE ? 30 : -30);
        targetFloor = itemFloor;
      }
    }

    const floorOffset = targetFloor * 3.0;
    const isRoof = activeDef.id.includes('roof');
    const heightOffset = floorOffset + (isRoof ? 3.0 : (activeDef.shape === 'wall' || activeDef.shape === 'pillar' ? 1.5 : 0.2));

    setGhostPos([targetX * SCALE, heightOffset, targetZ * SCALE]);
    setGhost2DPos({ x: targetX, y: targetZ });
  };

  const handleGroundClick = () => {
    if (activeDef && ghost2DPos && onPlaceItem) {
      onPlaceItem({
        itemId: activeDef.id,
        x: ghost2DPos.x,
        y: ghost2DPos.y,
        rotation: rotation3D,
        customColor: (selectedColor && selectedColor !== 'clear') ? selectedColor : undefined,
        floor: currentFloor
      });
    }
  };

  const handleItemPointerDown = (e: THREE.Event | any, id: string) => {
    if (selectedColor && onPaintItem) {
      onPaintItem(id);
      return;
    }
    if (onSelectItem) {
      onSelectItem(id, e.nativeEvent?.shiftKey || false);
    }
  };

  const cameraPos = useMemo(() => {
    if (cameraView === 'fps') return [center[0], 5, center[2] + 12] as [number, number, number];
    if (cameraView === 'top') return [center[0], 45, center[2] + 0.1] as [number, number, number];
    if (cameraView === 'iso') return [center[0] + 30, 30, center[2] + 30] as [number, number, number];
    return [center[0], 25, center[2] + 25] as [number, number, number];
  }, [cameraView, center]);

  return (
    <div className={styles.container}>
      <Canvas shadows camera={{ position: cameraPos, fov: cameraView === 'fps' ? 70 : 40 }}>
        <color attach="background" args={[isNightMode ? '#0a0d12' : '#1a1f26']} />

        <SoftShadows size={8} samples={16} focus={0.5} />

        <ambientLight intensity={isNightMode ? 0.2 : 0.7} color="#ffffff" />
        <directionalLight
          position={[30, 50, 20]}
          intensity={isNightMode ? 0.4 : 1.3}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
          color={isNightMode ? '#38bdf8' : '#ffffff'}
        />

        {isNightMode ? (
          <>
            <pointLight position={[center[0], 10, center[2]]} intensity={1.5} color="#10b981" />
            <Sparkles count={100} scale={40} size={3} speed={0.4} color="#10b981" />
          </>
        ) : (
          <Environment preset="dawn" />
        )}

        {/* Camera Controllers */}
        {cameraView === 'fps' ? (
          <FirstPersonFlyController active={true} />
        ) : (
          <OrbitControls
            target={center}
            maxPolarAngle={cameraView === 'top' ? 0.05 : Math.PI / 2 - 0.05}
            dampingFactor={0.05}
            makeDefault
          />
        )}

        <Grid
          position={[0, -0.01, 0]}
          args={[200, 200]}
          cellSize={0.6}
          cellThickness={1}
          cellColor={isNightMode ? '#1e293b' : '#3a4048'}
          sectionSize={3}
          sectionThickness={1.5}
          sectionColor={isNightMode ? '#10b981' : '#4b5563'}
          fadeDistance={120}
          fadeStrength={2}
        />

        {/* Interactive Ground Plane */}
        <mesh
          position={[0, -0.05, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
          onPointerMove={handlePointerMoveGround}
          onClick={handleGroundClick}
        >
          <planeGeometry args={[400, 400]} />
          <meshStandardMaterial color={isNightMode ? '#0f172a' : '#14181d'} roughness={0.9} metalness={0.1} />
        </mesh>

        <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={100} blur={2} far={10} />

        <Suspense fallback={null}>
          <group>
            {placedItems.map(item => {
              let def = buildItems.find(d => d.id === item.itemId);
              if (!def) {
                const idLower = (item.itemId || '').toLowerCase();
                const fallbackShape: ShapeType = idLower.includes('wall') ? 'wall' :
                  idLower.includes('pillar') ? 'pillar' :
                  idLower.includes('bed') ? 'bed' :
                  idLower.includes('tri') ? 'triangle' : 'square';

                def = {
                  id: item.itemId || 'structure',
                  name: 'Structure',
                  shape: fallbackShape,
                  materialClass: 'structure',
                  color: idLower.includes('bed') ? '#ff4757' : '#777777',
                  texture: '/custom_roof.png',
                  costs: {}
                };
              }
              const isSelected = selectedItemIds.includes(item.id);
              return (
                <Item3D
                  key={item.id}
                  item={item}
                  def={def}
                  allItems={placedItems}
                  buildDefs={buildItems}
                  isSelected={isSelected}
                  currentFloor={currentFloor}
                  showBedAreas={showBedAreas}
                  onPointerDown={handleItemPointerDown}
                />
              );
            })}

            {/* Ghost Mesh preview for placement */}
            {activeDef && ghostPos && (
              <GhostMesh3D
                activeDef={activeDef}
                position={ghostPos}
                rotation={rotation3D}
                isValid={true}
                onPlace={handleGroundClick}
              />
            )}
          </group>
        </Suspense>
      </Canvas>

      {/* Unturned Style Crosshair Overlay for FPS Fly Mode */}
      {cameraView === 'fps' && (
        <div className={styles.fpsCrosshair}>
          <div className={styles.crosshairDot} />
        </div>
      )}

      {/* Unturned Style Quick Hotbar (1-6) */}
      <div className={styles.hotbarOverlay}>
        {buildItems.slice(0, 6).map((item, idx) => {
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              className={`${styles.hotbarSlot} ${isActive ? styles.hotbarSlotActive : ''}`}
              onClick={() => onSelectActiveItem && onSelectActiveItem(isActive ? null : item.id)}
            >
              <span className={styles.hotbarKey}>{idx + 1}</span>
              <img src={item.texture} alt="" className={styles.hotbarIcon} />
              <span className={styles.hotbarLabel}>{item.name}</span>
            </button>
          );
        })}
      </div>

      {/* 3D Sandbox Floating Controls */}
      <div className={styles.controlsOverlay}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <p className={styles.overlayTitle} style={{ margin: 0 }}>
            <span className={styles.statusDot} />
            Unturned 3D Sandbox (NoClip Fly)
          </p>
          {activeDef && (
            <button
              onClick={() => setRotation3D(r => (r + 90) % 360)}
              style={{
                background: 'var(--accent-green)',
                color: '#000',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Obróć [R] ({rotation3D}°)
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          <button
            className={`btn-cinematic ${cameraView === 'fps' ? 'primary' : 'secondary'}`}
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            onClick={() => setCameraView('fps')}
          >
            🕹️ 1. Osoba (NoClip)
          </button>
          <button
            className={`btn-cinematic ${cameraView === 'orbit' ? 'primary' : 'secondary'}`}
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            onClick={() => setCameraView('orbit')}
          >
            Perspektywa 3D
          </button>
          <button
            className={`btn-cinematic ${cameraView === 'iso' ? 'primary' : 'secondary'}`}
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            onClick={() => setCameraView('iso')}
          >
            Izometria
          </button>
        </div>

        <p className={styles.controlsList}>
          <b className={styles.controlKey}>WASD:</b> Poruszanie / Latanie<br />
          <b className={styles.controlKey}>Q / E:</b> Dół / Góra (NoClip)<br />
          <b className={styles.controlKey}>LMB:</b> Stawianie w gnieździe<br />
          <b className={styles.controlKey}>R:</b> Obrót | <b>1-6:</b> Hotbar
        </p>
      </div>
    </div>
  );
}

