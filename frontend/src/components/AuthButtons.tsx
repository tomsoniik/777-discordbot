"use client";
import { signIn, signOut } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";

export function DiscordLoginButton() {
  const { t } = useLanguage();
  return (
    <button 
      onClick={(e) => { e.preventDefault(); signIn("discord"); }} 
      className="btn" 
      style={{ width: '100%', marginBottom: '1rem', backgroundColor: '#5865F2', color: 'white' }}>
      {t("connectDiscord")}
    </button>
  );
}

export function SteamLoginButton() {
  const { t } = useLanguage();
  return (
    <button 
      onClick={(e) => { e.preventDefault(); signIn("steam"); }} 
      className="btn" 
      style={{ width: '100%', backgroundColor: '#171a21', color: 'white' }}>
      {t("connectSteam")}
    </button>
  );
}

export function LogoutButton() {
  const { t } = useLanguage();
  return (
    <button onClick={() => signOut()} className="btn btn-outline" style={{ width: '100%', marginTop: '1rem' }}>
      {t("logOut")}
    </button>
  );
}
