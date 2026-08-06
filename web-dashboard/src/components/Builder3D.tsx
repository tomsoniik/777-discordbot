"use client";

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Grid, Environment, Edges, Sparkles, ContactShadows, SoftShadows } from '@react-three/drei';
import * as THREE from 'three';

import styles from '@/777_addons/styles/Builder3D.module.css';

export type ShapeType = 'square' | 'triangle' | 'bed' | 'wall' | 'pillar' | 'remover';

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
  isTargetedForDemolish: boolean;
  currentFloor: number;
  showBedAreas: boolean;
  onPointerDown: (e: THREE.Event | any, id: string) => void;
}

function ItemMaterial({ color, isTargeted, textureUrl }: { color: THREE.Color; isTargeted: boolean; textureUrl?: string }) {
  const [map, setMap] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (textureUrl && !isTargeted && textureUrl.startsWith('/')) {
      new THREE.TextureLoader().load(textureUrl, (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        setMap(tex);
      });
    } else {
      setMap(null);
    }
  }, [textureUrl, isTargeted]);

  if (isTargeted) {
    return (
      <meshStandardMaterial
        color="#ef4444"
        roughness={0.2}
        metalness={0.6}
        emissive={new THREE.Color(0x991b1b)}
        emissiveIntensity={0.6}
      />
    );
  }
  return (
    <meshStandardMaterial
      color={map ? '#ffffff' : color}
      map={map}
      roughness={0.6}
      metalness={0.1}
      envMapIntensity={0.8}
    />
  );
}

