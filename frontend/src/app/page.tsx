import Link from 'next/link';

export default function Home() {
  return (
    <main className="container">
      <nav className="navbar">
        <div className="navbar-brand">TICKET SYSTEM</div>
        <div className="navbar-nav">
          <Link href="/">Strona Główna</Link>
          <Link href="/apply">Rekrutacja</Link>
          <Link href="/about">O nas</Link>
        </div>
      </nav>

      <section className="hero">
        <h1>Witaj na portalu rekrutacyjnym</h1>
        <p>Zaloguj się za pomocą konta Steam i Discord, aby złożyć formularz i dołączyć do naszego zespołu.</p>
        <Link href="/apply" className="btn">
          Rozpocznij aplikację
        </Link>
      </section>

      <section>
        <h2 style={{ textAlign: 'center', marginTop: '4rem' }}>Nasze dywizje (Kategorie)</h2>
        <div className="categories">
          
          <div className="category-card">
            <h3>Rust (Gra)</h3>
            <p>Szukamy doświadczonych graczy z ponad 1000 godzin na koncie, którzy potrafią grać zespołowo.</p>
            <Link href="/apply?category=rust" className="btn btn-outline">Aplikuj do Rust</Link>
          </div>

          <div className="category-card">
            <h3>CS2 / CS:GO</h3>
            <p>Dołącz do sekcji taktycznej strzelanki. Wymagany Prime, wysoki level Faceit i komunikatywność.</p>
            <Link href="/apply?category=cs2" className="btn btn-outline">Aplikuj do CS2</Link>
          </div>

          <div className="category-card">
            <h3>Moderacja</h3>
            <p>Chcesz nam pomóc ogarniać Discorda i serwery? Zgłoś się na stanowisko Moderatora.</p>
            <Link href="/apply?category=mod" className="btn btn-outline">Aplikuj na Moda</Link>
          </div>

        </div>
      </section>
    </main>
  );
}
