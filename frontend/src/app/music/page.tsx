"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function MusicGroupsPage() {
  const { language } = useLanguage();
  const { data: session, status } = useSession();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // create form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGuildId, setNewGuildId] = useState("");

  const fetchGroups = async () => {
    if (status !== 'authenticated') return;
    setLoading(true);
    try {
      const res = await fetch('/api/music/groups');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGroups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [status]);

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newGuildId) return;
    try {
      const res = await fetch('/api/music/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, guildId: newGuildId })
      });
      if (res.ok) {
        setShowCreate(false);
        setNewName("");
        setNewGuildId("");
        fetchGroups();
      } else {
        const d = await res.json();
        alert(d.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (status === 'loading') return <div className="container" style={{ padding: '5rem', textAlign: 'center' }}>Ładowanie...</div>;
  if (status === 'unauthenticated') return (
    <div className="container" style={{ padding: '5rem', textAlign: 'center' }}>
      <div className="bento-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h2>🔒 Zaloguj się</h2>
        <p>Musisz być zalogowany, aby zarządzać playlistami serwerów.</p>
      </div>
    </div>
  );

  return (
    <main className="container animate-fade-in-up" style={{ minHeight: '80vh', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '2.5rem', fontWeight: 800 }}>
            <span>🎧</span> {language === 'pl' ? 'Twoje Serwery' : 'Your Servers'}
          </h1>
          <button onClick={() => setShowCreate(!showCreate)} className="btn">
            {showCreate ? 'Anuluj' : '+ Dodaj Serwer'}
          </button>
        </div>

        {showCreate && (
          <div className="bento-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Zarejestruj Nowy Serwer (Grupe)</h3>
            <form onSubmit={createGroup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="text" 
                className="glass-input" 
                placeholder="Nazwa serwera / grupy (np. Moja Ekipa)" 
                value={newName} 
                onChange={e => setNewName(e.target.value)} 
                required 
              />
              <input 
                type="text" 
                className="glass-input" 
                placeholder="ID Serwera Discord (Guild ID)" 
                value={newGuildId} 
                onChange={e => setNewGuildId(e.target.value)} 
                required 
              />
              <button type="submit" className="btn btn-outline" style={{ alignSelf: 'flex-start' }}>Zarejestruj</button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="btn-pulse" style={{ width: '40px', height: '40px', background: 'var(--accent-green)', borderRadius: '50%', margin: '3rem auto' }}></div>
        ) : groups.length === 0 ? (
          <div className="bento-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>
              Nie masz dostępu do żadnego serwera muzycznego. Dodaj nowy lub poproś kogoś o dodanie!
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {groups.map(g => (
              <div key={g.id} className="bento-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem' }}>{g.name}</h3>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
                    Właściciel: {g.ownerId === (session?.user as any)?.id ? 'Ty' : g.owner?.name} | Guild ID: {g.guildId}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link href={`/music/${g.guildId}`} className="btn">🎵 Odtwarzacz</Link>
                  {g.ownerId === (session?.user as any)?.id && (
                    <Link href={`/music/${g.guildId}/manage`} className="btn btn-outline">⚙️ Zarządzaj</Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
