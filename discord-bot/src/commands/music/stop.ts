import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types';
import { useQueue } from 'discord-player';

export const stopCommand: Command = {
    data: new SlashCommandBuilder().setName('stop').setDescription('Zatrzymuje odtwarzanie i czyści kolejkę'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const queue = useQueue(interaction.guildId!);

        if (!queue) {
            await interaction.reply({ content: '❌ Obecnie nic nie jest odtwarzane.', flags: 64 });
            return;
        }

        queue.delete();
        await interaction.reply('⏹️ Odtwarzanie zatrzymane, kolejka wyczyszczona.');
    },
};
