import Link from 'next/link';

export default function Home() {
  return (
    <main className="container">
      <nav className="navbar">
        <div className="navbar-brand">
          <img src="/img/untlogo.png" alt="Unturned Logo" style={{ height: '40px', verticalAlign: 'middle' }} />
        </div>
        <div className="navbar-nav">
          <Link href="/">Home</Link>
          <Link href="/apply">Recruitment</Link>
          <Link href="/about">About Us</Link>
        </div>
      </nav>

      <section className="hero">
        <h1>Welcome to the Unturned Recruitment Portal</h1>
        <p>Log in with your Steam and Discord accounts to submit the form and join our Unturned squad.</p>
        <Link href="/apply" className="btn">
          Start Application
        </Link>
      </section>

      <section>
        <h2 style={{ textAlign: 'center', marginTop: '4rem' }}>Our Divisions (Categories)</h2>
        <div className="categories">
          
          <div className="category-card">
            <h3>PvP Squad</h3>
            <p>We are looking for experienced shooters who can hold their own in intense Unturned firefights.</p>
            <Link href="/apply?category=pvp" className="btn btn-outline">Apply for PvP</Link>
          </div>

          <div className="category-card">
            <h3>Builders & Farmers</h3>
            <p>Join our base building and resource gathering section. Map knowledge and creativity required.</p>
            <Link href="/apply?category=build" className="btn btn-outline">Apply for Builder</Link>
          </div>

          <div className="category-card">
            <h3>Moderation</h3>
            <p>Want to help us manage Discord and our Unturned servers? Apply for the Moderator position.</p>
            <Link href="/apply?category=mod" className="btn btn-outline">Apply for Mod</Link>
          </div>

        </div>
      </section>
    </main>
  );
}
