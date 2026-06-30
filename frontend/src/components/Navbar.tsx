"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
  const pathname = usePathname();
  const { t, language, setLanguage } = useLanguage();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const toggleLanguage = () => {
    setLanguage(language === "pl" ? "en" : "pl");
  };

  return (
    <header className="container" style={{ paddingBottom: 0 }}>
      <nav className="navbar animate-fade-in-up">
        <div className="navbar-brand">
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none' }}>
            <img src="/img/untlogo.png" alt="777 Clan Logo" style={{ height: '40px', filter: 'drop-shadow(0 0 8px rgba(46,204,113,0.6))' }} />
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-green)', letterSpacing: '1px' }}>777</span>
          </Link>
        </div>
        <div className="navbar-nav" style={{ alignItems: 'center' }}>
          <Link href="/" className="nav-link">{t("home")}</Link>
          <Link href="/apply" className="nav-link">{t("recruitment")}</Link>
          <Link href="/about" className="nav-link">{t("about")}</Link>
          <Link href="/music" className="nav-link" style={{ color: 'var(--accent-green)' }}>🎶 Playlist</Link>
          <div style={{ marginLeft: '1rem', display: 'flex', alignItems: 'center' }}>
            <button 
              onClick={toggleLanguage}
              title={language === "pl" ? "Switch to English" : "Zmień na Polski"}
              style={{
                background: 'rgba(46, 204, 113, 0.1)', 
                border: '1px solid var(--accent-green)', 
                color: 'var(--text-main)',
                cursor: 'pointer',
                padding: '0.4rem 0.6rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(46, 204, 113, 0.2)'
              }}
            >
              <img 
                src={language === "pl" ? "https://flagcdn.com/pl.svg" : "https://flagcdn.com/gb.svg"} 
                alt={language === "pl" ? "Polski" : "English"} 
                width="24" 
                height="18"
                style={{ borderRadius: '2px', display: 'block' }} 
              />
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
