"use client";

import { useLanguage } from "@/context/LanguageContext";
import { DiscordLoginButton, SteamLoginButton, LogoutButton } from "@/components/AuthButtons";
import ApplyForm from "./ApplyForm";

interface Props {
  isLoggedIn: boolean;
  userName?: string | null;
}

export default function ApplyPageContent({ isLoggedIn, userName }: Props) {
  const { t } = useLanguage();

  return (
    <div className="bento-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem' }}>
      <h1 style={{ textAlign: 'center', color: '#2ecc71', marginTop: 0, fontSize: '2rem', fontWeight: 800 }}>{t("applyTitle")}</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
        
        <div style={{ padding: '2rem', border: '1px dashed rgba(46, 204, 113, 0.3)', borderRadius: '16px', textAlign: 'center', background: 'rgba(0,0,0,0.2)' }}>
          {isLoggedIn ? (
            <>
              <p style={{ marginBottom: '1rem', color: 'var(--accent-green)', fontWeight: 'bold' }}>
                {t("authenticatedAs")}{userName || "User"}
              </p>
              <LogoutButton />
            </>
          ) : (
            <>
              <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>{t("step1")}</p>
              <DiscordLoginButton />
              <SteamLoginButton />
            </>
          )}
        </div>

        <div style={{ opacity: isLoggedIn ? 1 : 0.5, pointerEvents: isLoggedIn ? 'auto' : 'none' }}>
          {!isLoggedIn ? (
             <p style={{ color: 'var(--accent-green)', fontSize: '0.9rem', textAlign: 'center', fontWeight: 'bold', marginTop: '1.5rem' }}>
                {t("logInFirst")}
             </p>
          ) : (
             <ApplyForm />
          )}
        </div>

      </div>
    </div>
  );
}
