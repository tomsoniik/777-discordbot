"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useSession, signIn, signOut } from 'next-auth/react';
import { ArrowDown2 } from 'iconsax-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    setLanguage(language === "pl" ? "en" : language === "en" ? "ru" : "pl");
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
      <motion.nav 
        className="navbar"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="navbar-brand">
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none' }}>
            <img src="/img/untlogo.png" alt="777 Clan Logo" style={{ height: '40px', filter: 'drop-shadow(0 0 12px rgba(16,185,129,0.5))' }} />
            <span style={{ fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(to right, #fff, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>777</span>
          </Link>
        </div>
        <div className="navbar-nav" style={{ alignItems: 'center', position: 'relative' }}>
          <Link href="/builder" className="nav-link">Builder</Link>

          {!session && (
            <button
              onClick={() => signIn("steam")}
              className="btn-cinematic secondary"
              style={{ marginLeft: '1rem', padding: '6px 14px', fontSize: '0.85rem', background: 'rgba(0, 0, 0, 0.4)', borderColor: 'rgba(255,255,255,0.2)', display: 'inline-flex', alignItems: 'center' }}
            >
              <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/steam.svg" alt="Steam" style={{ width: '16px', filter: 'invert(1)', marginRight: '6px' }} />
              {t("signInSteam")}
            </button>
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
                  padding: '6px 16px 6px 6px',
                  background: isMenuOpen ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                  borderRadius: '999px',
                  border: `1px solid ${isMenuOpen ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                  transition: 'all 0.3s ease',
                  boxShadow: isMenuOpen ? '0 0 15px rgba(16, 185, 129, 0.15)' : 'none'
                }}
              >
                <img 
                  src={session.user?.image || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                  onError={(e) => { e.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                  alt="Avatar" 
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }}
                />
                <span style={{ color: '#fff', fontWeight: 500, fontSize: '0.95rem' }}>{session.user?.name}</span>
                <ArrowDown2 size="16" color="#aaa" style={{ transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} />
              </div>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="dropdown-menu"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 15px)',
                      right: 0,
                      width: '240px',
                      background: 'rgba(5, 15, 10, 0.95)',
                      backdropFilter: 'blur(24px)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '16px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      zIndex: 100,
                      boxShadow: '0 20px 40px -10px rgba(0,0,0,0.8), 0 0 20px rgba(16, 185, 129, 0.05)'
                    }}
                  >
                    <div style={{ padding: '8px 12px', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t("signedInAs")}</p>
                      <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.user?.email || session.user?.name}</p>
                    </div>

                    { (session.user as any)?.role === 'ADMIN' && (
                      <Link 
                        href="/admin" 
                        onClick={() => setIsMenuOpen(false)}
                        style={{ padding: '10px 12px', color: '#10b981', textDecoration: 'none', borderRadius: '10px', display: 'block', transition: '0.2s', fontSize: '0.95rem', fontWeight: 500 }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {t("adminPanel")}
                      </Link>
                    )}

                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '8px 0' }}></div>
                    
                    <button 
                      onClick={() => signOut()}
                      style={{ padding: '10px 12px', color: '#ef4444', background: 'transparent', border: 'none', textAlign: 'left', borderRadius: '10px', cursor: 'pointer', transition: '0.2s', width: '100%', fontSize: '0.95rem', fontWeight: 500 }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {t("signOut")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          
          <div style={{ marginLeft: '1.5rem', display: 'flex', alignItems: 'center' }}>
            <button 
              onClick={toggleLanguage}
              title={language === "pl" ? "Switch to English" : language === "en" ? "Переключить на русский" : "Zmień na Polski"}
              style={{
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                width: '40px',
                height: '40px'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)' }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)' }}
            >
              <img 
                src={language === "pl" ? "https://flagcdn.com/pl.svg" : language === "en" ? "https://flagcdn.com/gb.svg" : "https://flagcdn.com/ru.svg"} 
                alt={language === "pl" ? "Polski" : language === "en" ? "English" : "Русский"} 
                style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} 
              />
            </button>
          </div>
        </div>
      </motion.nav>
    </header>
  );
}
