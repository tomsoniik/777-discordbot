"use client";

import React, { useState, MouseEvent, useMemo } from 'react';
import styles from './builder.module.css';

interface BuildItem {
  id: string;
  name: string;
  type: 'foundation' | 'wall' | 'pillar' | 'roof' | 'doorway' | 'window';
  materialClass: 'wood' | 'metal';
  color: string;
  texture: string;
  costs: Record<string, number>;
}

const BUILD_ITEMS: BuildItem[] = [
  // Wood
  { id: 'w_found', name: 'Pine Foundation', type: 'foundation', materialClass: 'wood', color: '#8B5A2B', texture: '/textures/w_found.png', costs: { 'Pine Plank': 3 } },
  { id: 'w_wall', name: 'Pine Wall', type: 'wall', materialClass: 'wood', color: '#A0522D', texture: '/textures/w_wall.png', costs: { 'Pine Plank': 3 } },
  { id: 'w_pillar', name: 'Pine Pillar', type: 'pillar', materialClass: 'wood', color: '#D2691E', texture: '/textures/w_pillar.png', costs: { 'Pine Plank': 2 } },
  { id: 'w_roof', name: 'Pine Roof', type: 'roof', materialClass: 'wood', color: '#CD853F', texture: '/textures/w_roof.png', costs: { 'Pine Plank': 3 } },
  { id: 'w_doorway', name: 'Pine Doorway', type: 'doorway', materialClass: 'wood', color: '#DEB887', texture: '/textures/w_doorway.png', costs: { 'Pine Plank': 3 } },
  { id: 'w_window', name: 'Pine Window', type: 'window', materialClass: 'wood', color: '#DEB887', texture: '/textures/w_window.png', costs: { 'Pine Plank': 3 } },
  
  // Metal
  { id: 'm_found', name: 'Metal Foundation', type: 'foundation', materialClass: 'metal', color: '#708090', texture: '/textures/m_found.png', costs: { 'Metal Sheet': 3 } },
  { id: 'm_wall', name: 'Metal Wall', type: 'wall', materialClass: 'metal', color: '#778899', texture: '/textures/m_wall.png', costs: { 'Metal Sheet': 3 } },
  { id: 'm_pillar', name: 'Metal Pillar', type: 'pillar', materialClass: 'metal', color: '#B0C4DE', texture: '/textures/m_pillar.png', costs: { 'Metal Bar': 2 } },
  { id: 'm_roof', name: 'Metal Roof', type: 'roof', materialClass: 'metal', color: '#808080', texture: '/textures/m_roof.png', costs: { 'Metal Sheet': 3 } },
  { id: 'm_doorway', name: 'Metal Doorway', type: 'doorway', materialClass: 'metal', color: '#696969', texture: '/textures/m_doorway.png', costs: { 'Metal Sheet': 3 } },
  { id: 'm_window', name: 'Metal Window', type: 'window', materialClass: 'metal', color: '#696969', texture: '/textures/m_window.png', costs: { 'Metal Sheet': 3 } },
];

type ItemPosition = 'center' | 'top' | 'right' | 'bottom' | 'left' | 'tl' | 'tr' | 'bl' | 'br';

interface PlacedItem {
  id: string; // unique
  itemId: string;
  x: number;
  y: number;
  position: ItemPosition;
  layer: 'base' | 'roof';
}

const GRID_SIZE = 15;
const CELL_SIZE = 50;

