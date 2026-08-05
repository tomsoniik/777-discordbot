import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email || undefined, id: (session.user as any).id },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Find groups where user is owner OR a member
    const groups = await prisma.musicGroup.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          {
            members: {
              some: {
                OR: [
                  { discordId: user.discordId || 'none' },
                  { steamId: user.steamId || 'none' }
                ]
              }
            }
          }
        ]
      },
      include: { owner: { select: { name: true, discordId: true, image: true } } }
    });

    return NextResponse.json(groups);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, guildId } = await req.json();
    if (!name || !guildId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email || undefined, id: (session.user as any).id },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const existing = await prisma.musicGroup.findUnique({ where: { guildId } });
    if (existing) return NextResponse.json({ error: "Server already registered" }, { status: 400 });

    const group = await prisma.musicGroup.create({
      data: {
        name,
        guildId,
        ownerId: user.id
      }
    });

    return NextResponse.json(group);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
