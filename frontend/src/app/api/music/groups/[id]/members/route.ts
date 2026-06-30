import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email || undefined, id: (session.user as any).id },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const group = await prisma.musicGroup.findUnique({
      where: { id: params.id },
      include: { members: true, owner: { select: { name: true, discordId: true, image: true } } }
    });

    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    // Verify access
    const isOwner = group.ownerId === user.id;
    const isMember = group.members.some(m => m.discordId === user.discordId || m.steamId === user.steamId);

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(group);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { type, value } = await req.json(); // type: "discord" | "steam", value: "id"
    if (!type || !value) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email || undefined, id: (session.user as any).id },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const group = await prisma.musicGroup.findUnique({ where: { id: params.id } });
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    if (group.ownerId !== user.id) return NextResponse.json({ error: "Forbidden: You are not the owner" }, { status: 403 });

    const member = await prisma.musicGroupMember.create({
      data: {
        groupId: group.id,
        discordId: type === 'discord' ? value : null,
        steamId: type === 'steam' ? value : null,
      }
    });

    return NextResponse.json(member);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
