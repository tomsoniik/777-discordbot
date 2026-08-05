"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./utils/logger");
const discord_player_1 = require("discord-player");
const extractor_1 = require("@discord-player/extractor");
const musicEmbed_1 = require("./utils/musicEmbed");
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
// Zdarzenia
client.once(discord_js_1.Events.ClientReady, async () => {
    const player = new discord_player_1.Player(client, {
        connectionTimeout: 120000,
    });
    await player.extractors.register(extractor_1.SoundCloudExtractor, {});
    player.events.on('playerStart', async (queue, _track) => {
        if (queue.metadata && queue.metadata.channel) {
            const meta = queue.metadata;
            // Czyszczenie poprzedniego interwału i wiadomości (żeby panel był zawsze na dole)
            if (meta.playerInterval) {
                clearInterval(meta.playerInterval);
                meta.playerInterval = null;
            }
            if (meta.playerMessage) {
                await meta.playerMessage.delete().catch(() => { });
                meta.playerMessage = null;
            }
            const messagePayload = (0, musicEmbed_1.buildMusicMessage)(queue);
            const msg = await meta.channel.send(messagePayload).catch(() => null);
            if (msg) {
                meta.playerMessage = msg;
                // Odświeżaj panel dynamicznie co 3 sekundy
                meta.playerInterval = setInterval(async () => {
                    if (queue.deleted || !queue.isPlaying()) {
                        if (meta.playerInterval) {
                            clearInterval(meta.playerInterval);
                            meta.playerInterval = null;
                        }
                        return;
                    }
                    // Nie obciążamy API jak muzyka jest zapauzowana
                    if (queue.node.isPaused())
                        return;
                    try {
                        await msg.edit((0, musicEmbed_1.buildMusicMessage)(queue));
                    }
                    catch (err) {
                        // Jeśli wiadomość została usunięta z Discorda (kod 10008: Unknown Message) lub brak kanału (404), wyczyść interwał
                        if (err?.code === 10008 || err?.status === 404) {
                            if (meta.playerInterval) {
                                clearInterval(meta.playerInterval);
                                meta.playerInterval = null;
                            }
                        }
                        // Jeśli to tymczasowy błąd API Discorda / rate limit (429), nie przerywamy interwału!
                    }
                }, 3000);
            }
        }
    });
    player.events.on('emptyQueue', (queue) => {
        const meta = queue.metadata;
        if (meta?.playerInterval) {
            clearInterval(meta.playerInterval);
            meta.playerInterval = null;
        }
    });
    player.events.on('disconnect', (queue) => {
        const meta = queue.metadata;
        if (meta?.playerInterval) {
            clearInterval(meta.playerInterval);
            meta.playerInterval = null;
        }
    });
    player.events.on('playerError', (queue, error) => {
        logger_1.logger.error(error, `[Player Error]`);
        const meta = queue.metadata;
        if (meta?.playerInterval) {
            clearInterval(meta.playerInterval);
            meta.playerInterval = null;
        }
    });
    player.events.on('error', (queue, error) => {
        logger_1.logger.error(error, `[Player Error]`);
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
