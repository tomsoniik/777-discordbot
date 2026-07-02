import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder, ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    VoiceConnection,
    AudioPlayer,
    NoSubscriberBehavior,
    AudioResource
} from '@discordjs/voice';
import play from 'play-dl';

interface ServerQueue {
    textChannel: any;
    voiceChannel: any;
    connection: VoiceConnection | null;
    player: AudioPlayer;
    songs: Song[];
    playing: boolean;
    dashboardMessage?: any;
    volume: number;
    loop: boolean;
    resource?: AudioResource;
}

interface Song {
    title: string;
    url: string;
}

export const queue = new Map<string, ServerQueue>();

export const musicCommands = [
    new SlashCommandBuilder()
        .setName('play')
        .setDescription('Odtwarza muzykę z YouTube')
        .addStringOption(option => 
            option.setName('query')
                .setDescription('Link do YouTube lub nazwa utworu')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Pomija aktualnie odtwarzany utwór'),
    new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Zatrzymuje muzykę i czyści kolejkę'),
    new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Wyświetla aktualną kolejkę utworów')
].map(command => command.toJSON());

export async function handleMusicInteraction(interaction: ChatInputCommandInteraction) {
    const command = interaction.commandName;

    if (command === 'play') {
        await execute(interaction);
    } else if (command === 'skip') {
        await skip(interaction);
    } else if (command === 'stop') {
        await stop(interaction);
    } else if (command === 'queue') {
        await showQueue(interaction);
    }
}

async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;
    
    // We must defer reply because fetching from play-dl might take longer than 3 seconds
    await interaction.deferReply();

    const voiceChannel = (interaction.member as GuildMember)?.voice.channel;
    if (!voiceChannel) {
        await interaction.editReply('Musisz być na kanale głosowym, aby odtwarzać muzykę!');
        return;
    }
    const permissions = voiceChannel.permissionsFor(interaction.client.user!);
    if (!permissions || !permissions.has('Connect') || !permissions.has('Speak')) {
        await interaction.editReply('Potrzebuję uprawnień, aby dołączyć i mówić na twoim kanale głosowym!');
        return;
    }

    const queryStr = interaction.options.get('query')?.value as string;
    if (!queryStr) {
        await interaction.editReply('Podaj link do YouTube lub nazwę utworu!');
        return;
    }

    let song: Song;

    try {
        let query = interaction.options.getString('query', true).trim();
        let songTitle = '';
        let songUrl = '';

        if (query.includes('youtube.com') || query.includes('youtu.be')) {
            try {
                const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(query)}&format=json`);
                if (res.ok) {
                    const data = await res.json() as any;
                    query = data.title; // Przepisujemy link YT na tytuł piosenki, by wyszukać go w SC
                } else {
                    await interaction.editReply('❌ Nie udało się odczytać filmu z podanego linku YouTube. Prawdopodobnie jest to playlista, stream lub prywatny film.');
                    return;
                }
            } catch (err) {
                await interaction.editReply('❌ Wystąpił błąd podczas pobierania tytułu z YouTube.');
                return;
            }
        }

        if (query.startsWith('http') && query.includes('soundcloud.com')) {
            const soInfo = await play.soundcloud(query) as any;
            if (!soInfo || !soInfo.name) {
                await interaction.editReply('❌ Nie udało się odczytać utworu z podanego linku SoundCloud.');
                return;
            }
            songTitle = soInfo.name;
            songUrl = soInfo.url;
        } else {
            const searchResults = await play.search(query, {
                limit: 1,
                source: { soundcloud: 'tracks' }
            });

            if (searchResults.length === 0) {
                await interaction.editReply(`❌ Nie znaleziono utworu dla zapytania: \`${query}\` na SoundCloud.`);
                return;
            }

            songTitle = searchResults[0].name || 'Nieznany tytuł';
            songUrl = searchResults[0].url;
        }

        song = {
            title: songTitle,
            url: songUrl,
        };

    } catch (error: any) {
        console.error('Błąd podczas wyszukiwania:', error);
        await interaction.editReply(`❌ Wystąpił błąd podczas wyszukiwania utworu: \`${error.message || 'Nieznany błąd'}\``);
        return;
    }

    let serverQueue = queue.get(interaction.guild.id);

    if (!serverQueue) {
        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            },
        });

        const queueConstruct: ServerQueue = {
            textChannel: interaction.channel,
            voiceChannel: voiceChannel,
            connection: null,
            player: player,
            songs: [],
            playing: false,
            volume: 100,
            loop: false,
        };

        queue.set(interaction.guild.id, queueConstruct);
        queueConstruct.songs.push(song);

        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator as any,
            });
            queueConstruct.connection = connection;
            connection.subscribe(player);

            player.on(AudioPlayerStatus.Idle, () => {
                if (!queueConstruct.loop) {
                    queueConstruct.songs.shift();
                }
                playSong(interaction.guild!.id, queueConstruct.songs[0]);
            });

            player.on('error', error => {
                console.error('Audio Player Error:', error);
                (queueConstruct.textChannel as any)?.send(`Błąd odtwarzania.`);
                if (!queueConstruct.loop) queueConstruct.songs.shift();
                playSong(interaction.guild!.id, queueConstruct.songs[0]);
            });

            playSong(interaction.guild.id, queueConstruct.songs[0]);
            await interaction.editReply(`Dodano do kolejki i rozpoczęto odtwarzanie: **${song.title}**`);
        } catch (err) {
            console.error(err);
            queue.delete(interaction.guild.id);
            await interaction.editReply('Wystąpił błąd podczas dołączania do kanału!');
        }
    } else {
        serverQueue.songs.push(song);
        await interaction.editReply(`**${song.title}** zostało dodane do kolejki!`);
    }
}

