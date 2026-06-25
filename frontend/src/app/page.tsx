import Link from 'next/link';

export default function Home() {
  return (
    <main className="container">
      <nav className="navbar animate-fade-in-up">
        <div className="navbar-brand">
          <img src="/img/untlogo.png" alt="Unturned Logo" style={{ height: '40px', verticalAlign: 'middle', filter: 'drop-shadow(0 0 8px rgba(46,204,113,0.6))' }} />
        </div>
        <div className="navbar-nav">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/apply" className="nav-link">Recruitment</Link>
          <Link href="/about" className="nav-link">About Us</Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content animate-fade-in-up delay-100">
          <h1 className="hero-title">Welcome to the <span className="text-gradient">Unturned Squad</span></h1>
          <p className="hero-subtitle">
            Do you have what it takes to survive? Join our elite unit, conquer the wasteland, and become part of a community built on trust and skill.
          </p>
          <div className="hero-actions">
            <Link href="/apply" className="btn btn-pulse">
              Start Application
            </Link>
            <Link href="/about" className="btn btn-outline" style={{marginLeft: '1rem'}}>
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <section className="features categories animate-fade-in-up delay-300">
        <div className="category-card">
          <div className="card-icon">⚔️</div>
          <h3>Elite Community</h3>
          <p>Join a group of dedicated and experienced Unturned players focused on domination and teamwork.</p>
        </div>
        <div className="category-card">
          <div className="card-icon">🛡️</div>
          <h3>Secure Recruitment</h3>
          <p>We verify stats directly through Steam and Discord to ensure only the best join our ranks.</p>
        </div>
        <div className="category-card">
          <div className="card-icon">🎯</div>
          <h3>Regular Events</h3>
          <p>Participate in clan wars, server raids, and internal tournaments with epic prizes.</p>
        </div>
      </section>
      
      <footer className="footer animate-fade-in-up delay-300" style={{textAlign: 'center', marginTop: '4rem', padding: '2rem 0', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)'}}>
        <p>&copy; {new Date().getFullYear()} Unturned Squad. All rights reserved.</p>
      </footer>
    </main>
  );
}
