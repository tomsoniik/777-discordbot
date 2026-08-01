"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playersCommand = void 0;
const logger_1 = require("../../utils/logger");
const discord_js_1 = require("discord.js");
const UnturnedTracker_1 = require("../../services/UnturnedTracker");
const gamedig_1 = require("gamedig");
const A2SQuery_1 = require("../../services/A2SQuery");
const db_1 = require("../../utils/db");
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
            let playerList = [];
            let maxPlayers = 0;
            // 1. Obejście Anti-DDoS A2S: Używamy zapytań A2S_PLAYER bez paczek requestRules
            if (ip !== '0.0.0.0' && port !== 0) {
                const portsToTry = [port, port + 1, port - 1, 27015, 27016, 27116, 27117];
                for (const p of portsToTry) {
                    try {
                        const state = await gamedig_1.GameDig.query({
                            type: 'unturned',
                            host: ip,
                            port: p,
                            maxRetries: 2,
                            requestRules: false,
                        });
                        maxPlayers = state.maxplayers;
                        const extracted = state.players
                            .map((player) => player.name)
                            .filter((name) => name && name.trim() !== '');
                        if (extracted.length > 0) {
                            playerList = extracted;
                            break;
                        }
                    }
                    catch (_) {
                        // Próbuj kolejny port
                    }
                }
            }
            // 2. Korelacja ze Śledzonymi Graczymi i Siecią ShadowNetwork w Bazie Danych
            const targetServerId = serverConfig?.serverId || (serverChoice.includes(':') ? serverChoice : undefined);
            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
            // Wykrywamy graczy w bazie po powiązanym serverId lub IP
            const activeNodesOnServer = await db_1.prisma.playerNode.findMany({
                where: {
                    lastServer: targetServerId || { contains: ip },
                    lastSeenAt: { gte: fifteenMinutesAgo },
                },
            });
            const trackedOnlineOnServer = await db_1.prisma.trackedPlayer.findMany({
                where: {
                    isActive: true,
                    isOnline: true,
                    lastServer: targetServerId || { contains: ip },
                },
            });
            const trackedSteamIds = new Set(trackedOnlineOnServer.map((t) => t.steamId));
            for (const node of activeNodesOnServer) {
                const isTracked = trackedSteamIds.has(node.steamId);
                const prefix = isTracked ? '🎯 [Śledzony]' : '👤';
                const nameToAdd = `${prefix} ${node.lastNickname || node.steamId}`;
                if (!playerList.some((p) => p.includes(node.lastNickname || node.steamId))) {
                    playerList.push(nameToAdd);
                }
            }
            // 3. Pobranie metadanych z Steam Master Server API
            const serverStatus = await A2SQuery_1.A2SQuery.getServerStatus(ip, port, serverConfig?.serverId);
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(`👥 Lista graczy: ${displayName}`)
                .setColor('#1db954')
                .setTimestamp();
            if (serverStatus) {
                embed.addFields({ name: 'Mapa', value: `\`${serverStatus.map}\``, inline: true }, {
                    name: 'Liczba graczy',
                    value: `\`${serverStatus.playersCount}/${serverStatus.maxPlayers || maxPlayers || '?'}\``,
                    inline: true,
                });
            }
            if (playerList.length > 0) {
                const chunks = [];
                for (let i = 0; i < playerList.length; i += 25) {
                    chunks.push(playerList.slice(i, i + 25).join('\n'));
                }
                chunks.forEach((chunk, index) => {
                    embed.addFields({
                        name: `Wykryci gracze (${index + 1}/${chunks.length})`,
                        value: chunk || 'Brak nazw',
                    });
                });
                embed.setFooter({
                    text: `Wykryto ${playerList.length} z ${serverStatus?.playersCount || playerList.length} graczy via Steam Web API & ShadowNetwork.`,
                });
            }
            else {
                embed.setDescription(`⚠️ **Detekcja w toku**\n\nSerwer **${displayName}** odpowiada (Graczy online: **${serverStatus?.playersCount || 0}**).\n\nSiatka **ShadowNetwork** uczy się i skanuje powiązania Steam. Dodaj więcej graczy do radarów poprzez \`/track\`, aby bot automatycznie budował pełne listy graczy!`);
            }
            await interaction.editReply({ embeds: [embed] });
        }
        catch (e) {
            logger_1.logger.error(e, 'Błąd komendy /players:');
            await interaction.editReply('❌ Nie udało się pobrać listy graczy dla tego serwera.');
        }
    },
};
