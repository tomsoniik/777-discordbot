import { VoiceConnection, AudioPlayer, AudioResource, createAudioResource, AudioPlayerStatus, StreamType } from '@discordjs/voice';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, GuildMember } from 'discord.js';
import ytdl from '@distube/ytdl-core';
import { getYouTubeAgent, getYtDlpStreamUrl } from './YouTubeAgent';
import { Readable } from 'stream';

export interface Song {
    title: string;
    url: string;
    streamUrl?: string;
}

export interface ServerQueue {
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

class MusicManager {
    public queue = new Map<string, ServerQueue>();

    constructor() {}

    getQueue(guildId: string): ServerQueue | undefined {
        return this.queue.get(guildId);
    }

    setQueue(guildId: string, serverQueue: ServerQueue) {
        this.queue.set(guildId, serverQueue);
    }

    deleteQueue(guildId: string) {
        this.queue.delete(guildId);
    }

    async playSong(guildId: string, song: Song | undefined) {
        const serverQueue = this.getQueue(guildId);
        if (!serverQueue) return;

        if (!song) {
            if (serverQueue.connection) {
                serverQueue.connection.destroy();
            }
            this.deleteQueue(guildId);
            return;
        }

        try {
            let streamInput: string | Readable;

            if (song.streamUrl && song.streamUrl.startsWith('http')) {
                streamInput = song.streamUrl;
            } else {
                try {
                    // Pobież bezpośredni URL strumienia audio z yt-dlp
                    streamInput = await getYtDlpStreamUrl(song.url);
                } catch (ytDlpErr) {
                    console.warn('[MusicManager] Wyjątek yt-dlp, próba użycia ytdl-core fallback:', ytDlpErr);
                    const agent = getYouTubeAgent();
                    const ytdlOptions: ytdl.downloadOptions = {
                        filter: 'audioonly',
                        quality: 'highestaudio',
                        highWaterMark: 1 << 25,
                        liveBuffer: 40000,
                        dlChunkSize: 0,
                        ...(agent ? { agent } : {})
                    };
                    const stream = ytdl(song.url, ytdlOptions);
                    stream.on('error', (err: any) => {
                        console.error('Błąd strumienia ytdl:', err);
                        (serverQueue.textChannel as any)?.send(`Błąd strumienia podczas odtwarzania **${song.title}**: \`${err.message || 'Błąd strumienia'}\``);
                        serverQueue.songs.shift();
                        this.playSong(guildId, serverQueue.songs[0]);
                    });
                    streamInput = stream;
                }
            }

            const resource = createAudioResource(streamInput, {
                inputType: StreamType.Arbitrary,
                inlineVolume: true
            });
            resource.volume?.setVolume(serverQueue.volume / 100);
            serverQueue.resource = resource;
            serverQueue.player.play(resource);
            await this.sendMusicDashboard(guildId, song, serverQueue.textChannel);
        } catch (error: any) {
            console.error('Błąd w playSong:', error);
            (serverQueue.textChannel as any)?.send(`Błąd podczas odtwarzania **${song.title}**: \`${error.message || 'Nieznany błąd'}\``);
            serverQueue.songs.shift();
            this.playSong(guildId, serverQueue.songs[0]);
        }
    }

    async sendMusicDashboard(guildId: string, song: Song, textChannel: any, interactionToUpdate?: ButtonInteraction) {
        const serverQueue = this.getQueue(guildId);
        if (!serverQueue) return;

        const embed = new EmbedBuilder()
            .setColor('#FF5500')
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
}

export const musicManager = new MusicManager();
