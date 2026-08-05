"use client";

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Crown, ShieldTick, Radar, ArrowRight } from 'iconsax-react';
import { motion, Variants } from 'framer-motion';

import { useSession, signIn } from 'next-auth/react';
import styles from '@/777_addons/styles/page.module.css';

export default function Home() {
  const { t, language } = useLanguage();
  const { data: session } = useSession();

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
    <main className={`container ${styles.mainContainer}`}>

      <section className="hero">
        <motion.div
          className="hero-content"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="hero-badge">
            <span className={styles.systemStatusDot}></span>
            SYSTEM ONLINE
          </motion.div>

          <motion.h1 variants={itemVariants} className="hero-title">
            {t("heroTitle")}<span className="text-gradient">{t("heroSquad")}</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="hero-subtitle">
            {t("heroSubtitle")}
          </motion.p>

          <motion.div variants={itemVariants} className="hero-actions">
            <Link href="/builder" className={`btn-cinematic primary ${styles.builderBtn}`}>
              {t("builder_projects_title") || "Otwórz Builder 2D & 3D"} <ArrowRight size="20" />
            </Link>
            {!session && (
              <button
                onClick={() => signIn('steam')}
                className={`btn-cinematic secondary ${styles.steamBtn}`}
              >
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/steam.svg" alt="Steam" className={styles.steamIcon} />
                {language === 'pl' ? 'Zaloguj przez Steam' : 'Sign in with Steam'}
              </button>
            )}
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
        <motion.div variants={itemVariants} className={`bento-card col-span-1 ${styles.bentoCardCommon}`}>
          <div className="card-icon">
            <Crown size="36" color="#10b981" variant="Bulk" />
          </div>
          <h3 className={styles.bentoCardTitleSmall}>{t("feat1Title")}</h3>
          <p className={styles.bentoCardDescSmall}>{t("feat1Desc")}</p>
        </motion.div>

        <motion.div variants={itemVariants} className={`bento-card col-span-2 ${styles.bentoCardLarge}`}>
          <div className={`card-icon ${styles.cardIconLarge}`}>
            <ShieldTick size="42" color="#10b981" variant="Bulk" />
          </div>
          <h3 className={styles.bentoCardTitleLarge}>{t("feat2Title")}</h3>
          <p className={styles.bentoCardDescLarge}>{t("feat2Desc")}</p>
        </motion.div>

        <motion.div variants={itemVariants} className={`bento-card col-span-1 ${styles.bentoCardCommon}`}>
          <div className="card-icon">
            <Radar size="36" color="#10b981" variant="Bulk" />
          </div>
          <h3 className={styles.bentoCardTitleSmall}>{t("feat3Title")}</h3>
          <p className={styles.bentoCardDescSmall}>{t("feat3Desc")}</p>
        </motion.div>
      </motion.section>

      <motion.footer
        className={styles.footer}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className={styles.footerLogoContainer}>
          <span className={styles.footerLine}></span>
          <span className={styles.footerLogoText}>777</span>
          <span className={styles.footerLine}></span>
        </div>
        <p className={styles.footerCopyright}>&copy; {new Date().getFullYear()} {t("rights")}</p>
      </motion.footer>
    </main>
  );
}
