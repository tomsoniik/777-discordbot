"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupApi = setupApi;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("../config/env");
function setupApi(client) {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.post('/api/notify', async (req, res) => {
        const { discordId, formId } = req.body;
        const guildId = env_1.ENV.GUILD_ID;
        if (!guildId)
            return res.status(500).json({ error: 'Missing GUILD_ID in env' });
        const guild = client.guilds.cache.get(guildId);
        if (!guild)
            return res.status(404).json({ error: 'Guild not found' });
        try {
            const member = await guild.members.fetch(discordId);
            const roleId = env_1.ENV.WAITING_ROLE_ID;
            if (roleId) {
                await member.roles.add(roleId);
                console.log(`Assigned role ${roleId} to user ${discordId}`);
            }
            const adminChannelId = env_1.ENV.ADMIN_CHANNEL_ID;
            if (adminChannelId) {
                const channel = guild.channels.cache.get(adminChannelId);
                if (channel && channel.isTextBased() && 'send' in channel) {
                    await channel.send(`Nowy formularz od <@${discordId}>! Link: ${env_1.ENV.WEB_URL}/admin/forms/${formId}`);
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
        const guildId = req.query.guildId || env_1.ENV.GUILD_ID;
        if (!guildId)
            return res.json({ error: 'No guild id provided' });
        const { useQueue } = require('discord-player');
        const serverQueue = useQueue(guildId);
        if (!serverQueue) {
            return res.json({ playing: false, songs: [], volume: 100, loop: false });
        }
        res.json({
            playing: serverQueue.isPlaying(),
            songs: serverQueue.tracks.toArray().map((t) => ({ title: t.title, url: t.url, author: t.author })),
            volume: serverQueue.node.volume,
            loop: serverQueue.repeatMode !== 0,
            channelId: serverQueue.channel?.id
        });
    });
    app.post('/api/music/control', async (req, res) => {
        const { action, value, guildId } = req.body;
        const targetGuildId = guildId || env_1.ENV.GUILD_ID;
        if (!targetGuildId)
            return res.json({ error: 'No guild id provided' });
        const { useQueue } = require('discord-player');
        const serverQueue = useQueue(targetGuildId);
        if (!serverQueue)
            return res.json({ success: false, error: 'Brak aktywnej kolejki' });
        try {
            if (action === 'pause')
                serverQueue.node.pause();
            else if (action === 'resume')
                serverQueue.node.resume();
            else if (action === 'skip')
                serverQueue.node.skip();
            else if (action === 'stop')
                serverQueue.delete();
            else if (action === 'loop') {
                serverQueue.setRepeatMode(serverQueue.repeatMode === 0 ? 1 : 0);
            }
            else if (action === 'volume' && typeof value === 'number') {
                let vol = Math.max(0, Math.min(200, value));
                serverQueue.node.setVolume(vol);
            }
            res.json({ success: true });
        }
        catch (e) {
            res.json({ success: false, error: String(e) });
        }
    });
    app.listen(env_1.ENV.PORT, () => {
        console.log(`Bot internal API server running on port ${env_1.ENV.PORT}`);
    });
}
