import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

async function hasAccess(user: any, guildId: string) {
  const group = await prisma.musicGroup.findUnique({
    where: { guildId },
    include: { members: true }
  });
  if (!group) return false;
  if (group.ownerId === user.id) return true;
  return group.members.some((m: any) => m.discordId === user.discordId || m.steamId === user.steamId);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email || undefined, id: (session.user as any).id },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const guildId = req.nextUrl.searchParams.get('guildId');
    if (!guildId) return NextResponse.json({ error: "Missing guildId" }, { status: 400 });

    if (!(await hasAccess(user, guildId))) {
      return NextResponse.json({ error: "Forbidden: You don't have access to this server's playlist." }, { status: 403 });
    }

    const apiUrl = process.env.BOT_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/api/music/status?guildId=${guildId}`, { cache: 'no-store' });
    const data = await res.json();
    
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email || undefined, id: (session.user as any).id },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { action, value, guildId } = await req.json();
    if (!guildId) return NextResponse.json({ error: "Missing guildId" }, { status: 400 });

    if (!(await hasAccess(user, guildId))) {
      return NextResponse.json({ error: "Forbidden: You don't have access to this server's playlist." }, { status: 403 });
    }

    const apiUrl = process.env.BOT_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/api/music/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, value, guildId })
    });
    const data = await res.json();
    
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
