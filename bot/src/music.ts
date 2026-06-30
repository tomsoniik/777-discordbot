import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from 'discord.js';
import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    VoiceConnection,
    AudioPlayer,
    NoSubscriberBehavior
} from '@discordjs/voice';
import play from 'play-dl';

interface ServerQueue {
    textChannel: any;
    voiceChannel: any;
    connection: VoiceConnection | null;
    player: AudioPlayer;
    songs: Song[];
    playing: boolean;
}

interface Song {
    title: string;
    url: string;
}

const queue = new Map<string, ServerQueue>();

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
                queueConstruct.songs.shift();
                playSong(interaction.guild!.id, queueConstruct.songs[0]);
            });

            player.on('error', error => {
                console.error('Audio Player Error:', error);
                (queueConstruct.textChannel as any)?.send(`Błąd odtwarzania.`);
                queueConstruct.songs.shift();
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
            inputType: stream.type
        });
        serverQueue.player.play(resource);
        (serverQueue.textChannel as any)?.send(`Teraz odtwarzane: **${song.title}**`);
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
        await interaction.reply({ content: 'Musisz być na kanale głosowym, aby pominąć utwór!', ephemeral: true });
        return;
    }
    if (!serverQueue) {
        await interaction.reply({ content: 'Nie ma nic w kolejce!', ephemeral: true });
        return;
    }
    serverQueue.player.stop();
    await interaction.reply('Pominięto utwór.');
}

async function stop(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;
    const serverQueue = queue.get(interaction.guild.id);
    if (!interaction.member || !(interaction.member as GuildMember).voice.channel) {
        await interaction.reply({ content: 'Musisz być na kanale głosowym, aby zatrzymać muzykę!', ephemeral: true });
        return;
    }
    if (!serverQueue) {
        await interaction.reply({ content: 'Nie ma nic w kolejce!', ephemeral: true });
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
        await interaction.reply({ content: 'Kolejka jest pusta!', ephemeral: true });
        return;
    }
    const queueString = serverQueue.songs.map((song, index) => `${index === 0 ? '**Teraz gram:**' : `**${index}.**`} ${song.title}`).join('\n');
    await interaction.reply(`**Kolejka:**\n${queueString}`);
}
