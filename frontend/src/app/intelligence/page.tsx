"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Radar, Profile2User, SearchNormal } from 'iconsax-react';

// Dynamiczny import ForceGraph (nie dziala przy SSR)
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

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
    if (!searchTerm) return data;
    
    const searchLower = searchTerm.toLowerCase();
    const matchedNodes = new Set(
      data.nodes
        .filter((n: any) => n.id.toLowerCase().includes(searchLower) || (n.name && n.name.toLowerCase().includes(searchLower)))
        .map((n: any) => n.id)
    );
    
    return {
      nodes: data.nodes.filter((n: any) => matchedNodes.has(n.id)),
      links: data.links.filter((l: any) => matchedNodes.has(l.source?.id || l.source) || matchedNodes.has(l.target?.id || l.target))
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
                    <Profile2User size="20" /> {filteredData.nodes.length} Węzłów
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Radar size="20" /> {filteredData.links.length} Powiązań
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
                Brak zgromadzonych danych w systemie. Dodaj kogoś na Discordzie komendą /track.
             </div>
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#0a0a0c' }}>
                <ForceGraph2D
                    graphData={filteredData}
                    nodeLabel="name"
                    nodeColor={(node: any) => node.val > 1 ? '#ff4757' : '#2ecc71'}
                    nodeRelSize={6}
                    linkColor={() => 'rgba(255, 255, 255, 0.2)'}
                    linkWidth={(link: any) => Math.min(link.value, 10)}
                    enableNodeDrag={true}
                    enableZoomInteraction={true}
                    onNodeClick={(node: any) => {
                        window.open(`https://steamcommunity.com/profiles/${node.id}`, '_blank');
                    }}
                />
            </div>
          )}
        </div>
        
      </div>
    </main>
  );
}
