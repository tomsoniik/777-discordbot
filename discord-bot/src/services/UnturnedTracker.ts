import { logger } from '../utils/logger';
import { Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { prisma } from '../utils/db';
import { ENV } from '../config/env';
import { ShadowNetwork } from './ShadowNetwork';
import { A2SQuery } from './A2SQuery';

export const PREDEFINED_SERVERS: Record<string, { ip: string; port: number; serverId?: string; displayName?: string }> =
    {
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

export class UnturnedTracker {
    private client: Client;
    private interval: NodeJS.Timeout | null = null;

    constructor(client: Client) {
        this.client = client;
    }

    public start() {
        logger.info(
            '✅ Uruchomiono ulepszoną hybrydową pętlę śledzenia graczy (Steam API + ShadowNetwork Multi-Node).',
        );

        this.trackIteration();
        this.interval = setInterval(async () => {
            await this.trackIteration();
        }, 30000); // 30 sekund
    }

    public stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    private async trackIteration() {
        try {
            const apiKey = ENV.STEAM_API_KEY;
            if (!apiKey) return;

            const trackers = await prisma.trackedPlayer.findMany({ where: { isActive: true } });
            const shadowNodes = await prisma.playerNode.findMany({ take: 500 });

            // Łączymy SteamID śledzonych graczy z powiązanymi węzłami z ShadowNetwork
            const setOfSteamIds = new Set<string>();
            trackers.forEach((t) => setOfSteamIds.add(t.steamId));
            shadowNodes.forEach((n) => setOfSteamIds.add(n.steamId));

            const allSteamIds = Array.from(setOfSteamIds);
            if (allSteamIds.length === 0) {
                this.client.user?.setActivity({ name: `Radar: 0 graczy`, type: 4 });
                return;
            }

            // Automatyczne budowanie siatki znajomych dla śledzonych graczy
            for (const t of trackers) {
                await ShadowNetwork.scrapeFriends(t.steamId);
            }

            // Dzielimy na paczki po 100 SteamID (limit Steam Web API)
            const chunks = [];
            for (let i = 0; i < allSteamIds.length; i += 100) {
                chunks.push(allSteamIds.slice(i, i + 100));
            }

            for (const chunk of chunks) {
                const res = await fetch(
                    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${chunk.join(',')}`,
                );
                
                if (!res.ok) {
                    logger.warn(`Błąd Steam API GetPlayerSummaries: ${res.status}`);
                    continue;
                }

                const data: any = await res.json();
                const players = data.response?.players || [];

                for (const player of players) {
                    const isTrackedTarget = trackers.some((t: any) => t.steamId === player.steamid);
                    const tracker = trackers.find((t: any) => t.steamId === player.steamid);

                    const isPlayingUnturned = player.gameextrainfo === 'Unturned' || player.gameid === '304930';
                    const currentIp = player.gameserverip;
                    const currentLobby = player.lobbysteamid;

                    let detectedServerId: string | null = null;

                    // Rozpoznawanie serwera Unbeaten z danych Steam API
                    if (currentLobby || (currentIp && !currentIp.startsWith('169.254.'))) {
                        for (const target of Object.values(PREDEFINED_SERVERS)) {
                            const matchesLobby = currentLobby && target.serverId && currentLobby === target.serverId;
                            const matchesIp = currentIp && currentIp === `${target.ip}:${target.port}`;

                            if (matchesLobby || matchesIp) {
                                detectedServerId = target.serverId || `${target.ip}:${target.port}`;
                                break;
                            }
                        }
                    }

                    // Zapisujemy/aktualizujemy pozycję w PlayerNode (dla całej sieci ShadowNetwork)
                    if (player.personaname || detectedServerId) {
                        await prisma.playerNode.upsert({
                            where: { steamId: player.steamid },
                            update: {
                                lastNickname: player.personaname || undefined,
                                lastServer: detectedServerId || (isPlayingUnturned ? 'Unturned' : null),
                                lastSeenAt: new Date(),
                            },
                            create: {
                                steamId: player.steamid,
                                lastNickname: player.personaname,
                                lastServer: detectedServerId || (isPlayingUnturned ? 'Unturned' : null),
                            },
                        });
                    }

                    if (!isTrackedTarget || !tracker) continue;

                    const handleOffline = async () => {
                        if (tracker.isOnline) {
                            await prisma.trackedPlayer.update({
                                where: { steamId: player.steamid },
                                data: { isOnline: false, lastServer: null },
                            });
                            const settings = await prisma.botSettings.findUnique({ where: { id: 1 } });
                            const channelId = settings?.defaultChannelId;
                            if (channelId) {
                                const channel = this.client.channels.cache.get(channelId);
                                if (channel && channel.isTextBased() && 'send' in channel) {
                                    const embed = new EmbedBuilder()
                                        .setTitle('👋 GRACZ OPUŚCIŁ SERWER')
                                        .setDescription(
                                            `Gracz **[${player.personaname || player.steamid}](${player.profileurl})** opuścił serwer.`,
                                        )
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
                    let matchedServerConfig:
                        { ip: string; port: number; serverId?: string; displayName?: string } | undefined = undefined;

                    // 1. Sprawdzenie czy gracz przebywa na jednym z zdefiniowanych serwerów Unbeaten
                    if (currentLobby || (currentIp && !currentIp.startsWith('169.254.'))) {
                        const targets =
                            tracker.targetServer && tracker.targetServer !== 'all'
                                ? [PREDEFINED_SERVERS[tracker.targetServer]]
                                : Object.values(PREDEFINED_SERVERS);

                        for (const target of targets) {
                            if (!target) continue;

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
                        const targets =
                            tracker.targetServer && tracker.targetServer !== 'all'
                                ? [PREDEFINED_SERVERS[tracker.targetServer]]
                                : Object.values(PREDEFINED_SERVERS);

                        for (const target of targets) {
                            if (!target) continue;

                            const serverStatus = await A2SQuery.getServerStatus(
                                target.ip,
                                target.port,
                                target.serverId,
                            );
                            if (serverStatus && serverStatus.players.length > 0) {
                                const isPlayerInList = serverStatus.players.some((p) =>
                                    p.name && player.personaname
                                        ? p.name.toLowerCase() === player.personaname.toLowerCase()
                                        : false,
                                );

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

                    // 3. Heurystyczne skanowanie siatki znajomych (ShadowNetwork) dla w pełni prywatnych profili
                    let heuristicConfidence = 0;
                    if (!found) {
                        const relations = await prisma.playerRelation.findMany({
                            where: {
                                OR: [{ steamIdA: player.steamid }, { steamIdB: player.steamid }],
                            },
                        });

                        const friendIds = relations.map((r) =>
                            r.steamIdA === player.steamid ? r.steamIdB : r.steamIdA,
                        );

                        if (friendIds.length > 0) {
                            const onlineFriends = await prisma.playerNode.findMany({
                                where: {
                                    steamId: { in: friendIds },
                                    lastServer: { not: null, notIn: ['Unturned'] },
                                    lastSeenAt: { gte: new Date(Date.now() - 3 * 60 * 1000) },
                                },
                            });

                            if (onlineFriends.length > 0) {
                                const serverCounts: Record<string, number> = {};
                                for (const friend of onlineFriends) {
                                    if (!friend.lastServer) continue;
                                    serverCounts[friend.lastServer] = (serverCounts[friend.lastServer] || 0) + 1;
                                }

                                let bestServer = '';
                                let maxCount = 0;
                                for (const [srv, count] of Object.entries(serverCounts)) {
                                    if (count > maxCount) {
                                        maxCount = count;
                                        bestServer = srv;
                                    }
                                }

                                if (maxCount >= 1 && bestServer) {
                                    const target = Object.values(PREDEFINED_SERVERS).find(
                                        (s) => s.serverId === bestServer || `${s.ip}:${s.port}` === bestServer,
                                    );

                                    if (target) {
                                        found = true;
                                        matchedServerConfig = target;
                                        foundServerName = target.displayName || 'Unturned Server';
                                        foundIpPort = target.serverId || `${target.ip}:${target.port}`;
                                        heuristicConfidence = maxCount;
                                    }
                                }
                            }
                        }
                    }

                    if (found) {
                        if (tracker.isOnline && tracker.lastServer === foundIpPort) continue;

                        const isServerChange = tracker.isOnline && tracker.lastServer !== foundIpPort;
                        let mapName = 'Nieznana';
                        let playersInfo = 'Brak danych';

                        try {
                            let qIp = matchedServerConfig?.ip || '0.0.0.0';
                            let qPort = matchedServerConfig?.port || 0;
                            let qServerId = matchedServerConfig?.serverId || (foundIpPort.includes(':') ? undefined : foundIpPort);

                            if ((!matchedServerConfig || qIp === '0.0.0.0') && foundIpPort.includes(':')) {
                                const parts = foundIpPort.split(':');
                                qIp = parts[0];
                                qPort = parseInt(parts[1], 10) || 0;
                                qServerId = undefined;
                            }

                            const serverInfo = await A2SQuery.getServerStatus(qIp, qPort, qServerId);

                            if (serverInfo) {
                                mapName = serverInfo.map || mapName;
                                playersInfo = `${serverInfo.playersCount}/${serverInfo.maxPlayers}`;
                                if (serverInfo.serverName && !foundServerName.includes('Unbeaten')) {
                                    foundServerName = matchedServerConfig?.displayName || serverInfo.serverName;
                                }
                            }
                        } catch (e) {
                            logger.error(e as Error, 'Błąd pobierania danych serwera A2S/Master:');
                        }

                        await prisma.playerHistory.create({
                            data: {
                                steamId: player.steamid,
                                nickname: player.personaname || player.steamid,
                                serverIp: foundIpPort,
                                serverName: foundServerName,
                            },
                        });

                        await prisma.trackedPlayer.update({
                            where: { steamId: player.steamid },
                            data: { isOnline: true, lastServer: foundIpPort },
                        });

                        const settings = await prisma.botSettings.findUnique({ where: { id: 1 } });
                        const channelId = settings?.defaultChannelId;
                        if (channelId) {
                            const channel = this.client.channels.cache.get(channelId);
                            if (channel && channel.isTextBased() && 'send' in channel) {
                                const title = isServerChange
                                    ? '🔄 ALARM ŚLEDZENIA (ZMIANA SERWERA) 🔄'
                                    : '🚨 ALARM ŚLEDZENIA (DOŁĄCZYŁ) 🚨';

                                const displayTitle =
                                    heuristicConfidence > 0
                                        ? `📡 RADAR HEURYSTYCZNY ${isServerChange ? '(ZMIANA)' : '(WYKRYCIE)'} 📡`
                                        : title;

                                const desc = isServerChange
                                    ? `Gracz **[${player.personaname || player.steamid}](${player.profileurl})** zmienił serwer!`
                                    : `Gracz **[${player.personaname || player.steamid}](${player.profileurl})** został wykryty w grze!`;

                                const displayDesc =
                                    heuristicConfidence > 0
                                        ? `⚠️ **Wykrycie z prawdopodobieństwem!** Gracz ma całkowicie ukryty profil (Prywatny), ale **${heuristicConfidence} jego znajomych** gra obecnie na tym serwerze, więc na 99% gra razem z nimi!\n\n` +
                                          desc
                                        : desc;

                                const embed = new EmbedBuilder()
                                    .setTitle(displayTitle)
                                    .setDescription(displayDesc)
                                    .setThumbnail(player.avatarfull)
                                    .setColor(
                                        heuristicConfidence > 0 ? '#9900ff' : isServerChange ? '#ffaa00' : '#ff0000',
                                    )
                                    .addFields(
                                        { name: 'Serwer', value: `\`${foundServerName}\``, inline: false },
                                        { name: 'Mapa', value: `\`${mapName}\``, inline: true },
                                        { name: 'Graczy', value: `\`${playersInfo}\``, inline: true },
                                        {
                                            name: 'Szybkie Dołączenie',
                                            value: foundIpPort.match(/^\d+$/)
                                                ? `Kliknij w link:\nhttps://join.unbeaten.gg/${foundIpPort}`
                                                : `Wklej w przeglądarkę:\n\`steam://run/304930//+connect%20${foundIpPort}\``,
                                            inline: false,
                                        },
                                    )
                                    .setTimestamp();

                                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                                    new ButtonBuilder()
                                        .setLabel('🚀 Dołącz do gry')
                                        .setStyle(ButtonStyle.Link)
                                        .setURL(
                                            foundIpPort.match(/^\d+$/)
                                                ? `https://join.unbeaten.gg/${foundIpPort}`
                                                : `https://777-discordbot-tomsoncs.vercel.app/api/join?ip=${foundIpPort}`,
                                        ),
                                );

                                await channel.send({
                                    content: '@everyone',
                                    embeds: [embed],
                                    components: [row],
                                });
                            }
                        }
                    } else {
                        await handleOffline();
                    }
                }
            }

            const activeOnline = await prisma.trackedPlayer.findMany({ where: { isActive: true, isOnline: true } });
            const activeCount = trackers.length;
            const onlineCount = activeOnline.length;

            this.client.user?.setActivity({
                name: `Radar: ${activeCount} graczy | 🔴 Online: ${onlineCount}`,
                type: 4,
            });
        } catch (error) {
            logger.error(error as Error, 'Błąd pętli śledzenia graczy:');
        }
    }
}
