import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export default async function SubmissionsPage() {
  const session = await getServerSession(authOptions);

  // @ts-ignore
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/");
  }

  const submissions = await prisma.submission.findMany({
    include: { user: true, formTemplate: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div style={{ width: '100%' }}>
      <div style={{ 
        maxWidth: '1000px', 
        marginBottom: '4rem',
        paddingTop: '2rem'
      }}>
        <h1 style={{ 
          fontSize: 'clamp(3rem, 5vw, 4.5rem)', 
          lineHeight: '1.1',
          fontWeight: 800,
          margin: 0,
          color: '#fff',
          letterSpacing: '-2px'
        }}>
          Data Intelligence
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#8ebf9e', 
          marginTop: '1.5rem',
          maxWidth: '600px',
          lineHeight: '1.7'
        }}>
          Analyze and process incoming recruitment intelligence securely from the global database.
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="bento-card" style={{ padding: '4rem', textAlign: 'center', alignItems: 'center' }}>
          <p style={{ fontSize: '1.2rem', color: '#8ebf9e', margin: 0 }}>The intelligence database is currently empty.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {submissions.map(sub => {
            let answers: any = {};
            try { answers = JSON.parse(sub.answers); } catch (e) {}
            
            const isAccepted = sub.status === 'ACCEPTED';
            const isRejected = sub.status === 'REJECTED';
            
            let statusColor = '#fff';
            let statusBg = 'rgba(255,255,255,0.1)';
            
            if (isAccepted) {
              statusColor = '#2ecc71';
              statusBg = 'rgba(46, 204, 113, 0.1)';
            } else if (isRejected) {
              statusColor = '#ff3c3c';
              statusBg = 'rgba(255, 60, 60, 0.1)';
            }

            return (
              <details key={sub.id} className="submission-card bento-card" style={{ padding: '2rem', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                <summary style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 2fr 1.5fr 1fr', 
                  alignItems: 'center', 
                  gap: '1rem',
                  outline: 'none',
                  listStyle: 'none'
                }} className="submission-summary">
                  
                  {/* ID */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Dossier ID</span>
                    <span style={{ fontSize: '1.1rem', color: '#8ebf9e', fontFamily: 'monospace' }}>#{sub.id.substring(0, 6)}</span>
                  </div>

                  {/* User */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Subject Identity</span>
                    <span style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 600 }}>{sub.user.name || "Unknown Entity"}</span>
                  </div>

                  {/* Date */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Timestamp</span>
                    <span style={{ fontSize: '1rem', color: '#8ebf9e' }}>{new Date(sub.createdAt).toLocaleString('pl-PL')}</span>
                  </div>

                  {/* Status */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ 
                      padding: '0.5rem 1rem', 
                      borderRadius: '8px', 
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      letterSpacing: '1px',
                      backgroundColor: statusBg,
                      color: statusColor,
                      border: \`1px solid \${statusBg.replace('0.1', '0.3')}\`
                    }}>
                      {sub.status}
                    </span>
                  </div>

                </summary>

                {/* Expanded Content */}
                <div style={{ 
                  marginTop: '2rem', 
                  paddingTop: '2rem', 
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '2rem'
                }}>
                  {(() => {
                    try {
                      const templateFields = JSON.parse(sub.formTemplate.fields);
                      return Object.keys(answers).map(key => {
                        const field = templateFields.find((f: any) => f.id === key);
                        const label = field ? field.label : key;
                        return (
                          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', color: '#2ecc71', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{label}</span>
                            <span style={{ fontSize: '1.1rem', color: '#e2f5e9', lineHeight: '1.5', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                              {answers[key] || "—"}
                            </span>
                          </div>
                        );
                      });
                    } catch (e) {
                      return <span style={{ color: '#ff3c3c' }}>Failed to decrypt dossier structure.</span>;
                    }
                  })()}
                </div>
              </details>
            )
          })}
        </div>
      )}

      {/* Hide native details arrow */}
      <style dangerouslySetInnerHTML={{__html: \`
        details > summary::-webkit-details-marker {
          display: none;
        }
      \`}} />
    </div>
  );
}
