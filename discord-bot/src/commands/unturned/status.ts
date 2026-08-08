import { logger } from '../../utils/logger';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types';
import { statusUpdater } from '../../services/StatusUpdater';

export const statusCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Tworzy panel ze statusem serwerów odświeżający się co 1 minutę'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply();

        try {
            const embed = await statusUpdater.generateEmbed();
            const message = await interaction.editReply({ embeds: [embed] });

            await statusUpdater.addPanel(message.channelId, message.id);
        } catch (e) {
            logger.error(e as Error, 'Błąd podczas wykonywania komendy /status:');
            await interaction.editReply('❌ Wystąpił błąd podczas pobierania statusu serwerów.');
        }
    },
};
