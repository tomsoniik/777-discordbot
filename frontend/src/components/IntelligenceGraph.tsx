'use client';

import React, { useRef, useEffect } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';

// We might want to register extensions here in the future if needed, like fcose layout

interface IntelligenceGraphProps {
  elements?: cytoscape.ElementDefinition[];
}

export default function IntelligenceGraph({ elements }: IntelligenceGraphProps) {
  const cyRef = useRef<cytoscape.Core | null>(null);

  // Default mock elements if none are provided
  const defaultElements: cytoscape.ElementDefinition[] = [
    { data: { id: 'player1', label: 'ShadowNinja' }, classes: 'suspicious' },
    { data: { id: 'player2', label: 'InnyGracz' } },
    { data: { source: 'player1', target: 'player2', label: 'Grali razem' } }
  ];

  const layout = {
    name: 'cose', 
    padding: 30,
    animate: true
  };

  const style: cytoscape.Stylesheet[] = [
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'background-color': 'rgba(255, 255, 255, 0.05)',
        'border-width': 2,
        'border-color': '#4a90e2', 
        'color': '#fff',
        'text-valign': 'bottom',
        'text-margin-y': 5,
        'font-family': 'Inter, sans-serif',
        'font-size': '12px'
      }
    },
    {
      selector: '.suspicious',
      style: {
        'border-color': '#ff4757', 
        'background-color': 'rgba(255, 71, 87, 0.1)',
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': 'rgba(255, 255, 255, 0.15)',
        'curve-style': 'bezier',
        'target-arrow-shape': 'triangle',
        'target-arrow-color': 'rgba(255, 255, 255, 0.15)',
        'label': 'data(label)',
        'color': 'rgba(255, 255, 255, 0.5)',
        'font-size': '10px',
        'text-rotation': 'autorotate',
        'text-margin-y': -10
      }
    }
  ];

  return (
    <div className="w-full h-[600px] rounded-xl border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10">
        <h3 className="text-white/80 font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Echo-Tracker Live Graph
        </h3>
      </div>
      <CytoscapeComponent
        elements={elements || defaultElements}
        style={{ width: '100%', height: '100%' }}
        layout={layout}
        stylesheet={style}
        cy={(cy) => {
          cyRef.current = cy;
          // Example: fit to graph once it's loaded
          cy.fit();
        }}
      />
    </div>
  );
}
