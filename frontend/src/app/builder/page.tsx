"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import { Add, FolderOpen, User, Link as LinkIcon, Trash, Clock, Folder } from 'iconsax-react';
import { motion, Variants } from 'framer-motion';

export default function BuilderDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 20 }
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const getLocalProjects = (): any[] => {
    try {
      const stored = localStorage.getItem('builder_local_projects');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  };

  const saveLocalProjects = (list: any[]) => {
    try {
      localStorage.setItem('builder_local_projects', JSON.stringify(list));
    } catch (e) {}
  };

  const fetchProjects = async () => {
    setIsLoading(true);
    let apiProjects: any[] = [];
    try {
      const res = await fetch('/api/builder/projects');
      if (res.ok) {
        apiProjects = await res.json();
      }
    } catch (e) {
      console.error(e);
    }

    const localProjects = getLocalProjects();
    const merged = [...apiProjects];
    localProjects.forEach((lp) => {
      if (!merged.some((p) => p.id === lp.id)) {
        merged.push(lp);
      }
    });

    setProjects(merged);
    setIsLoading(false);
  };

  const createProject = async () => {
    const defaultName = (t('builder_new_project') || 'Nowy Projekt') + ' ' + new Date().toLocaleTimeString();
    const name = window.prompt(t('prompt_new_name') || 'Podaj nazwę projektu:', defaultName);
    if (!name) return; // cancelled
    const description = window.prompt(t('prompt_new_desc') || 'Podaj opis projektu:', '') || '';
    
    let createdProject: any = null;
    try {
      const res = await fetch('/api/builder/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });
      if (res.ok) {
        createdProject = await res.json();
      }
    } catch (e) {
      console.error(e);
    }

    if (!createdProject) {
      const localId = 'local-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      const joinCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      createdProject = {
        id: localId,
        name,
        description,
        data: '[]',
        joinCode,
        updatedAt: new Date().toISOString(),
        owner: { name: session?.user?.name || 'Gość' },
        collaborators: []
      };

      const localList = getLocalProjects();
      localList.unshift(createdProject);
      saveLocalProjects(localList);
    }

    router.push(`/builder/${createdProject.id}`);
  };

  const joinProject = async () => {
    if (!joinCode.trim()) return;
    const targetCode = joinCode.trim().toUpperCase();
    try {
      const res = await fetch(`/api/builder/projects/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: targetCode })
      });
      if (res.ok) {
        const p = await res.json();
        if (p && p.id) {
          router.push(`/builder/${p.id}`);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }

    const localList = getLocalProjects();
    let found = localList.find((p) => p.joinCode === targetCode || p.id === targetCode);
    if (!found) {
      found = {
        id: 'local-' + targetCode,
        name: `Projekt ${targetCode}`,
        description: '',
        data: '[]',
        joinCode: targetCode,
        updatedAt: new Date().toISOString(),
        owner: { name: session?.user?.name || 'Gość' },
        collaborators: []
      };
      localList.unshift(found);
      saveLocalProjects(localList);
    }
    router.push(`/builder/${found.id}`);
  };

  const deleteProject = async (e: React.MouseEvent, projId: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(`Czy na pewno chcesz usunąć/opuścić projekt "${name}"?`)) return;

    try {
      if (!projId.startsWith('local-')) {
        await fetch(`/api/builder/projects/${projId}`, { method: 'DELETE' });
      }
    } catch (err) {
      console.error(err);
    }

    const localList = getLocalProjects().filter((p) => p.id !== projId && p.joinCode !== projId);
    saveLocalProjects(localList);
    setProjects((prev) => prev.filter((p) => p.id !== projId));
  };

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Ładowanie...</div>;
  }

  return (
    <div className="container" style={{ padding: '2rem', paddingTop: '120px', minHeight: '100vh' }}>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '0.5rem' }}>
              {t('builder_projects_title')}
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Zarządzaj swoimi projektami i bazami 2D/3D</p>
          </div>
          
          <button 
            className="btn-cinematic primary"
            onClick={createProject}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '1rem' }}
          >
            <Add size="24" /> {t('builder_new_project')}
          </button>
        </motion.div>

        <motion.div variants={itemVariants} className="bento-card" style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', padding: '2rem' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem', fontWeight: 600 }}>{t('builder_join_group')}</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{t('builder_join_desc')}</p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                className="glass-input"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder={t('builder_join_placeholder')}
                style={{ flex: 1, minWidth: '200px', textTransform: 'uppercase' }}
              />
              <button 
                className="btn-cinematic secondary"
                onClick={joinProject}
              >
                {t('builder_join_btn')}
              </button>
            </div>
          </div>
        </motion.div>

        <motion.h2 variants={itemVariants} style={{ fontSize: '1.8rem', marginBottom: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
          {t('builder_your_projects')}
        </motion.h2>
        
        {projects.length === 0 ? (
          <motion.div variants={itemVariants} className="bento-card" style={{ textAlign: 'center', padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <FolderOpen size="48" color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.2rem' }}>{t('builder_no_projects')}</h3>
            <p style={{ color: 'var(--text-muted)' }}>{t('builder_no_projects_desc')}</p>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {projects.map((p) => (
              <motion.div variants={itemVariants} key={p.id}>
                <Link href={`/builder/${p.id}`} style={{ textDecoration: 'none' }}>
                  <div className="bento-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '1.5rem', position: 'relative' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{ color: 'white', fontSize: '1.3rem', fontWeight: 600, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Folder variant="Bulk" size="22" color="#10b981" /> {p.name}
                        </h3>
                        <button
                          onClick={(e) => deleteProject(e, p.id, p.name)}
                          title="Usuń / Opuść projekt"
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            padding: '6px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            zIndex: 10
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        >
                          <Trash variant="Bulk" size="18" />
                        </button>
                      </div>
                      {p.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', fontStyle: 'italic' }}>{p.description}</p>}
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size="14" color="rgba(255,255,255,0.4)" /> {t('builder_updated')} {new Date(p.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '6px', borderRadius: '50%', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User variant="Bulk" size="16" />
                        </div>
                        <span style={{ fontWeight: 500, color: 'white' }}>{p.owner?.name || 'Gość'}</span>
                      </div>
                      
                      {p.collaborators?.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <User variant="Bulk" size="14" /> +{p.collaborators.length}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--accent-green)', marginTop: '1rem', fontWeight: 500, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <LinkIcon variant="Bulk" size="16" /> {t('builder_code')} <span style={{ letterSpacing: '1px', fontWeight: 700 }}>{p.joinCode}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
