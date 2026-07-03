import { ChatInputCommandInteraction, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { prisma } from '../../utils/db';
import { resolveSteamId } from '../../utils/steam';

export const untrackCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('untrack')
        .setDescription('Zatrzymaj śledzenie gracza')
        .addStringOption(option => 
            option.setName('steamid')
                .setDescription('Link do profilu Steam, vanity URL lub SteamID64')
                .setRequired(true)),
    execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
        const rawInput = interaction.options.getString('steamid', true);
        const steamId = await resolveSteamId(rawInput) || rawInput; 
        
        const updated = await prisma.trackedPlayer.updateMany({
            where: { steamId, isActive: true },
            data: { isActive: false }
        });

        if (updated.count > 0) {
            await interaction.editReply(`Zatrzymano śledzenie SteamID **${steamId}** w bazie danych.`);
        } else {
            await interaction.editReply(`SteamID **${steamId}** nie jest obecnie śledzony.`);
        }
    }
};
