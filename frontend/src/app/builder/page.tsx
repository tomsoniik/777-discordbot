"use client";

import React, { useState, MouseEvent, useMemo, useRef, useEffect } from 'react';
import styles from './builder.module.css';

type ShapeType = 'square' | 'triangle';

interface BuildItem {
  id: string;
  name: string;
  shape: ShapeType;
  materialClass: 'wood' | 'metal' | 'brick';
  color: string;
  texture: string;
  fallbackTexture?: string;
  imageFilter?: string;
  costs: Record<string, number>;
}

const getIconUrl = (id: number) => `https://cdn.jsdelivr.net/gh/SilKsPlugins/UnturnedImages@images/vanilla/items/${id}.png`;

const BUILD_ITEMS: BuildItem[] = [
  { id: 'w_found', name: 'Pine Foundation', shape: 'square', materialClass: 'wood', color: '#8B5A2B', texture: getIconUrl(52), costs: { 'Pine Log': 3 } },
  { id: 'w_found_tri', name: 'Pine Tri Foundation', shape: 'triangle', materialClass: 'wood', color: '#8B5A2B', texture: getIconUrl(1264), costs: { 'Pine Log': 2 } },
  { id: 'w_roof', name: 'Pine Roof', shape: 'square', materialClass: 'wood', color: '#CD853F', texture: getIconUrl(56), costs: { 'Pine Log': 3 } },
  { id: 'w_roof_tri', name: 'Pine Tri Roof', shape: 'triangle', materialClass: 'wood', color: '#CD853F', texture: getIconUrl(1268), costs: { 'Pine Log': 2 } },
  { id: 'w_hole', name: 'Pine Hole', shape: 'square', materialClass: 'wood', color: '#A0522D', texture: getIconUrl(320), costs: { 'Pine Log': 3 } },
  
  { id: 'm_found', name: 'Metal Foundation', shape: 'square', materialClass: 'metal', color: '#708090', texture: getIconUrl(369), costs: { 'Metal Sheet': 3 } },
  { id: 'm_found_tri', name: 'Metal Tri Foundation', shape: 'triangle', materialClass: 'metal', color: '#708090', texture: getIconUrl(1265), costs: { 'Metal Sheet': 2 } },
  { id: 'm_roof', name: 'Metal Roof', shape: 'square', materialClass: 'metal', color: '#808080', texture: getIconUrl(373), costs: { 'Metal Sheet': 3 } },
  { id: 'm_roof_tri', name: 'Metal Tri Roof', shape: 'triangle', materialClass: 'metal', color: '#808080', texture: getIconUrl(1269), costs: { 'Metal Sheet': 2 } },
  { id: 'm_hole', name: 'Metal Hole', shape: 'square', materialClass: 'metal', color: '#696969', texture: getIconUrl(376), costs: { 'Metal Sheet': 3 } },

  { id: 'b_found', name: 'Brick Foundation', shape: 'square', materialClass: 'brick', color: '#a54331', texture: getIconUrl(1979), fallbackTexture: getIconUrl(52), imageFilter: 'hue-rotate(330deg) saturate(1.5)', costs: { 'Bricks': 3 } },
  { id: 'b_found_tri', name: 'Brick Tri Foundation', shape: 'triangle', materialClass: 'brick', color: '#a54331', texture: getIconUrl(1980), fallbackTexture: getIconUrl(1264), imageFilter: 'hue-rotate(330deg) saturate(1.5)', costs: { 'Bricks': 2 } },
  { id: 'b_roof', name: 'Brick Roof', shape: 'square', materialClass: 'brick', color: '#a54331', texture: getIconUrl(1984), fallbackTexture: getIconUrl(56), imageFilter: 'hue-rotate(330deg) saturate(1.5)', costs: { 'Bricks': 3 } },
  { id: 'b_roof_tri', name: 'Brick Tri Roof', shape: 'triangle', materialClass: 'brick', color: '#a54331', texture: getIconUrl(1985), fallbackTexture: getIconUrl(1268), imageFilter: 'hue-rotate(330deg) saturate(1.5)', costs: { 'Bricks': 2 } },
  { id: 'b_hole', name: 'Brick Hole', shape: 'square', materialClass: 'brick', color: '#a54331', texture: getIconUrl(1981), fallbackTexture: getIconUrl(320), imageFilter: 'hue-rotate(330deg) saturate(1.5)', costs: { 'Bricks': 3 } },
];

interface PlacedItem {
  id: string; // unique
  itemId: string;
  x: number;
  y: number;
  rotation: number; // in degrees
}

