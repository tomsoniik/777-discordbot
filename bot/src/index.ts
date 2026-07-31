import { logger } from './utils/logger';
import { Player } from 'discord-player';
import { SoundCloudExtractor } from '@discord-player/extractor';
import { buildMusicMessage } from './utils/musicEmbed';

import { Client, GatewayIntentBits, Partials, Events } from 'discord.js';
import { ENV } from './config/env';
import { setupApi } from './api';
import { onReady } from './events/ready';
import { onInteractionCreate } from './events/interactionCreate';
import { onMessageCreate } from './events/messageCreate';
import { onGuildMemberAdd, onGuildMemberRemove } from './events/guildMemberEvents';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember],
});

// Zdarzenia
client.once(Events.ClientReady, async () => {
    const player = new Player(client);
    await player.extractors.register(SoundCloudExtractor, {});

    player.events.on('playerStart', async (queue, _track) => {
        if (queue.metadata && (queue.metadata as any).channel) {
            const meta = queue.metadata as any;

            // Czyszczenie poprzedniego interwału i wiadomości (żeby panel był zawsze na dole)
            if (meta.playerInterval) clearInterval(meta.playerInterval);
            if (meta.playerMessage) await meta.playerMessage.delete().catch(() => {});

            const messagePayload = buildMusicMessage(queue);
            const msg = await meta.channel.send(messagePayload).catch(() => null);

            if (msg) {
                meta.playerMessage = msg;

                // Odświeżaj panel co 10 sekund
                meta.playerInterval = setInterval(async () => {
                    if (queue.deleted) {
                        clearInterval(meta.playerInterval);
                        return;
                    }
                    // Nie obciążamy API jak muzyka jest zapauzowana
                    if (queue.node.isPaused()) return;

                    await msg.edit(buildMusicMessage(queue)).catch(() => {
                        // Jeśli wiadomość została usunięta, wyczyść interwał
                        clearInterval(meta.playerInterval);
                    });
                }, 10000);
            }
        }
    });

    player.events.on('error', (queue, error) => {
        logger.error(error as Error, `[Player Error]`);
    });

    await onReady(client);
});

client.on(Events.InteractionCreate, async (interaction) => {
    await onInteractionCreate(interaction);
});

client.on(Events.MessageCreate, async (message) => {
    await onMessageCreate(message);
});

client.on(Events.GuildMemberAdd, async (member) => {
    await onGuildMemberAdd(member);
});

client.on(Events.GuildMemberRemove, async (member) => {
    await onGuildMemberRemove(member);
});

// Konfiguracja API
setupApi(client);

// Logowanie
client.login(ENV.DISCORD_TOKEN);
