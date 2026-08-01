"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusCommand = void 0;
const logger_1 = require("../../utils/logger");
const discord_js_1 = require("discord.js");
const UnturnedTracker_1 = require("../../services/UnturnedTracker");
const A2SQuery_1 = require("../../services/A2SQuery");
exports.statusCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('status')
        .setDescription('Sprawdź aktualny status i liczbę graczy na wszystkich serwerach Unbeaten'),
    execute: async (interaction) => {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        try {
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('🌐 Status Serwerów Unturned')
                .setColor('#1db954')
                .setDescription('Aktualna liczba graczy i stan serwerów w czasie rzeczywistym:')
                .setTimestamp();
            let totalPlayers = 0;
            let onlineServersCount = 0;
            for (const [key, server] of Object.entries(UnturnedTracker_1.PREDEFINED_SERVERS)) {
                const status = await A2SQuery_1.A2SQuery.getServerStatus(server.ip, server.port, server.serverId);
                const displayName = server.displayName || key.toUpperCase();
                if (status) {
                    onlineServersCount++;
                    totalPlayers += status.playersCount;
                    embed.addFields({
                        name: `🟢 ${displayName}`,
                        value: `Graczy: **${status.playersCount}/${status.maxPlayers}** | Mapa: \`${status.map}\`\n🔗 \`https://join.unbeaten.gg/${status.ipPort}\``,
                        inline: false,
                    });
                }
                else {
                    embed.addFields({
                        name: `🔴 ${displayName}`,
                        value: `Brak odpowiedzi lub serwer offline`,
                        inline: false,
                    });
                }
            }
            embed.setFooter({
                text: `Aktywne serwery: ${onlineServersCount}/${Object.keys(UnturnedTracker_1.PREDEFINED_SERVERS).length} | Łącznie graczy: ${totalPlayers}`,
            });
            await interaction.editReply({ embeds: [embed] });
        }
        catch (e) {
            logger_1.logger.error(e, 'Błąd podczas wykonywania komendy /status:');
            await interaction.editReply('❌ Wystąpił błąd podczas pobierania statusu serwerów.');
        }
    },
};
