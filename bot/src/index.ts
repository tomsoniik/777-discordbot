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

import { Player } from 'discord-player';
import { YoutubeiExtractor } from 'discord-player-youtubei';

// Zdarzenia
client.once(Events.ClientReady, async () => {
    // Inicjalizacja discord-player
    const player = new Player(client);
    
    // Załaduj domyślne ekstraktory (np. Spotify, SoundCloud)
    const { DefaultExtractors } = require('@discord-player/extractor');
    await player.extractors.loadMulti(DefaultExtractors);
    
    // Zarejestruj nowoczesny i stabilny YoutubeiExtractor
    await player.extractors.register(YoutubeiExtractor, {});

    // Nasłuchiwanie błędów odtwarzacza, aby wiedzieć, dlaczego nie gra
    player.events.on('error', (queue, error) => {
        console.error(`[Player Error] Zgłoszono błąd: ${error.message}`);
        if (queue.metadata) {
            (queue.metadata as any).channel?.send(`❌ Wystąpił błąd odtwarzacza: \`${error.message}\``).catch(() => {});
        }
    });

    player.events.on('playerError', (queue, error) => {
        console.error(`[Player Error] Błąd strumienia audio: ${error.message}`);
        if (queue.metadata) {
            (queue.metadata as any).channel?.send(`❌ Błąd odtwarzania audio: \`${error.message}\``).catch(() => {});
        }
    });

    player.events.on('playerStart', (queue, track) => {
        if (queue.metadata) {
            (queue.metadata as any).channel?.send(`🎶 Odtwarzanie: **${track.title}**`).catch(() => {});
        }
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
