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
          <Link href="/">
            <img src="/img/untlogo.png" alt="Unturned Logo" style={{ height: '40px', verticalAlign: 'middle', filter: 'drop-shadow(0 0 8px rgba(46,204,113,0.6))' }} />
          </Link>
        </div>
        <div className="navbar-nav" style={{ alignItems: 'center' }}>
          <Link href="/" className="nav-link">{t("home")}</Link>
          <Link href="/apply" className="nav-link">{t("recruitment")}</Link>
          <Link href="/about" className="nav-link">{t("about")}</Link>
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
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(46, 204, 113, 0.2)'
              }}
            >
              {language === "pl" ? "🇵🇱" : "🇬🇧"}
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
