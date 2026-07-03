"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnturnedTracker = exports.PREDEFINED_SERVERS = void 0;
const discord_js_1 = require("discord.js");
const db_1 = require("../utils/db");
const env_1 = require("../config/env");
const ShadowNetwork_1 = require("./ShadowNetwork");
exports.PREDEFINED_SERVERS = {
    'washington': { ip: '94.130.219.164', port: 27116, serverId: '85568392925775084', displayName: 'Washington x100' },
    'arena': { ip: '83.143.81.182', port: 2484, serverId: '85568392926801330', displayName: 'Arena' },
    'california': { ip: '39.96.7.81', port: 27015, serverId: '85568392935729730', displayName: 'California x100' },
    'germany': { ip: '176.57.173.170', port: 28100, serverId: '85568392925775498', displayName: 'Germany x100' },
    'pei': { ip: '193.169.209.214', port: 20004, serverId: '85568392925775497', displayName: 'PEI x100' },
    'russia': { ip: '43.167.189.221', port: 27015, serverId: '85568392925719569', displayName: 'Russia x100' },
    'arid': { ip: '0.0.0.0', port: 0, serverId: '85568392932897412', displayName: 'Arid' },
    'polaris': { ip: '0.0.0.0', port: 0, serverId: '85568392930289951', displayName: 'A6 Polaris' }
};
class UnturnedTracker {
    client;
    interval = null;
    constructor(client) {
        this.client = client;
    }
    start() {
        console.log('✅ Uruchomiono globalną pętlę śledzenia graczy (Prisma + Steam API).');
        this.interval = setInterval(async () => {
            await this.trackIteration();
        }, 60000); // 60 sekund
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
            // Dzielimy na paczki po 100 SteamID (limit API)
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
                    const isPlayingUnturned = player.gameextrainfo === 'Unturned' || player.gameid === '304930';
                    const currentIp = player.gameserverip;
                    const currentLobby = player.lobbysteamid;
                    const handleOffline = async () => {
                        if (tracker.isOnline) {
                            await db_1.prisma.trackedPlayer.update({ where: { steamId: player.steamid }, data: { isOnline: false, lastServer: null } });
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
                    if (!isPlayingUnturned && !currentIp && !currentLobby) {
                        await handleOffline();
                        continue;
                    }
                    let found = false;
                    let foundServerName = 'Nieznany Serwer';
                    let foundIpPort = currentLobby || currentIp || '';
                    const targets = tracker.targetServer && tracker.targetServer !== 'all'
                        ? [exports.PREDEFINED_SERVERS[tracker.targetServer]]
                        : Object.values(exports.PREDEFINED_SERVERS);
                    for (const target of targets) {
                        if (!target)
                            continue;
                        const isOnlineOnSteam = (currentIp && currentIp === `${target.ip}:${target.port}`) ||
                            (currentLobby && target.serverId && currentLobby === target.serverId);
                        if (isOnlineOnSteam) {
                            found = true;
                            foundServerName = target.displayName || 'Unturned Server';
                            foundIpPort = currentLobby || currentIp || `${target.ip}:${target.port}`;
                            break;
                        }
                    }
                    if (!found && (currentIp || currentLobby) && tracker.targetServer === 'all') {
                        found = true;
                        foundServerName = player.gameextrainfo || 'Serwer (Wykryty ze Steam API)';
                        foundIpPort = currentLobby || currentIp;
                    }
                    if (found) {
                        if (tracker.isOnline && tracker.lastServer === foundIpPort)
                            continue;
                        let mapName = 'Nieznana';
                        let playersInfo = 'Brak danych';
                        try {
                            const targetServerConfig = Object.values(exports.PREDEFINED_SERVERS).find(s => (s.serverId && s.serverId === foundIpPort) || `${s.ip}:${s.port}` === foundIpPort);
                            const ipToQuery = targetServerConfig ? `${targetServerConfig.ip}:${targetServerConfig.port}` : foundIpPort;
                            if (ipToQuery && ipToQuery.includes(':')) {
                                const serverRes = await fetch(`https://api.steampowered.com/IGameServersService/GetServerList/v1/?key=${apiKey}&filter=\\gameaddr\\${ipToQuery}`);
                                const serverData = await serverRes.json();
                                if (serverData.response?.servers && serverData.response.servers.length > 0) {
                                    const srv = serverData.response.servers[0];
                                    mapName = srv.map || mapName;
                                    playersInfo = `${srv.players}/${srv.max_players}`;
                                    if (srv.name) {
                                        foundServerName = srv.name;
                                    }
                                }
                            }
                        }
                        catch (e) {
                            console.error('Błąd pobierania danych Master Server:', e);
                        }
                        await db_1.prisma.playerHistory.create({
                            data: {
                                steamId: player.steamid,
                                nickname: player.personaname || player.steamid,
                                serverIp: foundIpPort,
                                serverName: foundServerName
                            }
                        });
                        await db_1.prisma.trackedPlayer.update({
                            where: { steamId: player.steamid },
                            data: { isOnline: true, lastServer: foundIpPort }
                        });
                        const settings = await db_1.prisma.botSettings.findUnique({ where: { id: 1 } });
                        const channelId = settings?.defaultChannelId;
                        if (channelId) {
                            const channel = this.client.channels.cache.get(channelId);
                            if (channel && channel.isTextBased() && 'send' in channel) {
                                const embed = new discord_js_1.EmbedBuilder()
                                    .setTitle('🚨 ALARM ŚLEDZENIA (DOŁĄCZYŁ) 🚨')
                                    .setDescription(`Gracz **[${player.personaname || player.steamid}](${player.profileurl})** został wykryty w grze!`)
                                    .setThumbnail(player.avatarfull)
                                    .setColor('#ff0000')
                                    .addFields({ name: 'Serwer', value: `\`${foundServerName}\``, inline: false }, { name: 'Mapa', value: `\`${mapName}\``, inline: true }, { name: 'Graczy', value: `\`${playersInfo}\``, inline: true }, { name: 'Szybkie Dołączenie', value: foundIpPort.match(/^\d+$/) ? `Kliknij w link:\nhttps://join.unbeaten.gg/${foundIpPort}` : `Wklej w przeglądarkę:\n\`steam://run/304930//+connect%20${foundIpPort}\``, inline: false })
                                    .setTimestamp();
                                const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                                    .setLabel('🚀 Dołącz do gry')
                                    .setStyle(discord_js_1.ButtonStyle.Link)
                                    .setURL(foundIpPort.match(/^\d+$/) ? `https://join.unbeaten.gg/${foundIpPort}` : `https://777-discordbot-tomsoncs.vercel.app/api/join?ip=${foundIpPort}`));
                                await channel.send({
                                    content: '@everyone',
                                    embeds: [embed],
                                    components: [row]
                                });
                            }
                        }
                    }
                    else {
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
            console.error('Błąd pętli śledzenia graczy:', error);
        }
    }
}
exports.UnturnedTracker = UnturnedTracker;
