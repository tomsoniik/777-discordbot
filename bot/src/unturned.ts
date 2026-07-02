import { Client, ChatInputCommandInteraction, SlashCommandBuilder, TextChannel } from 'discord.js';
import { GameDig } from 'gamedig';

// Maps a player name to the interval ID so we can stop tracking later if needed
const activeTrackers: Map<string, NodeJS.Timeout> = new Map();

export const unturnedCommands = [
    new SlashCommandBuilder()
        .setName('track')
        .setDescription('Rozpocznij śledzenie gracza na serwerze Unturned')
        .addStringOption(option => 
            option.setName('steamid')
                .setDescription('SteamID gracza do śledzenia')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('ip')
                .setDescription('Adres IP serwera')
                .setRequired(true))
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
        const ip = interaction.options.getString('ip', true);
        const port = interaction.options.getInteger('port') || 27015;
        const channel = interaction.options.getChannel('channel') || interaction.channel;

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
