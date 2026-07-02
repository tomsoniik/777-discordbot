import { Client, ChatInputCommandInteraction, SlashCommandBuilder, TextChannel, EmbedBuilder } from 'discord.js';
import { GameDig } from 'gamedig';
import fs from 'fs';
import path from 'path';

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

async function fetchSteamProfile(steamId: string) {
    try {
        let url = `https://steamcommunity.com/profiles/${steamId}`;
        if (steamId.match(/^[a-zA-Z0-9_-]+$/) && !steamId.match(/^\d+$/)) {
             // To prawdopodobnie custom URL (vanity)
             url = `https://steamcommunity.com/id/${steamId}`;
        }
        
        const res = await fetch(url);
        const html = await res.text();
        const nameMatch = html.match(/<title>Steam Community :: (.+?)<\/title>/);
        const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
        
        let serverIpAndPort = null;
        const connectMatch = html.match(/steam:\/\/(?:connect|joinlobby\/\d+)\/([0-9\.:]+)/);
        if (connectMatch) {
            serverIpAndPort = connectMatch[1];
        }

        return {
            name: (nameMatch && nameMatch[1] !== 'Error') ? nameMatch[1] : steamId,
            avatarUrl: imgMatch ? imgMatch[1] : 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/512px-Steam_icon_logo.svg.png',
            currentServerIp: serverIpAndPort,
            profileUrl: url
        };
    } catch (e) {
        return { name: steamId, avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/512px-Steam_icon_logo.svg.png', currentServerIp: null, profileUrl: `https://steamcommunity.com/profiles/${steamId}` };
    }
}

async function fetchBattlemetricsPlayers(ip: string, port: number) {
    try {
        const res = await fetch(`https://api.battlemetrics.com/servers?filter[search]=${ip}&filter[game]=unturned`);
        const json = await res.json();
        if (json.data && json.data.length > 0) {
            // BattleMetrics zwraca wyniki wyszukiwania rozmytego. Musimy upewnić się, że to DOKŁADNIE ten serwer!
            const server = json.data.find((s: any) => s.attributes.ip === ip && (s.attributes.port === port || s.attributes.portQuery === port));
            
            if (server) {
                const serverId = server.id;
                const detailsRes = await fetch(`https://api.battlemetrics.com/servers/${serverId}?include=player`);
                const detailsJson = await detailsRes.json();
                if (detailsJson.included) {
                    return detailsJson.included
                        .filter((inc: any) => inc.type === 'player')
                        .map((p: any) => ({ name: p.attributes.name, id: p.id }));
                }
            }
        }
    } catch (e) {
        console.error('BattleMetrics API error:', e);
    }
    return [];
}

const activeTrackers: Map<string, NodeJS.Timeout> = new Map();

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
                .setDescription('Link do profilu Steam lub SteamID gracza')
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
                .setRequired(false))
        .addStringOption(option => 
            option.setName('ip')
                .setDescription('Lub podaj własny adres IP')
                .setRequired(false))
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
                .setDescription('Link do profilu Steam lub SteamID')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('tracked_list')
        .setDescription('Pokaż listę obecnie śledzonych graczy'),
    new SlashCommandBuilder()
        .setName('trackp')
        .setDescription('Pokaż wszystkich graczy online zgrupowanych po serwerach (używa Gamedig & API)'),
    new SlashCommandBuilder()
        .setName('trackconfig')
        .setDescription('Ustaw domyślny kanał dla powiadomień')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('Domyślny kanał')
                .setRequired(true))
];

