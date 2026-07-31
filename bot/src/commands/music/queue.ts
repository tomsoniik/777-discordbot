import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../../types';
import { useQueue } from 'discord-player';

export const queueCommand: Command = {
    data: new SlashCommandBuilder().setName('queue').setDescription('Wyświetla aktualną kolejkę utworów'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const queue = useQueue(interaction.guildId!);

        if (!queue || !queue.isPlaying()) {
            await interaction.reply({ content: '❌ Obecnie nic nie jest odtwarzane.', flags: 64 });
            return;
        }

        const currentTrack = queue.currentTrack;
        const tracks = queue.tracks.toArray().slice(0, 10);

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle(`Kolejka na serwerze`)
            .setDescription(
                `**Teraz gra:**\n${currentTrack?.title} - ${currentTrack?.author}\n\n**Następne w kolejce:**\n${tracks.length > 0 ? tracks.map((track, i) => `${i + 1}. ${track.title}`).join('\n') : 'Brak'}`,
            )
            .setFooter({ text: `Łącznie utworów: ${queue.tracks.size}` });

        await interaction.reply({ embeds: [embed] });
    },
};
