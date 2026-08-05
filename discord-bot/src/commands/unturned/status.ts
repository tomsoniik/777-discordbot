import { logger } from '../../utils/logger';
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { PREDEFINED_SERVERS } from '../../services/UnturnedTracker';
import { A2SQuery } from '../../services/A2SQuery';

export const statusCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Sprawdź aktualny status i liczbę graczy na wszystkich serwerach Unbeaten'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const embed = new EmbedBuilder()
                .setTitle('🌐 Status Serwerów Unturned')
                .setColor('#1db954')
                .setDescription('Aktualna liczba graczy i stan serwerów w czasie rzeczywistym:')
                .setTimestamp();

            let totalPlayers = 0;
            let onlineServersCount = 0;

            for (const [key, server] of Object.entries(PREDEFINED_SERVERS)) {
                const status = await A2SQuery.getServerStatus(server.ip, server.port, server.serverId);

                const displayName = server.displayName || key.toUpperCase();

                if (status) {
                    onlineServersCount++;
                    totalPlayers += status.playersCount;

                    embed.addFields({
                        name: `🟢 ${displayName}`,
                        value: `Graczy: **${status.playersCount}/${status.maxPlayers}** | Mapa: \`${status.map}\`\n🔗 \`https://join.unbeaten.gg/${status.ipPort}\``,
                        inline: false,
                    });
                } else {
                    embed.addFields({
                        name: `🔴 ${displayName}`,
                        value: `Brak odpowiedzi lub serwer offline`,
                        inline: false,
                    });
                }
            }

            embed.setFooter({
                text: `Aktywne serwery: ${onlineServersCount}/${Object.keys(PREDEFINED_SERVERS).length} | Łącznie graczy: ${totalPlayers}`,
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (e) {
            logger.error(e as Error, 'Błąd podczas wykonywania komendy /status:');
            await interaction.editReply('❌ Wystąpił błąd podczas pobierania statusu serwerów.');
        }
    },
};
