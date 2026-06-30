"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

interface Song {
  title: string;
  url: string;
}

interface MusicStatus {
  playing: boolean;
  songs: Song[];
  volume: number;
  loop: boolean;
  channelId?: string;
  error?: string;
}

export default function MusicPage() {
  const { t, language } = useLanguage();
  const [status, setStatus] = useState<MusicStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStatus = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/music/status`);
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStatus(data);
      setError("");
    } catch (err: any) {
      console.error(err);
      setError(language === 'pl' ? "Nie udało się połączyć z serwerem muzycznym" : "Failed to connect to music server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [language]);

  const controlMusic = async (action: string, value?: any) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/music/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, value }),
      });
      fetchStatus();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="container animate-fade-in-up" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="bento-card" style={{ maxWidth: '700px', width: '100%', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--accent-green)', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', fontSize: '2.5rem', fontWeight: 800 }}>
          <span>🎶</span> {language === 'pl' ? 'Panel Muzyczny' : 'Music Panel'}
        </h1>
        
        {loading ? (
          <div style={{ padding: '3rem 0', color: 'var(--text-muted)' }}>
            <div className="btn-pulse" style={{ width: '40px', height: '40px', background: 'var(--accent-green)', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
            <p>{language === 'pl' ? 'Ładowanie stanu odtwarzacza...' : 'Loading player state...'}</p>
          </div>
        ) : error ? (
          <div style={{ background: 'rgba(255,60,60,0.1)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,60,60,0.3)', color: '#ff6b6b' }}>
            <p style={{ fontSize: '1.1rem', margin: 0 }}>{error}</p>
          </div>
        ) : !status || status.songs.length === 0 ? (
          <div style={{ padding: '3rem', background: 'rgba(0,0,0,0.3)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>
              {language === 'pl' ? 'Kolejka jest pusta. Użyj komendy /play na Discordzie, aby coś zagrać!' : 'Queue is empty. Use /play on Discord to play something!'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Now Playing - Cinematic Hero style */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.15) 0%, rgba(10, 31, 18, 0.8) 100%)', 
              padding: '2rem', 
              borderRadius: '20px',
              border: '1px solid rgba(46, 204, 113, 0.4)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4), inset 0 0 20px rgba(46, 204, 113, 0.05)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--accent-green)', filter: 'blur(80px)', opacity: 0.15 }}></div>
              
              <p style={{ fontSize: '0.85rem', color: 'var(--accent-green)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 1rem 0' }}>
                {language === 'pl' ? 'Teraz Odtwarzane' : 'Now Playing'}
              </p>
              <h2 className="text-gradient" style={{ fontSize: '1.8rem', margin: '0 0 1.5rem 0', lineHeight: 1.3, wordBreak: 'break-word' }}>
                {status.songs[0].title}
              </h2>
              <a href={status.songs[0].url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem', borderRadius: '50px' }}>
                {language === 'pl' ? 'Otwórz na SoundCloud' : 'Open on SoundCloud'}
              </a>
            </div>

            {/* Main Controls */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '16px' }}>
              <button onClick={() => controlMusic(status.playing ? 'pause' : 'resume')} className="btn" style={{ minWidth: '120px', borderRadius: '12px' }}>
                {status.playing ? '⏸ Pause' : '▶️ Play'}
              </button>
              <button onClick={() => controlMusic('skip')} className="btn btn-outline" style={{ minWidth: '100px', borderRadius: '12px' }}>
                ⏭ Skip
              </button>
              <button onClick={() => controlMusic('stop')} className="btn btn-outline" style={{ minWidth: '100px', borderRadius: '12px', borderColor: 'rgba(255,60,60,0.5)', color: '#ff6b6b' }}>
                ⏹ Stop
              </button>
              <button onClick={() => controlMusic('loop')} className={status.loop ? "btn" : "btn btn-outline"} style={{ minWidth: '120px', borderRadius: '12px' }}>
                🔄 Loop: {status.loop ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Volume Control */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1.2rem', borderRadius: '16px' }}>
              <button onClick={() => controlMusic('volume', status.volume - 10)} className="btn btn-outline" style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}>🔉 -10%</button>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.2rem' }}>Volume</span>
                <span style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--accent-green)' }}>{status.volume}%</span>
              </div>
              <button onClick={() => controlMusic('volume', status.volume + 10)} className="btn btn-outline" style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}>🔊 +10%</button>
            </div>

            {/* Queue List */}
            {status.songs.length > 1 && (
              <div style={{ marginTop: '0.5rem', textAlign: 'left', background: 'rgba(10, 31, 18, 0.4)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📋</span> {language === 'pl' ? 'Następne w kolejce' : 'Next in Queue'}
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {status.songs.slice(1).map((s, i) => (
                    <li key={i} style={{ 
                      padding: '0.8rem 1rem', 
                      background: 'rgba(255,255,255,0.02)', 
                      borderRadius: '8px', 
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.8rem',
                      transition: 'background 0.2s',
                      cursor: 'default'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    >
                      <span style={{ color: 'var(--accent-green)', fontWeight: 'bold', minWidth: '24px' }}>{i + 1}.</span> 
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
