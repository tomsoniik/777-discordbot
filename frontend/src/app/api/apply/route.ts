import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "You must be logged in to apply." }, { status: 401 });
  }

  try {
    const data = await req.json();

    // Szukamy domyślnego szablonu (lub tworzymy jakikolwiek jako fallback)
    let template = await prisma.formTemplate.findFirst();
    if (!template) {
      template = await prisma.formTemplate.create({
        data: {
          title: "Default Unturned Application",
          category: "unturned",
          fields: "[]"
        }
      });
    }

    // @ts-ignore
    const userId = session.user.id;

    const submission = await prisma.submission.create({
      data: {
        userId: userId,
        formTemplateId: template.id,
        answers: JSON.stringify(data),
      }
    });

    // Notify Discord Channel using Bot Token
    const botConfig = await prisma.botConfig.findFirst();
    if (botConfig && botConfig.applyChannelId && process.env.DISCORD_BOT_TOKEN) {
      // @ts-ignore
      const discordUserId = session.user.discordId || "Unknown";
      
      const embed = {
        title: "📄 Nowe podanie o rekrutację!",
        color: 0x00FF00,
        fields: [
          { name: "👤 Użytkownik", value: `<@${discordUserId}>`, inline: true },
          { name: "🎮 Nick", value: data.nickname || "Brak", inline: true },
          { name: "🎂 Wiek", value: data.age?.toString() || "Brak", inline: true },
          { name: "⏱ Godziny (Steam)", value: data.hours?.toString() || "Brak", inline: true },
          { name: "⚔ Rola", value: data.role || "Brak", inline: true },
          { name: "🎙 Mikrofon", value: data.mic || "Brak", inline: true },
          { name: "📝 Powód", value: data.reason || "Brak", inline: false },
        ],
        footer: { text: `Submission ID: ${submission.id}` }
      };

      const components = [
        {
          type: 1, // ActionRow
          components: [
            {
              type: 2, // Button
              style: 3, // Success (Green)
              label: "Akceptuj",
              custom_id: `accept_${submission.id}`
            },
            {
              type: 2, // Button
              style: 4, // Danger (Red)
              label: "Odrzuć",
              custom_id: `reject_${submission.id}`
            }
          ]
        }
      ];

      await fetch(`https://discord.com/api/v10/channels/${botConfig.applyChannelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: `<@&${botConfig.adminRoleIds?.split(',')[0]?.trim()}> Nowe podanie!`,
          embeds: [embed],
          components: components
        })
      });
    }

    return NextResponse.json({ success: true, submissionId: submission.id });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json({ error: "Failed to submit application. Please try again." }, { status: 500 });
  }
}
