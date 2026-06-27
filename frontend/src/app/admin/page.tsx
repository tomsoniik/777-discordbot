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
    <div style={{ width: '100%', backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
      <h1 style={{ color: 'var(--accent-green)', marginTop: 0 }}>Konfiguracja Bota</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Zarządzaj ustawieniami integracji, kanałami na Discordzie i powiadomieniami.
      </p>

      <AdminConfigForm initialConfig={config} clientId={process.env.DISCORD_CLIENT_ID || ""} />
    </div>
  );
}
