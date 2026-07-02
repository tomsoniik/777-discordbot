import { Client, ChatInputCommandInteraction, SlashCommandBuilder, TextChannel } from 'discord.js';
import { GameDig } from 'gamedig';

// Maps a player name to the interval ID so we can stop tracking later if needed
const activeTrackers: Map<string, NodeJS.Timeout> = new Map();

const PREDEFINED_SERVERS: Record<string, { ip: string, port: number }> = {
    'washington': { ip: '94.130.219.164', port: 27116 },
    'arena': { ip: '83.143.81.182', port: 2484 },
    'california': { ip: '39.96.7.81', port: 27015 },
    'germany': { ip: '176.57.173.170', port: 28100 },
    'pei': { ip: '193.169.209.214', port: 20004 },
    'russia': { ip: '43.167.189.221', port: 27015 }
};

export const unturnedCommands = [
    new SlashCommandBuilder()
        .setName('track')
        .setDescription('Rozpocznij śledzenie gracza na serwerze Unturned')
        .addStringOption(option => 
            option.setName('steamid')
                .setDescription('SteamID gracza do śledzenia')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('server')
                .setDescription('Wybierz gotowy serwer Unbeaten')
                .addChoices(
                    { name: 'Washington x100', value: 'washington' },
                    { name: 'Arena', value: 'arena' },
                    { name: 'California x100', value: 'california' },
                    { name: 'Germany x100', value: 'germany' },
                    { name: 'PEI x100', value: 'pei' },
                    { name: 'Russia x100', value: 'russia' }
                )
                .setRequired(false))
        .addStringOption(option => 
            option.setName('ip')
                .setDescription('Lub podaj własny adres IP')
                .setRequired(false))
        .addIntegerOption(option => 
            option.setName('port')
                .setDescription('Port serwera (domyślnie 27015)')
                .setRequired(false))
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('Kanał, na który wysłać powiadomienie')
                .setRequired(false)),
    new SlashCommandBuilder()
        .setName('untrack')
        .setDescription('Zatrzymaj śledzenie gracza')
        .addStringOption(option => 
            option.setName('steamid')
                .setDescription('SteamID gracza')
                .setRequired(true))
];

export async function handleUnturnedInteraction(interaction: ChatInputCommandInteraction) {
    if (interaction.commandName === 'track') {
        const steamId = interaction.options.getString('steamid', true);
        const serverChoice = interaction.options.getString('server');
        const customIp = interaction.options.getString('ip');
        const customPort = interaction.options.getInteger('port') || 27015;
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        let ip = customIp;
        let port = customPort;

        if (serverChoice && PREDEFINED_SERVERS[serverChoice]) {
            ip = PREDEFINED_SERVERS[serverChoice].ip;
            port = PREDEFINED_SERVERS[serverChoice].port;
        }

        if (!ip) {
            return interaction.reply({ content: 'Musisz wybrać serwer z listy lub podać własne IP!', ephemeral: true });
        }

        if (!channel || !(channel instanceof TextChannel)) {
            return interaction.reply({ content: 'Nieprawidłowy kanał.', ephemeral: true });
        }

        const trackingKey = `${steamId}-${ip}:${port}`;
        if (activeTrackers.has(trackingKey)) {
            return interaction.reply({ content: `Już śledzę gracza o SteamID **${steamId}** na serwerze ${ip}:${port}.`, ephemeral: true });
        }

        await interaction.reply({ content: `Rozpoczęto śledzenie SteamID **${steamId}** na serwerze ${ip}:${port}. Powiadomienie zostanie wysłane na kanał <#${channel.id}>.`, ephemeral: true });

        const intervalId = setInterval(async () => {
            try {
                const state = await GameDig.query({
                    type: 'unturned',
                    host: ip,
                    port: port
                });

                // Note: Standard A2S queries (GameDig) usually do not return SteamID.
                // We check p.name as fallback, or p.raw.steamid if available in future
                const isOnline = state.players.some((p: any) => 
                    p.name?.includes(steamId) || 
                    (p.raw && p.raw.steamid === steamId)
                );

                if (isOnline) {
                    await channel.send(`🚨 **Alarm Śledzenia** 🚨\nGracz o SteamID **${steamId}** został wykryty na serwerze **${state.name}** (${ip}:${port})!`);
                    
                    // Stop tracking once found
                    clearInterval(intervalId);
                    activeTrackers.delete(trackingKey);
                }
            } catch (error) {
                console.error(`Błąd podczas odpytywania serwera ${ip}:${port} dla SteamID ${steamId}:`, error);
            }
        }, 60000); // Sprawdzanie co 60 sekund

        activeTrackers.set(trackingKey, intervalId);
    } 
    else if (interaction.commandName === 'untrack') {
        const steamId = interaction.options.getString('steamid', true);
        
        let found = false;
        for (const [key, intervalId] of activeTrackers.entries()) {
            if (key.startsWith(`${steamId}-`)) {
                clearInterval(intervalId);
                activeTrackers.delete(key);
                found = true;
            }
        }

        if (found) {
            await interaction.reply({ content: `Zatrzymano śledzenie SteamID **${steamId}**.`, ephemeral: true });
        } else {
            await interaction.reply({ content: `SteamID **${steamId}** nie jest obecnie śledzony.`, ephemeral: true });
        }
    }
}
