import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function DELETE(req: NextRequest, { params }: { params: { id: string, memberId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email || undefined, id: (session.user as any).id },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const group = await prisma.musicGroup.findUnique({ where: { id: params.id } });
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    if (group.ownerId !== user.id) return NextResponse.json({ error: "Forbidden: You are not the owner" }, { status: 403 });

    await prisma.musicGroupMember.delete({
      where: { id: params.memberId, groupId: group.id }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
