import { logger } from '../utils/logger';
import express from 'express';
import cors from 'cors';
import { Client } from 'discord.js';
import { ENV } from '../config/env';

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
            logger.error(error as Error, 'Error assigning role or notifying admins:');
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.listen(ENV.PORT, () => {
        logger.info(`Bot internal API server running on port ${ENV.PORT}`);
    });
}
