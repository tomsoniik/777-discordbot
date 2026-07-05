"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import { Add, FolderOpen, User, Link as LinkIcon } from 'iconsax-react';

export default function BuilderDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    } else if (status === 'authenticated') {
      fetchProjects();
    }
  }, [status, router]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/builder/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async () => {
    try {
      const res = await fetch('/api/builder/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Nowy Projekt ' + new Date().toLocaleTimeString() })
      });
      if (res.ok) {
        const p = await res.json();
        router.push(`/builder/${p.id}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const joinProject = async () => {
    if (!joinCode.trim()) return;
    try {
      const res = await fetch(`/api/builder/projects/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: joinCode.trim().toUpperCase() })
      });
      if (res.ok) {
        const p = await res.json();
        router.push(`/builder/${p.id}`);
      } else {
        alert('Nie udało się dołączyć. Sprawdź kod.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (status === 'loading' || isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Ładowanie...</div>;
  }

  return (
    <div className="container" style={{ padding: '2rem', paddingTop: '100px', minHeight: '100vh', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Projekty Baz (Planner)</h1>
        
        <button 
          onClick={createProject}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--accent-green)',
            color: '#111',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: '0.2s',
            boxShadow: '0 4px 15px rgba(46, 204, 113, 0.3)'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Add size="24" /> Nowy Projekt
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ marginBottom: '0.5rem', color: '#ccc' }}>Dołącz do projektu grupowego</h3>
          <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1rem' }}>Wpisz kod dostępu, aby współtworzyć bazę ze znajomymi.</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Kod np. ABC123XYZ"
              style={{
                background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
                padding: '10px 16px', borderRadius: '8px', color: 'white', flex: 1, textTransform: 'uppercase'
              }}
            />
            <button 
              onClick={joinProject}
              style={{
                background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none',
                padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
              }}
            >
              Dołącz
            </button>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Twoje i współdzielone projekty</h2>
      
      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <FolderOpen size="48" color="#555" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: '#aaa', marginBottom: '0.5rem' }}>Brak projektów</h3>
          <p style={{ color: '#666' }}>Utwórz nowy projekt, aby zacząć budować.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {projects.map((p) => (
            <Link href={`/builder/${p.id}`} key={p.id} style={{ textDecoration: 'none' }}>
              <div 
                style={{
                  background: 'rgba(20, 20, 25, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  height: '100%'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(46, 204, 113, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  <h3 style={{ color: 'white', fontSize: '1.2rem', marginBottom: '0.5rem' }}>{p.name}</h3>
                  <p style={{ color: '#888', fontSize: '0.85rem' }}>Zaktualizowano: {new Date(p.updatedAt).toLocaleString()}</p>
                </div>
                
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#aaa', fontSize: '0.9rem' }}>
                    <User size="16" /> {p.owner.name}
                  </div>
                  
                  {p.collaborators?.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '8px', fontSize: '0.8rem', color: '#ccc' }}>
                      <User size="14" /> +{p.collaborators.length}
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(46, 204, 113, 0.1)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--accent-green)', marginTop: '0.5rem' }}>
                  <LinkIcon size="14" /> Kod: {p.joinCode}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
