"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function GroupManagePage({ params }: { params: { guildId: string } }) {
  const { language } = useLanguage();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newMemberType, setNewMemberType] = useState("discord");
  const [newMemberId, setNewMemberId] = useState("");

  const fetchGroup = async () => {
    try {
      // Find the group by matching guildId from the user's groups
      const res = await fetch('/api/music/groups');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const target = data.find((g: any) => g.guildId === params.guildId);
      if (!target) throw new Error("Nie znaleziono grupy lub brak dostępu");

      // Fetch specific group details
      const detailRes = await fetch(`/api/music/groups/${target.id}/members`);
      const detailData = await detailRes.json();
      if (!detailRes.ok) throw new Error(detailData.error);
      
      setGroup(detailData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') fetchGroup();
  }, [status, params.guildId]);

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberId) return;
    try {
      const res = await fetch(`/api/music/groups/${group.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newMemberType, value: newMemberId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewMemberId("");
      fetchGroup();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm("Na pewno usunąć tego członka?")) return;
    try {
      const res = await fetch(`/api/music/groups/${group.id}/members/${memberId}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      fetchGroup();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (status === 'loading' || loading) return <div className="container" style={{ padding: '5rem', textAlign: 'center' }}>Ładowanie...</div>;
  if (status === 'unauthenticated') return <div className="container" style={{ padding: '5rem', textAlign: 'center' }}>Zaloguj się!</div>;
  if (error) return <div className="container" style={{ padding: '5rem', textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <main className="container animate-fade-in-up" style={{ minHeight: '80vh', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => router.push('/music')} className="btn btn-outline">⬅ Wróć</button>
          <h1 style={{ color: 'var(--accent-green)', margin: 0, fontSize: '2rem', fontWeight: 800 }}>
            Zarządzaj: {group.name}
          </h1>
        </div>

        <div className="bento-card" style={{ marginBottom: '2rem', padding: '2rem' }}>
          <h3>Dodaj Użytkownika</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Dodaj osobę podając jej Discord ID lub Steam ID. Zyska ona dostęp do sterowania muzyką.
          </p>
          <form onSubmit={addMember} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <select 
              className="glass-input" 
              value={newMemberType} 
              onChange={e => setNewMemberType(e.target.value)}
              style={{ minWidth: '150px' }}
            >
              <option value="discord" style={{ background: '#111' }}>Discord ID</option>
              <option value="steam" style={{ background: '#111' }}>Steam ID</option>
            </select>
            <input 
              type="text" 
              className="glass-input" 
              placeholder="Wprowadź ID..." 
              value={newMemberId} 
              onChange={e => setNewMemberId(e.target.value)} 
              required 
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn">Dodaj</button>
          </form>
        </div>

        <div className="bento-card" style={{ padding: '2rem' }}>
          <h3>Członkowie Grupy</h3>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {group.members.length === 0 ? (
              <li style={{ color: 'var(--text-muted)' }}>Brak dodanych członków. (Tylko Ty masz dostęp)</li>
            ) : (
              group.members.map((m: any) => (
                <li key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  <div>
                    {m.discordId && <div><span style={{ color: 'var(--text-muted)' }}>Discord ID:</span> {m.discordId}</div>}
                    {m.steamId && <div><span style={{ color: 'var(--text-muted)' }}>Steam ID:</span> {m.steamId}</div>}
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-green)' }}>Dodano: {new Date(m.addedAt).toLocaleDateString()}</div>
                  </div>
                  <button onClick={() => removeMember(m.id)} className="btn btn-outline" style={{ borderColor: 'rgba(255,60,60,0.5)', color: '#ff6b6b' }}>
                    Usuń
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

      </div>
    </main>
  );
}