const Item3D = ({
  item,
  def,
  allItems,
  buildDefs,
  isSelected,
  isTargetedForDemolish,
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

  const rawColor = (item.customColor && item.customColor !== 'clear') ? item.customColor : (def.color && def.color !== 'clear' ? def.color : '#94a3b8');
  const baseColorHex = rawColor.startsWith('#') || rawColor.startsWith('rgb') ? rawColor : '#94a3b8';
  const color = useMemo(() => new THREE.Color(baseColorHex), [baseColorHex]);
  
  const edgeColor = isTargetedForDemolish ? '#ef4444' : isSelected ? '#10b981' : '#38bdf8';

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
      <group position={[posX, spawnY, posZ]} rotation={[0, rotY, 0]} onPointerDown={handlePointerDown} userData={{ itemId: item.id }}>
        <group>
          <mesh position={[0, bedPosY, 0]} castShadow receiveShadow userData={{ itemId: item.id }}>
            <boxGeometry args={[bedWidth, bedHeight, bedLength]} />
            <meshStandardMaterial
              color={isTargetedForDemolish ? "#ef4444" : "#ff4757"}
              emissive={isTargetedForDemolish ? "#991b1b" : "#7f1d1d"}
              roughness={0.2}
              metalness={0.1}
            />
            <Edges scale={1.02} color={edgeColor} opacity={1} transparent />
          </mesh>

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
      <group position={[posX, height / 2 + heightOffset, posZ]} rotation={[0, rotY, 0]} onPointerDown={handlePointerDown} userData={{ itemId: item.id }}>
        <mesh castShadow receiveShadow userData={{ itemId: item.id }}>
          <boxGeometry args={[width, height, length]} />
          <ItemMaterial color={color} isTargeted={isTargetedForDemolish} textureUrl={def.texture} />
          <Edges scale={1.005} color={edgeColor} opacity={1} transparent />
        </mesh>
      </group>
    );
  } else if (def.shape === 'wall') {
    return (
      <group position={[posX, floorOffset + 1.5 + (isRoof ? 0 : 0.2), posZ]} rotation={[0, rotY, 0]} onPointerDown={handlePointerDown} userData={{ itemId: item.id }}>
        <mesh castShadow receiveShadow userData={{ itemId: item.id }}>
          <boxGeometry args={[width, 3.0, 0.4]} />
          <ItemMaterial color={color} isTargeted={isTargetedForDemolish} textureUrl={def.texture} />
          <Edges scale={1.005} color={edgeColor} opacity={1} transparent />
        </mesh>
      </group>
    );
  } else if (def.shape === 'pillar') {
    return (
      <group position={[posX, floorOffset + 1.5 + (isRoof ? 0 : 0.2), posZ]} rotation={[0, rotY, 0]} onPointerDown={handlePointerDown} userData={{ itemId: item.id }}>
        <mesh castShadow receiveShadow userData={{ itemId: item.id }}>
          <cylinderGeometry args={[0.4, 0.4, 3.0, 16]} />
          <ItemMaterial color={color} isTargeted={isTargetedForDemolish} textureUrl={def.texture} />
          <Edges scale={1.02} color={edgeColor} opacity={1} transparent threshold={15} />
        </mesh>
      </group>
    );
  } else {
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
      <group position={[posX, heightOffset, posZ]} rotation={[0, rotY, 0]} onPointerDown={handlePointerDown} userData={{ itemId: item.id }}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow userData={{ itemId: item.id }}>
          <extrudeGeometry args={[shape, extrudeSettings]} />
          <ItemMaterial color={color} isTargeted={isTargetedForDemolish} textureUrl={def.texture} />
          <Edges scale={1.01} color={edgeColor} opacity={1} transparent threshold={15} />
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
  isValid
}: {
  activeDef: BuildItem;
  position: [number, number, number];
  rotation: number;
  isValid: boolean;
}) => {
  const rotY = -rotation * (Math.PI / 180);
  const color = isValid ? '#10b981' : '#ef4444';

  const width = SIDE * SCALE;
  const length = SIDE * SCALE;
  const height = activeDef.id.includes('roof') ? 0.3 : 0.4;

  if (activeDef.shape === 'bed') {
    return (
      <group position={position} rotation={[0, rotY, 0]}>
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[20 * SCALE, 0.5, 40 * SCALE]} />
          <meshStandardMaterial color={color} transparent opacity={0.35} />
          <Edges scale={1.02} color={color} transparent opacity={0.9} />
        </mesh>
      </group>
    );
  } else if (activeDef.shape === 'square') {
    return (
      <group position={position} rotation={[0, rotY, 0]}>
        <mesh>
          <boxGeometry args={[width, height, length]} />
          <meshStandardMaterial color={color} transparent opacity={0.35} />
          <Edges scale={1.02} color={color} transparent opacity={0.9} />
        </mesh>
      </group>
    );
  } else if (activeDef.shape === 'wall') {
    return (
      <group position={position} rotation={[0, rotY, 0]}>
        <mesh>
          <boxGeometry args={[width, 3.0, 0.4]} />
          <meshStandardMaterial color={color} transparent opacity={0.35} />
          <Edges scale={1.02} color={color} transparent opacity={0.9} />
        </mesh>
      </group>
    );
  } else if (activeDef.shape === 'pillar') {
    return (
      <group position={position} rotation={[0, rotY, 0]}>
        <mesh>
          <cylinderGeometry args={[0.4, 0.4, 3.0, 16]} />
          <meshStandardMaterial color={color} transparent opacity={0.35} />
          <Edges scale={1.02} color={color} transparent opacity={0.9} />
        </mesh>
      </group>
    );
  } else {
    return (
      <group position={position} rotation={[0, rotY, 0]}>
        <mesh>
          <boxGeometry args={[width, height, width]} />
          <meshStandardMaterial color={color} transparent opacity={0.35} />
          <Edges scale={1.02} color={color} transparent opacity={0.9} />
        </mesh>
      </group>
    );
  }
};