export default function BuilderPage() {
  const [activeItem, setActiveItem] = useState<string>(BUILD_ITEMS[0].id);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [viewLayer, setViewLayer] = useState<'base' | 'roof' | 'all'>('all');

  const selectedItemDef = BUILD_ITEMS.find(i => i.id === activeItem);

  const getPositionFromEvent = (e: MouseEvent<HTMLDivElement>): ItemPosition => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    if (!selectedItemDef) return 'center';

    if (['wall', 'doorway', 'window'].includes(selectedItemDef.type)) {
      // Find closest edge
      const distTop = y;
      const distBottom = 1 - y;
      const distLeft = x;
      const distRight = 1 - x;
      
      const minDist = Math.min(distTop, distBottom, distLeft, distRight);
      if (minDist === distTop) return 'top';
      if (minDist === distBottom) return 'bottom';
      if (minDist === distLeft) return 'left';
      return 'right';
    }

    if (selectedItemDef.type === 'pillar') {
      if (x < 0.5 && y < 0.5) return 'tl';
      if (x > 0.5 && y < 0.5) return 'tr';
      if (x < 0.5 && y > 0.5) return 'bl';
      return 'br';
    }

    return 'center';
  };

  const handleCellClick = (x: number, y: number, e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!selectedItemDef) return;

    const isErase = e.type === 'contextmenu' || e.button === 2;
    const position = getPositionFromEvent(e);
    
    // Determine layer based on item type
    const layer = selectedItemDef.type === 'roof' ? 'roof' : 'base';

    if (isErase) {
      // Find item to erase at this exact cell, position, and layer
      setPlacedItems(prev => prev.filter(i => 
        !(i.x === x && i.y === y && i.position === position && i.layer === layer)
      ));
    } else {
      // Prevent duplicates
      setPlacedItems(prev => {
        const filtered = prev.filter(i => 
          !(i.x === x && i.y === y && i.position === position && i.layer === layer)
        );
        return [...filtered, {
          id: `${Date.now()}-${Math.random()}`,
          itemId: selectedItemDef.id,
          x, y, position, layer
        }];
      });
    }
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

  // Generate grid rendering
  const gridCells = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      
      const cellItems = placedItems.filter(i => i.x === x && i.y === y && (viewLayer === 'all' || i.layer === viewLayer));
      
      gridCells.push(
        <div 
          key={`${x}-${y}`} 
          className={styles.cell}
          style={{ width: CELL_SIZE, height: CELL_SIZE }}
          onClick={(e) => handleCellClick(x, y, e)}
          onContextMenu={(e) => handleCellClick(x, y, e)}
        >
          {cellItems.map(item => {
            const def = BUILD_ITEMS.find(d => d.id === item.itemId);
            if (!def) return null;

            let itemClass = '';
            if (def.type === 'foundation') itemClass = styles.placedFoundation;
            if (def.type === 'roof') itemClass = styles.placedRoof;
            if (['wall', 'doorway', 'window'].includes(def.type)) {
              itemClass = `${styles.placedWall} ${
                item.position === 'top' ? styles.wallTop : 
                item.position === 'right' ? styles.wallRight : 
                item.position === 'bottom' ? styles.wallBottom : styles.wallLeft
              }`;
            }
            if (def.type === 'pillar') {
              itemClass = `${styles.placedPillar} ${
                item.position === 'tl' ? styles.pillarTL : 
                item.position === 'tr' ? styles.pillarTR : 
                item.position === 'bl' ? styles.pillarBL : styles.pillarBR
              }`;
            }

            return (
              <div 
                key={item.id} 
                className={itemClass}
                style={{ 
                  backgroundColor: def.color,
                  backgroundImage: `url(${def.texture})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
                title={def.name}
              />
            );
          })}
        </div>
      );
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sectionTitle}>Budulec</div>
        {BUILD_ITEMS.map(item => (
          <button
            key={item.id}
            className={`${styles.itemButton} ${activeItem === item.id ? styles.active : ''}`}
            onClick={() => setActiveItem(item.id)}
          >
            <div 
              className={styles.colorIndicator} 
              style={{ 
                backgroundColor: item.color,
                backgroundImage: `url(${item.texture})`,
                backgroundSize: 'cover'
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
      </div>

      <div className={styles.mainArea}>
        <div className={styles.toolbar}>
          <span style={{ fontWeight: 'bold' }}>Warstwa:</span>
          <button 
            className={`${styles.layerToggle} ${viewLayer === 'all' ? styles.active : ''}`}
            onClick={() => setViewLayer('all')}
          >
            Wszystko
          </button>
          <button 
            className={`${styles.layerToggle} ${viewLayer === 'base' ? styles.active : ''}`}
            onClick={() => setViewLayer('base')}
          >
            Baza (Fundamenty)
          </button>
          <button 
            className={`${styles.layerToggle} ${viewLayer === 'roof' ? styles.active : ''}`}
            onClick={() => setViewLayer('roof')}
          >
            Dach
          </button>
          
          <button 
            className={styles.clearButton}
            onClick={() => {
              if (confirm('Czy na pewno chcesz wyczyścić cały projekt?')) {
                setPlacedItems([]);
              }
            }}
          >
            Wyczyść projekt
          </button>
          
          <span style={{ marginLeft: 'auto', color: '#aaa', fontSize: '0.9rem' }}>
            LPM - Postaw | PPM - Usuń
          </span>
        </div>

        <div className={styles.gridContainer}>
          <div 
            className={styles.grid}
            style={{ 
              gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`
            }}
          >
            {gridCells}
          </div>
        </div>
      </div>
    </div>
  );
}
