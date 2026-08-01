import { logger } from '../../utils/logger';
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { PREDEFINED_SERVERS } from '../../services/UnturnedTracker';
import { GameDig } from 'gamedig';
import { A2SQuery } from '../../services/A2SQuery';

export const playersCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('players')
        .setDescription('Wyświetl pełną listę graczy online na wskazanym serwerze')
        .addStringOption((option) =>
            option
                .setName('server')
                .setDescription('Wybierz serwer z listy lub podaj IP:port')
                .setRequired(true)
                .addChoices(
                    { name: 'Washington x100', value: 'washington' },
                    { name: 'Arena', value: 'arena' },
                    { name: 'California x100', value: 'california' },
                    { name: 'Germany x100', value: 'germany' },
                    { name: 'PEI x100', value: 'pei' },
                    { name: 'Russia x100', value: 'russia' },
                    { name: 'Arid', value: 'arid' },
                    { name: 'A6 Polaris', value: 'polaris' },
                ),
        ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const serverChoice = interaction.options.getString('server', true);
        const serverConfig = PREDEFINED_SERVERS[serverChoice];

        let ip = serverConfig?.ip || '0.0.0.0';
        let port = serverConfig?.port || 0;
        let displayName = serverConfig?.displayName || serverChoice;

        if (serverChoice.includes(':')) {
            const parts = serverChoice.split(':');
            ip = parts[0];
            port = parseInt(parts[1], 10) || 0;
            displayName = serverChoice;
        }

        try {
            // Próbujemy pobrać listę przez GameDig A2S UDP
            let playerList: string[] = [];
            let maxPlayers = 0;

            if (ip !== '0.0.0.0' && port !== 0) {
                const portsToTry = [port, port + 1, port + 2];
                for (const p of portsToTry) {
                    try {
                        const state = await GameDig.query({
                            type: 'unturned',
                            host: ip,
                            port: p,
                            maxRetries: 1,
                            requestRules: true,
                        });

                        maxPlayers = state.maxplayers;
                        playerList = state.players
                            .map((player: any) => player.name)
                            .filter((name: any) => name && name.trim() !== '');

                        if (playerList.length > 0) break;
                    } catch (_) {
                        // Próbuj kolejny port
                    }
                }
            }

            // Zapytanie fallback via Steam Master Server status
            const serverStatus = await A2SQuery.getServerStatus(ip, port, serverConfig?.serverId);

            const embed = new EmbedBuilder()
                .setTitle(`👥 Lista graczy: ${displayName}`)
                .setColor('#1db954')
                .setTimestamp();

            if (serverStatus) {
                embed.addFields(
                    { name: 'Mapa', value: `\`${serverStatus.map}\``, inline: true },
                    {
                        name: 'Liczba graczy',
                        value: `\`${playerList.length || serverStatus.playersCount}/${serverStatus.maxPlayers || maxPlayers || '?'}\``,
                        inline: true,
                    },
                );
            }

            if (playerList.length > 0) {
                // Dzielimy na porcje po 40 nicków na pole Embed (limit znaków w Discordzie)
                const chunks = [];
                for (let i = 0; i < playerList.length; i += 30) {
                    chunks.push(playerList.slice(i, i + 30).join(', '));
                }

                chunks.forEach((chunk, index) => {
                    embed.addFields({
                        name: `Lista graczy (część ${index + 1})`,
                        value: chunk || 'Brak nazw',
                    });
                });
            } else {
                embed.setDescription(
                    `⚠️ **Brak szczegółowych nicków graczy**\n\nSerwer jest aktywny (Graczy online: **${serverStatus?.playersCount || 0}**), ale zapora Anti-DDoS serwera ukrywa bezpośrednią listę nazw na porcie A2S UDP.`,
                );
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (e) {
            logger.error(e as Error, 'Błąd komendy /players:');
            await interaction.editReply('❌ Nie udało się pobrać listy graczy dla tego serwera.');
        }
    },
};
