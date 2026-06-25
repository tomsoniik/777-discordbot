import Link from 'next/link';

export default function Home() {
  return (
    <main className="container">
      <nav className="navbar">
        <div className="navbar-brand">TICKET SYSTEM</div>
        <div className="navbar-nav">
          <Link href="/">Home</Link>
          <Link href="/apply">Recruitment</Link>
          <Link href="/about">About Us</Link>
        </div>
      </nav>

      <section className="hero">
        <h1>Welcome to the recruitment portal</h1>
        <p>Log in with your Steam and Discord accounts to submit the form and join our team.</p>
        <Link href="/apply" className="btn">
          Start Application
        </Link>
      </section>

      <section>
        <h2 style={{ textAlign: 'center', marginTop: '4rem' }}>Our Divisions (Categories)</h2>
        <div className="categories">
          
          <div className="category-card">
            <h3>Rust (Game)</h3>
            <p>We are looking for experienced players with over 1000 hours who can play as a team.</p>
            <Link href="/apply?category=rust" className="btn btn-outline">Apply for Rust</Link>
          </div>

          <div className="category-card">
            <h3>CS2 / CS:GO</h3>
            <p>Join our tactical shooter section. Prime status, high Faceit level, and good communication required.</p>
            <Link href="/apply?category=cs2" className="btn btn-outline">Apply for CS2</Link>
          </div>

          <div className="category-card">
            <h3>Moderation</h3>
            <p>Want to help us manage Discord and our servers? Apply for the Moderator position.</p>
            <Link href="/apply?category=mod" className="btn btn-outline">Apply for Mod</Link>
          </div>

        </div>
      </section>
    </main>
  );
}
