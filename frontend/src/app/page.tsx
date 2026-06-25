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


    </main>
  );
}
