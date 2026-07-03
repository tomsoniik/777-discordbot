import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { musicManager } from '../../services/MusicManager';

export const stopCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Zatrzymuje muzykę i czyści kolejkę'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        if (!interaction.guild) return;
        const serverQueue = musicManager.getQueue(interaction.guild.id);
        if (!interaction.member || !(interaction.member as GuildMember).voice.channel) {
            await interaction.reply({ content: 'Musisz być na kanale głosowym, aby zatrzymać muzykę!', flags: MessageFlags.Ephemeral });
            return;
        }
        if (!serverQueue) {
            await interaction.reply({ content: 'Nie ma nic w kolejce!', flags: MessageFlags.Ephemeral });
            return;
        }
        serverQueue.songs = [];
        serverQueue.player.stop();
        await interaction.reply('Zatrzymano odtwarzanie i wyczyszczono kolejkę.');
    }
};
