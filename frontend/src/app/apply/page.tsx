import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { DiscordLoginButton, SteamLoginButton, LogoutButton } from "@/components/AuthButtons";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function ApplyPage() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session;

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
            {isLoggedIn ? (
              <>
                <p style={{ marginBottom: '1rem', color: 'var(--accent-green)', fontWeight: 'bold' }}>
                  Authenticated as: {session.user?.name || session.user?.email || "User"}
                </p>
                <LogoutButton />
              </>
            ) : (
              <>
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Step 1: Login required for identification (Discord) and hours verification (Steam).</p>
                <DiscordLoginButton />
                <SteamLoginButton />
              </>
            )}
          </div>

          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem', opacity: isLoggedIn ? 1 : 0.5, pointerEvents: isLoggedIn ? 'auto' : 'none' }}>
             {!isLoggedIn && (
               <p style={{ color: 'var(--accent-green)', fontSize: '0.9rem', textAlign: 'center', fontWeight: 'bold' }}>
                  Log in first to unlock the form.
               </p>
             )}
            
            <label>
              Name / Nickname:
              <input type="text" className="form-input" placeholder="Enter your nickname..." />
            </label>

            <label>
              Age:
              <input type="number" className="form-input" placeholder="18" />
            </label>

            <label>
              Unturned Hours (Approx):
              <input type="number" className="form-input" placeholder="e.g. 1500" />
            </label>

            <label>
              Preferred Role:
              <select className="form-input">
                <option value="pvp">PvP / Shooter</option>
                <option value="builder">Builder / Base Manager</option>
                <option value="farmer">Farmer / Resource Gatherer</option>
                <option value="pilot">Pilot / Driver</option>
              </select>
            </label>

            <label>
              Do you have a working microphone?
              <select className="form-input">
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>

            <label>
              Why do you want to join?
              <textarea rows={4} className="form-input" placeholder="Tell us a bit about your playstyle, previous clans, etc..."></textarea>
            </label>

            <button type="button" className="btn" style={{ marginTop: '1rem' }}>Submit Form</button>
          </form>

        </div>
      </div>
    </main>
  );
}
