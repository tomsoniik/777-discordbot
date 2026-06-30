"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const voice_1 = require("@discordjs/voice");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const music_1 = require("./music");
dotenv_1.default.config();
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
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const PORT = process.env.PORT || 3001;
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';
client.once('ready', async () => {
    console.log(`Bot logged in as ${client.user?.tag}`);
    try {
        const rest = new discord_js_1.REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        console.log('Rozpoczęto rejestrację (/) commands.');
        const guildId = process.env.GUILD_ID;
        if (guildId) {
            await rest.put(discord_js_1.Routes.applicationGuildCommands(client.user.id, guildId), { body: music_1.musicCommands });
            console.log('Pomyślnie zarejestrowano (/) commands dla gildii.');
        }
        else {
            await rest.put(discord_js_1.Routes.applicationCommands(client.user.id), { body: music_1.musicCommands });
            console.log('Pomyślnie zarejestrowano globalne (/) commands.');
        }
    }
    catch (error) {
        console.error(error);
    }
});
client.on('messageCreate', async (message) => {
    if (message.author.bot)
        return;
    if (message.content === '!ticketsetup' && message.member?.permissions.has('Administrator')) {
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder()
            .setLabel('Stwórz Ticket (Aplikuj)')
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setURL(`${WEB_URL}/apply`));
        await message.channel.send({
            content: 'Kliknij poniższy przycisk, aby przejść do panelu rekrutacji i wypełnić formularz logując się przez Steam:',
            components: [row]
        });
    }
});
client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        if (['play', 'skip', 'stop', 'queue'].includes(interaction.commandName)) {
            await (0, music_1.handleMusicInteraction)(interaction);
        }
    }
    else if (interaction.isButton()) {
        if (interaction.customId.startsWith('music_')) {
            await (0, music_1.handleMusicButtonInteraction)(interaction);
        }
    }
});
async function fetchConfig() {
    try {
        const res = await fetch(`${WEB_URL}/api/bot/config`);
        if (!res.ok)
            return null;
        return await res.json();
    }
    catch (e) {
        console.error("Failed to fetch bot config from API", e);
        return null;
    }
}
client.on('guildMemberAdd', async (member) => {
    const config = await fetchConfig();
    if (!config)
        return;
    // Auto Role
    if (config.autoRoleId) {
        try {
            await member.roles.add(config.autoRoleId);
        }
        catch (e) {
            console.error("Failed to add auto role", e);
        }
    }
    // Welcome Message
    if (config.welcomeChannelId && config.welcomeMessage) {
        const channel = member.guild.channels.cache.get(config.welcomeChannelId);
        if (channel && channel.isTextBased()) {
            const msg = config.welcomeMessage
                .replace(/{user}/g, `<@${member.id}>`)
                .replace(/{server}/g, member.guild.name);
            await channel.send(msg);
        }
    }
});
client.on('guildMemberRemove', async (member) => {
    const config = await fetchConfig();
    if (!config)
        return;
    // Leave Message
    if (config.leaveChannelId && config.leaveMessage) {
        const channel = member.guild.channels.cache.get(config.leaveChannelId);
        if (channel && channel.isTextBased()) {
            const msg = config.leaveMessage
                .replace(/{user}/g, member.user.username)
                .replace(/{server}/g, member.guild.name);
            await channel.send(msg);
        }
    }
});
// Endpoint odbierający sygnały z backendu / strony
app.post('/api/notify', async (req, res) => {
    const { discordId, formId } = req.body;
    // Szukanie gildii (dla uproszczenia z ENV)
    const guildId = process.env.GUILD_ID;
    if (!guildId)
        return res.status(500).json({ error: 'Missing GUILD_ID in env' });
    const guild = client.guilds.cache.get(guildId);
    if (!guild)
        return res.status(404).json({ error: 'Guild not found' });
    try {
        const member = await guild.members.fetch(discordId);
        const roleId = process.env.WAITING_ROLE_ID;
        if (roleId) {
            await member.roles.add(roleId);
            console.log(`Assigned role ${roleId} to user ${discordId}`);
        }
        // Notify admins channel
        const adminChannelId = process.env.ADMIN_CHANNEL_ID;
        if (adminChannelId) {
            const channel = guild.channels.cache.get(adminChannelId);
            if (channel && channel.isTextBased()) {
                await channel.send(`Nowy formularz od <@${discordId}>! Link: ${WEB_URL}/admin/forms/${formId}`);
            }
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error assigning role or notifying admins:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/api/music/status', (req, res) => {
    const guildId = req.query.guildId || process.env.GUILD_ID;
    if (!guildId)
        return res.json({ error: 'No guild id provided' });
    const serverQueue = music_1.queue.get(guildId);
    if (!serverQueue) {
        return res.json({ playing: false, songs: [], volume: 100, loop: false });
    }
    res.json({
        playing: serverQueue.player.state.status === voice_1.AudioPlayerStatus.Playing,
        songs: serverQueue.songs,
        volume: serverQueue.volume,
        loop: serverQueue.loop,
        channelId: serverQueue.voiceChannel?.id
    });
});
app.post('/api/music/control', async (req, res) => {
    const { action, value, guildId } = req.body;
    const targetGuildId = guildId || process.env.GUILD_ID;
    if (!targetGuildId)
        return res.json({ error: 'No guild id provided' });
    const serverQueue = music_1.queue.get(targetGuildId);
    if (!serverQueue)
        return res.json({ success: false, error: 'Brak aktywnej kolejki' });
    try {
        if (action === 'pause')
            serverQueue.player.pause();
        else if (action === 'resume')
            serverQueue.player.unpause();
        else if (action === 'skip')
            serverQueue.player.stop();
        else if (action === 'stop') {
            serverQueue.songs = [];
            serverQueue.player.stop();
        }
        else if (action === 'loop')
            serverQueue.loop = !serverQueue.loop;
        else if (action === 'volume' && typeof value === 'number') {
            let vol = Math.max(10, Math.min(200, value));
            serverQueue.volume = vol;
            serverQueue.resource?.volume?.setVolume(vol / 100);
        }
        res.json({ success: true });
    }
    catch (e) {
        res.json({ success: false, error: String(e) });
    }
});
const play_dl_1 = __importDefault(require("play-dl"));
play_dl_1.default.getFreeClientID().then((clientID) => {
    play_dl_1.default.setToken({
        soundcloud: {
            client_id: clientID
        }
    });
}).catch(console.error);
client.login(process.env.DISCORD_TOKEN);
app.listen(PORT, () => {
    console.log(`Bot internal API server running on port ${PORT}`);
});