async function playSong(guildId: string, song: Song | undefined) {
    const serverQueue = queue.get(guildId);
    if (!serverQueue) return;

    if (!song) {
        if (serverQueue.connection) {
            serverQueue.connection.destroy();
        }
        queue.delete(guildId);
        return;
    }

    try {
        const stream = await play.stream(song.url);
        const resource = createAudioResource(stream.stream, {
            inputType: stream.type,
            inlineVolume: true
        });
        resource.volume?.setVolume(serverQueue.volume / 100);
        serverQueue.resource = resource;
        serverQueue.player.play(resource);
        await sendMusicDashboard(guildId, song, serverQueue.textChannel);
    } catch (error) {
        console.error(error);
        (serverQueue.textChannel as any)?.send(`Błąd podczas odtwarzania **${song.title}**`);
        serverQueue.songs.shift();
        playSong(guildId, serverQueue.songs[0]);
    }
}

async function skip(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;
    const serverQueue = queue.get(interaction.guild.id);
    if (!interaction.member || !(interaction.member as GuildMember).voice.channel) {
        await interaction.reply({ content: 'Musisz być na kanale głosowym, aby pominąć utwór!', flags: MessageFlags.Ephemeral });
        return;
    }
    if (!serverQueue) {
        await interaction.reply({ content: 'Nie ma nic w kolejce!', flags: MessageFlags.Ephemeral });
        return;
    }
    serverQueue.player.stop();
    await interaction.reply('Pominięto utwór.');
}

async function stop(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;
    const serverQueue = queue.get(interaction.guild.id);
    if (!interaction.member || !(interaction.member as GuildMember).voice.channel) {
        await interaction.reply({ content: 'Musisz być na kanale głosowym, aby zatrzymać muzykę!', flags: MessageFlags.Ephemeral });
        return;
    }
    if (!serverQueue) {
        await interaction.reply({ content: 'Nie ma nic w kolejce!', flags: MessageFlags.Ephemeral });
        return;
    }
    serverQueue.songs = [];
    serverQueue.player.stop();
    await interaction.reply('Zatrzymano odtwarzanie i wyczyszczono kolejkę.');
}

async function showQueue(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;
    const serverQueue = queue.get(interaction.guild.id);
    if (!serverQueue || serverQueue.songs.length === 0) {
        await interaction.reply({ content: 'Kolejka jest pusta!', flags: MessageFlags.Ephemeral });
        return;
    }
    const queueString = serverQueue.songs.map((song, index) => `${index === 0 ? '**Teraz gram:**' : `**${index}.**`} ${song.title}`).join('\n');
    await interaction.reply(`**Kolejka:**\n${queueString}`);
}

