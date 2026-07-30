"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./utils/logger");
const discord_js_1 = require("discord.js");
const env_1 = require("./config/env");
const api_1 = require("./api");
const ready_1 = require("./events/ready");
const interactionCreate_1 = require("./events/interactionCreate");
const messageCreate_1 = require("./events/messageCreate");
const guildMemberEvents_1 = require("./events/guildMemberEvents");
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMembers,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [discord_js_1.Partials.Message, discord_js_1.Partials.Channel, discord_js_1.Partials.Reaction, discord_js_1.Partials.GuildMember],
});
const discord_player_1 = require("discord-player");
const extractor_1 = require("@discord-player/extractor");
// Zdarzenia
client.once(discord_js_1.Events.ClientReady, async () => {
    // Inicjalizacja discord-player z użyciem standardowych modułów
    const player = new discord_player_1.Player(client);
    // Załaduj domyślne ekstraktory (w tym BridgeProvider, który automatycznie pobierze audio z SC jeśli YT nie zadziała)
    await player.extractors.loadMulti(extractor_1.DefaultExtractors);
    // Debugowanie audio (bardzo ważne do wyłapywania problemów z odtwarzaniem)
    player.events.on('debug', (queue, message) => {
        logger_1.logger.info(`[Player Debug] ${message}`);
    });
    // Nasłuchiwanie błędów odtwarzacza, aby wiedzieć, dlaczego nie gra
    player.events.on('error', (queue, error) => {
        logger_1.logger.error(`[Player Error] Zgłoszono błąd: ${error.message}`);
        if (queue.metadata) {
            queue.metadata.channel?.send(`❌ Wystąpił błąd odtwarzacza: \`${error.message}\``).catch(() => { });
        }
    });
    player.events.on('playerError', (queue, error) => {
        logger_1.logger.error(`[Player Error] Błąd strumienia audio: ${error.message}`);
        if (queue.metadata) {
            queue.metadata.channel?.send(`❌ Błąd odtwarzania audio: \`${error.message}\``).catch(() => { });
        }
    });
    player.events.on('playerStart', (queue, track) => {
        if (queue.metadata) {
            const embed = new discord_js_1.EmbedBuilder()
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
            }
            catch (_e) {
                // Ignore error if progress bar fails
            }
            embed.addFields({
                name: 'Status',
                value: `Volume: ${queue.node.volume}% | Loop: ${queue.repeatMode === 1 ? 'This song' : queue.repeatMode === 2 ? 'Queue' : 'Off'} | Autoplay: ${queue.repeatMode === 3 ? 'On' : 'Off'}`,
            });
            const row1 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('music_pause').setLabel('Pause').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('music_resume').setLabel('Resume').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('music_previous').setLabel('Previous').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('music_skip').setLabel('Skip').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('music_stop').setLabel('Stop').setStyle(discord_js_1.ButtonStyle.Primary));
            const row2 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('music_volup').setLabel('Volume up').setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId('music_voldown').setLabel('Volume down').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('music_shuffle').setLabel('Shuffle').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('music_repeat').setLabel('Repeat').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('music_autoplay').setLabel('AutoPlay').setStyle(discord_js_1.ButtonStyle.Secondary));
            queue.metadata.channel
                ?.send({
                embeds: [embed],
                components: [row1, row2],
            })
                .catch(() => { });
        }
    });
    await (0, ready_1.onReady)(client);
});
client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
    await (0, interactionCreate_1.onInteractionCreate)(interaction);
});
client.on(discord_js_1.Events.MessageCreate, async (message) => {
    await (0, messageCreate_1.onMessageCreate)(message);
});
client.on(discord_js_1.Events.GuildMemberAdd, async (member) => {
    await (0, guildMemberEvents_1.onGuildMemberAdd)(member);
});
client.on(discord_js_1.Events.GuildMemberRemove, async (member) => {
    await (0, guildMemberEvents_1.onGuildMemberRemove)(member);
});
// Konfiguracja API
(0, api_1.setupApi)(client);
// Logowanie
client.login(env_1.ENV.DISCORD_TOKEN);
