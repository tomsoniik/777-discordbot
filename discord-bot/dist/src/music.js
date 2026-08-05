"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.musicCommands = void 0;
exports.handleMusicInteraction = handleMusicInteraction;
const discord_js_1 = require("discord.js");
const voice_1 = require("@discordjs/voice");
const play_dl_1 = __importDefault(require("play-dl"));
const queue = new Map();
exports.musicCommands = [
    new discord_js_1.SlashCommandBuilder()
        .setName('play')
        .setDescription('Odtwarza muzykę z YouTube')
        .addStringOption(option => option.setName('query')
        .setDescription('Link do YouTube lub nazwa utworu')
        .setRequired(true)),
    new discord_js_1.SlashCommandBuilder()
        .setName('skip')
        .setDescription('Pomija aktualnie odtwarzany utwór'),
    new discord_js_1.SlashCommandBuilder()
        .setName('stop')
        .setDescription('Zatrzymuje muzykę i czyści kolejkę'),
    new discord_js_1.SlashCommandBuilder()
        .setName('queue')
        .setDescription('Wyświetla aktualną kolejkę utworów')
].map(command => command.toJSON());
async function handleMusicInteraction(interaction) {
    const command = interaction.commandName;
    if (command === 'play') {
        await execute(interaction);
    }
    else if (command === 'skip') {
        await skip(interaction);
    }
    else if (command === 'stop') {
        await stop(interaction);
    }
    else if (command === 'queue') {
        await showQueue(interaction);
    }
}
async function execute(interaction) {
    if (!interaction.guild)
        return;
    // We must defer reply because fetching from play-dl might take longer than 3 seconds
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
    const query = interaction.options.get('query')?.value;
    if (!query) {
        await interaction.editReply('Podaj link do YouTube lub nazwę utworu!');
        return;
    }
    let song;
    try {
        if (query.startsWith('http') && play_dl_1.default.yt_validate(query) === 'video') {
            const videoInfo = await play_dl_1.default.video_info(query);
            song = {
                title: videoInfo.video_details.title || 'Nieznany tytuł',
                url: videoInfo.video_details.url,
            };
        }
        else {
            const searchResults = await play_dl_1.default.search(query, {
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
    }
    catch (error) {
        console.error(error);
        await interaction.editReply('Wystąpił błąd podczas wyszukiwania utworu.');
        return;
    }
    let serverQueue = queue.get(interaction.guild.id);
    if (!serverQueue) {
        const player = (0, voice_1.createAudioPlayer)({
            behaviors: {
                noSubscriber: voice_1.NoSubscriberBehavior.Pause,
            },
        });
        const queueConstruct = {
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
            const connection = (0, voice_1.joinVoiceChannel)({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });
            queueConstruct.connection = connection;
            connection.subscribe(player);
            player.on(voice_1.AudioPlayerStatus.Idle, () => {
                queueConstruct.songs.shift();
                playSong(interaction.guild.id, queueConstruct.songs[0]);
            });
            player.on('error', error => {
                console.error('Audio Player Error:', error);
                queueConstruct.textChannel?.send(`Błąd odtwarzania.`);
                queueConstruct.songs.shift();
                playSong(interaction.guild.id, queueConstruct.songs[0]);
            });
            playSong(interaction.guild.id, queueConstruct.songs[0]);
            await interaction.editReply(`Dodano do kolejki i rozpoczęto odtwarzanie: **${song.title}**`);
        }
        catch (err) {
            console.error(err);
            queue.delete(interaction.guild.id);
            await interaction.editReply('Wystąpił błąd podczas dołączania do kanału!');
        }
    }
    else {
        serverQueue.songs.push(song);
        await interaction.editReply(`**${song.title}** zostało dodane do kolejki!`);
    }
}
async function playSong(guildId, song) {
    const serverQueue = queue.get(guildId);
    if (!serverQueue)
        return;
    if (!song) {
        if (serverQueue.connection) {
            serverQueue.connection.destroy();
        }
        queue.delete(guildId);
        return;
    }
    try {
        const stream = await play_dl_1.default.stream(song.url);
        const resource = (0, voice_1.createAudioResource)(stream.stream, {
            inputType: stream.type
        });
        serverQueue.player.play(resource);
        serverQueue.textChannel?.send(`Teraz odtwarzane: **${song.title}**`);
    }
    catch (error) {
        console.error(error);
        serverQueue.textChannel?.send(`Błąd podczas odtwarzania **${song.title}**`);
        serverQueue.songs.shift();
        playSong(guildId, serverQueue.songs[0]);
    }
}
async function skip(interaction) {
    if (!interaction.guild)
        return;
    const serverQueue = queue.get(interaction.guild.id);
    if (!interaction.member || !interaction.member.voice.channel) {
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
async function stop(interaction) {
    if (!interaction.guild)
        return;
    const serverQueue = queue.get(interaction.guild.id);
    if (!interaction.member || !interaction.member.voice.channel) {
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
async function showQueue(interaction) {
    if (!interaction.guild)
        return;
    const serverQueue = queue.get(interaction.guild.id);
    if (!serverQueue || serverQueue.songs.length === 0) {
        await interaction.reply({ content: 'Kolejka jest pusta!', ephemeral: true });
        return;
    }
    const queueString = serverQueue.songs.map((song, index) => `${index === 0 ? '**Teraz gram:**' : `**${index}.**`} ${song.title}`).join('\n');
    await interaction.reply(`**Kolejka:**\n${queueString}`);
}
