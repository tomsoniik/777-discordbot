"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playCommand = void 0;
const discord_js_1 = require("discord.js");
const voice_1 = require("@discordjs/voice");
const MusicManager_1 = require("../../services/MusicManager");
const YouTubeAgent_1 = require("../../services/YouTubeAgent");
exports.playCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('play')
        .setDescription('Odtwarza muzykę bezpośrednio z YouTube')
        .addStringOption(option => option.setName('query')
        .setDescription('Link do YouTube lub nazwa utworu')
        .setRequired(true)),
    execute: async (interaction) => {
        if (!interaction.guild)
            return;
        await interaction.deferReply();
        const voiceChannel = interaction.member?.voice.channel;
        if (!voiceChannel) {
            await interaction.editReply('Musisz być na kanale głosowym, aby odtwarzać muzykę!');
            return;
        }
        const permissions = voiceChannel.permissionsFor(interaction.client.user);
        if (!permissions || !permissions.has('Connect') || !permissions.has('Speak')) {
            await interaction.editReply('Potrzebuję uprawnień, aby dołączyć i mówić na twoim kanale głosowym!');
            return;
        }
        const queryStr = interaction.options.getString('query', true).trim();
        let songTitle = '';
        let songUrl = '';
        let songStreamUrl = undefined;
        try {
            const info = await (0, YouTubeAgent_1.getYouTubeInfo)(queryStr);
            songTitle = info.title;
            songUrl = info.url;
            songStreamUrl = info.streamUrl;
        }
        catch (error) {
            console.error('Błąd podczas wyszukiwania w YouTube:', error);
            await interaction.editReply(`❌ Wystąpił błąd podczas pobierania utworu z YouTube: \`${error.message || 'Błąd połączenia'}\``);
            return;
        }
        const song = { title: songTitle, url: songUrl, streamUrl: songStreamUrl };
        let serverQueue = MusicManager_1.musicManager.getQueue(interaction.guild.id);
        if (!serverQueue) {
            const player = (0, voice_1.createAudioPlayer)({
                behaviors: { noSubscriber: voice_1.NoSubscriberBehavior.Pause },
            });
            const queueConstruct = {
                textChannel: interaction.channel,
                voiceChannel: voiceChannel,
                connection: null,
                player: player,
                songs: [],
                playing: false,
                volume: 100,
                loop: false,
            };
            MusicManager_1.musicManager.setQueue(interaction.guild.id, queueConstruct);
            queueConstruct.songs.push(song);
            try {
                const connection = (0, voice_1.joinVoiceChannel)({
                    channelId: voiceChannel.id,
                    guildId: interaction.guild.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                });
                queueConstruct.connection = connection;
                connection.subscribe(player);
                player.on(voice_1.AudioPlayerStatus.Idle, () => {
                    if (!queueConstruct.loop)
                        queueConstruct.songs.shift();
                    MusicManager_1.musicManager.playSong(interaction.guild.id, queueConstruct.songs[0]);
                });
                player.on('error', (error) => {
                    console.error('Audio Player Error:', error);
                    const msg = error.message || String(error);
                    queueConstruct.textChannel?.send(`Błąd odtwarzania utworu. Szczegóły: \`${msg}\``);
                    if (!queueConstruct.loop)
                        queueConstruct.songs.shift();
                    MusicManager_1.musicManager.playSong(interaction.guild.id, queueConstruct.songs[0]);
                });
                MusicManager_1.musicManager.playSong(interaction.guild.id, queueConstruct.songs[0]);
                await interaction.editReply(`Dodano do kolejki i rozpoczęto odtwarzanie: **${song.title}**`);
            }
            catch (err) {
                console.error(err);
                MusicManager_1.musicManager.deleteQueue(interaction.guild.id);
                await interaction.editReply('Wystąpił błąd podczas dołączania do kanału!');
            }
        }
        else {
            serverQueue.songs.push(song);
            await interaction.editReply(`**${song.title}** zostało dodane do kolejki!`);
        }
    }
};
