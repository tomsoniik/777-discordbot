import { Client, ChatInputCommandInteraction, SlashCommandBuilder, TextChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const configPath = path.join(__dirname, '..', 'unturnedConfig.json');

function loadConfig() {
    try {
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
    } catch (e) {
        console.error('Blad ladowania unturnedConfig.json', e);
    }
    return { defaultChannelId: null };
}

function saveConfig(config: any) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

let unturnedConfig = loadConfig();

const PREDEFINED_SERVERS: Record<string, { ip: string, port: number, serverId?: string, displayName?: string }> = {
    'washington': { ip: '94.130.219.164', port: 27116, serverId: '85568392925775084', displayName: 'Washington x100' },
    'arena': { ip: '83.143.81.182', port: 2484, serverId: '85568392926801330', displayName: 'Arena' },
    'california': { ip: '39.96.7.81', port: 27015, serverId: '85568392935729730', displayName: 'California x100' },
    'germany': { ip: '176.57.173.170', port: 28100, serverId: '85568392925775498', displayName: 'Germany x100' },
    'pei': { ip: '193.169.209.214', port: 20004, serverId: '85568392925775497', displayName: 'PEI x100' },
    'russia': { ip: '43.167.189.221', port: 27015, serverId: '85568392925719569', displayName: 'Russia x100' },
    'arid': { ip: '0.0.0.0', port: 0, serverId: '85568392932897412', displayName: 'Arid' },
    'polaris': { ip: '0.0.0.0', port: 0, serverId: '85568392930289951', displayName: 'A6 Polaris' }
};

export const unturnedCommands = [
    new SlashCommandBuilder()
        .setName('track')
        .setDescription('Rozpocznij śledzenie gracza na serwerze Unturned')
        .addStringOption(option => 
            option.setName('steamid')
                .setDescription('Link do profilu Steam, vanity URL lub SteamID64')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('server')
                .setDescription('Wybierz gotowy serwer Unbeaten')
                .addChoices(
                    { name: 'Wszystkie serwery (All)', value: 'all' },
                    { name: 'Washington x100', value: 'washington' },
                    { name: 'Arena', value: 'arena' },
                    { name: 'California x100', value: 'california' },
                    { name: 'Germany x100', value: 'germany' },
                    { name: 'PEI x100', value: 'pei' },
                    { name: 'Russia x100', value: 'russia' },
                    { name: 'Arid', value: 'arid' },
                    { name: 'A6 Polaris', value: 'polaris' }
                )
                .setRequired(false)),
    new SlashCommandBuilder()
        .setName('untrack')
        .setDescription('Zatrzymaj śledzenie gracza')
        .addStringOption(option => 
            option.setName('steamid')
                .setDescription('Link do profilu Steam, vanity URL lub SteamID64')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('tracked_list')
        .setDescription('Pokaż listę obecnie śledzonych graczy z bazy danych'),
    new SlashCommandBuilder()
        .setName('trackconfig')
        .setDescription('Ustaw domyślny kanał dla powiadomień')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('Domyślny kanał')
                .setRequired(true))
];

async function resolveSteamId(rawInput: string): Promise<string | null> {
    const apiKey = process.env.STEAM_API_KEY;
    if (!apiKey) return null;

    let input = rawInput.trim();
    
    // Szukamy SteamID64 (długi ciąg cyfr zaczynający się od 7656119)
    const match64 = input.match(/(7656119[0-9]{10})/);
    if (match64) return match64[0];

    // Szukamy vanity URL, np. /id/nazwa
    let vanity = input;
    const matchId = input.match(/\/id\/([^\/\?]+)/);
    if (matchId) {
        vanity = matchId[1];
    } else {
        const parts = input.split('/').filter(p => p.length > 0);
        vanity = parts[parts.length - 1]; // np. sam "nazwa"
    }

    try {
        const res = await fetch(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${apiKey}&vanityurl=${vanity}`);
        const data: any = await res.json();
        if (data.response && data.response.success === 1) {
            return data.response.steamid;
        }
    } catch (e) {
        console.error('Błąd ResolveVanityURL:', e);
    }
    
    return null;
}

export async function handleUnturnedInteraction(interaction: ChatInputCommandInteraction) {
    if (interaction.commandName === 'trackconfig') {
        const channel = interaction.options.getChannel('channel', true);
        unturnedConfig.defaultChannelId = channel.id;
        saveConfig(unturnedConfig);
        return interaction.reply({ content: `Domyślny kanał powiadomień ustawiony na <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
    }

    if (!process.env.STEAM_API_KEY) {
        return interaction.reply({ content: 'Brak STEAM_API_KEY w konfiguracji bota!', flags: MessageFlags.Ephemeral });
    }

    if (interaction.commandName === 'track') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
        const rawInput = interaction.options.getString('steamid', true);
        const serverChoice = interaction.options.getString('server') || 'all';
        
        const steamId = await resolveSteamId(rawInput);
        if (!steamId) {
            return interaction.editReply('Nie udało się rozwiązać SteamID z podanego wejścia. Podaj poprawny SteamID64 lub link do profilu publicznego.');
        }

        let channelId = unturnedConfig.defaultChannelId;
        if (!channelId) {
            unturnedConfig.defaultChannelId = interaction.channelId;
            saveConfig(unturnedConfig);
            channelId = interaction.channelId;
        }

        const existing = await prisma.trackedPlayer.findUnique({ where: { steamId } });
        let privacyWarning = '';
        try {
            const apiKey = process.env.STEAM_API_KEY;
            const res = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`);
            const data: any = await res.json();
            const player = data.response?.players?.[0];
            if (player && player.communityvisibilitystate !== 3) {
                privacyWarning = '\n\n⚠️ **OSTRZEŻENIE:** Ten profil Steam jest **Prywatny** (lub ma ukryte szczegóły gry). System nie będzie w stanie go śledzić przez Steam API.';
            }
        } catch (e) {}

        const targetName = serverChoice === 'all' ? 'wszystkich zapisanych serwerach' : `serwerze ${PREDEFINED_SERVERS[serverChoice]?.displayName}`;
        
        if (existing && existing.isActive) {
            await prisma.trackedPlayer.update({ where: { steamId }, data: { targetServer: serverChoice, addedBy: interaction.user.id } });
            return interaction.editReply(`Zaktualizowano śledzenie gracza \`${steamId}\` na **${targetName}**!${privacyWarning}`);
        }

        await prisma.trackedPlayer.upsert({
            where: { steamId },
            update: { isActive: true, targetServer: serverChoice, addedBy: interaction.user.id, isOnline: false, lastServer: null },
            create: { steamId, targetServer: serverChoice, addedBy: interaction.user.id, isOnline: false, lastServer: null }
        });

        await interaction.editReply(`Rozpoczęto śledzenie SteamID: \`${steamId}\` na **${targetName}**!${privacyWarning}`);
    } 
    
    else if (interaction.commandName === 'untrack') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
        const rawInput = interaction.options.getString('steamid', true);
        const steamId = await resolveSteamId(rawInput) || rawInput; // fallback
        
        const updated = await prisma.trackedPlayer.updateMany({
            where: { steamId, isActive: true },
            data: { isActive: false }
        });

        if (updated.count > 0) {
            return interaction.editReply(`Zatrzymano śledzenie SteamID **${steamId}** w bazie danych.`);
        } else {
            return interaction.editReply(`SteamID **${steamId}** nie jest obecnie śledzony.`);
        }
    }
    
    else if (interaction.commandName === 'tracked_list') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
        const activeTrackers = await prisma.trackedPlayer.findMany({ where: { isActive: true } });
        
        if (activeTrackers.length === 0) {
            return interaction.editReply('Obecnie nie śledzę żadnych graczy.');
        }

        const embeds: EmbedBuilder[] = [];
        
        const mainEmbed = new EmbedBuilder()
            .setTitle('📡 Lista Śledzonych Graczy')
            .setColor('#7289da')
            .setDescription(`Obecnie sprawdzam serwery w poszukiwaniu **${activeTrackers.length}** graczy.`);
        embeds.push(mainEmbed);

        // Fetch ich danych do wyświetlenia (bierzemy pierwsze 9)
        const steamIds = activeTrackers.slice(0, 9).map((t: any) => t.steamId);
        
        if (steamIds.length > 0) {
            try {
                const res = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamIds.join(',')}`);
                const data: any = await res.json();
                const players = data.response?.players || [];
                
                for (const player of players) {
                    const embed = new EmbedBuilder()
                        .setColor('#2b2d31')
                        .setAuthor({ 
                            name: player.personaname || player.steamid, 
                            iconURL: player.avatarfull, 
                            url: player.profileurl 
                        })
                        .setDescription(`Identyfikator: \`${player.steamid}\``);
                    embeds.push(embed);
                }
            } catch (e) {
                console.error(e);
            }
        }
        
        if (activeTrackers.length > 9) {
            embeds.push(new EmbedBuilder().setColor('#2b2d31').setDescription(`*...i ${activeTrackers.length - 9} innych w bazie (limit wyświetlania)*`));
        }

        await interaction.editReply({ embeds });
    }
}

