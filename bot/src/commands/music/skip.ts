import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types';
import { useQueue } from 'discord-player';

export const skipCommand: Command = {
    data: new SlashCommandBuilder().setName('skip').setDescription('Pomija obecnie odtwarzany utwór'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const queue = useQueue(interaction.guildId!);

        if (!queue) {
            await interaction.reply({ content: '❌ Obecnie nic nie jest odtwarzane.', flags: 64 });
            return;
        }

        queue.node.skip();
        await interaction.reply('⏭️ Pominięto utwór.');
    },
};
