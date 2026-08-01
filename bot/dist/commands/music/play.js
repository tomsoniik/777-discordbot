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
        .setDescription('Odtwórz utwór lub wyszukaj i wybierz z listy')
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
        const isUrl = query.match(/^https?:\/\//);
        if (isUrl) {
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
                    searchEngine: discord_player_1.QueryType.AUTO,
                });
                await interaction.editReply(`🎵 Dodano do kolejki: **${track.title}**`);
            }
            catch (e) {
                logger_1.logger.error(e, 'Błąd podczas dodawania do kolejki:');
                await interaction.editReply(`❌ Wystąpił błąd podczas odtwarzania.`);
            }
            return;
        }
        // Wyszukiwanie dla zapytania tekstowego (nie URL)
        try {
            const searchResult = await player.search(query, {
                searchEngine: discord_player_1.QueryType.SOUNDCLOUD_SEARCH,
                requestedBy: interaction.user
            });
            if (!searchResult || !searchResult.tracks.length) {
                await interaction.editReply('❌ Nie znaleziono wyników dla tego zapytania.');
                return;
            }
            const tracks = searchResult.tracks.slice(0, 5); // Bierzemy top 5 wyników
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(`🔎 Wyniki wyszukiwania dla: ${query}`)
                .setColor('#0099ff')
                .setDescription(tracks.map((t, i) => `**${i + 1}.** [${t.title}](${t.url}) - ${t.author} (\`${t.duration}\`)`).join('\n'));
            if (tracks[0].thumbnail) {
                embed.setThumbnail(tracks[0].thumbnail);
            }
            const options = tracks.map((t, i) => {
                return new discord_js_1.StringSelectMenuOptionBuilder()
                    .setLabel(`${i + 1}. ${t.title.slice(0, 50)}`)
                    .setDescription(`Autor: ${t.author.slice(0, 50)} | Czas: ${t.duration}`)
                    .setValue(i.toString());
            });
            const selectMenu = new discord_js_1.StringSelectMenuBuilder()
                .setCustomId('select_track')
                .setPlaceholder('Wybierz utwór do odtworzenia...')
                .addOptions(options);
            const cancelButton = new discord_js_1.ButtonBuilder()
                .setCustomId('cancel_search')
                .setLabel('Anuluj')
                .setStyle(discord_js_1.ButtonStyle.Danger);
            const row1 = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
            const row2 = new discord_js_1.ActionRowBuilder().addComponents(cancelButton);
            const message = await interaction.editReply({
                embeds: [embed],
                components: [row1, row2]
            });
            const collector = message.createMessageComponentCollector({
                time: 60000,
                filter: i => i.user.id === interaction.user.id
            });
            collector.on('collect', async (i) => {
                await i.deferUpdate();
                if (i.isButton() && i.customId === 'cancel_search') {
                    await interaction.editReply({
                        content: '❌ Wyszukiwanie anulowane.',
                        embeds: [],
                        components: []
                    });
                    collector.stop('cancelled');
                    return;
                }
                if (i.isStringSelectMenu() && i.customId === 'select_track') {
                    const selectedTrackIndex = parseInt(i.values[0]);
                    const selectedTrack = tracks[selectedTrackIndex];
                    try {
                        await player.play(channel, selectedTrack, {
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
                            }
                        });
                        await interaction.editReply({
                            content: `🎵 Dodano do kolejki: **${selectedTrack.title}**`,
                            embeds: [],
                            components: []
                        });
                    }
                    catch (error) {
                        logger_1.logger.error(error, 'Błąd podczas dodawania do kolejki z wyszukiwania:');
                        await interaction.editReply({ content: `❌ Wystąpił błąd podczas odtwarzania.`, embeds: [], components: [] });
                    }
                    collector.stop('selected');
                }
            });
            collector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    // Usuwamy menu wyboru po upływie czasu
                    await interaction.editReply({
                        content: '⏳ Czas na wybór minął.',
                        embeds: [],
                        components: []
                    }).catch(() => null); // ignorujemy błąd jeśli wiadomość została np. usunięta
                }
            });
        }
        catch (e) {
            logger_1.logger.error(e, 'Błąd podczas wyszukiwania:');
            await interaction.editReply(`❌ Wystąpił błąd podczas wyszukiwania.`);
        }
    },
};
