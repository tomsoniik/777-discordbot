import Link from 'next/link';

export default function ApplyPage() {
  return (
    <main className="container">
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <img src="/img/untlogo.png" alt="Unturned Logo" style={{ height: '40px', verticalAlign: 'middle' }} />
        </Link>
        <div className="navbar-nav">
          <Link href="/">Home</Link>
          <Link href="/apply">Recruitment</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <h1 style={{ textAlign: 'center', color: 'var(--accent-green)', marginTop: 0 }}>Recruitment Form</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          
          <div style={{ padding: '1.5rem', border: '1px dashed var(--accent-green)', borderRadius: '4px', textAlign: 'center' }}>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Step 1: Login required for identification (Discord) and hours verification (Steam).</p>
            <button className="btn" style={{ width: '100%', marginBottom: '1rem', backgroundColor: '#5865F2', color: 'white' }}>
              Connect with Discord
            </button>
            <button className="btn" style={{ width: '100%', backgroundColor: '#171a21', color: 'white' }}>
              Connect with Steam
            </button>
          </div>

          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem', opacity: 0.5, pointerEvents: 'none' }}>
             <p style={{ color: 'var(--accent-green)', fontSize: '0.9rem', textAlign: 'center', fontWeight: 'bold' }}>
                Log in first to unlock the form.
             </p>
            
            <label>
              Name / Nickname:
              <input type="text" className="form-input" placeholder="Enter your nickname..." />
            </label>

            <label>
              Age:
              <input type="number" className="form-input" placeholder="18" />
            </label>

            <label>
              Why do you want to join?
              <textarea rows={4} className="form-input" placeholder="Tell us a bit about yourself..."></textarea>
            </label>

            <button type="button" className="btn" style={{ marginTop: '1rem' }}>Submit Form</button>
          </form>

        </div>
      </div>
    </main>
  );
}
