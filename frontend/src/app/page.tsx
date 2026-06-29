"use client";

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Crown, ShieldTick, Radar } from 'iconsax-react';

export default function Home() {
  const { t } = useLanguage();

  return (
    <main className="container" style={{ paddingTop: 0 }}>

      <section className="hero">
        <div className="hero-content animate-fade-in-up delay-100">
          <h1 className="hero-title">{t("heroTitle")}<span className="text-gradient">{t("heroSquad")}</span></h1>
          <p className="hero-subtitle">
            {t("heroSubtitle")}
          </p>
          <div className="hero-actions">
            <Link href="/apply" className="btn-cinematic" style={{ textDecoration: 'none', padding: '1rem 2.5rem', fontSize: '1rem' }}>
              {t("startApp")}
            </Link>
            <Link href="/about" className="btn-cinematic" style={{ marginLeft: '1rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'none', padding: '1rem 2.5rem', fontSize: '1rem', textDecoration: 'none' }}>
              {t("learnMore")}
            </Link>
          </div>
        </div>
      </section>

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
