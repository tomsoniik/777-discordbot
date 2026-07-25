import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember } from 'discord.js';
import { createAudioPlayer, NoSubscriberBehavior, joinVoiceChannel, AudioPlayerStatus } from '@discordjs/voice';
import { Command } from '../../types';
import { musicManager, ServerQueue, Song } from '../../services/MusicManager';
import ytSearch from 'yt-search';
import { getYouTubeAgent, getYtDlpInfo } from '../../services/YouTubeAgent';

export const playCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Odtwarza muzykę bezpośrednio z YouTube')
        .addStringOption(option => 
            option.setName('query')
                .setDescription('Link do YouTube lub nazwa utworu')
                .setRequired(true)),
    execute: async (interaction: ChatInputCommandInteraction) => {
        if (!interaction.guild) return;
        
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

        const queryStr = interaction.options.getString('query', true).trim();
        let songTitle = '';
        let songUrl = '';
        let songStreamUrl: string | undefined = undefined;

        try {
            // Pierwszeństwo ma yt-dlp - całkowicie odporne na błąd HTTP 429 i 403 z ytdl-core
            const info = await getYtDlpInfo(queryStr);
            songTitle = info.title;
            songUrl = info.url;
            songStreamUrl = info.streamUrl;
        } catch (error: any) {
            console.warn('[PlayCommand] Błąd getYtDlpInfo, próba awaryjna ytSearch:', error);
            try {
                const searchResult = await ytSearch(queryStr);
                const video = searchResult.videos[0];
                if (!video) {
                    await interaction.editReply(`❌ Nie znaleziono utworu dla zapytania: \`${queryStr}\` na YouTube.`);
                    return;
                }
                songTitle = video.title;
                songUrl = video.url;
            } catch (err2: any) {
                console.error('Błąd podczas wyszukiwania w YouTube:', err2);
                await interaction.editReply(`❌ Wystąpił błąd podczas pobierania utworu z YouTube: \`${err2.message || error.message || 'Błąd połączenia'}\``);
                return;
            }
        }

        const song: Song = { title: songTitle, url: songUrl, streamUrl: songStreamUrl };
        let serverQueue = musicManager.getQueue(interaction.guild.id);

        if (!serverQueue) {
            const player = createAudioPlayer({
                behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
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

            musicManager.setQueue(interaction.guild.id, queueConstruct);
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
                    if (!queueConstruct.loop) queueConstruct.songs.shift();
                    musicManager.playSong(interaction.guild!.id, queueConstruct.songs[0]);
                });

                player.on('error', error => {
                    console.error('Audio Player Error:', error);
                    (queueConstruct.textChannel as any)?.send(`Błąd odtwarzania.`);
                    if (!queueConstruct.loop) queueConstruct.songs.shift();
                    musicManager.playSong(interaction.guild!.id, queueConstruct.songs[0]);
                });

                musicManager.playSong(interaction.guild.id, queueConstruct.songs[0]);
                await interaction.editReply(`Dodano do kolejki i rozpoczęto odtwarzanie: **${song.title}**`);
            } catch (err) {
                console.error(err);
                musicManager.deleteQueue(interaction.guild.id);
                await interaction.editReply('Wystąpił błąd podczas dołączania do kanału!');
            }
        } else {
            serverQueue.songs.push(song);
            await interaction.editReply(`**${song.title}** zostało dodane do kolejki!`);
        }
    }
};
