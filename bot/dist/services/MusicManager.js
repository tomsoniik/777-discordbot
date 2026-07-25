"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.musicManager = void 0;
const voice_1 = require("@discordjs/voice");
const discord_js_1 = require("discord.js");
const ytdl_core_1 = __importDefault(require("@distube/ytdl-core"));
const YouTubeAgent_1 = require("./YouTubeAgent");
class MusicManager {
    queue = new Map();
    constructor() { }
    getQueue(guildId) {
        return this.queue.get(guildId);
    }
    setQueue(guildId, serverQueue) {
        this.queue.set(guildId, serverQueue);
    }
    deleteQueue(guildId) {
        this.queue.delete(guildId);
    }
    async playSong(guildId, song) {
        const serverQueue = this.getQueue(guildId);
        if (!serverQueue)
            return;
        if (!song) {
            if (serverQueue.connection) {
                serverQueue.connection.destroy();
            }
            this.deleteQueue(guildId);
            return;
        }
        try {
            let streamInput;
            try {
                // Pobież bezpośredni URL strumienia audio z yt-dlp
                streamInput = await (0, YouTubeAgent_1.getYtDlpStreamUrl)(song.url);
            }
            catch (ytDlpErr) {
                console.warn('[MusicManager] Wyjątek yt-dlp, próba użycia ytdl-core fallback:', ytDlpErr);
                const agent = (0, YouTubeAgent_1.getYouTubeAgent)();
                const ytdlOptions = {
                    filter: 'audioonly',
                    quality: 'highestaudio',
                    highWaterMark: 1 << 25,
                    liveBuffer: 40000,
                    dlChunkSize: 0,
                    ...(agent ? { agent } : {})
                };
                const stream = (0, ytdl_core_1.default)(song.url, ytdlOptions);
                stream.on('error', (err) => {
                    console.error('Błąd strumienia ytdl:', err);
                    serverQueue.textChannel?.send(`Błąd strumienia podczas odtwarzania **${song.title}**: \`${err.message || 'Błąd strumienia'}\``);
                    serverQueue.songs.shift();
                    this.playSong(guildId, serverQueue.songs[0]);
                });
                streamInput = stream;
            }
            const resource = (0, voice_1.createAudioResource)(streamInput, {
                inputType: voice_1.StreamType.Arbitrary,
                inlineVolume: true
            });
            resource.volume?.setVolume(serverQueue.volume / 100);
            serverQueue.resource = resource;
            serverQueue.player.play(resource);
            await this.sendMusicDashboard(guildId, song, serverQueue.textChannel);
        }
        catch (error) {
            console.error('Błąd w playSong:', error);
            serverQueue.textChannel?.send(`Błąd podczas odtwarzania **${song.title}**: \`${error.message || 'Nieznany błąd'}\``);
            serverQueue.songs.shift();
            this.playSong(guildId, serverQueue.songs[0]);
        }
    }
    async sendMusicDashboard(guildId, song, textChannel, interactionToUpdate) {
        const serverQueue = this.getQueue(guildId);
        if (!serverQueue)
            return;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor('#FF5500')
            .setTitle('🎶 Teraz odtwarzane')
            .setDescription(`**${song.title}**\n\n[Link do utworu](${song.url})`)
            .addFields({ name: 'Utworów w kolejce', value: `${serverQueue.songs.length - 1}`, inline: true }, { name: 'Status', value: serverQueue.player.state.status === voice_1.AudioPlayerStatus.Playing ? '▶️ Odtwarzanie' : '⏸️ Wstrzymano', inline: true }, { name: 'Głośność', value: `${serverQueue.volume}%`, inline: true }, { name: 'Pętla (Loop)', value: serverQueue.loop ? '✅ Włączona' : '❌ Wyłączona', inline: true })
            .setFooter({ text: 'Zarządzaj muzyką używając przycisków poniżej' });
        const row1 = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder().setCustomId('music_pause_resume').setLabel('Pause / Resume').setStyle(discord_js_1.ButtonStyle.Primary).setEmoji('⏯️'), new discord_js_1.ButtonBuilder().setCustomId('music_skip').setLabel('Skip').setStyle(discord_js_1.ButtonStyle.Secondary).setEmoji('⏭️'), new discord_js_1.ButtonBuilder().setCustomId('music_stop').setLabel('Stop').setStyle(discord_js_1.ButtonStyle.Danger).setEmoji('⏹️'), new discord_js_1.ButtonBuilder().setCustomId('music_queue').setLabel('Queue').setStyle(discord_js_1.ButtonStyle.Secondary).setEmoji('📜'));
        const row2 = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder().setCustomId('music_vol_down').setLabel('Vol -').setStyle(discord_js_1.ButtonStyle.Secondary).setEmoji('🔉'), new discord_js_1.ButtonBuilder().setCustomId('music_vol_up').setLabel('Vol +').setStyle(discord_js_1.ButtonStyle.Secondary).setEmoji('🔊'), new discord_js_1.ButtonBuilder().setCustomId('music_loop').setLabel('Loop').setStyle(serverQueue.loop ? discord_js_1.ButtonStyle.Success : discord_js_1.ButtonStyle.Secondary).setEmoji('🔄'));
        if (interactionToUpdate) {
            await interactionToUpdate.update({ embeds: [embed], components: [row1, row2] });
        }
        else {
            if (serverQueue.dashboardMessage) {
                try {
                    await serverQueue.dashboardMessage.delete();
                }
                catch (e) { }
            }
            const msg = await textChannel.send({ embeds: [embed], components: [row1, row2] });
            serverQueue.dashboardMessage = msg;
        }
    }
}
exports.musicManager = new MusicManager();
