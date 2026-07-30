import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';
import { Command } from '../../types';

export const skipCommand: Command = {
    data: new SlashCommandBuilder().setName('skip').setDescription('Pomija aktualnie odtwarzany utwór'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        if (!interaction.guild) return;

        const queue = useQueue(interaction.guild.id);
        if (!queue || !queue.isPlaying()) {
            await interaction.reply('Aktualnie nic nie jest odtwarzane!');
            return;
        }

        queue.node.skip();
        await interaction.reply('⏭️ Pominięto utwór!');
    },
};
