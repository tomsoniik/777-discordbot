import { ChatInputCommandInteraction, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { prisma } from '../../utils/db';

export const trackconfigCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('trackconfig')
        .setDescription('Ustaw domyślny kanał dla powiadomień')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('Domyślny kanał')
                .setRequired(true)),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const channel = interaction.options.getChannel('channel', true);
        await prisma.botSettings.upsert({
            where: { id: 1 },
            update: { defaultChannelId: channel.id },
            create: { id: 1, defaultChannelId: channel.id }
        });
        await interaction.reply({ content: `Domyślny kanał powiadomień ustawiony na <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
    }
};
