"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playersCommand = void 0;
const logger_1 = require("../../utils/logger");
const discord_js_1 = require("discord.js");
const UnturnedTracker_1 = require("../../services/UnturnedTracker");
const gamedig_1 = require("gamedig");
const A2SQuery_1 = require("../../services/A2SQuery");
exports.playersCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('players')
        .setDescription('Wyświetl pełną listę graczy online na wskazanym serwerze')
        .addStringOption((option) => option
        .setName('server')
        .setDescription('Wybierz serwer z listy lub podaj IP:port')
        .setRequired(true)
        .addChoices({ name: 'Washington x100', value: 'washington' }, { name: 'Arena', value: 'arena' }, { name: 'California x100', value: 'california' }, { name: 'Germany x100', value: 'germany' }, { name: 'PEI x100', value: 'pei' }, { name: 'Russia x100', value: 'russia' }, { name: 'Arid', value: 'arid' }, { name: 'A6 Polaris', value: 'polaris' })),
    execute: async (interaction) => {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const serverChoice = interaction.options.getString('server', true);
        const serverConfig = UnturnedTracker_1.PREDEFINED_SERVERS[serverChoice];
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
            let playerList = [];
            let maxPlayers = 0;
            if (ip !== '0.0.0.0' && port !== 0) {
                const portsToTry = [port, port + 1, port + 2];
                for (const p of portsToTry) {
                    try {
                        const state = await gamedig_1.GameDig.query({
                            type: 'unturned',
                            host: ip,
                            port: p,
                            maxRetries: 1,
                            requestRules: true,
                        });
                        maxPlayers = state.maxplayers;
                        playerList = state.players
                            .map((player) => player.name)
                            .filter((name) => name && name.trim() !== '');
                        if (playerList.length > 0)
                            break;
                    }
                    catch (_) {
                        // Próbuj kolejny port
                    }
                }
            }
            // Zapytanie fallback via Steam Master Server status
            const serverStatus = await A2SQuery_1.A2SQuery.getServerStatus(ip, port, serverConfig?.serverId);
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(`👥 Lista graczy: ${displayName}`)
                .setColor('#1db954')
                .setTimestamp();
            if (serverStatus) {
                embed.addFields({ name: 'Mapa', value: `\`${serverStatus.map}\``, inline: true }, {
                    name: 'Liczba graczy',
                    value: `\`${playerList.length || serverStatus.playersCount}/${serverStatus.maxPlayers || maxPlayers || '?'}\``,
                    inline: true,
                });
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
            }
            else {
                embed.setDescription(`⚠️ **Brak szczegółowych nicków graczy**\n\nSerwer jest aktywny (Graczy online: **${serverStatus?.playersCount || 0}**), ale zapora Anti-DDoS serwera ukrywa bezpośrednią listę nazw na porcie A2S UDP.`);
            }
            await interaction.editReply({ embeds: [embed] });
        }
        catch (e) {
            logger_1.logger.error(e, 'Błąd komendy /players:');
            await interaction.editReply('❌ Nie udało się pobrać listy graczy dla tego serwera.');
        }
    },
};
