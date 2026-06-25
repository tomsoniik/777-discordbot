import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminConfigForm from "./AdminConfigForm";

const prisma = new PrismaClient();

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  
  // @ts-ignore
  if (!session || session.user?.role !== "ADMIN") {
    // Redirect to home if not admin
    redirect("/");
  }

  // Fetch or create config
  let config = await prisma.botConfig.findFirst();
  if (!config) {
    config = await prisma.botConfig.create({
      data: {
        guildId: "",
      }
    });
  }

  return (
    <main className="container">
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <img src="/img/untlogo.png" alt="Unturned Logo" style={{ height: '40px', verticalAlign: 'middle' }} />
        </Link>
        <div className="navbar-nav">
          <Link href="/">Home</Link>
          <Link href="/apply">Recruitment</Link>
          <Link href="/admin" style={{ color: 'var(--accent-green)' }}>Admin Panel</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <h1 style={{ textAlign: 'center', color: 'var(--accent-green)', marginTop: 0 }}>Bot Configuration</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Manage Discord bot settings, channel IDs, and permissions.
        </p>

        <AdminConfigForm initialConfig={config} />

      </div>
    </main>
  );
}
