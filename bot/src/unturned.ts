import { Client, ChatInputCommandInteraction, SlashCommandBuilder, TextChannel, EmbedBuilder } from 'discord.js';
import { GameDig } from 'gamedig';

async function fetchSteamProfile(steamId: string) {
    try {
        const res = await fetch(`https://steamcommunity.com/profiles/${steamId}`);
        const html = await res.text();
        const nameMatch = html.match(/<title>Steam Community :: (.+?)<\/title>/);
        const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
        return {
            name: nameMatch ? nameMatch[1] : steamId,
            avatarUrl: imgMatch ? imgMatch[1] : 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/512px-Steam_icon_logo.svg.png'
        };
    } catch (e) {
        return { name: steamId, avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/512px-Steam_icon_logo.svg.png' };
    }
}

// Maps a player name to the interval ID so we can stop tracking later if needed
const activeTrackers: Map<string, NodeJS.Timeout> = new Map();

const PREDEFINED_SERVERS: Record<string, { ip: string, port: number }> = {
    'washington': { ip: '94.130.219.164', port: 27116 },
    'arena': { ip: '83.143.81.182', port: 2484 },
    'california': { ip: '39.96.7.81', port: 27015 },
    'germany': { ip: '176.57.173.170', port: 28100 },
    'pei': { ip: '193.169.209.214', port: 20004 },
    'russia': { ip: '43.167.189.221', port: 27015 }
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
                    { name: 'Russia x100', value: 'russia' }
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
        .setDescription('Pokaż listę obecnie śledzonych graczy')
];

export async function handleUnturnedInteraction(interaction: ChatInputCommandInteraction) {
    if (interaction.commandName === 'track') {
        const rawInput = interaction.options.getString('steamid', true);
        // Automatyczne wyciąganie SteamID64 z linku lub zostawienie jak jest
        const match = rawInput.match(/(7656119[0-9]{10})/);
        const steamId = match ? match[0] : rawInput.trim();

        const serverChoice = interaction.options.getString('server');
        const customIp = interaction.options.getString('ip');
        const customPort = interaction.options.getInteger('port') || 27015;
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        let targets: { ip: string, port: number }[] = [];

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

        const scopeMsg = targets.length > 1 ? 'wszystkich zapisanych serwerach' : `serwerze ${targets[0].ip}:${targets[0].port}`;
        await interaction.reply({ content: `Rozpoczęto śledzenie SteamID **${steamId}** na ${scopeMsg}. Powiadomienie zostanie wysłane na kanał <#${channel.id}>.`, ephemeral: true });

        const intervalId = setInterval(async () => {
            for (const target of targets) {
                try {
                    const state = await GameDig.query({
                        type: 'unturned',
                        host: target.ip,
                        port: target.port
                    });

                    const isOnline = state.players.some((p: any) => 
                        p.name?.includes(steamId) || 
                        (p.raw && p.raw.steamid === steamId)
                    );

                    if (isOnline) {
                        const profile = await fetchSteamProfile(steamId);
                        const embed = new EmbedBuilder()
                            .setTitle('🚨 ALARM ŚLEDZENIA 🚨')
                            .setDescription(`Gracz **[${profile.name}](https://steamcommunity.com/profiles/${steamId})** został wykryty na serwerze!`)
                            .setThumbnail(profile.avatarUrl)
                            .setColor('#ff0000')
                            .addFields(
                                { name: 'Serwer', value: `\`${state.name}\``, inline: false },
                                { name: 'Adres (IP:Port)', value: `\`${target.ip}:${target.port}\``, inline: true },
                                { name: 'Graczy', value: `\`${state.players.length} / ${state.maxplayers}\``, inline: true }
                            )
                            .setTimestamp();

                        await channel.send({ 
                            content: '@everyone', 
                            embeds: [embed] 
                        });
                        
                        clearInterval(intervalId);
                        activeTrackers.delete(trackingKey);
                        break; // Stop checking other servers since found
                    }
                } catch (error) {
                    console.error(`Błąd odpytywania serwera ${target.ip}:${target.port} dla SteamID ${steamId}:`, error);
                }
            }
        }, 60000); // Sprawdzanie co 60 sekund

        activeTrackers.set(trackingKey, intervalId);
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
                    url: `https://steamcommunity.com/profiles/${id}` 
                })
                .setDescription(`SteamID: \`${id}\``);
            
            embeds.push(playerEmbed);
        }
        
        if (activeTrackers.size > 9) {
            embeds.push(new EmbedBuilder().setColor('#2b2d31').setDescription(`*...i ${activeTrackers.size - 9} innych (limit wyświetlania)*`));
        }

        await interaction.editReply({ embeds });
    }
}
