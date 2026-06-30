"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useSession, signIn } from 'next-auth/react';
import { Crown, ShieldTick, Radar } from 'iconsax-react';

export default function Home() {
  const { t, language } = useLanguage();
  const { data: session, status } = useSession();
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <main className="container" style={{ paddingTop: 0 }}>

      <section className="hero">
        <div className="hero-content animate-fade-in-up delay-100">
          <h1 className="hero-title">{t("heroTitle")}<span className="text-gradient">{t("heroSquad")}</span></h1>
          <p className="hero-subtitle">
            {t("heroSubtitle")}
          </p>
          <div className="hero-actions">
            {status === "loading" ? (
              <div className="btn-cinematic" style={{ opacity: 0.5 }}>Loading...</div>
            ) : session ? (
              <>
                <Link href="/apply" className="btn-cinematic" style={{ textDecoration: 'none', padding: '1rem 2.5rem', fontSize: '1rem' }}>
                  {t("startApp")}
                </Link>
                <Link href="/music" className="btn-cinematic" style={{ marginLeft: '1rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'none', padding: '1rem 2.5rem', fontSize: '1rem', textDecoration: 'none' }}>
                  🎶 {language === 'pl' ? 'Zarządzaj Playlistą' : 'Manage Playlist'}
                </Link>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button 
                  onClick={() => setShowLoginModal(true)} 
                  className="btn-cinematic" 
                  style={{ textDecoration: 'none', padding: '1rem 2.5rem', fontSize: '1.1rem' }}
                >
                  {language === 'pl' ? 'Zaloguj się' : 'Sign in'}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Login Modal */}
      {showLoginModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, animation: 'fadeIn 0.2s ease-out'
        }} onClick={() => setShowLoginModal(false)}>
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '24px',
            padding: '3rem 2rem',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.02)',
            position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            
            <button 
              onClick={() => setShowLoginModal(false)}
              style={{ position: 'absolute', top: '15px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              &times;
            </button>

            <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '0.5rem' }}>{language === 'pl' ? 'Wybierz metodę' : 'Choose provider'}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              {language === 'pl' ? 'Zaloguj się, aby uzyskać dostęp do rekrutacji i zarządzania botem.' : 'Sign in to access recruitment and bot management.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                onClick={() => signIn('discord')} 
                className="btn-cinematic" 
                style={{ background: '#5865F2', padding: '1rem', fontSize: '1.1rem', border: 'none', width: '100%' }}
              >
                <img src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6918e57475a843f59f_icon_clyde_blurple_RGB.svg" alt="Discord" style={{ width: '24px', marginRight: '10px', verticalAlign: 'middle', filter: 'brightness(0) invert(1)' }} />
                Discord
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0', color: 'var(--text-muted)' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                <span style={{ fontSize: '0.9rem' }}>{language === 'pl' ? 'LUB' : 'OR'}</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
              </div>

              <button 
                onClick={() => signIn('steam')} 
                className="btn-cinematic" 
                style={{ background: '#171a21', color: '#fff', border: '1px solid #66c0f4', padding: '1rem', fontSize: '1.1rem', width: '100%' }}
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg" alt="Steam" style={{ width: '24px', marginRight: '10px', verticalAlign: 'middle' }} />
                Steam
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="categories animate-fade-in-up delay-300">
        <div className="bento-card" style={{ alignItems: 'center', textAlign: 'center', padding: '3rem 2rem' }}>
          <div className="card-icon" style={{ background: 'rgba(46, 204, 113, 0.05)', border: '1px solid rgba(46, 204, 113, 0.2)' }}><Crown size="42" color="#2ecc71" variant="Bulk" /></div>
          <h3 style={{ fontSize: '1.5rem', color: '#fff', margin: '0 0 1rem 0' }}>{t("feat1Title")}</h3>
          <p style={{ color: '#8ebf9e', margin: 0 }}>{t("feat1Desc")}</p>
        </div>
        <div className="bento-card" style={{ alignItems: 'center', textAlign: 'center', padding: '3rem 2rem' }}>
          <div className="card-icon" style={{ background: 'rgba(46, 204, 113, 0.05)', border: '1px solid rgba(46, 204, 113, 0.2)' }}><ShieldTick size="42" color="#2ecc71" variant="Bulk" /></div>
          <h3 style={{ fontSize: '1.5rem', color: '#fff', margin: '0 0 1rem 0' }}>{t("feat2Title")}</h3>
          <p style={{ color: '#8ebf9e', margin: 0 }}>{t("feat2Desc")}</p>
        </div>
        <div className="bento-card" style={{ alignItems: 'center', textAlign: 'center', padding: '3rem 2rem' }}>
          <div className="card-icon" style={{ background: 'rgba(46, 204, 113, 0.05)', border: '1px solid rgba(46, 204, 113, 0.2)' }}><Radar size="42" color="#2ecc71" variant="Bulk" /></div>
          <h3 style={{ fontSize: '1.5rem', color: '#fff', margin: '0 0 1rem 0' }}>{t("feat3Title")}</h3>
          <p style={{ color: '#8ebf9e', margin: 0 }}>{t("feat3Desc")}</p>
        </div>
      </section>
      
      <footer className="footer animate-fade-in-up delay-300" style={{textAlign: 'center', marginTop: '4rem', padding: '2rem 0', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)'}}>
        <p>&copy; {new Date().getFullYear()} {t("rights")}</p>
      </footer>
    </main>
  );
}
