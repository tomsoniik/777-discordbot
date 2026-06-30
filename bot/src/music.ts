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

    const query = interaction.options.get('query')?.value as string;
    if (!query) {
        await interaction.editReply('Podaj link do YouTube lub nazwę utworu!');
        return;
    }

    let song: Song;

    try {
        if (query.startsWith('http') && play.yt_validate(query) === 'video') {
            const videoInfo = await play.video_info(query);
            song = {
                title: videoInfo.video_details.title || 'Nieznany tytuł',
                url: videoInfo.video_details.url,
            };
        } else {
            const searchResults = await play.search(query, {
                limit: 1,
                source: { youtube: 'video' }
            });
            if (searchResults.length === 0) {
                await interaction.editReply('Nie znaleziono wyników!');
                return;
            }
            song = {
                title: searchResults[0].title || 'Nieznany tytuł',
                url: searchResults[0].url,
            };
        }
    } catch (error) {
        console.error(error);
        await interaction.editReply('Wystąpił błąd podczas wyszukiwania utworu.');
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
