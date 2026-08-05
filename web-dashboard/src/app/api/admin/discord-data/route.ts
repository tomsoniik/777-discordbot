import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // @ts-ignore
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const guildId = searchParams.get("guildId");

  if (!guildId) {
    return NextResponse.json({ error: "No guildId provided" }, { status: 400 });
  }

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Bot token not configured" }, { status: 500 });
  }

  try {
    const [channelsRes, rolesRes] = await Promise.all([
      fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
        headers: { Authorization: `Bot ${token}` }
      }),
      fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
        headers: { Authorization: `Bot ${token}` }
      })
    ]);

    if (!channelsRes.ok || !rolesRes.ok) {
      return NextResponse.json({ error: "Failed to fetch from Discord. Is the bot invited to the server?" }, { status: 400 });
    }

    const channels = await channelsRes.json();
    const roles = await rolesRes.json();

    // Filter channels
    const textChannels = channels.filter((c: any) => c.type === 0);
    const categories = channels.filter((c: any) => c.type === 4);

    return NextResponse.json({ textChannels, categories, roles });
  } catch (err) {
    return NextResponse.json({ error: "Server error while contacting Discord API" }, { status: 500 });
  }
}
