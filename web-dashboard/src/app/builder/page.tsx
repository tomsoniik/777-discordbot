"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import { Add, FolderOpen, User, Link as LinkIcon, Trash, Clock, Folder, CloseCircle } from 'iconsax-react';
import { motion, Variants } from 'framer-motion';
import styles from '@/777_addons/styles/builderPage.module.css';

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
        owner: { name: session?.user?.name || t('builder_guest') },
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

    if (!window.confirm(`${t('builder_confirm_delete')} "${name}"?`)) return;

    try {
      if (!projId.startsWith('local-')) {
        await fetch(`/api/builder/projects/${projId}`, { method: 'DELETE' });
      }
    } catch (err) {
      console.error(err);
    }

    const localList = getLocalProjects().filter((p: any) => p.id !== projId && p.joinCode !== projId);
    saveLocalProjects(localList);
    setProjects((prev: any[]) => prev.filter((p: any) => p.id !== projId));
  };

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Ładowanie...</div>;
  }

  return (
    <div className={`container ${styles.container}`}>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>
              {t('builder_projects_title')}
            </h1>
            <p className={styles.subtitle}>{t('builder_projects_desc')}</p>
          </div>
          
          <button 
            className={`btn-cinematic primary ${styles.createBtn}`}
            onClick={createProject}
          >
            <Add size="24" /> {t('builder_new_project')}
          </button>
        </motion.div>

        <motion.div variants={itemVariants} className={`bento-card ${styles.joinSection}`}>
          <div className={styles.joinSectionInner}>
            <h3 className={styles.joinTitle}>{t('builder_join_group')}</h3>
            <p className={styles.joinDesc}>{t('builder_join_desc')}</p>
            <div className={styles.joinInputRow}>
              <input 
                type="text" 
                className={`glass-input ${styles.joinInput}`}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder={t('builder_join_placeholder')}
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

        <motion.h2 variants={itemVariants} className={styles.projectsTitle}>
          {t('builder_your_projects')}
        </motion.h2>
        
        {projects.length === 0 ? (
          <motion.div variants={itemVariants} className={`bento-card ${styles.emptyState}`}>
            <FolderOpen size="48" color="var(--text-muted)" className={styles.emptyStateIcon} />
            <h3 className={styles.emptyStateTitle}>{t('builder_no_projects')}</h3>
            <p className={styles.emptyStateDesc}>{t('builder_no_projects_desc')}</p>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} className={styles.grid}>
            {projects.map((p) => (
              <motion.div variants={itemVariants} key={p.id}>
                <Link href={`/builder/${p.id}`} className={styles.cardLink}>
                  <div className={`bento-card ${styles.card}`}>
                    <div className={styles.cardInner}>
                      <div className={styles.cardHeaderRow}>
                        <h3 className={styles.cardTitle}>
                          <Folder variant="Bulk" size="22" color="#10b981" /> {p.name}
                        </h3>
                        <button
                          onClick={(e) => deleteProject(e, p.id, p.name)}
                          title={t('builder_delete_project') || "Delete"}
                          className={styles.deleteBtn}
                        >
                          <CloseCircle variant="Bulk" size="22" color="#ef4444" />
                        </button>
                      </div>
                      {p.description && <p className={styles.cardDesc}>{p.description}</p>}
                      <p className={styles.cardDate}>
                        <Clock size="14" color="rgba(255,255,255,0.4)" /> {t('builder_updated')} {new Date(p.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className={styles.cardFooter}>
                      <div className={styles.cardOwner}>
                        <div className={styles.cardOwnerIconWrap}>
                          <User variant="Bulk" size="16" />
                        </div>
                        <span className={styles.cardOwnerName}>{p.owner?.name || t('builder_guest')}</span>
                      </div>
                      
                      {p.collaborators?.length > 0 && (
                        <div className={styles.cardCollabs}>
                          <User variant="Bulk" size="14" /> +{p.collaborators.length}
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.cardCodeWrap}>
                      <LinkIcon variant="Bulk" size="16" /> {t('builder_code')} <span className={styles.cardCodeText}>{p.joinCode}</span>
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