// Continuous First Person NoClip Camera Controller (Unturned Style)
function FirstPersonFlyController({
  containerRef,
  center
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  center: [number, number, number];
}) {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const pitch = useRef(0);
  const yaw = useRef(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      camera.position.set(center[0], 2.2, center[2] + 6.0);
      camera.lookAt(center[0], 2.2, center[2]);
      yaw.current = 0;
      pitch.current = 0;
      initialized.current = true;
    }

    const container = containerRef.current;

    const handleCanvasClick = () => {
      if (document.pointerLockElement !== container) {
        container?.requestPointerLock();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      keys.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === container || e.buttons === 1 || e.buttons === 2) {
        const sensitivity = 0.0025; // Unturned mouse sensitivity
        yaw.current -= e.movementX * sensitivity;
        pitch.current -= e.movementY * sensitivity;
        pitch.current = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, pitch.current));

        const euler = new THREE.Euler(pitch.current, yaw.current, 0, 'YXZ');
        camera.quaternion.setFromEuler(euler);
      }
    };

    container?.addEventListener('click', handleCanvasClick);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      container?.removeEventListener('click', handleCanvasClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [camera, center, containerRef]);

  useFrame((_, delta) => {
    const speed = 14 * delta;
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

// FPS Camera Crosshair Placement & Demolish Controller (Unturned Style)
function FPSPlacementController({
  activeDef,
  placedItems,
  buildItems,
  currentFloor,
  rotation3D,
  selectedColor,
  onPlaceItem,
  onDeleteItem,
  setGhostPos,
  setGhost2DPos,
  setGhostRot,
  setTargetedItemId
}: {
  activeDef?: BuildItem;
  placedItems: PlacedItem[];
  buildItems: BuildItem[];
  currentFloor: number;
  rotation3D: number;
  selectedColor?: string;
  onPlaceItem?: (item: Omit<PlacedItem, 'id'>) => void;
  onDeleteItem?: (id: string) => void;
  setGhostPos: (pos: [number, number, number] | null) => void;
  setGhost2DPos: (pos: { x: number; y: number } | null) => void;
  setGhostRot: (rot: number) => void;
  setTargetedItemId: (id: string | null) => void;
}) {
  const { camera, scene } = useThree();
  const ghostRef = useRef<{ x: number; y: number; rotation: number } | null>(null);
  const targetedItemRef = useRef<string | null>(null);
  const lastPlaceTimeRef = useRef(0);

  useFrame(() => {
    if (!activeDef) {
      setGhostPos(null);
      setGhost2DPos(null);
      setTargetedItemId(null);
      ghostRef.current = null;
      targetedItemRef.current = null;
      return;
    }

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    // DEMOLISH / REMOVER TOOL MODE
    if (activeDef.shape === 'remover' || activeDef.id === 'remover_tool') {
      const intersects = raycaster.intersectObjects(scene.children, true);
      const validHits = intersects.filter(hit => hit.object.type === 'Mesh' && hit.distance > 0.5);

      if (validHits.length > 0) {
        let parentObj: THREE.Object3D | null = validHits[0].object;
        let itemIdFound: string | null = null;

        while (parentObj) {
          if (parentObj.userData?.itemId) {
            itemIdFound = parentObj.userData.itemId;
            break;
          }
          parentObj = parentObj.parent;
        }

        if (itemIdFound) {
          setTargetedItemId(itemIdFound);
          targetedItemRef.current = itemIdFound;
        } else {
          setTargetedItemId(null);
          targetedItemRef.current = null;
        }
      } else {
        setTargetedItemId(null);
        targetedItemRef.current = null;
      }
      setGhostPos(null);
      setGhost2DPos(null);
      return;
    }

    // BUILDING MODE
    setTargetedItemId(null);
    targetedItemRef.current = null;

    let targetPoint: THREE.Vector3 | null = null;
    const intersects = raycaster.intersectObjects(scene.children, true);
    const validHits = intersects.filter(hit => hit.object.type === 'Mesh' && hit.distance > 0.5);

    if (validHits.length > 0) {
      targetPoint = validHits[0].point;
    } else {
      // Ground plane fallback Y = 0
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const pt = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(groundPlane, pt)) {
        targetPoint = pt;
      }
    }

    if (!targetPoint || camera.position.distanceTo(targetPoint) > 35) {
      setGhostPos(null);
      setGhost2DPos(null);
      ghostRef.current = null;
      return;
    }

    // Alignment to 60-unit 2D grid
    let targetX = Math.round((targetPoint.x / SCALE) / 60) * 60;
    let targetZ = Math.round((targetPoint.z / SCALE) / 60) * 60;
    let targetFloor = currentFloor;
    let targetRotation = rotation3D;

    // Socket snapping to nearest placed item
    let closestItem: PlacedItem | null = null;
    let minSocketDist = 6.0;

    placedItems.forEach(item => {
      const itemX3D = item.x * SCALE;
      const itemZ3D = item.y * SCALE;
      const dist = Math.hypot((targetPoint as THREE.Vector3).x - itemX3D, (targetPoint as THREE.Vector3).z - itemZ3D);
      if (dist < minSocketDist) {
        minSocketDist = dist;
        closestItem = item;
      }
    });

    if (closestItem) {
      const closestDef = buildItems.find(d => d.id === (closestItem as PlacedItem).itemId);
      const itemFloor = (closestItem as PlacedItem).floor || 0;
      const cX = (closestItem as PlacedItem).x;
      const cZ = (closestItem as PlacedItem).y;
      const cX3D = cX * SCALE;
      const cZ3D = cZ * SCALE;

      if (activeDef.shape === 'square' || activeDef.shape === 'triangle') {
        if (closestDef?.shape === 'square' || closestDef?.shape === 'triangle') {
          const dx = targetPoint.x - cX3D;
          const dz = targetPoint.z - cZ3D;
          if (Math.abs(dx) > Math.abs(dz)) {
            targetX = cX + (dx > 0 ? 60 : -60);
            targetZ = cZ;
          } else {
            targetX = cX;
            targetZ = cZ + (dz > 0 ? 60 : -60);
          }
          targetFloor = itemFloor;
        }
      } else if (activeDef.shape === 'wall') {
        const dx = targetPoint.x - cX3D;
        const dz = targetPoint.z - cZ3D;
        if (Math.abs(dx) > Math.abs(dz)) {
          targetX = cX + (dx > 0 ? 30 : -30);
          targetZ = cZ;
          targetRotation = 90;
        } else {
          targetX = cX;
          targetZ = cZ + (dz > 0 ? 30 : -30);
          targetRotation = 0;
        }
        targetFloor = targetPoint.y > (itemFloor * 3.0 + 1.5) ? itemFloor + 1 : itemFloor;
      } else if (activeDef.shape === 'pillar') {
        const dx = targetPoint.x - cX3D;
        const dz = targetPoint.z - cZ3D;
        targetX = cX + (dx > 0 ? 30 : -30);
        targetZ = cZ + (dz > 0 ? 30 : -30);
        targetFloor = itemFloor;
      }
    }

    const floorOffset = targetFloor * 3.0;
    const isRoof = activeDef.id.includes('roof') || activeDef.id.includes('hole');
    const heightOffset = floorOffset + (isRoof ? 3.0 : (activeDef.shape === 'wall' || activeDef.shape === 'pillar' ? 1.5 : 0.2));

    setGhostPos([targetX * SCALE, heightOffset, targetZ * SCALE]);
    setGhost2DPos({ x: targetX, y: targetZ });
    setGhostRot(targetRotation);
    ghostRef.current = { x: targetX, y: targetZ, rotation: targetRotation };
  });

  // Handle placement & demolition on LMB click (250ms debounce)
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Left Click only
      if (!activeDef) return;

      const now = Date.now();
      if (now - lastPlaceTimeRef.current < 250) return;

      // DEMOLISH ACTION
      if (activeDef.shape === 'remover' || activeDef.id === 'remover_tool') {
        if (targetedItemRef.current && onDeleteItem) {
          lastPlaceTimeRef.current = now;
          onDeleteItem(targetedItemRef.current);
          setTargetedItemId(null);
          targetedItemRef.current = null;
        }
        return;
      }

      // PLACEMENT ACTION
      if (ghostRef.current && onPlaceItem) {
        lastPlaceTimeRef.current = now;
        onPlaceItem({
          itemId: activeDef.id,
          x: ghostRef.current.x,
          y: ghostRef.current.y,
          rotation: ghostRef.current.rotation,
          customColor: (selectedColor && selectedColor !== 'clear') ? selectedColor : undefined,
          floor: currentFloor
        });
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, [activeDef, currentFloor, onDeleteItem, onPlaceItem, selectedColor, setTargetedItemId]);

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [ghostPos, setGhostPos] = useState<[number, number, number] | null>(null);
  const [ghost2DPos, setGhost2DPos] = useState<{ x: number; y: number } | null>(null);
  const [rotation3D, setRotation3D] = useState(0);
  const [ghostRot, setGhostRot] = useState(0);
  const [targetedItemId, setTargetedItemId] = useState<string | null>(null);

  const activeDef = useMemo(() => buildItems.find(d => d.id === activeItem), [activeItem, buildItems]);

  // Keyboard 'R' Rotation Listener
  useEffect(() => {
    const handleRotationKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'KeyR' || e.key.toLowerCase() === 'r') {
        setRotation3D(r => (r + 90) % 360);
      }
    };
    window.addEventListener('keydown', handleRotationKey);
    return () => window.removeEventListener('keydown', handleRotationKey);
  }, []);

  // Keyboard 1-6 Hotbar Selection Listener
  useEffect(() => {
    const handleHotbarKeys = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const codeMap: Record<string, number> = {
        'Digit1': 0, 'Numpad1': 0, 'Digit2': 1, 'Numpad2': 1,
        'Digit3': 2, 'Numpad3': 2, 'Digit4': 3, 'Numpad4': 3,
        'Digit5': 4, 'Numpad5': 4, 'Digit6': 5, 'Numpad6': 5,
        'Digit7': 6, 'Numpad7': 6
      };

      if (e.code in codeMap) {
        const idx = codeMap[e.code];
        const targetItem = buildItems[idx];
        if (targetItem && onSelectActiveItem) {
          onSelectActiveItem(activeItem === targetItem.id ? null : targetItem.id);
        }
      } else if (['1', '2', '3', '4', '5', '6', '7'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        const targetItem = buildItems[idx];
        if (targetItem && onSelectActiveItem) {
          onSelectActiveItem(activeItem === targetItem.id ? null : targetItem.id);
        }
      }
    };

    window.addEventListener('keydown', handleHotbarKeys);
    return () => window.removeEventListener('keydown', handleHotbarKeys);
  }, [buildItems, activeItem, onSelectActiveItem]);

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

  const handleItemPointerDown = (e: THREE.Event | any, id: string) => {
    if (selectedColor && onPaintItem) {
      onPaintItem(id);
      return;
    }
    if (onSelectItem) {
      onSelectItem(id, e.nativeEvent?.shiftKey || false);
    }
  };

  const isDemolishActive = activeDef?.shape === 'remover' || activeDef?.id === 'remover_tool';

  return (
    <div ref={containerRef} className={styles.container}>
      <Canvas shadows camera={{ fov: 75 }}>
        <color attach="background" args={[isNightMode ? '#0a0d12' : '#1a1f26']} />

        <SoftShadows size={8} samples={16} focus={0.5} />

        <ambientLight intensity={isNightMode ? 0.3 : 0.8} color="#ffffff" />
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

        {/* Unturned Pointer Lock 1st Person Controller */}
        <FirstPersonFlyController containerRef={containerRef} center={center} />

        {/* Unturned 3D Crosshair Placement & Demolish Controller */}
        <FPSPlacementController
          activeDef={activeDef}
          placedItems={placedItems}
          buildItems={buildItems}
          currentFloor={currentFloor}
          rotation3D={rotation3D}
          selectedColor={selectedColor}
          onPlaceItem={onPlaceItem}
          onDeleteItem={onDeleteItem}
          setGhostPos={setGhostPos}
          setGhost2DPos={setGhost2DPos}
          setGhostRot={setGhostRot}
          setTargetedItemId={setTargetedItemId}
        />

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

        {/* Ground Plane */}
        <mesh
          position={[0, -0.05, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[400, 400]} />
          <meshStandardMaterial color={isNightMode ? '#0f172a' : '#14181d'} roughness={0.9} metalness={0.1} />
        </mesh>

        <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={100} blur={2} far={10} />

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
            const isTargetedForDemolish = targetedItemId === item.id;
            return (
              <Item3D
                key={item.id}
                item={item}
                def={def}
                allItems={placedItems}
                buildDefs={buildItems}
                isSelected={isSelected}
                isTargetedForDemolish={isTargetedForDemolish}
                currentFloor={currentFloor}
                showBedAreas={showBedAreas}
                onPointerDown={handleItemPointerDown}
              />
            );
          })}

          {/* Ghost Mesh preview for placement */}
          {activeDef && ghostPos && !isDemolishActive && (
            <GhostMesh3D
              activeDef={activeDef}
              position={ghostPos}
              rotation={ghostRot}
              isValid={true}
            />
          )}
        </group>
      </Canvas>

      {/* Unturned Style Crosshair Overlay */}
      <div className={styles.fpsCrosshair}>
        <div className={styles.crosshairDot} style={{ background: isDemolishActive ? '#ef4444' : '#10b981', boxShadow: isDemolishActive ? '0 0 10px #ef4444' : '0 0 8px #10b981' }} />
      </div>

      {/* Unturned Style Quick Hotbar */}
      <div className={styles.hotbarOverlay}>
        {buildItems.slice(0, 7).map((item, idx) => {
          const isActive = activeItem === item.id;
          const isRemover = item.shape === 'remover' || item.id === 'remover_tool';
          return (
            <button
              key={item.id}
              className={`${styles.hotbarSlot} ${isActive ? styles.hotbarSlotActive : ''} ${isRemover ? styles.hotbarRemover : ''}`}
              onClick={() => onSelectActiveItem && onSelectActiveItem(isActive ? null : item.id)}
              style={isRemover ? { borderColor: isActive ? '#ef4444' : '#7f1d1d' } : undefined}
            >
              {isActive && <span className={styles.activeBadge} style={{ background: isRemover ? '#ef4444' : undefined }}>{isRemover ? 'WYBURZANIE' : 'WYBRANY'}</span>}
              <span className={styles.hotbarKey}>{idx + 1}</span>
              <img src={item.texture} alt="" className={styles.hotbarIcon} />
              <span className={styles.hotbarLabel}>{item.name}</span>
            </button>
          );
        })}
      </div>

      {/* Unturned 3D Sandbox Floating Controls */}
      <div className={styles.controlsOverlay}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <p className={styles.overlayTitle} style={{ margin: 0 }}>
            <span className={styles.statusDot} style={{ background: isDemolishActive ? '#ef4444' : undefined }} />
            Unturned 3D Sandbox (Continuous Freelook FPS)
          </p>
          {activeDef && !isDemolishActive && (
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

        <p className={styles.controlsList}>
          <b className={styles.controlKey}>RUCH MYSZY:</b> Ciągły Freelook (360° FPS)<br />
          <b className={styles.controlKey}>WASD:</b> Poruszanie / Latanie | <b>Q / E:</b> Dół / Góra (NoClip)<br />
          <b className={styles.controlKey}>LMB:</b> {isDemolishActive ? 'Wyburz celowaną ścianę/konstrukcję' : 'Stawianie klocka w celowniku'}<br />
          <b className={styles.controlKey}>1: Wyburzanie</b> | <b>2-7:</b> Wybór klocka | <b>R:</b> Obrót (+90°)
        </p>
      </div>
    </div>
  );
}
