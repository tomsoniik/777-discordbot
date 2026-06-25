import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // @ts-ignore
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)', color: 'var(--text-light)' }}>
      {/* Sidebar */}
      <aside style={{ 
        width: '280px', 
        backgroundColor: 'var(--bg-card)', 
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ margin: 0, color: 'var(--accent-green)', fontSize: '1.5rem' }}>Admin Panel</h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>777 Recruitment System</p>
        </div>

        <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link href="/admin" style={navLinkStyle}>
            ⚙️ Konfiguracja Bota
          </Link>
          <Link href="/admin/submissions" style={navLinkStyle}>
            🗂️ Archiwum Podań
          </Link>
          {/* <Link href="/admin/templates" style={navLinkStyle}>
            📄 Szablony (Wkrótce)
          </Link> */}
        </nav>

        <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--border-color)' }}>
          <Link href="/" style={{ ...navLinkStyle, color: 'var(--text-muted)' }}>
            ⬅️ Wróć na stronę
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

const navLinkStyle = {
  display: 'block',
  padding: '0.8rem 1rem',
  borderRadius: '6px',
  color: 'var(--text-light)',
  textDecoration: 'none',
  transition: 'background 0.2s',
  // Hover effect handle via global css or inline style if needed, but simple block is ok
  border: '1px solid transparent',
};
