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
    await player.extractors.loadDefault();
    
    // Zarejestruj nowoczesny i stabilny YoutubeiExtractor
    await player.extractors.register(YoutubeiExtractor, {});

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