const renderShapeInterior = (def: BuildItem) => {
  const isHole = def.id.includes('hole');
  const isRoof = def.id.includes('roof');
  const isTri = def.shape === 'triangle';

  if (isHole) {
    return (
      <div style={{
        width: '50%',
        height: '50%',
        backgroundColor: 'rgba(0,0,0,0.7)',
        position: 'absolute',
        top: isTri ? '33.33%' : '25%',
        left: '25%',
        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.9)',
        clipPath: isTri ? 'polygon(50% 0%, 100% 100%, 0% 100%)' : 'none'
      }} />
    );
  }

  if (isRoof) {
    return (
      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', opacity: 0.6 }}>
        {isTri ? (
          <>
            <line x1="50%" y1="0%" x2="50%" y2="66.66%" stroke="#000" strokeWidth="2" />
            <line x1="100%" y1="100%" x2="50%" y2="66.66%" stroke="#000" strokeWidth="2" />
            <line x1="0%" y1="100%" x2="50%" y2="66.66%" stroke="#000" strokeWidth="2" />
          </>
        ) : (
          <>
            <line x1="0" y1="0" x2="100%" y2="100%" stroke="#000" strokeWidth="2" />
            <line x1="100%" y1="0" x2="0" y2="100%" stroke="#000" strokeWidth="2" />
          </>
        )}
      </svg>
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

export default function BuilderPage() {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({ wood: true, metal: false, brick: false });
  
  // Canvas View State
  const [pan, setPan] = useState({ 
    x: typeof window !== 'undefined' ? window.innerWidth / 3 : 0, 
    y: typeof window !== 'undefined' ? window.innerHeight / 3 : 0 
  });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  
  const [dismantlingId, setDismantlingId] = useState<string | null>(null);
  const dismantleTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Placement State
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeEdgeIndex, setActiveEdgeIndex] = useState(0); // for rotating the active item during placement
  const [freeRotation, setFreeRotation] = useState(0); // for placing freely

  const containerRef = useRef<HTMLDivElement>(null);

  // Prevent default scrolling on wheel
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const preventScroll = (e: WheelEvent) => {
      e.preventDefault();
    };
    el.addEventListener('wheel', preventScroll, { passive: false });
    return () => el.removeEventListener('wheel', preventScroll);
  }, []);

  // Handle keyboard rotation and deselection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveItem(null);
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
  }, [activeItem]);

  const selectedItemDef = BUILD_ITEMS.find(i => i.id === activeItem);

  // Calculate Snapping
  let previewItem: PlacedItem | null = null;
  let snappedEdgeLine = null;
  let isValidPlacement = true;

  if (selectedItemDef) {
    let closestEdge = null;
    let minDist = 40; // snap threshold

    // Find closest placed edge
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
      // Free placement (snapped to global invisible 30x30 grid for neatness)
      previewItem = {
        id: 'preview',
        itemId: selectedItemDef.id,
        x: Math.round(mousePos.x / 30) * 30,
        y: Math.round(mousePos.y / 30) * 30,
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
        
        let minDist = 0;
        if (shape1 === 'square' && shape2 === 'square') {
          minDist = 58; // 60 is minimum valid (edge shared)
        } else if (shape1 === 'triangle' && shape2 === 'triangle') {
          minDist = 33; // 34.64 is minimum valid (edge shared)
        } else {
          minDist = 45; // 47.32 is minimum valid (edge shared)
        }
        
        if (dist < minDist) {
          isValidPlacement = false;
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

    if (activeItem && previewItem && isValidPlacement && e.button === 0) {
      // Place item
      setPlacedItems(prev => [...prev, {
        id: `${Date.now()}-${Math.random()}`,
        itemId: previewItem!.itemId,
        x: previewItem!.x,
        y: previewItem!.y,
        rotation: previewItem!.rotation
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
        setMousePos({
          x: (e.clientX - rect.left - pan.x) / scale,
          y: (e.clientY - rect.top - pan.y) / scale
        });
      }
    }
  };

  const handlePointerUpCanvas = (e: React.PointerEvent) => {
    setIsPanning(false);
    containerRef.current?.releasePointerCapture(e.pointerId);
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
    
    setDismantlingId(id);
    dismantleTimerRef.current = setTimeout(() => {
      setPlacedItems(prev => prev.filter(i => i.id !== id));
      setDismantlingId(null);
    }, 2000);
  };

  const cancelDismantle = () => {
    if (dismantleTimerRef.current) {
      clearTimeout(dismantleTimerRef.current);
      dismantleTimerRef.current = null;
    }
    setDismantlingId(null);
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
        <div className={styles.sectionTitle}>Budulec</div>
        
        {['wood', 'metal', 'brick'].map(cat => {
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
                      <div className={styles.colorIndicator} style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                        <img 
                          src={item.texture} 
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'contain', filter: item.imageFilter || 'none' }}
                          onError={(e) => {
                            if (item.fallbackTexture && e.currentTarget.src !== item.fallbackTexture) {
                              e.currentTarget.src = item.fallbackTexture;
                            }
                          }}
                        />
                      </div>
                      {item.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className={styles.sectionTitle} style={{ marginTop: '2rem' }}>Materiały (Koszt)</div>
        <div className={styles.materialsList}>
          {Object.keys(totalMaterials).length === 0 ? (
            <div style={{ color: '#aaa', fontStyle: 'italic' }}>Brak postawionych struktur.</div>
          ) : (
            Object.entries(totalMaterials).map(([mat, qty]) => (
              <div key={mat} className={styles.materialRow}>
                <span>{mat}</span>
                <span style={{ fontWeight: 'bold', color: '#2ecc71' }}>{qty}</span>
              </div>
            ))
          )}
        </div>
        
        <div className={styles.instructions}>
          <b>Instrukcja Budowania:</b><br/>
          - Wybierz element z listy po lewej. (Wciśnij <b>[ESC]</b> by odznaczyć).<br/>
          - Najedź na krawędź postawionego obiektu, by "przykleić" (Snap) kolejny.<br/>
          - Wciśnij <b>[R]</b>, aby zmienić krawędź / obrócić element.<br/>
          - Przytrzymaj <b>Prawy Przycisk Myszy (PPM)</b> na tle, by przesuwać kamerę.<br/>
          - Aby usunąć obiekt, przytrzymaj na nim <b>Lewy Przycisk Myszy (LPM)</b> przez 2 sekundy (gdy nie masz wybranego klocka w ręce).<br/>
          - Kółko myszy przybliża/oddala widok.
        </div>
      </div>

      <div className={styles.mainArea}>
        <div className={styles.toolbar}>
          <button 
            className={styles.deleteButton}
            style={{ marginLeft: 'auto' }}
            onClick={() => {
              if (confirm('Czy na pewno chcesz wyczyścić cały projekt?')) {
                setPlacedItems([]);
              }
            }}
          >
            Wyczyść projekt
          </button>
        </div>

        <div 
          ref={containerRef}
          className={styles.canvasContainer}
          onPointerDown={handlePointerDownCanvas}
          onPointerMove={handlePointerMoveCanvas}
          onPointerUp={handlePointerUpCanvas}
          onWheel={handleWheel}
          onContextMenu={e => e.preventDefault()}
        >
          <div 
            className={styles.canvas} 
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
          >
            {/* Draw Placed Items */}
            {placedItems.map(item => {
              const def = BUILD_ITEMS.find(d => d.id === item.itemId);
              if (!def) return null;
              const shapeClass = def.shape === 'triangle' ? styles.shapeTriangleTextured : styles.shapeSquare;
              const isDismantling = dismantlingId === item.id;

              return (
                <div 
                  key={item.id}
                  className={`${styles.placedItem} ${shapeClass} ${isDismantling ? styles.dismantling : ''}`}
                  data-material={def.materialClass}
                  style={{
                    left: `${item.x}px`,
                    top: `${item.y}px`,
                    transform: def.shape === 'triangle' 
                      ? `translate(-50%, -66.666%) rotate(${item.rotation}deg)` 
                      : `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                    backgroundColor: def.color
                  }}
                  onPointerDown={(e) => handleItemPointerDown(e, item.id)}
                  onPointerUp={cancelDismantle}
                  onPointerLeave={cancelDismantle}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                  {renderShapeInterior(def)}
                </div>
              );
            })}

            {/* Draw Preview Item */}
            {activeItem && previewItem && (() => {
              const def = BUILD_ITEMS.find(d => d.id === previewItem.itemId);
              if (!def) return null;
              const shapeClass = def.shape === 'triangle' ? styles.shapeTriangleTextured : styles.shapeSquare;

              return (
                <div 
                  className={`${styles.placedItem} ${shapeClass}`}
                  data-material={def.materialClass}
                  style={{
                    left: `${previewItem.x}px`,
                    top: `${previewItem.y}px`,
                    transform: def.shape === 'triangle' 
                      ? `translate(-50%, -66.666%) rotate(${previewItem.rotation}deg)` 
                      : `translate(-50%, -50%) rotate(${previewItem.rotation}deg)`,
                    backgroundColor: isValidPlacement ? def.color : '#ff4757',
                    opacity: 0.6,
                    zIndex: 1000,
                    pointerEvents: 'none',
                    border: isValidPlacement ? '2px solid #2ecc71' : '2px solid #ff4757',
                    boxShadow: isValidPlacement ? '0 0 20px rgba(46, 204, 113, 0.8)' : '0 0 20px rgba(255, 71, 87, 0.8)'
                  }}
                >
                  {renderShapeInterior(def)}
                </div>
              );
            })()}

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
        </div>
      </div>
    </div>
  );
}
