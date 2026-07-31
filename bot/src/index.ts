import { logger } from './utils/logger';
import { Player } from 'discord-player';
import { SoundCloudExtractor } from '@discord-player/extractor';

import {
    Client,
    GatewayIntentBits,
    Partials,
    Events,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
} from 'discord.js';
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

    player.events.on('playerStart', (queue, track) => {
        if (queue.metadata && (queue.metadata as any).channel) {
            const embed = new EmbedBuilder()
                .setColor('#ff5500')
                .setAuthor({ name: '🎶 Now playing (SoundCloud)' })
                .setTitle(track.title)
                .setURL(track.url)
                .setDescription(
                    `**Duration:** ${track.duration}\n**Added by:** ${track.requestedBy?.toString() || 'Nieznany'}`,
                )
                .setThumbnail(track.thumbnail || null);

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('music_pause').setLabel('Pause').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('music_resume').setLabel('Resume').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('music_skip').setLabel('Skip').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('music_stop').setLabel('Stop').setStyle(ButtonStyle.Danger),
            );

            (queue.metadata as any).channel.send({ embeds: [embed], components: [row] }).catch(() => {});
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
