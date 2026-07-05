"use client";

import React, { useState, MouseEvent, useMemo, useRef, useEffect } from 'react';
import styles from './builder.module.css';

type ShapeType = 'square' | 'triangle';

interface BuildItem {
  id: string;
  name: string;
  shape: ShapeType;
  materialClass: 'wood' | 'metal';
  color: string;
  texture: string;
  costs: Record<string, number>;
}

const getIconUrl = (id: number) => `https://cdn.jsdelivr.net/gh/SilKsPlugins/UnturnedImages@images/vanilla/items/${id}.png`;

const BUILD_ITEMS: BuildItem[] = [
  { id: 'w_found', name: 'Pine Foundation', shape: 'square', materialClass: 'wood', color: '#8B5A2B', texture: getIconUrl(31), costs: { 'Pine Log': 3 } },
  { id: 'w_found_tri', name: 'Pine Tri Foundation', shape: 'triangle', materialClass: 'wood', color: '#8B5A2B', texture: getIconUrl(1266), costs: { 'Pine Log': 2 } },
  { id: 'w_roof', name: 'Pine Roof', shape: 'square', materialClass: 'wood', color: '#CD853F', texture: getIconUrl(32), costs: { 'Pine Log': 3 } },
  { id: 'w_roof_tri', name: 'Pine Tri Roof', shape: 'triangle', materialClass: 'wood', color: '#CD853F', texture: getIconUrl(1262), costs: { 'Pine Log': 2 } },
  { id: 'w_hole', name: 'Pine Hole', shape: 'square', materialClass: 'wood', color: '#A0522D', texture: getIconUrl(316), costs: { 'Pine Log': 3 } },
  
  { id: 'm_found', name: 'Metal Foundation', shape: 'square', materialClass: 'metal', color: '#708090', texture: getIconUrl(369), costs: { 'Metal Sheet': 3 } },
  { id: 'm_found_tri', name: 'Metal Tri Foundation', shape: 'triangle', materialClass: 'metal', color: '#708090', texture: getIconUrl(1268), costs: { 'Metal Sheet': 2 } },
  { id: 'm_roof', name: 'Metal Roof', shape: 'square', materialClass: 'metal', color: '#808080', texture: getIconUrl(370), costs: { 'Metal Sheet': 3 } },
  { id: 'm_roof_tri', name: 'Metal Tri Roof', shape: 'triangle', materialClass: 'metal', color: '#808080', texture: getIconUrl(1269), costs: { 'Metal Sheet': 2 } },
  { id: 'm_hole', name: 'Metal Hole', shape: 'square', materialClass: 'metal', color: '#696969', texture: getIconUrl(374), costs: { 'Metal Sheet': 3 } },
];

interface PlacedItem {
  id: string; // unique
  itemId: string;
  x: number;
  y: number;
  rotation: number; // in degrees
}

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
  
  // Canvas View State
  const [pan, setPan] = useState({ 
    x: typeof window !== 'undefined' ? window.innerWidth / 3 : 0, 
    y: typeof window !== 'undefined' ? window.innerHeight / 3 : 0 
  });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  
  // Placement State
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeEdgeIndex, setActiveEdgeIndex] = useState(0); // for rotating the active item during placement
  const [freeRotation, setFreeRotation] = useState(0); // for placing freely

  const containerRef = useRef<HTMLDivElement>(null);

  // Handle keyboard rotation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }

  const handlePointerDownCanvas = (e: React.PointerEvent) => {
    if (e.button === 2) {
      // Right click cancels active item
      setActiveItem(null);
      return;
    }
    
    if (e.button === 1 || (!activeItem && e.button === 0)) {
      // Middle click or Left click without item -> Pan
      setIsPanning(true);
      containerRef.current?.setPointerCapture(e.pointerId);
      return;
    }

    if (activeItem && previewItem && e.button === 0) {
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

  const handleItemRightClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPlacedItems(prev => prev.filter(i => i.id !== id));
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
        {BUILD_ITEMS.map(item => (
          <button
            key={item.id}
            className={`${styles.itemButton} ${activeItem === item.id ? styles.active : ''}`}
            onClick={() => {
              setActiveItem(item.id);
            }}
          >
            <div 
              className={styles.colorIndicator} 
              style={{ 
                backgroundColor: item.color,
                backgroundImage: `url(${item.texture})`,
                borderRadius: item.shape === 'triangle' ? '0' : '4px',
                clipPath: item.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none'
              }} 
            />
            {item.name}
          </button>
        ))}

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
          <b>Instrukcja Budowania (Jak w grze):</b><br/>
          - Wybierz element z listy po lewej.<br/>
          - Najedź na krawędź postawionego obiektu, by automatycznie do niego "przykleić" (Snap) kolejny.<br/>
          - Wciśnij <b>[R]</b>, aby zmienić krawędź / obrócić element przed postawieniem.<br/>
          - Kliknij <b>Prawy Przycisk Myszy</b> na obiekcie, by go usunąć.<br/>
          - Przytrzymaj tło i przeciągnij, by przesuwać kamerę.
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

              return (
                <div 
                  key={item.id}
                  className={`${styles.placedItem} ${shapeClass}`}
                  data-material={def.materialClass}
                  style={{
                    left: `${item.x}px`,
                    top: `${item.y}px`,
                    transform: def.shape === 'triangle' 
                      ? `translate(-50%, -66.666%) rotate(${item.rotation}deg)` 
                      : `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                    backgroundColor: def.color
                  }}
                  onContextMenu={(e) => handleItemRightClick(e, item.id)}
                />
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
                    backgroundColor: def.color,
                    opacity: 0.6,
                    zIndex: 1000,
                    pointerEvents: 'none',
                    border: '2px solid #2ecc71',
                    boxShadow: '0 0 20px rgba(46, 204, 113, 0.8)'
                  }}
                />
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
