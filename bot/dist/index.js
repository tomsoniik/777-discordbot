"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
