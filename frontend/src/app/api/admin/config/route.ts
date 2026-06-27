import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // @ts-ignore
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const config = await prisma.botConfig.findFirst();
    return NextResponse.json({ config: config || {} });
  } catch (error) {
    console.error("Failed to fetch config", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // @ts-ignore
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { 
      guildId, applyChannelId, ticketCategoryId, adminRoleIds,
      welcomeChannelId, welcomeMessage, leaveChannelId, leaveMessage,
      autoRoleId, logChannelId
    } = data;

    // We assume there's only one config for now. If not, update first one.
    let config = await prisma.botConfig.findFirst();
    if (config) {
      config = await prisma.botConfig.update({
        where: { id: config.id },
        data: {
          guildId,
          applyChannelId,
          ticketCategoryId,
          adminRoleIds,
          welcomeChannelId,
          welcomeMessage,
          leaveChannelId,
          leaveMessage,
          autoRoleId,
          logChannelId,
        },
      });
    } else {
      config = await prisma.botConfig.create({
        data: {
          guildId,
          applyChannelId,
          ticketCategoryId,
          adminRoleIds,
          welcomeChannelId,
          welcomeMessage,
          leaveChannelId,
          leaveMessage,
          autoRoleId,
          logChannelId,
        },
      });
    }

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error("Failed to update config", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
