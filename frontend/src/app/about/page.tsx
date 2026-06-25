"use client";

import { useLanguage } from '@/context/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <main className="container" style={{ paddingTop: 0 }}>
      <div className="animate-fade-in-up" style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'rgba(10, 31, 18, 0.6)', backdropFilter: 'blur(10px)', padding: '4rem 3rem', borderRadius: '16px', border: '1px solid rgba(46, 204, 113, 0.2)', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
        <h1 style={{ color: 'var(--accent-green)', marginBottom: '2rem', fontSize: '3rem', letterSpacing: '1px' }}>
          {t("about")}
        </h1>
        <p style={{ fontSize: '1.3rem', color: 'var(--text-main)', lineHeight: '1.8', margin: '0 auto', maxWidth: '650px' }}>
          {t("aboutStory")}
        </p>
      </div>
    </main>
  );
}
