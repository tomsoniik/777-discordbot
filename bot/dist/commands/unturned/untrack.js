"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.untrackCommand = void 0;
const discord_js_1 = require("discord.js");
const db_1 = require("../../utils/db");
const steam_1 = require("../../utils/steam");
exports.untrackCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('untrack')
        .setDescription('Zatrzymaj śledzenie gracza')
        .addStringOption(option => option.setName('steamid')
        .setDescription('Link do profilu Steam, vanity URL lub SteamID64')
        .setRequired(true)),
    execute: async (interaction) => {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const rawInput = interaction.options.getString('steamid', true);
        const steamId = await (0, steam_1.resolveSteamId)(rawInput) || rawInput;
        const updated = await db_1.prisma.trackedPlayer.updateMany({
            where: { steamId, isActive: true },
            data: { isActive: false }
        });
        if (updated.count > 0) {
            await interaction.editReply(`Zatrzymano śledzenie SteamID **${steamId}** w bazie danych.`);
        }
        else {
            await interaction.editReply(`SteamID **${steamId}** nie jest obecnie śledzony.`);
        }
    }
};
