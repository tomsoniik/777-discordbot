"use client";

import React, { useState, MouseEvent, useMemo, useRef, useEffect, use } from 'react';
import styles from '../builder.module.css';
import { useLanguage } from '@/context/LanguageContext';

type ShapeType = 'square' | 'triangle' | 'bed' | 'wall' | 'pillar';

interface BuildItem {
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

const getIconUrl = (id: number) => `https://cdn.jsdelivr.net/gh/SilKsPlugins/UnturnedImages@images/vanilla/items/${id}.png`;

const BUILD_ITEMS: BuildItem[] = [
  { id: 'f_square', name: 'Foundation', shape: 'square', materialClass: 'structure', color: '#888888', texture: '/custom_roof.png', costs: { 'wood': 4 } },
  { id: 'c_roof', name: 'Roof', shape: 'square', materialClass: 'structure', color: '#555555', texture: '/custom_roof.png', costs: { 'scrap': 3 } },
  { id: 'c_roof_tri', name: 'Tri Roof', shape: 'triangle', materialClass: 'structure', color: '#555555', texture: '/custom_roof.png', costs: { 'scrap': 2 } },
  { id: 'c_wall', name: 'Wall', shape: 'wall', materialClass: 'structure', color: '#444444', texture: '/custom_roof.png', costs: { 'scrap': 2 } },
  { id: 'c_pillar', name: 'Pillar', shape: 'pillar', materialClass: 'structure', color: '#333333', texture: '/custom_roof.png', costs: { 'scrap': 1 } },
  { id: 'f_bed', name: 'Claim Bed', shape: 'bed', materialClass: 'furniture', color: '#ff4757', texture: getIconUrl(288), costs: { 'cloth': 4 } }
];

interface PlacedItem {
  id: string; // unique
  itemId: string;
  x: number;
  y: number;
  rotation: number; // in degrees
  customColor?: string; // custom tint color
  floor?: number; // 0 = parter, 1 = piętro 1, itd.
}

const renderShapeInterior = (def: BuildItem) => {
  const isBed = def.shape === 'bed';

  if (isBed || def.shape === 'square' || def.shape === 'triangle') {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        backgroundImage: `url(${def.texture})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: def.imageFilter,
        opacity: isBed ? 1 : 0.85
      }} />
    );
  }

  return null;
};

const SIDE = 60;
const TRI_R = (SIDE * Math.sqrt(3)) / 6; // 17.3205
const TRI_H = (SIDE * Math.sqrt(3)) / 2; // 51.9615

function normalizeAngle(a: number) {
  let res = a % 360;
  if (res < 0) res += 360;
  return res;
}

function getEdges(shape: ShapeType, cx: number, cy: number, rotation: number) {
  if (shape === 'bed') return [];
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  
  const rotatePoint = (x: number, y: number) => ({
    x: cx + x * cos - y * sin,
    y: cy + x * sin + y * cos
  });

  if (shape === 'square') {
    return [
      { ...rotatePoint(0, -30), angle: normalizeAngle(rotation - 90) },
      { ...rotatePoint(30, 0), angle: normalizeAngle(rotation) },
      { ...rotatePoint(0, 30), angle: normalizeAngle(rotation + 90) },
      { ...rotatePoint(-30, 0), angle: normalizeAngle(rotation + 180) },
    ];
  } else {
    return [
      { ...rotatePoint(0, TRI_R), angle: normalizeAngle(rotation + 90) }, // bottom
      { ...rotatePoint(15, -TRI_R / 2), angle: normalizeAngle(rotation - 30) }, // top right
      { ...rotatePoint(-15, -TRI_R / 2), angle: normalizeAngle(rotation - 150) }, // top left
    ];
  }
}

// Fixed get edges for base shape at (0,0) rot 0
function getBaseEdges(shape: ShapeType) {
  if (shape === 'bed') return [];
  if (shape === 'square') {
    return [
      { x: 0, y: -30, angle: 270 },
      { x: 30, y: 0, angle: 0 },
      { x: 0, y: 30, angle: 90 },
      { x: -30, y: 0, angle: 180 },
    ];
  } else {
    return [
      { x: 0, y: TRI_R, angle: 90 },
      { x: 15, y: -TRI_R / 2, angle: 330 }, // -30
      { x: -15, y: -TRI_R / 2, angle: 210 }, // -150
    ];
  }
}

function getPolygonVertices(shape: ShapeType, cx: number, cy: number, rotation: number) {
  if (shape === 'bed') return [];
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  
  const rotatePoint = (x: number, y: number) => ({
    x: cx + x * cos - y * sin,
    y: cy + x * sin + y * cos
  });

  if (shape === 'square') {
    return [
      rotatePoint(-30, -30),
      rotatePoint(30, -30),
      rotatePoint(30, 30),
      rotatePoint(-30, 30),
    ];
  } else {
    return [
      rotatePoint(-30, TRI_R), // bottom left
      rotatePoint(30, TRI_R),  // bottom right
      rotatePoint(0, -TRI_H + TRI_R), // top
    ];
  }
}

function polygonsIntersect(poly1: {x:number, y:number}[], poly2: {x:number, y:number}[]) {
  const polys = [poly1, poly2];
  for (let i = 0; i < polys.length; i++) {
    const polygon = polys[i];
    for (let i1 = 0; i1 < polygon.length; i1++) {
      const i2 = (i1 + 1) % polygon.length;
      const p1 = polygon[i1];
      const p2 = polygon[i2];

      const normal = { x: p2.y - p1.y, y: p1.x - p2.x };

      let minA = Infinity, maxA = -Infinity;
      for (const p of poly1) {
        const projected = normal.x * p.x + normal.y * p.y;
        if (projected < minA) minA = projected;
        if (projected > maxA) maxA = projected;
      }

      let minB = Infinity, maxB = -Infinity;
      for (const p of poly2) {
        const projected = normal.x * p.x + normal.y * p.y;
        if (projected < minB) minB = projected;
        if (projected > maxB) maxB = projected;
      }

      // 0.1 tolerance to allow touching edges
      if (maxA <= minB + 0.1 || maxB <= minA + 0.1) {
        return false;
      }
    }
  }
  return true;
}

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import Builder3D from '@/components/Builder3D';

export default function BuilderCanvas({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLanguage();
  const { addNotification } = useAppStore();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<{startX: number, startY: number, endX: number, endY: number} | null>(null);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startMousePos: { x: number; y: number };
    initialItems: PlacedItem[];
  } | null>(null);
  const [clipboard, setClipboard] = useState<PlacedItem[]>([]);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>(''); // empty means default
  const lastSyncRef = useRef<string>('');
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({ structure: true, furniture: true, color: true });

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [is3DMode, setIs3DMode] = useState(false);
  const [showBedAreas, setShowBedAreas] = useState(true);
  const [currentFloor, setCurrentFloor] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/api/auth/signin');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchProject();
  }, [status]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/builder/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        if (data.data) {
          const parsed = JSON.parse(data.data);
          setPlacedItems(parsed);
          lastSyncRef.current = JSON.stringify(parsed);
        }
      } else {
        router.push('/builder');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveProjectInfo = async (name: string, description: string) => {
    try {
      const res = await fetch(`/api/builder/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });
      if (res.ok) {
        setProject((p: any) => ({ ...p, name, description }));
        addNotification(t('successSubmit') || "Zapisano pomyślnie!", "success");
      } else {
        addNotification(t('errorOccurred') || "Wystąpił błąd", "error");
      }
    } catch (e) {
      console.error(e);
      addNotification(t('errorSending') || "Błąd wysyłania", "error");
    }
  };

  const saveProject = async (newItems: PlacedItem[]) => {
    const dataStr = JSON.stringify(newItems);
    if (dataStr === lastSyncRef.current) return;
    
    setIsSyncing(true);
    try {
      await fetch(`/api/builder/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: newItems })
      });
      lastSyncRef.current = dataStr;
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Trigger save on local changes
  useEffect(() => {
    const dataStr = JSON.stringify(placedItems);
    if (project && dataStr !== lastSyncRef.current) {
      const timeout = setTimeout(() => {
        saveProject(placedItems);
      }, 500); // Debounce saves slightly
      return () => clearTimeout(timeout);
    }
  }, [placedItems, project]);

  // Group collaboration polling (every 3 seconds)
  useEffect(() => {
    if (!project) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/builder/projects/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            if (data.data !== lastSyncRef.current) {
               const parsed = JSON.parse(data.data);
               setPlacedItems(parsed);
               lastSyncRef.current = data.data;
            }
          }
        }
      } catch (e) {}
    }, 3000);
    return () => clearInterval(interval);
  }, [project, id]);

  
  // Canvas View State
  const [pan, setPan] = useState({ 
    x: typeof window !== 'undefined' ? window.innerWidth / 3 : 0, 
    y: typeof window !== 'undefined' ? window.innerHeight / 3 : 0 
  });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  
  // Placement State
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const mousePosRef = useRef({ x: 0, y: 0 });
  const [activeEdgeIndex, setActiveEdgeIndex] = useState(0); // for rotating the active item during placement
  const [freeRotation, setFreeRotation] = useState(0); // for placing freely

  const containerRef = useRef<HTMLDivElement>(null);

  // Prevent default scrolling on wheel
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const preventScroll = (e: WheelEvent) => {
      if (el.contains(e.target as Node)) {
        e.preventDefault();
      }
    };
    document.addEventListener('wheel', preventScroll, { passive: false });
    return () => document.removeEventListener('wheel', preventScroll);
  }, []);

  // Handle keyboard rotation and deselection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveItem(null);
        setSelectedItemId(null);
        setSelectedItemIds([]);
      }
      if (e.key === 'Delete') {
        if (selectedItemIds.length > 0) {
          setPlacedItems(prev => prev.filter(i => !selectedItemIds.includes(i.id)));
          setSelectedItemIds([]);
        } else if (selectedItemId) {
          setPlacedItems(prev => prev.filter(i => i.id !== selectedItemId));
          setSelectedItemId(null);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const itemsToCopy = placedItems.filter(i => selectedItemIds.includes(i.id));
        setClipboard(itemsToCopy);
        if (itemsToCopy.length > 0) addNotification(t('copied_items') || `Skopiowano ${itemsToCopy.length} elementów`, "success");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (clipboard.length > 0) {
          let minX = Infinity, minY = Infinity;
          clipboard.forEach(i => {
            if (i.x < minX) minX = i.x;
            if (i.y < minY) minY = i.y;
          });
          
          const newItems = clipboard.map(item => ({
            ...item,
            id: `${Date.now()}-${Math.random()}`,
            x: mousePosRef.current.x + (item.x - minX),
            y: mousePosRef.current.y + (item.y - minY),
            floor: currentFloor
          }));
          setPlacedItems(prev => [...prev, ...newItems]);
          setSelectedItemIds(newItems.map(i => i.id));
          addNotification(t('pasted_items') || `Wklejono ${newItems.length} elementów`, "success");
        }
      }
      if (e.key === 'r' || e.key === 'R') {
        if (activeItem) {
          const def = BUILD_ITEMS.find(d => d.id === activeItem);
          if (def) {
            const maxEdges = def.shape === 'square' ? 4 : 3;
            setActiveEdgeIndex(prev => (prev + 1) % maxEdges);
            setFreeRotation(prev => (prev + (def.shape === 'square' ? 90 : 60)) % 360);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeItem, selectedItemId, selectedItemIds, placedItems, clipboard, currentFloor]);

  const selectedItemDef = BUILD_ITEMS.find(i => i.id === activeItem);

  // Calculate Snapping
  let previewItem: PlacedItem | null = null;
  let snappedEdgeLine = null;
  let isValidPlacement = true;

  if (selectedItemDef) {
    let closestEdge = null;
    let minDist = 20; // snap threshold

    // Find closest placed edge
    if (selectedItemDef.shape !== 'bed') {
      placedItems.forEach(item => {
        const def = BUILD_ITEMS.find(d => d.id === item.itemId);
        if (!def) return;
        
        const edges = getEdges(def.shape, item.x, item.y, item.rotation);
        edges.forEach(edge => {
          const dist = Math.hypot(edge.x - mousePos.x, edge.y - mousePos.y);
          if (dist < minDist) {
            minDist = dist;
            closestEdge = edge;
          }
        });
      });
    }

    if (closestEdge) {
      // Snap to edge
      const targetEdge = closestEdge as any;
      const baseEdges = getBaseEdges(selectedItemDef.shape);
      const chosenEdge = baseEdges[activeEdgeIndex % baseEdges.length];
      
      // We want our chosen edge to oppose the target edge
      const requiredAngle = normalizeAngle(targetEdge.angle + 180);
      const R = normalizeAngle(requiredAngle - chosenEdge.angle);
      
      // Calculate new center
      const radR = (R * Math.PI) / 180;
      const cosR = Math.cos(radR);
      const sinR = Math.sin(radR);
      
      const rotatedBx = chosenEdge.x * cosR - chosenEdge.y * sinR;
      const rotatedBy = chosenEdge.x * sinR + chosenEdge.y * cosR;
      
      const cx = targetEdge.x - rotatedBx;
      const cy = targetEdge.y - rotatedBy;
      
      previewItem = {
        id: 'preview',
        itemId: selectedItemDef.id,
        x: cx,
        y: cy,
        rotation: R
      };

      // Draw debug line for snapped edge
      snappedEdgeLine = targetEdge;
    } else {
      // Free placement
      const isBed = selectedItemDef.shape === 'bed';
      previewItem = {
        id: 'preview',
        itemId: selectedItemDef.id,
        x: isBed ? Math.round(mousePos.x) : Math.round(mousePos.x / 30) * 30,
        y: isBed ? Math.round(mousePos.y) : Math.round(mousePos.y / 30) * 30,
        rotation: freeRotation
      };
    }

    if (previewItem) {
      placedItems.forEach(item => {
        const dist = Math.hypot(item.x - previewItem!.x, item.y - previewItem!.y);
        
        const itemDef = BUILD_ITEMS.find(d => d.id === item.itemId);
        if (!itemDef) return;
        
        const shape1 = selectedItemDef.shape;
        const shape2 = itemDef.shape;
        
        if (shape1 === 'bed' || shape2 === 'bed') {
          if (dist < 15) isValidPlacement = false;
        } else {
          // If they are too far apart to possibly intersect, skip heavy math
          if (dist < 80) {
            const poly1 = getPolygonVertices(shape1, previewItem!.x, previewItem!.y, previewItem!.rotation);
            const poly2 = getPolygonVertices(shape2, item.x, item.y, item.rotation);
            if (polygonsIntersect(poly1, poly2)) {
              isValidPlacement = false;
            }
          }
        }
      });
    }
  }

  const handlePointerDownCanvas = (e: React.PointerEvent) => {
    if (e.button === 2) {
      // RMB -> Pan
      setIsPanning(true);
      containerRef.current?.setPointerCapture(e.pointerId);
      return;
    }

    if (e.button === 0 && !activeItem) {
      setSelectionBox({ startX: mousePos.x, startY: mousePos.y, endX: mousePos.x, endY: mousePos.y });
    }

    if (e.button === 0 && selectedItemId) {
      setSelectedItemId(null);
    }

    if (activeItem && previewItem && isValidPlacement && e.button === 0) {
      // Place item
      setPlacedItems(prev => [...prev, {
        id: `${Date.now()}-${Math.random()}`,
        itemId: previewItem!.itemId,
        x: previewItem!.x,
        y: previewItem!.y,
        rotation: previewItem!.rotation,
        customColor: (selectedColor && selectedColor !== 'clear') ? selectedColor : undefined,
        floor: currentFloor
      }]);
    }
  };

  const handlePointerMoveCanvas = (e: React.PointerEvent) => {
    if (isPanning) {
      setPan(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    } else {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mx = (e.clientX - rect.left - pan.x) / scale;
        const my = (e.clientY - rect.top - pan.y) / scale;
        setMousePos({ x: mx, y: my });
        mousePosRef.current = { x: mx, y: my };
        
        if (dragState) {
          const dx = Math.round((mx - dragState.startMousePos.x) / 15) * 15;
          const dy = Math.round((my - dragState.startMousePos.y) / 15) * 15;
          
          setPlacedItems(prev => prev.map(item => {
            const initial = dragState.initialItems.find(i => i.id === item.id);
            if (initial) {
              return { ...item, x: initial.x + dx, y: initial.y + dy };
            }
            return item;
          }));
        } else if (selectionBox) {
          setSelectionBox(prev => prev ? { ...prev, endX: mx, endY: my } : null);
        }
      }
    }
  };

  const handlePointerUpCanvas = (e: React.PointerEvent) => {
    setIsPanning(false);
    containerRef.current?.releasePointerCapture(e.pointerId);
    
    if (dragState) {
      setDragState(null);
    }
    
    if (selectionBox) {
      const minX = Math.min(selectionBox.startX, selectionBox.endX);
      const maxX = Math.max(selectionBox.startX, selectionBox.endX);
      const minY = Math.min(selectionBox.startY, selectionBox.endY);
      const maxY = Math.max(selectionBox.startY, selectionBox.endY);
      
      if (maxX - minX > 5 || maxY - minY > 5) {
        const newSelected = placedItems.filter(item => {
          const itemFloor = item.floor || 0;
          if (itemFloor !== currentFloor) return false;
          return item.x >= minX && item.x <= maxX && item.y >= minY && item.y <= maxY;
        }).map(i => i.id);
        setSelectedItemIds(newSelected);
      } else {
        setSelectedItemIds([]);
      }
      setSelectionBox(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const canvasX = (mouseX - pan.x) / scale;
    const canvasY = (mouseY - pan.y) / scale;
    
    const zoomFactor = 1.1;
    const newScale = e.deltaY < 0 ? Math.min(scale * zoomFactor, 4) : Math.max(scale / zoomFactor, 0.2);
    
    setPan({
      x: mouseX - canvasX * newScale,
      y: mouseY - canvasY * newScale
    });
    setScale(newScale);
  };

  const handleItemPointerDown = (e: React.PointerEvent, id: string) => {
    if (e.button !== 0 || activeItem !== null) return;
    e.stopPropagation();

    if (selectedColor !== '') {
      if (selectedItemIds.includes(id)) {
        // Apply color to all selected
        setPlacedItems(prev => prev.map(item => 
          selectedItemIds.includes(item.id) ? { ...item, customColor: selectedColor === 'clear' ? undefined : selectedColor } : item
        ));
      } else {
        setPlacedItems(prev => prev.map(item => 
          item.id === id ? { ...item, customColor: selectedColor === 'clear' ? undefined : selectedColor } : item
        ));
      }
      return;
    }

    if (selectedItemIds.includes(id) && !e.shiftKey) {
      // Start drag of existing selection
      setDragState({
        isDragging: true,
        startMousePos: mousePosRef.current,
        initialItems: placedItems.filter(i => selectedItemIds.includes(i.id))
      });
      containerRef.current?.setPointerCapture(e.pointerId);
    } else {
      // Select new
      const newSelection = e.shiftKey 
        ? (selectedItemIds.includes(id) ? selectedItemIds.filter(i => i !== id) : [...selectedItemIds, id])
        : [id];
      
      setSelectedItemIds(newSelection);
      
      if (!e.shiftKey) {
        // Start drag of new single selection immediately
        setDragState({
          isDragging: true,
          startMousePos: mousePosRef.current,
          initialItems: [placedItems.find(i => i.id === id)!]
        });
        containerRef.current?.setPointerCapture(e.pointerId);
      }
    }
    setSelectedItemId(id); // Keep single select logic working for old features if any
  };

  // Calculate Materials
  const totalMaterials = useMemo(() => {
    const totals: Record<string, number> = {};
    placedItems.forEach(item => {
      const def = BUILD_ITEMS.find(d => d.id === item.itemId);
      if (def) {
        Object.entries(def.costs).forEach(([mat, qty]) => {
          totals[mat] = (totals[mat] || 0) + qty;
        });
      }
    });
    return totals;
  }, [placedItems]);

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sectionTitle}>{t('builder_materials')}</div>
        
        {['structure', 'furniture'].map(cat => {
          const isExpanded = expandedCats[cat];
          return (
            <div key={cat} className={styles.categoryGroup}>
              <div 
                className={styles.categoryHeader} 
                onClick={() => setExpandedCats(p => ({ ...p, [cat]: !p[cat] }))}
              >
                {cat.toUpperCase()} <span>{isExpanded ? '▼' : '▶'}</span>
              </div>
              {isExpanded && (
                <div className={styles.categoryContent}>
                  {BUILD_ITEMS.filter(i => i.materialClass === cat).map(item => (
                    <button
                      key={item.id}
                      className={`${styles.itemButton} ${activeItem === item.id ? styles.active : ''}`}
                      onClick={() => setActiveItem(item.id)}
                    >
                      <div className={styles.colorIndicator} style={{ backgroundColor: (selectedColor && selectedColor !== 'clear') ? selectedColor : item.color }}>
                        <img 
                          src={item.texture} 
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'contain', filter: item.imageFilter || 'none', mixBlendMode: (selectedColor && selectedColor !== 'clear') ? 'multiply' : 'normal' }}
                          onError={(e) => {
                            if (item.fallbackTexture && e.currentTarget.src !== item.fallbackTexture) {
                              e.currentTarget.src = item.fallbackTexture;
                            }
                          }}
                        />
                      </div>
                      {t(item.id)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className={styles.categoryGroup}>
          <div className={styles.categoryHeader} onClick={() => setExpandedCats(p => ({ ...p, color: !p.color }))}>
            {t('builder_painting')} <span>{expandedCats.color ? '▼' : '▶'}</span>
          </div>
          {expandedCats.color && (
            <div className={styles.categoryContent} style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['', 'clear', '#ff4757', '#2ecc71', '#3498db', '#f1c40f', '#9b59b6', '#e67e22', '#34495e'].map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    style={{
                      width: '32px', height: '32px', borderRadius: '4px', cursor: 'pointer',
                      border: selectedColor === c ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: c === 'clear' ? 'transparent' : (c || '#222'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative'
                    }}
                  >
                    {!c && <span style={{ color: '#fff', fontSize: '10px' }}>{t('builder_off')}</span>}
                    {c === 'clear' && <span style={{ color: '#ff4757', fontSize: '16px', fontWeight: 'bold' }}>X</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.sectionTitle} style={{ marginTop: '2rem' }}>{t('builder_cost')}</div>
        <div className={styles.materialsList}>
          {Object.keys(totalMaterials).length === 0 ? (
            <div style={{ color: '#aaa', fontStyle: 'italic' }}>{t('builder_empty')}</div>
          ) : (
            Object.entries(totalMaterials).map(([mat, qty]) => (
              <div key={mat} className={styles.materialRow}>
                <span>{t(mat)}</span>
                <span style={{ fontWeight: 'bold', color: '#2ecc71' }}>{qty}</span>
              </div>
            ))
          )}
        </div>
        
        <div className={styles.instructions}>
          <b>{t('builder_instructions_title')}</b><br/>
          {t('builder_instructions_1')}<br/>
          {t('builder_instructions_2')}<br/>
          {t('builder_instructions_3')}<br/>
          {t('builder_instructions_4')}<br/>
          {t('builder_instructions_5')}<br/>
          {t('builder_instructions_6')}
        </div>
      </div>

      <div className={styles.mainArea}>
        <div className={styles.toolbar}>
          {project && (
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'white', flex: 1, minWidth: 0 }}>
                 {isEditingInfo ? (
                   <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', flexWrap: 'nowrap' }}>
                     <input 
                       value={editName}
                       onChange={(e) => setEditName(e.target.value)}
                       className="glass-input"
                       style={{ width: '180px', padding: '0.4rem 0.8rem', fontSize: '1rem' }}
                       placeholder={t('prompt_new_name')}
                     />
                     <input 
                       value={editDesc}
                       onChange={(e) => setEditDesc(e.target.value)}
                       className="glass-input"
                       style={{ width: '220px', padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                       placeholder={t('prompt_new_desc')}
                     />
                     <button onClick={() => { saveProjectInfo(editName, editDesc); setIsEditingInfo(false); }} className="btn-cinematic primary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>Zapisz</button>
                     <button onClick={() => setIsEditingInfo(false)} className="btn-cinematic secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>Anuluj</button>
                   </div>
                 ) : (
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                     <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', fontWeight: 600 }}>
                       {project.name}
                       <button 
                         onClick={() => {
                           setEditName(project.name);
                           setEditDesc(project.description || '');
                           setIsEditingInfo(true);
                         }}
                         style={{ background: 'none', border: 'none', color: 'var(--accent-green)', cursor: 'pointer', fontSize: '0.8rem', opacity: 0.8 }}
                       >
                         {t('builder_edit')}
                       </button>
                     </h2>
                     {project.description && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>{project.description}</span>}
                   </div>
                 )}
               <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: 'auto', whiteSpace: 'nowrap', background: 'var(--bg-card)', padding: '4px 10px', borderRadius: '6px' }}>{t('builder_code')} {project.joinCode}</span>
               {isSyncing && <span style={{ color: 'var(--accent-green)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{t('builder_saving')}</span>}
             </div>
          )}
          <div style={{ display: 'flex', gap: '0.4rem', marginRight: 'auto', marginLeft: '1rem', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px' }}>
            {[0, 1, 2, 3].map(lvl => (
              <button
                key={lvl}
                onClick={() => setCurrentFloor(lvl)}
                style={{
                  background: currentFloor === lvl ? 'var(--accent-green)' : 'transparent',
                  color: currentFloor === lvl ? '#000' : '#fff',
                  border: 'none',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '4px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.85rem'
                }}
              >
                {lvl === 0 ? 'Parter' : `Piętro ${lvl}`}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <button 
              onClick={() => setShowBedAreas(!showBedAreas)}
              className="btn-cinematic secondary"
              style={{ 
                padding: '0.4rem 1rem',
                borderColor: showBedAreas ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)',
                color: showBedAreas ? 'var(--accent-green)' : 'white'
              }}
            >
              {t('builder_toggle_beds')}
            </button>
            <button 
              onClick={() => setIs3DMode(!is3DMode)}
              className={`btn-cinematic ${is3DMode ? 'primary' : 'secondary'}`}
              style={{ padding: '0.4rem 1rem' }}
            >
              {is3DMode ? 'Wróć do 2D' : 'Widok 3D (BETA)'}
            </button>
            <button 
              className={styles.deleteButton}
              onClick={() => {
              if (confirm(t('clear_project_confirm'))) {
                setPlacedItems([]);
              }
            }}
          >
            {t('builder_clear_project')}
          </button>
          </div>
        </div>

        <div 
          ref={containerRef}
          className={styles.canvasContainer}
          onPointerDown={is3DMode ? undefined : handlePointerDownCanvas}
          onPointerMove={is3DMode ? undefined : handlePointerMoveCanvas}
          onPointerUp={is3DMode ? undefined : handlePointerUpCanvas}
          onWheel={is3DMode ? undefined : handleWheel}
          onContextMenu={e => e.preventDefault()}
        >
          {is3DMode ? (
            <Builder3D placedItems={placedItems} buildItems={BUILD_ITEMS} />
          ) : (
            <div 
              className={styles.canvas} 
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
            >
              {/* Draw Placed Items */}
            {placedItems.map(item => {
              const itemFloor = item.floor || 0;
              if (itemFloor > currentFloor) return null; // Don't show floors above
              
              const def = BUILD_ITEMS.find(d => d.id === item.itemId);
              if (!def) return null;
              const isBed = def.shape === 'bed';
              const isWall = def.shape === 'wall';
              const isPillar = def.shape === 'pillar';
              const shapeClass = isBed ? styles.shapeBed : 
                                 isWall ? styles.shapeWall : 
                                 isPillar ? styles.shapePillar : 
                                 (def.shape === 'triangle' ? styles.shapeTriangleTextured : styles.shapeSquare);
              const isSelected = selectedItemId === item.id || selectedItemIds.includes(item.id);
              
              const isLowerFloor = itemFloor < currentFloor;
              const opacity = isLowerFloor ? 0.3 : 1.0;
              const pointerEvents = isLowerFloor ? 'none' : 'auto';

              return (
                <React.Fragment key={item.id}>
                  {isBed && showBedAreas && (
                    <div style={{
                      position: 'absolute',
                      left: `${item.x}px`,
                      top: `${item.y}px`,
                      width: '540px',
                      height: '540px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(46, 204, 113, 0.05)',
                      border: '2px dashed rgba(46, 204, 113, 0.3)',
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none',
                      zIndex: 1
                    }} />
                  )}
                  <div 
                  className={`${styles.placedItem} ${shapeClass} ${isSelected ? styles.selected : ''}`}
                  data-material={def.materialClass}
                  style={{
                    left: `${item.x}px`,
                    top: `${item.y}px`,
                    transform: def.shape === 'triangle' 
                      ? `translate(-50%, -66.666%) rotate(${item.rotation}deg)` 
                      : `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                    backgroundColor: item.customColor || def.color,
                    opacity: opacity,
                    pointerEvents: pointerEvents as any
                  }}
                  onPointerDown={(e) => handleItemPointerDown(e, item.id)}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                  {renderShapeInterior(def)}
                </div>
              </React.Fragment>
              );
            })}

            {/* Draw Preview Item */}
            {activeItem && previewItem && (() => {
              const def = BUILD_ITEMS.find(d => d.id === previewItem.itemId);
              if (!def) return null;
              const isBed = def.shape === 'bed';
              const isWall = def.shape === 'wall';
              const isPillar = def.shape === 'pillar';
              const shapeClass = isBed ? styles.shapeBed : 
                                 isWall ? styles.shapeWall : 
                                 isPillar ? styles.shapePillar : 
                                 (def.shape === 'triangle' ? styles.shapeTriangleTextured : styles.shapeSquare);

              return (
                <React.Fragment key="preview">
                  {isBed && showBedAreas && (
                    <div style={{
                      position: 'absolute',
                      left: `${previewItem.x}px`,
                      top: `${previewItem.y}px`,
                      width: '540px',
                      height: '540px',
                      borderRadius: '50%',
                      backgroundColor: isValidPlacement ? 'rgba(46, 204, 113, 0.1)' : 'rgba(255, 71, 87, 0.1)',
                      border: isValidPlacement ? '2px dashed rgba(46, 204, 113, 0.5)' : '2px dashed rgba(255, 71, 87, 0.5)',
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none',
                      zIndex: 1
                    }} />
                  )}
                  <div 
                    className={`${styles.placedItem} ${shapeClass}`}
                  data-material={def.materialClass}
                  style={{
                    left: `${previewItem.x}px`,
                    top: `${previewItem.y}px`,
                    transform: def.shape === 'triangle' 
                      ? `translate(-50%, -66.666%) rotate(${previewItem.rotation}deg)` 
                      : `translate(-50%, -50%) rotate(${previewItem.rotation}deg)`,
                    backgroundColor: isValidPlacement ? ((selectedColor && selectedColor !== 'clear') ? selectedColor : def.color) : '#ff4757',
                    opacity: 0.6,
                    zIndex: 1000,
                    pointerEvents: 'none',
                    border: isValidPlacement ? '2px solid #2ecc71' : '2px solid #ff4757',
                    boxShadow: isValidPlacement ? '0 0 20px rgba(46, 204, 113, 0.8)' : '0 0 20px rgba(255, 71, 87, 0.8)'
                  }}
                >
                  {renderShapeInterior(def)}
                </div>
              </React.Fragment>
              );
            })()}

            {/* Draw Selection Box */}
            {selectionBox && (
              <div style={{
                position: 'absolute',
                left: Math.min(selectionBox.startX, selectionBox.endX),
                top: Math.min(selectionBox.startY, selectionBox.endY),
                width: Math.abs(selectionBox.endX - selectionBox.startX),
                height: Math.abs(selectionBox.endY - selectionBox.startY),
                border: '1px solid #3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                pointerEvents: 'none',
                zIndex: 2000
              }} />
            )}

            {/* Draw Snap Point Debug */}
            {snappedEdgeLine && (
              <div 
                style={{
                  position: 'absolute',
                  left: snappedEdgeLine.x,
                  top: snappedEdgeLine.y,
                  width: '6px',
                  height: '6px',
                  background: '#ff4757',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  zIndex: 2000
                }}
              />
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
