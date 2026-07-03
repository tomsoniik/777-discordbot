"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.musicManager = void 0;
const voice_1 = require("@discordjs/voice");
const discord_js_1 = require("discord.js");
const play_dl_1 = __importDefault(require("play-dl"));
class MusicManager {
    queue = new Map();
    constructor() {
        play_dl_1.default.getFreeClientID().then((clientID) => {
            play_dl_1.default.setToken({
                soundcloud: {
                    client_id: clientID
                }
            });
        }).catch(console.error);
    }
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
            const stream = await play_dl_1.default.stream(song.url);
            const resource = (0, voice_1.createAudioResource)(stream.stream, {
                inputType: stream.type,
                inlineVolume: true
            });
            resource.volume?.setVolume(serverQueue.volume / 100);
            serverQueue.resource = resource;
            serverQueue.player.play(resource);
            await this.sendMusicDashboard(guildId, song, serverQueue.textChannel);
        }
        catch (error) {
            console.error(error);
            serverQueue.textChannel?.send(`Błąd podczas odtwarzania **${song.title}**`);
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