async function sendMusicDashboard(guildId: string, song: Song, textChannel: any, interactionToUpdate?: ButtonInteraction) {
    const serverQueue = queue.get(guildId);
    if (!serverQueue) return;

    const embed = new EmbedBuilder()
        .setColor('#FF5500') // SoundCloud Orange
        .setTitle('🎶 Teraz odtwarzane')
        .setDescription(`**${song.title}**\n\n[Link do utworu](${song.url})`)
        .addFields(
            { name: 'Utworów w kolejce', value: `${serverQueue.songs.length - 1}`, inline: true },
            { name: 'Status', value: serverQueue.player.state.status === AudioPlayerStatus.Playing ? '▶️ Odtwarzanie' : '⏸️ Wstrzymano', inline: true },
            { name: 'Głośność', value: `${serverQueue.volume}%`, inline: true },
            { name: 'Pętla (Loop)', value: serverQueue.loop ? '✅ Włączona' : '❌ Wyłączona', inline: true }
        )
        .setFooter({ text: 'Zarządzaj muzyką używając przycisków poniżej' });

    const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder().setCustomId('music_pause_resume').setLabel('Pause / Resume').setStyle(ButtonStyle.Primary).setEmoji('⏯️'),
            new ButtonBuilder().setCustomId('music_skip').setLabel('Skip').setStyle(ButtonStyle.Secondary).setEmoji('⏭️'),
            new ButtonBuilder().setCustomId('music_stop').setLabel('Stop').setStyle(ButtonStyle.Danger).setEmoji('⏹️'),
            new ButtonBuilder().setCustomId('music_queue').setLabel('Queue').setStyle(ButtonStyle.Secondary).setEmoji('📜')
        );

    const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder().setCustomId('music_vol_down').setLabel('Vol -').setStyle(ButtonStyle.Secondary).setEmoji('🔉'),
            new ButtonBuilder().setCustomId('music_vol_up').setLabel('Vol +').setStyle(ButtonStyle.Secondary).setEmoji('🔊'),
            new ButtonBuilder().setCustomId('music_loop').setLabel('Loop').setStyle(serverQueue.loop ? ButtonStyle.Success : ButtonStyle.Secondary).setEmoji('🔄')
        );

    if (interactionToUpdate) {
        await interactionToUpdate.update({ embeds: [embed], components: [row1, row2] });
    } else {
        if (serverQueue.dashboardMessage) {
            try { await serverQueue.dashboardMessage.delete(); } catch(e) {}
        }
        const msg = await textChannel.send({ embeds: [embed], components: [row1, row2] });
        serverQueue.dashboardMessage = msg;
    }
}

export async function handleMusicButtonInteraction(interaction: ButtonInteraction) {
    const guildId = interaction.guildId;
    if (!guildId) return;
    const serverQueue = queue.get(guildId);

    if (!serverQueue) {
        await interaction.reply({ content: 'Obecnie nie jest odtwarzana żadna muzyka!', flags: MessageFlags.Ephemeral });
        return;
    }

    const voiceChannel = (interaction.member as GuildMember)?.voice.channel;
    if (!voiceChannel || voiceChannel.id !== serverQueue.voiceChannel.id) {
        await interaction.reply({ content: 'Musisz być na tym samym kanale głosowym co bot, aby sterować muzyką!', flags: MessageFlags.Ephemeral });
        return;
    }

    if (interaction.customId === 'music_pause_resume') {
        if (serverQueue.player.state.status === AudioPlayerStatus.Playing) {
            serverQueue.player.pause();
        } else {
            serverQueue.player.unpause();
        }
        await sendMusicDashboard(guildId, serverQueue.songs[0], serverQueue.textChannel, interaction);
    } else if (interaction.customId === 'music_skip') {
        serverQueue.player.stop(); // Triggers Idle and plays next song
        await interaction.reply({ content: '⏭️ Pominięto utwór.', flags: MessageFlags.Ephemeral });
    } else if (interaction.customId === 'music_stop') {
        serverQueue.songs = [];
        serverQueue.player.stop();
        await interaction.reply({ content: '⏹️ Zatrzymano odtwarzanie i wyczyszczono kolejkę.', flags: MessageFlags.Ephemeral });
    } else if (interaction.customId === 'music_queue') {
        if (serverQueue.songs.length === 0) {
            await interaction.reply({ content: 'Kolejka jest pusta!', flags: MessageFlags.Ephemeral });
            return;
        }
        const queueString = serverQueue.songs.map((song, index) => `${index === 0 ? '**Teraz gram:**' : `**${index}.**`} ${song.title}`).join('\n');
        await interaction.reply({ content: `**Kolejka:**\n${queueString.substring(0, 1900)}`, flags: MessageFlags.Ephemeral });
    } else if (interaction.customId === 'music_loop') {
        serverQueue.loop = !serverQueue.loop;
        await sendMusicDashboard(guildId, serverQueue.songs[0], serverQueue.textChannel, interaction);
    } else if (interaction.customId === 'music_vol_up') {
        if (serverQueue.volume >= 200) {
            await interaction.reply({ content: 'Głośność jest już na maksymalnym poziomie (200%)!', flags: MessageFlags.Ephemeral });
            return;
        }
        serverQueue.volume += 10;
        serverQueue.resource?.volume?.setVolume(serverQueue.volume / 100);
        await sendMusicDashboard(guildId, serverQueue.songs[0], serverQueue.textChannel, interaction);
    } else if (interaction.customId === 'music_vol_down') {
        if (serverQueue.volume <= 10) {
            await interaction.reply({ content: 'Głośność jest na minimalnym poziomie (10%)!', flags: MessageFlags.Ephemeral });
            return;
        }
        serverQueue.volume -= 10;
        serverQueue.resource?.volume?.setVolume(serverQueue.volume / 100);
        await sendMusicDashboard(guildId, serverQueue.songs[0], serverQueue.textChannel, interaction);
    }
}
