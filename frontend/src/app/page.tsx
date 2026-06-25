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
          <div className="card-icon"><Crown size="48" color="var(--accent-green)" variant="TwoTone" /></div>
          <h3>{t("feat1Title")}</h3>
          <p>{t("feat1Desc")}</p>
        </div>
        <div className="category-card">
          <div className="card-icon"><ShieldTick size="48" color="var(--accent-green)" variant="TwoTone" /></div>
          <h3>{t("feat2Title")}</h3>
          <p>{t("feat2Desc")}</p>
        </div>
        <div className="category-card">
          <div className="card-icon"><Radar size="48" color="var(--accent-green)" variant="TwoTone" /></div>
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
