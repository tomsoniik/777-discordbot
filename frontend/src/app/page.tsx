"use client";

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function Home() {
  const { t, language, setLanguage } = useLanguage();

  return (
    <main className="container">
      <nav className="navbar animate-fade-in-up">
        <div className="navbar-brand">
          <img src="/img/untlogo.png" alt="Unturned Logo" style={{ height: '40px', verticalAlign: 'middle', filter: 'drop-shadow(0 0 8px rgba(46,204,113,0.6))' }} />
        </div>
        <div className="navbar-nav" style={{ alignItems: 'center' }}>
          <Link href="/" className="nav-link">{t("home")}</Link>
          <Link href="/apply" className="nav-link">{t("recruitment")}</Link>
          <Link href="/about" className="nav-link">{t("about")}</Link>
          <div style={{ marginLeft: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setLanguage("pl")}
              style={{
                background: 'transparent', 
                border: language === "pl" ? '1px solid var(--accent-green)' : '1px solid transparent', 
                color: language === "pl" ? 'var(--accent-green)' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}>PL</button>
            <button 
              onClick={() => setLanguage("en")}
              style={{
                background: 'transparent', 
                border: language === "en" ? '1px solid var(--accent-green)' : '1px solid transparent', 
                color: language === "en" ? 'var(--accent-green)' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}>EN</button>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content animate-fade-in-up delay-100">
          <h1 className="hero-title">{t("heroTitle")}<span className="text-gradient">{t("heroSquad")}</span></h1>
          <p className="hero-subtitle">
            {t("heroSubtitle")}
          </p>
          <div className="hero-actions">
            <Link href="/apply" className="btn btn-pulse">
              {t("startApp")}
            </Link>
            <Link href="/about" className="btn btn-outline" style={{marginLeft: '1rem'}}>
              {t("learnMore")}
            </Link>
          </div>
        </div>
      </section>

      <section className="features categories animate-fade-in-up delay-300">
        <div className="category-card">
          <div className="card-icon">⚔️</div>
          <h3>{t("feat1Title")}</h3>
          <p>{t("feat1Desc")}</p>
        </div>
        <div className="category-card">
          <div className="card-icon">🛡️</div>
          <h3>{t("feat2Title")}</h3>
          <p>{t("feat2Desc")}</p>
        </div>
        <div className="category-card">
          <div className="card-icon">🎯</div>
          <h3>{t("feat3Title")}</h3>
          <p>{t("feat3Desc")}</p>
        </div>
      </section>
      
      <footer className="footer animate-fade-in-up delay-300" style={{textAlign: 'center', marginTop: '4rem', padding: '2rem 0', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)'}}>
        <p>&copy; {new Date().getFullYear()} {t("rights")}</p>
      </footer>
    </main>
  );
}
