import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import AdminConfigForm from "./AdminConfigForm";

const prisma = new PrismaClient();

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  
  // @ts-ignore
  if (!session || session.user?.role !== "ADMIN") {
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
          Global Architecture
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#8ebf9e', 
          marginTop: '1.5rem',
          maxWidth: '600px',
          lineHeight: '1.7'
        }}>
          Configure integrations, automate server pipelines, and manage security protocols across the entire network ecosystem.
        </p>
      </div>

      <AdminConfigForm initialConfig={config} clientId={process.env.DISCORD_CLIENT_ID || ""} />
    </div>
  );
}
