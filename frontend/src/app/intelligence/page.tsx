"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Radar, Profile2User, SearchNormal } from 'iconsax-react';

// Dynamiczny import grafu Cytoscape
const IntelligenceGraph = dynamic(() => import('@/components/IntelligenceGraph'), { ssr: false });

export default function IntelligencePage() {
  const [data, setData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/intelligence')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []);

  const filteredData = useMemo(() => {
    let finalNodes = data.nodes;
    let finalLinks = data.links;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchedNodes = new Set(
        data.nodes
          .filter((n: any) => n.id.toLowerCase().includes(searchLower) || (n.name && n.name.toLowerCase().includes(searchLower)))
          .map((n: any) => n.id)
      );
      
      finalNodes = data.nodes.filter((n: any) => matchedNodes.has(n.id));
      finalLinks = data.links.filter((l: any) => matchedNodes.has(l.source?.id || l.source) || matchedNodes.has(l.target?.id || l.target));
    }

    const cyNodes = finalNodes.map((n: any) => ({
      data: { id: n.id, label: n.name }
    }));
    const cyEdges = finalLinks.map((l: any) => ({
      data: { source: l.source?.id || l.source, target: l.target?.id || l.target, label: `Siła: ${l.value}` }
    }));

    return {
      nodesCount: finalNodes.length,
      linksCount: finalLinks.length,
      elements: [...cyNodes, ...cyEdges]
    };
  }, [data, searchTerm]);

  return (
    <main className="container" style={{ paddingTop: '2rem' }}>
      <div className="admin-header animate-fade-in-up">
        <h1 className="admin-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Radar size="42" color="#ff4757" variant="Bulk" />
          Shadow Network
        </h1>
        <p className="admin-subtitle">
          Wizualizacja Echo-Tracker. System automatycznie analizuje powiązania między graczami.
        </p>
      </div>

      <div className="bento-grid" style={{ gridTemplateColumns: '1fr', marginTop: '2rem' }}>
        
        <div className="bento-card animate-fade-in-up delay-100" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <SearchNormal size="24" color="var(--text-muted)" />
            <input 
                type="text" 
                placeholder="Szukaj gracza po SteamID lub Nicku..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                    background: 'transparent', border: 'none', color: '#fff', width: '100%', fontSize: '1.1rem', outline: 'none'
                }}
            />
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Profile2User size="20" /> {filteredData.nodesCount} Węzłów
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Radar size="20" /> {filteredData.linksCount} Powiązań
                </span>
            </div>
        </div>

        <div className="bento-card animate-fade-in-up delay-200" style={{ height: '70vh', padding: 0, overflow: 'hidden', position: 'relative' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
              Ładowanie siatki powiązań...
            </div>
          ) : data.nodes.length === 0 ? (
             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Brak zgromadzonych danych w systemie. Dodaj kogoś na Discordzie nową komendą np: /track steamid:X link_to:Y
             </div>
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#0a0a0c' }}>
                <IntelligenceGraph elements={filteredData.elements} />
            </div>
          )}
        </div>
        
      </div>
    </main>
  );
}
