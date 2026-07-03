"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useSession, signOut } from 'next-auth/react';
import { ArrowDown2 } from 'iconsax-react';

export default function Navbar() {
  const pathname = usePathname();
  const { t, language, setLanguage } = useLanguage();
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const toggleLanguage = () => {
    setLanguage(language === "pl" ? "en" : "pl");
  };

  // Zamykanie menu po kliknieciu poza nim
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="container" style={{ paddingBottom: 0, position: 'relative', zIndex: 999999 }}>
      <nav className="navbar animate-fade-in-up">
        <div className="navbar-brand">
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none' }}>
            <img src="/img/untlogo.png" alt="777 Clan Logo" style={{ height: '40px', filter: 'drop-shadow(0 0 8px rgba(46,204,113,0.6))' }} />
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-green)', letterSpacing: '1px' }}>777</span>
          </Link>
        </div>
        <div className="navbar-nav" style={{ alignItems: 'center', position: 'relative' }}>
          <Link href="/about" className="nav-link">{t("about")}</Link>
          {session && (
            <Link href="/apply" className="nav-link">{t("recruitment")}</Link>
          )}

          {session && (
            <div className="user-dropdown-container" ref={menuRef} style={{ position: 'relative', marginLeft: '1rem' }}>
              <div 
                className="user-profile-trigger" 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '6px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: '0.2s ease'
                }}
              >
                <img 
                  src={session.user?.image || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                  onError={(e) => { e.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                  alt="Avatar" 
                  style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <span style={{ color: '#fff', fontWeight: 500 }}>{session.user?.name}</span>
                <ArrowDown2 size="16" color="#aaa" />
              </div>

              {isMenuOpen && (
                <div 
                  className="dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    width: '220px',
                    background: 'rgba(15, 15, 20, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    zIndex: 100,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                  }}
                >
                  <Link 
                    href="/music" 
                    onClick={() => setIsMenuOpen(false)}
                    style={{ padding: '10px', color: '#fff', textDecoration: 'none', borderRadius: '8px', display: 'block', transition: '0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    Playlist
                  </Link>

                  { (session.user as any)?.role === 'ADMIN' && (
                    <>

                      <Link 
                        href="/admin" 
                        onClick={() => setIsMenuOpen(false)}
                        style={{ padding: '10px', color: '#ff4757', textDecoration: 'none', borderRadius: '8px', display: 'block', transition: '0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,71,87,0.1)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        Admin Panel
                      </Link>
                    </>
                  )}

                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }}></div>
                  
                  <button 
                    onClick={() => signOut()}
                    style={{ padding: '10px', color: '#ff6b6b', background: 'transparent', border: 'none', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', transition: '0.2s', width: '100%', fontSize: '1rem' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,107,107,0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    Wyloguj się
                  </button>
                </div>
              )}
            </div>
          )}
          
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
