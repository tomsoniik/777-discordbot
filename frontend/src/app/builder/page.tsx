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
  // Wood
  { id: 'w_found', name: 'Pine Foundation', shape: 'square', materialClass: 'wood', color: '#8B5A2B', texture: getIconUrl(31), costs: { 'Pine Plank': 3 } },
  { id: 'w_found_tri', name: 'Pine Tri Foundation', shape: 'triangle', materialClass: 'wood', color: '#8B5A2B', texture: getIconUrl(1266), costs: { 'Pine Plank': 2 } },
  { id: 'w_roof', name: 'Pine Roof', shape: 'square', materialClass: 'wood', color: '#CD853F', texture: getIconUrl(32), costs: { 'Pine Plank': 3 } },
  { id: 'w_roof_tri', name: 'Pine Tri Roof', shape: 'triangle', materialClass: 'wood', color: '#CD853F', texture: getIconUrl(1262), costs: { 'Pine Plank': 2 } },
  { id: 'w_hole', name: 'Pine Hole', shape: 'square', materialClass: 'wood', color: '#A0522D', texture: getIconUrl(316), costs: { 'Pine Plank': 3 } },
  
  // Metal
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
  rotation: number; // 0, 90, 180, 270, etc.
}

export default function BuilderPage() {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [selectedPlacedId, setSelectedPlacedId] = useState<string | null>(null);
  
  // Canvas View State
  const [pan, setPan] = useState({ 
    x: typeof window !== 'undefined' ? window.innerWidth / 3 : 0, 
    y: typeof window !== 'undefined' ? window.innerHeight / 3 : 0 
  });
  const [isPanning, setIsPanning] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  
  // Dragging Item State
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDownCanvas = (e: React.PointerEvent) => {
    // If clicking directly on canvas background (not an item)
    if (e.target === containerRef.current) {
      if (activeItem) {
        // Place new item
        const rect = containerRef.current.getBoundingClientRect();
        let placedX = e.clientX - rect.left - pan.x;
        let placedY = e.clientY - rect.top - pan.y;

        if (snapToGrid) {
          placedX = Math.round(placedX / 30) * 30;
          placedY = Math.round(placedY / 30) * 30;
        }

        const newItem: PlacedItem = {
          id: `${Date.now()}-${Math.random()}`,
          itemId: activeItem,
          x: placedX,
          y: placedY,
          rotation: 0
        };
        setPlacedItems(prev => [...prev, newItem]);
        setSelectedPlacedId(newItem.id);
      } else {
        // Start panning
        setIsPanning(true);
        containerRef.current?.setPointerCapture(e.pointerId);
      }
    }
  };

  const handlePointerMoveCanvas = (e: React.PointerEvent) => {
    if (isPanning) {
      setPan(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    } else if (draggingItemId) {
      setPlacedItems(prev => prev.map(item => {
        if (item.id === draggingItemId) {
          let newX = item.x + e.movementX;
          let newY = item.y + e.movementY;
          
          if (snapToGrid) {
            // Realtime snap visually could be jarring if raw movement is added, 
            // but we can snap on mouse up, or round the actual values.
            // For smoother feel, we don't snap during move but snap on release.
          }
          return { ...item, x: newX, y: newY };
        }
        return item;
      }));
    }
  };

  const handlePointerUpCanvas = (e: React.PointerEvent) => {
    setIsPanning(false);
    containerRef.current?.releasePointerCapture(e.pointerId);

    if (draggingItemId && snapToGrid) {
      setPlacedItems(prev => prev.map(item => {
        if (item.id === draggingItemId) {
          return {
            ...item,
            x: Math.round(item.x / 30) * 30,
            y: Math.round(item.y / 30) * 30
          };
        }
        return item;
      }));
    }
    setDraggingItemId(null);
  };

  const handleItemPointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation(); // prevent canvas pan
    if (e.button === 2) {
      // Right click to delete
      setPlacedItems(prev => prev.filter(i => i.id !== id));
      if (selectedPlacedId === id) setSelectedPlacedId(null);
      return;
    }
    
    setSelectedPlacedId(id);
    setDraggingItemId(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const rotateSelected = () => {
    if (!selectedPlacedId) return;
    setPlacedItems(prev => prev.map(item => {
      if (item.id === selectedPlacedId) {
        return { ...item, rotation: (item.rotation + 30) % 360 };
      }
      return item;
    }));
  };

  const deleteSelected = () => {
    if (!selectedPlacedId) return;
    setPlacedItems(prev => prev.filter(i => i.id !== selectedPlacedId));
    setSelectedPlacedId(null);
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
        <div className={styles.sectionTitle}>Narzędzia i Edycja</div>
        <button 
          className={styles.actionButton} 
          style={{ marginBottom: '10px' }}
          onClick={() => setSnapToGrid(!snapToGrid)}
        >
          Przyciąganie do siatki (Snapping): {snapToGrid ? 'WŁ' : 'WYŁ'}
        </button>

        {selectedPlacedId ? (
          <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '15px' }}>
            <div style={{ marginBottom: '10px', color: '#aaa', fontSize: '0.9rem' }}>Wybrano element.</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className={styles.actionButton} onClick={rotateSelected}>Obróć 30°</button>
              <button className={styles.deleteButton} onClick={deleteSelected}>Usuń</button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '15px', color: '#aaa', fontSize: '0.85rem' }}>
            Wybierz z listy poniżej, by postawić nowy element, lub kliknij na postawiony na mapie, by go edytować.
          </div>
        )}

        <div className={styles.sectionTitle}>Budulec</div>
        {BUILD_ITEMS.map(item => (
          <button
            key={item.id}
            className={`${styles.itemButton} ${activeItem === item.id && !selectedPlacedId ? styles.active : ''}`}
            onClick={() => {
              setActiveItem(item.id);
              setSelectedPlacedId(null);
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
          <b>Instrukcja:</b><br/>
          - Wybierz element i kliknij na pustym polu by go postawić.<br/>
          - Chwyć i przeciągnij postawiony element by zmienić pozycję.<br/>
          - Prawy Przycisk Myszy usuwa element.<br/>
          - Kliknij i przeciągnij tło by przesuwać widok kamery.
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
                setSelectedPlacedId(null);
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
          onContextMenu={e => e.preventDefault()}
        >
          <div 
            className={styles.canvas} 
            style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
          >
            {placedItems.map(item => {
              const def = BUILD_ITEMS.find(d => d.id === item.itemId);
              if (!def) return null;

              const isSelected = item.id === selectedPlacedId;
              const shapeClass = def.shape === 'triangle' ? styles.shapeTriangleTextured : styles.shapeSquare;

              return (
                <div 
                  key={item.id}
                  className={`${styles.placedItem} ${shapeClass} ${isSelected ? styles.selected : ''}`}
                  style={{
                    left: `${item.x}px`,
                    top: `${item.y}px`,
                    transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                    backgroundColor: def.color,
                    backgroundImage: `url(${def.texture})`
                  }}
                  onPointerDown={(e) => handleItemPointerDown(e, item.id)}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  {/* Centrum obrotu */}
                  {isSelected && <div style={{width: 4, height: 4, background: '#fff', borderRadius: '50%', position: 'absolute'}}/>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
