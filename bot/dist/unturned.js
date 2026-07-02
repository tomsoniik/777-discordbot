"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unturnedCommands = void 0;
exports.handleUnturnedInteraction = handleUnturnedInteraction;
const discord_js_1 = require("discord.js");
const gamedig_1 = require("gamedig");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const configPath = path_1.default.join(__dirname, '..', 'unturnedConfig.json');
function loadConfig() {
    try {
        if (fs_1.default.existsSync(configPath)) {
            return JSON.parse(fs_1.default.readFileSync(configPath, 'utf-8'));
        }
    }
    catch (e) {
        console.error('Blad ladowania unturnedConfig.json', e);
    }
    return { defaultChannelId: null };
}
function saveConfig(config) {
    fs_1.default.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
let unturnedConfig = loadConfig();
async function fetchSteamProfile(steamId) {
    try {
        const res = await fetch(`https://steamcommunity.com/profiles/${steamId}`);
        const html = await res.text();
        const nameMatch = html.match(/<title>Steam Community :: (.+?)<\/title>/);
        const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
        let serverIpAndPort = null;
        const connectMatch = html.match(/steam:\/\/connect\/([0-9\.]+):([0-9]+)/);
        if (connectMatch) {
            serverIpAndPort = `${connectMatch[1]}:${connectMatch[2]}`;
        }
        return {
            name: nameMatch ? nameMatch[1] : steamId,
            avatarUrl: imgMatch ? imgMatch[1] : 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/512px-Steam_icon_logo.svg.png',
            currentServerIp: serverIpAndPort
        };
    }
    catch (e) {
        return { name: steamId, avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/512px-Steam_icon_logo.svg.png', currentServerIp: null };
    }
}
const activeTrackers = new Map();
const PREDEFINED_SERVERS = {
    'washington': { ip: '94.130.219.164', port: 27116 },
    'arena': { ip: '83.143.81.182', port: 2484 },
    'california': { ip: '39.96.7.81', port: 27015 },
    'germany': { ip: '176.57.173.170', port: 28100 },
    'pei': { ip: '193.169.209.214', port: 20004 },
    'russia': { ip: '43.167.189.221', port: 27015 }
};
exports.unturnedCommands = [
    new discord_js_1.SlashCommandBuilder()
        .setName('track')
        .setDescription('Rozpocznij śledzenie gracza na serwerze Unturned')
        .addStringOption(option => option.setName('steamid')
        .setDescription('Link do profilu Steam lub SteamID gracza')
        .setRequired(true))
        .addStringOption(option => option.setName('server')
        .setDescription('Wybierz gotowy serwer Unbeaten')
        .addChoices({ name: 'Wszystkie serwery (All)', value: 'all' }, { name: 'Washington x100', value: 'washington' }, { name: 'Arena', value: 'arena' }, { name: 'California x100', value: 'california' }, { name: 'Germany x100', value: 'germany' }, { name: 'PEI x100', value: 'pei' }, { name: 'Russia x100', value: 'russia' })
        .setRequired(false))
        .addStringOption(option => option.setName('ip')
        .setDescription('Lub podaj własny adres IP')
        .setRequired(false))
        .addIntegerOption(option => option.setName('port')
        .setDescription('Port serwera (domyślnie 27015)')
        .setRequired(false))
        .addChannelOption(option => option.setName('channel')
        .setDescription('Kanał, na który wysłać powiadomienie')
        .setRequired(false)),
    new discord_js_1.SlashCommandBuilder()
        .setName('untrack')
        .setDescription('Zatrzymaj śledzenie gracza')
        .addStringOption(option => option.setName('steamid')
        .setDescription('Link do profilu Steam lub SteamID')
        .setRequired(true)),
    new discord_js_1.SlashCommandBuilder()
        .setName('tracked_list')
        .setDescription('Pokaż listę obecnie śledzonych graczy'),
    new discord_js_1.SlashCommandBuilder()
        .setName('trackconfig')
        .setDescription('Ustaw domyślny kanał dla powiadomień')
        .addChannelOption(option => option.setName('channel')
        .setDescription('Domyślny kanał')
        .setRequired(true))
];
async function handleUnturnedInteraction(interaction) {
    if (interaction.commandName === 'track') {
        const rawInput = interaction.options.getString('steamid', true);
        // Automatyczne wyciąganie SteamID64 z linku lub zostawienie jak jest
        const match = rawInput.match(/(7656119[0-9]{10})/);
        const steamId = match ? match[0] : rawInput.trim();
        const serverChoice = interaction.options.getString('server');
        const customIp = interaction.options.getString('ip');
        const customPort = interaction.options.getInteger('port') || 27015;
        let channelId = interaction.options.getChannel('channel')?.id || unturnedConfig.defaultChannelId || interaction.channelId;
        const channel = interaction.client.channels.cache.get(channelId);
        let targets = [];
        if (customIp) {
            targets.push({ ip: customIp, port: customPort });
        }
        else if (serverChoice && serverChoice !== 'all' && PREDEFINED_SERVERS[serverChoice]) {
            targets.push(PREDEFINED_SERVERS[serverChoice]);
        }
        else {
            // 'all' or empty means check all predefined servers
            targets = Object.values(PREDEFINED_SERVERS);
        }
        if (targets.length === 0) {
            return interaction.reply({ content: 'Nie udało się ustalić serwerów do sprawdzenia.', ephemeral: true });
        }
        if (!channel || !(channel instanceof discord_js_1.TextChannel)) {
            return interaction.reply({ content: 'Nieprawidłowy kanał.', ephemeral: true });
        }
        const trackingKey = steamId;
        if (activeTrackers.has(trackingKey)) {
            return interaction.reply({ content: `Już śledzę to SteamID (**${steamId}**). Wpisz /untrack by przerwać.`, ephemeral: true });
        }
        const scopeMsg = targets.length > 1 ? 'wszystkich zapisanych serwerach' : `serwerze ${targets[0].ip}:${targets[0].port}`;
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
                try {
                    const state = await gamedig_1.GameDig.query({
                        type: 'unturned',
                        host: target.ip,
                        port: target.port,
                        maxRetries: 1,
                        socketTimeout: 2000
                    });
                    // Unturned zwraca czesto nazwe gracza
                    const isOnlineInGamedig = state.players.some((p) => p.name?.includes(steamId) ||
                        (p.raw && p.raw.steamid === steamId));
                    // 2. Jeśli gamedig zawiódł, sprawdzamy czy IP na profilu Steam zgadza się z targetem
                    const isOnlineOnSteam = profile.currentServerIp === `${target.ip}:${target.port}`;
                    if (isOnlineInGamedig || isOnlineOnSteam) {
                        found = true;
                        foundServerName = state.name || 'Unturned Server';
                        foundIpPort = `${target.ip}:${target.port}`;
                        foundMaxPlayers = state.maxplayers;
                        foundCurrentPlayers = state.players.length;
                        break;
                    }
                }
                catch (error) {
                    // Ignorujemy timeouty
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
                const embed = new discord_js_1.EmbedBuilder()
                    .setTitle('🚨 ALARM ŚLEDZENIA 🚨')
                    .setDescription(`Gracz **[${profile.name}](https://steamcommunity.com/profiles/${steamId})** został wykryty w grze!`)
                    .setThumbnail(profile.avatarUrl)
                    .setColor('#ff0000')
                    .addFields({ name: 'Serwer', value: `\`${foundServerName}\``, inline: true }, { name: 'Szybkie Dołączenie', value: `Ręczny IP: \`steam://connect/${foundIpPort}\``, inline: false })
                    .setTimestamp();
                if (foundMaxPlayers > 0) {
                    embed.addFields({ name: 'Graczy', value: `\`${foundCurrentPlayers} / ${foundMaxPlayers}\``, inline: true });
                }
                // Dodajemy przycisk łączący przez nasz portal webowy (który robi redirect do steam://)
                const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
                const row = new ActionRowBuilder().addComponents(new ButtonBuilder()
                    .setLabel('🚀 Dołącz do gry')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://777-clan.vercel.app/api/join?ip=${foundIpPort}`));
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
        const match = rawInput.match(/(7656119[0-9]{10})/);
        const steamId = match ? match[0] : rawInput.trim();
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
        }
        else {
            await interaction.reply({ content: `SteamID **${steamId}** nie jest obecnie śledzony.`, ephemeral: true });
        }
    }
    else if (interaction.commandName === 'tracked_list') {
        if (activeTrackers.size === 0) {
            return interaction.reply({ content: 'Obecnie nie śledzę żadnych graczy.', ephemeral: true });
        }
        await interaction.deferReply({ ephemeral: true });
        const embeds = [];
        const mainEmbed = new discord_js_1.EmbedBuilder()
            .setTitle('📡 Lista Śledzonych Graczy')
            .setColor('#7289da')
            .setDescription(`Obecnie sprawdzam serwery w poszukiwaniu **${activeTrackers.size}** graczy.`);
        embeds.push(mainEmbed);
        // Discord pozwala na maksymalnie 10 embedów w jednej wiadomości
        const trackedIds = Array.from(activeTrackers.keys()).slice(0, 9);
        for (const id of trackedIds) {
            const profile = await fetchSteamProfile(id);
            const playerEmbed = new discord_js_1.EmbedBuilder()
                .setColor('#2b2d31')
                .setAuthor({
                name: profile.name,
                iconURL: profile.avatarUrl,
                url: `https://steamcommunity.com/profiles/${id}`
            })
                .setDescription(`SteamID: \`${id}\``);
            embeds.push(playerEmbed);
        }
        if (activeTrackers.size > 9) {
            embeds.push(new discord_js_1.EmbedBuilder().setColor('#2b2d31').setDescription(`*...i ${activeTrackers.size - 9} innych (limit wyświetlania)*`));
        }
        await interaction.editReply({ embeds });
    }
    else if (interaction.commandName === 'trackconfig') {
        const channel = interaction.options.getChannel('channel', true);
        unturnedConfig.defaultChannelId = channel.id;
        saveConfig(unturnedConfig);
        await interaction.reply({ content: `Domyślny kanał powiadomień dla śledzenia został ustawiony na <#${channel.id}>. Odtąd powiadomienia będą trafiać tam, jeśli nie podasz kanału ręcznie.`, ephemeral: true });
    }
}
