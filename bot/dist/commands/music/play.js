"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playCommand = void 0;
const discord_js_1 = require("discord.js");
const discord_player_1 = require("discord-player");
exports.playCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('play')
        .setDescription('Odtwarza muzykę z YouTube / Spotify / SoundCloud')
        .addStringOption(option => option.setName('query')
        .setDescription('Link lub nazwa utworu')
        .setRequired(true)),
    execute: async (interaction) => {
        if (!interaction.guild)
            return;
        await interaction.deferReply();
        const player = (0, discord_player_1.useMainPlayer)();
        if (!player) {
            await interaction.editReply('Błąd wewnętrzny: Odtwarzacz nie jest załadowany.');
            return;
        }
        const voiceChannel = interaction.member?.voice.channel;
        if (!voiceChannel) {
            await interaction.editReply('❌ Musisz być na kanale głosowym, aby odtwarzać muzykę!');
            return;
        }
        let queryStr = interaction.options.getString('query', true).trim();
        try {
            // Clever workaround for YouTube search bans on datacenters
            if (queryStr.includes('youtube.com') || queryStr.includes('youtu.be')) {
                try {
                    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(queryStr)}&format=json`;
                    const response = await fetch(oembedUrl);
                    if (response.ok) {
                        const data = await response.json();
                        if (data && data.title) {
                            console.log(`YouTube link translated to: ${data.title} - ${data.author_name}`);
                            queryStr = `${data.title} ${data.author_name || ''}`.trim();
                        }
                    }
                }
                catch (e) {
                    console.log('oEmbed fetch failed', e);
                }
            }
            const { track } = await player.play(voiceChannel, queryStr, {
                nodeOptions: {
                    metadata: interaction,
                    leaveOnEmpty: true,
                    leaveOnEnd: false,
                    leaveOnStop: true
                }
            });
            await interaction.editReply(`🎵 Dodano do kolejki: **${track.title}**`);
        }
        catch (error) {
            console.error('Błąd odtwarzacza discord-player:', error);
            await interaction.editReply(`❌ Nie udało się odtworzyć tego utworu. Sprawdź, czy link jest poprawny.\nSzczegóły: \`${error.message}\``);
        }
    }
};
