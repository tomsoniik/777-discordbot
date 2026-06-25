import Link from 'next/link';

export default function ApplyPage() {
  return (
    <main className="container">
      <nav className="navbar">
        <Link href="/" className="navbar-brand">TICKET SYSTEM</Link>
        <div className="navbar-nav">
          <Link href="/">Strona Główna</Link>
          <Link href="/apply">Rekrutacja</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <h1 style={{ textAlign: 'center', color: 'var(--accent-green)', marginTop: 0 }}>Formularz Rekrutacyjny</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          
          <div style={{ padding: '1.5rem', border: '1px dashed var(--accent-green)', borderRadius: '4px', textAlign: 'center' }}>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Krok 1: Wymagane logowanie do identyfikacji (Discord) oraz weryfikacji godzin (Steam).</p>
            <button className="btn" style={{ width: '100%', marginBottom: '1rem', backgroundColor: '#5865F2', color: 'white' }}>
              Połącz z Discord
            </button>
            <button className="btn" style={{ width: '100%', backgroundColor: '#171a21', color: 'white' }}>
              Połącz ze Steam
            </button>
          </div>

          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem', opacity: 0.5, pointerEvents: 'none' }}>
             <p style={{ color: 'var(--accent-green)', fontSize: '0.9rem', textAlign: 'center', fontWeight: 'bold' }}>
                Zaloguj się najpierw, aby odblokować formularz.
             </p>
            
            <label>
              Imię / Pseudonim:
              <input type="text" className="form-input" placeholder="Wpisz swój nick..." />
            </label>

            <label>
              Wiek:
              <input type="number" className="form-input" placeholder="18" />
            </label>

            <label>
              Dlaczego chcesz dołączyć?
              <textarea rows={4} className="form-input" placeholder="Rozpisz się trochę..."></textarea>
            </label>

            <button type="button" className="btn" style={{ marginTop: '1rem' }}>Wyślij Formularz</button>
          </form>

        </div>
      </div>
    </main>
  );
}
