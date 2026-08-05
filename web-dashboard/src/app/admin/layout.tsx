import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Setting2, FolderOpen, Edit2, ArrowLeft2 } from "iconsax-react";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "600", "800"] });

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
    <div className={outfit.className} style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      color: '#e2f5e9',
      overflowX: 'hidden'
    }}>
      {/* Floating Glass Sidebar */}
      <aside style={{ 
        width: '300px', 
        margin: '2rem 0 2rem 2rem',
        borderRadius: '24px',
        backgroundColor: 'rgba(10, 31, 18, 0.6)', 
        border: '1px solid rgba(46, 204, 113, 0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ padding: '3rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '2rem', fontWeight: 800, letterSpacing: '-1px' }}>
            System<br/><span style={{ color: '#2ecc71' }}>Nexus</span>
          </h2>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#8ebf9e', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Command Center
          </p>
        </div>

        <nav style={{ flex: 1, padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link href="/admin" className="admin-nav-link">
            <Setting2 size="24" color="currentColor" variant="Bulk" style={{ marginRight: '16px' }} /> 
            <span>Configuration</span>
          </Link>
          <Link href="/admin/submissions" className="admin-nav-link">
            <FolderOpen size="24" color="currentColor" variant="Bulk" style={{ marginRight: '16px' }} /> 
            <span>Submissions</span>
          </Link>
          <Link href="/admin/form-builder" className="admin-nav-link">
            <Edit2 size="24" color="currentColor" variant="Bulk" style={{ marginRight: '16px' }} /> 
            <span>Form Builder</span>
          </Link>
        </nav>

        <div style={{ padding: '2rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Link href="/" className="admin-nav-link back-link">
            <ArrowLeft2 size="24" color="currentColor" style={{ marginRight: '16px' }} /> 
            <span>Return to Portal</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ 
        flex: 1, 
        padding: '2rem 4rem 4rem 4rem', 
        overflowY: 'auto',
        position: 'relative',
        zIndex: 5
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {children}
        </div>
      </main>

      {/* Inject Admin Specific CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        .admin-nav-link {
          display: flex;
          align-items: center;
          padding: 1rem 1.5rem;
          border-radius: 16px;
          color: #8ebf9e;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid transparent;
          position: relative;
          overflow: hidden;
        }
        .admin-nav-link:hover {
          color: #2ecc71;
          background: rgba(46, 204, 113, 0.05);
          border-color: rgba(46, 204, 113, 0.2);
          transform: translateX(8px);
        }
        .back-link:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }
      `}} />
    </div>
  );
}
