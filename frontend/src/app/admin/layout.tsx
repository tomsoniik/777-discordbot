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
      backgroundColor: '#050c08', // Darker background for depth
      backgroundImage: 'radial-gradient(circle at 15% 50%, rgba(46, 204, 113, 0.05), transparent 25%), radial-gradient(circle at 85% 30%, rgba(46, 204, 113, 0.08), transparent 25%)',
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
        
        /* Bento Grid Architecture */
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-auto-flow: dense;
          gap: 1.5rem;
          width: 100%;
        }
        
        .bento-card {
          background: rgba(10, 31, 18, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 2.5rem;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          position: relative;
        }
        
        .bento-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(46, 204, 113, 0.3), transparent);
          opacity: 0;
          transition: opacity 0.6s ease;
        }
        
        .bento-card:hover, .bento-card:focus-within {
          transform: translateY(-4px) scale(1.01);
          border-color: rgba(46, 204, 113, 0.2);
          background: rgba(10, 31, 18, 0.6);
          box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.6), 0 0 40px rgba(46, 204, 113, 0.05);
          z-index: 50;
        }
        .bento-card:hover::before {
          opacity: 1;
        }

        .col-span-1 { grid-column: span 1; }
        .col-span-2 { grid-column: span 2; }
        .col-span-3 { grid-column: span 3; }
        .col-span-4 { grid-column: span 4; }
        .row-span-2 { grid-row: span 2; }
        
        /* Premium Inputs */
        .glass-input {
          width: 100%;
          padding: 1rem 1.25rem;
          margin-top: 0.5rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background-color: rgba(0, 0, 0, 0.3);
          color: #fff;
          font-family: inherit;
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }
        .glass-input:focus {
          outline: none;
          border-color: #2ecc71;
          box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.1);
          background-color: rgba(0, 0, 0, 0.5);
        }
        .glass-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
        
        /* Cinematic Button */
        .btn-cinematic {
          background: #2ecc71;
          color: #050c08;
          padding: 1.25rem 3rem;
          border-radius: 16px;
          font-weight: 800;
          font-size: 1.1rem;
          border: none;
          cursor: pointer;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 10px 25px -5px rgba(46, 204, 113, 0.4);
        }
        .btn-cinematic:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px -10px rgba(46, 204, 113, 0.6);
          background: #34d375;
        }
        .btn-cinematic:disabled {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.3);
          box-shadow: none;
          cursor: not-allowed;
          transform: none;
        }
        
        /* Custom Scrollbar for inner elements */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(46, 204, 113, 0.3);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(46, 204, 113, 0.5);
        }
        
        /* Hide outline from checkbox */
        input[type="checkbox"] {
          accent-color: #2ecc71;
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
      `}} />
    </div>
  );
}
