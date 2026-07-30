import { logger } from '../utils/logger';
import express from 'express';
import cors from 'cors';
import { Client } from 'discord.js';
import { ENV } from '../config/env';
import { useQueue } from 'discord-player';

export function setupApi(client: Client) {
    const app = express();
    app.use(cors());
    app.use(express.json());

    app.post('/api/notify', async (req, res) => {
        const { discordId, formId } = req.body;
        const guildId = ENV.GUILD_ID;

        if (!guildId) return res.status(500).json({ error: 'Missing GUILD_ID in env' });

        const guild = client.guilds.cache.get(guildId);
        if (!guild) return res.status(404).json({ error: 'Guild not found' });

        try {
            const member = await guild.members.fetch(discordId);
            const roleId = ENV.WAITING_ROLE_ID;

            if (roleId) {
                await member.roles.add(roleId);
                logger.info(`Assigned role ${roleId} to user ${discordId}`);
            }

            const adminChannelId = ENV.ADMIN_CHANNEL_ID;
            if (adminChannelId) {
                const channel = guild.channels.cache.get(adminChannelId);
                if (channel && channel.isTextBased() && 'send' in channel) {
                    await channel.send(`Nowy formularz od <@${discordId}>! Link: ${ENV.WEB_URL}/admin/forms/${formId}`);
                }
            }

            res.json({ success: true });
        } catch (error) {
            logger.error('Error assigning role or notifying admins:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/api/music/status', (req, res) => {
        const guildId = (req.query.guildId as string) || ENV.GUILD_ID;
        if (!guildId) return res.json({ error: 'No guild id provided' });

        const serverQueue = useQueue(guildId);
        if (!serverQueue) {
            return res.json({ playing: false, songs: [], volume: 100, loop: false });
        }
        res.json({
            playing: serverQueue.isPlaying(),
            songs: serverQueue.tracks.toArray().map((t: any) => ({ title: t.title, url: t.url, author: t.author })),
            volume: serverQueue.node.volume,
            loop: serverQueue.repeatMode !== 0,
            channelId: serverQueue.channel?.id,
        });
    });

    app.post('/api/music/control', async (req, res) => {
        const { action, value, guildId } = req.body;
        const targetGuildId = guildId || ENV.GUILD_ID;
        if (!targetGuildId) return res.json({ error: 'No guild id provided' });

        const serverQueue = useQueue(targetGuildId);
        if (!serverQueue) return res.json({ success: false, error: 'Brak aktywnej kolejki' });

        try {
            if (action === 'pause') serverQueue.node.pause();
            else if (action === 'resume') serverQueue.node.resume();
            else if (action === 'skip') serverQueue.node.skip();
            else if (action === 'stop') serverQueue.delete();
            else if (action === 'loop') {
                serverQueue.setRepeatMode(serverQueue.repeatMode === 0 ? 1 : 0);
            } else if (action === 'volume' && typeof value === 'number') {
                const vol = Math.max(0, Math.min(200, value));
                serverQueue.node.setVolume(vol);
            }
            res.json({ success: true });
        } catch (e) {
            res.json({ success: false, error: String(e) });
        }
    });

    app.listen(ENV.PORT, () => {
        logger.info(`Bot internal API server running on port ${ENV.PORT}`);
    });
}
