"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.playCommand = void 0;
const discord_js_1 = require("discord.js");
const discord_player_1 = require("discord-player");
const play_dl_1 = __importDefault(require("play-dl"));
const logger_1 = require("../../utils/logger");
exports.playCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('play')
        .setDescription('Odtwórz utwór ze SoundCloud')
        .addStringOption((option) => option
        .setName('query')
        .setDescription('Tytuł lub link (linki YT zostaną przekonwertowane)')
        .setRequired(true)),
    execute: async (interaction) => {
        await interaction.deferReply();
        let query = interaction.options.getString('query', true);
        const player = (0, discord_player_1.useMainPlayer)();
        if (!player) {
            await interaction.editReply('❌ Odtwarzacz nie jest załadowany.');
            return;
        }
        const channel = interaction.member.voice?.channel;
        if (!channel) {
            await interaction.editReply('❌ Musisz być na kanale głosowym, aby użyć tej komendy!');
            return;
        }
        // Konwersja YT -> tekst (do przeszukania SC)
        if (query.includes('youtube.com') || query.includes('youtu.be')) {
            try {
                const info = await play_dl_1.default.video_basic_info(query);
                if (info.video_details?.title) {
                    query = info.video_details.title;
                    await interaction.followUp({
                        content: `🔗 Wykryto link YouTube. Wyszukuję tytuł na SoundCloud: **${query}**...`,
                        flags: discord_js_1.MessageFlags.Ephemeral,
                    });
                }
            }
            catch (e) {
                logger_1.logger.error(e, 'Błąd podczas pobierania informacji z YouTube:');
            }
        }
        try {
            const { track } = await player.play(channel, query, {
                nodeOptions: {
                    metadata: {
                        channel: interaction.channel,
                        client: interaction.guild?.members.me,
                        requestedBy: interaction.user,
                    },
                    leaveOnEmpty: true,
                    leaveOnEmptyCooldown: 300000,
                    leaveOnEnd: true,
                    leaveOnEndCooldown: 300000,
                    volume: 50,
                },
                searchEngine: query.match(/^https?:\/\//) ? discord_player_1.QueryType.AUTO : discord_player_1.QueryType.SOUNDCLOUD_SEARCH,
            });
            await interaction.editReply(`🎵 Dodano do kolejki: **${track.title}**`);
        }
        catch (e) {
            logger_1.logger.error(e, 'Błąd podczas dodawania do kolejki:');
            await interaction.editReply(`❌ Wystąpił błąd podczas odtwarzania.`);
        }
    },
};
