import { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

client.once('ready', () => {
    console.log(`Bot logged in as ${client.user?.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.content === '!ticketsetup' && message.member?.permissions.has('Administrator')) {
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Stwórz Ticket (Aplikuj)')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`${WEB_URL}/apply`)
            );

        await message.channel.send({
            content: 'Kliknij poniższy przycisk, aby przejść do panelu rekrutacji i wypełnić formularz logując się przez Steam:',
            components: [row]
        });
    }
});

// Endpoint odbierający sygnały z backendu / strony
app.post('/api/notify', async (req, res) => {
    const { discordId, formId } = req.body;
    
    // Szukanie gildii (dla uproszczenia z ENV)
    const guildId = process.env.GUILD_ID;
    if (!guildId) return res.status(500).json({ error: 'Missing GUILD_ID in env' });
    
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

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
    } catch (error) {
        console.error('Error assigning role or notifying admins:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

client.login(process.env.DISCORD_TOKEN);

app.listen(PORT, () => {
    console.log(`Bot internal API server running on port ${PORT}`);
});
