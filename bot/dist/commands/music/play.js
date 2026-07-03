"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.playCommand = void 0;
const discord_js_1 = require("discord.js");
const voice_1 = require("@discordjs/voice");
const MusicManager_1 = require("../../services/MusicManager");
const play_dl_1 = __importDefault(require("play-dl"));
exports.playCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('play')
        .setDescription('Odtwarza muzykę z YouTube')
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
        let query = queryStr;
        let songTitle = '';
        let songUrl = '';
        try {
            if (query.includes('youtube.com') || query.includes('youtu.be')) {
                try {
                    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(query)}&format=json`);
                    if (res.ok) {
                        const data = await res.json();
                        query = data.title;
                    }
                    else {
                        await interaction.editReply('❌ Nie udało się odczytać filmu z podanego linku YouTube. Prawdopodobnie jest to playlista, stream lub prywatny film.');
                        return;
                    }
                }
                catch (err) {
                    await interaction.editReply('❌ Wystąpił błąd podczas pobierania tytułu z YouTube.');
                    return;
                }
            }
            if (query.startsWith('http') && query.includes('soundcloud.com')) {
                const soInfo = await play_dl_1.default.soundcloud(query);
                if (!soInfo || !soInfo.name) {
                    await interaction.editReply('❌ Nie udało się odczytać utworu z podanego linku SoundCloud.');
                    return;
                }
                songTitle = soInfo.name;
                songUrl = soInfo.url;
            }
            else {
                const searchResults = await play_dl_1.default.search(query, {
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
        }
        catch (error) {
            console.error('Błąd podczas wyszukiwania:', error);
            await interaction.editReply(`❌ Wystąpił błąd podczas wyszukiwania utworu: \`${error.message || 'Nieznany błąd'}\``);
            return;
        }
        const song = { title: songTitle, url: songUrl };
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
                player.on('error', error => {
                    console.error('Audio Player Error:', error);
                    queueConstruct.textChannel?.send(`Błąd odtwarzania.`);
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
