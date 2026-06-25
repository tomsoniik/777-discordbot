import { NextRequest, NextResponse } from "next/server";
import { verifyKey, InteractionType, InteractionResponseType, MessageComponentTypes } from "discord-interactions";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  // 1. Odbieramy nagłówki podpisów, które Discord wysyła do weryfikacji
  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");
  const rawBody = await req.text();

  if (!signature || !timestamp || !process.env.DISCORD_PUBLIC_KEY) {
    return NextResponse.json({ error: "Missing signature or public key" }, { status: 401 });
  }

  // 2. Weryfikujemy podpis (Discord wymaga tego, by uznać nas za prawdziwą aplikację)
  const isValidRequest = verifyKey(rawBody, signature, timestamp, process.env.DISCORD_PUBLIC_KEY);
  if (!isValidRequest) {
    return NextResponse.json({ error: "Bad request signature" }, { status: 401 });
  }

  const interaction = JSON.parse(rawBody);

  // 3. Discord najpierw wysyła PING, musimy odpisać PONG, żeby zapisać adres na Developer Portal
  if (interaction.type === InteractionType.PING) {
    return NextResponse.json({ type: InteractionResponseType.PONG });
  }

  // 4. Obsługa kliknięć w przyciski pod podaniami
  if (interaction.type === InteractionType.MESSAGE_COMPONENT && interaction.data.component_type === MessageComponentTypes.BUTTON) {
    const customId = interaction.data.custom_id as string; // np. accept_clj12345
    const [action, submissionId] = customId.split("_");

    const botConfig = await prisma.botConfig.findFirst();
    const token = process.env.DISCORD_BOT_TOKEN;

    if (!botConfig || !token) {
      return NextResponse.json({ error: "Bot config or token missing" }, { status: 500 });
    }

    // Odpowiadamy od razu Discordowi (loading state), żeby nas nie zablokował za timeout
    if (action === "reject") {
      // Jeśli odrzucono
      await fetch(`https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: InteractionResponseType.UPDATE_MESSAGE,
          data: {
            content: `❌ Podanie odrzucone przez <@${interaction.member.user.id}>.`,
            components: [] // Usuwamy przyciski
          }
        })
      });
      
      await prisma.submission.update({ where: { id: submissionId }, data: { status: "REJECTED" } });
      return NextResponse.json({ success: true });
    }

    if (action === "accept") {
      const submission = await prisma.submission.findUnique({ where: { id: submissionId }, include: { user: true } });
      if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

      // Odpowiadamy do wiadomości "Akceptowane"
      await fetch(`https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: InteractionResponseType.UPDATE_MESSAGE,
          data: {
            content: `✅ Podanie zaakceptowane przez <@${interaction.member.user.id}>! Trwa tworzenie ticketu...`,
            components: [] 
          }
        })
      });

      // Tworzymy kanał Ticket
      const guildId = botConfig.guildId;
      const applicantDiscordId = submission.user.discordId;

      const createChannelRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
        method: "POST",
        headers: {
          "Authorization": `Bot ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: `ticket-${submission.user.name || "gracz"}`,
          type: 0, // Text channel
          parent_id: botConfig.ticketCategoryId,
          permission_overwrites: [
            {
              id: guildId, // @everyone role
              type: 0,
              deny: "1024" // VIEW_CHANNEL
            },
            {
              id: applicantDiscordId, // Aplikant
              type: 1, // User
              allow: "3072" // VIEW_CHANNEL + SEND_MESSAGES
            },
            // Tutaj można dodać role adminów do overwrites, ale jak mają admina, to i tak widzą.
          ]
        })
      });

      if (createChannelRes.ok) {
        const channel = await createChannelRes.json();
        // Wysyłamy wiadomość do nowo utworzonego ticketu
        await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bot ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            content: `Witaj <@${applicantDiscordId}>! Twoje podanie zostało zaakceptowane. Administracja zaraz się Tobą zajmie. <@&${botConfig.adminRoleIds?.split(',')[0]?.trim()}>`
          })
        });
      }

      await prisma.submission.update({ where: { id: submissionId }, data: { status: "ACCEPTED" } });
      return NextResponse.json({ success: true });
    }
  }

  return NextResponse.json({ error: "Unknown interaction" }, { status: 400 });
}
