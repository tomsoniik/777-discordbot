"use client";
import { signIn, signOut } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";

export function DiscordLoginButton() {
  const { t } = useLanguage();
  return (
    <button 
      onClick={(e) => { e.preventDefault(); signIn("discord"); }} 
      className="btn-cinematic" 
      style={{ width: '100%', marginBottom: '1rem', background: 'rgba(88, 101, 242, 0.15)', border: '1px solid rgba(88, 101, 242, 0.5)', color: '#fff', boxShadow: 'none', padding: '1rem' }}>
      {t("connectDiscord")}
    </button>
  );
}

export function SteamLoginButton() {
  const { t } = useLanguage();
  return (
    <button 
      onClick={(e) => { e.preventDefault(); signIn("steam"); }} 
      className="btn-cinematic" 
      style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff', boxShadow: 'none', padding: '1rem' }}>
      {t("connectSteam")}
    </button>
  );
}

export function LogoutButton() {
  const { t } = useLanguage();
  return (
    <button onClick={() => signOut()} className="btn-cinematic" style={{ width: '100%', marginTop: '1rem', background: 'rgba(255,0,0,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,0,0,0.3)', boxShadow: 'none', padding: '1rem' }}>
      {t("logOut")}
    </button>
  );
}
