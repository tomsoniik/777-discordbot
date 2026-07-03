"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackconfigCommand = void 0;
const discord_js_1 = require("discord.js");
const db_1 = require("../../utils/db");
exports.trackconfigCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('trackconfig')
        .setDescription('Ustaw domyślny kanał dla powiadomień')
        .addChannelOption(option => option.setName('channel')
        .setDescription('Domyślny kanał')
        .setRequired(true)),
    execute: async (interaction) => {
        const channel = interaction.options.getChannel('channel', true);
        await db_1.prisma.botSettings.upsert({
            where: { id: 1 },
            update: { defaultChannelId: channel.id },
            create: { id: 1, defaultChannelId: channel.id }
        });
        await interaction.reply({ content: `Domyślny kanał powiadomień ustawiony na <#${channel.id}>.`, flags: discord_js_1.MessageFlags.Ephemeral });
    }
};