// Globalny Pętla Śledząca (uruchamiana w index.ts)
export function startTrackingLoop(client: Client) {
    console.log('✅ Uruchomiono globalną pętlę śledzenia graczy (Prisma + Steam API).');
    
    setInterval(async () => {
        try {
            const apiKey = process.env.STEAM_API_KEY;
            if (!apiKey) return;

            const trackers = await prisma.trackedPlayer.findMany({ where: { isActive: true } });
            if (trackers.length === 0) return;
            
            const steamIds = trackers.map((t: any) => t.steamId);
            
            // Dzielimy na paczki po 100 SteamID (limit API)
            const chunks = [];
            for (let i = 0; i < steamIds.length; i += 100) {
                chunks.push(steamIds.slice(i, i + 100));
            }

            for (const chunk of chunks) {
                const res = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${chunk.join(',')}`);
                const data: any = await res.json();
                const players = data.response?.players || [];

                for (const player of players) {
                    const tracker = trackers.find((t: any) => t.steamId === player.steamid);
                    if (!tracker) continue;

                    const isPlayingUnturned = player.gameextrainfo === 'Unturned' || player.gameid === '304930';
                    const currentIp = player.gameserverip;
                    const currentLobby = player.lobbysteamid;
                    
                    const handleOffline = async () => {
                        if (tracker.isOnline) {
                            await prisma.trackedPlayer.update({ where: { steamId: player.steamid }, data: { isOnline: false, lastServer: null } });
                            const channelId = unturnedConfig.defaultChannelId;
                            if (channelId) {
                                const channel = client.channels.cache.get(channelId);
                                if (channel && channel.isTextBased() && 'send' in channel) {
                                    const embed = new EmbedBuilder()
                                        .setTitle('👋 GRACZ OPUŚCIŁ SERWER')
                                        .setDescription(`Gracz **[${player.personaname || player.steamid}](${player.profileurl})** opuścił serwer.`)
                                        .setColor('#aaaaaa')
                                        .setTimestamp();
                                    await channel.send({ embeds: [embed] });
                                }
                            }
                        }
                    };

                    // Jeśli w ogóle nie jest w grze z widocznym lobby lub IP, ignorujemy
                    if (!isPlayingUnturned && !currentIp && !currentLobby) {
                        await handleOffline();
                        continue;
                    }

                    let found = false;
                    let foundServerName = 'Nieznany Serwer';
                    let foundIpPort = currentLobby || currentIp || '';

                    const targets = tracker.targetServer && tracker.targetServer !== 'all' 
                        ? [PREDEFINED_SERVERS[tracker.targetServer]] 
                        : Object.values(PREDEFINED_SERVERS);
                    
                    for (const target of targets) {
                        if (!target) continue;
                        
                        // Sprawdzamy czy IP pasuje LUB czy LobbyID pasuje (SDR fallback)
                        const isOnlineOnSteam = (currentIp && currentIp === `${target.ip}:${target.port}`) || 
                                                (currentLobby && target.serverId && currentLobby === target.serverId);

                        if (isOnlineOnSteam) {
                            found = true;
                            foundServerName = target.displayName || 'Unturned Server';
                            foundIpPort = currentLobby || currentIp || `${target.ip}:${target.port}`;
                            break;
                        }
                    }

                    // Jeśli target to ALL i jesteśmy pewni że w coś gra (ale nie wiemy co to za serwer bo nie mamy go na liście)
                    if (!found && (currentIp || currentLobby) && tracker.targetServer === 'all') {
                        found = true;
                        foundServerName = player.gameextrainfo || 'Serwer (Wykryty ze Steam API)';
                        foundIpPort = currentLobby || currentIp;
                    }

                    if (found) {
                        // Jeśli wciąż na tym samym serwerze (po IP/LobbyID), to kontynuujemy bez spamu!
                        if (tracker.isOnline && tracker.lastServer === foundIpPort) continue;

                        let mapName = 'Nieznana';
                        let playersInfo = 'Brak danych';
                        
                        try {
                            const targetServerConfig = Object.values(PREDEFINED_SERVERS).find(s => 
                                (s.serverId && s.serverId === foundIpPort) || `${s.ip}:${s.port}` === foundIpPort
                            );
                            
                            const ipToQuery = targetServerConfig ? `${targetServerConfig.ip}:${targetServerConfig.port}` : foundIpPort;
                            
                            if (ipToQuery.includes(':')) {
                                const serverRes = await fetch(`https://api.steampowered.com/IGameServersService/GetServerList/v1/?key=${apiKey}&filter=\\gameaddr\\${ipToQuery}`);
                                const serverData: any = await serverRes.json();
                                if (serverData.response?.servers && serverData.response.servers.length > 0) {
                                    const srv = serverData.response.servers[0];
                                    mapName = srv.map || mapName;
                                    playersInfo = `${srv.players}/${srv.max_players}`;
                                    if (srv.name) {
                                        foundServerName = srv.name;
                                    }
                                }
                            }
                        } catch (e) {
                            console.error('Błąd pobierania danych Master Server:', e);
                        }

                        // Zapis do historii w bazie danych
                        await prisma.playerHistory.create({
                            data: {
                                steamId: player.steamid,
                                nickname: player.personaname || player.steamid,
                                serverIp: foundIpPort,
                                serverName: foundServerName
                            }
                        });

                        // Aktualizacja statusu na ONLINE (Tryb Radarowy - NIE WYŁĄCZAMY śledzenia)
                        await prisma.trackedPlayer.update({
                            where: { steamId: player.steamid },
                            data: { isOnline: true, lastServer: foundIpPort }
                        });

                        // Alert Discord
                        const channelId = unturnedConfig.defaultChannelId;
                        if (channelId) {
                            const channel = client.channels.cache.get(channelId);
                            if (channel && channel.isTextBased() && 'send' in channel) {
                                const embed = new EmbedBuilder()
                                    .setTitle('🚨 ALARM ŚLEDZENIA (DOŁĄCZYŁ) 🚨')
                                    .setDescription(`Gracz **[${player.personaname || player.steamid}](${player.profileurl})** został wykryty w grze!`)
                                    .setThumbnail(player.avatarfull)
                                    .setColor('#ff0000')
                                    .addFields(
                                        { name: 'Serwer', value: `\`${foundServerName}\``, inline: false },
                                        { name: 'Mapa', value: `\`${mapName}\``, inline: true },
                                        { name: 'Graczy', value: `\`${playersInfo}\``, inline: true },
                                        { name: 'Szybkie Dołączenie', value: foundIpPort.match(/^\d+$/) ? `Kliknij w link:\nhttps://join.unbeaten.gg/${foundIpPort}` : `Wklej w przeglądarkę:\n\`steam://run/304930//+connect%20${foundIpPort}\``, inline: false }
                                    )
                                    .setTimestamp();

                                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                                    new ButtonBuilder()
                                        .setLabel('🚀 Dołącz do gry')
                                        .setStyle(ButtonStyle.Link)
                                        .setURL(foundIpPort.match(/^\d+$/) ? `https://join.unbeaten.gg/${foundIpPort}` : `https://777-discordbot-tomsoncs.vercel.app/api/join?ip=${foundIpPort}`)
                                );

                                await channel.send({ 
                                    content: '@everyone', 
                                    embeds: [embed],
                                    components: [row]
                                });
                            }
                        }
                    } else {
                        // Jeśli nie ma go na naszym serwerze
                        await handleOffline();
                    }
                }
            }
        } catch (error) {
            console.error('Błąd pętli śledzenia graczy:', error);
        }
    }, 60000); // 60 sekund
}
