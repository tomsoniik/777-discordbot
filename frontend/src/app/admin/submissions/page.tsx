import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic'; // Żeby strona nie keszowała starych wyników

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
    <div style={{ maxWidth: '1200px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--accent-green)', margin: 0 }}>Archiwum Podań</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Przeglądaj wszystkie podania złożone przez graczy.</p>
      </div>

        {submissions.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '8px' }}>
            Brak złożonych podań w bazie.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem' }}>ID</th>
                  <th style={{ padding: '1rem' }}>Gracz (Discord)</th>
                  <th style={{ padding: '1rem' }}>Data</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Szczegóły Podania</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => {
                  let answers: any = {};
                  try { answers = JSON.parse(sub.answers); } catch (e) {}

                  return (
                    <tr key={sub.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {sub.id.substring(0, 8)}...
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {sub.user.name || "Brak nazwy"}<br/>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {sub.user.discordId}</span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                        {new Date(sub.createdAt).toLocaleString('pl-PL')}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.3rem 0.6rem', 
                          borderRadius: '4px', 
                          fontSize: '0.8rem',
                          backgroundColor: sub.status === 'ACCEPTED' ? 'rgba(0,255,0,0.1)' : sub.status === 'REJECTED' ? 'rgba(255,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                          color: sub.status === 'ACCEPTED' ? 'var(--accent-green)' : sub.status === 'REJECTED' ? 'red' : 'white'
                        }}>
                          {sub.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                        <details style={{ cursor: 'pointer' }}>
                          <summary style={{ outline: 'none', color: 'var(--accent-green)', fontWeight: 'bold' }}>Pokaż Odpowiedzi</summary>
                          <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                            {(() => {
                              try {
                                const templateFields = JSON.parse(sub.formTemplate.fields);
                                return Object.keys(answers).map(key => {
                                  const field = templateFields.find((f: any) => f.id === key);
                                  const label = field ? field.label : key;
                                  return (
                                    <div key={key} style={{ marginBottom: '0.3rem' }}>
                                      <strong style={{ color: 'var(--text-light)' }}>{label}:</strong><br/>
                                      <span style={{ color: 'var(--text-muted)' }}>{answers[key] || "Brak"}</span>
                                    </div>
                                  );
                                });
                              } catch (e) {
                                return <span>Błąd odczytu struktury formularza.</span>;
                              }
                            })()}
                          </div>
                        </details>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
  );
}
