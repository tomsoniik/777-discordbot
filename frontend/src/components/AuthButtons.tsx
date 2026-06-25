"use client";
import { signIn, signOut } from "next-auth/react";

export function DiscordLoginButton() {
  return (
    <button 
      onClick={(e) => { e.preventDefault(); signIn("discord"); }} 
      className="btn" 
      style={{ width: '100%', marginBottom: '1rem', backgroundColor: '#5865F2', color: 'white' }}>
      Connect with Discord
    </button>
  );
}

export function SteamLoginButton() {
  return (
    <button 
      onClick={(e) => { e.preventDefault(); signIn("steam"); }} 
      className="btn" 
      style={{ width: '100%', backgroundColor: '#171a21', color: 'white' }}>
      Connect with Steam
    </button>
  );
}

export function LogoutButton() {
  return (
    <button onClick={() => signOut()} className="btn btn-outline" style={{ width: '100%', marginTop: '1rem' }}>
      Log Out
    </button>
  );
}
