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
    <main className="container animate-fade-in-up" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="admin-card" style={{ maxWidth: '600px', width: '100%', textAlign: 'center', padding: '2rem' }}>
        <h1 style={{ color: 'var(--accent-green)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '2rem' }}>🎶</span> {language === 'pl' ? 'Panel Muzyczny' : 'Music Panel'}
        </h1>
        
        {loading ? (
          <p>{language === 'pl' ? 'Ładowanie stanu odtwarzacza...' : 'Loading player state...'}</p>
        ) : error ? (
          <div style={{ background: 'rgba(255,0,0,0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,0,0,0.3)', color: '#ff6b6b' }}>
            <p>{error}</p>
          </div>
        ) : !status || status.songs.length === 0 ? (
          <div style={{ padding: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
            <p style={{ color: 'var(--text-muted)' }}>
              {language === 'pl' ? 'Kolejka jest pusta. Użyj komendy /play na Discordzie, aby coś zagrać!' : 'Queue is empty. Use /play on Discord to play something!'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Now Playing */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%)', 
              padding: '1.5rem', 
              borderRadius: '12px',
              border: '1px solid rgba(46, 204, 113, 0.3)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
            }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--accent-green)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                {language === 'pl' ? 'Teraz Odtwarzane' : 'Now Playing'}
              </p>
              <h2 style={{ fontSize: '1.4rem', margin: '0 0 1rem 0' }}>{status.songs[0].title}</h2>
              <a href={status.songs[0].url} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'underline', fontSize: '0.9rem' }}>
                {language === 'pl' ? 'Otwórz na SoundCloud' : 'Open on SoundCloud'}
              </a>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
              <button onClick={() => controlMusic(status.playing ? 'pause' : 'resume')} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                {status.playing ? '⏸ Pause' : '▶️ Play'}
              </button>
              <button onClick={() => controlMusic('skip')} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                ⏭ Skip
              </button>
              <button onClick={() => controlMusic('stop')} className="btn-secondary" style={{ padding: '0.5rem 1rem', background: 'rgba(255, 60, 60, 0.2)', borderColor: 'rgba(255,60,60,0.5)' }}>
                ⏹ Stop
              </button>
              <button onClick={() => controlMusic('loop')} className={status.loop ? "btn-primary" : "btn-secondary"} style={{ padding: '0.5rem 1rem' }}>
                🔄 Loop: {status.loop ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Volume */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
              <button onClick={() => controlMusic('volume', status.volume - 10)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>🔉 -10%</button>
              <span style={{ fontWeight: 'bold', fontSize: '1.2rem', minWidth: '60px', textAlign: 'center' }}>{status.volume}%</span>
              <button onClick={() => controlMusic('volume', status.volume + 10)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>🔊 +10%</button>
            </div>

            {/* Queue List */}
            {status.songs.length > 1 && (
              <div style={{ marginTop: '1rem', textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.8rem', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                  {language === 'pl' ? 'Następne w kolejce' : 'Next in Queue'}
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {status.songs.slice(1).map((s, i) => (
                    <li key={i} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--accent-green)', marginRight: '0.5rem' }}>{i + 1}.</span> {s.title}
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
