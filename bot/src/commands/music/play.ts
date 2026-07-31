import { ChatInputCommandInteraction, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { useMainPlayer, QueryType } from 'discord-player';
import playdl from 'play-dl';
import { logger } from '../../utils/logger';

export const playCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Odtwórz utwór ze SoundCloud')
        .addStringOption((option) =>
            option
                .setName('query')
                .setDescription('Tytuł lub link (linki YT zostaną przekonwertowane)')
                .setRequired(true),
        ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply();

        let query = interaction.options.getString('query', true);
        const player = useMainPlayer();

        if (!player) {
            await interaction.editReply('❌ Odtwarzacz nie jest załadowany.');
            return;
        }

        const channel = (interaction.member as any).voice?.channel;
        if (!channel) {
            await interaction.editReply('❌ Musisz być na kanale głosowym, aby użyć tej komendy!');
            return;
        }

        // Konwersja YT -> tekst (do przeszukania SC)
        if (query.includes('youtube.com') || query.includes('youtu.be')) {
            try {
                const info = await playdl.video_basic_info(query);
                if (info.video_details?.title) {
                    query = info.video_details.title;
                    await interaction.followUp({
                        content: `🔗 Wykryto link YouTube. Wyszukuję tytuł na SoundCloud: **${query}**...`,
                        flags: MessageFlags.Ephemeral,
                    });
                }
            } catch (e) {
                logger.error(e as Error, 'Błąd podczas pobierania informacji z YouTube:');
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
                searchEngine: QueryType.SOUNDCLOUD_SEARCH,
            });

            await interaction.editReply(`🎵 Dodano do kolejki: **${track.title}**`);
        } catch (e: any) {
            logger.error(e as Error, 'Błąd podczas dodawania do kolejki:');
            await interaction.editReply(`❌ Wystąpił błąd podczas odtwarzania.`);
        }
    },
};
