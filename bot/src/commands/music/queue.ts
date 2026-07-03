import { ChatInputCommandInteraction, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { musicManager } from '../../services/MusicManager';

export const queueCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Wyświetla aktualną kolejkę utworów'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        if (!interaction.guild) return;
        const serverQueue = musicManager.getQueue(interaction.guild.id);
        if (!serverQueue || serverQueue.songs.length === 0) {
            await interaction.reply({ content: 'Kolejka jest pusta!', flags: MessageFlags.Ephemeral });
            return;
        }
        const queueString = serverQueue.songs.map((song, index) => `${index === 0 ? '**Teraz gram:**' : `**${index}.**`} ${song.title}`).join('\n');
        await interaction.reply(`**Kolejka:**\n${queueString}`);
    }
};
