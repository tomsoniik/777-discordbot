"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useSession, signIn, signOut } from 'next-auth/react';
import { ArrowDown2 } from 'iconsax-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '@/777_addons/styles/Navbar.module.css';

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
    <header className={`container ${styles.header}`}>
      <motion.nav 
        className="navbar"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="navbar-brand">
          <Link href="/" className={styles.brandLink}>
            <img src="/777_addons/images/untlogo.png" alt="777 Clan Logo" className={styles.brandLogo} />
            <span className={styles.brandText}>777</span>
          </Link>
        </div>
        <div className={styles.centerContainer}>
          <div className={styles.builderLinkContainer}>
            <Link href="/builder" className="nav-link">Builder</Link>
            <span className={styles.alphaBadge}>ALPHA</span>
          </div>
        </div>

        <div className={`navbar-nav ${styles.navContainer}`}>
          {!session && (
            <button
              onClick={() => signIn("steam")}
              className={`btn-cinematic secondary ${styles.signInSteam}`}
            >
              <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/steam.svg" alt="Steam" className={styles.steamIcon} />
              {t("signInSteam")}
            </button>
          )}

          {session && (
            <div className={styles.userDropdownContainer} ref={menuRef}>
              <div 
                className={`${styles.userProfileTrigger} ${isMenuOpen ? styles.open : styles.closed}`}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <img 
                  src={session.user?.image || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                  onError={(e) => { e.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                  alt="Avatar" 
                  className={styles.userAvatar}
                />
                <span className={styles.userName}>{session.user?.name}</span>
                <ArrowDown2 size="16" color="#aaa" style={{ transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} />
              </div>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={styles.dropdownMenu}
                  >
                    <div className={styles.dropdownHeader}>
                      <p className={styles.dropdownHeaderLabel}>{t("signedInAs")}</p>
                      <p className={styles.dropdownHeaderEmail}>{session.user?.email || session.user?.name}</p>
                    </div>

                    { (session.user as any)?.role === 'ADMIN' && (
                      <Link 
                        href="/admin" 
                        onClick={() => setIsMenuOpen(false)}
                        className={styles.adminLink}
                      >
                        {t("adminPanel")}
                      </Link>
                    )}

                    <div className={styles.divider}></div>
                    
                    <button 
                      onClick={() => signOut()}
                      className={styles.signOutBtn}
                    >
                      {t("signOut")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          
          <div className={styles.langSwitchContainer}>
            <button 
              onClick={toggleLanguage}
              title={language === "pl" ? "Switch to English" : language === "en" ? "Переключить на русский" : "Zmień na Polski"}
              className={styles.langBtn}
            >
              <img 
                src={language === "pl" ? "https://flagcdn.com/pl.svg" : language === "en" ? "https://flagcdn.com/gb.svg" : "https://flagcdn.com/ru.svg"} 
                alt={language === "pl" ? "Polski" : language === "en" ? "English" : "Русский"} 
                className={styles.langFlag} 
              />
            </button>
          </div>
        </div>
      </motion.nav>
    </header>
  );
}
