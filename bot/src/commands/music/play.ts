import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember } from 'discord.js';
import { useMainPlayer, QueryType } from 'discord-player';
import { Command } from '../../types';

export const playCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Odtwarza muzykę (z dowolnego źródła)')
        .addStringOption(option => 
            option.setName('query')
                .setDescription('Link lub nazwa utworu')
                .setRequired(true)),
    execute: async (interaction: ChatInputCommandInteraction) => {
        if (!interaction.guild) return;
        
        await interaction.deferReply();
        const player = useMainPlayer();
        if (!player) {
            await interaction.editReply('❌ Błąd wewnętrzny: Odtwarzacz nie jest załadowany.');
            return;
        }

        const voiceChannel = (interaction.member as GuildMember)?.voice.channel;
        if (!voiceChannel) {
            await interaction.editReply('❌ Musisz być na kanale głosowym, aby odtwarzać muzykę!');
            return;
        }

        const queryStr = interaction.options.getString('query', true).trim();

        try {
            const { track } = await player.play(voiceChannel, queryStr, {
                searchEngine: QueryType.AUTO,
                nodeOptions: {
                    metadata: interaction,
                    leaveOnEmpty: true,
                    leaveOnEnd: false,
                    leaveOnStop: true,
                    volume: 50
                }
            });
            await interaction.editReply(`🎵 Dodano do kolejki: **${track.title}**`);
        } catch (error: any) {
            console.error('Błąd odtwarzacza discord-player:', error);
            await interaction.editReply(`❌ Nie udało się odtworzyć tego utworu. Sprawdź, czy link jest poprawny.\nSzczegóły: \`${error.message}\``);
        }
    }
};
