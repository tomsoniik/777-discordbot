"use client";

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Crown, ShieldTick, Radar, ArrowRight } from 'iconsax-react';
import { motion, Variants } from 'framer-motion';

export default function Home() {
  const { t } = useLanguage();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 20 }
    }
  };

  return (
    <main className="container" style={{ paddingTop: 0 }}>

      <section className="hero">
        <motion.div 
          className="hero-content"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="hero-badge">
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></span>
            SYSTEM ONLINE V2.0
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="hero-title">
            {t("heroTitle")}<span className="text-gradient">{t("heroSquad")}</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="hero-subtitle">
            {t("heroSubtitle")}
          </motion.p>
          
          <motion.div variants={itemVariants} className="hero-actions">
            <Link href="/builder" className="btn-cinematic primary" style={{ fontSize: '1.1rem', padding: '14px 28px' }}>
              {t("builder_projects_title") || "Otwórz Builder 2D & 3D"} <ArrowRight size="20" />
            </Link>
            <Link href="/about" className="btn-cinematic secondary">
              {t("about") || "O Nas"}
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <motion.section 
        className="bento-grid categories"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="bento-card col-span-1" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div className="card-icon">
            <Crown size="36" color="#10b981" variant="Bulk" />
          </div>
          <h3 style={{ fontSize: '1.4rem', color: '#fff', margin: '0 0 0.75rem 0', fontWeight: '700' }}>{t("feat1Title")}</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>{t("feat1Desc")}</p>
        </motion.div>

        <motion.div variants={itemVariants} className="bento-card col-span-2" style={{ alignItems: 'center', textAlign: 'center', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(10, 20, 15, 0.8) 100%)' }}>
          <div className="card-icon" style={{ width: '84px', height: '84px' }}>
            <ShieldTick size="42" color="#10b981" variant="Bulk" />
          </div>
          <h3 style={{ fontSize: '1.75rem', color: '#fff', margin: '0 0 1rem 0', fontWeight: '800' }}>{t("feat2Title")}</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0, maxWidth: '80%', fontSize: '1.05rem' }}>{t("feat2Desc")}</p>
        </motion.div>

        <motion.div variants={itemVariants} className="bento-card col-span-1" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div className="card-icon">
            <Radar size="36" color="#10b981" variant="Bulk" />
          </div>
          <h3 style={{ fontSize: '1.4rem', color: '#fff', margin: '0 0 0.75rem 0', fontWeight: '700' }}>{t("feat3Title")}</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>{t("feat3Desc")}</p>
        </motion.div>
      </motion.section>
      
      <motion.footer 
        className="footer" 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        style={{textAlign: 'center', marginTop: '6rem', padding: '3rem 0', borderTop: '1px solid var(--glass-border)', color: 'var(--text-muted)'}}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.1)' }}></span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '-0.5px' }}>777</span>
          <span style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.1)' }}></span>
        </div>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>&copy; {new Date().getFullYear()} {t("rights")}</p>
      </motion.footer>
    </main>
  );
}