export async function handleUnturnedInteraction(interaction: ChatInputCommandInteraction) {
    if (interaction.commandName === 'track') {
        const rawInput = interaction.options.getString('steamid', true);
        
        let steamId = rawInput.trim();
        const match64 = rawInput.match(/(7656119[0-9]{10})/);
        if (match64) {
            steamId = match64[0];
        } else {
            const matchId = rawInput.match(/\/id\/([^\/\?]+)/);
            if (matchId) {
                steamId = matchId[1];
            } else {
                const matchProf = rawInput.match(/\/profiles\/([^\/\?]+)/);
                if (matchProf) {
                    steamId = matchProf[1];
                } else if (rawInput.startsWith('http')) {
                    const parts = rawInput.split('/').filter(p => p.length > 0);
                    steamId = parts[parts.length - 1];
                }
            }
        }

        const serverChoice = interaction.options.getString('server');
        const customIp = interaction.options.getString('ip');
        const customPort = interaction.options.getInteger('port') || 27015;
        
        let channelId = interaction.options.getChannel('channel')?.id || unturnedConfig.defaultChannelId || interaction.channelId;
        const channel = interaction.client.channels.cache.get(channelId);

        let targets: { ip: string, port: number, serverId?: string, displayName?: string }[] = [];

        if (customIp) {
            targets.push({ ip: customIp, port: customPort });
        } else if (serverChoice && serverChoice !== 'all' && PREDEFINED_SERVERS[serverChoice]) {
            targets.push(PREDEFINED_SERVERS[serverChoice]);
        } else {
            // 'all' or empty means check all predefined servers
            targets = Object.values(PREDEFINED_SERVERS);
        }

        if (targets.length === 0) {
            return interaction.reply({ content: 'Nie udało się ustalić serwerów do sprawdzenia.', ephemeral: true });
        }

        if (!channel || !(channel instanceof TextChannel)) {
            return interaction.reply({ content: 'Nieprawidłowy kanał.', ephemeral: true });
        }

        const trackingKey = steamId;
        if (activeTrackers.has(trackingKey)) {
            return interaction.reply({ content: `Już śledzę to SteamID (**${steamId}**). Wpisz /untrack by przerwać.`, ephemeral: true });
        }

        const scopeMsg = targets.length > 1 ? 'wszystkich zapisanych serwerach' : `serwerze ${targets[0].displayName || targets[0].ip + ':' + targets[0].port}`;
        await interaction.reply({ content: `Rozpoczęto śledzenie SteamID **${steamId}** na ${scopeMsg}. Powiadomienie zostanie wysłane na kanał <#${channel.id}>.`, ephemeral: true });

        // Funkcja sprawdzająca pojedynczego gracza
        const checkPlayer = async () => {
            let found = false;
            let foundServerName = 'Nieznany Serwer';
            let foundIpPort = '';
            let foundMaxPlayers = 0;
            let foundCurrentPlayers = 0;

            // Sprawdzamy profil Steam jako ominięcie zabezpieczeń (Fallback dla zablokowanego A2S)
            const profile = await fetchSteamProfile(steamId);
            
            // 1. Sprawdzamy gamedig (tradycyjnie)
            for (const target of targets) {
                // 1. Sprawdzamy czy IP na profilu Steam zgadza się z targetem lub ID Serwera (fallback SDR)
                const isOnlineOnSteam = profile.currentServerIp === `${target.ip}:${target.port}` || (target.serverId && profile.currentServerIp === target.serverId);

                if (isOnlineOnSteam) {
                    found = true;
                    foundServerName = target.displayName || 'Unturned Server';
                    foundIpPort = profile.currentServerIp || target.serverId || `${target.ip}:${target.port}`;
                    foundMaxPlayers = 0;
                    foundCurrentPlayers = 0;
                    break;
                }

                try {
                    const state = await GameDig.query({
                        type: 'unturned',
                        host: target.ip,
                        port: target.port,
                        maxRetries: 1,
                        socketTimeout: 2000
                    });

                    // Unturned zwraca czesto nazwe gracza
                    const isOnlineInGamedig = state.players.some((p: any) => 
                        p.name?.includes(steamId) || 
                        (profile.name && profile.name !== steamId && p.name?.includes(profile.name)) ||
                        (p.raw && p.raw.steamid === steamId)
                    );

                    if (isOnlineInGamedig) {
                        found = true;
                        foundServerName = target.displayName || state.name || 'Unturned Server';
                        foundIpPort = profile.currentServerIp || target.serverId || `${target.ip}:${target.port}`;
                        foundMaxPlayers = state.maxplayers;
                        foundCurrentPlayers = state.players.length;
                        break;
                    }
                } catch (error) {
                    // Ignorujemy timeouty
                }

                    // 3. Fallback do BattleMetrics API jeśli GameDig zawiódł lub gracz jest ukryty
                if (!found && target.ip !== '0.0.0.0') {
                    const bmPlayers = await fetchBattlemetricsPlayers(target.ip, target.port);
                    const isOnlineInBM = bmPlayers.some((p: any) => p.name.includes(profile.name) || p.name.includes(steamId));
                    if (isOnlineInBM) {
                        found = true;
                        foundServerName = target.displayName || 'Serwer (Wykryty z BattleMetrics API)';
                        foundIpPort = target.serverId || `${target.ip}:${target.port}`;
                        foundMaxPlayers = 0;
                        foundCurrentPlayers = bmPlayers.length;
                        break;
                    }
                }
            }

            // Jeśli profil Steam mówi, że gra gdzie indziej (a nie było tego w targets, ale to nasza siec lub po prostu go znalezlismy)
            if (!found && profile.currentServerIp) {
                 found = true;
                 foundServerName = 'Serwer (Wykryty z Profilu Steam)';
                 foundIpPort = profile.currentServerIp;
                 foundMaxPlayers = 0;
                 foundCurrentPlayers = 0;
            }

            if (found) {
                const embed = new EmbedBuilder()
                    .setTitle('🚨 ALARM ŚLEDZENIA 🚨')
                    .setDescription(`Gracz **[${profile.name}](${profile.profileUrl})** został wykryty w grze!`)
                    .setThumbnail(profile.avatarUrl)
                    .setColor('#ff0000')
                    .addFields(
                        { name: 'Serwer', value: `\`${foundServerName}\``, inline: true },
                        { name: 'Szybkie Dołączenie', value: foundIpPort.match(/^\d+$/) ? `Kliknij w link:\nhttps://join.unbeaten.gg/${foundIpPort}` : `Wklej w przeglądarkę (lub Win+R):\n\`steam://run/304930//+connect%20${foundIpPort}\``, inline: false }
                    )
                    .setTimestamp();
                    
                if (foundMaxPlayers > 0) {
                     embed.addFields({ name: 'Graczy', value: `\`${foundCurrentPlayers} / ${foundMaxPlayers}\``, inline: true });
                }

                // Discord całkowicie blokuje klikalne linki steam:// (zarówno w Markdown jak i przyciskach)
                // Używamy naszej produkcyjnej domeny Vercel jako przekierowania!
                const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
                const row = new ActionRowBuilder().addComponents(
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
                
                clearInterval(intervalId);
                activeTrackers.delete(trackingKey);
            }
        };

        const intervalId = setInterval(checkPlayer, 60000); // Sprawdzanie co 60 sekund
        activeTrackers.set(trackingKey, intervalId);
        
        // Zróbmy pierwsze sprawdzenie od razu by nie czekac 60 sekund
        checkPlayer();
    } 
    else if (interaction.commandName === 'untrack') {
        const rawInput = interaction.options.getString('steamid', true);
        let steamId = rawInput.trim();
        const match64 = rawInput.match(/(7656119[0-9]{10})/);
        if (match64) {
            steamId = match64[0];
        } else {
            const matchId = rawInput.match(/\/id\/([^\/\?]+)/);
            if (matchId) {
                steamId = matchId[1];
            } else {
                const matchProf = rawInput.match(/\/profiles\/([^\/\?]+)/);
                if (matchProf) {
                    steamId = matchProf[1];
                } else if (rawInput.startsWith('http')) {
                    const parts = rawInput.split('/').filter(p => p.length > 0);
                    steamId = parts[parts.length - 1];
                }
            }
        }
        
        let found = false;
        for (const [key, intervalId] of activeTrackers.entries()) {
            if (key === steamId) {
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
    else if (interaction.commandName === 'tracked_list') {
        if (activeTrackers.size === 0) {
            return interaction.reply({ content: 'Obecnie nie śledzę żadnych graczy.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const embeds: EmbedBuilder[] = [];
        
        const mainEmbed = new EmbedBuilder()
            .setTitle('📡 Lista Śledzonych Graczy')
            .setColor('#7289da')
            .setDescription(`Obecnie sprawdzam serwery w poszukiwaniu **${activeTrackers.size}** graczy.`);
        embeds.push(mainEmbed);

        // Discord pozwala na maksymalnie 10 embedów w jednej wiadomości
        const trackedIds = Array.from(activeTrackers.keys()).slice(0, 9); 
        
        for (const id of trackedIds) {
            const profile = await fetchSteamProfile(id);
            const playerEmbed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setAuthor({ 
                    name: profile.name, 
                    iconURL: profile.avatarUrl, 
                    url: profile.profileUrl 
                })
                .setDescription(`Identyfikator: \`${id}\``);
            
            embeds.push(playerEmbed);
        }
        
        if (activeTrackers.size > 9) {
            embeds.push(new EmbedBuilder().setColor('#2b2d31').setDescription(`*...i ${activeTrackers.size - 9} innych (limit wyświetlania)*`));
        }

        await interaction.editReply({ embeds });
    }
    else if (interaction.commandName === 'trackconfig') {
        const channel = interaction.options.getChannel('channel', true);
        unturnedConfig.defaultChannelId = channel.id;
        saveConfig(unturnedConfig);

        await interaction.reply({ content: `Domyślny kanał powiadomień dla śledzenia został ustawiony na <#${channel.id}>. Odtąd powiadomienia będą trafiać tam, jeśli nie podasz kanału ręcznie.`, ephemeral: true });
    }
    else if (interaction.commandName === 'trackp') {
        await interaction.deferReply();
        const embeds: EmbedBuilder[] = [];
        let totalPlayers = 0;

        const serverChecks = Object.entries(PREDEFINED_SERVERS).map(async ([serverName, target]) => {
            let playersText = '';
            let serverTitle = `${serverName.toUpperCase()} (${target.ip}:${target.port})`;
            let players: string[] = [];

            try {
                // Najpierw zapytanie A2S przez GameDig
                const state = await GameDig.query({
                    type: 'unturned',
                    host: target.ip,
                    port: target.port,
                    maxRetries: 1,
                    socketTimeout: 2000
                });
                serverTitle = `${state.name || serverName.toUpperCase()} (${state.players.length}/${state.maxplayers})`;
                players = state.players.map((p: any) => p.name || 'Nieznany').filter(n => n.trim() !== '');
            } catch (e) {
                // Ignorujemy błędy i polegamy na BattleMetrics API
            }

            // Fallback do API, jesli A2S nie zwrocilo graczy (np. ukryci)
            if (players.length === 0) {
                const bmPlayers = await fetchBattlemetricsPlayers(target.ip, target.port);
                if (bmPlayers.length > 0) {
                    players = bmPlayers.map((p: any) => p.name);
                    serverTitle += ` [z BattleMetrics API]`;
                }
            }

            if (players.length > 0) {
                playersText = players.join(', ');
                if (playersText.length > 1024) {
                    playersText = playersText.substring(0, 1020) + '...';
                }
                
            } else {
                playersText = 'Brak widocznych graczy lub serwer offline.';
            }

            return { serverTitle, playersText, count: players.length };
        });

        const results = await Promise.all(serverChecks);

        for (const result of results) {
            totalPlayers += result.count;
            const embed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle(result.serverTitle)
                .setDescription(result.playersText);
            embeds.push(embed);
        }

        const mainEmbed = new EmbedBuilder()
            .setTitle('📡 Aktywni Gracze na serwerach Unbeaten')
            .setColor('#7289da')
            .setDescription(`Łącznie widocznych graczy: **${totalPlayers}**`);

        await interaction.editReply({ embeds: [mainEmbed, ...embeds.slice(0, 9)] });
    }
}
