import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';
import { Command } from '../../types';

export const stopCommand: Command = {
    data: new SlashCommandBuilder().setName('stop').setDescription('Zatrzymuje odtwarzanie i czyści kolejkę'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        if (!interaction.guild) return;

        const queue = useQueue(interaction.guild.id);
        if (!queue || !queue.isPlaying()) {
            await interaction.reply('Aktualnie nic nie jest odtwarzane!');
            return;
        }

        queue.delete();
        await interaction.reply('⏹️ Odtwarzanie zatrzymane, kolejka wyczyszczona.');
    },
};
