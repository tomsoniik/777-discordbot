import { Client, GatewayIntentBits, Partials, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
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
    const player = new Player(client, {
        ytdlOptions: {
            quality: 'highestaudio',
            highWaterMark: 1 << 25
        }
    });
    
    // Załaduj domyślne ekstraktory (np. Spotify, SoundCloud)
    const { DefaultExtractors } = require('@discord-player/extractor');
    await player.extractors.loadMulti(DefaultExtractors);
    
    // Zarejestruj nowoczesny i stabilny YoutubeiExtractor z obsługą cookies
    let youtubeiOptions = {};
    try {
        const fs = require('fs');
        const path = require('path');
        const cookiesPath = path.join(__dirname, '../../cookies.json'); // path to bot/cookies.json
        if (fs.existsSync(cookiesPath)) {
            const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
            youtubeiOptions = {
                authentication: cookies
            };
            console.log('✅ Załadowano cookies.json dla YoutubeiExtractor!');
        } else {
            console.log('⚠️ Brak pliku cookies.json. YoutubeiExtractor działa bez logowania.');
        }
    } catch (e) {
        console.error('❌ Błąd wczytywania cookies:', e);
    }
    await player.extractors.register(YoutubeiExtractor, youtubeiOptions);

    // Debugowanie audio (bardzo ważne do wyłapywania problemów z odtwarzaniem)
    player.events.on('debug', (queue, message) => {
        console.log(`[Player Debug] ${message}`);
    });

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
            const embed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setAuthor({ name: '🎶 Now playing' })
                .setTitle(`${track.title} [DOWNLOAD AVAILABLE]`) // nawiązanie do screena
                .setURL(track.url)
                .setDescription(`**Duration**\n${track.duration}\n\n**Source**\n${track.source}\n\n**Added by**\n${track.requestedBy?.toString() || 'Nieznany'}`)
                .setThumbnail(track.thumbnail || null)
                .setFooter({ text: 'SkullBot Music' })
                .setTimestamp();

            try {
                const progress = queue.node.createProgressBar();
                if (progress) {
                    embed.addFields({ name: 'Progress', value: progress });
                }
            } catch (e) {}

            embed.addFields({ name: 'Status', value: `Volume: ${queue.node.volume}% | Loop: ${queue.repeatMode === 1 ? 'This song' : queue.repeatMode === 2 ? 'Queue' : 'Off'} | Autoplay: ${queue.repeatMode === 3 ? 'On' : 'Off'}`});

            const row1 = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder().setCustomId('music_pause').setLabel('Pause').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('music_resume').setLabel('Resume').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('music_previous').setLabel('Previous').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('music_skip').setLabel('Skip').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('music_stop').setLabel('Stop').setStyle(ButtonStyle.Primary)
                );

            const row2 = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder().setCustomId('music_volup').setLabel('Volume up').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('music_voldown').setLabel('Volume down').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('music_shuffle').setLabel('Shuffle').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('music_repeat').setLabel('Repeat').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('music_autoplay').setLabel('AutoPlay').setStyle(ButtonStyle.Secondary)
                );

            (queue.metadata as any).channel?.send({ 
                embeds: [embed], 
                components: [row1, row2] 
            }).catch(() => {});
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
