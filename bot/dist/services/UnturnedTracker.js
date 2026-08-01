"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnturnedTracker = exports.PREDEFINED_SERVERS = void 0;
const logger_1 = require("../utils/logger");
const discord_js_1 = require("discord.js");
const db_1 = require("../utils/db");
const env_1 = require("../config/env");
const ShadowNetwork_1 = require("./ShadowNetwork");
const A2SQuery_1 = require("./A2SQuery");
exports.PREDEFINED_SERVERS = {
    washington: {
        ip: '94.130.219.164',
        port: 27116,
        serverId: '85568392925775084',
        displayName: 'Washington x100',
    },
    arena: { ip: '83.143.81.182', port: 2484, serverId: '85568392926801330', displayName: 'Arena' },
    california: { ip: '39.96.7.81', port: 27015, serverId: '85568392935729730', displayName: 'California x100' },
    germany: { ip: '176.57.173.170', port: 28100, serverId: '85568392925775498', displayName: 'Germany x100' },
    pei: { ip: '193.169.209.214', port: 20004, serverId: '85568392925775497', displayName: 'PEI x100' },
    russia: { ip: '43.167.189.221', port: 27015, serverId: '85568392925719569', displayName: 'Russia x100' },
    arid: { ip: '0.0.0.0', port: 0, serverId: '85568392932897412', displayName: 'Arid' },
    polaris: { ip: '0.0.0.0', port: 0, serverId: '85568392930289951', displayName: 'A6 Polaris' },
};
class UnturnedTracker {
    client;
    interval = null;
    constructor(client) {
        this.client = client;
    }
    start() {
        logger_1.logger.info('✅ Uruchomiono ulepszoną hybrydową pętlę śledzenia graczy (Steam API + A2S Anti-DDoS Bypass).');
        this.trackIteration();
        this.interval = setInterval(async () => {
            await this.trackIteration();
        }, 30000); // 30 sekund
    }
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    async trackIteration() {
        try {
            const apiKey = env_1.ENV.STEAM_API_KEY;
            if (!apiKey)
                return;
            const trackers = await db_1.prisma.trackedPlayer.findMany({ where: { isActive: true } });
            if (trackers.length === 0) {
                this.client.user?.setActivity({ name: `Radar: 0 graczy`, type: 4 });
                return;
            }
            const steamIds = trackers.map((t) => t.steamId);
            // Dzielimy na paczki po 100 SteamID (limit Steam Web API)
            const chunks = [];
            for (let i = 0; i < steamIds.length; i += 100) {
                chunks.push(steamIds.slice(i, i + 100));
            }
            for (const chunk of chunks) {
                const res = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${chunk.join(',')}`);
                const data = await res.json();
                const players = data.response?.players || [];
                for (const player of players) {
                    const tracker = trackers.find((t) => t.steamId === player.steamid);
                    if (!tracker)
                        continue;
                    // Zapisujemy/aktualizujemy ostatni nick w Shadow Network
                    if (player.personaname) {
                        await db_1.prisma.playerNode.upsert({
                            where: { steamId: player.steamid },
                            update: { lastNickname: player.personaname, lastSeenAt: new Date() },
                            create: { steamId: player.steamid, lastNickname: player.personaname },
                        });
                    }
                    const isPlayingUnturned = player.gameextrainfo === 'Unturned' || player.gameid === '304930';
                    const currentIp = player.gameserverip;
                    const currentLobby = player.lobbysteamid;
                    const handleOffline = async () => {
                        if (tracker.isOnline) {
                            await db_1.prisma.trackedPlayer.update({
                                where: { steamId: player.steamid },
                                data: { isOnline: false, lastServer: null },
                            });
                            const settings = await db_1.prisma.botSettings.findUnique({ where: { id: 1 } });
                            const channelId = settings?.defaultChannelId;
                            if (channelId) {
                                const channel = this.client.channels.cache.get(channelId);
                                if (channel && channel.isTextBased() && 'send' in channel) {
                                    const embed = new discord_js_1.EmbedBuilder()
                                        .setTitle('👋 GRACZ OPUŚCIŁ SERWER')
                                        .setDescription(`Gracz **[${player.personaname || player.steamid}](${player.profileurl})** opuścił serwer.`)
                                        .setColor('#aaaaaa')
                                        .setTimestamp();
                                    await channel.send({ embeds: [embed] });
                                }
                            }
                        }
                    };
                    let found = false;
                    let foundServerName = 'Unturned Server';
                    let foundIpPort = currentLobby || currentIp || '';
                    let matchedServerConfig = undefined;
                    // 1. Sprawdzenie czy gracz przebywa na jednym z zdefiniowanych serwerów Unbeaten
                    if (currentLobby || (currentIp && !currentIp.startsWith('169.254.'))) {
                        const targets = tracker.targetServer && tracker.targetServer !== 'all'
                            ? [exports.PREDEFINED_SERVERS[tracker.targetServer]]
                            : Object.values(exports.PREDEFINED_SERVERS);
                        for (const target of targets) {
                            if (!target)
                                continue;
                            const matchesLobby = currentLobby && target.serverId && currentLobby === target.serverId;
                            const matchesIp = currentIp && currentIp === `${target.ip}:${target.port}`;
                            if (matchesLobby || matchesIp) {
                                found = true;
                                matchedServerConfig = target;
                                foundServerName = target.displayName || 'Unturned Server';
                                foundIpPort = target.serverId || `${target.ip}:${target.port}`;
                                break;
                            }
                        }
                        if (!found && (currentIp || currentLobby) && tracker.targetServer === 'all') {
                            found = true;
                            foundServerName = player.gameextrainfo || 'Serwer (Steam API)';
                            foundIpPort = currentLobby || currentIp;
                        }
                    }
                    // 2. Jeśli gracz jest połączony przez SDR (169.254.x.x) bez jawnego lobby ID, szukamy go po nicku
                    if (!found && isPlayingUnturned && currentIp && currentIp.startsWith('169.254.')) {
                        const targets = tracker.targetServer && tracker.targetServer !== 'all'
                            ? [exports.PREDEFINED_SERVERS[tracker.targetServer]]
                            : Object.values(exports.PREDEFINED_SERVERS);
                        for (const target of targets) {
                            if (!target)
                                continue;
                            const serverStatus = await A2SQuery_1.A2SQuery.getServerStatus(target.ip, target.port, target.serverId);
                            if (serverStatus && serverStatus.players.length > 0) {
                                const isPlayerInList = serverStatus.players.some((p) => p.name && player.personaname
                                    ? p.name.toLowerCase() === player.personaname.toLowerCase()
                                    : false);
                                if (isPlayerInList) {
                                    found = true;
                                    matchedServerConfig = target;
                                    foundServerName = target.displayName || serverStatus.serverName;
                                    foundIpPort = target.serverId || `${target.ip}:${target.port}`;
                                    break;
                                }
                            }
                        }
                    }
                    if (found) {
                        // Jeśli gracz jest już zarejestrowany na TYM SAMYM serwerze, nic nie wysyłamy (brak spamu)
                        if (tracker.isOnline && tracker.lastServer === foundIpPort)
                            continue;
                        const isServerChange = tracker.isOnline && tracker.lastServer !== foundIpPort;
                        let mapName = 'Nieznana';
                        let playersInfo = 'Brak danych';
                        try {
                            const qIp = matchedServerConfig?.ip || '0.0.0.0';
                            const qPort = matchedServerConfig?.port || 0;
                            const qServerId = matchedServerConfig?.serverId || (foundIpPort.includes(':') ? undefined : foundIpPort);
                            const serverInfo = await A2SQuery_1.A2SQuery.getServerStatus(qIp, qPort, qServerId);
                            if (serverInfo) {
                                mapName = serverInfo.map || mapName;
                                playersInfo = `${serverInfo.playersCount}/${serverInfo.maxPlayers}`;
                                if (serverInfo.serverName && !foundServerName.includes('Unbeaten')) {
                                    foundServerName = matchedServerConfig?.displayName || serverInfo.serverName;
                                }
                            }
                        }
                        catch (e) {
                            logger_1.logger.error(e, 'Błąd pobierania danych serwera A2S/Master:');
                        }
                        await db_1.prisma.playerHistory.create({
                            data: {
                                steamId: player.steamid,
                                nickname: player.personaname || player.steamid,
                                serverIp: foundIpPort,
                                serverName: foundServerName,
                            },
                        });
                        await db_1.prisma.trackedPlayer.update({
                            where: { steamId: player.steamid },
                            data: { isOnline: true, lastServer: foundIpPort },
                        });
                        const settings = await db_1.prisma.botSettings.findUnique({ where: { id: 1 } });
                        const channelId = settings?.defaultChannelId;
                        if (channelId) {
                            const channel = this.client.channels.cache.get(channelId);
                            if (channel && channel.isTextBased() && 'send' in channel) {
                                const title = isServerChange
                                    ? '🔄 ALARM ŚLEDZENIA (ZMIANA SERWERA) 🔄'
                                    : '🚨 ALARM ŚLEDZENIA (DOŁĄCZYŁ) 🚨';
                                const desc = isServerChange
                                    ? `Gracz **[${player.personaname || player.steamid}](${player.profileurl})** zmienił serwer!`
                                    : `Gracz **[${player.personaname || player.steamid}](${player.profileurl})** został wykryty w grze!`;
                                const embed = new discord_js_1.EmbedBuilder()
                                    .setTitle(title)
                                    .setDescription(desc)
                                    .setThumbnail(player.avatarfull)
                                    .setColor(isServerChange ? '#ffaa00' : '#ff0000')
                                    .addFields({ name: 'Serwer', value: `\`${foundServerName}\``, inline: false }, { name: 'Mapa', value: `\`${mapName}\``, inline: true }, { name: 'Graczy', value: `\`${playersInfo}\``, inline: true }, {
                                    name: 'Szybkie Dołączenie',
                                    value: foundIpPort.match(/^\d+$/)
                                        ? `Kliknij w link:\nhttps://join.unbeaten.gg/${foundIpPort}`
                                        : `Wklej w przeglądarkę:\n\`steam://run/304930//+connect%20${foundIpPort}\``,
                                    inline: false,
                                })
                                    .setTimestamp();
                                const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                                    .setLabel('🚀 Dołącz do gry')
                                    .setStyle(discord_js_1.ButtonStyle.Link)
                                    .setURL(foundIpPort.match(/^\d+$/)
                                    ? `https://join.unbeaten.gg/${foundIpPort}`
                                    : `https://777-discordbot-tomsoncs.vercel.app/api/join?ip=${foundIpPort}`));
                                await channel.send({
                                    content: '@everyone',
                                    embeds: [embed],
                                    components: [row],
                                });
                            }
                        }
                    }
                    else {
                        // Jeśli nie wykryto gracza na żadnym serwerze (wyszedł z gry / z serwera)
                        await handleOffline();
                    }
                }
            }
            // ECHO-TRACKER: Analiza grupowych powiązań po zebraniu danych ze wszystkich chunków
            const activeOnline = await db_1.prisma.trackedPlayer.findMany({ where: { isActive: true, isOnline: true } });
            // Mapowanie IP/Lobby -> Lista graczy tam grających
            const locationMap = new Map();
            for (const t of activeOnline) {
                if (t.lastServer) {
                    const group = locationMap.get(t.lastServer) || [];
                    group.push(t.steamId);
                    locationMap.set(t.lastServer, group);
                }
            }
            // Zapisywanie spotkań (Encounters) dla grup graczy >= 2
            for (const [location, group] of locationMap.entries()) {
                if (group.length >= 2) {
                    for (let i = 0; i < group.length; i++) {
                        for (let j = i + 1; j < group.length; j++) {
                            await ShadowNetwork_1.ShadowNetwork.recordEncounter(group[i], group[j], location);
                        }
                    }
                }
            }
            const activeCount = trackers.length;
            const onlineCount = activeOnline.length;
            this.client.user?.setActivity({
                name: `Radar: ${activeCount} graczy | 🔴 Online: ${onlineCount}`,
                type: 4,
            });
        }
        catch (error) {
            logger_1.logger.error(error, 'Błąd pętli śledzenia graczy:');
        }
    }
}
exports.UnturnedTracker = UnturnedTracker;
